import AdminBannersManager from "./AdminBannersManager";
import { OptimizedImage } from "../../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { Megaphone, LayoutTemplate, MessageSquare, Ticket, BellRing, ArrowLeft, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [banners, setBanners] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState({ title: "", subtitle: "", cta_text: "", cta_link: "", image_url: "" });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
    
    
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await supabase.from("banners").select("*").order('sort_order', { ascending: true });
      if (data) setBanners(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setIsUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);

      if (uploadError) {
         // Fallback to local url for demo purposes if bucket doesn't exist
         toast.error("Upload failed. Using a placeholder image.");
         setNewBanner(prev => ({...prev, image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80"}));
         setIsUploading(false);
         return;
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setNewBanner(prev => ({...prev, image_url: data.publicUrl}));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const createBanner = async () => {
    if (!newBanner.title || !newBanner.image_url) {
      toast.error("Title and image are required");
      return;
    }
    try {
      const { error } = await supabase.from("banners").insert([
        { ...newBanner, is_active: true, sort_order: banners.length }
      ]);
      if (error) throw error;
      toast.success("Banner created successfully!");
      setNewBanner({ title: "", subtitle: "", cta_text: "", cta_link: "", image_url: "" });
    } catch (error: any) {
      // If table doesn't exist, we just mock it for the demo
      if (error.code === '42P01') {
        toast.error("Banners table not found. Please create it in Supabase.");
      } else {
        toast.error(error.message || "Failed to create banner");
      }
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await supabase.from("banners").delete().eq("id", id);
      toast.success("Banner deleted");
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  if (activeTab === "banners") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab("overview")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Marketing Center
          </h1>
        </div>
        <AdminBannersManager />
      </div>
    );
  }
  // Simplified view for other tabs...
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Marketing Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage banners, promotional flyers, popups, and campaigns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setActiveTab("banners")}>
           <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <Ticket className="h-6 w-6 text-green-500" />
           </div>
           <h3 className="font-bold text-lg mb-2">Homepage Banners</h3>
           <p className="text-sm text-muted-foreground mb-4">Upload and schedule desktop and mobile banners.</p>
           <Button variant="outline" className="w-full">Manage Banners</Button>
        </div>
        
        <div className="glass-card p-6 rounded-2xl border hover:border-primary/50 transition-colors cursor-pointer group opacity-50">
           <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
             <LayoutTemplate className="h-6 w-6 text-primary" />
           </div>
           <h3 className="font-bold text-lg mb-2">Promotional Flyers</h3>
           <p className="text-sm text-muted-foreground mb-4">Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
