import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { MapPin, ShieldCheck, Mail, Building2, Package, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";

interface SupplierProfile {
  id: string;
  business_name: string;
  company_type: string;
  location: string;
  bio: string;
  verified: boolean;
  created_at: string;
  logo_url?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: string;
  image_url: string;
}

export default function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSupplierDetails(id);
    }
  }, [id]);

  const fetchSupplierDetails = async (supplierId: string) => {
    setIsLoading(true);
    try {
      // Fetch Supplier Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supplierId)
        .single();

      if (profileError) throw profileError;
      setSupplier(profileData);

      // Fetch Supplier Products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", supplierId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      
      // We limit to max 12 products for the profile view
      setProducts(productsData?.slice(0, 12) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load supplier profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Supplier Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The supplier you are looking for does not exist or has been removed.
        </p>
        <Button render={<Link to="/products" />}>
          Browse All Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
      {/* Supplier Header Card */}
      <Card className="border-border bg-card shadow-sm overflow-hidden mb-10">
        <div className="h-32 bg-emerald-900/40 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <CardContent className="pt-0 relative px-6 sm:px-10 pb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-12 sm:-mt-16 mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center shrink-0 shadow-xl overflow-hidden relative z-10">
              {supplier.logo_url ? (
                <img 
                  src={supplier.logo_url} 
                  alt={supplier.business_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-4xl text-emerald-500 font-bold uppercase">
                  {supplier.business_name?.charAt(0) || "S"}
                </span>
              )}
            </div>
            
            <div className="flex-1 space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
                  {supplier.business_name || "Unknown Supplier"}
                </h1>
                {supplier.verified && (
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> 
                  {supplier.company_type || "Business"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> 
                  {supplier.location || "Global Location"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> 
                  Joined {new Date(supplier.created_at).getFullYear()}
                </span>
              </div>
            </div>
            
            <div className="shrink-0 w-full sm:w-auto relative z-10">
              {user ? (
                <Dialog>
                  <DialogTrigger 
                    render={
                      <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" />
                    }
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Supplier
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Contact {supplier.business_name}</DialogTitle>
                      <DialogDescription>
                        Send a direct message to this supplier. They will receive it in their inbox.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-foreground">Subject</Label>
                        <Input id="subject" placeholder="Inquiry about your products" className="bg-muted/50 border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-foreground">Message</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Hello, I would like to know more about..." 
                          className="min-h-[120px] bg-muted/50 border-border text-foreground" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={() => toast.success("Message sent! The supplier will respond shortly.")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Send Message
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  onClick={() => toast.error("Authentication required", { description: "Please log in to contact this supplier." })}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Supplier
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border/50 pb-2">About the Company</h3>
            <p className="text-muted-foreground leading-relaxed">
              {supplier.bio || "This supplier hasn't added a bio yet."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            Products by {supplier.business_name}
          </h2>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
            {products.length} Items Listed
          </Badge>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No products found</h3>
            <p className="text-muted-foreground">This supplier hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link to={`/products/${product.id}`} className="block h-full">
                  <Card className="h-full border-border bg-card hover:border-emerald-500/50 transition-all hover:shadow-lg dark:hover:shadow-emerald-500/10 overflow-hidden flex flex-col group">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      <img
                        src={product.image_url || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=80"}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-emerald-500 transition-colors">
                        {product.name}
                      </h3>
                      <div className="text-lg font-bold text-foreground mb-auto">
                        KES {product.price?.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                        <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> MOQ: {product.stock || "N/A"}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {supplier.location || "Global Location"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
