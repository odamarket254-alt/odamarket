import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  X,
  ChevronRight,
  LogIn,
  UserPlus,
  Home,
  Grid,
  Store,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuthStore } from "../../store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { NotificationBell } from "./NotificationBell";
import { MobileBottomNav } from "./MobileBottomNav";
import { ThemeToggle } from "../theme-toggle";
import { Logo } from "../ui/Logo";

export default function RootLayout() {
  const { user, profile } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const authRoutes = [
    "/login",
    "/signup",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthRoute = authRoutes.includes(location.pathname);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Optionally clear search query when navigating away from products page
  useEffect(() => {
    if (!location.pathname.includes("/products")) {
      setSearchQuery("");
    }
  }, [location.pathname]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      navigate(`/products?q=${encodeURIComponent(value)}`, { replace: true });
    } else if (location.pathname === "/products") {
      navigate(`/products`, { replace: true });
    }
  };

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
      return () => {};
    }
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-background text-foreground">
      {!isAuthRoute && (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto h-16 md:h-20 px-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center">
                <Logo />
              </Link>
            </div>

            {/* Center Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/products"
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Products
              </Link>
              <Link
                to="/suppliers"
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Suppliers
              </Link>
              <Link
                to="/rfq"
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                RFQ
              </Link>
              <Link
                to="/categories"
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                to="/contact"
                className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Contact Us
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center shrink-0 gap-2 sm:gap-4">
              <ThemeToggle />
              
              {/* Mobile Toggle */}
              <div className="md:hidden flex items-center gap-2">
                {user && <NotificationBell />}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-full"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop Auth / User Menu */}
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-4">
                    <NotificationBell />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            className={cn(
                              "relative h-10 w-10 rounded-full flex items-center justify-center border",
                              profile?.logo_url
                                ? "p-0 overflow-hidden border-border"
                                : "",
                              !profile?.logo_url &&
                                profile?.role === "seller" &&
                                profile?.verified
                                ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30"
                                : !profile?.logo_url
                                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30"
                                  : "",
                            )}
                          />
                        }
                      >
                        {profile?.logo_url ? (
                          <img
                            src={profile.logo_url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className={cn(
                              "font-bold text-[15px]",
                              profile?.role === "seller" && profile?.verified
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {profile?.business_name
                              ? profile.business_name.charAt(0).toUpperCase()
                              : user.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 bg-background border-border text-foreground rounded-xl shadow-xl mt-2"
                        align="end"
                      >
                        <div className="flex flex-col space-y-1 p-3 border-b border-border">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {profile?.business_name || "User"}
                          </p>
                          <p className="text-xs truncate text-muted-foreground leading-tight">
                            {user.email}
                          </p>
                        </div>
                        <div className="p-1">
                          <DropdownMenuItem
                            render={
                              <Link
                                to={`/${profile?.role || "buyer"}/dashboard`}
                                className="w-full text-sm font-medium py-2 rounded-md hover:bg-muted/50 cursor-pointer"
                              />
                            }
                          >
                            <Grid className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            render={
                              <Link
                                to={`/${profile?.role || "buyer"}/dashboard/inquiries`}
                                className="w-full text-sm font-medium py-2 rounded-md hover:bg-muted/50 cursor-pointer"
                              />
                            }
                          >
                            <MessageCircle className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                            Inquiries
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator className="bg-border" />
                        <div className="p-1">
                          <DropdownMenuItem
                            onClick={handleSignOut}
                            className="w-full text-sm font-medium py-2 rounded-md text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                          >
                            Log out
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      render={<Link to="/login" />}
                      className="text-muted-foreground hover:text-foreground font-medium h-[40px] px-4 rounded-[12px] transition-all"
                    >
                      Sign In
                    </Button>
                    <Button
                      render={<Link to="/register" />}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-[40px] px-5 rounded-[12px] shadow-sm transition-all"
                    >
                      Join Market
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

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
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Logo />
                </Link>
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

              <div className="p-4 border-b border-border">
                <form
                  className="relative w-full group"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-emerald-600 dark:text-emerald-500 transition-colors">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      handleSearch(e);
                      // Don't close menu immediately to let them see results, but they are on mobile so we could.
                    }}
                    placeholder="Search products..."
                    className="w-full pl-10 bg-muted/50 text-foreground border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500 rounded-full h-12"
                  />
                </form>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex flex-col gap-2 px-3">
                  <Link
                    to="/"
                    className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Home className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">Home</span>
                  </Link>
                  <Link
                    to="/categories"
                    className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Grid className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">Categories</span>
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Store className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">Products</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">Contact Us</span>
                  </Link>
                </nav>
              </div>

              <div className="p-4 border-t border-border bg-muted/50 text-foreground flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 mb-2">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border shrink-0",
                          profile?.logo_url
                            ? "p-0 overflow-hidden border-border"
                            : "bg-emerald-500/20 border-emerald-500/30",
                        )}
                      >
                        {profile?.logo_url ? (
                          <img
                            src={profile.logo_url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 text-base">
                            {profile?.business_name
                              ? profile.business_name.charAt(0).toUpperCase()
                              : user.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate w-full">
                          {profile?.business_name || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <Button
                      render={
                        <Link to={`/${profile?.role || "buyer"}/dashboard`} />
                      }
                      className="w-full bg-muted/50 hover:bg-muted text-foreground border border-border h-12"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 justify-start h-12"
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      render={<Link to="/login" />}
                      variant="outline"
                      className="w-full bg-muted/50 text-foreground border-border text-foreground hover:bg-accent hover:text-accent-foreground h-12 text-base justify-center font-semibold"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button
                      render={<Link to="/register" />}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 h-12 text-base font-bold justify-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Market
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthRoute && (
        <footer className="bg-background text-muted-foreground py-12 pb-24 md:pb-12 border-t border-border">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  ODA Market
                </span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">
                The premier B2B marketplace connecting trusted African suppliers
                with global buyers.
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-medium mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/c/agriculture-farming"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Agriculture & Farming
                  </Link>
                </li>
                <li>
                  <Link
                    to="/c/food-beverage"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Food & Beverage
                  </Link>
                </li>
                <li>
                  <Link
                    to="/c/construction-building"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Construction & Building
                  </Link>
                </li>
                <li>
                  <Link
                    to="/c/industrial-equipment"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Industrial Equipment
                  </Link>
                </li>
                <li>
                  <Link
                    to="/categories"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors font-medium mt-2 inline-block"
                  >
                    View All Categories &rarr;
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="#"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>info@odamarket.co.ke</li>
                <li>0792867386</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border text-sm flex flex-col md:flex-row justify-between items-center text-[11px] tracking-widest uppercase">
            <p>© {new Date().getFullYear()} ODA Market</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="text-emerald-600 dark:text-emerald-500 font-bold italic tracking-normal">
                #AfricaTrade{new Date().getFullYear()}
              </span>
            </div>
          </div>
        </footer>
      )}
      {!isAuthRoute && <MobileBottomNav />}
    </div>
  );
}
