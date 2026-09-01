const fs = require('fs');

const code = `import { Link, useLocation } from "react-router-dom";
import { Home, Store, MessageCircle, User, ShoppingCart, Package, Menu, X, ShieldCheck, LogOut, Tags, LayoutDashboard, Truck, Heart, Gift, Ticket, CreditCard, MapPin, Bell, Headphones, Settings, FolderTree } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useMobileMenuStore } from "../../store/useMobileMenuStore";
import { getWhatsAppLink } from "../../utils/whatsapp";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";

export function MobileBottomNav() {
  const location = useLocation();
  const { user, profile } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  
  const { isOpen, setIsOpen } = useMobileMenuStore();
  
  const dashboardPath = user ? \`/\${profile?.role || "buyer"}/dashboard\` : "/login";

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(console.error);
    setIsOpen(false);
  };

  const isPremium = profile?.role === "seller" && profile?.verified;

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/products", icon: Store },
    { name: "Cart", href: "/cart", icon: ShoppingCart },
    { name: "Orders", href: "/buyer/dashboard/orders", icon: Package },
    { name: "More", href: "#", icon: Menu, action: () => setIsOpen(true) },
  ];

  const moreItems = [
    { icon: FolderTree, label: "Categories", path: "/categories" },
    { icon: Truck, label: "Track Delivery", path: "/buyer/dashboard/track" },
    { icon: Heart, label: "Wishlist", path: "/wishlist" },
    { icon: Gift, label: "Rewards", path: "/buyer/dashboard/rewards" },
    { icon: Ticket, label: "Coupons", path: "/buyer/dashboard/coupons" },
    { icon: CreditCard, label: "Payment Methods", path: "/buyer/dashboard/payments" },
    { icon: MapPin, label: "Delivery Addresses", path: "/buyer/dashboard/addresses" },
    { icon: Bell, label: "Notifications", path: "/buyer/dashboard/notifications" },
    { icon: MessageCircle, label: "WhatsApp Ordering", action: "whatsapp" },
    { icon: Headphones, label: "Help Center", path: "/help-center" },
    { icon: Settings, label: "Settings", path: "/buyer/dashboard/settings" },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border pb-safe transition-transform duration-300 transform translate-y-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/" && item.href !== "#" && location.pathname.startsWith(item.href));
            
            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                    isOpen ? "text-[#C65A28]" : "text-[#5F5A54] hover:text-[#3A2418]"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isOpen ? "stroke-[2.5px]" : "stroke-2")} />
                  <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
                </button>
              );
            }

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

      {/* More Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-[110] w-[85vw] max-w-sm bg-card border-r border-border shadow-2xl flex flex-col md:hidden pb-16"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                {user ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {profile?.first_name || profile?.email || "Customer"}
                      {isPremium && <ShieldCheck className="h-4 w-4 text-[#D9A62E] shrink-0" />}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {isPremium ? "Premium Seller" : "Customer Profile"}
                    </span>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsOpen(false)} className="text-sm font-bold text-[#C65A28]">
                    Sign In / Register
                  </Link>
                )}
                <button
                  className="p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {/* Desktop Sidebar features are available here */}
                {user && (
                   <Link
                      to="/buyer/dashboard"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-all focus:outline-none",
                        location.pathname === "/buyer/dashboard" ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                  </Link>
                )}
                {moreItems.map((item) => {
                  if (item.action === "whatsapp") {
                    return (
                      <a
                        key={item.label}
                        href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-6 py-3.5 text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-[#25D366] transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </a>
                    );
                  }
                  
                  // For routes that require login, maybe just let router handle it
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-all focus:outline-none",
                        location.pathname === item.path ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
`;

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
console.log("Written MobileBottomNav");
