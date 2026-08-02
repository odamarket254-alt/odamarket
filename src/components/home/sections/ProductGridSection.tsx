import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection, SectionProduct } from '../../../types/homepage';
import { ProductCard } from '../../products/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ProductGridSectionProps {
  section: HomepageSection;
  sectionProducts?: SectionProduct[];
}

export const ProductGridSection = ({ section, sectionProducts }: ProductGridSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
      setIsLoading(true);
      let query = supabase.from('products').select(`
        *,
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

        // Sorting based on section type
        switch (section.type) {
          case 'new_arrivals':
          case 'recently_restocked':
            query = query.order('created_at', { ascending: false });
            break;
          case 'best_sellers':
          case 'trending':
            // Fallback since we don't have a views/purchases count easily accessible here
            // Normally would sort by a 'sales_count' or similar
            query = query.order('rating', { ascending: false });
            break;
          case 'top_rated':
            query = query.order('rating', { ascending: false });
            break;
          case 'limited_stock':
            query = query.gt('stock', 0).lte('stock', 10).order('stock', { ascending: true });
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

  const isCarousel = section.settings?.layout === 'carousel';

  if (products.length === 0) {
    return (
      <section 
        className={cn(
          "max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 rounded-3xl",
          section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
        )}
        style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
      >
        <div className="flex items-end justify-between mb-8">
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
        "max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 rounded-3xl",
        section.settings?.background_color && `bg-${section.settings.background_color}` // Normally would use exact hex or tailwind class mapping
      )}
      style={section.settings?.background_color ? { backgroundColor: section.settings.background_color } : {}}
    >
      <div className="flex items-end justify-between mb-8">
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

      {isCarousel ? (
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory gap-4 hide-scrollbar md:gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[240px] md:w-[280px] lg:w-[300px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid gap-4 md:gap-6",
          "grid-cols-2", // Mobile default
          "md:grid-cols-3", // Tablet
          "lg:grid-cols-4", // Small Desktop
          "xl:grid-cols-5", // Large Desktop
          section.settings?.products_per_row_desktop === 6 && "xl:grid-cols-6"
        )}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
