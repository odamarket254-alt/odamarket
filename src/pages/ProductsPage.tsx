import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
// Cache invalidation forced
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Search,
  MapPin,
  Filter,
  ShieldCheck,
  ShoppingBag,
  Bookmark,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { SwipeableProductCard } from "../components/SwipeableProductCard";

interface MarketplaceProduct {
  id: string;
  name: string;
  category?: string;
  categories?: { name: string; slug: string };
  price: string;
  stock: string;
  image_url: string;
  seller_id?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";

  // URL params or search params
  const selectedCategory = categorySlug || searchParams.get("category") || "";

  const setSearch = (newSearch: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSearch) {
      params.set("q", newSearch);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  const setCategoryFilter = (catSlug: string) => {
    if (catSlug) {
      navigate(`/c/${catSlug}${search ? `?q=${search}` : ""}`);
    } else {
      navigate(`/products${search ? `?q=${search}` : ""}`);
    }
  };

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // open sidebar by default on large screens
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

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
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .eq("level", 0)
        .order("sort_order", { ascending: true });
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveProducts = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("products")
        .select(selectedCategory ? "*, profiles(*), categories!inner(name, slug)" : "*, profiles(*), categories(name, slug)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedCategory) {
        query = query.eq("categories.slug", selectedCategory);
      }

      const { data, error } = await query;

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

  const filtered = products.filter((p) => {
    const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase());
    const catMatch =
      p.categories?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || catMatch;
  });

  const currentCategoryObj = categories.find(
    (c) => c.slug === selectedCategory,
  );

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Products", href: selectedCategory ? "/products" : undefined },
  ];
  if (selectedCategory && currentCategoryObj) {
    breadcrumbItems.push({ label: currentCategoryObj.name });
  } else if (selectedCategory) {
    breadcrumbItems.push({
      label: selectedCategory
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    });
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        <Breadcrumbs items={breadcrumbItems} />
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
                placeholder="Search products..."
                className="pl-9 bg-muted/50 text-foreground border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500"
              />
            </form>
            <Button
              variant={isSidebarOpen ? "default" : "outline"}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={isSidebarOpen ? "" : "shrink-0 bg-muted/50 text-foreground border-border hover:bg-accent hover:text-accent-foreground text-foreground"}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Animated Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0, x: -20 }}
                animate={{ opacity: 1, width: "16rem", x: 0 }}
                exit={{ opacity: 0, width: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full lg:w-64 shrink-0 overflow-hidden"
              >
                <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Categories</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setCategoryFilter("")}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === "" 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.slug)}
                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.slug 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Categories Pills (Mobile Only) */}
            <div className="flex lg:hidden overflow-x-auto pb-4 mb-4 gap-2 hide-scrollbar">
              <Badge
                variant="secondary"
                onClick={() => setCategoryFilter("")}
                className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-500 text-sm border border-border ${selectedCategory === "" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border-emerald-500/30" : "bg-muted/50 text-foreground/80"}`}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  onClick={() => setCategoryFilter(cat.slug)}
                  className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-500 text-sm border border-border shrink-0 ${selectedCategory === cat.slug ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border-emerald-500/30" : "bg-muted/50 text-foreground/80"}`}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array(8)
                .fill(null)
                .map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="flex flex-col w-full h-[320px] rounded-xl border border-border bg-card animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-muted/60 relative w-full flex-shrink-0 rounded-t-xl" />
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="mt-auto h-4 bg-muted rounded w-1/2" />
                      <div className="h-9 bg-muted rounded w-full mt-2" />
                    </div>
                  </motion.div>
                ))
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="col-span-full py-12 text-center border border-border/50 rounded-2xl bg-muted/50 text-foreground backdrop-blur-sm"
              >
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">
                  {selectedCategory
                    ? "No products found in this category"
                    : "No products found"}
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </motion.div>
            ) : (
              filtered.map((product, idx) => (
                <motion.div
                  layout
                  key={`product-${product.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <SwipeableProductCard product={product as any} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
        </div>
        </div>
      </div>
    </div>
  );
}
