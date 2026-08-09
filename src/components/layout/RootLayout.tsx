import React, { useState, useEffect, useCallback } from "react";
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
  ShoppingCart,
  User,
  Heart,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useCartStore } from "../../store/useCartStore";

const fallbackCategories = [
  { name: 'Groceries', items: ['Fresh Produce', 'Bakery', 'Dairy', 'Frozen Foods'] },
  { name: 'Electronics', items: ['Phones', 'Computers', 'Smart Home', 'Accessories'] },
  { name: 'Fashion', items: ['Men', 'Women', 'Shoes', 'Watches'] },
  { name: 'Home & Living', items: ['Furniture', 'Kitchen', 'Cleaning', 'Decor'] }
];

export default function RootLayout() {
  const { user, profile } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartStore((state) => state.getCartCount());
  const [scrolled, setScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  
  // Dynamic categories
  const [megaMenuCategories, setMegaMenuCategories] = useState(fallbackCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select('*').limit(100)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
        
      if (data && data.length > 0) {
        // Group by parent
        const parents = data.filter(c => !c.parent_id || c.level === 0);
        const dynamicCats = parents.map(parent => {
           const children = data.filter(c => c.parent_id === parent.id);
           return {
             name: parent.name,
             items: children.length > 0 ? children.map(c => c.name) : []
           };
        });
        if (dynamicCats.length > 0) {
           setMegaMenuCategories(dynamicCats);
        }
      }
    };
    
    fetchCategories();

    

    
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const authRoutes = ["/login", "/signup", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.includes(location.pathname);

  useEffect(() => { setIsMobileMenuOpen(false); setActiveMegaMenu(null); }, [location.pathname]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      navigate(`/products?q=${encodeURIComponent(value)}`, { replace: true });
    } else if (location.pathname === "/products") {
      navigate(`/products`, { replace: true });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(console.error);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden w-full max-w-full">
        {!isAuthRoute && <Header />}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full relative z-0">
        <Outlet />
      </main>

      {!isAuthRoute && <Footer />}
      {!isAuthRoute && <MobileBottomNav />}
    </div>
  );
}
