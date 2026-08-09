import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { HomepageSection, SectionProduct } from '../../types/homepage';
import { HeroBannerSection } from './sections/HeroBannerSection';
import { ProductGridSection } from './sections/ProductGridSection';
import { CategoryGridSection } from './sections/CategoryGridSection';

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
        // Fallback layout when there are no sections configured in the DB
        setSections([
          { id: 'fallback-hero', type: 'hero_banner', name: 'Welcome', is_active: true, sort_order: 1, settings: {} },
          { id: 'fallback-categories', type: 'category_grid', name: 'Shop by Category', title: 'Shop by Category', is_active: true, sort_order: 2, settings: {} },
          { id: 'fallback-featured', type: 'featured_products', name: 'Featured Products', title: 'Featured Products', is_active: true, sort_order: 3, settings: {} },
          { id: 'fallback-flash', type: 'flash_deals', name: 'Flash Deals', title: 'Flash Deals', is_active: true, sort_order: 4, settings: {} },
          { id: 'fallback-new', type: 'new_arrivals', name: 'New Arrivals', title: 'New Arrivals', is_active: true, sort_order: 5, settings: {} },
          { id: 'fallback-best', type: 'best_sellers', name: 'Best Sellers', title: 'Best Sellers', is_active: true, sort_order: 6, settings: {} }
        ] as HomepageSection[]);
        setFeaturedProducts(featuredProductsRes.data ? (featuredProductsRes.data as SectionProduct[]) : []);
      } else {
        setSections(sectionsRes.data as HomepageSection[]);
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

    const channel1 = supabase.channel("sections_changes").on("postgres_changes", { event: "*", schema: "public", table: "homepage_sections" }, () => fetchHomepageData()).subscribe();
    

    const channel2 = supabase.channel("featured_changes").on("postgres_changes", { event: "*", schema: "public", table: "featured_products" }, () => fetchHomepageData()).subscribe(); const channel3 = supabase.channel("products_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchHomepageData()).subscribe(); return () => { supabase.removeChannel(channel1); supabase.removeChannel(channel2); supabase.removeChannel(channel3); };
    

    
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
        switch (section.type) {
          case 'hero_banner':
            return <HeroBannerSection key={section.id} section={section} />;
          
          case 'category_grid':
            return <CategoryGridSection key={section.id} section={section} />;
          
          case 'featured_products':
          case 'flash_deals':
          case 'odamarket_choice':
          case 'buy_more_save_more':
          case 'custom_grid':
            const sectionProducts = featuredProducts
              .filter(fp => fp.section_id === section.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><ProductGridSection section={section} sectionProducts={sectionProducts} /></div>;
          
          case 'best_sellers':
          case 'new_arrivals':
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
      })}
    </div>
  );
};
