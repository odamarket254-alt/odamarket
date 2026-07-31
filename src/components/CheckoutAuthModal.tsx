import { useState, useRef, useEffect } from "react";
import { Lock, Mail, Phone, Chrome, ChevronLeft, CheckCircle2, Loader2, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

type AuthView = "initial" | "login" | "signup" | "otp" | "success";

interface CheckoutAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutAuthModal({ isOpen, onClose, onSuccess }: CheckoutAuthModalProps) {
  const [view, setView] = useState<AuthView>("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreed: false
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(119); // 1:59
  const [userId, setUserId] = useState<string | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (view === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, countdown]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/checkout`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to continue with Google");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const isEmail = emailOrPhone.includes('@');
      let phone = undefined;
      
      if (!isEmail) {
        let formattedPhone = emailOrPhone.trim().replace(/[\s\-()]/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        phone = formattedPhone;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: isEmail ? emailOrPhone : undefined,
        phone: phone,
        password
      });

      if (error) throw error;
      
      if (data.user) {
        setView("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!signupData.agreed) {
      setError("Please agree to the Terms & Conditions");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      let formattedPhone = signupData.phone.trim().replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      // Check if user exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, phone: formattedPhone }),
      });
      let checkData;
      try {
        checkData = await checkRes.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (!checkRes.ok) throw new Error(checkData?.error || "Failed to verify details");

      setSignupData({ ...signupData, phone: formattedPhone });

      // Call our Africa's Talking backend endpoint
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      let resData;
      try {
        resData = await response.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (!response.ok) {
        throw new Error(resData?.error || 'Failed to send OTP');
      }

      setView("otp");
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      let formattedPhone = signupData.phone.trim().replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      let resData;
      try {
        resData = await response.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (!response.ok) {
        throw new Error(resData?.error || 'Failed to resend OTP');
      }
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Verify OTP via our custom endpoint
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: signupData.phone, 
          otp: code,
          accountData: {
            email: signupData.email,
            password: signupData.password,
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            phone: signupData.phone,
          }
        }),
      });
      let resData;
      try {
        resData = await response.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (!response.ok) {
        throw new Error(resData?.error || 'Failed to verify OTP');
      }

      if (resData.userId) {
        setUserId(resData.userId);
      }

      // Auto login
      await supabase.auth.signInWithPassword({
        email: signupData.email,
        password: signupData.password
      });

      setView("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FFFDF8] rounded-[24px] shadow-2xl w-full max-w-[520px] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        {view !== "success" && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#6B7280] hover:text-[#0B2A5B] hover:bg-[#E5E7EB] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="overflow-y-auto custom-scrollbar p-8">
          
          {/* SUCCESS VIEW */}
          {view === "success" && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h2 className="text-[#0B2A5B] font-bold text-[28px] mb-2">Account Verified Successfully</h2>
              <p className="text-[#6B7280] text-[16px] mb-6">Redirecting to checkout...</p>
              <Loader2 className="w-6 h-6 text-[#22C55E] animate-spin" />
            </div>
          )}

          {/* INITIAL VIEW */}
          {view === "initial" && (
            <div className="animate-in slide-in-from-left-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E5E7EB]">
                  <span className="text-[28px]">🔒</span>
                </div>
                <h2 className="text-[#0B2A5B] font-bold text-[28px] mb-2">Continue to Checkout</h2>
                <p className="text-[#6B7280] text-[15px]">Sign in or create an account to continue with your order.</p>
              </div>

              <div className="space-y-3 mb-8">
                <button onClick={handleGoogleLogin} className="w-full h-[56px] border border-[#E5E7EB] hover:bg-[#F8FAFC] rounded-[16px] flex items-center justify-center gap-3 text-[#0B2A5B] font-bold text-[15px] transition-colors">
                  <Chrome className="w-5 h-5" /> Continue with Google
                </button>
                <button onClick={() => setView("login")} className="w-full h-[56px] border border-[#E5E7EB] hover:bg-[#F8FAFC] rounded-[16px] flex items-center justify-center gap-3 text-[#0B2A5B] font-bold text-[15px] transition-colors">
                  <Mail className="w-5 h-5 text-[#6B7280]" /> Continue with Email
                </button>
                <button onClick={() => setView("login")} className="w-full h-[56px] border border-[#E5E7EB] hover:bg-[#F8FAFC] rounded-[16px] flex items-center justify-center gap-3 text-[#0B2A5B] font-bold text-[15px] transition-colors">
                  <Phone className="w-5 h-5 text-[#6B7280]" /> Continue with Phone Number
                </button>
                <button onClick={() => setView("signup")} className="w-full h-[56px] bg-[#22C55E] hover:bg-[#16A34A] rounded-[16px] flex items-center justify-center gap-3 text-white font-bold text-[15px] transition-colors shadow-sm">
                  Create New Account
                </button>
              </div>

              <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E5E7EB] mb-6">
                <p className="text-[#0B2A5B] font-bold text-[14px] mb-3">Why create an account?</p>
                <div className="space-y-2">
                  {[
                    "Track your orders",
                    "Save multiple delivery addresses",
                    "Faster checkout next time",
                    "Receive delivery notifications",
                    "View order history"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#6B7280] text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-[15px]">
                <span className="text-[#6B7280]">Already have an account? </span>
                <button onClick={() => setView("login")} className="text-[#0B2A5B] font-bold hover:underline">Login</button>
              </div>
            </div>
          )}

          {/* LOGIN VIEW */}
          {view === "login" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setView("initial")} className="flex items-center gap-1 text-[#6B7280] hover:text-[#0B2A5B] text-[14px] font-medium mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <h2 className="text-[#0B2A5B] font-bold text-[28px] mb-6">Login to your account</h2>
              
              {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-[#EF4444] text-[14px] mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Email or Phone</label>
                  <input 
                    type="text" 
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[#374151] text-[14px] font-medium">Password</label>
                    <button type="button" className="text-[#0B2A5B] font-bold text-[13px] hover:underline">Forgot Password?</button>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-[56px] bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-70 disabled:hover:bg-[#22C55E] rounded-[16px] flex items-center justify-center gap-2 text-white font-bold text-[16px] transition-colors mt-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                </button>
              </form>
            </div>
          )}

          {/* SIGNUP VIEW */}
          {view === "signup" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setView("initial")} className="flex items-center gap-1 text-[#6B7280] hover:text-[#0B2A5B] text-[14px] font-medium mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <h2 className="text-[#0B2A5B] font-bold text-[28px] mb-6">Create New Account</h2>
              
              {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-[#EF4444] text-[14px] mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#374151] text-[14px] font-medium mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={signupData.firstName}
                      onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                      className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={signupData.lastName}
                      onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                      className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Email</label>
                  <input 
                    type="email" 
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                
                <div>
                  <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={signupData.phone}
                    onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                    className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Password</label>
                    <input 
                      type="password" 
                      required
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[#374151] text-[14px] font-medium mb-1.5">Confirm Password</label>
                    <input 
                      type="password" 
                      required
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                      className="w-full h-[56px] px-[18px] py-[16px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] outline-none text-[#111827] text-[16px] font-medium placeholder:text-[#9CA3AF] transition-all duration-200 hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={signupData.agreed}
                    onChange={(e) => setSignupData({...signupData, agreed: e.target.checked})}
                    className="mt-1 rounded text-[#22C55E] focus:ring-[#22C55E] border-[#E5E7EB] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                  />
                  <span className="text-[#6B7280] text-[13px] leading-snug">
                    I agree to the <a href="#" className="text-[#0B2A5B] font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-[#0B2A5B] font-medium hover:underline">Privacy Policy</a>
                  </span>
                </label>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-[56px] bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-70 disabled:hover:bg-[#22C55E] rounded-[16px] flex items-center justify-center gap-2 text-white font-bold text-[16px] transition-colors mt-6 shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </button>
              </form>
            </div>
          )}

          {/* OTP VIEW */}
          {view === "otp" && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB]">
                <Check className="w-6 h-6 text-[#0B2A5B]" />
              </div>
              <h2 className="text-[#0B2A5B] font-bold text-[28px] mb-2">Verify Your Phone Number</h2>
              <p className="text-[#6B7280] text-[15px] mb-8">
                Enter the 6-digit code sent to your mobile number. <br/>
                <span className="text-[#0B2A5B] font-bold">
                  {signupData.phone.length > 6 
                    ? signupData.phone.slice(0, 4) + " *** " + signupData.phone.slice(-3)
                    : signupData.phone}
                </span>
              </p>
              
              {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-[#EF4444] text-[14px] mb-6 w-full text-left">
                  {error}
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 justify-center mb-8 w-full">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-[48px] h-[56px] sm:w-[56px] sm:h-[56px] text-center text-[24px] font-bold rounded-[14px] bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#94A3B8] focus:border-[#0B2A5B] focus:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] focus:outline-none text-[#111827] transition-all duration-200 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-[14px] mb-8">
                <span className="text-[#6B7280]">Code expires in</span>
                <span className="text-[#0B2A5B] font-bold">{formatTime(countdown)}</span>
              </div>

              <button 
                onClick={verifyOtp}
                disabled={isLoading || otp.join('').length < 6}
                className="w-full h-[56px] bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-70 disabled:hover:bg-[#22C55E] rounded-[16px] flex items-center justify-center gap-2 text-white font-bold text-[16px] transition-colors shadow-sm mb-6"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
              </button>

              <div className="text-[14px]">
                <span className="text-[#6B7280]">Didn't receive the code? </span>
                <button 
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isLoading}
                  className={`font-bold transition-colors ${countdown > 0 ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#0B2A5B] hover:underline'}`}
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
