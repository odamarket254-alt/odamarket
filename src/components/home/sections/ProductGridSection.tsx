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
  allProducts?: any[];
}

export const ProductGridSection = ({ section, sectionProducts, allProducts }: ProductGridSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!allProducts);
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
    // If allProducts was provided by parent (DynamicHomepage), filter in-memory with ZERO duplicate network requests!
    if (allProducts && allProducts.length > 0) {
      const maxProducts = section.settings?.max_products || 10;
      const filters = section.settings?.filters || {};

      let filtered = [...allProducts];

      if (sectionProducts) {
        if (sectionProducts.length > 0) {
          const productIds = sectionProducts.map(sp => sp.product_id);
          filtered = filtered.filter(p => productIds.includes(p.id));
          filtered.sort((a, b) => {
            const aOrder = sectionProducts.find(sp => sp.product_id === a.id)?.sort_order || 0;
            const bOrder = sectionProducts.find(sp => sp.product_id === b.id)?.sort_order || 0;
            return aOrder - bOrder;
          });
        } else {
          setProducts([]);
          setIsLoading(false);
          return;
        }
      } else {
        if (filters.category_id) filtered = filtered.filter(p => p.category_id === filters.category_id);
        if (filters.brand_id) filtered = filtered.filter(p => p.brand_id === filters.brand_id);
        if (filters.min_price) filtered = filtered.filter(p => Number(p.price || 0) >= Number(filters.min_price));
        if (filters.max_price) filtered = filtered.filter(p => Number(p.price || 0) <= Number(filters.max_price));
        if (filters.has_discount) filtered = filtered.filter(p => p.sale_price !== null && p.sale_price !== undefined);

        switch (section.type) {
          case 'new_arrivals':
          case 'recently_restocked':
            filtered = filtered.filter(p => p.is_new_arrival);
            break;
          case 'featured_products':
          case 'featured':
            filtered = filtered.filter(p => p.is_featured);
            break;
          case 'flash_sales':
          case 'flash_deals':
          case 'sale':
            filtered = filtered.filter(p => p.is_flash_sale);
            break;
          case 'best_deals':
          case 'deal_of_the_day':
            filtered = filtered.filter(p => p.is_best_deal);
            break;
          case 'wholesale':
          case 'wholesale_products':
            filtered = filtered.filter(p => p.is_wholesale);
            break;
          case 'lowest_price':
            filtered = filtered.filter(p => p.is_lowest_price).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
            break;
          case 'electronics_zone':
          case 'electronics':
            filtered = filtered.filter(p => p.is_electronics_zone);
            break;
          case 'limited_stock':
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock);
            break;
          default:
            break;
        }

        filtered = filtered.slice(0, maxProducts);
      }

      setProducts(filtered);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        if (products.length === 0) setIsLoading(true);
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
            break;
        }

        query = query.limit(maxProducts);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`[Supabase Request Failed] ProductGridSection (${section.type || section.title}):`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (data) {
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
      } catch (err) { 
        console.error(`[Supabase Request Failed] ProductGridSection (${section.type || section.title}) catch error:`, err); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [section, sectionProducts, allProducts]);

  if (isLoading) return null;

  const isCarousel = true;

  if (products.length === 0) {
    return (
      <section 
        className={cn(
          "max-w-[1280px] mx-auto w-full px-4 sm:px-6 md:px-12 pt-4 pb-6 md:pb-10",
          section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
        )}
        style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
      >
        <div className="flex items-end justify-between mb-4 md:mb-6">
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
        "max-w-[1280px] mx-auto w-full px-4 sm:px-6 md:px-12 pt-4 pb-6 md:pb-10",
        section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
      )}
      style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
    >
      <div className="flex items-end justify-between mb-4 md:mb-6">
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
        
        
        

        <div 
          className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-3 md:gap-4 lg:gap-5 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
