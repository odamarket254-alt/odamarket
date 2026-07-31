import { useState, useEffect, useRef, UIEvent } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { Layers, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export const CategoryGridSection = ({ section }: { section: HomepageSection }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showLeftNav, setShowLeftNav] = useState(false);
  const [showRightNav, setShowRightNav] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        // Fetch up to 15 featured categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, sort_order')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(15);

        if (!error && data) {
          const catIds = data.map(c => c.id);
          
          let countData = null;
          let countError = null;
          if (catIds.length > 0) {
            const res = await supabase
              .from('products')
              .select('category_id, status')
              .eq('status', 'active')
              .in('category_id', catIds);
            countData = res.data;
            countError = res.error;
          }
            
          const counts: Record<string, number> = {};
          if (countData && !countError) {
            countData.forEach(p => {
              counts[p.category_id] = (counts[p.category_id] || 0) + 1;
            });
          }
          
          const categoriesWithCount = data.map(c => ({
            ...c,
            product_count: counts[c.id] || 0
          }));

          setCategories(categoriesWithCount);
          // Wait for render to calculate initial nav state
          setTimeout(checkScroll, 100);
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setShowLeftNav(false);
      setShowRightNav(false);
      return;
    }
    
    const progress = (scrollLeft / maxScroll) * 100;
    setScrollProgress(progress);
    
    setShowLeftNav(scrollLeft > 0);
    setShowRightNav(scrollLeft < maxScroll - 5);
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    checkScroll();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.8;
    
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const isScrollable = el.scrollWidth > el.clientWidth;
      if (!isScrollable || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft >= maxScrollLeft - 1;
      
      if ((atLeft && e.deltaY < 0) || (atRight && e.deltaY > 0)) {
        return; // Allow vertical scroll when at boundaries
      }
      
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [categories]);

  if (isLoading) {
    return (
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#3A2418]">Shop by Category</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-[150px] sm:w-[180px] flex flex-col items-center p-6 bg-[#FFFDF8] rounded-[24px] border border-[#E8DCC9]/50 shadow-[0_8px_20px_rgba(45,45,45,0.04)] animate-pulse">
              <div className="w-20 h-20 mb-4 rounded-2xl bg-[#E8DCC9]/50"></div>
              <div className="w-24 h-4 bg-[#E8DCC9]/50 rounded-full"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] tracking-tight">{section.title || "Shop by Category"}</h2>
          {section.subtitle && <p className="text-[#5F5A54] mt-1">{section.subtitle}</p>}
        </div>
        <Link 
          to="/categories" 
          className="group flex items-center text-sm font-semibold text-[#C65A28] hover:text-[#A0451C] transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="relative group/carousel">
        {/* Navigation Arrows (Desktop) */}
        {showLeftNav && (
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_8px_20px_rgba(45,45,45,0.1)] border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#C65A28]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-4 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="snap-start flex-none w-[150px] sm:w-[180px] flex flex-col items-center p-6 bg-[#FFFDF8] rounded-[24px] border border-[#E8DCC9]/50 shadow-[0_8px_20px_rgba(45,45,45,0.04)] hover:shadow-[0_12px_30px_rgba(198,90,40,0.12)] hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-24 h-24 mb-4 rounded-2xl bg-gradient-to-br from-[#FAF5EC] to-[#E8DCC9]/30 flex items-center justify-center p-3 overflow-hidden relative shadow-inner">
                {category.image_url ? (
                  <OptimizedImage 
                    src={category.image_url} 
                    alt={category.name} 
                    className="w-full h-full"
                    imgClassName="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" 
                    loading="lazy"
                  />
                ) : (
                  <Layers className="w-10 h-10 text-[#D9A62E] group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>
              <span className="text-[15px] font-bold text-[#3A2418] text-center group-hover:text-[#C65A28] line-clamp-1 leading-tight transition-colors mb-1">
                {category.name}
              </span>
              {category.product_count > 0 && (
                <span className="text-[13px] font-medium text-[#8B857D] group-hover:text-[#C65A28]/80 transition-colors">
                  {category.product_count} {category.product_count === 1 ? 'Item' : 'Items'}
                </span>
              )}
            </Link>
          ))}
        </div>

        {showRightNav && (
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_8px_20px_rgba(45,45,45,0.1)] border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#C65A28]"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Animated Scrollbar */}
      {categories.length > 5 && (
        <div className="max-w-[200px] mx-auto mt-6 h-1.5 bg-[#E8DCC9] rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 bottom-0 bg-[#C65A28] rounded-full"
            style={{ width: '30%', left: `${scrollProgress * 0.7}%` }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
      )}
    </section>
  );
};
