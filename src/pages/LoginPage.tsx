import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { motion } from "motion/react";
import ReCAPTCHA from "react-google-recaptcha";
import {
  Mail,
  Lock,
  Globe2,
  Check,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "../lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

import { Logo } from "../components/ui/Logo";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const { user, profile } = useAuthStore();
  
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  useEffect(() => {
    if (user && profile) {
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      if (!recaptchaToken) {
        toast.error("Please complete the reCAPTCHA challenge.");
        setIsLoading(false);
        return;
      }
      
      // Verify reCAPTCHA token on server
      console.log(`[AUTH FLOW] Sending token to backend /api/verify-recaptcha...`);
      const response = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recaptchaToken }),
      });
      
      console.log(`[AUTH FLOW] Backend verification response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[AUTH FLOW] Non-JSON response from verification server:", text);
        throw new Error(`The server returned a non-JSON response (Status: ${response.status}, Content-Type: ${contentType}). Preview: ${text.substring(0, 100)}`);
      }
      
      let verifyData;
      try {
        verifyData = await response.json();
        console.log(`[AUTH FLOW] Backend verification data:`, verifyData);
      } catch (jsonErr: any) {
        console.error("[AUTH FLOW] JSON parsing error on verification response:", jsonErr);
        throw new Error(`Invalid response from verification server: ${response.status}`);
      }
      
      if (!verifyData.success) {
        console.warn("[AUTH FLOW] reCAPTCHA verification failed on backend:", verifyData.error);
        toast.error("reCAPTCHA Verification Failed", { description: verifyData.error || "Please try the captcha again." });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        setIsLoading(false);
        return;
      }

      console.log(`[AUTH FLOW] Calling Supabase signInWithPassword...`);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("[AUTH FLOW] Supabase login failed:", error);
        toast.error("Login failed", { description: error.message });
      } else {
        console.log("[AUTH FLOW] Supabase login successful, session created.");
        toast.success("Welcome back!", {
          description: "Secure session established.",
        });
        // Note: Navigation happens via useEffect listening to auth state
      }
    } catch (err: any) {
      console.error("[AUTH FLOW] Exception during login process:", err);
      const isMissingCreds = !import.meta.env.VITE_SUPABASE_URL;
      if (isMissingCreds && err.message && err.message.includes("fetch failed")) {
        toast.error("Database Connection Failed", { description: "Supabase environment variables are not configured. Please add them in the project settings." });
      } else {
        toast.error("Login Error", { description: err.message || "An unexpected error occurred. Please try again later." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error)
        toast.error("Google sign in failed", { description: error.message });
    } catch (err) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans bg-[#07110B] text-[#FFFFFF] relative overflow-hidden selection:bg-[#00C46A]/20 selection:text-[#00C46A]">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07110B] via-[#0D1510] to-[#07110B] pointer-events-none"></div>
      
      {/* Light Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Radial Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#00C46A] opacity-[0.08] blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col items-center mb-8 px-4 text-center mt-12 sm:mt-0">
        <Link to="/" className="mb-8 group block w-max">
          <Logo />
        </Link>
        <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight mb-3 text-[#FFFFFF]">
          Welcome Back
        </h1>
        <p className="text-[#9AA29B] text-[16px] max-w-[380px]">
          Sign in to access your global procurement and supplier network.
        </p>
      </div>

      {/* AUTH FORM PANEL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 w-full max-w-[480px] bg-[#0D1510]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,196,106,0.05)_inset] p-6 sm:p-10 mb-8 sm:mb-12 mx-4"
      >
        {/* Glow behind the card */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-[#00C46A]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-[24px] blur pointer-events-none"></div>

        <div className="relative z-10">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-[56px] bg-[#111A14] hover:bg-white/5 border border-white/10 hover:border-white/20 text-[#FFFFFF] font-semibold rounded-[16px] transition-all flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]"></div>
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold tracking-wider text-[#9AA29B] uppercase">
              <span className="bg-[#0D1510] px-4">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2 relative group/field">
              <label htmlFor="email" className="text-[14px] font-medium text-[#9AA29B] group-focus-within/field:text-[#FFFFFF] transition-colors">Business Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA29B] group-focus-within/field:text-[#00C46A] transition-colors z-10">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={cn(
                    "w-full h-[56px] pl-[44px] pr-4 rounded-[14px] bg-[#111A14] border border-white/10 focus:outline-none transition-all text-[#FFFFFF] placeholder:text-[#9AA29B] text-[15px] hover:border-white/20 focus:border-[#00C46A] focus:shadow-[0_0_0_1px_rgba(0,196,106,1)]",
                    errors.email && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,1)]"
                  )}
                />
              </div>
              {errors.email && <p className="text-[13px] text-red-500 font-medium absolute -bottom-5 left-0">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2 relative group/field">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[14px] font-medium text-[#9AA29B] group-focus-within/field:text-[#FFFFFF] transition-colors">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9AA29B] group-focus-within/field:text-[#00C46A] transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(
                    "w-full h-[56px] pl-[44px] pr-12 rounded-[14px] bg-[#111A14] border border-white/10 focus:outline-none transition-all text-[#FFFFFF] placeholder:text-[#9AA29B] text-[15px] hover:border-white/20 focus:border-[#00C46A] focus:shadow-[0_0_0_1px_rgba(0,196,106,1)]",
                    errors.password && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,1)]"
                  )}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA29B] hover:text-[#FFFFFF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-[13px] text-red-500 font-medium absolute -bottom-5 left-0">{errors.password.message}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    {...register("remember")}
                    className="peer w-5 h-5 appearance-none rounded-[6px] border-2 border-white/20 bg-[#111A14] checked:bg-[#00C46A] checked:border-[#00C46A] transition-all cursor-pointer hover:border-white/30 hover:checked:border-[#00C46A]"
                  />
                  <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#07110B] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                </div>
                <label htmlFor="remember" className="ml-3 text-[14px] font-medium text-[#9AA29B] cursor-pointer select-none">
                  Remember this device
                </label>
              </div>
              <Link to="/forgot-password" className="text-[14px] font-semibold text-[#00C46A] hover:text-[#00E08A] transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="flex justify-center pt-2">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={siteKey}
                onChange={(token) => setRecaptchaToken(token)}
                theme="dark"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[56px] mt-2 rounded-[14px] bg-gradient-to-r from-[#00C46A] to-[#00E08A] hover:brightness-110 text-[#07110B] font-bold text-[18px] shadow-[0_0_20px_rgba(0,196,106,0.3)] hover:shadow-[0_0_30px_rgba(0,196,106,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-[#07110B]/30 border-t-[#07110B] rounded-full animate-spin"></div>
              ) : (
                <>Access Marketplace <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
          
          {/* Security Badge */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#9AA29B] bg-white/[0.03] py-2.5 px-4 rounded-[10px] border border-white/5">
               <Check className="h-4 w-4 text-[#00C46A]" />
               <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM SECTION */}
      <div className="relative z-10 w-full max-w-[480px] px-4 pb-12 flex flex-col items-center">
         <p className="text-[15px] font-medium text-[#9AA29B] mb-4">New to OdaMarket?</p>
         <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4">
            <Link 
              to="/register" 
              className="flex-1 h-[48px] rounded-[12px] bg-transparent border border-white/10 hover:border-[#00C46A]/50 hover:bg-[#00C46A]/5 text-[#FFFFFF] font-medium flex items-center justify-center transition-all duration-200"
            >
              Create Supplier Account
            </Link>
            <Link 
              to="/register" 
              className="flex-1 h-[48px] rounded-[12px] bg-transparent border border-white/10 hover:border-[#00C46A]/50 hover:bg-[#00C46A]/5 text-[#FFFFFF] font-medium flex items-center justify-center transition-all duration-200"
            >
              Create Buyer Account
            </Link>
         </div>
      </div>

    </div>
  );
}

