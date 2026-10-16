import { getToken, deleteToken, onMessage, MessagePayload } from "firebase/messaging";
import { 
  getFirebaseMessaging, 
  isFCMSupported, 
  getPlatformPushCapabilities, 
  FIREBASE_VAPID_KEY 
} from "../lib/firebase";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export interface PushNotificationPreferences {
  orders: boolean;
  promotions: boolean;
  price_drops: boolean;
  security: boolean;
}

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  orders: true,
  promotions: false,
  price_drops: false,
  security: true
};

export interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isIOS: boolean;
  isStandalonePWA: boolean;
  requiresPWAInstall: boolean;
  currentToken: string | null;
  isEnabled: boolean;
}

const LOCAL_STORAGE_FCM_TOKEN = "oda_fcm_token";
const LOCAL_STORAGE_PUSH_PREFS = "oda_push_preferences";

/**
 * Retrieves the current push notification status for this device
 */
export async function getPushNotificationStatus(): Promise<PushNotificationStatus> {
  const supported = await isFCMSupported();
  const platform = getPlatformPushCapabilities();
  const permission: NotificationPermission = 
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied";

  const currentToken = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_FCM_TOKEN) : null;
  const isEnabled = permission === "granted" && Boolean(currentToken);

  return {
    isSupported: supported,
    permission,
    isIOS: platform.isIOS,
    isStandalonePWA: platform.isStandalonePWA,
    requiresPWAInstall: platform.requiresPWAInstallForPush,
    currentToken,
    isEnabled
  };
}

/**
 * Retrieves stored user push preferences from localStorage or database
 */
export function getStoredPushPreferences(): PushNotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PUSH_PREFERENCES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PUSH_PREFS);
    if (raw) {
      return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    // Ignore parse error
  }
  return DEFAULT_PUSH_PREFERENCES;
}

/**
 * Registers the device token with the server and Supabase
 */
async function registerDeviceTokenWithServer(token: string, preferences: PushNotificationPreferences) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || "";

    const platformInfo = getPlatformPushCapabilities();
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";

    const payload = {
      token,
      preferences,
      device_type: /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop",
      platform: platformInfo.isIOS ? "ios" : /android/i.test(userAgent) ? "android" : "web",
      browser: /chrome/i.test(userAgent) && !/edg/i.test(userAgent) ? "chrome" : /safari/i.test(userAgent) && !/chrome/i.test(userAgent) ? "safari" : /firefox/i.test(userAgent) ? "firefox" : /edg/i.test(userAgent) ? "edge" : "browser",
      is_pwa: platformInfo.isStandalonePWA,
      user_agent: userAgent
    };

    const res = await fetch("/api/notifications/register-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("[FCM] Server registration returned non-200:", errData);
    } else {
      console.log("[FCM] Device token registered with server successfully.");
    }
  } catch (err) {
    console.warn("[FCM] Failed to register device token with backend:", err);
  }
}

/**
 * Explicitly requests notification permission from the user, retrieves the FCM registration token,
 * registers with the backend server, and persists locally.
 */
export async function subscribeToPushNotifications(
  customPreferences?: Partial<PushNotificationPreferences>
): Promise<{ success: boolean; token?: string; error?: string; requiresPWA?: boolean }> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { success: false, error: "Web push notifications are not supported on this browser." };
    }

    const platform = getPlatformPushCapabilities();
    if (platform.requiresPWAInstallForPush) {
      return { 
        success: false, 
        requiresPWA: true,
        error: "On iPhone/iPad, push notifications require installing ODA Market to your Home Screen first. Tap the Share button in Safari and select 'Add to Home Screen'."
      };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { success: false, error: "Firebase Cloud Messaging is not available on this browser." };
    }

    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { 
        success: false, 
        error: permission === "denied" 
          ? "Notification permission was blocked in your browser. Please click the site settings / lock icon in your browser address bar to allow notifications." 
          : "Notification permission was dismissed." 
      };
    }

    // 2. Ensure service worker is registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        // Register or retrieve the FCM service worker
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn("[FCM] Service worker registration warning:", swErr);
      }
    }

    // 3. Retrieve FCM registration token
    const tokenOptions: any = {};
    if (FIREBASE_VAPID_KEY) {
      tokenOptions.vapidKey = FIREBASE_VAPID_KEY;
    }
    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }

    const token = await getToken(messaging, tokenOptions);
    if (!token) {
      return { success: false, error: "Failed to generate FCM registration token. Please check your network connection." };
    }

    // 4. Save locally
    localStorage.setItem(LOCAL_STORAGE_FCM_TOKEN, token);
    const preferences: PushNotificationPreferences = {
      ...getStoredPushPreferences(),
      ...(customPreferences || {})
    };
    localStorage.setItem(LOCAL_STORAGE_PUSH_PREFS, JSON.stringify(preferences));

    // 5. Associate token with authenticated Supabase user and server
    await registerDeviceTokenWithServer(token, preferences);

    return { success: true, token };
  } catch (err: any) {
    console.error("[FCM] Error subscribing to push notifications:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while enabling push notifications." };
  }
}

