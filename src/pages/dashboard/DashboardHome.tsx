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
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

export default function DashboardHome() {
  const { profile, user } = useAuthStore();
  const [productCount, setProductCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  const [sentInquiryCount, setSentInquiryCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [savedProductCount, setSavedProductCount] = useState(0);
  const [recentViewsCount, setRecentViewsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
              .select("*")
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
              .eq("products.seller_id", user.id)
          ]);
          setProductCount(pCount || 0);
          setInquiryCount(iCount || 0);
          setRecentActivities(recent || []);
          setProductViews(viewsCount || 0);
          setProfileVisits(favCount || 0);
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
                "border-border bg-muted/50 text-foreground backdrop-blur-sm",
                isPremium && "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", isPremium ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500")} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2 mt-1">
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <motion.span
                        key={stat.value}
                        initial={{ opacity: 0.5, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {stat.value}
                      </motion.span>
                      {stat.change === "Live metric" && (
                        <span className="relative flex h-2 w-2">
                          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPremium ? "bg-amber-400" : "bg-emerald-400")}></span>
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", isPremium ? "bg-amber-500" : "bg-emerald-500")}></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
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
                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </div>
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
          <Card className="col-span-full lg:col-span-3 border-border bg-muted/50 text-foreground backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {profile?.role === "admin"
                  ? "Top performing suppliers"
                  : "Top Products"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={`skel-top-${i}`} className="flex items-center">
                      <div className="h-9 w-9 rounded bg-muted animate-pulse shrink-0"></div>
                      <div className="ml-4 space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : (
                  [1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="h-9 w-9 rounded bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                        {profile?.role === "admin" ? (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {profile?.role === "admin"
                            ? "AgriCorp Inc."
                            : "Your Products"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.role === "admin"
                            ? "145 total orders"
                            : "Syncing..."}
                        </p>
                      </div>
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
