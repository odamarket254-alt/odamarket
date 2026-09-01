import { useState, useEffect } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useMobileMenuStore } from "../../store/useMobileMenuStore";
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
import { getWhatsAppLink } from "../../utils/whatsapp";
import { NotificationBell } from "./NotificationBell";
import { MobileBottomNav } from "./MobileBottomNav";
import { Logo } from "../ui/Logo";
import { getNavItems } from "../../utils/navigation";

export default function DashboardLayout() {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();
  const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenuStore();

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
    await supabase.auth.signOut().catch(console.error);
  };

  const navItems = getNavItems(profile?.role, profile?.verified);

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
                {profile?.first_name || profile?.email || "Customer"}
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

            if (item.action === "whatsapp") {
              return (
                <a
                  key={item.label}
                  href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:text-[#25D366]"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </a>
              );
            }

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
        {/* Drawer is now handled globally by MobileBottomNav */}

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
