import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ShoppingBag, MapPin, CreditCard, Heart, Clock, TrendingUp, 
  ChevronRight, Star, Gift, Truck, ArrowRight,
  CheckCircle2, AlertCircle, RefreshCcw, Search, Plus, Ticket, 
  MessageCircle, ExternalLink, ShieldCheck, Check, ShoppingCart, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string;
}

interface OrderRecord {
  id: string;
  order_number?: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  payment_status?: string;
  order_items?: OrderItem[];
}

interface ProductRecord {
  id: string;
  name: string;
  slug?: string;
  price: number;
  sale_price?: number;
  image_url?: string;
  category_id?: string;
  stock?: number;
  is_featured?: boolean;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export function BuyerDashboardHome() {
  const { profile, user } = useAuthStore();
  const { addItem: addCartItem } = useCartStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Real Database Data
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [rewardPoints, setRewardPoints] = useState<number>(0);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Fetch Orders with Order Items from Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn('Orders query warning:', ordersError);
      }
      setAllOrders(ordersData || []);

      // 2. Fetch User Wishlist IDs
      try {
        const { data: wlData } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', user.id);
        if (wlData) {
          setWishlistIds(new Set(wlData.map(w => w.product_id)));
        }
      } catch (err) {
        console.warn('Wishlist query error:', err);
      }

