import { OptimizedImage } from "../../../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Loader2, Search, Edit2, LayoutTemplate } from "lucide-react";
import { cn } from "../../../lib/utils";

export function FeaturedCategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('*').limit(100)
        .order('name');
      
      if (catsError) throw catsError;
      setCategories(cats || []);

      // Fetch featured setting
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('value').limit(100)
        .eq('group_name', 'storefront')
        .eq('key', 'featured_categories')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      
      if (settings && settings.value && Array.isArray(settings.value)) {
        setFeaturedIds(settings.value);
      } else {
        setFeaturedIds(cats?.slice(0, 6).map(c => c.id) || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeatured = (id: string) => {
    if (featuredIds.includes(id)) {
      setFeaturedIds(featuredIds.filter(fId => fId !== id));
    } else {
      setFeaturedIds([...featuredIds, id]);
    }
  };

  const saveFeatured = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id').limit(100)
        .eq('group_name', 'storefront')
        .eq('key', 'featured_categories')
        .single();

      if (existing) {
        await supabase
          .from('settings')
          .update({ value: featuredIds })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('settings')
          .insert({
            group_name: 'storefront',
            key: 'featured_categories',
            value: featuredIds
          });
      }
      
      toast.success("Featured categories updated. Changes are live.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#3A2418]">Featured Categories</h3>
          <p className="text-sm text-[#5F5A54]">Select which categories appear on the homepage. ({featuredIds.length} selected)</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D]" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#FAF5EC] border border-[#E8DCC9] rounded-xl text-sm focus:outline-none focus:border-[#C65A28] w-full md:w-64 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
          <button
            onClick={saveFeatured}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCategories.map(category => {
          const isSelected = featuredIds.includes(category.id);
          return (
            <div 
              key={category.id}
              onClick={() => toggleFeatured(category.id)}
              className={cn(
                "relative bg-[#FFFDF8] border rounded-2xl p-4 cursor-pointer transition-all duration-200 group flex flex-col items-center text-center",
                isSelected 
                  ? "border-[#C65A28] shadow-md shadow-[#C65A28]/10 ring-1 ring-[#C65A28]" 
                  : "border-[#E8DCC9] hover:border-slate-300 hover:shadow-sm"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#C65A28] text-white rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
              <div className="w-16 h-16 bg-[#FAF5EC] rounded-full flex items-center justify-center mb-3 text-2xl overflow-hidden border border-[#E8DCC9]">
                {category.image_url ? (
                  <OptimizedImage src={category.image_url} alt={category.name} imgClassName="w-full h-full object-cover" className="w-full h-full flex items-center justify-center bg-transparent" />
                ) : (
                  category.icon || "📦"
                )}
              </div>
              <h4 className="text-sm font-medium text-[#3A2418] line-clamp-1">{category.name}</h4>
              <p className="text-xs text-[#8B857D] mt-1">{category.is_active ? 'Active' : 'Hidden'}</p>
            </div>
          );
        })}
      </div>
      
      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl border-dashed">
          <LayoutTemplate className="w-12 h-12 text-[#8B857D] mx-auto mb-3" />
          <p className="text-[#5F5A54] font-medium">No categories found matching "{search}"</p>
        </div>
      )}
    </div>
  );
}
