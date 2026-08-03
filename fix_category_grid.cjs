const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';

const content = `import { useState, useEffect } from 'react';
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
        setIsLoading(true);
        // Fetch up to 18 featured categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, icon, sort_order')
          .is('parent_id', null)
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(18);

        if (!error && data) {
          const catIds = data.map(c => c.id);
          
          let countData = null;
          if (catIds.length > 0) {
            const res = await supabase
              .from('products')
              .select('category_id, status')
              .eq('status', 'active')
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
  }, []);

  if (isLoading) {
    return (
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight font-['Inter']">{section.title || "Top Categories"}</h2>
        </div>
        
        {/* Unified Grid Skeleton */}
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6">
          {[...Array(18)].map((_, i) => (
            <div key={i} className={\`flex flex-col items-center p-4 bg-white rounded-[18px] border border-gray-100 shadow-sm animate-pulse \${i >= 6 ? 'hidden md:flex' : ''}\`}>
              <div className="w-full max-w-[120px] aspect-square rounded-[12px] bg-gray-100 mb-[20px]"></div>
              <div className="w-16 md:w-20 h-4 bg-gray-100 rounded-full"></div>
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
      
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={\`/category/\${category.slug || category.id}\`}
            className="group flex flex-col items-center bg-white rounded-[18px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[6px] transition-all duration-300 ease-out cursor-pointer"
          >
            <div className="w-full max-w-[120px] aspect-square bg-[#F9FAFB] rounded-[12px] flex items-center justify-center p-3 md:p-4 mb-[20px] overflow-hidden">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full flex items-center justify-center"
                  imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out" 
                  loading="lazy"
                />
              ) : (
                <Layers className="w-8 h-8 md:w-10 md:h-10 text-gray-400 group-hover:scale-105 transition-transform duration-300 ease-out" />
              )}
            </div>
            
            <span className="text-[14px] md:text-[16px] font-semibold text-[#1F2937] text-center font-['Inter'] line-clamp-2 leading-tight w-full px-1">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
\`;

fs.writeFileSync(file, content);
console.log("Updated CategoryGridSection");
