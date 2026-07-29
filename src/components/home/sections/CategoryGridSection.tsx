import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { Layers } from 'lucide-react';

export const CategoryGridSection = ({ section }: { section: HomepageSection }) => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  if (categories.length === 0) {
    return (
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8">
        {section.title && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#3A2418]">{section.title}</h2>
              {section.subtitle && <p className="text-[#5F5A54] mt-1">{section.subtitle}</p>}
            </div>
          </div>
        )}
        <div className="w-full flex items-center justify-center p-12 bg-[#E8DCC9] rounded-2xl border border-[#E8DCC9] border-dashed">
          <p className="text-[#5F5A54]">No categories available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8">
      {section.title && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#3A2418]">{section.title}</h2>
            {section.subtitle && <p className="text-[#5F5A54] mt-1">{section.subtitle}</p>}
          </div>
        </div>
      )}
      
      {/* Horizontal scroll on mobile, grid on desktop */}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6 pb-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="flex flex-col items-center p-6 bg-[#FFFDF8] rounded-[24px] border border-[#E8DCC9]/50 shadow-[0_8px_20px_rgba(45,45,45,0.04)] hover:shadow-[0_12px_30px_rgba(198,90,40,0.12)] hover:-translate-y-2 transition-all duration-300 group"
          >
            <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-[#FAF5EC] to-[#E8DCC9]/30 flex items-center justify-center p-3 overflow-hidden relative shadow-inner">
              {category.image_url ? (
                <OptimizedImage src={category.image_url} alt={category.name} imgClassName="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" className="w-full h-full" />
              ) : (
                <Layers className="w-8 h-8 text-[#D9A62E] group-hover:scale-110 transition-transform duration-500" />
              )}
            </div>
            <span className="text-sm font-semibold text-[#3A2418] text-center group-hover:text-[#C65A28] line-clamp-2 leading-tight transition-colors">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
</section>
  );
};
