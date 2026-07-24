import { Image as ImageIcon, UploadCloud, Folder, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Media Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized manager for all your product images, banners, and videos.
          </p>
        </div>
        <Button className="shrink-0">
          <UploadCloud className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media by name or tag..." className="pl-9" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" size="sm" className="w-full sm:w-auto"><Folder className="h-4 w-4 mr-2"/> New Folder</Button>
             <Button variant="outline" size="sm" className="w-full sm:w-auto text-[#B94A48] hover:text-[#C65A28] hover:bg-[#B94A48]/100/10"><Trash2 className="h-4 w-4 mr-2"/> Bulk Delete</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {/* Folders */}
           <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <Folder className="h-10 w-10 text-primary" />
              <span className="text-sm font-medium">Products</span>
           </div>
           <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <Folder className="h-10 w-10 text-primary" />
              <span className="text-sm font-medium">Banners</span>
           </div>
           <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <Folder className="h-10 w-10 text-primary" />
              <span className="text-sm font-medium">Logos</span>
           </div>
           
           {/* Images */}
           <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 overflow-hidden group relative">
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80" alt="Fresh Produce" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <Button size="sm" variant="outline" className="text-white border-white hover:bg-[#FFFDF8]/20">Select</Button>
              </div>
           </div>
           <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 overflow-hidden group relative">
              <img src="https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=200&q=80" alt="Meat" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <Button size="sm" variant="outline" className="text-white border-white hover:bg-[#FFFDF8]/20">Select</Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