/**
 * Unsubscribes from push notifications, deletes token from Firebase and backend
 */
export async function unsubscribeFromPushNotifications(): Promise<{ success: boolean; error?: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_FCM_TOKEN) : null;
    const messaging = await getFirebaseMessaging();

    if (token) {
      // 1. Inform server to remove token
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || "";
        await fetch("/api/notifications/unregister-device", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({ token })
        });
      } catch (e) {
        console.warn("[FCM] Server unregister notice:", e);
      }

      // 2. Delete token from Firebase SDK
      if (messaging) {
        try {
          await deleteToken(messaging);
        } catch (e) {
          console.warn("[FCM] Firebase deleteToken warning:", e);
        }
      }

      localStorage.removeItem(LOCAL_STORAGE_FCM_TOKEN);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[FCM] Error unsubscribing:", err);
    return { success: false, error: err?.message || "Failed to disable notifications." };
  }
}

/**
 * Updates push notification category preferences on server and localStorage
 */
export async function updatePushPreferences(
  newPreferences: Partial<PushNotificationPreferences>
): Promise<{ success: boolean; preferences: PushNotificationPreferences }> {
  const current = getStoredPushPreferences();
  const updated = { ...current, ...newPreferences };
  
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_PUSH_PREFS, JSON.stringify(updated));
  }

  const token = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_FCM_TOKEN) : null;
  if (token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || "";
      await fetch("/api/notifications/update-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ token, preferences: updated })
      });
    } catch (e) {
      console.warn("[FCM] Failed to update server preferences:", e);
    }
  }

  return { success: true, preferences: updated };
}

/**
 * Triggers a test push notification to this device via server
 */
export async function sendTestPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_FCM_TOKEN) : null;
    if (!token) {
      return { success: false, message: "Please enable push notifications on this device first." };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || "";

    const res = await fetch("/api/notifications/test-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.error || "Failed to send test push notification." };
    }

    return { success: true, message: data.message || "Test notification dispatched! Check your screen/banner." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error sending test notification." };
  }
}

/**
 * Sets up foreground messaging listener when the user has the website open
 */
export function setupForegroundMessageListener(
  navigateCallback?: (url: string) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;

    try {
      unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
        console.log("[FCM] Foreground message received:", payload);

        const title = payload.notification?.title || payload.data?.title || "ODA Market Alert";
        const body = payload.notification?.body || payload.data?.body || payload.data?.message || "";
        const targetUrl = payload.data?.url || payload.data?.click_action || (payload.data?.orderId ? `/track-order?orderId=${encodeURIComponent(payload.data.orderId)}` : "/notifications");

        // Display interactive Sonner toast
        toast.info(title, {
          description: body,
          duration: 7000,
          action: {
            label: "View",
            onClick: () => {
              if (navigateCallback && targetUrl) {
                navigateCallback(targetUrl);
              } else if (typeof window !== "undefined" && targetUrl) {
                window.location.href = targetUrl;
              }
            }
          }
        });
      });
    } catch (err) {
      console.warn("[FCM] Error attaching foreground message listener:", err);
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
