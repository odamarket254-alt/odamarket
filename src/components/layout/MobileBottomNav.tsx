import { Link, useLocation } from "react-router-dom";
import { Home, Grid, MessageCircle, Store, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";

export function MobileBottomNav() {
  const location = useLocation();
  const { user, profile } = useAuthStore();
  
  const dashboardPath = user ? `/${profile?.role || "buyer"}/dashboard` : "/login";
  const messagesPath = user ? `/${profile?.role || "buyer"}/dashboard/inquiries` : "/login";

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Categories", href: "/products", icon: Grid },
    { name: "Messages", href: messagesPath, icon: MessageCircle },
    // { name: "Sellers", href: "/suppliers", icon: Store }, // if we have a suppliers route
    { name: "Profile", href: dashboardPath, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
