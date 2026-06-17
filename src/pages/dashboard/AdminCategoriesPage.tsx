import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Plus, Edit2, Trash2, Folder, Package, RefreshCw, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Package",
    image_url: "",
    parent_id: "none",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Delete Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string, name: string, isPrimary: boolean}>({ isOpen: false, id: "", name: "", isPrimary: false });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        toast.error("Failed to fetch categories");
        return;
      }
      
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const primaryCategories = categories.filter((c) => c.level === 0);

  const openModal = (category?: Category, parentId?: string) => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        icon: category.icon || "Package",
        image_url: category.image_url || "",
        parent_id: category.parent_id || "none",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "Package",
        image_url: "",
        parent_id: parentId || "none",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    setImagePreviewUrl(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.slug) {
        toast.error("Name and Slug are required.");
        return;
      }
      
      setIsSaving(true);
      
      let finalImageUrl = formData.image_url;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`;
        const filePath = `category-images/${fileName}`;

        // Just using "images" bucket or "category-images" bucket if created.
        // Let's use "category-images" bucket which we added the migration for.
        const { error: uploadError } = await supabase.storage
          .from("category-images")
          .upload(filePath, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("does not exist") || uploadError.message.includes("The resource was not found")) {
            throw new Error(
              "Storage bucket 'category-images' not found. Please create this bucket in your Supabase Dashboard and set it to 'Public'."
            );
          }
          throw new Error("Error uploading image: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("category-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }
      
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
        image_url: finalImageUrl,
        parent_id: formData.parent_id === "none" ? null : formData.parent_id,
        level: formData.parent_id === "none" ? 0 : 1,
      };

      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        toast.success("Category created successfully");
      }
      
      closeModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string, name: string, isPrimary: boolean) => {
    setDeleteDialog({ isOpen: true, id, name, isPrimary });
  };

  const executeDelete = async () => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", deleteDialog.id);
      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeleteDialog({ isOpen: false, id: "", name: "", isPrimary: false });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Hierarchy</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage the marketplace taxonomy and product divisions.
          </p>
        </div>
        <Button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Primary Category
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mb-4 text-emerald-500" /> 
            <span>Loading taxonomy...</span>
          </div>
        ) : categories.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 border-t border-border border-dashed m-4 rounded-xl">
             <div className="bg-muted p-4 rounded-full mb-4">
               <Folder className="h-8 w-8 text-muted-foreground" />
             </div>
             <p className="text-muted-foreground mb-4">No categories configured yet.</p>
             <Button variant="outline" onClick={() => openModal()}>Create First Category</Button>
           </div>
        ) : (
          <div className="divide-y divide-border/50">
            {primaryCategories.map((primary) => {
              const subcategories = categories.filter((c) => c.parent_id === primary.id);
              return (
                <div key={primary.id} className="flex flex-col">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/20 p-4 gap-4">
                     <div className="flex items-center gap-4 w-full">
                       {primary.image_url ? (
                         <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden border border-border">
                           <img src={primary.image_url} alt={primary.name} className="w-full h-full object-cover" />
                         </div>
                       ) : (
                         <div className="w-12 h-12 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800">
                            <Folder className="h-6 w-6" />
                         </div>
                       )}
                       <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-foreground truncate">{primary.name}</h3>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded truncate">{primary.slug}</span>
                           <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Primary</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                       <Button variant="outline" size="sm" onClick={() => openModal(undefined, primary.id)} className="hidden sm:flex">
                         <Plus className="h-3 w-3 mr-1" /> Add Sub
                       </Button>
                       <Button variant="ghost" size="icon-sm" onClick={() => openModal(primary)}>
                         <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       </Button>
                       <Button variant="ghost" size="icon-sm" onClick={() => confirmDelete(primary.id, primary.name, true)}>
                         <Trash2 className="h-4 w-4 text-red-500/70 hover:text-red-600" />
                       </Button>
                     </div>
                   </div>
                   
                   {subcategories.length > 0 && (
                     <div className="p-4 pl-4 sm:pl-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-background border-t border-border/30">
                       {subcategories.map(sub => (
                          <div key={sub.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30 border border-border/50 hover:border-emerald-500/30 transition-colors group">
                             {sub.image_url ? (
                               <div className="w-8 h-8 rounded shrink-0 overflow-hidden border border-border">
                                 <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
                               </div>
                             ) : (
                               <div className="w-8 h-8 flex items-center justify-center rounded bg-muted shrink-0 text-muted-foreground group-hover:text-emerald-600 transition-colors">
                                 <Package className="h-4 w-4" />
                               </div>
                             )}
                             <div className="flex flex-col flex-1 min-w-0">
                               <span className="text-foreground font-medium truncate" title={sub.name}>{sub.name}</span>
                               <span className="text-[10px] text-muted-foreground font-mono truncate">{sub.slug}</span>
                             </div>
                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                               <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => openModal(sub)}>
                                 <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                               </Button>
                               <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => confirmDelete(sub.id, sub.name, false)}>
                                 <Trash2 className="h-3 w-3 text-red-500 hover:text-red-600" />
                               </Button>
                             </div>
                          </div>
                       ))}
                       <Button variant="outline" size="sm" onClick={() => openModal(undefined, primary.id)} className="sm:hidden border-dashed border-border/60 justify-start h-auto py-2 group-hover:border-emerald-500/50">
                          <Plus className="h-4 w-4 mr-2" /> Add Subcategory
                       </Button>
                     </div>
                   )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, isOpen: false })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete <strong className="text-foreground font-medium">"{deleteDialog.name}"</strong>?
            </p>
            {deleteDialog.isPrimary && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 dark:text-red-400 text-sm flex gap-2 items-start">
                <Trash2 className="h-4 w-4 shrink-0 mt-0.5" />
                <p>This is a primary category. Deleting it will also permanently delete all of its subcategories.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Delete Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    name: val,
                    // Auto-generate slug if it's a new category and slug is empty or matches previous auto-gen
                    slug: editingId ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  });
                }} 
                placeholder="e.g. Fresh Produce" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug Format</Label>
              <Input 
                id="slug" 
                value={formData.slug} 
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                placeholder="fresh-produce"
                className="font-mono text-xs" 
              />
            </div>
            
            {primaryCategories.length > 0 && (!editingId || formData.parent_id !== "none") && (
              <div className="grid gap-2">
                <Label htmlFor="parent_id">Parent Category (Optional)</Label>
                <select 
                  id="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="none">-- None (Primary Category) --</option>
                  {primaryCategories.filter(p => p.id !== editingId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="image_url">Category Image</Label>
              <div className="flex gap-4 items-center">
                <div className="relative w-16 h-16 shrink-0 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                  {(imagePreviewUrl || formData.image_url) ? (
                    <img src={imagePreviewUrl || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    id="image_url" 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended size: 400x400px. Max: 5MB.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Optional description for this category" 
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSaving ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

