import { toast } from "sonner";

export const verifyRecaptchaToken = async (
  executeRecaptcha: ((action?: string) => Promise<string>) | undefined,
  action: string
): Promise<boolean> => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" || siteKey === "dummy_key_for_dev" || siteKey === "YOUR_RECAPTCHA_SITE_KEY") {
    console.warn("reCAPTCHA site key is not set. Bypassing verification for development.");
    return true; // Bypass in dev if not loaded
  }

  if (!executeRecaptcha) {
    console.warn("Execute recaptcha not yet available");
    return true; // Bypass in dev if not loaded
  }

  try {
    console.log(`[AUTH FLOW] Executing reCAPTCHA for action: ${action}`);
    const token = await executeRecaptcha(action);
    console.log(`[AUTH FLOW] reCAPTCHA token obtained: ${token.substring(0, 15)}...`);
    
    console.log(`[AUTH FLOW] Sending token to backend /api/verify-recaptcha...`);
    const response = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    console.log(`[AUTH FLOW] Backend verification response status: ${response.status}`);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[AUTH FLOW] Non-JSON response from verification server:", text);
      toast.error("Verification Error", { description: "The server returned an invalid response. Please try again." });
      return false;
    }

    const data = await response.json();
    console.log(`[AUTH FLOW] Backend verification data:`, data);
    
    if (data.success) {
      console.log(`[AUTH FLOW] reCAPTCHA verification successful`);
      return true;
    } else {
      console.warn("[AUTH FLOW] reCAPTCHA failed on backend:", data.error);
      toast.error("reCAPTCHA Verification Failed", { description: data.error || "Please try again." });
      return false;
    }
  } catch (error) {
    console.error("[AUTH FLOW] Error during reCAPTCHA verification process:", error);
    toast.error("Verification Error", { description: "Failed to perform security check. Please try again." });
    return false;
  }
};
