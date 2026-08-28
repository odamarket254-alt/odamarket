import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, RefreshCw } from 'lucide-react';
import { HomepageSection, SectionProduct } from '../../types/homepage';
import { HeroBannerSection } from './sections/HeroBannerSection';
import { ProductGridSection } from './sections/ProductGridSection';
import { CategoryGridSection } from './sections/CategoryGridSection';
import { WholesaleSection } from './WholesaleSection';

export const DynamicHomepage = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<SectionProduct[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHomepageData = useCallback(async () => {
    try {
      setError(null);
      
      // Centralized single batch request for all homepage data
      // Eliminates 8-10 duplicate queries that previously hit Supabase simultaneously
      const [sectionsRes, featuredProductsRes, productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('homepage_sections')
          .select('*').limit(100)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('featured_products')
          .select('*').limit(100),
        supabase
          .from('products')
          .select(`
            *,
            category:categories!left(name),
            brands (name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, slug, image_url, sort_order')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(8)
      ]);

      if (sectionsRes.error && sectionsRes.error.code !== 'PGRST205') {
        console.error('[Supabase Request Failed] homepage_sections:', {
          message: sectionsRes.error.message,
          code: sectionsRes.error.code,
          details: sectionsRes.error.details,
          hint: sectionsRes.error.hint
        });
        throw sectionsRes.error;
      }

      if (featuredProductsRes.error && featuredProductsRes.error.code !== 'PGRST205') {
        console.error('[Supabase Request Failed] featured_products:', {
          message: featuredProductsRes.error.message,
          code: featuredProductsRes.error.code
        });
      }

      if (productsRes.error) {
        console.error('[Supabase Request Failed] products:', {
          message: productsRes.error.message,
          code: productsRes.error.code,
          details: productsRes.error.details,
          hint: productsRes.error.hint
        });
      } else if (productsRes.data) {
        setAllProducts(productsRes.data);
      }

      if (categoriesRes.error) {
        console.error('[Supabase Request Failed] categories:', {
          message: categoriesRes.error.message,
          code: categoriesRes.error.code,
          details: categoriesRes.error.details,
          hint: categoriesRes.error.hint
        });
      } else if (categoriesRes.data) {
        setAllCategories(categoriesRes.data);
      }

      if (sectionsRes.error?.code === 'PGRST205' || !sectionsRes.data || sectionsRes.data.length === 0) {
        // Fallback layout based on exact requirements
        setSections([
          { id: 'fallback-hero', type: 'hero_banner', name: 'Welcome', title: 'Welcome', is_active: true, sort_order: 1, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-categories', type: 'category_grid', name: 'Top Categories', title: 'Top Categories', is_active: true, sort_order: 2, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-featured', type: 'featured_products', name: 'Featured Products', title: 'Featured Products', is_active: true, sort_order: 3, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-flash', type: 'flash_deals', name: 'Flash Sales', title: 'Flash Sales', is_active: true, sort_order: 4, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-best-deals', type: 'best_deals', name: 'Best Deals of the Week', title: 'Best Deals of the Week', is_active: true, sort_order: 5, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-promo', type: 'promotional_banner', name: 'Promotional Banner', title: 'Promotional Banner', is_active: true, sort_order: 6, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-new-arrivals', type: 'new_arrivals', name: 'New Arrivals', title: 'New Arrivals', is_active: true, sort_order: 7, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-wholesale', type: 'wholesale_products', name: 'Wholesale Products', title: 'Wholesale Products', is_active: true, sort_order: 8, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-lowest', type: 'lowest_price', name: 'Lowest Price Everyday', title: 'Lowest Price Everyday', is_active: true, sort_order: 9, settings: {}, subtitle: null, created_at: '', updated_at: '' },
          { id: 'fallback-electronics', type: 'electronics_zone', name: 'Electronics Zone', title: 'Electronics Zone', is_active: true, sort_order: 10, settings: {}, subtitle: null, created_at: '', updated_at: '' }
        ] as HomepageSection[]);
        setFeaturedProducts(featuredProductsRes.data ? (featuredProductsRes.data as SectionProduct[]) : []);
      } else {
        const mappedSections = (sectionsRes.data as any[]).map(s => ({
          ...s,
          name: s.name || s.title || '',
          settings: s.settings || s.content || {}
        }));
        setSections(mappedSections as HomepageSection[]);
        setFeaturedProducts(featuredProductsRes.data as SectionProduct[]);
      }
    } catch (err: any) {
      console.error('[Supabase Request Failed] fetchHomepageData error:', err);
      setError(err.message || 'Failed to load homepage data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomepageData();

    // Debounced realtime refresher to prevent rapid multiple updates from overwhelming browser/connection
    const handleRealtimeUpdate = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchHomepageData();
      }, 500);
    };

    const channel1 = supabase.channel("sections_changes_" + Math.random().toString(36).substring(7))
      .on("postgres_changes", { event: "*", schema: "public", table: "homepage_sections" }, handleRealtimeUpdate)
      .subscribe();

    const channel2 = supabase.channel("featured_changes_" + Math.random().toString(36).substring(7))
      .on("postgres_changes", { event: "*", schema: "public", table: "featured_products" }, handleRealtimeUpdate)
      .subscribe();

    const channel3 = supabase.channel("products_changes_" + Math.random().toString(36).substring(7))
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, handleRealtimeUpdate)
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [fetchHomepageData]);

  if (error && sections.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 text-[#B94A48] px-4 text-center">
        <p className="font-semibold text-lg">Unable to load homepage content.</p>
        <p className="text-sm text-gray-500 max-w-md">{error}</p>
        <button
          onClick={() => {
            setIsLoading(true);
            fetchHomepageData();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C65A28] text-white rounded-full font-medium hover:bg-[#b04f22] transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (isLoading && sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  const wholesaleProducts = allProducts.filter(p => p.is_wholesale);

  return (
    <div className="flex flex-col gap-0 pb-20">
      {sections.map((section, index) => {
        const renderContent = () => {
          switch (section.type) {
            case 'hero_banner':
              return <HeroBannerSection key={section.id} section={section} />;
            
            case 'promotional_banner':
              return null;
            case 'wholesale_products':
              return (
                <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}>
                  <WholesaleSection products={wholesaleProducts.length > 0 ? wholesaleProducts : undefined} />
                </div>
              );
            case 'category_grid':
              return (
                <CategoryGridSection 
                  key={section.id} 
                  section={section} 
                  categories={allCategories.length > 0 ? allCategories : undefined}
                  products={allProducts.length > 0 ? allProducts : undefined}
                />
              );
            
            case 'odamarket_choice':
            case 'buy_more_save_more':
            case 'custom_grid':
              const sectionProducts = featuredProducts
                .filter(fp => fp.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}>
                  <ProductGridSection 
                    section={section} 
                    sectionProducts={sectionProducts} 
                    allProducts={allProducts.length > 0 ? allProducts : undefined}
                  />
                </div>
              );
            
            case 'featured_products':
            case 'flash_deals':
            case 'best_sellers':
            case 'new_arrivals':
            case 'best_deals':
            case 'lowest_price':
            case 'electronics_zone':
            case 'top_rated':
            case 'trending':
            case 'organic':
            case 'budget_deals':
            case 'imported':
            case 'recently_restocked':
            case 'limited_stock':
              return (
                <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}>
                  <ProductGridSection 
                    section={section} 
                    allProducts={allProducts.length > 0 ? allProducts : undefined}
                  />
                </div>
              );
              
            default:
              return null;
          }
        };

        return (
          <React.Fragment key={section.id}>
            {renderContent()}
          </React.Fragment>
        );
      })}
    </div>
  );
};
