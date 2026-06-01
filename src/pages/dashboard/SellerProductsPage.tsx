import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
// Cache invalidation forced
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/Dialog";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string | number;
  status: "active" | "draft";
  image_url: string | null;
  seller_id?: string;
  description?: string;
}

export default function DashboardProductsPage() {
  const { user, profile } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchProducts();

    // Enable Realtime Subscriptions
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const newProduct = {
      seller_id: user.id,
      name: formData.get("name") as string,
      title: formData.get("name") as string, // Backwards compatibility with title column
      category: formData.get("category") as string,
      price: formData.get("price") as string,
      stock: formData.get("stock") as string,
      status: formData.get("status") as "active" | "draft",
      description: formData.get("description") as string,
      image_url: imagePreview || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from("products").update(newProduct).eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([newProduct]);
        if (error) throw error;
      }

      toast.success(editingProduct ? "Product updated successfully!" : "Product added successfully!");
      setIsAddOpen(false);
      setImagePreview(null);
      setEditingProduct(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products Manager
          </h1>
          <p className="text-muted-foreground">
            Manage your product catalog, inventory and pricing.
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setImagePreview(null);
              setEditingProduct(null);
            }
          }}
        >
          <DialogTrigger
            render={
              <Button 
                className={
                  profile?.role === "seller" && profile?.verified
                    ? "bg-amber-600 hover:bg-amber-500 text-foreground gap-2 h-10 px-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-emerald-600 hover:bg-emerald-500 text-foreground gap-2 h-10 px-4"
                } 
                onClick={() => setEditingProduct(null)} 
              />
            }
          >
            <Plus className="h-4 w-4" />
            Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-border text-foreground p-4 sm:p-6 rounded-2xl sm:rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingProduct ? "Update your product details." : "Create a new product listing for your buyers."}
              </DialogDescription>
            </DialogHeader>
            <form key={editingProduct?.id || "new"} onSubmit={handleAddProduct} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">Product Image</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/50">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground hover:bg-accent hover:text-accent-foreground border border-border rounded-lg text-sm font-medium transition-colors text-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Image
                    </Label>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG, WebP up to 5MB (Optional)
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80">
                  Product Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ""}
                  placeholder="e.g. Premium Arabica Coffee Beans"
                  className="bg-background"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground/80">
                    Category
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    required
                    defaultValue={editingProduct?.category || ""}
                    placeholder="e.g. Agriculture"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground/80">
                    Price (KES)
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    required
                    defaultValue={editingProduct?.price || ""}
                    placeholder="e.g. Ksh 45,000/mt"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-foreground/80">
                    Stock Availability
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    required
                    defaultValue={editingProduct?.stock || ""}
                    placeholder="e.g. 500 mt"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground/80">
                    Status
                  </Label>
                  <Select name="status" defaultValue={editingProduct?.status || "active"}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-border text-foreground">
                      <SelectItem value="active">Active (Visible)</SelectItem>
                      <SelectItem value="draft">Draft (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground/80">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct?.description || ""}
                  placeholder="Product details..."
                  className="bg-background resize-none"
                  rows={3}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingProduct(null);
                  }}
                  className="border-border hover:bg-muted/50 text-foreground text-foreground/80"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-foreground"
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-muted/50 text-foreground backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 border-border text-foreground focus-visible:ring-emerald-500 h-10 rounded-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-white/10">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 flex items-center gap-4 animate-pulse"
                >
                  <div className="h-16 w-16 bg-muted rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-8 w-24 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={product.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-16 w-16 rounded-lg bg-muted/50">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-foreground truncate group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="truncate">{product.category}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span>{product.stock} in stock</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span className="font-mono text-foreground/80">
                        {product.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:ml-auto shrink-0 justify-between sm:justify-end mt-2 sm:mt-0">
                    <div
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        product.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-500/10 text-muted-foreground border border-zinc-500/20"
                      }`}
                    >
                      {product.status === "active" ? "Active" : "Draft"}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 bg-[#0a0a0a] border-border text-foreground"
                      >
                        <DropdownMenuItem 
                          className="focus:bg-muted/50 focus:text-foreground cursor-pointer gap-2"
                          onClick={() => {
                            setEditingProduct(product);
                            setImagePreview(product.image_url || null);
                            setIsAddOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="focus:bg-red-500/10 focus:text-red-400 text-red-500 cursor-pointer gap-2"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 text-foreground flex items-center justify-center mb-4 text-muted-foreground">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No products found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {searchQuery
                  ? `No products match "${searchQuery}"`
                  : "You haven't added any products to your catalog yet."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsAddOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-foreground gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border-border text-foreground p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setProductToDelete(null);
              }}
              className="border-border hover:bg-muted/50 text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!productToDelete) return;
                setIsSubmitting(true);
                try {
                  const { error } = await supabase.from("products").delete().eq("id", productToDelete.id);
                  if (error) throw error;
                  toast.success("Product deleted successfully");
                  setIsDeleteOpen(false);
                } catch (err: any) {
                  toast.error(err.message || "Failed to delete product");
                } finally {
                  setIsSubmitting(false);
                  setProductToDelete(null);
                }
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
