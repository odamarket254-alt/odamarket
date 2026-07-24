import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Loader2, Plus, Trash2, Eye, Calendar, MapPin, Image as ImageIcon } from "lucide-react";

export function BannersManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (banner: any) => {
    setIsSaving(true);
    try {
      if (banner.id.startsWith('new_')) {
        const { id, ...newBanner } = banner;
        await supabase.from('banners').insert(newBanner);
      } else {
        await supabase.from('banners').update(banner).eq('id', banner.id);
      }
      toast.success("Banner saved successfully.");
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message || "Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('new_')) {
      setBanners(banners.filter(b => b.id !== id));
      return;
    }

    try {
      await supabase.from('banners').delete().eq('id', id);
      toast.success("Banner deleted.");
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete banner");
    }
  };

  const updateBanner = (id: string, field: string, value: any) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addBanner = () => {
    setBanners([
      {
        id: `new_${Date.now()}`,
        title: "New Promotional Banner",
        image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        link_url: "/offers",
        position: "home_middle",
        sort_order: banners.length,
        is_active: true
      },
      ...banners
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3A2418]">Promotional Banners</h3>
          <p className="text-sm text-[#5F5A54]">Manage promotional banners across the homepage.</p>
        </div>
        <button
          onClick={addBanner}
          className="flex items-center gap-2 px-4 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-[#FAF5EC] border border-[#E8DCC9] p-6 rounded-2xl flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="aspect-[21/9] md:aspect-video bg-[#E8DCC9] rounded-xl overflow-hidden relative border border-[#E8DCC9] group">
                <img 
                  src={banner.image_url} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x400/e2e8f0/64748b?text=Invalid+Image+URL';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="px-3 py-1.5 bg-[#FFFDF8]/20 hover:bg-[#FFFDF8]/40 backdrop-blur-md rounded-lg text-white text-xs font-medium">Change Image</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5F5A54] mb-1">Image URL</label>
                <input
                  type="text"
                  value={banner.image_url}
                  onChange={(e) => updateBanner(banner.id, "image_url", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8DCC9] text-sm focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <label className="block text-xs font-medium text-[#5F5A54] mb-1">Banner Title (Internal)</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => updateBanner(banner.id, "title", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DCC9] font-medium text-[#3A2418] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#5F5A54]">Active</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                      checked={banner.is_active}
                      onChange={(e) => updateBanner(banner.id, "is_active", e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#E8DCC9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFDF8] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C65A28]"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5F5A54] mb-1">Link URL</label>
                  <input
                    type="text"
                    value={banner.link_url}
                    onChange={(e) => updateBanner(banner.id, "link_url", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DCC9] text-sm focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5F5A54] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Position
                  </label>
                  <select
                    value={banner.position}
                    onChange={(e) => updateBanner(banner.id, "position", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E8DCC9] text-sm focus:border-[#C65A28] outline-none bg-[#FFFDF8] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  >
                    <option value="home_hero">Home - Hero Top</option>
                    <option value="home_middle">Home - Middle Section</option>
                    <option value="home_bottom">Home - Bottom Section</option>
                    <option value="category_sidebar">Category - Sidebar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E8DCC9]">
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-3 py-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => handleSave(banner)}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#3A2418] hover:bg-[#3A2418] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl border-dashed">
            <ImageIcon className="w-12 h-12 text-[#8B857D] mx-auto mb-3" />
            <p className="text-[#5F5A54] font-medium">No promotional banners</p>
          </div>
        )}
      </div>
    </div>
  );
}
