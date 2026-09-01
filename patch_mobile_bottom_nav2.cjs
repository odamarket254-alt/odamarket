const fs = require('fs');

const code = `import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Store, MessageCircle, User, ShoppingCart, Package, Menu, X, ShieldCheck, LogOut, Tags, LayoutDashboard, Truck, Heart, Gift, Ticket, CreditCard, MapPin, Bell, Headphones, Settings, FolderTree } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useMobileMenuStore } from "../../store/useMobileMenuStore";
import { getWhatsAppLink } from "../../utils/whatsapp";
import { getNavItems } from "../../utils/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  
  const { isOpen, setIsOpen } = useMobileMenuStore();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(console.error);
    setIsOpen(false);
  };

  const isPremium = profile?.role === "seller" && profile?.verified;
  
  // Use dynamically generated items based on role
  const drawerItems = getNavItems(profile?.role, profile?.verified);

  const bottomNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/products", icon: Store },
    { name: "Cart", href: "/cart", icon: ShoppingCart },
    { name: "Orders", href: "/buyer/dashboard/orders", icon: Package },
    { name: "More", href: "#", icon: Menu, action: () => setIsOpen(true) },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border pb-safe transition-transform duration-300 transform translate-y-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <nav className="flex items-center justify-around h-[68px] px-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/" && item.href !== "#" && location.pathname.startsWith(item.href));
            
            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors relative",
                    isOpen ? "text-[#C65A28]" : "text-[#5F5A54] hover:text-[#3A2418]"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isOpen ? "stroke-[2.5px]" : "stroke-2")} />
                  <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors relative",
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
                <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global More Menu Drawer */}
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
              <div className={cn(
                  "flex items-center justify-between p-4 border-b",
                  profile?.role === "seller" && profile?.verified
                    ? "border-[#D9A62E]/20 bg-[#D9A62E]/5"
                    : "border-border"
                )}
              >
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

              <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {!user && (
                   <Link
                      to="/products"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all focus:outline-none",
                        location.pathname === "/products" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Store className="h-6 w-6" />
                      Shop
                  </Link>
                )}
                {drawerItems.map((item) => {
                  if (item.action === "whatsapp") {
                    return (
                      <a
                        key={item.label}
                        href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:text-[#25D366] transition-colors"
                      >
                        <item.icon className="h-6 w-6 text-muted-foreground" />
                        {item.label}
                      </a>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all focus:outline-none",
                        location.pathname === item.path 
                           ? isPremium ? "bg-[#D9A62E]/10 text-[#D9A62E]" : "bg-primary/10 text-primary" 
                           : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className={cn("h-6 w-6", location.pathname === item.path ? (isPremium ? "text-[#D9A62E]" : "text-primary") : "text-muted-foreground")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {user ? (
                <div className="p-4 border-t border-border bg-muted/50 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/");
                    }}
                    className="flex items-center justify-center w-full gap-2 px-4 h-12 text-sm font-bold bg-muted hover:bg-muted-foreground/10 text-foreground border border-border rounded-xl transition-colors"
                  >
                    Back to Market
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-start w-full gap-2 px-4 h-12 text-sm font-bold text-[#B94A48] hover:bg-[#B94A48]/10 hover:text-red-400 rounded-xl transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-border bg-muted/50">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-full gap-2 px-4 h-12 text-sm font-bold bg-[#C65A28] text-white rounded-xl transition-colors"
                  >
                    Sign In to your Account
                  </Link>
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
