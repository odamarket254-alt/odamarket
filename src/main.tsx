import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

// Suppress Supabase refresh token errors globally
const handleAuthError = (event: any) => {
  const errorMsg = event.reason?.message || event.message || "";
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
