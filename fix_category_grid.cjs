const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';

const newContent = `import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { Layers, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CategoryGridSection = ({ section }: { section: HomepageSection }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        // Fetch up to 15 featured categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, icon, sort_order')
          .is('parent_id', null)
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(15);

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
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 md:py-8 bg-[#F8F6F2] md:bg-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#3A2418]">{section.title || "Shop by Category"}</h2>
        </div>
        
        {/* Unified Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-4 md:p-6 bg-white md:bg-[#FFFDF8] rounded-[18px] md:rounded-[24px] border border-[#E8DCC9]/30 shadow-sm animate-pulse h-[160px] md:h-[180px]">
              <div className="w-full h-[65%] md:h-[70%] mb-2 md:mb-4 rounded-xl md:rounded-2xl bg-[#E8DCC9]/50"></div>
              <div className="w-20 md:w-24 h-4 bg-[#E8DCC9]/50 rounded-full mt-auto"></div>
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
    <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 md:py-8 bg-[#F8F6F2] md:bg-transparent relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] tracking-tight">{section.title || "Shop by Category"}</h2>
          {section.subtitle && <p className="text-[#5F5A54] mt-1 hidden md:block">{section.subtitle}</p>}
        </div>
        <Link 
          to="/categories" 
          className="group flex items-center text-sm md:text-base font-bold md:font-semibold text-[#C65A28] hover:text-[#A0451C] transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* Unified Grid View (Mobile: 2 cols, Tablet: 3 cols, Desktop: 4 cols) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={\`/category/\${category.slug || category.id}\`}
            className="group flex flex-col items-center bg-white md:bg-[#FFFDF8] rounded-[18px] md:rounded-[24px] p-4 md:p-6 shadow-[0_2px_12px_rgba(45,45,45,0.03)] md:shadow-[0_8px_20px_rgba(45,45,45,0.04)] hover:shadow-[0_12px_30px_rgba(198,90,40,0.12)] border border-transparent md:border-[#E8DCC9]/50 active:scale-[0.97] hover:scale-100 md:hover:-translate-y-2 transition-all duration-300 h-[160px] md:h-auto"
          >
            <div className="w-full flex-1 mb-2 md:mb-4 rounded-xl md:rounded-2xl bg-transparent md:bg-[#FAF5EC] md:bg-gradient-to-br md:from-[#FAF5EC] md:to-[#E8DCC9]/30 flex items-center justify-center overflow-hidden relative md:shadow-inner h-[65%] md:h-auto md:min-h-[100px]">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain md:group-hover:scale-110 transition-transform duration-500 md:mix-blend-multiply" 
                  loading="lazy"
                />
              ) : (
                <Layers className="w-10 h-10 text-[#D9A62E] md:group-hover:scale-110 transition-transform duration-500" />
              )}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <span className="text-[14px] md:text-[15px] font-bold text-[#3A2418] text-center md:group-hover:text-[#C65A28] line-clamp-2 md:line-clamp-1 leading-[1.2] transition-colors">
                {category.name}
              </span>
              
              {category.product_count > 0 && (
                <span className="hidden md:block mt-1 text-[13px] font-medium text-[#8B857D] group-hover:text-[#C65A28]/80 transition-colors">
                  {category.product_count} {category.product_count === 1 ? 'Item' : 'Items'}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
`
fs.writeFileSync(file, newContent);
