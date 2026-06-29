import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Store, MapPin } from "lucide-react";
import { VerifiedBadge } from "../components/ui/VerifiedBadge";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        setVisibleCount((prev) => Math.min(prev + 12, suppliers.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [suppliers.length]);

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "seller")
          .eq("verified", true);

        if (!error && data) {
          setSuppliers(data);
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();

    // Listen to real-time profile updates
    const channel = supabase
      .channel('public:profiles:suppliers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.role === 'seller' && payload.new.verified === true) {
            setSuppliers(current => [payload.new, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setSuppliers(current => {
              const isCurrentlyInList = current.some(s => s.id === payload.new.id);
              const shouldBeInList = payload.new.role === 'seller' && payload.new.verified === true;
              
              if (isCurrentlyInList && shouldBeInList) {
                // Update
                return current.map(s => s.id === payload.new.id ? payload.new : s);
              } else if (isCurrentlyInList && !shouldBeInList) {
                // Remove
                return current.filter(s => s.id !== payload.new.id);
              } else if (!isCurrentlyInList && shouldBeInList) {
                // Add
                return [payload.new, ...current];
              }
              return current;
            });
          } else if (payload.eventType === 'DELETE') {
            setSuppliers(current => current.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Verified Suppliers
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Discover and connect with trusted B2B suppliers across the platform.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin mb-4"></div>
          <p className="font-medium text-muted-foreground animate-pulse">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/40 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No verified suppliers yet</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            Check back later for new supplier listings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {suppliers.slice(0, visibleCount).map((supplier) => (
            <Link
              key={supplier.id}
              to={`/suppliers/${supplier.id}`}
              className="bg-card border border-border/60 rounded-3xl p-6 transition-all duration-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 hover:border-emerald-500/40 relative group"
            >
              <div className="flex flex-col h-full relative z-10">
                <div className="h-16 w-16 bg-muted/80 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-border/50 shadow-sm mb-5">
                  {supplier.logo_url ? (
                    <img
                      src={supplier.logo_url}
                      alt={supplier.business_name || ""}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-xl font-extrabold tracking-tight uppercase text-muted-foreground">
                      {supplier.business_name ? supplier.business_name.charAt(0) : "S"}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 mb-2 w-full">
                  <h3 className="text-xl font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-1 flex-1 min-w-0">
                    {supplier.business_name || "Unnamed Supplier"}
                  </h3>
                  <VerifiedBadge showText={false} country={supplier.country} className="shrink-0 scale-90 -mt-0.5" />
                </div>

                {supplier.address && (
                  <div className="flex items-center text-muted-foreground text-sm font-medium mb-4">
                    <MapPin className="h-4 w-4 mr-1.5 opacity-70 text-emerald-500" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}

                {supplier.bio && (
                  <p className="text-sm text-foreground/80 line-clamp-2 mt-auto">
                    {supplier.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
