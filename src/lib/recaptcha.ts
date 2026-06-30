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
      toast.error("Verification Issue", { description: "We are experiencing an issue with reCAPTCHA which will be solved soon. Please continue with Google for this time as we solve the issue. We apologize for the inconvenience." });
      return false;
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    toast.error("Verification Issue", { description: "We are experiencing an issue with reCAPTCHA which will be solved soon. Please continue with Google for this time as we solve the issue. We apologize for the inconvenience." });
    return false;
  }
};
