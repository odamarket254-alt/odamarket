import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection, SectionProduct } from '../../../types/homepage';
import { ProductCard } from '../../products/ProductCard';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../../lib/utils';

interface ProductGridSectionProps {
  section: HomepageSection;
  sectionProducts?: SectionProduct[];
}

export const ProductGridSection = ({ section, sectionProducts }: ProductGridSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
      setIsLoading(true);
      let query = supabase.from('products').select(`
        *,
        category:categories!left(name),
        brands (name)
      `);

      const maxProducts = section.settings?.max_products || 10;
      const filters = section.settings?.filters || {};

      if (sectionProducts) {
        // Manual Grid
        const productIds = sectionProducts.map(sp => sp.product_id);
        if (productIds.length > 0) {
          query = query.in('id', productIds);
        } else {
          setProducts([]);
          setIsLoading(false);
          return;
        }
      } else {
        // Dynamic Grid
        if (filters.category_id) query = query.eq('category_id', filters.category_id);
        if (filters.brand_id) query = query.eq('brand_id', filters.brand_id);
        if (filters.is_organic) query = query.eq('attributes->is_organic', true);
        if (filters.is_imported) query = query.eq('attributes->is_imported', true);
        if (filters.min_price) query = query.gte('price', filters.min_price);
        if (filters.max_price) query = query.lte('price', filters.max_price);
        if (filters.has_discount) query = query.not('sale_price', 'is', null);

        // Make sure we only show active products on the storefront
        query = query.eq('is_active', true);

        // Homepage Placement Filters based on section type
        switch (section.type) {
          case 'new_arrivals':
          case 'recently_restocked':
            query = query.eq('is_new_arrival', true).order('created_at', { ascending: false });
            break;
          case 'featured_products':
          case 'featured':
            query = query.eq('is_featured', true).order('created_at', { ascending: false });
            break;
          case 'flash_sales':
          case 'flash_deals':
          case 'sale':
            query = query.eq('is_flash_sale', true).order('created_at', { ascending: false });
            break;
          case 'best_deals':
          case 'deal_of_the_day':
            query = query.eq('is_best_deal', true).order('created_at', { ascending: false });
            break;
          case 'wholesale':
          case 'wholesale_products':
            query = query.eq('is_wholesale', true).order('created_at', { ascending: false });
            break;
          case 'lowest_price':
            query = query.eq('is_lowest_price', true).order('price', { ascending: true });
            break;
          case 'electronics_zone':
          case 'electronics':
            query = query.eq('is_electronics_zone', true).order('created_at', { ascending: false });
            break;
          case 'best_sellers':
          case 'trending':
          case 'top_rated':
            query = query.order('created_at', { ascending: true }); // Fallback
            break;
          case 'limited_stock':
            query = query.gt('stock', 0).lte('stock', 10).order('stock', { ascending: true });
            break;
          default:
            // For generic grids that might not have a specific type, maybe filter active?
            break;
        }

        query = query.limit(maxProducts);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        // If it's a manual grid, sort them according to the linking table
        if (sectionProducts) {
          const sorted = data.sort((a, b) => {
            const aOrder = sectionProducts.find(sp => sp.product_id === a.id)?.sort_order || 0;
            const bOrder = sectionProducts.find(sp => sp.product_id === b.id)?.sort_order || 0;
            return aOrder - bOrder;
          });
          setProducts(sorted);
        } else {
          setProducts(data);
        }
      }
      setIsLoading(false);
      } catch (err) { console.error("err", err); setIsLoading(false); }
    };

    fetchProducts();
  }, [section, sectionProducts]);

  if (isLoading) return null;

  const isCarousel = true;

  if (products.length === 0) {
    return (
      <section 
        className={cn(
          "max-w-[1400px] mx-auto w-full px-4 lg:px-8 pt-2 pb-8 rounded-3xl",
          section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
        )}
        style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
      >
        <div className="flex items-end justify-between mb-5">
          <div className="flex items-center gap-3">
            {section.type === 'flash_deals' && (
              <div className="p-2 bg-[#B94A48]/10 text-[#B94A48] rounded-lg">
                <Flame className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className={cn(
                "text-2xl md:text-3xl font-bold",
                section.settings?.background_color ? "text-white" : "text-[#3A2418]"
              )}>
                {section.title || section.name}
              </h2>
              {section.subtitle && (
                <p className={cn(
                  "mt-1 text-sm",
                  section.settings?.background_color ? "text-white/80" : "text-[#5F5A54]"
                )}>
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="w-full flex items-center justify-center p-12 bg-[#E8DCC9]/50 rounded-2xl border border-[#E8DCC9] border-dashed">
          <p className="text-[#5F5A54]">
            {section.type === 'flash_deals' ? 'No active flash deals.' : 
             section.type === 'featured_products' ? 'No featured products available.' : 
             'No products available.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn(
        "max-w-[1400px] mx-auto w-full px-4 lg:px-8 pt-2 pb-8 rounded-3xl",
        section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
      )}
      style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
    >
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-3">
          {section.type === 'flash_deals' && (
            <div className="p-2 bg-[#B94A48]/10 text-[#B94A48] rounded-lg">
              <Flame className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className={cn(
              "text-2xl md:text-3xl font-bold",
              section.settings?.background_color ? "text-white" : "text-[#3A2418]"
            )}>
              {section.title || section.name}
            </h2>
            {section.subtitle && (
              <p className={cn(
                "mt-1 text-sm",
                section.settings?.background_color ? "text-white/80" : "text-[#5F5A54]"
              )}>
                {section.subtitle}
              </p>
            )}
          </div>
        </div>

        {section.settings?.show_view_all && (
          <Link 
            to={`/shop?section=${section.type}`}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold hover:underline",
              section.settings?.background_color ? "text-white" : "text-[#C65A28]"
            )}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative group">
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-[#C65A28] hover:bg-gray-50 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-4 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-[#C65A28] hover:bg-gray-50 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-[12px] md:gap-[16px] lg:gap-[20px] scrollbar-hide"
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[calc(50vw-22px)] sm:w-[calc(33.333%-16px)] md:w-[calc(25%-16px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-17px)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
