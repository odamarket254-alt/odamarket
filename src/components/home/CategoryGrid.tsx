import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

export const CategoryGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .limit(12);

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full max-w-[1400px] mx-auto mb-20 px-4 sm:px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] mb-2">Shop by Category</h2>
            <div className="h-4 w-64 bg-[#E8DCC9] animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 lg:h-40 bg-[#E8DCC9] animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null; // Or show empty state
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto mb-20">
      {/* MOBILE */}
      <div className="md:hidden">
        <div className="flex justify-between items-center px-4 mt-6 mb-4">
          <h2 className="text-[20px] font-bold text-[#3A2418]">Shop by Categories</h2>
          <Link to="/products" className="text-sm font-semibold text-[#C65A28]">View All &rarr;</Link>
        </div>
        <div className="flex overflow-x-auto gap-[12px] px-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat, idx) => (
            <Link key={idx} to={`/products?category=${cat.slug}`} className="snap-start shrink-0">
              <div className="w-[85px] h-[115px] bg-[#FFFDF8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#ECECEC] flex flex-col items-center justify-start p-2 transition-transform active:scale-[0.98] active:shadow-[#C65A28]/20">
                <div className="w-[55px] h-[55px] sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden mb-2 bg-[#FAF5EC] flex items-center justify-center shrink-0 border border-[#E8DCC9]">
                  {cat.image_url ? (
                    <img loading="lazy" src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#8B857D]" />
                  )}
                </div>
                <h3 className="text-[12px] font-semibold text-[#3A2418] text-center leading-[1.2] line-clamp-2 w-full px-1">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block px-4 sm:px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] mb-2">Shop by Category</h2>
            <p className="text-[#5F5A54]">Explore our wide range of premium products</p>
          </div>
          <Button variant="ghost" className="text-[#C65A28] hover:bg-[#C65A28]/10 hidden md:flex" onClick={() => navigate('/products')}>
            View All Categories <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {categories.map((cat, idx) => (
            <Link key={idx} to={`/products?category=${cat.slug}`} className="group relative">
              <motion.div whileHover={{ y: -5 }} className="bg-[#FAF5EC] rounded-2xl overflow-hidden border border-[#E8DCC9] shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                <div className="h-32 lg:h-40 w-full overflow-hidden relative bg-[#E8DCC9] flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10"></div>
                  {cat.image_url ? (
                    <img loading="lazy" src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#8B857D] transform group-hover:scale-110 transition-transform duration-500" />
                  )}
                  {cat.icon && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-[#FFFDF8] rounded-full flex items-center justify-center shadow-sm z-20 text-lg">
                      {cat.icon.startsWith('http') || cat.icon.startsWith('/') ? (
                        <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain rounded-full p-1" />
                      ) : (
                        cat.icon
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center bg-[#FFFDF8] text-center">
                  <h3 className="font-semibold text-[#3A2418] group-hover:text-[#C65A28] transition-colors">{cat.name}</h3>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
