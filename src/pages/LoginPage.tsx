import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore, loadStoredPendingOtpChallenge } from "../store/useAuthStore";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Clock,
  CreditCard,
  ShoppingBag,
  CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "../components/ui/Logo";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Please enter your email or phone number."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember: z.boolean().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState<number>(600);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { setProfile, setUser, pendingOtpChallenge, setPendingOtpChallenge } = useAuthStore();

  const searchParams = new URLSearchParams(location.search);
  const isEmailConfirmed = searchParams.get("confirmed") === "true";

  useEffect(() => {
    if (isEmailConfirmed) {
      toast.success("Your email has been confirmed! You can now log in.");
    }
  }, [isEmailConfirmed]);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Sync timers with active pendingOtpChallenge (survives page reload & multi-tab)
  useEffect(() => {
    const stored = loadStoredPendingOtpChallenge();
    if (stored && (!pendingOtpChallenge || pendingOtpChallenge.challengeId !== stored.challengeId)) {
      setPendingOtpChallenge(stored);
    }
  }, []);

  useEffect(() => {
    if (!pendingOtpChallenge) {
      setResendCooldown(0);
      setExpirySecondsLeft(600);
      return;
    }

    const updateTimers = () => {
      const now = Date.now();
      const expiresMs = new Date(pendingOtpChallenge.expiresAt).getTime();
      const remainingExpiry = Math.max(0, Math.floor((expiresMs - now) / 1000));
      setExpirySecondsLeft(remainingExpiry);

      const remainingResend = Math.max(
        0,
        Math.ceil((pendingOtpChallenge.resendAvailableAt - now) / 1000)
      );
      setResendCooldown(remainingResend);

      if (remainingExpiry <= 0) {
        setOtpError("Your verification code has expired. Please request a new code or sign in again.");
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [pendingOtpChallenge]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setOtpError(null);
    try {
      // Ensure no previous browser session is active before starting 2-step login
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      setProfile(null);

      const response = await fetch("/api/auth/login-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: data.emailOrPhone.trim(),
          password: data.password,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.error || "Failed to sign in. Please check your credentials.");
      }

      const now = Date.now();
      const cooldownSec = Number(resData.resendCooldownSeconds || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setPendingOtpChallenge({
        challengeId: resData.challengeId,
        challengeToken: resData.challengeToken,
        userId: resData.userId,
        email: resData.email,
        maskedEmail: resData.maskedEmail || resData.email,
        expiresAt: resData.expiresAt,
        resendAvailableAt: now + cooldownSec * 1000,
        redirectTo: from,
      });

      toast.success(`A 6-digit verification code has been sent to ${resData.maskedEmail || resData.email}`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (error: any) {
      if (error.message?.includes("Email not confirmed")) {
        toast.error("Please confirm your email before signing in. Check your inbox for the confirmation link.");
      } else {
        toast.error(error.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    // Handle multi-digit input or paste into a single box
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || "";
      }
      setOtpDigits(next);
      setOtpError(null);
      const focusIdx = Math.min(5, chars.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    setOtpError(null);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && otpDigits.join("").length === 6 && !isLoading) {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    setOtpError(null);
    const focusIdx = Math.min(5, pasted.length - 1);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingOtpChallenge) return;

    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setOtpError(null);
    try {
      const response = await fetch("/api/auth/login-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: pendingOtpChallenge.challengeId,
          challengeToken: pendingOtpChallenge.challengeToken,
          userId: pendingOtpChallenge.userId,
          otp: code,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (!response.ok || !resData?.success || !resData?.session) {
        if (resData?.locked) {
          setOtpDigits(["", "", "", "", "", ""]);
        }
        const errMsg = resData?.error || "Invalid verification code. Please try again.";
        setOtpError(errMsg);
        toast.error(errMsg);
        return;
      }

      const targetRedirect = pendingOtpChallenge.redirectTo || from || "/dashboard";

      // Clear pending OTP challenge BEFORE hydrating the verified Supabase session
      setPendingOtpChallenge(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: resData.session.access_token,
        refresh_token: resData.session.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      const verifiedUser = sessionData?.user || resData.user;
      if (verifiedUser) {
        setUser(verifiedUser);
        if (resData.profile) {
          const normalizedRole = resData.profile.role === "supplier" ? "seller" : resData.profile.role;
          setProfile({ ...resData.profile, role: normalizedRole });
        } else {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", verifiedUser.id)
            .maybeSingle();
          if (profileData) {
            const normalizedRole = profileData.role === "supplier" ? "seller" : profileData.role;
            setProfile({ ...profileData, role: normalizedRole });
          }
        }
      }

      toast.success("Welcome back to ODA Market!");
      navigate(targetRedirect, { replace: true });
    } catch (err: any) {
      const msg = err?.message || "Failed to verify code. Please try again.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingOtpChallenge || resendCooldown > 0 || isResendingOtp) return;

    setIsResendingOtp(true);
    setOtpError(null);
    try {
      const response = await fetch("/api/auth/login-resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: pendingOtpChallenge.challengeId,
          challengeToken: pendingOtpChallenge.challengeToken,
          userId: pendingOtpChallenge.userId,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (!response.ok || !resData?.success) {
        if (resData?.expired) {
          setPendingOtpChallenge(null);
        }
        throw new Error(resData?.error || "Failed to resend verification code.");
      }

      const now = Date.now();
      const cooldownSec = Number(resData.resendCooldownSeconds || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setPendingOtpChallenge({
        ...pendingOtpChallenge,
        expiresAt: resData.expiresAt,
        resendAvailableAt: now + cooldownSec * 1000,
      });

      toast.success("A new 6-digit verification code has been sent to your email.");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const msg = err?.message || "Failed to resend verification code.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCancelOtp = () => {
    if (pendingOtpChallenge?.challengeId && pendingOtpChallenge?.challengeToken) {
      fetch("/api/auth/login-cancel-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: pendingOtpChallenge.challengeId,
          challengeToken: pendingOtpChallenge.challengeToken,
          userId: pendingOtpChallenge.userId,
        }),
      }).catch(() => {});
    }
    setPendingOtpChallenge(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(null);
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3EB] flex font-sans">
      {/* LEFT SIDE HERO - Desktop Only */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-center bg-gradient-to-br from-[#F8F3EB] to-[#E8DCC9]">
        <div className="absolute inset-0 z-0">
           {/* Beautiful Supermarket Illustration generated by unsplash placeholders since we don't have a custom image, blending it beautifully */}
           <OptimizedImage 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000" 
            alt="Supermarket Fresh Groceries" 
            imgClassName="w-full h-full object-cover opacity-60 mix-blend-overlay" className="w-full h-full flex items-center justify-center bg-transparent"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8F3EB]/10 via-[#F8F3EB]/60 to-[#F8F3EB]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F3EB] via-transparent to-transparent"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 p-16 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md text-[#D96A27] font-bold text-sm mb-6 shadow-sm">
            <ShoppingBag className="w-4 h-4" /> Fresh Groceries Daily
          </div>
          <h1 className="text-5xl font-extrabold text-[#1A1A1A] leading-[1.1] tracking-tight mb-6">
            The freshest <span className="text-[#D96A27]">ingredients</span> delivered to your door.
          </h1>
          <p className="text-lg text-[#4A4A4A] font-medium leading-relaxed mb-10">
            Join thousands of shoppers enjoying fresh vegetables, fruits, bakery items, and everyday household essentials with ODA Market.
          </p>
          
          <div className="flex gap-4">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 flex-1 shadow-sm border border-white">
               <div className="w-10 h-10 rounded-full bg-[#D96A27]/10 flex items-center justify-center mb-3">
                 <Clock className="w-5 h-5 text-[#D96A27]" />
               </div>
               <h3 className="font-bold text-[#1A1A1A] mb-1">Fast Delivery</h3>
               <p className="text-sm text-[#666]">Within hours to your doorstep</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 flex-1 shadow-sm border border-white">
               <div className="w-10 h-10 rounded-full bg-[#D96A27]/10 flex items-center justify-center mb-3">
                 <ShieldCheck className="w-5 h-5 text-[#D96A27]" />
               </div>
               <h3 className="font-bold text-[#1A1A1A] mb-1">Secure Payments</h3>
               <p className="text-sm text-[#666]">Enterprise-grade security</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Floating Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile Logo (hidden on desktop where it's part of the layout) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Logo className="w-[140px]" />
          </div>

          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8DCC9]/50 p-8 sm:p-10 relative overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D96A27] to-[#f49c64]"></div>

            <div className="text-center mb-8">
              <div className="hidden lg:flex justify-center mb-6">
                 <Logo className="w-[120px]" />
              </div>
              {pendingOtpChallenge ? (
                <>
                  <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">Verify Your Login</h2>
                  <p className="text-[#666] text-sm font-medium">
                    We sent a 6-digit security code to{" "}
                    <span className="font-bold text-[#1A1A1A]">{pendingOtpChallenge.maskedEmail || pendingOtpChallenge.email}</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">Welcome Back</h2>
                  <p className="text-[#666] text-sm font-medium">
                    Sign in to shop fresh groceries, beverages, and everyday products.
                  </p>
                </>
              )}
            </div>

            {pendingOtpChallenge ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {otpError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-left">
                    {otpError}
                  </div>
                )}

                <div>
                  <label className="block text-[#4B5563] text-xs font-bold uppercase tracking-wider text-center mb-3">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex items-center justify-between gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        disabled={isLoading}
                        className={cn(
                          "w-full h-[54px] text-center text-xl font-extrabold rounded-xl bg-white border outline-none transition-all duration-200 text-[#1F2937] shadow-sm",
                          otpError
                            ? "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                            : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.12)]"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-[#6B7280] bg-[#FAF5EC] px-4 py-2.5 rounded-xl border border-[#E8DCC9]/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D96A27]" />
                    Code expires in:
                  </span>
                  <span className={cn("font-bold", expirySecondsLeft <= 60 ? "text-red-600" : "text-[#1A1A1A]")}>
                    {formatCountdown(expirySecondsLeft)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpDigits.join("").length !== 6 || expirySecondsLeft <= 0}
                  className="w-full h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify & Sign In <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 text-sm">
                  <button
                    type="button"
                    onClick={handleCancelOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-[#1F2937] font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResendingOtp || isLoading}
                    className={cn(
                      "inline-flex items-center gap-1.5 font-bold transition-colors",
                      resendCooldown > 0 || isResendingOtp
                        ? "text-[#9CA3AF] cursor-not-allowed"
                        : "text-[#D96A27] hover:text-[#c45a1f]"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isResendingOtp && "animate-spin")} />
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : isResendingOtp
                      ? "Sending..."
                      : "Resend Code"}
                  </button>
                </div>
              </form>
            ) : (
              <>
            {isEmailConfirmed && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-green-900">Email Verified!</h4>
                  <p className="text-xs text-green-700 mt-0.5">Your email address has been confirmed. You can now log in below.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[52px] rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#374151] font-semibold text-[15px] flex items-center justify-center gap-3 transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase">
                <span className="bg-white px-4">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email/Phone Field */}
              <div className="space-y-1.5 relative group/field">
                <label htmlFor="emailOrPhone" className="block text-[#4B5563] text-sm font-semibold">Email or Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="emailOrPhone"
                    type="text"
                    placeholder="name@example.com or 0712345678"
                    {...register("emailOrPhone")}
                    className={cn(
                      "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                      errors.emailOrPhone 
                        ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" 
                        : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                    )}
                  />
                </div>
                {errors.emailOrPhone && <p className="text-[13px] text-red-500 font-medium">{errors.emailOrPhone.message}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 relative group/field">
                <label htmlFor="password" className="block text-[#4B5563] text-sm font-semibold">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={cn(
                      "w-full h-[52px] pl-[42px] pr-[48px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                      errors.password 
                        ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" 
                        : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                    )}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#D96A27] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[13px] text-red-500 font-medium">{errors.password.message}</p>}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      {...register("remember")}
                      className="peer w-[18px] h-[18px] appearance-none rounded-[5px] border-2 border-[#D1D5DB] bg-white checked:bg-[#D96A27] checked:border-[#D96A27] transition-all cursor-pointer hover:border-[#9CA3AF] checked:hover:border-[#D96A27]"
                    />
                    <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                  </div>
                  <span className="text-[14px] font-medium text-[#4B5563] group-hover:text-[#1F2937] transition-colors select-none">
                    Remember this device
                  </span>
                </label>
                <Link to="/forgot-password" className="text-[14px] font-bold text-[#D96A27] hover:text-[#c45a1f] transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] hover:-translate-y-[1px] active:translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
                
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Shop Now <ArrowRight className="w-5 h-5 ml-1" /></>
                )}
              </button>
            </form>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-[15px] font-medium text-[#6B7280]">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-[#D96A27] hover:text-[#c45a1f] transition-colors underline decoration-[#D96A27]/30 decoration-2 underline-offset-4 hover:decoration-[#D96A27]">
                Create an account
              </Link>
            </p>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-[#9CA3AF]">
             <div className="flex flex-col items-center gap-1 group">
               <ShieldCheck className="w-5 h-5 group-hover:text-[#D96A27] transition-colors" />
               <span className="text-[10px] uppercase font-bold tracking-wider">Secure</span>
             </div>
             <div className="flex flex-col items-center gap-1 group">
               <CreditCard className="w-5 h-5 group-hover:text-[#D96A27] transition-colors" />
               <span className="text-[10px] uppercase font-bold tracking-wider">Payments</span>
             </div>
             <div className="flex flex-col items-center gap-1 group">
               <ShoppingBag className="w-5 h-5 group-hover:text-[#D96A27] transition-colors" />
               <span className="text-[10px] uppercase font-bold tracking-wider">Fresh</span>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
