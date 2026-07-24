import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Loader2, Upload, Plus, Trash2, Eye, MonitorPlay } from "lucide-react";

export function HeroSectionManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    fetchHeroSettings();
  }, []);

  const fetchHeroSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('group_name', 'storefront')
        .eq('key', 'hero_slides')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value && Array.isArray(data.value)) {
        setSlides(data.value);
      } else {
        // Default
        setSlides([
          {
            id: Date.now().toString(),
            headline: "Fresh Groceries Delivered",
            subtitle: "Get fresh produce and everyday essentials delivered right to your door.",
            button_text: "Shop Now",
            button_link: "/products",
            background_image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching hero settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('group_name', 'storefront')
        .eq('key', 'hero_slides')
        .single();

      if (existing) {
        await supabase
          .from('settings')
          .update({ value: slides })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('settings')
          .insert({
            group_name: 'storefront',
            key: 'hero_slides',
            value: slides
          });
      }
      
      toast.success("Hero section updated successfully. Changes are live.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const addSlide = () => {
    setSlides([
      ...slides,
      {
        id: Date.now().toString(),
        headline: "New Special Offer",
        subtitle: "Don't miss out on our latest deals.",
        button_text: "Discover",
        button_link: "/deals",
        background_image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&q=80"
      }
    ]);
  };

  const removeSlide = (index: number) => {
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
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
          <h3 className="text-xl font-bold text-[#3A2418]">Hero Section Slider</h3>
          <p className="text-sm text-[#5F5A54]">Manage the main slides displayed at the top of the homepage.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addSlide}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8DCC9] hover:bg-[#E8DCC9] text-[#5F5A54] rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-[#FAF5EC] border border-[#E8DCC9] p-6 rounded-2xl relative group">
            <button
              onClick={() => removeSlide(index)}
              className="absolute top-4 right-4 p-2 text-red-400 hover:bg-[#B94A48]/10 hover:text-[#B94A48] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-8 flex items-center justify-center bg-[#FFFDF8] text-[#5F5A54] font-bold rounded-full shadow-sm">
                {index + 1}
              </span>
              <h4 className="font-semibold text-[#5F5A54]">Slide Details</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Headline</label>
                  <input
                    type="text"
                    value={slide.headline}
                    onChange={(e) => updateSlide(index, "headline", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] focus:ring-2 focus:ring-[#C65A28]/20 outline-none transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] focus:ring-2 focus:ring-[#C65A28]/20 outline-none transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5F5A54] mb-1">Button Text</label>
                    <input
                      type="text"
                      value={slide.button_text}
                      onChange={(e) => updateSlide(index, "button_text", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] focus:ring-2 focus:ring-[#C65A28]/20 outline-none transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5F5A54] mb-1">Button Link</label>
                    <input
                      type="text"
                      value={slide.button_link}
                      onChange={(e) => updateSlide(index, "button_link", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] focus:ring-2 focus:ring-[#C65A28]/20 outline-none transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Background Image URL</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={slide.background_image}
                    onChange={(e) => updateSlide(index, "background_image", e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] focus:ring-2 focus:ring-[#C65A28]/20 outline-none transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                  <button className="px-4 py-2.5 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-xl hover:bg-[#FAF5EC] transition-colors flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Image Preview */}
                <div className="w-full aspect-[21/9] bg-[#E8DCC9] rounded-xl overflow-hidden relative border border-[#E8DCC9]">
                  <img 
                    src={slide.background_image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/1200x500/e2e8f0/64748b?text=Invalid+Image+URL';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-8 pointer-events-none">
                    <div className="max-w-md text-white">
                      <h2 className="text-2xl font-bold mb-2">{slide.headline}</h2>
                      <p className="text-sm opacity-90 mb-4">{slide.subtitle}</p>
                      <span className="px-4 py-2 bg-[#C65A28] rounded-lg text-xs font-bold">{slide.button_text}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Live Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl border-dashed">
            <MonitorPlay className="w-12 h-12 text-[#8B857D] mx-auto mb-3" />
            <p className="text-[#5F5A54] font-medium">No slides configured</p>
            <button
              onClick={addSlide}
              className="mt-4 px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] shadow-sm rounded-lg text-[#5F5A54] hover:bg-[#FAF5EC] text-sm font-medium"
            >
              Add First Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
