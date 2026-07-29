import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Map,
  Home,
  Building,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "../components/ui/Logo";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];

const accountSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(9, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the terms")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const addressSchema = z.object({
  county: z.string().min(2, "County is required"),
  town: z.string().min(2, "Town/City is required"),
  estate: z.string().optional(),
  street: z.string().min(2, "Street is required"),
  house_number: z.string().optional(),
  apartment: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  formatted_address: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export default function RegisterPage() {

  

  const maskPhoneNumber = (phone: string) => {

    if (!phone) return "";
    let p = phone.trim().replace(/[\s\-()]/g, '');
    if (p.startsWith('0')) p = '+254' + p.substring(1);
    else if (!p.startsWith('+')) p = '+' + p;
    if (p.length < 12) return p; // not enough chars to mask
    return `${p.substring(0, 7)} *** ${p.substring(p.length - 3)}`;
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const onLoad = (autocomplete: any) => {};
  const onPlaceChanged = () => {};
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form Data Aggregation
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<AccountFormValues | null>(null);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);

  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    setValue: setAddressValue,
    formState: { errors: addressErrors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
      return () => clearInterval(timer);
  }, [step, countdown]);

  const onAccountSubmit = async (data: AccountFormValues) => {
    setAccountData(data);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountData: data })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create account.");
      
      setCreatedUserId(resData.userId);
      toast.success("Verification code sent via SMS!");
      setCountdown(60);
      setStep(2); // Move to Verification step
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const onAddressSubmit = async (data: AddressFormValues) => {
    setAddressData(data);
    setIsLoading(true);
    try {
      if (!accountData || !createdUserId) return;

      const { error } = await supabase.from("delivery_addresses").insert({
        user_id: createdUserId,
        full_name: `${accountData.first_name} ${accountData.last_name}`,
        phone_number: accountData.phone,
        street_address: data.street || data.formatted_address || "",
        apartment_suite: data.apartment || data.house_number || "",
        city: data.town || "",
        county: data.county,
        postal_code: "",
        is_default: true,
      });
      
      if (error) throw error;

      setStep(4);
    } catch (error: any) {
      toast.error(error.message || "Failed to save address.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!accountData || countdown > 0) return;
    setIsLoading(true);
    try {
      let formattedPhone = accountData.phone.trim().replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Failed to send OTP");

      toast.success("A new verification code has been sent!");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      if (!accountData || !createdUserId) return;

      let formattedPhone = accountData.phone.trim().replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp: code,
          userId: createdUserId
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid verification code.");

      // Sign in automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: accountData.email,
        password: accountData.password,
      });

      if (signInError) throw signInError;

      toast.success("Phone number verified successfully!");
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired verification code.");
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
    
    // Auto-submit
    if (newOtp.join("").length === 6) {
      setTimeout(() => {
        const btn = document.getElementById('verify-otp-btn');
        if (btn) btn.click();
      }, 50);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (!isNaN(Number(pastedData[i]))) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    
    if (pastedData.length < 6) {
      otpRefs.current[pastedData.length]?.focus();
    } else {
      otpRefs.current[5]?.focus();
      setTimeout(() => {
        const btn = document.getElementById('verify-otp-btn');
        if (btn) btn.click();
      }, 50);
    }
  };
  return (
    <div className="min-h-screen bg-[#F8F3EB] flex flex-col items-center justify-center font-sans p-4 sm:p-8">
      
      {/* Header */}
      <div className="w-full max-w-[600px] flex justify-center mb-8">
        <Logo className="w-[140px]" />
      </div>

      {step < 4 && (
        <div className="w-full max-w-[600px] text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-3">Create Your Account</h1>
          <p className="text-[#666] text-[15px] font-medium">
            Join thousands of shoppers enjoying fresh groceries every day.
          </p>
        </div>
      )}

      {/* Progress Indicator */}
      {step < 4 && (
        <div className="w-full max-w-[600px] flex justify-between items-center mb-8 relative px-2">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-[#E8DCC9] -z-10 -translate-y-1/2"></div>
          
          <div className="flex flex-col items-center gap-2 bg-[#F8F3EB] px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors", step >= 1 ? "bg-[#D96A27] text-white shadow-md" : "bg-white border-2 border-[#E8DCC9] text-[#9CA3AF]")}>
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= 1 ? "text-[#D96A27]" : "text-[#9CA3AF]")}>Account</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-[#F8F3EB] px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors", step >= 2 ? "bg-[#D96A27] text-white shadow-md" : "bg-white border-2 border-[#E8DCC9] text-[#9CA3AF]")}>
              {step > 2 ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= 2 ? "text-[#D96A27]" : "text-[#9CA3AF]")}>Verification</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-[#F8F3EB] px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors", step >= 3 ? "bg-[#D96A27] text-white shadow-md" : "bg-white border-2 border-[#E8DCC9] text-[#9CA3AF]")}>
              3
            </div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= 3 ? "text-[#D96A27]" : "text-[#9CA3AF]")}>Address</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <motion.div 
        layout
        className="w-full max-w-[600px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8DCC9]/50 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D96A27] to-[#f49c64]"></div>
        
        <div className="p-6 sm:p-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ACCOUNT */}
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleAccountSubmit(onAccountSubmit)}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Renol"
                        {...registerAccount("first_name")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          accountErrors.first_name ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                        )}
                      />
                    </div>
                    {accountErrors.first_name && <p className="text-[12px] text-red-500 font-medium">{accountErrors.first_name.message}</p>}
                  </div>

                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">Last Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Kenol"
                        {...registerAccount("last_name")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          accountErrors.last_name ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                        )}
                      />
                    </div>
                    {accountErrors.last_name && <p className="text-[12px] text-red-500 font-medium">{accountErrors.last_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 relative group/field">
                  <label className="block text-[#4B5563] text-sm font-semibold">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="renol@example.com"
                      {...registerAccount("email")}
                      className={cn(
                        "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                        accountErrors.email ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                      )}
                    />
                  </div>
                  {accountErrors.email && <p className="text-[12px] text-red-500 font-medium">{accountErrors.email.message}</p>}
                </div>

                <div className="space-y-1.5 relative group/field">
                  <label className="block text-[#4B5563] text-sm font-semibold">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      {...registerAccount("phone")}
                      className={cn(
                        "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                        accountErrors.phone ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
                      )}
                    />
                  </div>
                  {accountErrors.phone && <p className="text-[12px] text-red-500 font-medium">{accountErrors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...registerAccount("password")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[42px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          accountErrors.password ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
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
                    {accountErrors.password && <p className="text-[12px] text-red-500 font-medium">{accountErrors.password.message}</p>}
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
                        {...registerAccount("confirmPassword")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[42px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          accountErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-[#E5E7EB] focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)]"
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
                    {accountErrors.confirmPassword && <p className="text-[12px] text-red-500 font-medium">{accountErrors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        {...registerAccount("agreeTerms")}
                        className="peer w-5 h-5 appearance-none rounded-[6px] border-2 border-[#D1D5DB] bg-white checked:bg-[#D96A27] checked:border-[#D96A27] transition-all cursor-pointer hover:border-[#9CA3AF] checked:hover:border-[#D96A27]"
                      />
                      <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                    </div>
                    <span className="text-[14px] leading-relaxed font-medium text-[#4B5563]">
                      I agree to the <Link to="/terms" className="text-[#D96A27] hover:underline font-bold">Terms of Service</Link> and <Link to="/privacy" className="text-[#D96A27] hover:underline font-bold">Privacy Policy</Link>
                    </span>
                  </label>
                  {accountErrors.agreeTerms && <p className="text-[12px] text-red-500 font-medium mt-1 ml-8">{accountErrors.agreeTerms.message}</p>}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
                    Continue <ArrowRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: ADDRESS */}
            {step === 3 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleAddressSubmit(onAddressSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1.5 relative group/field">
                  <label className="block text-[#4B5563] text-sm font-semibold">Search Address with Google</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-20">
                      <MapPin className="w-5 h-5" />
                    </div>
                    {isLoaded ? (
                      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                        <input
                          type="text"
                          placeholder="Start typing your address..."
                          className="w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border border-[#E5E7EB] outline-none focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)] transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]"
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="Loading Google Maps..."
                        className="w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-gray-50 border border-[#E5E7EB] text-[#1F2937] text-[15px] font-medium shadow-sm"
                      />
                    )}
                  </div>
                  <p className="text-[12px] text-[#6B7280] font-medium flex items-center gap-1 mt-1">
                    <Navigation className="w-3 h-3" /> Select from autocomplete to auto-fill details
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">County</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <Map className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Nairobi"
                        {...registerAddress("county")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          addressErrors.county ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                        )}
                      />
                    </div>
                    {addressErrors.county && <p className="text-[12px] text-red-500">{addressErrors.county.message}</p>}
                  </div>

                  <div className="space-y-1.5 relative group/field">
                    <label className="block text-[#4B5563] text-sm font-semibold">Town / City</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <Building className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Westlands"
                        {...registerAddress("town")}
                        className={cn(
                          "w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                          addressErrors.town ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                        )}
                      />
                    </div>
                    {addressErrors.town && <p className="text-[12px] text-red-500">{addressErrors.town.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 relative group/field">
                  <label className="block text-[#4B5563] text-sm font-semibold">Street Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Waiyaki Way"
                      {...registerAddress("street")}
                      className={cn(
                        "w-full h-[52px] px-[16px] rounded-xl bg-white border outline-none transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]",
                        addressErrors.street ? "border-red-500 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#D96A27]"
                      )}
                    />
                  </div>
                  {addressErrors.street && <p className="text-[12px] text-red-500">{addressErrors.street.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5 relative group/field sm:col-span-1">
                    <label className="block text-[#4B5563] text-sm font-semibold">Estate (Optional)</label>
                    <input
                      type="text"
                      placeholder="Lavington"
                      {...registerAddress("estate")}
                      className="w-full h-[52px] px-[16px] rounded-xl bg-white border border-[#E5E7EB] outline-none focus:border-[#D96A27] transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]"
                    />
                  </div>
                  
                  <div className="space-y-1.5 relative group/field sm:col-span-1">
                    <label className="block text-[#4B5563] text-sm font-semibold">House No. (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within/field:text-[#D96A27] transition-colors z-10">
                        <Home className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="42A"
                        {...registerAddress("house_number")}
                        className="w-full h-[52px] pl-[42px] pr-[16px] rounded-xl bg-white border border-[#E5E7EB] outline-none focus:border-[#D96A27] transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative group/field sm:col-span-1">
                    <label className="block text-[#4B5563] text-sm font-semibold">Apt (Optional)</label>
                    <input
                      type="text"
                      placeholder="B4"
                      {...registerAddress("apartment")}
                      className="w-full h-[52px] px-[16px] rounded-xl bg-white border border-[#E5E7EB] outline-none focus:border-[#D96A27] transition-all duration-300 text-[#1F2937] placeholder:text-[#9CA3AF] text-[15px] font-medium shadow-sm hover:border-[#D1D5DB]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-[52px] px-6 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#374151] font-bold text-[16px] shadow-sm transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Continue <ArrowRight className="w-5 h-5 ml-1" /></>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center py-6"
              >
                <div className="w-20 h-20 rounded-full bg-[#D96A27]/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-[#D96A27]" />
                </div>
                
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Verify Your Phone Number</h2>
                <p className="text-[#666] text-center mb-8 max-w-sm">
                  We've sent a 6-digit verification code to <br/>
                  <span className="font-bold text-[#1A1A1A]">{maskPhoneNumber(accountData?.phone || '')}</span>
                </p>

                <div className="flex gap-2 sm:gap-3 mb-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-[#1A1A1A] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#D96A27] focus:shadow-[0_0_0_4px_rgba(217,106,39,0.1)] transition-all shadow-sm"
                    />
                  ))}
                </div>

                <button id="verify-otp-btn" onClick={verifyOtp}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full max-w-sm h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mb-6"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-[14px] font-medium text-[#6B7280]">
                      Resend code in <span className="font-bold text-[#D96A27]">{countdown}s</span>
                    </p>
                  ) : (
                    <button 
                      onClick={resendOtp}
                      className="text-[14px] font-bold text-[#D96A27] hover:text-[#c45a1f] transition-colors underline decoration-[#D96A27]/30 decoration-2 underline-offset-4"
                    >
                      Resend Code
                    </button>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-[13px] font-medium text-[#4B5563] hover:text-[#1A1A1A] transition-colors"
                    >
                      Change phone number
                    </button>
                  </div>
                  <p className="text-[12px] text-[#9CA3AF] mt-3">Code expires after 5 minutes.</p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="flex flex-col items-center py-10"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Congratulations!</h2>
                <p className="text-[#666] text-center mb-8 max-w-sm text-lg">
                  Your account has been created successfully.
                </p>

                <Link
                  to="/dashboard"
                  className="w-full max-w-sm h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Shopping <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {step < 4 && (
        <div className="text-center mt-8">
          <p className="text-[15px] font-medium text-[#6B7280]">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#D96A27] hover:text-[#c45a1f] transition-colors underline decoration-[#D96A27]/30 decoration-2 underline-offset-4 hover:decoration-[#D96A27]">
              Log in here
            </Link>
          </p>
        </div>
      )}

    </div>
  );
}
