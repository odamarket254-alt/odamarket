import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Package, Building2, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { toast } from "sonner";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  business_name: z.string().min(2, "This field is required"),
  role: z.enum(["buyer", "seller"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
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
      role: "buyer",
    },
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            business_name: data.business_name,
            role: data.role,
          },
        },
      });

      if (error) {
        toast.error("Registration failed", { description: error.message });
        setIsLoading(false);
      } else {
        toast.success("Account created!", {
          description: "Please check your email to confirm your account.",
        });
        setIsLoading(false);
        navigate("/login");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100dvh-4rem)] relative overflow-hidden bg-background">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <Card className="border-border bg-muted/50 text-foreground backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />

          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Join ODA Market
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Create an account to start your journey
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground/80">
                  Choose your account type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Label className="cursor-pointer relative block">
                    <input
                      type="radio"
                      value="buyer"
                      className="peer sr-only"
                      {...register("role")}
                    />
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-border/50 bg-card text-center transition-all duration-300 hover:bg-muted/50 hover:border-border peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:shadow-[0_8px_30px_rgba(16,185,129,0.15)]"
                    >
                      <div className="rounded-full bg-muted/50 text-foreground p-3 text-muted-foreground transition-all duration-300 peer-checked:bg-emerald-500/20 peer-checked:text-emerald-600 dark:text-emerald-500 peer-checked:scale-110">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground transition-colors duration-300 peer-checked:text-emerald-600 dark:text-emerald-400">
                          Buyer
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground transition-colors duration-300 peer-checked:text-emerald-600 dark:text-emerald-400/80">
                          Source products
                        </span>
                      </div>
                    </motion.div>
                  </Label>

                  <Label className="cursor-pointer relative block">
                    <input
                      type="radio"
                      value="seller"
                      className="peer sr-only"
                      {...register("role")}
                    />
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-border/50 bg-card text-center transition-all duration-300 hover:bg-muted/50 hover:border-border peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:shadow-[0_8px_30px_rgba(59,130,246,0.15)]"
                    >
                      <div className="rounded-full bg-muted/50 text-foreground p-3 text-muted-foreground transition-all duration-300 peer-checked:bg-blue-500/20 peer-checked:text-blue-500 peer-checked:scale-110">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground transition-colors duration-300 peer-checked:text-blue-400">
                          Seller
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground transition-colors duration-300 peer-checked:text-blue-400/80">
                          List & sell
                        </span>
                      </div>
                    </motion.div>
                  </Label>
                </div>
                {errors.role && (
                  <p className="text-xs text-red-500">{errors.role.message}</p>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2 relative">
                    <Label
                      htmlFor="business_name"
                      className="text-sm font-medium text-foreground/80"
                    >
                      {selectedRole === "seller"
                        ? "Company Name"
                        : "Full Name or Company"}
                    </Label>
                    <div className="relative">
                      {selectedRole === "seller" ? (
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      )}
                      <Input
                        id="business_name"
                        placeholder={
                          selectedRole === "seller"
                            ? "e.g. Acme Corp"
                            : "e.g. John Doe"
                        }
                        {...register("business_name")}
                        className={`pl-10 h-11 bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${errors.business_name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                    </div>
                    {errors.business_name && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.business_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground/80"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                      className={`h-11 bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground/80"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      className={`h-11 bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button
                type="submit"
                className={`w-full h-11 font-medium text-foreground shadow-lg transition-all ${
                  selectedRole === "seller"
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25"
                }`}
                disabled={isLoading}
              >
                {isLoading
                  ? "Creating account..."
                  : `Create ${selectedRole === "seller" ? "Seller" : "Buyer"} Account`}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center gap-2 border-t border-border bg-black/20 p-6">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
