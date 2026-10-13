// ==============================================================================
// ODA Market - Firebase Cloud Messaging Service Worker
// Handles background web push notifications and lock-screen alerts
// ==============================================================================

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase Web App Configuration for ODA Market
const firebaseConfig = {
  apiKey: "AIzaSyB5HnhscH5dx9kB6Z_QwH-8597KGf1cZHU",
  authDomain: "odamarket-4cfaf.firebaseapp.com",
  projectId: "odamarket-4cfaf",
  storageBucket: "odamarket-4cfaf.firebasestorage.app",
  messagingSenderId: "627708466537",
  appId: "1:627708466537:web:571a54825470b8ce8619f8",
  measurementId: "G-7CMQL53M0R"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle incoming push messages when the app/tab is in the background or closed
  messaging.onBackgroundMessage((payload) => {
    console.log("[FCM-SW] Received background message:", payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || "ODA Market Update";
    const notificationBody = payload.notification?.body || payload.data?.body || payload.data?.message || "You have a new update on ODA Market.";
    
    const targetUrl = payload.data?.url || payload.data?.click_action || (payload.data?.orderId ? `/track-order?orderId=${encodeURIComponent(payload.data.orderId)}` : "/notifications");

    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.icon || payload.data?.icon || "/pwa-192x192.png",
      badge: payload.notification?.badge || payload.data?.badge || "/favicon.png",
      image: payload.notification?.image || payload.data?.image || undefined,
      tag: payload.data?.tag || payload.data?.orderId || `oda-${Date.now()}`,
      renotify: true,
      vibrate: [150, 50, 150],
      data: {
        url: targetUrl,
        orderId: payload.data?.orderId || null,
        type: payload.data?.type || "order_status",
        timestamp: Date.now()
      },
      actions: [
        {
          action: "open",
          title: "View Details"
        },
        {
          action: "dismiss",
          title: "Dismiss"
        }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn("[FCM-SW] Initialization failed:", err);
}

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || "/notifications";

  // Ensure url is absolute or properly formatted relative to root
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = new URL(targetUrl, self.location.origin).href;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing ODA Market window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // 2. Otherwise open a new window with the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Service worker install & activate lifecycle
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
