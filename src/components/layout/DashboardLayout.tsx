import { useState, useEffect } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  Store,
  Heart,
  ShoppingCart,
  Ticket,
  LayoutDashboard,
  Inbox,
  Package,
  Settings,
  LogOut,
  Loader2,
  Menu,
  X,
  Users,
  ShieldCheck,
  FolderTree,
  FileText,
  Bell,
  BarChart,
  FileEdit,
  HardDrive,
  Terminal,
  List,
  Cpu,
  MessageSquare,
  Tags,
  Archive,
  Image as ImageIcon,
  Megaphone,
  StarHalf,
} from "lucide-react";
import { Truck, RefreshCcw, MapPin, CreditCard, Gift, Star, User, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { NotificationBell } from "./NotificationBell";
import { MobileBottomNav } from "./MobileBottomNav";
import { Logo } from "../ui/Logo";

export default function DashboardLayout() {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMobileMenuOpen(false);
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "";
      
    }
  }, [isMobileMenuOpen]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      case "seller":
        return [
          {
            icon: LayoutDashboard,
            label: "Overview",
            path: "/seller/dashboard",
          },
          {
            icon: Inbox,
            label: "Inquiries",
            path: "/seller/dashboard/inquiries",
          },
          {
            icon: Package,
            label: "Products",
            path: "/seller/dashboard/products",
          },
          {
            icon: FileText,
            label: "RFQ Center",
            path: "/seller/dashboard/rfqs",
          },
          {
            icon: Settings,
            label: "Settings",
            path: "/seller/dashboard/settings",
          },
        ];
      case "super_admin":
      case "moderator":
      case "support_agent":
      case "content_manager":
      case "admin": {
        const baseAdminNav = [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            path: "/admin/dashboard",
          },
          {
            icon: Users,
            label: "Users",
            path: "/admin/dashboard/users",
          },
          {
            icon: Package,
            label: "Products",
            path: "/admin/dashboard/products",
          },
          {
            icon: Inbox,
            label: "Orders",
            path: "/admin/dashboard/orders",
          },
          {
            icon: FileText,
            label: "Discounts & Coupons",
            path: "/admin/dashboard/discounts",
          },
          {
            icon: FolderTree,
            label: "Categories",
            path: "/admin/dashboard/categories",
          },
          {
            icon: Tags,
            label: "Brands",
            path: "/admin/dashboard/brands",
          },
          {
            icon: Archive,
            label: "Inventory",
            path: "/admin/dashboard/inventory",
          },
          {
            icon: Megaphone,
            label: "Marketing Center",
            path: "/admin/dashboard/marketing",
          },
          {
            icon: MessageSquare,
            label: "Support",
            path: "/admin/dashboard/support",
          },
          {
            icon: StarHalf,
            label: "Reviews",
            path: "/admin/dashboard/reviews",
          },
          {
            icon: FileEdit,
            label: "CMS (Content)",
            path: "/admin/dashboard/content",
          },
          {
            icon: ImageIcon,
            label: "Media Library",
            path: "/admin/dashboard/media",
          },
          {
            icon: BarChart,
            label: "Analytics",
            path: "/admin/dashboard/reports",
          },
        ];
        
        // Super admin gets additional sensitive modules
        if (profile?.role === "super_admin") {
          baseAdminNav.push(
            {
              icon: Cpu,
              label: "AI Management",
              path: "/admin/dashboard/ai",
            },
            {
              icon: Bell,
              label: "Notification Center",
              path: "/admin/dashboard/notifications",
            },
            {
              icon: ShieldCheck,
              label: "Security Center",
              path: "/admin/dashboard/security",
            },
            {
              icon: HardDrive,
              label: "Storage Management",
              path: "/admin/dashboard/storage",
            },
            {
              icon: Terminal,
              label: "Developer Tools",
              path: "/admin/dashboard/developer",
            },
            {
              icon: List,
              label: "Audit Logs",
              path: "/admin/dashboard/audit",
            },
            {
              icon: Settings,
              label: "System Settings",
              path: "/admin/dashboard/settings",
            }
          );
        } else if (profile?.role === "admin") {
          baseAdminNav.push({
            icon: Settings,
            label: "Settings",
            path: "/admin/dashboard/settings",
          });
        }
        
        return baseAdminNav;
      }
      case "buyer":
      case "customer":
      default:
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/buyer/dashboard" },
          { icon: Store, label: "Shop", path: "/products" },
          { icon: FolderTree, label: "Categories", path: "/categories" },
          { icon: Package, label: "My Orders", path: "/buyer/dashboard/orders" },
          { icon: Truck, label: "Track Delivery", path: "/buyer/dashboard/track" },
          { icon: Heart, label: "Wishlist", path: "/wishlist" },
          { icon: ShoppingCart, label: "Shopping Cart", path: "/cart" },
          { icon: Gift, label: "Rewards", path: "/buyer/dashboard/rewards" },
          { icon: Ticket, label: "Coupons", path: "/buyer/dashboard/coupons" },
          { icon: CreditCard, label: "Payment Methods", path: "/buyer/dashboard/payments" },
          { icon: MapPin, label: "Delivery Addresses", path: "/buyer/dashboard/addresses" },
          { icon: Bell, label: "Notifications", path: "/buyer/dashboard/notifications" },
          { icon: Settings, label: "Settings", path: "/buyer/dashboard/settings" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-[100dvh] flex bg-background font-sans text-foreground w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col sticky top-0 h-[100dvh]">
        <div className="p-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        <div
          className={cn(
            "px-6 py-4 border-b",
            profile?.role === "seller" && profile?.verified
              ? "border-[#D9A62E]/20 bg-[#D9A62E]/5"
              : "border-border",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                {profile?.full_name || profile?.email || "Customer"}
                {profile?.role === "seller" && profile?.verified && (
                  <ShieldCheck className="h-4 w-4 text-[#D9A62E] dark:text-[#D9A62E] shrink-0" />
                )}
              </p>
              <p
                className={cn(
                  "text-xs capitalize",
                  profile?.role === "seller" && profile?.verified
                    ? "text-[#D9A62E]/80 font-medium"
                    : "text-muted-foreground",
                )}
              >
                {profile?.role === "seller" && profile?.verified
                  ? "Premium Seller"
                  : `Customer Profile`}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            const isPremium = profile?.role === "seller" && profile?.verified;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? isPremium
                      ? "bg-[#D9A62E]/10 text-[#D9A62E] dark:text-[#D9A62E]"
                      : "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? isPremium
                        ? "text-[#D9A62E] dark:text-[#D9A62E]"
                        : "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-[#B94A48]/100/10"
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
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
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
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 z-[110] w-[85vw] max-w-sm bg-card border-r border-border shadow-2xl flex flex-col md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                <div
                  className={cn(
                    "flex items-center justify-between p-4 border-b",
                    profile?.role === "seller" && profile?.verified
                      ? "border-[#D9A62E]/20 bg-[#D9A62E]/5"
                      : "border-border",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {profile?.full_name || profile?.email || "Customer"}
                      {profile?.role === "seller" && profile?.verified && (
                        <ShieldCheck className="h-4 w-4 text-[#D9A62E] dark:text-[#D9A62E] shrink-0" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs capitalize",
                        profile?.role === "seller" && profile?.verified
                          ? "text-[#D9A62E]/80 font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {profile?.role === "seller" && profile?.verified
                        ? "Premium Seller"
                        : `Customer Profile`}
                    </span>
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
                    const isPremium =
                      profile?.role === "seller" && profile?.verified;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all focus:outline-none",
                          isActive
                            ? isPremium
                              ? "bg-[#D9A62E]/10 text-[#D9A62E] dark:text-[#D9A62E] focus:ring-2 focus:ring-[#D9A62E]"
                              : "bg-primary/10 text-primary focus:ring-2 focus:ring-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            isActive
                              ? isPremium
                                ? "text-[#D9A62E] dark:text-[#D9A62E]"
                                : "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border bg-muted/50 text-foreground flex flex-col gap-3">
                  <Button
                    render={<Link to="/" />}
                    className="w-full bg-muted/50 hover:bg-muted text-foreground border border-border h-12"
                  >
                    Back to Market
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-[#B94A48] hover:text-red-400 hover:bg-[#B94A48]/100/10 justify-start h-12"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
