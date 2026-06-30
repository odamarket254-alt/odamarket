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
    const token = await executeRecaptcha(action);
    const response = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (data.success) {
      return true;
    } else {
      console.error("reCAPTCHA failed:", data.error);
      toast.error("Security verification failed. Are you a robot?");
      return false;
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    toast.error("Failed to perform security check. Please try again.");
    return false;
  }
};
