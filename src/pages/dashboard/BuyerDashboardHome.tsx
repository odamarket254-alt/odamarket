import { OptimizedImage } from "../../components/ui/OptimizedImage";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { 
  Package, ShoppingBag, MapPin, CreditCard, Heart, Clock, TrendingUp, 
  ChevronRight, Star, Gift, Truck, Map, Bell, ArrowRight,
  CheckCircle2, AlertCircle, Calendar, RefreshCcw, Search, Plus, Ticket, Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Fetch Orders from 'orders' table if it exists, otherwise fallback to inquiries for active
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData && ordersData.length > 0) {
        setActiveOrders(ordersData);
        const active = ordersData.filter((o: any) => 
          o.status !== 'delivered' && 
          o.status !== 'cancelled' && 
          o.payment_status !== 'failed' && 
          o.payment_status !== 'abandoned'
        );
        setStats(s => ({ ...s, activeOrders: active.length, pendingDeliveries: active.filter((a: any) => a.status === 'out_for_delivery').length }));
      } else {
        // Fallback for demo
        const demoOrders = [
          { id: 'ORD-123', status: 'shipped', total: 4500, created_at: new Date().toISOString() },
          { id: 'ORD-124', status: 'processing', total: 1200, created_at: new Date().toISOString() }
        ];
        setActiveOrders(demoOrders);
        setStats(s => ({ ...s, activeOrders: 2, pendingDeliveries: 1 }));
      }

      // 2. Fetch Wishlist Items
      const { data: wlData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user.id);
      
      let wlProducts: any[] = [];
      if (wlData && wlData.length > 0) {
        const productIds = wlData.map(w => w.product_id);
        const { data: pData } = await supabase.from('products').select('*').in('id', productIds).limit(4);
        if (pData) wlProducts = pData;
      }
      setWishlistItems(wlProducts);
      setStats(s => ({ ...s, wishlistItems: wlData?.length || 0 }));

      // 3. Fetch Cart Items
      const { data: cartData } = await supabase.from('cart_items').select('*').eq('user_id', user.id);
      setStats(s => ({ ...s, cartItems: cartData?.length || 0 }));

      // 4. Fetch Recommended Products (just random popular products for now)
      const { data: recProducts } = await supabase.from('products').select('*').limit(4);
      if (recProducts) {
        setRecommended(recProducts);
      }

      // 5. Fetch Recent Products (buy again)
      const { data: recent } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(4);
      if (recent) {
        setRecentProducts(recent);
      }

      // 6. Mock Savings Chart Data
      const mockSavings = Array.from({ length: 7 }).map((_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        amount: Math.floor(Math.random() * 500) + 100
      }));
      setSavingsData(mockSavings);
      setStats(s => ({
        ...s,
        rewardPoints: Math.floor(Math.random() * 5000) + 1000,
        totalSavings: mockSavings.reduce((sum, item) => sum + item.amount, 0)
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error); alert("Error fetching dashboard data: " + error.message);
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
      <div className="space-y-6 animate-pulse p-4 md:p-6">
        <div className="h-48 bg-muted rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const getLoyaltyTier = (points: number) => {
    if (points > 5000) return { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (points > 2000) return { name: 'Silver', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    return { name: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-700/10' };
  };

  const loyalty = getLoyaltyTier(stats.rewardPoints);
  const displayName = profile?.first_name || profile?.email?.split('@')[0] || 'Customer';

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Welcome back to OdaMarket. Ready for your next grocery run?
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">Shop Groceries</Button>
              </Link>
              <div className="flex items-center gap-2 bg-primary-foreground/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Search for daily essentials...</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-primary-foreground/10 backdrop-blur-md p-4 rounded-xl border border-primary-foreground/20">
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30">
              <span className="text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{loyalty.name} Member</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-sm text-primary-foreground/80">{stats.rewardPoints.toLocaleString()} Reward Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package} label="Orders" value={stats.activeOrders} link="/buyer/dashboard/orders" />
        <StatCard icon={ShoppingBag} label="In Cart" value={stats.cartItems} link="/cart" />
        <StatCard icon={Heart} label="Wishlist" value={stats.wishlistItems} link="/wishlist" />
        <StatCard icon={Gift} label="Points" value={stats.rewardPoints} link="/buyer/dashboard/rewards" />
        <StatCard icon={TrendingUp} label="Savings" value={`Ksh ${stats.totalSavings}`} link="/buyer/dashboard/rewards" />
        <StatCard icon={Truck} label="Deliveries" value={stats.pendingDeliveries} link="/buyer/dashboard/track" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* 3. TRACK ORDER (If active) */}
          {stats.activeOrders > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Active Delivery
                </h2>
                <Link to="/buyer/dashboard/track">
                  <Button variant="outline" size="sm">View All Tracker</Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0 hidden md:block"></div>
                <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-primary -translate-y-1/2 z-0 hidden md:block transition-all duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                  <DeliveryStep icon={CheckCircle2} title="Confirmed" date="Today, 10:00 AM" active={true} completed={true} />
                  <DeliveryStep icon={Package} title="Packed" date="Today, 10:45 AM" active={true} completed={true} />
                  <DeliveryStep icon={Truck} title="Out for Delivery" date="Estimated 2:00 PM" active={true} completed={false} />
                  <DeliveryStep icon={MapPin} title="Delivered" date="Pending" active={false} completed={false} />
                </div>
              </div>
            </Card>
          )}

          {/* 4. BUY AGAIN (Recent Purchases) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Buy Again</h2>
              <Link to="/buyer/dashboard/orders" className="text-sm text-primary font-medium hover:underline flex items-center">
                View Past Orders <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 sm:mx-0 sm:px-0 gap-4 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recentProducts.length > 0 ? (
                recentProducts.map(product => (
                  <div key={product.id} className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"><ProductCard product={product} /></div>
                ))
              ) : (
                <div className="w-full p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">You haven't made any orders yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* 5. RECOMMENDED FOR YOU */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recommended For You</h2>
              <Link to="/products" className="text-sm text-primary font-medium hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 sm:mx-0 sm:px-0 gap-4 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recommended.length > 0 ? (
                recommended.map(product => (
                  <div key={product.id} className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"><ProductCard product={product} /></div>
                ))
              ) : (
                <div className="w-full p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">Check back later for personalized recommendations.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 6. POPULAR CATEGORIES */}
          <div>
            <h2 className="text-xl font-bold mb-4">Popular Categories</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              <CategoryCard title="Fruits" icon="🍎" />
              <CategoryCard title="Vegetables" icon="🥬" />
              <CategoryCard title="Dairy" icon="🥛" />
              <CategoryCard title="Bakery" icon="🥖" />
              <CategoryCard title="Meat" icon="🥩" />
              <CategoryCard title="Snacks" icon="🍿" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6 md:space-y-8">
          
          {/* 7. SAVINGS PANEL */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Savings
            </h2>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-3xl font-black">Ksh {stats.totalSavings.toLocaleString()}</span>
              <span className="text-sm text-green-600 font-medium">+12% this month</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C65A28" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C65A28" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`Ksh ${value}`, 'Saved']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#C65A28" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 8. FLASH SALES / DEALS */}
          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-orange-100 dark:from-red-950/20 dark:to-orange-950/20 dark:border-orange-900/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                🔥 Flash Deals
              </h2>
              <div className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">Ends in 2h 45m</div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 items-center bg-white dark:bg-card p-3 rounded-xl shadow-sm border border-border">
                <div className="w-16 h-16 bg-muted rounded-lg shrink-0"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm line-clamp-1">Fresh Farm Eggs (Tray)</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-600 font-bold">Ksh 350</span>
                    <span className="text-xs text-muted-foreground line-through">Ksh 450</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* 9. AVAILABLE COUPONS */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" /> Available Coupons
            </h2>
            <div className="space-y-3">
              <div className="border border-dashed border-primary/50 bg-primary/5 p-4 rounded-xl relative overflow-hidden">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card rounded-full border-r border-primary/50"></div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card rounded-full border-l border-primary/50"></div>
                
                <div className="flex justify-between items-center px-2">
                  <div>
                    <h4 className="font-bold text-primary">15% OFF</h4>
                    <p className="text-xs text-muted-foreground">Min. spend Ksh 2,000</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 border-primary text-primary hover:bg-primary hover:text-white">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, link }: { icon: any, label: string, value: string | number, link: string }) {
  return (
    <Link to={link}>
      <Card className="p-4 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors group h-full">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-xl font-bold mb-1">{value}</div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </Card>
    </Link>
  );
}

function DeliveryStep({ icon: Icon, title, date, active, completed }: { icon: any, title: string, date: string, active: boolean, completed: boolean }) {
  return (
    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 z-10">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center border-4 border-card transition-colors
        ${completed ? 'bg-primary text-white' : active ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground'}
      `}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left md:text-center">
        <div className={`font-semibold text-sm ${active || completed ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</div>
        <div className="text-xs text-muted-foreground">{date}</div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col h-full relative">
      <div className="absolute top-2 right-2 z-10">
        <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm text-muted-foreground hover:text-red-500 hover:bg-white transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <Link to={`/products/${product.id}`} className="aspect-square bg-muted relative overflow-hidden block">
        {product.image_url ? (
          <OptimizedImage 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-sm">
            Ksh {product.regular_price || product.price || 0}
          </span>
          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="Add to Cart">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, icon }: { title: string, icon: string }) {
  return (
    <Link to={`/products?category=${title.toLowerCase()}`}>
      <div className="bg-muted/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer h-full text-center">
        <span className="text-3xl mb-1">{icon}</span>
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
    </Link>
  );
}
