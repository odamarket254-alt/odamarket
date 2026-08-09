const fs = require('fs');
const file = 'src/components/layout/admin/AdminDashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace local state auth with useAuthStore
content = content.replace(
  /export default function AdminDashboardLayout\(\) \{[\s\S]*?\/\/ Prevent regular users from accessing admin[\s\S]*?return <Navigate to="\/" replace \/>;\n  \}/,
  `export default function AdminDashboardLayout() {
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
  if (role === 'user' || role === 'customer' || role === 'buyer') {
    return <Navigate to="/" replace />;
  }`
);

fs.writeFileSync(file, content);
console.log("AdminDashboardLayout.tsx updated successfully.");
