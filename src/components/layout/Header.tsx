import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { supabase } from "../../lib/supabase";
import {
  Smartphone,
  MapPin,
  HelpCircle,
  Menu,
  Search,
  User,
  Heart,
  ShoppingCart,
  Grid,
  ChevronDown,
  Package,
  Bell,
  Globe,
  DollarSign,
  MessageCircle,
  Truck
} from "lucide-react";

export function Header() {
  const { user, profile } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  const cartTotal = useCartStore((state) => state.getCartTotal());
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const [categories, setCategories] = useState<{name: string, slug: string, highlight?: boolean}[]>([
    { name: "Deals & Offers", slug: "deals", highlight: true },
    { name: "Fresh Produce", slug: "fresh-produce" },
    { name: "Meat & Seafood", slug: "meat-seafood" },
    { name: "Dairy & Eggs", slug: "dairy-eggs" },
    { name: "Bakery", slug: "bakery" },
    { name: "Beverages", slug: "beverages" },
    { name: "Snacks", slug: "snacks" },
    { name: "Household", slug: "household" },
  ]);

  useEffect(() => {
    async function fetchHeaderCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select('name, slug')
          .eq('is_active', true)
          
          .is('parent_id', null)
          .order('sort_order', { ascending: true })
          .limit(10);
        
        if (!error && data && data.length > 0) {
          const formatted = data.map(c => ({ name: c.name, slug: c.slug }));
          setCategories([{ name: "Deals & Offers", slug: "deals", highlight: true }, ...formatted]);
        }
      } catch (err) {
        // ignore
      }
    }
    fetchHeaderCategories();
  }, []);

  return (
    <header className={`w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md fixed top-0" : "bg-white relative"}`}>
      
      {/* =========================================================
          MOBILE HEADER (Visible only on < md screens)
          ========================================================= */}
      <div className="md:hidden flex flex-col bg-white w-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-[72px] px-4 sm:px-6 border-b border-gray-200 bg-white shadow-sm">
          <Link to="/" className="flex items-center justify-center shrink-0 py-1">
            <Logo className="w-[130px] min-[360px]:w-[150px] sm:w-[180px]" />
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={user ? (profile?.role === 'admin' ? '/admin/dashboard' : `/${profile?.role === 'customer' ? 'buyer' : profile?.role || 'buyer'}/dashboard`) : '/login'} className="w-11 h-11 flex items-center justify-center text-[#5F5A54] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <User className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/wishlist" className="w-11 h-11 flex items-center justify-center text-[#5F5A54] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <Heart className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/cart" className="w-11 h-11 flex items-center justify-center relative text-[#3A2418] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <ShoppingCart className="w-[24px] h-[24px]" />
              <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[#C65A28] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#FFFDF8]">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className={`px-4 transition-all duration-200 ${scrolled ? 'py-2' : 'py-3'} bg-white`}>
          <form onSubmit={handleSearch} className="w-full flex items-center h-[50px] rounded-full border-2 border-[#C65A28] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#C65A28]/20 transition-all">
            <div className="hidden min-[380px]:flex items-center h-full px-3 border-r border-[#EAEAEA] bg-[#FAF5EC] cursor-pointer hover:bg-[#E8DCC9] shrink-0">
              <span className="text-[13px] font-medium text-[#5F5A54] truncate max-w-[80px]">Categories</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#5F5A54]" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..." 
              className="flex-1 h-full px-3 sm:px-4 bg-transparent outline-none text-[#3A2418] placeholder-[#8B857D] text-[14px] sm:text-[15px] w-full min-w-0"
            />
            <button type="submit" className="h-full px-4 bg-[#C65A28] text-white flex items-center justify-center shrink-0 hover:bg-[#A84A1E] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Delivery Information Row (36-40px height) */}
        <div className={`px-4 flex items-center gap-1.5 text-[#5F5A54] text-[13px] font-medium transition-all duration-200 overflow-hidden ${scrolled ? 'h-0 opacity-0' : 'h-[36px] pb-2 pt-1 opacity-100'}`}>
          <MapPin className="w-4 h-4 text-[#C65A28]" /> 
          <span>Deliver to Nairobi</span>
          <ChevronDown className="w-3 h-3 text-[#8B857D]" />
        </div>
      </div>

      {/* =========================================================
          DESKTOP HEADER (Visible only on md+ screens)
          ========================================================= */}
      <div className="hidden md:block">

      
      
        {/* 1. Top Bar */}
        <div className="bg-[#C65A28] text-white h-10 hidden md:flex items-center text-[13px]">
          <div className="w-full max-w-[1400px] mx-auto px-6 flex justify-between items-center h-full">
            {/* Left Side */}
            <div className="flex items-center h-full gap-4">
              <a href="https://wa.me/123456789" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp Ordering
              </a>
              <span className="w-px h-4 bg-white/20"></span>
              <Link to="/track-order" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <Package className="w-4 h-4" /> Track Order
              </Link>
              <span className="w-px h-4 bg-white/20"></span>
              <Link to="/store-locator" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <MapPin className="w-4 h-4" /> Store Locator
              </Link>
            </div>
            
            {/* Center Banner */}
            <div className="flex items-center justify-center font-medium">
              <span className="text-[#D9A62E] mr-2">🚚</span> Free delivery on orders over KSh 5,000!
            </div>

            {/* Right Side */}
            <div className="flex items-center h-full gap-4">
              <Link to="/help" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <HelpCircle className="w-4 h-4" /> Help Center
              </Link>
              <span className="w-px h-4 bg-white/20"></span>
              <button className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <Globe className="w-4 h-4" /> EN <ChevronDown className="w-3 h-3" />
              </button>
              <span className="w-px h-4 bg-white/20"></span>
              <button className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">
                <DollarSign className="w-4 h-4" /> KSh <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation */}
        <div className="hidden md:flex border-b border-[#EAEAEA] py-4 md:py-0 md:h-[72px] lg:h-[80px] items-center bg-white">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 lg:gap-8">
            
            {/* Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/" className="shrink-0 flex items-center justify-center">
                <Logo className="w-[180px] lg:w-[200px]" />
              </Link>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="flex flex-1 w-full max-w-3xl mx-6 xl:mx-12 order-last md:order-none mt-3 md:mt-0">
              <div className="w-full flex items-center h-[50px] rounded-full border-2 border-[#C65A28] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#C65A28]/20 transition-all">
                <div className="hidden lg:flex items-center h-full px-4 border-r border-[#EAEAEA] bg-[#FAF5EC] cursor-pointer hover:bg-[#E8DCC9] shrink-0">
                  <span className="text-sm font-medium text-[#5F5A54]">All Categories</span>
                  <ChevronDown className="w-4 h-4 ml-2 text-[#5F5A54]" />
                </div>
                <form onSubmit={handleSearch} className="flex-1 flex items-center h-full">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="I'm shopping for..." 
                    className="w-full h-full px-4 bg-transparent outline-none text-[#3A2418] placeholder-[#8B857D] text-[15px]"
                  />
                  <button 
                    type="submit"
                    className="h-full px-8 bg-[#C65A28] text-white flex items-center justify-center hover:bg-[#C65A28] transition-colors shrink-0 font-semibold"
                  >
                    <Search className="w-5 h-5 mr-2" /> Search
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              {/* Account */}
              <Link to={user ? (profile?.role === 'admin' ? '/admin/dashboard' : `/${profile?.role === 'customer' ? 'buyer' : profile?.role || 'buyer'}/dashboard`) : '/login'} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#FAF5EC] flex items-center justify-center text-[#5F5A54] group-hover:bg-[#C65A28]/10 group-hover:text-[#C65A28] transition-colors">
                  <User className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="hidden xl:flex flex-col">
                  <span className="text-[12px] text-[#5F5A54] group-hover:text-[#C65A28] transition-colors">Welcome</span>
                  <span className="text-[14px] font-semibold text-[#3A2418] leading-tight">
                    {user ? (profile?.first_name?.split(' ')[0] || 'My Account') : 'ODAMARKET'}
                  </span>
                </div>
              </Link>
              
              {/* Notifications */}
              <Link to="/notifications" className="hidden lg:flex items-center gap-3 group cursor-pointer relative">
                <div className="w-10 h-10 rounded-full bg-[#FAF5EC] flex items-center justify-center text-[#5F5A54] group-hover:bg-[#C65A28]/10 group-hover:text-[#C65A28] transition-colors">
                  <Bell className="w-5 h-5" strokeWidth={2} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B94A48]/100 text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    3
                  </span>
                </div>
              </Link>
              
              {/* Wishlist */}
              <Link to="/wishlist" className="hidden sm:flex items-center gap-3 group cursor-pointer relative">
                <div className="w-10 h-10 rounded-full bg-[#FAF5EC] flex items-center justify-center text-[#5F5A54] group-hover:bg-[#C65A28]/10 group-hover:text-[#C65A28] transition-colors">
                  <Heart className="w-5 h-5" strokeWidth={2} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C65A28] text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    0
                  </span>
                </div>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="flex items-center gap-3 group cursor-pointer">
                <div className="relative w-10 h-10 rounded-full bg-[#C65A28]/10 flex items-center justify-center text-[#C65A28] group-hover:bg-[#C65A28] group-hover:text-white transition-colors">
                  <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#D9A62E] text-white text-[12px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-[12px] text-[#5F5A54] group-hover:text-[#C65A28] transition-colors">My Cart</span>
                  <span className="text-[14px] font-bold text-[#3A2418] leading-tight">KSh {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Category Navigation */}
        <div className="bg-[#FAF5EC] border-b border-[#E8DCC9] h-[54px] block shadow-sm">
          <div className="w-full max-w-[1400px] mx-auto px-6 flex items-center h-full gap-8">
            
            {/* Browse Categories Button */}
            <Link to="/categories" className="hidden md:flex w-[260px] h-full bg-[#C65A28] items-center justify-between px-5 text-white cursor-pointer hover:bg-[#C65A28] transition-colors shrink-0 group">
              <div className="flex items-center gap-3">
                <Menu className="w-5 h-5" />
                <span className="font-semibold text-[15px]">Browse Categories</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Link>
            
            {/* Scrollable Categories */}
            <div className="flex-1 flex overflow-x-auto gap-6 md:gap-8 h-full items-center custom-scrollbar scroll-smooth whitespace-nowrap px-4 md:px-0">
              {categories.map((cat, idx) => (
                <Link 
                  key={idx} 
                  to={`/products?category=${cat.slug}`} 
                  className={`flex items-center text-[14px] font-medium transition-all duration-300 h-full relative shrink-0 group ${cat.highlight ? 'text-[#C65A28] font-bold' : 'text-[#3A2418] hover:text-[#C65A28]'}`}
                >
                  {cat.name}<span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D9A62E] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
            </div>
    </header>
  );
}