      // 3. Fetch Real Supermarket Products for Recommendations
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, slug, price, sale_price, image_url, category_id, stock, is_featured')
          .eq('is_active', true)
          .limit(8);
        setRecommendedProducts(prodData || []);
      } catch (err) {
        console.warn('Products query error:', err);
      }

      // 4. Fetch Real Categories
      try {
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, sort_order')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(6);
        setCategories(catData || []);
      } catch (err) {
        console.warn('Categories query error:', err);
      }

      // 5. Fetch Real Reward Points
      try {
        const { data: ptsData } = await supabase
          .from('reward_points')
          .select('points')
          .eq('user_id', user.id);
        const total = ptsData?.reduce((sum, curr) => sum + (curr.points || 0), 0) || 0;
        setRewardPoints(total);
      } catch (err) {
        console.warn('Reward points error:', err);
      }

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setLoadError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived real stats
  const totalOrdersCount = allOrders.length;
  const pendingOrders = allOrders.filter(o => 
    o.status === 'pending' || 
    o.status === 'confirmed' || 
    o.status === 'processing' || 
    o.status === 'out_for_delivery'
  );
  const deliveredOrdersCount = allOrders.filter(o => o.status === 'delivered').length;
  const cancelledOrdersCount = allOrders.filter(o => o.status === 'cancelled').length;

  // Active delivery (first non-finalized order)
  const activeOrder = pendingOrders[0] || null;

  // Recent orders (up to 4 for compact side card)
  const recentOrders = allOrders.slice(0, 4);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.first_name 
    ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1)
    : profile?.email?.split('@')[0] || 'Customer';

  // Toggle Wishlist
  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to save items to your wishlist');
      return;
    }

    const isCurrentlySaved = wishlistIds.has(productId);
    const updated = new Set(wishlistIds);

    if (isCurrentlySaved) {
      updated.delete(productId);
      setWishlistIds(updated);
      try {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        toast.success('Removed from wishlist');
      } catch {
        updated.add(productId);
        setWishlistIds(updated);
      }
    } else {
      updated.add(productId);
      setWishlistIds(updated);
      try {
        await supabase
          .from('wishlist_items')
          .insert([{ user_id: user.id, product_id: productId }]);
        toast.success('Saved to wishlist');
      } catch {
        updated.delete(productId);
        setWishlistIds(updated);
      }
    }
  };

  const handleAddToCart = (product: ProductRecord, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const effectivePrice = product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;
    addCartItem({
      id: product.id,
      name: product.name,
      price: effectivePrice.toString(),
      image_url: product.image_url || ''
    }, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse">
        {/* Main Column Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-28 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border p-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border"></div>
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border"></div>
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border"></div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-36 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border"></div>
          <div className="h-80 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/60 dark:border-border p-5 space-y-3">
            <div className="h-5 bg-muted rounded w-1/3"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError) {
    return (
      <div className="w-full py-16 text-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-card border border-destructive/20 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2D1F17] dark:text-foreground">
            Unable to load dashboard
          </h3>
          <p className="text-sm text-[#736357] dark:text-muted-foreground">
            {loadError}
          </p>
          <Button
            onClick={fetchDashboardData}
            className="rounded-full bg-[#D96A27] hover:bg-[#C65A28] text-white px-6"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Helper component for Recent Orders Card to keep exact parity on desktop and mobile
  const RecentOrdersCard = () => (
    <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-5 shadow-[0_2px_10px_rgba(45,31,23,0.03)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC9]/60 dark:border-border">
        <h3 className="font-bold text-[#2D1F17] dark:text-foreground text-base">
          Recent Orders
        </h3>
        <Link
          to="/buyer/dashboard/orders"
          className="text-xs font-semibold text-[#D96A27] hover:text-[#C65A28] hover:underline"
        >
          View all
        </Link>
      </div>

      {recentOrders.length > 0 ? (
        <div className="divide-y divide-[#E8DCC9]/50 dark:divide-border/50">
          {recentOrders.map((order) => {
            const formattedDate = new Date(order.created_at).toLocaleDateString('en-KE', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const itemCount = order.order_items?.length || 1;
            const orderNum = order.order_number || `#ODM-${order.id.slice(0, 4).toUpperCase()}`;

            return (
              <Link
                key={order.id}
                to="/buyer/dashboard/orders"
                className="block py-3 px-1.5 -mx-1.5 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-muted/40 transition-colors duration-150 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Order number, date, item count, total */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-mono font-semibold text-sm text-[#2D1F17] dark:text-foreground block truncate group-hover:text-[#D96A27] transition-colors">
                      {orderNum}
                    </span>
                    <p className="text-xs text-[#736357] dark:text-muted-foreground truncate">
                      {formattedDate} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-sm font-semibold text-[#2D1F17] dark:text-foreground pt-0.5">
                      KES {order.total?.toLocaleString() || 0}
                    </p>
                  </div>

                  {/* Right: Compact status pill and chevron */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <CompactOrderStatusBadge status={order.status} />
                    <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#D96A27] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-[#736357] dark:text-muted-foreground space-y-2">
          <Package className="w-7 h-7 mx-auto text-[#8C7A6B]/50" />
          <p className="text-xs font-medium text-[#2D1F17] dark:text-foreground">
            No recent orders
          </p>
          <p className="text-[11px] text-[#736357] dark:text-muted-foreground">
            Your orders will appear here after you shop.
          </p>
          <div className="pt-1">
            <Link to="/products">
              <Button size="sm" className="rounded-full bg-[#D96A27] hover:bg-[#C65A28] text-white text-xs px-4 h-7">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* 3-PART STRUCTURE ON DESKTOP:
          [ LEFT: Sidebar in DashboardLayout ] | [ CENTER: Main 8-Col ] | [ RIGHT: Supporting 4-Col (300-340px) ]
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* CENTER / MAIN DASHBOARD CONTENT (8 COLS ON DESKTOP)       */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. WELCOME SECTION */}
          <section className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(45,31,23,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D1F17] dark:text-foreground">
                  {getGreeting()}, {displayName}!
                </h1>
                <p className="text-xs sm:text-sm text-[#736357] dark:text-muted-foreground">
                  Here&apos;s what&apos;s happening with your OdaMarket account today.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                <Link to="/products">
                  <Button className="rounded-full bg-[#D96A27] hover:bg-[#C65A28] active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-5 py-2.5 shadow-sm transition-all duration-150">
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    Shop Groceries
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* 2. ORDER STATISTICS (REAL DB DATA) */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Orders */}
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground">
                  Total Orders
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D1F17] dark:text-foreground">
                    {totalOrdersCount}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#8C7A6B]/50" />
                </div>
              </div>

              {/* Pending / Active */}
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground">
                  Pending
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#D96A27]">
                    {pendingOrders.length}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#D96A27]" />
                </div>
              </div>

              {/* Delivered */}
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground">
                  Delivered
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#00A859]">
                    {deliveredOrdersCount}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#00A859]" />
                </div>
              </div>

              {/* Cancelled */}
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground">
                  Cancelled
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#8C7A6B]">
                    {cancelledOrdersCount}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#8C7A6B]/30" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. ACTIVE DELIVERY TRACKER */}
          <section>
            {activeOrder ? (
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(45,31,23,0.03)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DCC9]/60 dark:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00A859]/10 text-[#00A859] flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-[#D96A27]">
                          Active Delivery
                        </span>
                        <span className="text-xs text-[#8C7A6B]">·</span>
                        <span className="font-mono text-xs font-semibold text-[#2D1F17] dark:text-foreground">
                          {activeOrder.order_number || `#ODM-${activeOrder.id.slice(0, 4).toUpperCase()}`}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#2D1F17] dark:text-foreground">
                        Order In Progress
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className="text-xs font-semibold text-[#736357] dark:text-muted-foreground">
                      KES {activeOrder.total?.toLocaleString() || 0}
                    </span>
                    <Link to="/buyer/dashboard/track">
                      <Button size="sm" variant="outline" className="rounded-full border-[#E8DCC9] hover:bg-[#FAF7F2] text-xs">
                        Track Order
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stepper Progression */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {/* Connecting Line */}
                    <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-[#E8DCC9] dark:bg-muted -z-0">
                      <div
                        className="h-full bg-[#00A859] transition-all duration-500"
                        style={{
                          width: activeOrder.status === 'out_for_delivery'
                            ? '66%'
                            : activeOrder.status === 'processing'
                            ? '33%'
                            : '0%'
                        }}
                      />
                    </div>

                    {/* Step 1: Confirmed */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className="w-8 h-8 rounded-full bg-[#00A859] text-white flex items-center justify-center ring-4 ring-white dark:ring-card">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#2D1F17] dark:text-foreground">
                        Confirmed
                      </span>
                    </div>

                    {/* Step 2: Packed */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-card ${
                        activeOrder.status === 'processing' || activeOrder.status === 'out_for_delivery'
                          ? 'bg-[#00A859] text-white'
                          : 'bg-[#FAF7F2] dark:bg-muted text-[#8C7A6B] border border-[#E8DCC9]'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-[#736357] dark:text-muted-foreground">
                        Packed
                      </span>
                    </div>

                    {/* Step 3: Out for Delivery */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-card ${
                        activeOrder.status === 'out_for_delivery'
                          ? 'bg-[#D96A27] text-white animate-pulse'
                          : 'bg-[#FAF7F2] dark:bg-muted text-[#8C7A6B] border border-[#E8DCC9]'
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-[#736357] dark:text-muted-foreground">
                        On the Way
                      </span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-muted text-[#8C7A6B] border border-[#E8DCC9] flex items-center justify-center ring-4 ring-white dark:ring-card">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-[#8C7A6B]">
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] dark:bg-muted flex items-center justify-center text-[#8C7A6B] shrink-0 border border-[#E8DCC9]/60">
                    <Truck className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2D1F17] dark:text-foreground text-sm sm:text-base">
                      No active delivery
                    </h3>
                    <p className="text-xs text-[#736357] dark:text-muted-foreground mt-0.5">
                      Your current deliveries will appear here once you place an order.
                    </p>
                  </div>
                </div>

                <Link to="/products" className="shrink-0 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full border-[#E8DCC9] hover:bg-[#FAF7F2] text-[#2D1F17] dark:text-foreground text-xs font-medium px-4 h-8"
                  >
                    Browse Supermarket <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* 4. QUICK ACTIONS */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Orders */}
              <Link
                to="/buyer/dashboard/orders"
                className="group bg-white dark:bg-card border border-[#E8DCC9] dark:border-border hover:border-[#D96A27] rounded-2xl p-3.5 shadow-2xs hover:shadow-[0_4px_12px_rgba(45,31,23,0.05)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-muted flex items-center justify-center text-[#D96A27] group-hover:scale-105 transition-transform">
                    <Package className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:text-[#D96A27] transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#2D1F17] dark:text-foreground">
                    Orders
                  </h4>
                  <p className="text-[11px] text-[#736357] dark:text-muted-foreground mt-0.5">
                    Track purchases
                  </p>
                </div>
              </Link>

              {/* Payment Methods */}
              <Link
                to="/buyer/dashboard/payments"
                className="group bg-white dark:bg-card border border-[#E8DCC9] dark:border-border hover:border-[#D96A27] rounded-2xl p-3.5 shadow-2xs hover:shadow-[0_4px_12px_rgba(45,31,23,0.05)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#00A859]/10 text-[#00A859] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:text-[#D96A27] transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#2D1F17] dark:text-foreground">
                    Payments
                  </h4>
                  <p className="text-[11px] text-[#736357] dark:text-muted-foreground mt-0.5">
                    Safaricom M-Pesa
                  </p>
                </div>
              </Link>

              {/* Addresses */}
              <Link
                to="/buyer/dashboard/addresses"
                className="group bg-white dark:bg-card border border-[#E8DCC9] dark:border-border hover:border-[#D96A27] rounded-2xl p-3.5 shadow-2xs hover:shadow-[0_4px_12px_rgba(45,31,23,0.05)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-muted flex items-center justify-center text-[#8C7A6B] group-hover:scale-105 transition-transform">
                    <MapPin className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:text-[#D96A27] transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#2D1F17] dark:text-foreground">
                    Addresses
                  </h4>
                  <p className="text-[11px] text-[#736357] dark:text-muted-foreground mt-0.5">
                    Saved locations
                  </p>
                </div>
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="group bg-white dark:bg-card border border-[#E8DCC9] dark:border-border hover:border-[#D96A27] rounded-2xl p-3.5 shadow-2xs hover:shadow-[0_4px_12px_rgba(45,31,23,0.05)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Heart className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:text-[#D96A27] transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#2D1F17] dark:text-foreground">
                    Wishlist
                  </h4>
                  <p className="text-[11px] text-[#736357] dark:text-muted-foreground mt-0.5">
                    {wishlistIds.size} saved items
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* MOBILE ONLY: RECENT ORDERS SECTION (On desktop, this is in the Right Column) */}
          <div className="lg:hidden">
            <RecentOrdersCard />
          </div>

          {/* 5. RECOMMENDED PRODUCTS (GRID ALIGNED) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#2D1F17] dark:text-foreground">
                  Recommended Groceries
                </h2>
                <p className="text-xs text-[#736357] dark:text-muted-foreground">
                  Fresh pantry picks and supermarket essentials
                </p>
              </div>

              <Link
                to="/products"
                className="text-xs font-semibold text-[#D96A27] hover:text-[#C65A28] hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {recommendedProducts.map((product) => {
                  const isWishlisted = wishlistIds.has(product.id);
                  const effectivePrice = product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white dark:bg-card border border-[#E8DCC9] dark:border-border/80 hover:border-[#D96A27] rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-[0_4px_16px_rgba(45,31,23,0.06)] transition-all duration-200 flex flex-col justify-between relative"
                    >
                      {/* Heart / Wishlist Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(product.id, e)}
                        className="absolute top-2.5 right-2.5 z-10 w-6.5 h-6.5 rounded-full bg-white/90 dark:bg-card/90 shadow-2xs flex items-center justify-center text-[#8C7A6B] hover:text-red-500 transition-colors cursor-pointer"
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                        />
                      </button>

                      {/* Product Image (Contained without distortion) */}
                      <Link
                        to={`/products/${product.slug || product.id}`}
                        className="aspect-square bg-[#FAF7F2] dark:bg-muted/30 rounded-xl p-2.5 mb-2.5 flex items-center justify-center overflow-hidden block"
                      >
                        {product.image_url ? (
                          <OptimizedImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            imageType="product"
                          />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-[#8C7A6B]/40" />
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between space-y-1.5">
                        <Link
                          to={`/products/${product.slug || product.id}`}
                          className="text-xs sm:text-sm font-semibold text-[#2D1F17] dark:text-foreground line-clamp-2 hover:text-[#D96A27] transition-colors leading-snug min-h-[2.4rem]"
                        >
                          {product.name}
                        </Link>

                        <div className="pt-1 flex items-center justify-between gap-1.5">
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-[#2D1F17] dark:text-foreground">
                              KES {effectivePrice?.toLocaleString() || 0}
                            </span>
                            {product.sale_price && product.sale_price > 0 && product.sale_price < product.price && (
                              <span className="text-[10px] text-[#8C7A6B] line-through block">
                                KES {product.price?.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-7 h-7 rounded-full bg-[#D96A27] hover:bg-[#C65A28] active:scale-95 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
                            title="Add to cart"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          {/* 6. POPULAR AISLES / CATEGORIES */}
          {categories.length > 0 && (
            <section className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E8DCC9]/60 dark:border-border">
                <h3 className="text-sm sm:text-base font-bold text-[#2D1F17] dark:text-foreground">
                  Popular Supermarket Aisles
                </h3>
                <Link to="/categories" className="text-xs font-semibold text-[#D96A27] hover:underline">
                  All Aisles →
                </Link>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug || cat.id}`}
                    className="group p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-muted/30 hover:bg-[#F3ECE2] dark:hover:bg-muted/60 border border-[#E8DCC9]/60 dark:border-border transition-all flex flex-col items-center justify-center text-center gap-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-card flex items-center justify-center overflow-hidden border border-[#E8DCC9]/80 group-hover:scale-105 transition-transform">
                      {cat.image_url ? (
                        <OptimizedImage
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          imageType="category"
                        />
                      ) : (
                        <span className="text-base select-none">🛒</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#2D1F17] dark:text-foreground line-clamp-1">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (4 COLS ON DESKTOP, ~300-340PX WIDE)         */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. NEED HELP / CUSTOMER SUPPORT CARD */}
          <div className="bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl p-5 shadow-[0_2px_10px_rgba(45,31,23,0.03)] space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D1F17] dark:text-foreground text-sm sm:text-base leading-snug">
                  Need Help?
                </h3>
                <p className="text-xs text-[#736357] dark:text-muted-foreground">
                  OdaMarket customer care team
                </p>
              </div>
            </div>

            <p className="text-xs text-[#736357] dark:text-muted-foreground leading-relaxed">
              Have questions about your order or prefer to place an order via WhatsApp? We&apos;re here daily from 7:00 AM to 9:00 PM.
            </p>

            <div className="pt-1 flex flex-col gap-2">
              <a
                href={getWhatsAppLink('Hello OdaMarket, I would like assistance with my order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <Link
                to="/help-center"
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#E8DCC9] hover:bg-[#FAF7F2] text-xs font-medium text-[#736357] transition-colors text-center"
              >
                Help Center & FAQs
              </Link>
            </div>
          </div>

          {/* 2. RECENT ORDERS CARD (DESKTOP VIEW) */}
          <div className="hidden lg:block">
            <RecentOrdersCard />
          </div>

          {/* 3. REWARDS & GROCERY SAVINGS CARD */}
          <div className="bg-[#FAF7F2] dark:bg-muted/30 border border-[#E8DCC9] dark:border-border rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#D96A27]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2D1F17] dark:text-foreground">
                  Reward Points
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D96A27]/10 text-[#D96A27]">
                Active
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[#2D1F17] dark:text-foreground">
                {rewardPoints.toLocaleString()}
              </span>
              <span className="text-xs text-[#736357] dark:text-muted-foreground font-medium">
                points available
              </span>
            </div>

            <p className="text-xs text-[#736357] dark:text-muted-foreground leading-relaxed">
              Earn 1 point for every KES 100 spent. Redeem points at checkout for instant discounts.
            </p>

            <Link
              to="/buyer/dashboard/rewards"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D96A27] hover:underline pt-1"
            >
              <span>View reward benefits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Status Badge matching reference design specification
function CompactOrderStatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'delivered') {
    return (
      <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
        Delivered
      </span>
    );
  }

  if (normalized === 'out_for_delivery') {
    return (
      <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] shrink-0">
        Out for delivery
      </span>
    );
  }

  if (normalized === 'cancelled') {
    return (
      <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] shrink-0">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] shrink-0">
      {normalized ? normalized.replace(/_/g, ' ') : 'Pending'}
    </span>
  );
}

export default BuyerDashboardHome;
