/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import RootLayout from './components/layout/RootLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRedirect from './components/layout/RoleRedirect';

import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome';
import InquiriesPage from './pages/dashboard/InquiriesPage';
import DashboardProductsPage from './pages/dashboard/ProductsPage';
import SettingsPage from './pages/dashboard/SettingsPage';

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && retries > 0 && error.code === 'PGRST116') {
        // PostgREST 116 is "Rows count does not match the expected 1" (not found)
        setTimeout(() => fetchProfile(userId, retries - 1), 500);
        return;
      }
      
      if (!error && data) {
        // Fallback for legacy setups
        const normalizedRole = data.role === 'supplier' ? 'seller' : data.role;
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
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
        </Route>
        
        {/* Role Routing Interceptor */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Buyer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
          <Route path="/buyer/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Seller Routes */}
        <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
          <Route path="/seller/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="products" element={<DashboardProductsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="products" element={<DashboardProductsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
