import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { HomepageSection, SectionProduct } from '../../types/homepage';
import { HeroBannerSection } from './sections/HeroBannerSection';
import { ProductGridSection } from './sections/ProductGridSection';
import { CategoryGridSection } from './sections/CategoryGridSection';
import { WholesaleSection } from './WholesaleSection';

export const DynamicHomepage = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<SectionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomepageData = async () => {
    try {
      const [sectionsRes, featuredProductsRes] = await Promise.all([
        supabase
          .from('homepage_sections')
          .select('*').limit(100)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('featured_products')
          .select('*').limit(100)
      ]);

      if (sectionsRes.error && sectionsRes.error.code !== 'PGRST205') throw sectionsRes.error;
      if (featuredProductsRes.error && featuredProductsRes.error.code !== 'PGRST205') throw featuredProductsRes.error;

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
      console.error('Error fetching homepage data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();

    const channel1 = supabase.channel("sections_changes_" + Math.random().toString(36).substring(7)).on("postgres_changes", { event: "*", schema: "public", table: "homepage_sections" }, () => fetchHomepageData()).subscribe();
    

    const channel2 = supabase.channel("featured_changes_" + Math.random().toString(36).substring(7)).on("postgres_changes", { event: "*", schema: "public", table: "featured_products" }, () => fetchHomepageData()).subscribe(); const channel3 = supabase.channel("products_changes_" + Math.random().toString(36).substring(7)).on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchHomepageData()).subscribe(); return () => { supabase.removeChannel(channel1); supabase.removeChannel(channel2); supabase.removeChannel(channel3); };
    

    
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-[#B94A48]">
        <p>Failed to load homepage data.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-20">
      
      {sections.map((section, index) => {
        const renderContent = () => {
          switch (section.type) {
            case 'hero_banner':
              return <HeroBannerSection key={section.id} section={section} />;
            
            case 'promotional_banner':
              return null; // Ignore placeholder for now, or render if there is a component
            case 'wholesale_products':
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><WholesaleSection /></div>;
            case 'category_grid':
              return <CategoryGridSection key={section.id} section={section} />;
            
            
            case 'odamarket_choice':
            case 'buy_more_save_more':
            case 'custom_grid':
              const sectionProducts = featuredProducts
                .filter(fp => fp.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><ProductGridSection section={section} sectionProducts={sectionProducts} /></div>;
            
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
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><ProductGridSection section={section} /></div>;
              
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
