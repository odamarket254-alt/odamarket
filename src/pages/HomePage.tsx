import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Search,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Sprout,
  HardHat,
  Factory,
  Cpu,
  Package,
  Briefcase,
  Utensils,
  Stethoscope,
  Coffee,
  FlaskConical,
  Shirt,
  Shield,
  Car,
  Monitor,
  Sofa,
  Zap,
  Warehouse,
  BookOpen,
  Pickaxe,
  LineChart,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTimestamp: number | null = null;
          const duration = 2000;

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(easeProgress * value));
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={elementRef}>{displayValue}{value >= 250 ? "+" : ""}</span>;
}

interface MarketplaceProduct {
  id: string;
  name: string;
  category_id?: string;
  category?: string | { name: string; slug: string };
  price: string;
  stock: string;
  image_url: string;
  seller_id?: string;
  created_at: string;
  profiles?: {
    verified: boolean;
    business_name: string;
    location: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
}

const getIconByName = (name?: string) => {
  const icons: Record<string, any> = {
    Sprout,
    HardHat,
    Factory,
    Cpu,
    Package,
    Briefcase,
    Utensils,
    Stethoscope,
    Coffee,
    FlaskConical,
    Shirt,
    Shield,
    Car,
    Monitor,
    Sofa,
    Zap,
    Warehouse,
    BookOpen,
    Pickaxe,
    LineChart,
  };
  const Icon = name && icons[name] ? icons[name] : Package;
  return <Icon className="w-6 h-6 sm:w-8 sm:h-8" />;
};

const CompactProductCard = ({ product }: { product: any }) => {
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex flex-col h-full group overflow-hidden rounded-lg bg-card border border-border shadow-sm hover:border-emerald-500/30 transition-colors"
    >
      <div className="aspect-square relative bg-muted overflow-hidden">
        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60"
          }
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.profiles?.verified && (
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-border shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 fill-amber-500/20" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="text-[11px] sm:text-xs uppercase font-bold text-muted-foreground truncate mb-1">
          {typeof product.categories === "object" && product.categories !== null
            ? product.categories.name
            : product.category || "Uncategorized"}
        </div>
        <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-2 mb-1.5 min-h-[2.5em] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        <div className="mt-auto">
          <p className="text-sm sm:text-base font-bold text-primary truncate">
            {product.price ? product.price : "Req Price"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default function HomePage() {
  const [featuredRealtimeProducts, setFeaturedRealtimeProducts] = useState<
    MarketplaceProduct[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);

  const [activeSuppliersCount, setActiveSuppliersCount] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
    fetchSuppliersCount();

    const channel = supabase
      .channel("public-products-changes-home")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: "status=eq.active",
        },
        () => {
          fetchFeaturedProducts();
        },
      )
      .subscribe();

    const suppliersChannel = supabase
      .channel("public-profiles-changes-home")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "role=eq.seller",
        },
        () => {
          fetchSuppliersCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(suppliersChannel);
    };
  }, []);

  const fetchSuppliersCount = async () => {
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "seller")
        .eq("verified", true);

      if (!error && count !== null) {
        setActiveSuppliersCount(count);
      }
    } catch (err) {
      console.error("Error fetching suppliers count:", err);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, profiles!inner(verified, business_name, location), categories(name, slug)",
        )
        .eq("status", "active")
        .eq("profiles.verified", true)
        .order("created_at", { ascending: false })
        .limit(16);

      if (error) {
        console.error("Error fetching featured products:", error);
      } else if (data) {
        setFeaturedRealtimeProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCatsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("level", 0)
        .order("sort_order", { ascending: true })
        .limit(16);

      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCatsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-20 right-40 w-32 h-32 border border-emerald-500/10 rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-64 h-64 border border-amber-500/10 rounded-full"></div>

        <div className="container relative mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Africa's Fastest Growing B2B Network
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.05]">
              Buy From Trusted <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 dark:from-emerald-400 dark:via-amber-200 dark:to-emerald-500">
                African Suppliers
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              Connect your business across Africa. Source products, manage
              inquiries, and scale your operations with verified suppliers and
              structured quotes.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
                } else {
                  navigate("/products");
                }
              }}
              className="flex items-center gap-2 p-1.5 sm:p-2 bg-card text-foreground backdrop-blur-xl border border-border/80 rounded-2xl w-full max-w-2xl mx-auto shadow-2xl flex-col sm:flex-row"
            >
              <div className="flex-1 flex items-center px-4 gap-3 w-full border-b sm:border-b-0 sm:border-r border-border/50 pb-2 sm:pb-0">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you sourcing today?"
                  className="w-full bg-transparent border-none outline-none text-foreground/90 placeholder:text-muted-foreground h-10 sm:h-12 shadow-none focus-visible:ring-0 px-0 text-sm sm:text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-10 sm:h-12 px-8 text-sm bg-emerald-600 hover:bg-emerald-500 text-primary-foreground font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-105 transition-transform w-[95%] sm:w-auto mx-auto mb-1.5 sm:mb-0"
              >
                Search Market
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="bg-background border-y border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 sm:gap-y-0 sm:gap-x-8 sm:divide-x divide-border/50">
            <div className="flex flex-col items-center justify-center text-center px-2">
              <TrendingUp className="h-6 w-6 text-[#00C896] mb-2" />
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                <AnimatedNumber value={activeSuppliersCount !== null && activeSuppliersCount > 250 ? activeSuppliersCount : 250} />
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground font-semibold mt-1">
                Active Suppliers
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l sm:border-l-0 border-border/50 px-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                100%
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Verified Businesses
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-2">
              <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                54
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                African Countries
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l sm:border-l-0 border-border/50 px-2">
              <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                50k+
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Successful Quotes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Explore Categories
              </h2>
              <p className="text-muted-foreground">
                Find exactly what you need from our organized directory.
              </p>
            </div>
            <Button
              variant="ghost"
              render={<Link to="/categories" />}
              className="hidden sm:flex text-emerald-600 dark:text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 hover:bg-muted/50 text-foreground"
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
            {catsLoading
              ? Array(16)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-border bg-card animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="h-3 w-16 bg-muted mt-2 rounded" />
                    </div>
                  ))
              : categories.map((category, i) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="h-full"
                  >
                    <Link
                      to={`/c/${category.slug}`}
                      className={cn(
                        "flex flex-col h-full rounded-xl border border-border shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all group overflow-hidden relative",
                        category.image_url
                          ? "aspect-square justify-end"
                          : "justify-center items-center text-center p-3 sm:p-4 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
                      )}
                    >
                      {category.image_url ? (
                        <>
                          <div className="absolute inset-0 z-0">
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all" />
                          </div>
                          <div className="relative z-10 p-3 sm:p-4 w-full mt-auto">
                            <span className="text-[10px] sm:text-[12px] font-bold leading-tight text-white group-hover:text-emerald-300 transition-colors drop-shadow-md">
                              {category.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2.5">
                            {getIconByName(category.icon)}
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            {category.name}
                          </span>
                        </>
                      )}
                    </Link>
                  </motion.div>
                ))}
          </div>

          <div className="mt-6 sm:hidden flex justify-center">
            <Button
              variant="outline"
              className="w-full"
              render={<Link to="/categories" />}
            >
              View All Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Top quality products from verified suppliers this week.
              </p>
            </div>
            <Button
              variant="outline"
              render={<Link to="/products" />}
              className="hidden sm:flex border-border bg-muted/50 text-foreground text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Browse Market
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {isLoading ? (
              Array(8)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col w-full rounded-lg border border-border bg-card animate-pulse overflow-hidden"
                  >
                    <div className="aspect-square bg-muted/60 relative w-full flex-shrink-0" />
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="mt-auto h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
            ) : featuredRealtimeProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p>No featured products available at the moment.</p>
              </div>
            ) : (
              featuredRealtimeProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CompactProductCard product={product} />
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-8 sm:hidden flex justify-center">
            <Button
              variant="outline"
              className="w-full"
              render={<Link to="/products" />}
            >
              Browse All Products
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-emerald-900/10 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-semibold mb-6 uppercase tracking-wider">
            Unlock Wholesale Prices
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 max-w-2xl mx-auto">
            Ready to expand your market reach?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of African businesses sourcing and selling
            high-quality products on ODA Market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              render={<Link to="/register" />}
              className="bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl shadow-emerald-500/20 rounded-xl px-8 h-14 text-lg font-bold"
            >
              Register as Supplier
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link to="/products" />}
              className="border-border bg-muted/50 text-foreground text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl px-8 h-14 text-lg font-medium backdrop-blur-sm"
            >
              Start Sourcing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
