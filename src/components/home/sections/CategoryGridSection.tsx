import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { Layers, ArrowRight } from 'lucide-react';

export const CategoryGridSection = ({ section }: { section: HomepageSection }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (categories.length === 0) setIsLoading(true);
        // Fetch up to 18 featured categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, sort_order')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(8);

        if (!error && data) {
          const catIds = data.map(c => c.id);
          
          let countData = null;
          if (catIds.length > 0) {
            const res = await supabase
              .from('products')
              .select('category_id, status')
              .eq('is_active', true)
              .in('category_id', catIds);
            countData = res.data;
          }

          const counts: Record<string, number> = {};
          if (countData) {
            countData.forEach(p => {
              counts[p.category_id] = (counts[p.category_id] || 0) + 1;
            });
          }

          setCategories(data.map(c => ({
            ...c,
            product_count: counts[c.id] || 0
          })));
        }
      } catch (err) {
        console.error("Error fetching categories for grid:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();

    const channel = supabase.channel(`category_grid_changes_${section.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight font-['Inter']">{section.title || "Top Categories"}</h2>
        </div>
        
        {/* Unified Grid Skeleton */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 lg:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col bg-white rounded-[14px] md:rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] animate-pulse h-full overflow-hidden">
              <div className="w-full aspect-square bg-[#F3F4F6]"></div>
              <div className="p-2 md:p-3 flex justify-center">
                <div className="w-3/4 h-3 bg-gray-200 rounded-full"></div>
              </div>
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
    <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight font-['Inter']">
            {section.title || "Top Categories"}
          </h2>
          {section.subtitle && <p className="text-gray-500 mt-1 hidden md:block text-[15px] font-['Inter']">{section.subtitle}</p>}
        </div>
        <Link 
          to="/categories" 
          className="group flex items-center text-[15px] font-semibold text-gray-900 hover:text-[#C65A28] transition-colors font-['Inter']"
        >
          View All
          <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 lg:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug || category.id}`}
            className="group flex flex-col bg-white rounded-[14px] md:rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[4px] md:hover:-translate-y-[6px] transition-all duration-300 ease-out cursor-pointer h-full overflow-hidden"
          >
            {/* Image Container (approx 70%) */}
            <div className="w-full aspect-square bg-[#F9FAFB] flex items-center justify-center overflow-hidden relative border-b border-gray-50/50">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full flex items-center justify-center"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out" 
                  loading="lazy"
                />
              ) : (
                <Layers className="w-6 h-6 md:w-10 md:h-10 text-gray-300 group-hover:scale-105 transition-transform duration-300 ease-out" />
              )}
            </div>
            
            {/* Text Container (approx 30%) */}
            <div className="flex-1 flex flex-col justify-center items-center w-full p-2 md:p-3">
              <span className="text-[10px] sm:text-[11px] md:text-[14px] font-semibold text-[#1F2937] text-center font-['Inter'] line-clamp-2 leading-tight md:leading-snug">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
