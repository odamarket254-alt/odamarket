import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Logo } from "../components/ui/Logo";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an active session or a recovery token in the URL hash
    const checkSession = async () => {
      // Check for errors in the hash or query string
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const searchParams = new URLSearchParams(window.location.search);
      const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");
      
      if (errorDesc) {
        toast.error(errorDesc.replace(/\+/g, ' '));
        navigate("/forgot-password", { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
    };
    checkSession();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;
      
      toast.success("Password successfully updated!");
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3EB] flex flex-col items-center justify-center font-sans p-4 sm:p-8">
      
      <div className="w-full max-w-[440px] flex justify-center mb-8">
        <Logo className="w-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8DCC9]/50 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D96A27] to-[#f49c64]"></div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2 tracking-tight">Set New Password</h2>
            <p className="text-[#666] text-[15px] font-medium leading-relaxed">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5 relative group/field">
              <label className="block text-[#4B5563] text-sm font-semibold">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(
                    "w-full h-[52px] pl-[42px] pr-[42px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                    errors.password ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                  )}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#D96A27] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-[13px] text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5 relative group/field">
              <label className="block text-[#4B5563] text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={cn(
                    "w-full h-[52px] pl-[42px] pr-[42px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                    errors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                  )}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#D96A27] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[13px] text-red-500 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Update Password <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
