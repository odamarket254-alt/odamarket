import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Search, ChevronDown, ChevronRight, LayoutGrid, List, SlidersHorizontal, X, Loader2, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { ProductCard } from "../components/products/ProductCard";

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const query = searchParams.get("q") || "";
  const categoriesParam = searchParams.get("category") || ""; 
  const brandsParam = searchParams.get("brand") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortParam = searchParams.get("sort") || "latest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  
  const selectedCategories = useMemo(() => categoriesParam ? categoriesParam.split(",") : [], [categoriesParam]);
  const selectedBrands = useMemo(() => brandsParam ? brandsParam.split(",") : [], [brandsParam]);

  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Metadata state
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 10000 });
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);
  
  const [brandSearchQuery, setBrandSearchQuery] = useState("");

  // 1. Fetch Metadata (Categories, Brands, Counts)
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [catsRes, brandsRes, prodsRes] = await Promise.all([
          supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
          supabase.from("brands").select("id, name, slug").eq("is_active", true).order("name"),
          supabase.from("products").select("id, category_id, brand_id, price, sale_price").eq("is_active", true)
        ]);

        if (catsRes.data) setAllCategories(catsRes.data);
        if (brandsRes.data) setAllBrands(brandsRes.data);
        
        if (prodsRes.data) {
          const cCounts: Record<string, number> = {};
          const bCounts: Record<string, number> = {};
          let min = Infinity;
          let max = -Infinity;
          
          prodsRes.data.forEach(p => {
            if (p.category_id) cCounts[p.category_id] = (cCounts[p.category_id] || 0) + 1;
            if (p.brand_id) bCounts[p.brand_id] = (bCounts[p.brand_id] || 0) + 1;
            
            const actualPrice = p.sale_price || p.price;
            if (actualPrice < min) min = actualPrice;
            if (actualPrice > max) max = actualPrice;
          });
          
          setCategoryCounts(cCounts);
          setBrandCounts(bCounts);
          setPriceBounds({ 
            min: min === Infinity ? 0 : Math.floor(min), 
            max: max === -Infinity ? 10000 : Math.ceil(max) 
          });
          
          if (!minPriceParam) setLocalMinPrice(min === Infinity ? "0" : Math.floor(min).toString());
          if (!maxPriceParam) setLocalMaxPrice(max === -Infinity ? "10000" : Math.ceil(max).toString());
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
      } finally {
        setMetadataLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  // Subscribe to real-time products changes
  useEffect(() => {
    const channel = supabase
      .channel('public:products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
         fetchProducts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch Filtered Products
  const fetchProducts = useCallback(async () => {
    if (metadataLoading) return;
    
    setLoading(true);
    try {
      let q = supabase
        .from("products")
        .select(`
          id, name, slug, price, sale_price, wholesale_price, stock, category_id, brand_id, image_url,
          category:categories(slug, name),
          brand:brands(slug, name)
        `, { count: 'exact' })
        .eq("is_active", true);

      if (query) {
        q = q.ilike("name", `%${query}%`);
      }
      
      // Filter by Categories
      if (selectedCategories.length > 0 && allCategories.length > 0) {
        const catIds = allCategories.filter(c => selectedCategories.includes(c.slug)).map(c => c.id);
        if (catIds.length > 0) {
          q = q.in("category_id", catIds);
        } else {
          q = q.in("category_id", ['00000000-0000-0000-0000-000000000000']);
        }
      }
      
      // Filter by Brands
      if (selectedBrands.length > 0 && allBrands.length > 0) {
        const brandIds = allBrands.filter(b => selectedBrands.includes(b.slug)).map(b => b.id);
        if (brandIds.length > 0) {
          q = q.in("brand_id", brandIds);
        } else {
          q = q.in("brand_id", ['00000000-0000-0000-0000-000000000000']);
        }
      }

      // Filter by Price
      if (minPriceParam) {
         q = q.or(`and(sale_price.is.null,price.gte.${minPriceParam}),and(sale_price.not.is.null,sale_price.gte.${minPriceParam})`);
      }
      if (maxPriceParam) {
         q = q.or(`and(sale_price.is.null,price.lte.${maxPriceParam}),and(sale_price.not.is.null,sale_price.lte.${maxPriceParam})`);
      }

      // Sorting
      switch(sortParam) {
        case 'price_asc':
          q = q.order('price', { ascending: true });
          break;
        case 'price_desc':
          q = q.order('price', { ascending: false });
          break;
        case 'latest':
          q = q.order('created_at', { ascending: false });
          break;
        default:
          q = q.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const from = (pageParam - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, count, error } = await q;
      
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
        setTotalProducts(count || 0);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategories, selectedBrands, minPriceParam, maxPriceParam, sortParam, pageParam, metadataLoading, allCategories, allBrands]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    if (!updates.page) {
      newParams.delete("page");
    }
    setSearchParams(newParams);
  };

  const toggleCategory = (slug: string) => {
    const newCats = selectedCategories.includes(slug)
      ? selectedCategories.filter(c => c !== slug)
      : [...selectedCategories, slug];
    updateParams({ category: newCats.join(",") });
  };

  const toggleBrand = (slug: string) => {
    const newBrands = selectedBrands.includes(slug)
      ? selectedBrands.filter(b => b !== slug)
      : [...selectedBrands, slug];
    updateParams({ brand: newBrands.join(",") });
  };
  
  const applyPriceFilter = () => {
    updateParams({ minPrice: localMinPrice, maxPrice: localMaxPrice });
  };
  
  const clearFilters = () => {
    updateParams({ category: null, brand: null, minPrice: null, maxPrice: null, q: null });
    setLocalMinPrice(priceBounds.min.toString());
    setLocalMaxPrice(priceBounds.max.toString());
  };

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const filteredBrands = allBrands.filter(b => b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()));
  const displayCategories = allCategories.filter(c => categoryCounts[c.id] > 0 || selectedCategories.includes(c.slug));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[80px] lg:pt-[100px] pb-24 font-sans text-[#111827]">
      <div className="border-b border-[#E5E7EB] bg-[#FFFDF8]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-[13px] font-medium text-[#6B7280]">
            <Link to="/" className="hover:text-[slate-900] transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/categories" className="hover:text-[slate-900] transition-colors cursor-pointer">Categories</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[slate-900] font-bold">All Products</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight text-[slate-900] mb-2">
              {query ? `Search results for "${query}"` : "All Products"}
            </h1>
            <p className="text-[#6B7280] font-medium">
              Showing {(pageParam - 1) * ITEMS_PER_PAGE + 1}–{Math.min(pageParam * ITEMS_PER_PAGE, totalProducts)} of {totalProducts} Products
            </p>
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
              <select 
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="h-10 pl-4 pr-10 bg-[#FFFDF8] border border-[#E5E7EB] rounded-lg text-[#374151] font-medium text-[14px] appearance-none focus:outline-none focus:border-[slate-900] cursor-pointer"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Filters Sidebar */}
          <div className={cn(
            "fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-[280px] shrink-0 bg-[#FFFDF8] lg:bg-transparent lg:z-0 transition-transform duration-300 overflow-y-auto lg:overflow-visible",
            isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <div className="bg-[#FFFDF8] rounded-[18px] lg:border border-[#E5E7EB] shadow-sm p-6 space-y-8 min-h-screen lg:min-h-0 sticky top-[120px]">
              <div className="flex items-center justify-between lg:hidden mb-4 pb-4 border-b border-[#E5E7EB]">
                <h2 className="text-[18px] font-bold text-[slate-900]">Filters</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 -mr-2 text-[#6B7280]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              {displayCategories.length > 0 && (
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827] mb-4">Categories</h3>
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {displayCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(cat.slug)}
                            onChange={() => toggleCategory(cat.slug)}
                            className="w-4 h-4 rounded border-[#D1D5DB] text-[#C65A28] focus:ring-[#C65A28]/20" 
                          />
                          <span className="text-[14px] text-[#374151] group-hover:text-[#C65A28] transition-colors">{cat.name}</span>
                        </div>
                        <span className="text-[12px] text-[#9CA3AF] bg-[#F8FAFC] px-2 py-0.5 rounded-full">{categoryCounts[cat.id] || 0}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="pt-6 border-t border-[#E5E7EB]">
                <h3 className="text-[16px] font-bold text-[#111827] mb-4">Price Range (KSh)</h3>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    placeholder={priceBounds.min.toString()} 
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900]" 
                  />
                  <span className="text-[#9CA3AF]">-</span>
                  <input 
                    type="number" 
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    placeholder={priceBounds.max.toString()} 
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900]" 
                  />
                </div>
                <button 
                  onClick={applyPriceFilter}
                  className="w-full mt-4 h-10 bg-[#F8FAFC] text-[slate-900] font-bold text-[14px] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                >
                  Apply Price
                </button>
              </div>

              {/* Brands */}
              {allBrands.length > 0 && (
                <div className="pt-6 border-t border-[#E5E7EB]">
                  <h3 className="text-[16px] font-bold text-[#111827] mb-4">Brands</h3>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input 
                      type="text" 
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      placeholder="Search brands..." 
                      className="w-full h-10 pl-9 pr-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[slate-900]" 
                    />
                  </div>
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredBrands.filter(b => brandCounts[b.id] > 0 || selectedBrands.includes(b.slug)).map((brand) => (
                      <label key={brand.id} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedBrands.includes(brand.slug)}
                            onChange={() => toggleBrand(brand.slug)}
                            className="w-4 h-4 rounded border-[#D1D5DB] text-[#C65A28] focus:ring-[#C65A28]/20" 
                          />
                          <span className="text-[14px] text-[#374151] group-hover:text-[#C65A28] transition-colors">{brand.name}</span>
                        </div>
                        <span className="text-[12px] text-[#9CA3AF] bg-[#F8FAFC] px-2 py-0.5 rounded-full">{brandCounts[brand.id] || 0}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F8FAFC]/50 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
              </div>
            ) : null}
            
            {products.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#FFFDF8] rounded-[18px] border border-[#E5E7EB] shadow-sm text-center px-4">
                <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-[#9CA3AF]" />
                </div>
                <h2 className="text-[24px] font-bold text-[slate-900] mb-3">No products found</h2>
                <p className="text-[#6B7280] max-w-md mx-auto mb-8">We couldn't find anything matching your search criteria. Try adjusting your filters or search term.</p>
                <div className="flex gap-4">
                  <button onClick={clearFilters} className="h-[48px] px-6 bg-[#FFFDF8] border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[slate-900] font-bold rounded-xl transition-colors">
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
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => updateParams({ page: (pageParam - 1).toString() })}
                      disabled={pageParam <= 1}
                      className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      // Show limited pages logic (simple version)
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= pageParam - 1 && page <= pageParam + 1)
                      ) {
                        return (
                          <button 
                            key={page}
                            onClick={() => updateParams({ page: page.toString() })}
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors text-[14px]",
                              page === pageParam ? "bg-[slate-900] text-white" : "border border-[#E5E7EB] bg-[#FFFDF8] text-[#374151] hover:bg-[#F8FAFC]"
                            )}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === pageParam - 2 || 
                        page === pageParam + 2
                      ) {
                        return <span key={page} className="text-[#6B7280]">...</span>;
                      }
                      return null;
                    })}
                    
                    <button 
                      onClick={() => updateParams({ page: (pageParam + 1).toString() })}
                      disabled={pageParam >= totalPages}
                      className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
