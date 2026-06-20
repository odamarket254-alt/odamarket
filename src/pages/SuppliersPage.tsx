import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Store, MapPin } from "lucide-react";
import { VerifiedBadge } from "../components/ui/VerifiedBadge";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Verified Suppliers
          </h1>
          <p className="text-muted-foreground">
            Discover and connect with trusted suppliers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No verified suppliers found</h3>
          <p className="text-muted-foreground">
            Check back later for new supplier listings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              to={`/suppliers/${supplier.id}`}
              className="bg-card border border-border rounded-xl p-6 transition-all hover:shadow-md group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  {supplier.logo_url ? (
                    <img
                      src={supplier.logo_url}
                      alt={supplier.business_name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-primary" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {supplier.business_name || "Unnamed Supplier"}
                </h3>
                <VerifiedBadge showText={false} className="shrink-0 px-1 py-1" iconClassName="w-4 h-4 ml-[2px] mr-[2px]" />
              </div>

              {supplier.address && (
                <div className="flex items-center text-muted-foreground text-sm mb-4">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {supplier.address}
                </div>
              )}

              {supplier.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {supplier.bio}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
