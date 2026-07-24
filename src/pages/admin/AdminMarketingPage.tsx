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
    const channel = supabase.channel('public:banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        fetchBanners();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
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
            Homepage Banners
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-border/50 space-y-4">
              <h3 className="font-bold text-lg">Add New Banner</h3>
              <div className="space-y-2">
                 <Label>Banner Title</Label>
                 <Input value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} placeholder="e.g. Summer Sale 2026" />
              </div>
              <div className="space-y-2">
                 <Label>Subtitle</Label>
                 <Input value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} placeholder="Get up to 50% off" />
              </div>
              <div className="space-y-2">
                 <Label>Call to Action Text</Label>
                 <Input value={newBanner.cta_text} onChange={e => setNewBanner({...newBanner, cta_text: e.target.value})} placeholder="Shop Now" />
              </div>
              <div className="space-y-2">
                 <Label>Call to Action Link</Label>
                 <Input value={newBanner.cta_link} onChange={e => setNewBanner({...newBanner, cta_link: e.target.value})} placeholder="/products?category=summer" />
              </div>
              <div className="space-y-2">
                 <Label>Desktop Image (1920x600)</Label>
                 <div className="relative h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:bg-muted/50 cursor-pointer transition-colors overflow-hidden">
                    {newBanner.image_url ? (
                      <img src={newBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-sm text-muted-foreground">{isUploading ? "Uploading..." : "Upload Image"}</span>
                      </>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" onChange={handleImageUpload} accept="image/*" />
                 </div>
              </div>
              <Button className="w-full mt-2" onClick={createBanner}>Create Banner</Button>
           </div>
           
           <div className="lg:col-span-2 space-y-4">
             <h3 className="font-bold text-lg">Active Banners</h3>
             {banners.length === 0 ? (
                <div className="glass-card p-8 rounded-xl border border-border/50 text-center text-muted-foreground">
                  No banners found. Create one to display on the homepage.
                </div>
             ) : (
               banners.map(banner => (
                 <div key={banner.id} className="glass-card p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row gap-4 items-center">
                    <div 
                      className="h-24 w-full sm:w-48 bg-muted rounded-lg bg-cover bg-center" 
                      style={{ backgroundImage: `url(${banner.image_url})`}} 
                    />
                    <div className="flex-1 w-full text-center sm:text-left">
                       <h4 className="font-bold">{banner.title}</h4>
                       <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                       {banner.cta_link && <p className="text-xs text-muted-foreground mt-1">Target: {banner.cta_link}</p>}
                    </div>
                    <Button variant="outline" size="icon" className="text-[#B94A48] shrink-0" onClick={() => deleteBanner(banner.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
               ))
             )}
           </div>
        </div>
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
