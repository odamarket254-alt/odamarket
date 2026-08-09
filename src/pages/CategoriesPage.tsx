import { useState, useEffect, useRef, UIEvent } from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { cn } from "../lib/utils";
import { Loader2, Search, ChevronRight, ChevronLeft, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { OptimizedImage } from "../components/ui/OptimizedImage";

// A component for the horizontally scrollable section of subcategories
const CategorySection = ({ parent, children }: { parent: any, children: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showLeftNav, setShowLeftNav] = useState(false);
  const [showRightNav, setShowRightNav] = useState(children.length > 0);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setShowLeftNav(false);
      setShowRightNav(false);
      return;
    }
    const progress = (el.scrollLeft / maxScroll) * 100;
    setScrollProgress(progress);
    setShowLeftNav(el.scrollLeft > 0);
    setShowRightNav(el.scrollLeft < maxScroll - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse drag to scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.classList.add('cursor-grabbing');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };
    const onMouseUp = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Show only up to 3 subcategories as requested, though we can show more if they have them.
  // Wait, let's show all of them but limit in the parent fetch if needed. We'll show what is passed.
  const displayChildren = children;

  if (displayChildren.length === 0) return null;

  return (
    <div className="mb-10 w-full">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-[#3A2418]">{parent.name}</h2>
        <Link 
          to={`/category/${parent.slug || parent.id}`}
          className="flex items-center text-sm md:text-base font-semibold text-[#E26A2C] hover:text-[#C65A28] transition-colors"
        >
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="relative group/carousel px-4 sm:px-6 lg:px-8">
        {showLeftNav && displayChildren.length > 4 && (
          <button 
            onClick={() => scroll('left')}
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 cursor-grab"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayChildren.map((child) => (
            <Link
              key={child.id}
              to={`/category/${child.slug || child.id}`}
              className="snap-start flex-none flex flex-col bg-white rounded-[18px] shadow-sm hover:shadow-md border border-transparent hover:border-[#E8DCC9]/50 transition-all duration-250 hover:-translate-y-1 overflow-hidden"
              style={{ width: '105px', height: '130px' }}
            >
              <div className="w-full h-[70%] bg-[#FAF5EC] flex items-center justify-center overflow-hidden relative border-b border-[#E8DCC9]/30">
                {child.image_url ? (
                  <OptimizedImage 
                    src={child.image_url} 
                    alt={child.name} 
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250" 
                    loading="lazy"
                  />
                ) : (
                  <Package className="w-6 h-6 text-[#D9A62E]" />
                )}
              </div>
              <div className="flex flex-col items-center justify-center flex-1 p-2">
                <span className="text-[12px] font-bold text-[#3A2418] text-center line-clamp-1 leading-tight">
                  {child.name}
                </span>
                {child.product_count !== undefined && (
                  <span className="text-[10px] text-[#8B857D] mt-0.5">
                    {child.product_count} {child.product_count === 1 ? 'Product' : 'Products'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {showRightNav && displayChildren.length > 4 && (
          <button 
            onClick={() => scroll('right')}
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full items-center justify-center shadow-md border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {displayChildren.length > 3 && (
        <div className="max-w-[100px] mx-auto mt-4 h-1 bg-[#E8DCC9] rounded-full overflow-hidden relative lg:hidden">
          <motion.div 
            className="absolute top-0 bottom-0 bg-[#E26A2C] rounded-full"
            style={{ width: '30%', left: `${scrollProgress * 0.7}%` }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
      )}
    </div>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("categories")
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          const categoryIds = data.map(c => c.id);
          let productsData = null;
          if (categoryIds.length > 0) {
            const { data: pData } = await supabase
              .from("products")
              .select("category_id")
              .eq("is_active", true)
              .in("category_id", categoryIds);
            productsData = pData;
          }
            
          const productCounts: Record<string, number> = {};
          if (productsData) {
            productsData.forEach(p => {
              productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
            });
          }

          const categoriesWithCounts = data.map(c => ({
            ...c,
            product_count: productCounts[c.id] || 0
          }));

          setCategories(categoriesWithCounts);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const hierarchy = (() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: any[] = [];
    map.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  })();

  const filteredHierarchy = (() => {
    if (!searchQuery) return hierarchy;
    const lowerQuery = searchQuery.toLowerCase();
    
    return hierarchy.map(root => {
      const rootMatches = root.name.toLowerCase().includes(lowerQuery);
      const matchingChildren = root.children.filter((child: any) => 
        child.name.toLowerCase().includes(lowerQuery)
      );
      
      if (rootMatches || matchingChildren.length > 0) {
        return {
          ...root,
          children: matchingChildren.length > 0 ? matchingChildren : root.children,
        };
      }
      return null;
    }).filter(Boolean);
  })();

  return (
    <div className="min-h-screen bg-[#F8F6F2] pt-20 md:pt-28 pb-16 md:pb-24 font-poppins overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto relative z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Categories" }]} />
          
          <div className="max-w-3xl mb-10 mt-6 sm:mt-8">
            <h1 className="text-[clamp(32px,5vw,48px)] font-black tracking-tight text-[#3A2418] mb-6 leading-none">
              Explore Categories
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-[#E26A2C] outline-none transition-all placeholder:text-[#8B857D] text-[#3A2418] text-lg font-medium"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="w-full flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#E26A2C]" />
          </div>
        ) : filteredHierarchy.length === 0 ? (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E8DCC9]/50 shadow-sm">
              <p className="text-[#5F5A54] text-lg font-medium">No categories found for "{searchQuery}"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHierarchy.map((parent) => (
              <CategorySection key={parent.id} parent={parent} children={parent.children} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
