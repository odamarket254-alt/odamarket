import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Inbox, Package, Settings, LogOut, Loader2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';

export default function DashboardLayout() {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
      return () => {};
    }
  }, [isMobileMenuOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getNavItems = () => {
    switch (profile?.role) {
      case 'seller':
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/seller/dashboard' },
          { icon: Inbox, label: 'Inquiries', path: '/seller/dashboard/inquiries' },
          { icon: Package, label: 'Products', path: '/seller/dashboard/products' },
          { icon: Settings, label: 'Settings', path: '/seller/dashboard/settings' },
        ];
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Admin Overview', path: '/admin/dashboard' },
          { icon: Package, label: 'Manage Products', path: '/admin/dashboard/products' },
          { icon: Settings, label: 'Settings', path: '/admin/dashboard/settings' },
        ];
      case 'buyer':
      default:
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/buyer/dashboard' },
          { icon: Inbox, label: 'My Inquiries', path: '/buyer/dashboard/inquiries' },
          { icon: Settings, label: 'Settings', path: '/buyer/dashboard/settings' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-emerald-500/30 text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <span className="text-[#050505] font-bold text-lg leading-none">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ODA Market</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.business_name || 'My Business'}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'User'} Profile</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "text-muted-foreground hover:bg-muted/50 text-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-emerald-500" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <span className="text-[#050505] font-bold text-lg leading-none">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ODA Market</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile App Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 z-[110] w-[85vw] max-w-sm bg-card border-r border-border shadow-2xl flex flex-col md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate">{profile?.business_name || 'My Business'}</span>
                    <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'User'} Profile</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-foreground rounded-full bg-muted/50 text-foreground" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500",
                          isActive 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "text-muted-foreground hover:bg-muted/50 text-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", isActive ? "text-emerald-500" : "text-muted-foreground")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border bg-muted/50 text-foreground flex flex-col gap-3">
                  <Button render={<Link to="/" />} className="w-full bg-white/10 hover:bg-white/20 text-foreground border border-border h-12">
                     Back to Market
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }} 
                    className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 justify-start h-12"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
