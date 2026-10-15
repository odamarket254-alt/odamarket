import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

// Official ODA Market Firebase Web Configuration
export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5HnhscH5dx9kB6Z_QwH-8597KGf1cZHU").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "odamarket-4cfaf.firebaseapp.com").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "odamarket-4cfaf").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "odamarket-4cfaf.firebasestorage.app").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "627708466537").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "1:627708466537:web:571a54825470b8ce8619f8").trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7CMQL53M0R").trim()
};

// VAPID Public Key for Web Push (Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates)
export const FIREBASE_VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY || "").trim();

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let messagingSupportedPromise: Promise<boolean> | null = null;

/**
 * Initializes and returns the Firebase app instance (singleton)
 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK should only be initialized in browser environments.");
  }
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

/**
 * Checks whether the current browser environment supports Firebase Cloud Messaging (Web Push)
 */
export async function isFCMSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }
  if (!messagingSupportedPromise) {
    messagingSupportedPromise = isSupported().catch((err) => {
      console.warn("[FCM] isSupported check failed:", err);
      return false;
    });
  }
  return messagingSupportedPromise;
}

/**
 * Initializes and returns the Firebase Messaging instance if supported by the browser
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const supported = await isFCMSupported();
  if (!supported) return null;

  if (!messaging) {
    try {
      const firebaseApp = getFirebaseApp();
      messaging = getMessaging(firebaseApp);
    } catch (err) {
      console.warn("[FCM] Failed to initialize Firebase Messaging:", err);
      return null;
    }
  }
  return messaging;
}

/**
 * Helper to check iOS PWA installation status
 */
export function getPlatformPushCapabilities(): {
  isIOS: boolean;
  isStandalonePWA: boolean;
  isPushSupported: boolean;
  requiresPWAInstallForPush: boolean;
} {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isStandalonePWA: false,
      isPushSupported: false,
      requiresPWAInstallForPush: false
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Standalone mode detection (PWA added to homescreen)
  const isStandalonePWA = 
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://");

  const hasPushAPIs = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  // On iOS Safari, Web Push is ONLY supported in iOS 16.4+ if installed to Home Screen
  const requiresPWAInstallForPush = isIOS && !isStandalonePWA;
  const isPushSupported = hasPushAPIs && (!isIOS || isStandalonePWA);

  return {
    isIOS,
    isStandalonePWA,
    isPushSupported,
    requiresPWAInstallForPush
  };
}
