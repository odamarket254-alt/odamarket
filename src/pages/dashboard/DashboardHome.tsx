import { useState, useEffect } from "react";
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

export default function DashboardHome() {
  const { profile, user } = useAuthStore();
  const [productCount, setProductCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  const [sentInquiryCount, setSentInquiryCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [savedProductCount, setSavedProductCount] = useState(0);
  const [recentViewsCount, setRecentViewsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      if (profile?.role === "seller") {
        const [{ count: pCount }, { count: iCount }, { data: recent }] =
          await Promise.all([
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
          ]);
        setProductCount(pCount || 0);
        setInquiryCount(iCount || 0);
        setRecentActivities(recent || []);
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
    }

    return () => {
      if (pChannel) supabase.removeChannel(pChannel);
      if (iChannel) supabase.removeChannel(iChannel);
      if (favChannel) supabase.removeChannel(favChannel);
      if (viewsChannel) supabase.removeChannel(viewsChannel);
    };
  }, [user, profile]);

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
          value: "1,245",
          icon: TrendingUp,
          change: "+15% vs last month",
        },
        {
          title: "Profile Visits",
          value: "340",
          icon: Users,
          change: "+5% vs last month",
        },
      ];
    } else if (profile?.role === "admin") {
      return [
        {
          title: "Total Users",
          value: "1,204",
          icon: Users,
          change: "+50 this week",
        },
        {
          title: "Total Products",
          value: "3,420",
          icon: Package,
          change: "+120 this week",
        },
        {
          title: "Active Inquiries",
          value: "450",
          icon: Inbox,
          change: "12 needs attention",
        },
        {
          title: "Pending Verifications",
          value: "15",
          icon: AlertCircle,
          change: "Waitlist",
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
          return (
            <Card
              key={i}
              className="border-border bg-muted/50 text-foreground backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 border-border bg-muted/50 text-foreground backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivities.map((activity, i) => (
                <div key={activity.id || i} className="flex items-center">
                  <span className="relative flex h-2 w-2 rounded-full bg-emerald-500 mr-4 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
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
              ))}
              {recentActivities.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No recent activity.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {profile?.role !== "buyer" && (
          <Card className="col-span-3 border-border bg-muted/50 text-foreground backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {profile?.role === "admin"
                  ? "Top performing suppliers"
                  : "Top Products"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-9 w-9 rounded bg-white/10 border border-border/50 flex items-center justify-center shrink-0">
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
