import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminDashboardLayout() {
  const { user, profile, isLoading: loading } = useAuthStore();
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from local storage if available
    const saved = localStorage.getItem('oda_admin_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Trigger navigation transition
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('oda_admin_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (loading || (!profile && user)) {
    return (
      <div className="min-h-screen bg-[#F3F6F4] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#C65A28] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[#3A2418]">Loading OdaMarket...</h2>
        <p className="text-[#5F5A54] mt-2">Initializing administrative workspace</p>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const role = profile.role || 'customer';

  // Prevent regular users from accessing admin
  if (role === 'customer' || role === 'buyer') {
    return <Navigate to="/" replace />;
  }

  // If supplier, maybe redirect to supplier dashboard if they hit /admin/dashboard exactly
  // Or handle it within the routes. We'll let the routes handle it for now.

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed} 
        setIsOpen={setSidebarOpen} 
        setIsCollapsed={setSidebarCollapsed}
        userRole={role}
      />

      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <AdminHeader user={user} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
               {isNavigating && (
                 <div className="fixed top-0 left-0 right-0 h-1 bg-[#C65A28]/20 z-50">
                    <motion.div 
                      className="h-full bg-[#C65A28]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                 </div>
               )}
               <Outlet />
             </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
