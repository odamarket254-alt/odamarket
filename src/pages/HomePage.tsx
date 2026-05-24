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
} from "lucide-react";
import { motion } from "motion/react";
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
      "https://images.unsplash.com/photo-1612270138971-ce4be8e12d5d?q=80&w=800",
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
      "https://images.unsplash.com/photo-1530587191344-18005eb11dc4?q=80&w=800",
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
      "https://images.unsplash.com/photo-1510627498534-cf7e9002fcca?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isVerified: false,
  },
  {
    id: "4",
    title: "Commercial LPG Cylinders",
    supplier: "SafeGas Ltd",
    location: "South Africa",
    image:
      "https://images.unsplash.com/photo-1629828551695-1f9f257a09d3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isVerified: true,
  },
];

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
        .limit(4);

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
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("status", "active");

      if (error) {
        console.error("Error fetching category counts:", error);
      } else if (data) {
        const counts: Record<string, number> = {};
        data.forEach((p) => {
          if (p.category) {
            const catName = p.category.toLowerCase();
            counts[catName] = (counts[catName] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      }
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

        <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Africa's Fastest Growing B2B Network
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.05]">
              Buy From Trusted <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-200 to-emerald-500">
                African Suppliers
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
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
              className="flex items-center gap-2 p-2 bg-muted/50 text-foreground backdrop-blur-xl border border-border rounded-2xl w-full max-w-2xl mx-auto shadow-2xl flex-col sm:flex-row"
            >
              <div className="flex-1 flex items-center px-4 gap-3 w-full">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you sourcing today?"
                  className="w-full bg-transparent border-none outline-none text-foreground/90 placeholder:text-zinc-600 h-12 shadow-none focus-visible:ring-0 px-0"
                />
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform w-full sm:w-auto"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center text-center px-4">
              <TrendingUp className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="text-2xl font-bold text-foreground">10k+</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Active Suppliers
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <ShieldCheck className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="text-2xl font-bold text-foreground">100%</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Verified Businesses
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <MapPin className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="text-2xl font-bold text-foreground">54</h3>
              <p className="text-sm text-muted-foreground font-medium">
                African Countries
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <UserCheck className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="text-2xl font-bold text-foreground">50k+</h3>
              <p className="text-sm text-muted-foreground font-medium">
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
              className="hidden sm:flex text-emerald-500 hover:text-emerald-400 hover:bg-muted/50 text-foreground"
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
                  className="block relative h-48 md:h-56 rounded-2xl overflow-hidden group border border-border shadow-lg bg-muted/50 text-foreground transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-white/20"
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/60 z-10" />
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 p-5 flex flex-col justify-end transition-transform duration-500 group-hover:-translate-y-1">
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 shadow-black/50 drop-shadow-md">
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
              className="hidden sm:flex border-border bg-muted/50 text-foreground text-foreground hover:bg-white/10"
            >
              Browse Market
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto"></div>
                <p className="mt-4">Loading featured products...</p>
              </div>
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
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/products/${product.id}`}
                    className="group block h-full"
                  >
                    <Card className="overflow-hidden h-full border-border bg-muted/50 text-foreground hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-300">
                      <div className="aspect-[4/3] overflow-hidden relative bg-black">
                        <img
                          src={
                            product.image_url ||
                            "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60"
                          }
                          alt={product.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />
                      </div>
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </h3>
                        </div>
                        <div className="space-y-2 mt-4">
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="font-medium truncate">
                              {product.profiles?.business_name || `Supplier ${product.seller_id?.slice(0, 5)}`}
                            </span>
                            {product.profiles?.verified && (
                              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {product.profiles?.location || "Global Market"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold mb-6 uppercase tracking-wider">
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
              className="border-border bg-muted/50 text-foreground text-foreground hover:bg-white/10 rounded-xl px-8 h-14 text-lg font-medium backdrop-blur-sm"
            >
              Start Sourcing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
