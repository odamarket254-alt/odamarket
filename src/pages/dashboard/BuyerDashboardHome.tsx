import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { 
  Package, ShoppingBag, MapPin, CreditCard, Heart, Clock, TrendingUp, 
  ChevronRight, Star, Gift, Truck, Map, Bell, ArrowRight,
  CheckCircle2, AlertCircle, Calendar, RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Image as ImageIcon } from 'lucide-react';

export function BuyerDashboardHome() {
  const { profile, user } = useAuthStore();
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [savingsData, setSavingsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    activeOrders: 0,
    cartItems: 0,
    wishlistItems: 0,
    rewardPoints: 0,
    totalSavings: 0,
    pendingDeliveries: 0
  });

  useEffect(() => {
    fetchDashboardData();

    // Setup real-time subscription for inquiries (acting as orders)
    const inquiriesSubscription = supabase
      .channel('public:inquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, payload => {
        fetchDashboardData(); // Refresh data on change
      })
      .subscribe();
      
    // Setup real-time subscription for products (for recommendations)
    const productsSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        fetchDashboardData(); // Refresh data on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inquiriesSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch active orders (using inquiries as orders for now based on previous structure)
      const { data: orders } = await supabase
        .from('inquiries')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        const active = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped');
        setActiveOrders(active);
        setStats(s => ({ ...s, activeOrders: active.length, pendingDeliveries: active.filter(a => a.status === 'shipped').length }));
      }

      // Fetch recommended products
      const { data: products } = await supabase
        .from('products')
        .select('*, supplier:profiles(business_name)')
        .limit(8);

      if (products) {
        setRecommended(products.slice(0, 4));
        setRecentProducts(products.slice(4, 8));
      }

      // Generate mock savings data for the chart (since no savings table exists)
      const mockSavings = Array.from({ length: 7 }).map((_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        amount: Math.floor(Math.random() * 500) + 100
      }));
      setSavingsData(mockSavings);
      
      setStats(s => ({
        ...s,
        cartItems: Math.floor(Math.random() * 5) + 1, // Placeholder until cart integration
        wishlistItems: Math.floor(Math.random() * 12) + 2,
        rewardPoints: Math.floor(Math.random() * 5000) + 1000,
        totalSavings: mockSavings.reduce((sum, item) => sum + item.amount, 0)
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C65A28] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3A2418] to-[#2A1810] p-8 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C65A28] rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D9A62E] rounded-full blur-[100px] opacity-10 -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full border-4 border-white/10 overflow-hidden bg-[#FAF5EC] shrink-0">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-[#3A2418]">
                  {profile?.business_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[#FAF5EC]/80 text-sm font-medium tracking-wider uppercase mb-1">
                {getGreeting()},
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {profile?.business_name || 'Customer'}  
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#D9A62E]/20 px-3 py-1 text-xs font-medium text-[#D9A62E] backdrop-blur-md border border-[#D9A62E]/30">
                  <Star className="h-3 w-3 fill-current" /> Premium Member
                </span>
                <span className="text-sm text-white/60">Profile 90% Complete</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link to="/products" className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#C65A28] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#C65A28]/20 hover:bg-[#A84A1E] transition-all">
              <ShoppingBag className="h-4 w-4" /> Shop Now
            </Link>
            <Link to="/orders" className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10">
              <RefreshCcw className="h-4 w-4" /> Buy Again
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Orders', value: stats.activeOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'In Cart', value: stats.cartItems, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Wishlist', value: stats.wishlistItems, icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Reward Points', value: stats.rewardPoints, icon: Gift, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Total Savings', value: formatCurrency(stats.totalSavings), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending Delivery', value: stats.pendingDeliveries, icon: Truck, color: 'text-teal-600', bg: 'bg-teal-100' },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between"
          >
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Order / Live Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3A2418]">Active Order Tracker</h2>
            </div>
            
            {activeOrders.length > 0 ? (
              <div className="rounded-3xl bg-white border border-[#E8DCC9] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 mb-2">
                      <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
                      Out for Delivery
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">Order #{activeOrders[0].id.substring(0, 8).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" /> Estimated arrival: Today, 2:45 PM - 3:15 PM
                    </p>
                  </div>
                  <Button className="shrink-0 bg-[#C65A28] hover:bg-[#A84A1E] text-white rounded-xl shadow-sm">
                    Track Live on Map
                  </Button>
                </div>
                
                <div className="bg-[#FAF5EC] p-6 relative h-48 md:h-64 overflow-hidden flex items-center justify-center">
                   {/* Dummy Map Area */}
                   <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                   <div className="relative z-10 flex flex-col items-center">
                     <Map className="h-12 w-12 text-[#C65A28] mb-3 opacity-80" />
                     <p className="text-sm font-medium text-[#3A2418]">Live GPS Tracking Available</p>
                     <p className="text-xs text-gray-500 mt-1">Driver: John Mutua • KCA 123D</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 shadow-sm p-8 text-center flex flex-col items-center justify-center h-64">
                <ShoppingBag className="h-12 w-12 text-orange-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Orders</h3>
                <p className="text-sm text-gray-600 max-w-md mb-6">You don't have any orders currently out for delivery. Check out today's deals to grab some fresh groceries!</p>
                <Link to="/products" className="inline-flex items-center justify-center rounded-xl bg-[#C65A28] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#A84A1E]">
                  Shop Now
                </Link>
              </div>
            )}
          </motion.div>

          {/* Buy Again Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3A2418]">Buy Again</h2>
              <Link to="/orders" className="text-sm font-medium text-[#C65A28] hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
              {recentProducts.map((product) => (
                <div key={product.id} className="min-w-[200px] max-w-[200px] snap-start shrink-0 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm group hover:shadow-md transition-all">
                  <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-[#C65A28]">{formatCurrency(product.price)}</span>
                    {product.compare_at_price && (
                      <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compare_at_price)}</span>
                    )}
                  </div>
                  <Button className="w-full h-8 text-xs bg-[#FAF5EC] text-[#3A2418] hover:bg-[#E8DCC9] border border-[#E8DCC9]">
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-8">
          
          {/* Savings Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl bg-white border border-[#E8DCC9] shadow-sm p-6"
          >
            <h2 className="text-lg font-bold text-[#3A2418] mb-1">Savings Summary</h2>
            <p className="text-sm text-gray-500 mb-6">Your total savings this week</p>
            
            <div className="mb-6">
              <div className="text-3xl font-black text-green-600">{formatCurrency(stats.totalSavings)}</div>
              <div className="text-sm font-medium text-green-700 flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" /> +12% from last week
              </div>
            </div>

            <div className="h-40 w-full">
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Saved']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Today's Deals Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/30 mb-4">
              Flash Sale Ends in 04:23:15
            </span>
            
            <h3 className="text-2xl font-black mb-2 leading-tight">Fresh Produce<br/>Weekend Deal</h3>
            <p className="text-red-100 text-sm mb-6">Get up to 40% off on all organic fruits and vegetables.</p>
            
            <div className="inline-flex items-center gap-2 font-bold hover:gap-3 transition-all">
              Claim Offer <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
