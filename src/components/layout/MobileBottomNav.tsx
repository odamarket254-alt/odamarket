import { Link, useLocation } from "react-router-dom";
import { Home, Grid, MessageCircle, Store, User, ShoppingCart } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";

export function MobileBottomNav() {
  const location = useLocation();
  const { user, profile } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  
  const dashboardPath = user ? `/${profile?.role || "buyer"}/dashboard` : "/login";

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Categories", href: "/categories", icon: Grid },
    { name: "Cart", href: "/cart", icon: ShoppingCart },
    { name: "Profile", href: dashboardPath, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive ? "text-[#C65A28]" : "text-[#5F5A54] hover:text-[#3A2418]"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                {item.name === "Cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 w-4 bg-[#D9A62E] text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
