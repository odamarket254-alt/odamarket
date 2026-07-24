import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Search, Filter, ShoppingCart, ChevronDown, Check, ChevronRight, LayoutGrid, List, SlidersHorizontal, Heart, Star, Eye, ArrowRightLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../store/useCartStore";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { ProductCard } from "../components/products/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      // Join with categories to get the slug
      let q = supabase
        .from("products")
        .select(`
          id, name, price, stock, image_url, seller_id, 
          product_type:product_types(name),
          category:categories!inner(slug, name)
        `)
        .eq("status", "active");

      if (query) {
        q = q.ilike("name", `%${query}%`);
      }
      
      if (categoryFilter) {
        q = q.eq("categories.slug", categoryFilter);
      }
      
      const { data, error } = await q;
      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        setProducts(data);
      }
    };
    fetchProducts();
    
    const channel = supabase.channel('public:products:store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [query, categoryFilter]);

  const filterCategories = [
    { name: "Fruits", count: 124 },
    { name: "Vegetables", count: 86 },
    { name: "Dairy", count: 42 },
    { name: "Bakery", count: 35 },
    { name: "Meat", count: 56 },
    { name: "Seafood", count: 28 },
    { name: "Frozen Foods", count: 91 },
    { name: "Snacks", count: 156 },
    { name: "Drinks", count: 112 },
    { name: "Household", count: 88 },
  ];

  const brands = ["Nestlé", "Coca-Cola", "Nivea", "Pampers", "Unilever", "Oreo"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[80px] lg:pt-[100px] pb-24 font-sans text-[#111827]">
      {/* Breadcrumb */}
      <div className="border-b border-[#E5E7EB] bg-[#FFFDF8]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-[13px] font-medium text-[#6B7280]">
            <Link to="/" className="hover:text-[slate-900] transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="hover:text-[slate-900] transition-colors cursor-pointer">Categories</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[slate-900] font-bold">All Products</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight text-[slate-900] mb-2">
              {query ? `Search results for "${query}"` : "All Products"}
            </h1>
            <p className="text-[#6B7280] font-medium">Showing 1–{products.length} of {products.length} Products</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 h-10 px-4 bg-[#FFFDF8] border border-[#E5E7EB] rounded-lg text-[#374151] font-medium text-[14px]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <div className="hidden sm:flex bg-[#FFFDF8] border border-[#E5E7EB] rounded-lg p-1">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-colors", viewMode === "grid" ? "bg-[#F8FAFC] text-[slate-900] shadow-sm" : "text-[#6B7280] hover:text-[slate-900]")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-colors", viewMode === "list" ? "bg-[#F8FAFC] text-[slate-900] shadow-sm" : "text-[#6B7280] hover:text-[slate-900]")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <select className="h-10 pl-4 pr-10 bg-[#FFFDF8] border border-[#E5E7EB] rounded-lg text-[#374151] font-medium text-[14px] appearance-none focus:outline-none focus:border-[slate-900] cursor-pointer text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900">
                <option>Sort by: Popularity</option>
                <option>Latest Arrivals</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Highest Rated</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Left Sidebar Filters (Desktop) */}
          <div className={cn(
            "fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-[280px] shrink-0 bg-[#FFFDF8] lg:bg-transparent lg:z-0 transition-transform duration-300 overflow-y-auto lg:overflow-visible",
            isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <div className="bg-[#FFFDF8] rounded-[18px] lg:border border-[#E5E7EB] shadow-sm p-6 space-y-8 min-h-screen lg:min-h-0 sticky top-[120px]">
              {/* Mobile Filter Header */}
              <div className="flex items-center justify-between lg:hidden mb-4 pb-4 border-b border-[#E5E7EB]">
                <h2 className="text-[18px] font-bold text-[slate-900]">Filters</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 -mr-2 text-[#6B7280]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-[16px] font-bold text-[#111827] mb-4">Categories</h3>
                <div className="space-y-3">
                  {filterCategories.map((cat, i) => (
                    <label key={i} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB] text-[#C65A28] focus:ring-[#C65A28]/20 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                        <span className="text-[14px] text-[#374151] group-hover:text-[#C65A28] transition-colors">{cat.name}</span>
                      </div>
                      <span className="text-[12px] text-[#9CA3AF] bg-[#F8FAFC] px-2 py-0.5 rounded-full">{cat.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-6 border-t border-[#E5E7EB]">
                <h3 className="text-[16px] font-bold text-[#111827] mb-4">Price Range</h3>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Min" className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-[#9CA3AF]">-</span>
                  <input type="number" placeholder="Max" className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                </div>
                <button className="w-full mt-4 h-10 bg-[#F8FAFC] text-[slate-900] font-bold text-[14px] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                  Apply Price
                </button>
              </div>

              {/* Brands */}
              <div className="pt-6 border-t border-[#E5E7EB]">
                <h3 className="text-[16px] font-bold text-[#111827] mb-4">Brands</h3>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input type="text" placeholder="Search brands..." className="w-full h-10 pl-9 pr-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                </div>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {brands.map((brand, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB] text-[#C65A28] focus:ring-[#C65A28]/20 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                      <span className="text-[14px] text-[#374151] group-hover:text-[#C65A28] transition-colors">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="pt-6 border-t border-[#E5E7EB]">
                <h3 className="text-[16px] font-bold text-[#111827] mb-4">Rating</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB] text-[#C65A28] focus:ring-[#C65A28]/20 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < rating ? "fill-[#FFB800] text-[#FFB800]" : "fill-[#E5E7EB] text-[#E5E7EB]")} />
                        ))}
                      </div>
                      <span className="text-[14px] text-[#6B7280] ml-1">& Up</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right Product Grid */}
          <div className="flex-1 w-full">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#FFFDF8] rounded-[18px] border border-[#E5E7EB] shadow-sm text-center px-4">
                <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-[#9CA3AF]" />
                </div>
                <h2 className="text-[24px] font-bold text-[slate-900] mb-3">No products found</h2>
                <p className="text-[#6B7280] max-w-md mx-auto mb-8">We couldn't find anything matching your search criteria. Try adjusting your filters or search term.</p>
                <div className="flex gap-4">
                  <button className="h-[48px] px-6 bg-[#FFFDF8] border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[slate-900] font-bold rounded-xl transition-colors">
                    Clear Filters
                  </button>
                  <Link to="/" className="h-[48px] px-6 bg-[slate-900] hover:bg-[slate-900]/90 text-white font-bold rounded-xl flex items-center justify-center transition-colors">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className={cn(
                  "grid gap-4 sm:gap-6 w-full",
                  viewMode === "grid" 
                    ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
                    : "grid-cols-1"
                )}>
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50" disabled>
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button 
                      key={page}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors text-[14px]",
                        page === 1 ? "bg-[slate-900] text-white" : "border border-[#E5E7EB] bg-[#FFFDF8] text-[#374151] hover:bg-[#F8FAFC]"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280] hover:bg-[#F8FAFC] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
