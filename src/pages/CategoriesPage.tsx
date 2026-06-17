import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { cn } from "../lib/utils";
import { ArrowRight, Package, Sprout, HardHat, Factory, Cpu, Briefcase, Utensils, Stethoscope, Coffee, FlaskConical, Shirt, Shield, Car, Monitor, Sofa, Zap, Warehouse, BookOpen, Pickaxe, LineChart } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
}

const getIconByName = (name?: string) => {
  const icons: Record<string, any> = {
    Sprout, HardHat, Factory, Cpu, Package, Briefcase, Utensils, Stethoscope, Coffee, FlaskConical, Shirt, Shield, Car, Monitor, Sofa, Zap, Warehouse, BookOpen, Pickaxe, LineChart
  };
  const Icon = name && icons[name] ? icons[name] : Package;
  return <Icon className="w-6 h-6 sm:w-10 sm:h-10" />;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("level", 0)
        .order("sort_order", { ascending: true });
          
      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <Breadcrumbs items={[{ label: "Categories" }]} />
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Product Categories
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse our comprehensive directory of verified B2B products and suppliers across Africa.
          </p>
        </div>

        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
          {isLoading ? (
            Array(20).fill(null).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-4 sm:p-6 rounded-xl border border-border bg-card animate-pulse">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-muted mb-3" />
                <div className="h-3 sm:h-4 w-16 sm:w-24 bg-muted rounded" />
              </div>
            ))
          ) : (
            categories.map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="h-full"
              >
                <Link
                  to={`/c/${category.slug}`}
                  className={cn(
                    "flex flex-col h-full rounded-2xl border border-border shadow-sm transition-all group overflow-hidden relative",
                    category.image_url ? "aspect-square justify-end border-transparent" : "items-center text-center p-3 sm:p-6 bg-card hover:border-emerald-500/50 hover:shadow-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                  )}
                >
                  {category.image_url ? (
                    <>
                      <div className="absolute inset-0 z-0">
                        <img src={category.image_url} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all" />
                      </div>
                      <div className="relative z-10 p-4 sm:p-6 w-full mt-auto">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight text-white group-hover:text-emerald-300 mb-1 drop-shadow-md">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="hidden sm:block text-xs sm:text-sm text-white/80 line-clamp-2 drop-shadow-md">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-muted/80 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-3 border border-border group-hover:border-emerald-200 dark:group-hover:border-emerald-800">
                         {getIconByName(category.icon)}
                      </div>
                      <h3 className="text-[10px] sm:text-base font-bold leading-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="hidden sm:block text-xs text-muted-foreground line-clamp-2 mt-auto">
                          {category.description}
                        </p>
                      )}
                    </>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
