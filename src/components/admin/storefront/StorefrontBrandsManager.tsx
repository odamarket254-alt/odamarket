import { OptimizedImage } from "../../../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";

export function StorefrontBrandsManager() {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*').limit(100)
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (brand: any) => {
    setIsSaving(true);
    try {
      if (brand.id.startsWith('new_')) {
        const { id, ...newBrand } = brand;
        const slug = newBrand.slug || newBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        await supabase.from('brands').insert({
          name: newBrand.name,
          slug: slug || `brand-${Date.now()}`,
          logo_url: newBrand.logo_url,
          is_active: newBrand.is_active ?? true
        });
      } else {
        await supabase.from('brands').update({
          name: brand.name,
          logo_url: brand.logo_url,
          is_active: brand.is_active
        }).eq('id', brand.id);
      }
      toast.success("Brand saved.");
      fetchBrands();
    } catch (error: any) {
      toast.error(error.message || "Failed to save brand");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('new_')) {
      setBrands(brands.filter(b => b.id !== id));
      return;
    }
    try {
      await supabase.from('brands').delete().eq('id', id);
      toast.success("Brand deleted.");
      fetchBrands();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete brand");
    }
  };

  const updateBrand = (id: string, field: string, value: any) => {
    setBrands(brands.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addBrand = () => {
    setBrands([
      {
        id: `new_${Date.now()}`,
        name: "New Brand",
        logo_url: "https://placehold.co/200x100/ffffff/a1a1aa?text=Logo",
        is_active: true
      },
      ...brands
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3A2418]">Brands</h3>
          <p className="text-sm text-[#5F5A54]">Manage brands displayed in the homepage carousel.</p>
        </div>
        <button
          onClick={addBrand}
          className="flex items-center gap-2 px-4 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map(brand => (
          <div key={brand.id} className="bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl p-5 flex flex-col">
            <div className="h-24 bg-[#FFFDF8] border border-[#E8DCC9] rounded-xl flex items-center justify-center p-4 mb-4">
              <OptimizedImage 
                src={brand.logo_url} 
                alt={brand.name} 
                imgClassName="max-h-full max-w-full object-contain" className="w-full h-full flex items-center justify-center bg-transparent"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/200x100/ffffff/ef4444?text=Error';
                }}
              />
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-xs font-medium text-[#5F5A54] mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => updateBrand(brand.id, "name", e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] rounded-lg border border-[#E8DCC9] text-sm focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5F5A54] mb-1">Logo URL</label>
                <input
                  type="text"
                  value={brand.logo_url}
                  onChange={(e) => updateBrand(brand.id, "logo_url", e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] rounded-lg border border-[#E8DCC9] text-sm focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={brand.is_active}
                    onChange={(e) => updateBrand(brand.id, "is_active", e.target.checked)}
                    className="w-4 h-4 text-[#C65A28] rounded border-gray-300 focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                  <span className="text-sm font-medium text-[#5F5A54]">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E8DCC9]">
              <button
                onClick={() => handleDelete(brand.id)}
                className="flex-1 px-3 py-2 text-[#B94A48] bg-[#FFFDF8] border border-[#E8DCC9] hover:bg-[#B94A48]/10 hover:border-red-200 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => handleSave(brand)}
                disabled={isSaving}
                className="flex-1 px-3 py-2 bg-[#3A2418] hover:bg-[#3A2418] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
