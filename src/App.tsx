/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/Sonner";
import { useEffect, Suspense, lazy } from "react";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/useAuthStore";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Layouts
import RootLayout from "./components/layout/RootLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import RoleRedirect from "./components/layout/RoleRedirect";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Lazy Loaded Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const SupplierProfilePage = lazy(() => import("./pages/SupplierProfilePage"));

// Lazy Loaded Dashboard Pages
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const InquiriesPage = lazy(() => import("./pages/dashboard/InquiriesPage"));
const SupportMessagesPage = lazy(() => import("./pages/dashboard/SupportMessagesPage"));
const DashboardProductsPage = lazy(() => import("./pages/dashboard/SellerProductsPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const UsersPage = lazy(() => import("./pages/dashboard/UsersPage"));

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading Odamarket...</p>
    </div>
  );
}

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && retries > 0 && error.code === "PGRST116") {
        // PostgREST 116 is "Rows count does not match the expected 1" (not found)
        setTimeout(() => fetchProfile(userId, retries - 1), 500);
        return;
      }

      if (!error && data) {
        // Fallback for legacy setups
        const normalizedRole = data.role === "supplier" ? "seller" : data.role;
        setProfile({ ...data, role: normalizedRole });
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route path="/suppliers/:id" element={<SupplierProfilePage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Role Routing Interceptor */}
          <Route path="/dashboard" element={<RoleRedirect />} />

          {/* Buyer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
            <Route path="/buyer/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Seller Routes */}
          <Route element={<ProtectedRoute allowedRoles={["seller"]} />}>
            <Route path="/seller/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="products" element={<DashboardProductsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="products" element={<DashboardProductsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="support" element={<SupportMessagesPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
