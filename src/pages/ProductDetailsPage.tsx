import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  MapPin,
  ShieldCheck,
  Mail,
  Phone,
  Factory,
  Package,
  ArrowLeft,
  Send,
  Heart,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

const inquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().min(2, "Company name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  message: z.string().min(10, "Please provide more details in your message"),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
  });

  useEffect(() => {
    fetchProductDetails();

    const channel = supabase
      .channel(`product-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchProductDetails();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (user && id) {
      const checkSaved = async () => {
        try {
          const { data } = await supabase
            .from("favorites")
            .select("id")
            .eq("buyer_id", user.id)
            .eq("product_id", id)
            .single();
          if (data) setIsSaved(true);
        } catch (e) {
          // ignore
        }
      };
      checkSaved();
    }
  }, [id, user]);

  const toggleSave = async () => {
    if (!user) {
      toast.error("Please log in to save products");
      return;
    }
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from("favorites")
          .delete()
          .eq("buyer_id", user.id)
          .eq("product_id", id);
        setIsSaved(false);
        toast.success("Product removed from saved items");
      } else {
        await supabase
          .from("favorites")
          .insert({ buyer_id: user.id, product_id: id });
        setIsSaved(true);
        toast.success("Product saved to your favorites");
      }
    } catch (e) {
      toast.error("Failed to update saved status");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Record recent view if user is a buyer
    if (user && id) {
      const recordView = async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "buyer") {
            await supabase.from("recent_views").upsert(
              {
                buyer_id: user.id,
                product_id: id,
                created_at: new Date().toISOString(),
              },
              { onConflict: "buyer_id, product_id" },
            );
          }
        } catch (e) {
          console.error("Failed to record recent view", e);
        }
      };
      recordView();
    }
  }, [id, user]);

  const fetchProductDetails = async () => {
    try {
      if (!id) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Map DB structure to what the UI expects
      setProduct({
        ...data,
        title: data.name,
        image:
          data.image_url ||
          "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&auto=format&fit=crop&q=80",
        moq: data.stock,
        unit: "units",
        location: "Global Market",
        supplier: "Supplier " + (data.seller_id?.slice(0, 5) || ""),
        isVerified: true,
        supplierInfo: {
          type: "Direct Seller",
          established: "2026",
          rating: "5.0/5",
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: InquiryFormValues) => {
    setIsSubmitting(true);
    try {
      if (!product) return;

      const inquiryData = {
        product_id: product.id,
        seller_id: product.seller_id,
        buyer_id: user ? user.id : null,
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        quantity: data.quantity,
        message: data.message,
      };

      const { error } = await supabase.from("inquiries").insert([inquiryData]);
      if (error) throw error;

      toast.success("Inquiry sent successfully!", {
        description: "The supplier will contact you soon.",
      });
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to send inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 text-center">
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          render={<Link to="/products" />}
          className="mb-6 -ml-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-muted/50 text-foreground backdrop-blur-md rounded-2xl overflow-hidden border border-border">
              <div className="aspect-[16/9] md:aspect-[21/9] bg-black relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge
                    variant="outline"
                    className="bg-muted/50 text-foreground text-foreground/80 border-border"
                  >
                    {product.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ID: PRD-{product.id}-2026
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {product.title}
                  </h1>
                  <Button
                    variant="ghost"
                    onClick={toggleSave}
                    disabled={isSaving}
                    className={`shrink-0 rounded-full h-10 w-10 p-0 sm:h-12 sm:w-auto sm:px-4 sm:rounded-xl bg-black/40 border border-border/50 hover:bg-black/60 ${isSaved ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`}
                    />
                    <span className="hidden sm:inline ml-2">
                      {isSaved ? "Saved" : "Save"}
                    </span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/40 rounded-xl mb-8 border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                      Est. Price
                    </p>
                    <p className="font-semibold text-lg text-emerald-400">
                      {product.price}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{product.unit}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                      Min. Order (MOQ)
                    </p>
                    <p className="font-semibold text-lg text-foreground">
                      {product.moq}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                      Location
                    </p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                      {product.location.split(",")[1] || product.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                      Availability
                    </p>
                    <p className="font-medium text-emerald-500">In Stock</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Product Details
                  </h3>
                  <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-line leading-relaxed text-sm md:text-base">
                    {product.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Info Snippet */}
            <Card className="border-border bg-muted/50 text-foreground backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Factory className="h-5 w-5 text-muted-foreground" />
                  Supplier Information
                </h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <span className="text-2xl font-bold text-emerald-500">
                      {product.supplier.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground text-lg">
                        {product.supplier}
                      </h4>
                      {product.isVerified && (
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-4">
                      <MapPin className="h-4 w-4" /> {product.location}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="bg-black/40 px-3 py-1.5 rounded-md border border-border/50 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Type:
                        </span>{" "}
                        {product.supplierInfo.type}
                      </div>
                      <div className="bg-black/40 px-3 py-1.5 rounded-md border border-border/50 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Est:
                        </span>{" "}
                        {product.supplierInfo.established}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-border bg-transparent hover:bg-muted/50 text-foreground text-foreground"
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Inquiry Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-border bg-muted/50 text-foreground backdrop-blur-xl shadow-2xl shadow-emerald-900/5">
                <CardContent className="p-0">
                  <div className="bg-emerald-600/20 border-b border-emerald-500/20 text-foreground p-6 rounded-t-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <h3 className="text-xl font-bold mb-1 relative z-10">
                      Send Inquiry
                    </h3>
                    <p className="text-emerald-100/80 text-sm relative z-10">
                      Get quotes directly from {product.supplier}
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="p-6 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-muted-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="John Doe"
                          className={`bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500 ${errors.name ? "border-red-500" : ""}`}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-muted-foreground"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="john@company.com"
                          className={`bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500 ${errors.email ? "border-red-500" : ""}`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="company"
                        className="text-muted-foreground"
                      >
                        Company Name
                      </Label>
                      <Input
                        id="company"
                        {...register("company")}
                        placeholder="Global Imports Ltd"
                        className={`bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500 ${errors.company ? "border-red-500" : ""}`}
                      />
                      {errors.company && (
                        <p className="text-xs text-red-500">
                          {errors.company.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-muted-foreground"
                        >
                          Phone (Optional)
                        </Label>
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="+1 234 567 890"
                          className="bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="quantity"
                          className="text-muted-foreground"
                        >
                          Required Quantity
                        </Label>
                        <Input
                          id="quantity"
                          {...register("quantity")}
                          placeholder={`e.g. 1000 ${product.unit}`}
                          className={`bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500 ${errors.quantity ? "border-red-500" : ""}`}
                        />
                        {errors.quantity && (
                          <p className="text-xs text-red-500">
                            {errors.quantity.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="message"
                        className="text-muted-foreground"
                      >
                        Message Details
                      </Label>
                      <Textarea
                        id="message"
                        {...register("message")}
                        placeholder="Please include delivery destination, special requirements, or target price..."
                        rows={4}
                        className={`bg-black/40 border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500 ${errors.message ? "border-red-500 resize-none" : "resize-none"}`}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black h-12 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending Request..." : "Send Request Now"}
                      {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground pt-2 flex justify-center items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Your information is securely shared with the supplier.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
