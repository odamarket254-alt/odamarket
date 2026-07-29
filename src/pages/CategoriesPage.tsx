import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { cn } from "../lib/utils";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select('*').limit(100)
          .eq('status', 'active')
          .is('parent_id', null) // only top level categories
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });
        
        if (error) {
          console.error("Error fetching categories:", error);
        } else if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-20 md:pt-28 pb-16 md:pb-24 font-poppins overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs items={[{ label: "Categories" }]} />
        <div className="max-w-3xl mb-10 sm:mb-16 mt-6 sm:mt-8 text-center md:text-left mx-auto md:mx-0">
          <h1 className="text-[clamp(32px,5vw,56px)] font-black tracking-tight text-[#3A2418] mb-4 sm:mb-6 leading-none">
            Explore <span className="text-[#C65A28]">Categories</span>
          </h1>
          <p className="text-[clamp(16px,2vw,20px)] text-[#5F5A54]">
            Browse our comprehensive selection of premium products, categorized for your shopping convenience.
          </p>
        </div>
        
        {categories.length === 0 ? (
          <div className="w-full flex items-center justify-center p-12 bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] border-dashed">
            <p className="text-[#5F5A54]">No categories available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {categories.map((category, i) => (
              <motion.div
                key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <Link
                to={`/products?category=${category.slug}`}
                className={cn(
                  "flex flex-col h-[200px] sm:h-[280px] rounded-[24px] sm:rounded-[32px] bg-[#FFFDF8] shadow-sm transition-all duration-300 group overflow-hidden relative border border-[#E8DCC9] hover:border-[#C65A28]/30 hover:shadow-lg hover:-translate-y-1",
                )}
              >
                {category.image_url ? (
                  <>
                    <div className="absolute inset-0 z-0">
                      <OptimizedImage src={category.image_url} alt={category.name} imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" className="w-full h-full flex items-center justify-center bg-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all" />
                    </div>
                    <div className="relative z-10 p-4 sm:p-6 w-full mt-auto flex flex-col justify-end h-full text-center sm:text-left">
                      <h3 className="text-lg sm:text-2xl font-bold leading-tight text-white group-hover:text-[#D9A62E] mb-1 sm:mb-2 drop-shadow-md">
                        {category.name}
                      </h3>
                      {(category as any).description && (
                        <p className="text-xs sm:text-sm text-white/80 line-clamp-1 sm:line-clamp-2 drop-shadow-md hidden sm:block">
                          {(category as any).description}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-[#C65A28]/10 text-[#C65A28] group-hover:bg-[#C65A28] group-hover:text-white transition-colors mb-3 sm:mb-4 shadow-sm">
                       <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-base sm:text-xl font-bold leading-tight text-[#3A2418] group-hover:text-[#C65A28] mb-1 sm:mb-2">
                      {category.name}
                    </h3>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

