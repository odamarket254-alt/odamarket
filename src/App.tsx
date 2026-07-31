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
import { CookieConsent } from "./components/ui/CookieConsent";
import OneSignal from 'react-onesignal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Layouts
import { Logo } from "./components/ui/Logo";
import RootLayout from "./components/layout/RootLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import AdminDashboardLayout from "./components/layout/admin/AdminDashboardLayout";
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
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));

// Lazy Loaded Dashboard Pages
const BuyerDashboardHome = lazy(() => import("./pages/dashboard/BuyerDashboardHome").then(m => ({ default: m.BuyerDashboardHome })));
const OrdersPage = lazy(() => import("./pages/dashboard/OrdersPage"));
const SupportMessagesPage = lazy(
  () => import("./pages/dashboard/SupportMessagesPage"),
);
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductFormPage = lazy(() => import("./pages/admin/AdminProductFormPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminOrdersPage = lazy(() => import("./pages/dashboard/AdminOrdersPage"));
const AdminDiscountsPage = lazy(() => import("./pages/dashboard/AdminDiscountsPage"));
const UsersPage = lazy(() => import("./pages/dashboard/UsersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCategoriesPage = lazy(
  () => import("./pages/dashboard/AdminCategoriesPage"),
);
const AdminStorefrontPage = lazy(() => import("./pages/admin/AdminStorefrontPage"));
const AdminDashboardHome = lazy(() => import("./pages/admin/AdminDashboardHome"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminSecurityPage = lazy(() => import("./pages/admin/AdminSecurityPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminAIPage = lazy(() => import("./pages/admin/AdminAIPage"));
const AdminContentPage = lazy(() => import("./pages/admin/AdminContentPage"));
const AdminMarketingPage = lazy(() => import("./pages/admin/AdminMarketingPage"));
const AdminBrandsPage = lazy(() => import("./pages/admin/AdminBrandsPage"));
const AdminInventoryPage = lazy(() => import("./pages/admin/AdminInventoryPage"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminMediaPage = lazy(() => import("./pages/admin/AdminMediaPage"));
const AdminStoragePage = lazy(() => import("./pages/admin/AdminStoragePage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminDeveloperPage = lazy(() => import("./pages/admin/AdminDeveloperPage"));
const AdminAuditPage = lazy(() => import("./pages/admin/AdminAuditPage"));

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FB]">
      <Logo className="w-[140px] md:w-[160px] animate-pulse" />
    </div>
  );
}

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    try {
      setTimeout(() => {
        OneSignal.init({ appId: "39cacdbe-4c1c-40fe-b763-4462f792edae" }).catch(e => console.warn("OneSignal failed to initialize", e));
      }, 2000);
    } catch (error) {
      console.warn("OneSignal initialization error:", error);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Session check error:", error.message);
          if (error.message.includes("Refresh Token") || error.message.includes("refresh_token")) {
            await supabase.auth.signOut().catch(() => {});
          }
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.warn("Session check failed", e);
      }
    };
    initSession();

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
        .select('*').limit(100)
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
    <QueryClientProvider client={queryClient}>
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
              <Route path="/c/:categorySlug" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
                                                        <Route path="/contact" element={<ContactPage />} />
                                                        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            </Route>

            {/* Role Routing Interceptor */}
            <Route path="/dashboard" element={<RoleRedirect />} />

            {/* Buyer Routes */}
            <Route element={<ProtectedRoute allowedRoles={["buyer", "customer"]} />}>
              <Route path="/buyer/dashboard" element={<DashboardLayout />}>
                <Route index element={<BuyerDashboardHome />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Seller Routes */}
            

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin", "moderator", "support_agent", "content_manager"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
                <Route index element={<AdminDashboardHome />} />
                <Route path="customers" element={<AdminUsersPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                                <Route path="storefront" element={<AdminStorefrontPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/:id" element={<AdminProductFormPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="discounts" element={<AdminDiscountsPage />} />
                                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="support" element={<SupportMessagesPage />} />
                <Route path="content" element={<AdminContentPage />} />
                <Route path="marketing" element={<AdminMarketingPage />} />
                <Route path="brands" element={<AdminBrandsPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="media" element={<AdminMediaPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="security" element={<AdminSecurityPage />} />
                <Route path="ai" element={<AdminAIPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="storage" element={<AdminStoragePage />} />
                <Route path="developer" element={<AdminDeveloperPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster position="top-center" richColors />
      <CookieConsent />
    </BrowserRouter>
    </QueryClientProvider>
  );
}
