import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Loader2 } from "lucide-react";

export function StorefrontFooterManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [footerSettings, setFooterSettings] = useState<any>({
    company_info: "OdaMarket is your trusted partner for fresh groceries and everyday essentials.",
    contact_email: "support@odamarket.com",
    contact_phone: "+254 700 000 000",
    contact_address: "123 Market Street, Nairobi, Kenya",
    facebook_url: "https://facebook.com",
    twitter_url: "https://twitter.com",
    instagram_url: "https://instagram.com"
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value').limit(100)
        .eq('group_name', 'storefront')
        .eq('key', 'footer')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        setFooterSettings(data.value);
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id').limit(100)
        .eq('group_name', 'storefront')
        .eq('key', 'footer')
        .single();

      if (existing) {
        await supabase
          .from('settings')
          .update({ value: footerSettings })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('settings')
          .insert({
            group_name: 'storefront',
            key: 'footer',
            value: footerSettings
          });
      }
      
      toast.success("Footer settings saved successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFooterSettings({ ...footerSettings, [field]: value });
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
          <h3 className="text-xl font-bold text-[#3A2418]">Footer Details</h3>
          <p className="text-sm text-[#5F5A54]">Manage contact information and social links in the footer.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#FAF5EC] border border-[#E8DCC9] p-6 rounded-2xl space-y-4">
            <h4 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Company Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Company Description</label>
              <textarea
                value={footerSettings.company_info}
                onChange={(e) => updateField("company_info", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none resize-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Contact Email</label>
              <input
                type="email"
                value={footerSettings.contact_email}
                onChange={(e) => updateField("contact_email", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Contact Phone</label>
              <input
                type="text"
                value={footerSettings.contact_phone}
                onChange={(e) => updateField("contact_phone", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Physical Address</label>
              <input
                type="text"
                value={footerSettings.contact_address}
                onChange={(e) => updateField("contact_address", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#FAF5EC] border border-[#E8DCC9] p-6 rounded-2xl space-y-4">
            <h4 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Social Links</h4>
            
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Facebook URL</label>
              <input
                type="url"
                value={footerSettings.facebook_url}
                onChange={(e) => updateField("facebook_url", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Twitter (X) URL</label>
              <input
                type="url"
                value={footerSettings.twitter_url}
                onChange={(e) => updateField("twitter_url", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Instagram URL</label>
              <input
                type="url"
                value={footerSettings.instagram_url}
                onChange={(e) => updateField("instagram_url", e.target.value)}
                className="w-full px-4 py-2 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
