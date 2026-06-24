import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Package,
  Inbox,
  TrendingUp,
  Users,
  Heart,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  FileText,
  ChevronRight,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Timestamp } from "../../components/ui/Timestamp";
import { Button } from "../../components/ui/Button";

export default function DashboardHome() {
  const { profile, user } = useAuthStore();
  const [productCount, setProductCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  const [sentInquiryCount, setSentInquiryCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [savedProductCount, setSavedProductCount] = useState(0);
  const [recentViewsCount, setRecentViewsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        if (profile?.role === "seller") {
          const [
            { count: pCount },
            { count: iCount },
            { data: recent },
            { count: viewsCount },
            { count: favCount },
            { data: topProds }
          ] = await Promise.all([
            supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("seller_id", user.id),
            supabase
              .from("inquiries")
              .select("*", { count: "exact", head: true })
              .eq("seller_id", user.id),
            supabase
              .from("inquiries")
              .select("*, buyer:profiles!buyer_id(business_name, name)")
              .eq("seller_id", user.id)
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("recent_views")
              .select("id, products!inner(seller_id)", { count: "exact", head: true })
              .eq("products.seller_id", user.id),
            supabase
              .from("favorites")
              .select("id, products!inner(seller_id)", { count: "exact", head: true })
              .eq("products.seller_id", user.id),
            supabase
              .from("products")
              .select(`
                *,
                inquiries(count),
                favorites(count),
                recent_views(count)
              `)
              .eq("seller_id", user.id)
              .order("created_at", { ascending: false })
              .limit(4)
          ]);
          setProductCount(pCount || 0);
          setInquiryCount(iCount || 0);
          setRecentActivities(recent || []);
          setProductViews(viewsCount || 0);
          setProfileVisits(favCount || 0);
          setTopProducts(topProds || []);
        } else if (profile?.role === "buyer") {
          const [
            { count },
            { count: savedCount },
            { count: viewsCount },
            { data: recent },
          ] = await Promise.all([
            supabase
              .from("inquiries")
              .select("*", { count: "exact", head: true })
              .eq("buyer_id", user.id),
            supabase
              .from("favorites")
              .select("*", { count: "exact", head: true })
              .eq("buyer_id", user.id),
            supabase
              .from("recent_views")
              .select("*", { count: "exact", head: true })
              .eq("buyer_id", user.id),
            supabase
              .from("inquiries")
              .select("*")
              .eq("buyer_id", user.id)
              .order("created_at", { ascending: false })
              .limit(3),
          ]);
          setSentInquiryCount(count || 0);
          setSavedProductCount(savedCount || 0);
          setRecentViewsCount(viewsCount || 0);
          setRecentActivities(recent || []);
        } else if (profile?.role === "admin") {
          const [
            { count: uCount },
            { count: pCount },
            { count: iCount },
            { count: vCount }
          ] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("products").select("*", { count: "exact", head: true }),
            supabase.from("inquiries").select("*", { count: "exact", head: true }),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verification_requested", true).eq("verified", false),
          ]);
          setAdminUsers(uCount || 0);
          setAdminProducts(pCount || 0);
          setAdminInquiries(iCount || 0);
          setAdminVerifications(vCount || 0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    let pChannel: any;
    let iChannel: any;
    let favChannel: any;
    let viewsChannel: any;

    if (profile?.role === "seller") {
      pChannel = supabase
        .channel("home-products")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
            filter: `seller_id=eq.${user.id}`,
          },
          fetchStats,
        )
        .subscribe();

      iChannel = supabase
        .channel("home-inquiries")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inquiries",
            filter: `seller_id=eq.${user.id}`,
          },
          fetchStats,
        )
        .subscribe();
    } else if (profile?.role === "buyer") {
      iChannel = supabase
        .channel("home-inquiries-buyer")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inquiries",
            filter: `buyer_id=eq.${user.id}`,
          },
          fetchStats,
        )
        .subscribe();

      favChannel = supabase
        .channel("home-favorites-buyer")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "favorites",
            filter: `buyer_id=eq.${user.id}`,
          },
          fetchStats,
        )
        .subscribe();

      viewsChannel = supabase
        .channel("home-recent-views-buyer")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "recent_views",
            filter: `buyer_id=eq.${user.id}`,
          },
          fetchStats,
        )
        .subscribe();
    } else if (profile?.role === "admin") {
      pChannel = supabase
        .channel("home-admin-products")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchStats)
        .subscribe();

      iChannel = supabase
        .channel("home-admin-inquiries")
        .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, fetchStats)
        .subscribe();

      viewsChannel = supabase
        .channel("home-admin-profiles")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchStats)
        .subscribe();
    }

    return () => {
      if (pChannel) supabase.removeChannel(pChannel);
      if (iChannel) supabase.removeChannel(iChannel);
      if (favChannel) supabase.removeChannel(favChannel);
      if (viewsChannel) supabase.removeChannel(viewsChannel);
    };
  }, [user, profile]);

  const [productViews, setProductViews] = useState(0);
  const [profileVisits, setProfileVisits] = useState(0);

  // Admin stats
  const [adminUsers, setAdminUsers] = useState(0);
  const [adminProducts, setAdminProducts] = useState(0);
  const [adminInquiries, setAdminInquiries] = useState(0);
  const [adminVerifications, setAdminVerifications] = useState(0);

  const getStats = () => {
    if (profile?.role === "seller") {
      return [
        {
          title: "Total Products",
          value: productCount.toString(),
          icon: Package,
          change: "Live sync",
        },
        {
          title: "New Inquiries",
          value: inquiryCount.toString(),
          icon: Inbox,
          change: "Live sync",
        },
        {
          title: "Product Views",
          value: productViews.toLocaleString(),
          icon: TrendingUp,
          change: "Live metric",
        },
        {
          title: "Saved by Buyers",
          value: profileVisits.toLocaleString(),
          icon: Users,
          change: "Live metric",
        },
      ];
    } else if (profile?.role === "admin") {
      return [
        {
          title: "Total Users",
          value: adminUsers.toLocaleString(),
          icon: Users,
          change: "Live metric",
        },
        {
          title: "Total Products",
          value: adminProducts.toLocaleString(),
          icon: Package,
          change: "Live metric",
        },
        {
          title: "Active Inquiries",
          value: adminInquiries.toLocaleString(),
          icon: Inbox,
          change: "Live metric",
        },
        {
          title: "Pending Verifications",
          value: adminVerifications.toString(),
          icon: AlertCircle,
          change: "Live metric",
        },
      ];
    } else {
      // Buyer
      return [
        {
          title: "Sent Inquiries",
          value: sentInquiryCount.toString(),
          icon: Inbox,
          change: "Live sync",
        },
        {
          title: "Saved Products",
          value: savedProductCount.toString(),
          icon: Heart,
          change: "Live sync",
        },
        {
          title: "Recent Views",
          value: recentViewsCount.toString(),
          icon: Clock,
          change: "Live sync",
        },
      ];
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {profile?.role === "admin" ? "Admin Overview" : "Dashboard Overview"}
        </h1>
        <p className="text-muted-foreground">
          {profile?.role === "seller"
            ? "Here's what's happening with your business today."
            : profile?.role === "admin"
              ? "Platform wide performance and metrics."
              : "Track your inquiries and saved products."}
        </p>
      </div>

      <div
        className={`grid gap-4 md:grid-cols-2 ${profile?.role === "buyer" ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isPremium = profile?.role === "seller" && profile?.verified;
          return (
              <Card
              key={i}
              className={cn(
                "border-border bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-0.5",
                isPremium && "border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.06)]"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", isPremium ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500")}>
                   <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2 mt-1">
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                      <motion.span
                        key={stat.value}
                        initial={{ opacity: 0.5, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {stat.value}
                      </motion.span>
                      {stat.change === "Live metric" && (
                        <span className="relative flex h-2 w-2 mt-1">
                          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPremium ? "bg-amber-400" : "bg-emerald-400")}></span>
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", isPremium ? "bg-amber-500" : "bg-emerald-500")}></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mt-2 inline-flex items-center gap-1.5">
                      {stat.change}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-full lg:col-span-4 border-border bg-muted/50 text-foreground backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {isLoading ? (
                // Skeletons for Recent Activity
                Array(3).fill(0).map((_, i) => (
                  <div key={`skel-${i}`} className="flex items-center">
                    <span className="relative flex h-2 w-2 rounded-full mr-4 bg-muted animate-pulse"></span>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                    <div className="ml-auto w-16 h-3 bg-muted rounded animate-pulse" />
                  </div>
                ))
              ) : (
                <>
                  {recentActivities.map((activity, i) => {
                    const isPremium = profile?.role === "seller" && profile?.verified;
                    return (
                      <div key={activity.id || i} className="flex items-center">
                        <span 
                          className={cn(
                            "relative flex h-2 w-2 rounded-full mr-4 animate-pulse",
                            isPremium 
                              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                              : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          )}
                        ></span>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none text-foreground">
                            {profile?.role === "buyer"
                              ? `Inquiry sent for product`
                              : `Received inquiry from ${activity.name || "buyer"}`}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                            {activity.message || "Details"}
                          </p>
                        </div>
                        <Timestamp 
                          date={activity.created_at} 
                          className="ml-auto items-end text-right"
                          relativeClassName="text-xs font-medium text-muted-foreground whitespace-nowrap"
                          fullClassName="text-[10px] text-muted-foreground/60 whitespace-nowrap"
                        />
                      </div>
                    );
                  })}
                  {recentActivities.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No recent activity.
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {profile?.role !== "buyer" && (
          <Card className="col-span-full lg:col-span-3 border border-border/40 bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all overflow-hidden rounded-2xl flex flex-col h-full min-h-[350px]">
            <CardHeader className="border-b border-border/50 pb-4 pt-5 px-6 shrink-0 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-bold text-foreground tracking-tight">
                {profile?.role === "admin"
                  ? "Top performing suppliers"
                  : "Top Products"}
              </CardTitle>
              {profile?.role === "seller" && (
                <a href="/dashboard/products" className="h-8 flex items-center justify-center text-xs font-semibold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 px-3 rounded-md -my-2 transition-colors">
                  View All
                </a>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col h-full">
              <div className="divide-y divide-border/60 flex-1 flex flex-col h-full">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={`skel-top-${i}`} className="p-5 px-6 flex items-center">
                      <div className="h-12 w-12 rounded-xl bg-muted animate-pulse shrink-0"></div>
                      <div className="ml-4 space-y-2.5 flex-1">
                        <div className="h-4 bg-muted rounded-md w-2/3 animate-pulse" />
                        <div className="h-3 bg-muted rounded-md w-1/3 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : profile?.role === "seller" ? (
                  topProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 flex-1 h-full min-h-[250px]">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 opacity-50 text-muted-foreground" />
                      </div>
                      <h3 className="text-[15px] font-bold tracking-tight mb-1">No products yet</h3>
                      <p className="text-sm text-muted-foreground font-medium mb-5 max-w-[200px]">
                        Add products to start receiving inquiries and quotes.
                      </p>
                      <a href="/dashboard/products" className="inline-flex items-center justify-center h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Product
                      </a>
                    </div>
                  ) : (
                    topProducts.map((product) => (
                      <a 
                        href={`/dashboard/products?search=${encodeURIComponent(product.name)}`} 
                        key={product.id} 
                        className="flex items-center p-5 px-6 hover:bg-muted/30 transition-colors group relative"
                      >
                        <div className="h-12 w-12 rounded-xl bg-muted/80 border border-border/50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:border-emerald-500/20 transition-colors">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-foreground tracking-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[13px] font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5" title="Inquiries"><MessageSquare className="w-3.5 h-3.5 opacity-70" /> {product.inquiries?.[0]?.count || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="flex items-center gap-1.5" title="Saved"><Heart className="w-3.5 h-3.5 opacity-70" /> {product.favorites?.[0]?.count || 0}</span>
                            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="flex items-center gap-1.5" title="Views"><Eye className="w-3.5 h-3.5 opacity-70" /> {product.recent_views?.[0]?.count || 0}</span>
                          </div>
                        </div>
                        <div className="ml-3 shrink-0 flex items-center gap-3">
                           {product.status === 'active' ? (
                             <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                           ) : (
                             <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40"></span>
                           )}
                           <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/70 transition-colors group-hover:translate-x-0.5 duration-300" />
                        </div>
                      </a>
                    ))
                  )
                ) : (
                  [1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center p-5 px-6 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-10 w-10 rounded-full bg-muted/60 border border-border/50 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-muted-foreground/70" />
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-[15px] font-bold tracking-tight text-foreground group-hover:text-emerald-600 transition-colors">
                          AgriCorp Inc.
                        </p>
                        <p className="text-[13px] text-muted-foreground font-medium">
                          145 total orders
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/70 transition-colors group-hover:translate-x-0.5 duration-300" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
