import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Search, MapPin, Filter, ShieldCheck, ShoppingBag, Bookmark, MessageCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
  seller_id?: string;
  created_at: string;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || searchParams.get("category") || "";

  const setSearch = (newSearch: string) => {
    if (newSearch) {
      setSearchParams({ q: newSearch }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveProducts();

    const channel = supabase
      .channel("public-products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: "status=eq.active",
        },
        () => {
          fetchActiveProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, profiles!inner(verified)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching marketplace products:", error);
      } else if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        {/* Header / Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Browse Market
            </h1>
            <p className="text-muted-foreground">
              Discover verified products from suppliers across Africa.
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <form 
              className="relative flex-1 md:w-80"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, categories..."
                className="pl-9 bg-muted/50 text-foreground border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500"
              />
            </form>
            <Button
              variant="outline"
              className="shrink-0 bg-muted/50 text-foreground border-border hover:bg-white/10 text-foreground"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
          <Badge
            variant="secondary"
            onClick={() => setSearch("")}
            className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 text-sm border border-border ${search === "" ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-muted/50 text-foreground/80"}`}
          >
            All
          </Badge>
          {[
            "Agriculture",
            "Construction",
            "Gas Supply",
            "Manufacturing",
            "Livestock",
            "Electronics",
            "Wholesale Foods",
            "Packaging",
            "Machinery",
            "Textiles",
          ].map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              onClick={() => setSearch(cat)}
              className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 text-sm border border-border ${search === cat ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-muted/50 text-foreground/80"}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array(8).fill(null).map((_, i) => (
              <div key={i} className="flex flex-col w-full h-[320px] rounded-xl border border-border bg-card animate-pulse">
                <div className="aspect-[4/3] bg-muted/60 relative w-full flex-shrink-0 rounded-t-xl" />
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="mt-auto h-4 bg-muted rounded w-1/2" />
                  <div className="h-9 bg-muted rounded w-full mt-2" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-border/50 rounded-2xl bg-muted/50 text-foreground backdrop-blur-sm">
              <ShoppingBag className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                No products found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            filtered.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group h-full flex mt-auto"
              >
                <Card className="overflow-hidden h-full border-border bg-card text-card-foreground hover:border-primary/30 hover:shadow-2xl transition-all duration-300 relative flex flex-col w-full">
                  <div className="aspect-[4/3] overflow-hidden relative bg-muted flex-shrink-0">
                    {product.profiles?.verified && (
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-border shadow-sm">
                        <CheckCircle className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                        <span className="text-[10px] font-bold text-foreground tracking-wide uppercase">Verified</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Toggle save logic here
                      }}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/60 backdrop-blur-md hover:bg-background/90 text-muted-foreground hover:text-red-500 transition-colors border border-border/50"
                      aria-label="Save product"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <img
                      src={
                        product.image_url ||
                        "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60"
                      }
                      alt={product.name}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="mb-2 flex items-start justify-between gap-1">
                      <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {product.name}
                      </h3>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 md:text-[10px] uppercase font-bold shrink-0 mt-0.5">
                         {product.category}
                      </Badge>
                    </div>
                    <div className="mt-1">
                       <p className="text-primary font-bold text-lg">
                        {product.price ? product.price : "Price on Request"}
                       </p>
                    </div>
                    
                    <div className="mt-auto space-y-2 pt-3 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground truncate max-w-[70%] text-muted-foreground">
                          {product.profiles?.business_name || `Supplier ${product.seller_id?.slice(0, 5)}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[60px]">{product.profiles?.location || "Global"}</span>
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full h-9 text-xs font-semibold mt-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary"
                        onClick={(e) => {
                          // Default link behavior handles navigation
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Inquiry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
