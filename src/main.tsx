import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker for PWA compliance
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log("[PWA] New content available; will update automatically.");
    },
    onOfflineReady() {
      console.log("[PWA] App ready for offline caching of static assets.");
    },
  });
}

// Suppress Supabase refresh token and WebSocket errors globally
const handleAuthError = (event: any) => {
  const errorMsg = String(event?.reason?.message || event?.message || event?.reason || "");
  if (
    errorMsg.includes("WebSocket") ||
    errorMsg.includes("ws://") ||
    errorMsg.includes("wss://") ||
    errorMsg.includes("closed without opened") ||
    errorMsg.includes("vite")
  ) {
    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    return;
  }
  if (
    errorMsg.includes("Refresh Token Not Found") ||
    errorMsg.includes("Invalid Refresh Token") ||
    errorMsg.includes("refresh_token")
  ) {
    event.preventDefault?.();
    try {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (key.includes("supabase-auth")) {
          window.localStorage.removeItem(key);
        }
      }
    } catch (e) {}
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
};

window.addEventListener("unhandledrejection", handleAuthError, true);
window.addEventListener("error", handleAuthError, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
