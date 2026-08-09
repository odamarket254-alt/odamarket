const fs = require('fs');
const file = 'src/components/layout/admin/AdminDashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import React, \{ useState, useEffect \} from 'react';\nimport \{ Outlet, Navigate, useLocation \} from 'react-router-dom';/g,
  "import React, { useState, useEffect } from 'react';\nimport { Outlet, Navigate, useLocation } from 'react-router-dom';\nimport { useAuthStore } from '../../../store/useAuthStore';"
);

// We need to replace the entire component logic down to the return
const toReplace = `export default function AdminDashboardLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) { 
          console.warn("Admin session error:", error.message);
        }

        if (session?.user) {
           setUser(session.user);
        } else {
           setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F4] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#C65A28] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[#3A2418]">Loading OdaMarket...</h2>
        <p className="text-[#5F5A54] mt-2">Initializing administrative workspace</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.user_metadata?.role || 'user';

  // Prevent regular users from accessing admin
  if (role === 'user' || role === 'customer') {
    return <Navigate to="/" replace />;
  }`;

const replacement = `export default function AdminDashboardLayout() {
  const { user, profile, isLoading } = useAuthStore();
  
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

  if (isLoading || (!profile && user)) {
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
  if (role === 'user' || role === 'customer' || role === 'buyer') {
    return <Navigate to="/" replace />;
  }`;

content = content.replace(toReplace, replacement);
fs.writeFileSync(file, content);
