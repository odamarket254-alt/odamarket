import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Logo } from "../components/ui/Logo";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setIsSent(true);
      toast.success("Password reset instructions sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
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
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#D96A27]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-[#D96A27]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2 tracking-tight">Forgot Password</h2>
                  <p className="text-[#666] text-[15px] font-medium leading-relaxed">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        {...register("email")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          errors.email ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                        )}
                      />
                    </div>
                    {errors.email && <p className="text-[13px] text-red-500 font-medium">{errors.email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Send Reset Link <ArrowRight className="w-5 h-5 ml-1" /></>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <Link to="/login" className="inline-flex items-center gap-2 text-[15px] font-bold text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Check your email</h2>
                <p className="text-[#666] text-[15px] font-medium leading-relaxed mb-8">
                  We have sent a password reset link to your email address. Please check your inbox.
                </p>
                <Link
                  to="/login"
                  className="w-full h-[52px] rounded-xl bg-gray-100 hover:bg-gray-200 text-[#374151] font-bold text-[16px] transition-all duration-300 flex items-center justify-center"
                >
                  Return to login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
