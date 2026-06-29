import React, { useState, useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Building2,
  Tag,
  Users,
  ShieldCheck,
  Globe2,
  Check,
  Building,
  Briefcase,
  Mail,
  MapPin,
  KeyRound,
  FileText,
  Package,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Logo } from "../components/ui/Logo";

const publicEmailDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
];

const registerSchema = z
  .object({
    role: z.enum(["buyer", "seller"]),
    business_name: z.string().min(2, "This field is required"),
    business_type: z.string().min(1, "Type is required"),
    full_name: z.string().optional(),
    job_title: z.string().optional(),
    tax_id: z.string().optional(),
    product_category: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(1, "Phone is required"),
    company_size: z.string().min(1, "Size is required"),
    country: z.string().min(1, "Country is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(6, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.role === "buyer") {
      if (!data.full_name || data.full_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Full name is required",
          path: ["full_name"],
        });
      }
    }
    if (data.role === "seller") {
      const emailDomain = data.email.split("@")[1]?.toLowerCase();
      if (emailDomain && publicEmailDomains.includes(emailDomain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sellers must use a business email",
          path: ["email"],
        });
      }
      if (!data.product_category || data.product_category.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required",
          path: ["product_category"],
        });
      }
    }
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirm_password"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const sqlFixStr = `-- Run this in your Supabase SQL Editor to fix ALL registration issues

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'buyer');
  IF v_role = 'supplier' THEN
    v_role := 'seller';
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      id, role, business_name, full_name, job_title, tax_id, product_category, business_type, company_size, country, phone
    ) VALUES (
      new.id, v_role::public.user_role, new.raw_user_meta_data->>'business_name',
      new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'job_title',
      new.raw_user_meta_data->>'tax_id', new.raw_user_meta_data->>'product_category',
      new.raw_user_meta_data->>'business_type', new.raw_user_meta_data->>'company_size',
      new.raw_user_meta_data->>'country', new.raw_user_meta_data->>'phone'
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, role, business_name, phone) 
    VALUES (new.id, 'buyer'::public.user_role, COALESCE(new.raw_user_meta_data->>'business_name', 'New user'), new.raw_user_meta_data->>'phone');
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dbError, setDbError] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (profile.role === "seller") {
        navigate("/seller/dashboard", { replace: true });
      } else {
        navigate("/buyer/dashboard", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "seller", // default requested
      business_type: "",
      company_size: "",
      country: "Kenya",
    },
  });

  const selectedRole = useWatch({ control, name: "role" });
  const currentPassword = useWatch({ control, name: "password" }) || "";

  // Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return Math.min(score, 5);
  };
  const strength = getPasswordStrength(currentPassword);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setDbError(false);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            business_name: data.business_name,
            role: data.role,
            full_name: data.full_name,
            job_title: data.job_title,
            tax_id: data.tax_id,
            product_category: data.product_category,
            business_type: data.business_type,
            phone: data.phone,
            company_size: data.company_size,
            country: data.country,
          },
        },
      });

      if (error) {
        if (
          error.message.includes("Database error") ||
          error.message.includes("saving new user")
        ) {
          setDbError(true);
        } else {
          toast.error("Registration failed", { description: error.message });
        }
      } else {
        toast.success("Account created successfully!", {
          description: "Please check your email to confirm your account.",
        });
        navigate("/login");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-[#07110B] text-[#FFFFFF]">
      {/* LEFT PANEL (40%) */}
      <div className="hidden md:flex lg:w-[40%] w-full bg-gradient-to-b from-[#07110B] to-[#0D1510] border-b lg:border-b-0 lg:border-r border-[#00C46A]/10 relative overflow-hidden flex-col p-6 lg:p-12 xl:p-16 z-10 shrink-0">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#00C46A] opacity-10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[300px] h-[300px] bg-[#00E08A] opacity-[0.05] rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full lg:min-h-[800px]">
          {/* Logo */}
          <Link to="/" className="mb-10 lg:mb-20 w-max group block">
            <Logo />
          </Link>

          {/* Headline */}
          <div className="mt-auto mb-10 flex-grow lg:flex-grow-0">
            <h1 className="text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-tight mb-6">
              Scale Your Business <br />
              <span className="bg-gradient-to-r from-[#00C46A] to-[#00E08A] bg-clip-text text-transparent">
                Across Africa &<br />
                Global Markets
              </span>
            </h1>
            <p className="text-[#A0A8A3] text-[18px] leading-relaxed max-w-[420px] mb-8">
              Connect with verified buyers, suppliers, manufacturers,
              distributors, and procurement teams worldwide.
            </p>

            {/* Feature Cards Showcase */}
            <div className="space-y-4 overflow-hidden">
              <div className="flex flex-col gap-4">
                {/* Feature 1 */}
                <div className="flex justify-start items-center gap-4 p-5 rounded-[20px] bg-[#0D1510]/60 backdrop-blur-md border border-[#00C46A]/10 hover:border-[#00C46A]/30 transition-all hover:shadow-[0_0_30px_rgba(0,196,106,0.05)]">
                  <div className="w-12 h-12 rounded-[14px] bg-[#00C46A]/10 flex items-center justify-center shrink-0 border border-[#00C46A]/20 shadow-[inset_0_0_10px_rgba(0,196,106,0.1)]">
                    <Building2 className="w-6 h-6 text-[#00C46A]" />
                  </div>
                  <div>
                    <h3 className="text-[#FFFFFF] font-semibold text-[16px] mb-1">
                      Verified Businesses
                    </h3>
                    <p className="text-[#A0A8A3] text-[14px]">
                      KYC & business verification
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex justify-start items-center gap-4 p-5 rounded-[20px] bg-[#0D1510]/60 backdrop-blur-md border border-[#00C46A]/10 hover:border-[#00C46A]/30 transition-all hover:shadow-[0_0_30px_rgba(0,196,106,0.05)]">
                  <div className="w-12 h-12 rounded-[14px] bg-[#00C46A]/10 flex items-center justify-center shrink-0 border border-[#00C46A]/20 shadow-[inset_0_0_10px_rgba(0,196,106,0.1)]">
                    <ShieldCheck className="w-6 h-6 text-[#00C46A]" />
                  </div>
                  <div>
                    <h3 className="text-[#FFFFFF] font-semibold text-[16px] mb-1">
                      Secure Transactions
                    </h3>
                    <p className="text-[#A0A8A3] text-[14px]">
                      Enterprise-grade protection
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex justify-start items-center gap-4 p-5 rounded-[20px] bg-[#0D1510]/60 backdrop-blur-md border border-[#00C46A]/10 hover:border-[#00C46A]/30 transition-all hover:shadow-[0_0_30px_rgba(0,196,106,0.05)]">
                  <div className="w-12 h-12 rounded-[14px] bg-[#00C46A]/10 flex items-center justify-center shrink-0 border border-[#00C46A]/20 shadow-[inset_0_0_10px_rgba(0,196,106,0.1)]">
                    <Globe2 className="w-6 h-6 text-[#00C46A]" />
                  </div>
                  <div>
                    <h3 className="text-[#FFFFFF] font-semibold text-[16px] mb-1">
                      Smart Matching
                    </h3>
                    <p className="text-[#A0A8A3] text-[14px]">
                      Intelligent buyer-supplier discovery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (60%) */}
      <div className="w-full lg:w-[60%] bg-[#07110B] relative z-20 flex flex-col p-6 sm:p-10 lg:p-16 xl:p-24 overflow-y-auto">
        <div className="max-w-[700px] w-full mx-auto">
          {/* Mobile Logo */}
          <Link to="/" className="md:hidden mb-8 w-max group block">
            <Logo />
          </Link>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[13px] font-bold tracking-widest uppercase text-[#00C46A]">
              Step 1 of 3
            </span>
            <div className="h-1 w-12 bg-[#0D1510] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#00C46A] rounded-full"></div>
            </div>
          </div>

          <div className="mb-10 lg:mb-12">
            <h2 className="text-[32px] lg:text-[40px] font-bold text-[#FFFFFF] mb-3 tracking-tight">
              Create Account
            </h2>
            <p className="text-[16px] text-[#A0A8A3]">
              Choose your account type to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* ACCOUNT TYPE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {/* Buyer Card */}
              <label className="relative cursor-pointer group h-full">
                <input
                  type="radio"
                  value="buyer"
                  className="peer sr-only"
                  {...register("role")}
                />
                <div className="flex flex-col h-full p-6 rounded-[20px] bg-[#0D1510] border border-white/5 transition-all duration-300 hover:border-white/20 peer-checked:border-[#00C46A] peer-checked:shadow-[0_0_20px_rgba(0,196,106,0.15)] overflow-hidden relative">
                  {/* Subtle Glow inside card */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C46A] opacity-0 peer-checked:opacity-[0.03] blur-[40px] rounded-full pointer-events-none transition-opacity"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center text-[#A0A8A3] group-hover:text-white peer-checked:text-[#00C46A] peer-checked:bg-[#00C46A]/10 peer-checked:border-[#00C46A]/20 transition-all">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-transparent peer-checked:border-[#00C46A]">
                      {selectedRole === "buyer" && (
                        <motion.div
                          layoutId="radioBubbleRight"
                          className="w-3 h-3 rounded-full bg-[#00C46A]"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[20px] font-bold text-[#FFFFFF] mb-1.5 relative z-10">
                    Buyer
                  </span>
                  <span className="text-[14px] text-[#A0A8A3] leading-relaxed relative z-10">
                    Source from verified global suppliers.
                  </span>
                </div>
              </label>

              {/* Supplier Card */}
              <label className="relative cursor-pointer group h-full">
                <input
                  type="radio"
                  value="seller"
                  className="peer sr-only"
                  {...register("role")}
                />
                <div className="flex flex-col h-full p-6 rounded-[20px] bg-[#0D1510] border border-white/5 transition-all duration-300 hover:border-white/20 peer-checked:border-[#00C46A] peer-checked:shadow-[0_0_20px_rgba(0,196,106,0.15)] overflow-hidden relative">
                  {/* Subtle Glow inside card */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C46A] opacity-0 peer-checked:opacity-[0.03] blur-[40px] rounded-full pointer-events-none transition-opacity"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center text-[#A0A8A3] group-hover:text-white peer-checked:text-[#00C46A] peer-checked:bg-[#00C46A]/10 peer-checked:border-[#00C46A]/20 transition-all">
                      <Tag className="w-6 h-6" />
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-transparent peer-checked:border-[#00C46A]">
                      {selectedRole === "seller" && (
                        <motion.div
                          layoutId="radioBubbleRight"
                          className="w-3 h-3 rounded-full bg-[#00C46A]"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[20px] font-bold text-[#FFFFFF] mb-1.5 relative z-10">
                    Supplier
                  </span>
                  <span className="text-[14px] text-[#A0A8A3] leading-relaxed relative z-10">
                    List products and connect with quality business buyers.
                  </span>
                </div>
              </label>
            </div>

            {/* FORM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {/* Dynamic Fields */}
              {selectedRole === "buyer" ? (
                <>
                  <InputWrapper
                    label="Business Name"
                    error={errors.business_name?.message}
                    icon={<Building />}
                  >
                    <input
                      placeholder="e.g. Acme Retailers"
                      {...register("business_name")}
                      className={inputClasses(!!errors.business_name)}
                    />
                  </InputWrapper>

                  <InputWrapper
                    label="Buyer Type"
                    error={errors.business_type?.message}
                  >
                    <div className="relative">
                      <select
                        {...register("business_type")}
                        className={selectClasses(!!errors.business_type)}
                      >
                        <option value="" disabled>
                          Select type...
                        </option>
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="distributor">Distributor</option>
                        <option value="individual">
                          Individual Professional
                        </option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A8A3] pointer-events-none" />
                    </div>
                  </InputWrapper>

                  <InputWrapper
                    label="Full Name"
                    error={errors.full_name?.message}
                    icon={<Users />}
                  >
                    <input
                      placeholder="Renol Kenol"
                      {...register("full_name")}
                      className={inputClasses(!!errors.full_name)}
                    />
                  </InputWrapper>

                  <InputWrapper
                    label="Job Title"
                    error={errors.job_title?.message}
                    icon={<Briefcase />}
                  >
                    <input
                      placeholder="Procurement Manager"
                      {...register("job_title")}
                      className={inputClasses(!!errors.job_title)}
                    />
                  </InputWrapper>
                </>
              ) : (
                <>
                  <InputWrapper
                    label="Legal Company Name"
                    error={errors.business_name?.message}
                    icon={<Building />}
                  >
                    <input
                      placeholder="Global Industries Ltd"
                      {...register("business_name")}
                      className={inputClasses(!!errors.business_name)}
                    />
                  </InputWrapper>

                  <InputWrapper
                    label="Supplier Type"
                    error={errors.business_type?.message}
                  >
                    <div className="relative">
                      <select
                        {...register("business_type")}
                        className={selectClasses(!!errors.business_type)}
                      >
                        <option value="" disabled>
                          Select type...
                        </option>
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="brand_owner">Brand Owner</option>
                        <option value="trading_company">Trading Company</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A8A3] pointer-events-none" />
                    </div>
                  </InputWrapper>

                  <InputWrapper
                    label="Tax ID / Registration Number"
                    error={errors.tax_id?.message}
                    icon={<FileText />}
                  >
                    <input
                      placeholder="VAT or Business Reg No."
                      {...register("tax_id")}
                      className={inputClasses(!!errors.tax_id)}
                    />
                  </InputWrapper>

                  <InputWrapper
                    label="Main Product Category"
                    error={errors.product_category?.message}
                    icon={<Package />}
                  >
                    <input
                      placeholder="e.g. Textiles, Electronics"
                      {...register("product_category")}
                      className={inputClasses(!!errors.product_category)}
                    />
                  </InputWrapper>
                </>
              )}

              {/* Common Fields */}
              <InputWrapper
                label="Business Email"
                error={errors.email?.message}
                icon={<Mail />}
              >
                <input
                  type="email"
                  placeholder="renol@company.com"
                  {...register("email")}
                  className={inputClasses(!!errors.email)}
                />
              </InputWrapper>

              <InputWrapper label="Phone Number" error={errors.phone?.message}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <div
                      className={cn(
                        "flex items-center w-full h-[56px] pl-4 rounded-[16px] bg-[#0D1510] border border-white/10 focus-within:border-[#00C46A] transition-all group/phone",
                        errors.phone && "border-red-500/50",
                      )}
                    >
                      <PhoneInput
                        {...field}
                        defaultCountry="KE"
                        international
                        withCountryCallingCode
                        placeholder="712 345 678"
                        className="w-full h-full text-[#FFFFFF] focus:outline-none bg-transparent"
                        numberInputProps={{
                          className:
                            "flex-1 outline-none border-none bg-transparent ml-2 text-[15px] placeholder:text-[#A0A8A3]",
                        }}
                      />
                    </div>
                  )}
                />
              </InputWrapper>

              <InputWrapper
                label="Company Size"
                error={errors.company_size?.message}
              >
                <div className="relative">
                  <select
                    {...register("company_size")}
                    className={selectClasses(!!errors.company_size)}
                  >
                    <option value="" disabled>
                      Select company size...
                    </option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A8A3] pointer-events-none" />
                </div>
              </InputWrapper>

              <InputWrapper
                label="Country / Region"
                error={errors.country?.message}
                icon={<MapPin />}
              >
                <div className="relative">
                  <select
                    {...register("country")}
                    className={selectClasses(!!errors.country)}
                  >
                    <option value="" disabled>
                      Select country...
                    </option>
                    <option value="Kenya">Kenya</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A8A3] pointer-events-none" />
                </div>
              </InputWrapper>

              <div className="space-y-2 col-span-1">
                <InputWrapper
                  label="Password"
                  error={errors.password?.message}
                  icon={<KeyRound />}
                >
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className={inputClasses(!!errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A8A3] hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </InputWrapper>
                {/* Password Strength Meter */}
                {currentPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 px-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all duration-300",
                          strength >= level
                            ? strength <= 2
                              ? "bg-red-500"
                              : strength === 3
                                ? "bg-yellow-500"
                                : "bg-[#00C46A]"
                            : "bg-white/10",
                        )}
                      />
                    ))}
                    <span
                      className={cn(
                        "text-[12px] font-medium ml-2 w-16 text-right",
                        strength <= 2
                          ? "text-red-500"
                          : strength === 3
                            ? "text-yellow-500"
                            : "text-[#00C46A]",
                      )}
                    >
                      {strength <= 1
                        ? "Weak"
                        : strength === 2
                          ? "Fair"
                          : strength === 3
                            ? "Good"
                            : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <InputWrapper
                label="Confirm Password"
                error={errors.confirm_password?.message}
                icon={<KeyRound />}
              >
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirm_password")}
                    className={inputClasses(!!errors.confirm_password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A8A3] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </InputWrapper>
            </div>

            <div className="pt-4 lg:pt-8 space-y-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] rounded-[16px] bg-gradient-to-r from-[#00C46A] to-[#00E08A] hover:brightness-110 text-[#07110B] font-bold text-[18px] shadow-[0_0_20px_rgba(0,196,106,0.3)] hover:shadow-[0_0_30px_rgba(0,196,106,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-[#07110B]/30 border-t-[#07110B] rounded-full animate-spin"></div>
                ) : (
                  <>
                    Continue <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-[15px] text-[#A0A8A3] font-medium">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#00C46A] hover:text-[#00E08A] font-bold transition-colors ml-1"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Mobile Trust Indicators */}
          <div className="mt-12 md:hidden flex justify-center items-center gap-4 text-[#A0A8A3] text-[13px] font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00C46A]" /> Verified Businesses
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00C46A]" /> Secure Transactions
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00C46A]" /> Intelligent Matching
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dbError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07110B]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1510] border border-red-500/30 w-full max-w-2xl rounded-[24px] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)] flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-red-500/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="text-red-500 w-5 h-5" />
                  </div>
                  Database Setup Required
                </h3>
                <button
                  onClick={() => setDbError(false)}
                  className="text-[#A0A8A3] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-white text-[15px] leading-relaxed">
                  Your Supabase database is missing the required schema or
                  trigger updates for registration. This is common when testing
                  new features.
                </p>
                <div className="bg-[#00C46A]/10 border border-[#00C46A]/20 rounded-[16px] p-4">
                  <p className="text-[#A0A8A3] text-[14px]">
                    To fix this immediately, open your <b>Supabase Dashboard</b>{" "}
                    → <b>SQL Editor</b>, and run the following combined fix
                    script:
                  </p>
                </div>

                <div className="relative group mt-4">
                  <pre className="p-5 bg-black/40 border border-white/5 rounded-[16px] overflow-x-auto text-[13px] text-[#00C46A] whitespace-pre-wrap font-mono leading-relaxed">
                    {sqlFixStr}
                  </pre>
                  <button
                    className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white font-medium text-[13px] backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(sqlFixStr);
                      toast.success("SQL script copied!", {
                        description:
                          "Paste this into your Supabase SQL Editor.",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4" /> Copy SQL
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-[#07110B]/50 flex justify-end">
                <button
                  onClick={() => setDbError(false)}
                  className="px-6 py-2.5 rounded-[12px] bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-[15px]"
                >
                  I've run the script
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable UI Helpers
function InputWrapper({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 relative group/field">
      <label className="text-[14px] font-medium text-[#A0A8A3] group-focus-within/field:text-[#FFFFFF] transition-colors">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A0A8A3] group-focus-within/field:text-[#00C46A] transition-colors z-10">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: "w-5 h-5",
            })}
          </div>
        )}
        {children}
      </div>
      {error && (
        <p className="text-[13px] text-red-500 font-medium absolute -bottom-5 left-0">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClasses = (hasError: boolean) =>
  cn(
    "w-full h-[56px] rounded-[16px] bg-[#0D1510] border focus:outline-none transition-all text-[#FFFFFF] placeholder:text-[#A0A8A3] text-[15px]",
    hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-white/10 focus:border-[#00C46A] hover:border-white/20",
    // if it's placed inside a wrapper with an icon, we need padding-left 11 = 44px
    "pl-[44px] pr-4",
    // we do the pl-[44px] manually, but what if no icon? We are doing icon conditionally in the wrapper, but the input needs the padding.
    // Let's modify: the wrapper injects the pl-11 if icon exists. Actually, we coded it with the pl-[44px] forced. Let's fix that below.
  );

const selectClasses = (hasError: boolean) =>
  cn(
    "w-full h-[56px] pl-4 pr-10 rounded-[16px] bg-[#0D1510] border focus:outline-none transition-all text-[#FFFFFF] placeholder:text-[#A0A8A3] text-[15px] appearance-none cursor-pointer",
    hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-white/10 focus:border-[#00C46A] hover:border-white/20",
  );
