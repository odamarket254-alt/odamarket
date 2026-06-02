import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  Search,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Bookmark,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { SwipeableProductCard } from "../components/SwipeableProductCard";

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
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

const categories = [
  {
    name: "Agriculture",
    count: "1,200+",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800",
  },
  {
    name: "Livestock",
    count: "450+",
    image:
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=800",
  },
  {
    name: "Gas Supply",
    count: "300+",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/3b/Compressed_gas_cylinders.mapp_and_oxygen.triddle.jpg",
  },
  {
    name: "Construction Materials",
    count: "800+",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800",
  },
  {
    name: "Manufacturing",
    count: "650+",
    image:
      "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=800",
  },
  {
    name: "Electronics",
    count: "1,500+",
    image:
      "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=800",
  },
  {
    name: "Wholesale Foods",
    count: "2,100+",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800",
  },
  {
    name: "Packaging",
    count: "900+",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/eb/Box.agr.jpg",
  },
  {
    name: "Machinery",
    count: "400+",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800",
  },
  {
    name: "Textiles",
    count: "1,100+",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800",
  },
];

const featuredProducts = [
  {
    id: "1",
    title: "Premium Arabica Coffee Beans",
    supplier: "Rift Valley Farms",
    location: "Kenya",
    image:
      "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isVerified: true,
  },
  {
    id: "2",
    title: "Industrial Grade Cement - 50kg",
    supplier: "Dangote Materials",
    location: "Nigeria",
    image:
      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isVerified: true,
  },
  {
    id: "3",
    title: "Grade A Maize Bags (Bulk)",
    supplier: "AgriCorp African",
    location: "Tanzania",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e3/Zea_mays_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-283.jpg",
    isVerified: false,
  },
  {
    id: "4",
    title: "Commercial LPG Cylinders",
    supplier: "SafeGas Ltd",
    location: "South Africa",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/f/fe/Propane_tank_20lb.jpg",
    isVerified: true,
  },
];

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
          {product.category}
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
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategoryCounts();

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
          fetchCategoryCounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, profiles(verified, business_name, location)")
        .eq("status", "active")
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

  const fetchCategoryCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      
      const promises = categories.map(async (cat) => {
        const { count, error } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .eq("category", cat.name);
          
        if (!error && count !== null) {
          counts[cat.name.toLowerCase()] = count;
        }
      });
      
      await Promise.all(promises);
      setCategoryCounts(counts);
    } catch (err) {
      console.error(err);
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
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">10k+</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Active Suppliers
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l sm:border-l-0 border-border/50 px-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">100%</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Verified Businesses
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-2">
              <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">54</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                African Countries
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l sm:border-l-0 border-border/50 px-2">
              <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">50k+</h3>
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
          <div className="flex items-end justify-between mb-10">
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
              className="hidden sm:flex text-emerald-600 dark:text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 hover:bg-muted/50 text-foreground"
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, i) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="block relative h-48 md:h-56 rounded-2xl overflow-hidden group border border-border shadow-lg bg-slate-900 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-border"
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/60 z-10" />
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 p-5 flex flex-col justify-end transition-transform duration-500 group-hover:-translate-y-1">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 shadow-black/50 drop-shadow-md">
                      {category.name}
                    </h3>
                    <p className="text-sm font-medium text-emerald-400 drop-shadow-md opacity-90">
                      {categoryCounts[category.name.toLowerCase()] || 0} products
                    </p>
                  </div>
                  {/* Subtle Gradient Overlay for extra text pop */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                </Link>
              </motion.div>
            ))}
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
              className="hidden sm:flex border-border bg-muted/50 text-foreground text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Browse Market
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {isLoading ? (
              Array(8).fill(null).map((_, i) => (
                <div key={i} className="flex flex-col w-full rounded-lg border border-border bg-card animate-pulse overflow-hidden">
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
