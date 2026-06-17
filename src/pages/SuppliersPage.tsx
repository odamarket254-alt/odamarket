import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Store, MapPin, ShieldCheck } from "lucide-react";

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
                <div className="flex bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium items-center gap-1 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {supplier.business_name || "Unnamed Supplier"}
              </h3>

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
