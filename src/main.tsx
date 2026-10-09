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
  const errorMsg = event.reason?.message || event.message || "";
  if (
    errorMsg.includes("WebSocket") ||
    errorMsg.includes("ws://") ||
    errorMsg.includes("wss://")
  ) {
    event.preventDefault?.();
    return;
  }
  if (
    errorMsg.includes("Refresh Token Not Found") ||
    errorMsg.includes("Invalid Refresh Token") ||
    errorMsg.includes("refresh_token")
  ) {
    event.preventDefault(); // Stop it from surfacing as an unhandled error
    try {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (key.includes("supabase-auth")) {
          window.localStorage.removeItem(key);
        }
      }
    } catch (e) {}
    // We can choose to reload to login, but only if not already there
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
};

window.addEventListener("unhandledrejection", handleAuthError);
window.addEventListener("error", handleAuthError);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
