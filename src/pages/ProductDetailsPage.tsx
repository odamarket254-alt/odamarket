import { useState, useEffect } from "react";
import { VerifiedBadge } from "../components/ui/VerifiedBadge";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Card, CardContent } from "../components/ui/Card";
import { Separator } from "../components/ui/Separator";
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
  Sparkles,
  Share2,
  Clock,
  Globe2,
  Info,
  CheckCircle2,
  List,
  ChevronRight,
  Shield,
  Award,
  Calendar,
  AlertCircle,
  MessageCircle,
  Truck,
  Star,
  Users,
  CreditCard,
  FileText,
  ChevronLeft,
  ThumbsUp,
  Tag,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { differenceInYears, formatDistanceToNowStrict } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { CreateRFQModal } from "../components/rfq/CreateRFQModal";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { verifyRecaptchaToken } from "../lib/recaptcha";

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
  const [activeImage, setActiveImage] = useState(0);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
  });

  useEffect(() => {
    fetchProductDetails();

    const channel = supabase
      .channel(`product-details-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchProductDetails(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchProductDetails(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        () => fetchProductDetails(true),
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

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.title,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const scrollToInquiry = () => {
    const el = document.getElementById("inquiry-form-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
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

  const getProductMetadata = (tags?: string[]) => {
    if (!tags) return {};
    const metaTag = tags.find((t) => t && t.startsWith('{"__metadata"'));
    if (metaTag) {
      try {
        return JSON.parse(metaTag).__metadata;
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const fetchProductDetails = async (background = false) => {
    try {
      if (!id) return;
      if (!background) setIsLoading(true);

      // Fetch Product Setup
      const { data, error } = await supabase
        .from("products")
        .select("*, profiles(*), categories(name, slug)")
        .eq("id", id)
        .single();

      if (error) throw error;

      const supplierId = data.seller_id;

      // Fetch stats
      const [{ count: productCount }, { count: inquiryCount }] =
        await Promise.all([
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", supplierId)
            .eq("status", "active"),
          supabase
            .from("inquiries")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", supplierId),
        ]);

      const metadata = getProductMetadata(data.tags);

      // Map DB structure to what the UI expects
      setProduct({
        ...data,
        title: data.name,
        image:
          data.image_url ||
          "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&auto=format&fit=crop&q=80",
        images: [
          data.image_url ||
            "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&auto=format&fit=crop&q=80",
        ],
        moq: data.moq || 1,
        unit: "units",
        location: data.profiles?.location || "Global Market",
        supplier:
          data.profiles?.business_name ||
          "Supplier " + (data.seller_id?.slice(0, 5) || ""),
        isVerified: data.profiles?.verified || false,
        country: data.profiles?.country || "",
        leadTime: metadata.lead_time || "Negotiable",
        capacity: metadata.production_capacity || "Contact for details",
        shippingMethods: metadata.shipping_methods || [],
        certifications: metadata.certifications || [],
        pricingTiers: metadata.pricing_tiers || [],
        specifications: metadata.specifications || "",
        features: metadata.features || "",
        packagingDetails: metadata.packaging_details || "",
        categoryName: data.categories?.name || "Uncategorized",
        categorySlug: data.categories?.slug || "",
        supplierInfo: {
          type: data.profiles?.company_type || "Wholesaler",
          established: data.profiles?.created_at
            ? new Date(data.profiles.created_at).toLocaleDateString([], {
                year: "numeric",
                month: "long",
              })
            : "Unknown",
          establishedYear: data.profiles?.created_at
            ? new Date(data.profiles.created_at).getFullYear()
            : new Date().getFullYear(),
          responseRate: inquiryCount
            ? Math.min(98, 80 + inquiryCount) + "%"
            : "90%",
          responseTime: data.profiles?.average_response_time || "< 24h",
          transactions: inquiryCount || 0,
          yearsInBusiness: (() => {
            const created = data.profiles?.created_at
              ? new Date(data.profiles.created_at)
              : new Date();
            const duration = formatDistanceToNowStrict(created, {
              addSuffix: false,
            });
            return duration.toUpperCase();
          })(),
          productCount: productCount || 0,
          lastActive: data.profiles?.updated_at
            ? new Date(data.profiles?.updated_at).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Recently",
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
    if (!user) {
      toast.error("Authentication required", {
        description: "You must be signed in to send inquiries.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!product) return;

      const isValid = await verifyRecaptchaToken(executeRecaptcha, "inquiry");
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const inquiryData = {
        product_id: product.id,
        seller_id: product.seller_id,
        buyer_id: user.id,
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
      <div className="min-h-[100dvh] bg-background py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-6 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
            <div className="xl:col-span-8 space-y-6">
              <div className="aspect-[4/3] sm:aspect-[16/9] w-full rounded-[24px] bg-muted animate-pulse" />
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-2xl bg-muted animate-pulse" />
                <div className="h-24 w-24 rounded-2xl bg-muted animate-pulse" />
                <div className="h-24 w-24 rounded-2xl bg-muted animate-pulse" />
              </div>
              <div className="h-40 w-full bg-muted rounded-[24px] animate-pulse" />
            </div>
            <div className="xl:col-span-4 flex flex-col space-y-6">
              <div className="h-[400px] w-full bg-muted rounded-[24px] animate-pulse" />
              <div className="h-[300px] w-full bg-muted rounded-[24px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Product not found
          </h2>
          <Button variant="outline" render={<Link to="/products" />}>
            Return to Products
          </Button>
        </div>
      </div>
    );
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-[100dvh] bg-background pt-6 pb-28 lg:py-10 selection:bg-[#00B074]/30 font-sans text-foreground">
      <div className="container mx-auto px-4 max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Products", href: "/products" },
            {
              label: product.categoryName,
              href: `/c/${product.categorySlug}`,
            },
            { label: product.title || product.name },
          ]}
          className="mb-6 lg:mb-8 text-sm"
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 relative">
          {/* LEFT COLUMN - GALLERY & DETAILS */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="xl:col-span-8 flex flex-col gap-8"
          >
            {/* Main Product Presentation (Gallery + Intro) */}
            <div className="bg-card rounded-[24px] shadow-sm border border-border text-foreground overflow-hidden text-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">
                {/* Image Gallery */}
                <div className="flex flex-col w-full h-full bg-background border-b md:border-b-0 md:border-r border-border">
                  <div className="aspect-square flex items-center justify-center w-full relative group overflow-hidden text-foreground">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImage}
                        src={product.images[activeImage]}
                        alt={product.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="object-cover w-full h-full absolute inset-0"
                      />
                    </AnimatePresence>

                    {/* Floating Hover Controls (Desktop) */}
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() =>
                          setActiveImage((prev) =>
                            prev > 0 ? prev - 1 : product.images.length - 1,
                          )
                        }
                        className="w-10 h-10 rounded-full bg-card/90 backdrop-blur shadow-lg flex items-center justify-center text-foreground hover:text-[#00B074] hover:scale-110 transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImage((prev) =>
                            prev < product.images.length - 1 ? prev + 1 : 0,
                          )
                        }
                        className="w-10 h-10 rounded-full bg-card/90 backdrop-blur shadow-lg flex items-center justify-center text-foreground hover:text-[#00B074] hover:scale-110 transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="p-4 grid grid-cols-4 gap-3 mt-auto">
                    {product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={cn(
                          "aspect-square rounded-[8px] bg-background border-2 overflow-hidden transition-all",
                          activeImage === idx
                            ? "border-[#00B074] ring-2 ring-[#00B074]/20"
                            : "border-transparent opacity-70 hover:opacity-100",
                        )}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Core Intro (Visible inside card on desktop) */}
                <div className="p-6 md:p-8 flex flex-col justify-center bg-card">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-[#00B074]/10 text-[#00B074] hover:bg-[#00B074]/20 border-none px-3 py-1 font-semibold rounded-md"
                    >
                      Top Choice
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border text-foreground tracking-wider">
                      ITEM #{product.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-[1.25] mb-2">
                    {product.title}
                  </h1>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(product.supplierInfo.rating)
                              ? "fill-current"
                              : "fill-transparent border-current",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {product.supplierInfo.rating}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <a
                      href="#reviews"
                      className="text-sm text-muted-foreground hover:text-[#00B074] transition-colors"
                    >
                      {product.supplierInfo.reviews} Reviews
                    </a>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3">
                    {product.description ||
                      "Premium wholesale merchandise guaranteed to meet corporate and industrial standards."}
                  </p>

                  <div className="flex items-center gap-4 mt-auto flex-wrap">
                    <Button
                      onClick={scrollToInquiry}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12 rounded-[12px] font-bold text-sm"
                    >
                      Get Latest Price
                    </Button>
                    <Button
                      onClick={() => setIsRFQModalOpen(true)}
                      className="flex-1 bg-[#00B074] hover:bg-[#009260] text-white shadow-lg h-12 rounded-[12px] font-bold text-sm"
                    >
                      Request Quote
                    </Button>
                    <Button
                      variant="outline"
                      className="w-12 h-12 p-0 rounded-[12px] border-border flex-shrink-0 text-muted-foreground hover:bg-muted hover:text-[#00B074]"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B Info Grid Sections */}
            <div className="bg-card rounded-[24px] shadow-sm border border-border text-foreground p-6 md:p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <List className="h-5 w-5 text-muted-foreground" />
                Wholesale Logistics & Specs
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[16px] bg-background border border-border text-foreground hover:border-[#00B074]/30 transition-colors"
                >
                  <Package className="h-6 w-6 text-[#00B074] mb-3" />
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Min Order
                  </div>
                  <div className="font-bold text-foreground">
                    {product.moq} {product.unit}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[16px] bg-background border border-border text-foreground hover:border-[#00B074]/30 transition-colors"
                >
                  <Truck className="h-6 w-6 text-[#00B074] mb-3" />
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Lead Time
                  </div>
                  <div className="font-bold text-foreground">
                    {product.leadTime}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[16px] bg-background border border-border text-foreground hover:border-[#00B074]/30 transition-colors"
                >
                  <Factory className="h-6 w-6 text-[#00B074] mb-3" />
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Production
                  </div>
                  <div className="font-bold text-foreground">
                    {product.capacity}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[16px] bg-background border border-border text-foreground hover:border-[#00B074]/30 transition-colors"
                >
                  <MapPin className="h-6 w-6 text-[#00B074] mb-3" />
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Origin
                  </div>
                  <div
                    className="font-bold text-foreground truncate"
                    title={product.location}
                  >
                    {product.location.split(",")[1]?.trim() || product.location}
                  </div>
                </motion.div>
              </div>

              <Separator className="my-8 bg-muted/80" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                {product.certifications &&
                  product.certifications.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">
                        Certifications
                      </span>
                      <span className="text-foreground font-medium flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#00B074]" />{" "}
                        {product.certifications.join(", ")}
                      </span>
                    </div>
                  )}
                {product.shippingMethods &&
                  product.shippingMethods.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground font-medium">
                        {product.shippingMethods.join(", ")}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="bg-card rounded-[24px] shadow-sm border border-border text-foreground p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Product Description
                </h2>
                <div className="prose max-w-none text-muted-foreground text-foreground/80 leading-relaxed">
                  {product.description ? (
                    <div className="whitespace-pre-wrap">
                      {product.description}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description provided by the seller.
                    </p>
                  )}
                </div>
              </div>

              {product.specifications && (
                <div>
                  <h3 className="text-md font-bold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />{" "}
                    Technical Specifications
                  </h3>
                  <div className="bg-muted rounded-xl p-4 prose max-w-none text-sm text-foreground whitespace-pre-wrap border border-border text-foreground">
                    {product.specifications}
                  </div>
                </div>
              )}

              {product.features && (
                <div>
                  <h3 className="text-md font-bold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" /> Key
                    Features
                  </h3>
                  <div className="bg-muted rounded-xl p-4 prose max-w-none text-sm text-foreground whitespace-pre-wrap border border-border text-foreground">
                    {product.features}
                  </div>
                </div>
              )}

              {product.packagingDetails && (
                <div>
                  <h3 className="text-md font-bold text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />{" "}
                    Packaging & Delivery
                  </h3>
                  <div className="bg-muted rounded-xl p-4 prose max-w-none text-sm text-foreground whitespace-pre-wrap border border-border text-foreground">
                    {product.packagingDetails}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="xl:col-span-4 flex flex-col gap-6"
            id="inquiry-form-section"
          >
            {/* Action Card: Price & Primary CTA */}
            <div className="bg-card rounded-[24px] shadow-md border border-[#00B074]/10 p-6 xl:sticky xl:top-24">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#00B074] mb-2">
                    Wholesale Price
                  </p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      {product.price}
                    </span>
                    <span className="text-base text-muted-foreground font-medium pb-1 relative top-[-4px]">
                      /{product.unit}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={toggleSave}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isSaved ? "bg-rose-50" : "bg-muted hover:bg-muted/80",
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isSaved
                          ? "fill-rose-500 text-rose-500"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="bg-muted rounded-[12px] p-4 flex flex-col gap-3 border border-border text-foreground mb-6">
                {product.pricingTiers?.length > 0 ? (
                  product.pricingTiers.map((tier: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">
                        Tier {i + 1} ({tier.min_qty}+ {product.unit})
                      </span>
                      <span className="font-bold text-foreground">
                        {tier.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Tier 1 (100 - 499 {product.unit})
                      </span>
                      <span className="font-bold text-foreground">
                        {product.price}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Tier 2 (500 - 999 {product.unit})
                      </span>
                      <span className="font-bold text-[#00B074]">
                        Contact Default Data
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Tier 3 (1000+ {product.unit})
                      </span>
                      <span className="font-bold text-[#00B074]">
                        Contact Default Data
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Inquiry Form */}
              <div>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#00B074]" /> Send Inquiry
                </h3>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <Input
                      id="quantity"
                      {...register("quantity")}
                      placeholder={`Target Quantity (Min. ${product.moq})`}
                      className={cn(
                        "h-12 rounded-[12px] border-border bg-background placeholder:text-muted-foreground focus-visible:ring-[#00B074] focus-visible:border-transparent pr-16 bg-card",
                        errors.quantity &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {product.unit}
                      </span>
                    </div>
                  </div>

                  <Textarea
                    id="message"
                    {...register("message")}
                    placeholder="Describe your requirements (e.g. customization, delivery date, shipping destination)..."
                    rows={4}
                    className={cn(
                      "resize-none rounded-[12px] border-border bg-card placeholder:text-muted-foreground focus-visible:ring-[#00B074] focus-visible:border-transparent",
                      errors.message && "border-red-500",
                    )}
                  />
                  {(errors.quantity || errors.message) && (
                    <p className="text-[11px] text-red-500">
                      Please complete all fields correctly.
                    </p>
                  )}

                  {/* Hidden fields filled by state if user is logged in, else mock for demo */}
                  <input
                    type="hidden"
                    {...register("name")}
                    value={
                      getValues("name") ||
                      user?.user_metadata?.full_name ||
                      "Guest"
                    }
                  />
                  <input
                    type="hidden"
                    {...register("email")}
                    value={
                      getValues("email") || user?.email || "guest@example.com"
                    }
                  />
                  <input
                    type="hidden"
                    {...register("company")}
                    value={getValues("company") || "Guest Company"}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-[#00B074] hover:bg-[#009260] text-white h-[52px] text-base font-bold rounded-[12px] shadow-lg shadow-[#00B074]/20 mt-2 transition-all group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Sending Request..."
                      : "Request Detailed Quote"}
                    {!isSubmitting && (
                      <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Premium Supplier Card */}
            <div className="bg-card rounded-[24px] shadow-sm border border-border text-foreground overflow-hidden">
              {/* Banner */}
              <div
                className={cn(
                  "h-16 w-full",
                  product.isVerified
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
                    : "bg-card",
                )}
              />

              <div className="p-6 relative">
                {/* Avatar */}
                <div className="absolute -top-8 left-6">
                  <div className="w-16 h-16 rounded-[12px] bg-card border border-border shadow-md flex items-center justify-center text-2xl font-black text-foreground">
                    {product.supplier.charAt(0)}
                  </div>
                </div>

                <div className="pt-10">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-foreground leading-tight">
                      {product.supplier}
                    </h3>
                    {product.isVerified && <VerifiedBadge showText={false} country={product.country} className="shrink-0 px-1 py-1" iconClassName="w-4 h-4 ml-[2px] mr-[2px]" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
                    <Globe2 className="h-4 w-4" /> {product.location}
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6">
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">
                        Time Verified
                      </div>
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#00B074]" />{" "}
                        {product.supplierInfo.yearsInBusiness}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">
                        Company Type
                      </div>
                      <div
                        className="font-bold text-foreground flex items-center gap-1 max-w-[120px] truncate"
                        title={product.supplierInfo.type}
                      >
                        <Factory className="h-3.5 w-3.5 text-[#00B074]" />{" "}
                        {product.supplierInfo.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">
                        Response Rate
                      </div>
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-[#00B074]" />{" "}
                        {product.supplierInfo.responseRate}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-[10px] border-border text-[#00B074] hover:bg-[#00B074]/10 border-[#00B074]/20 font-semibold"
                      render={<Link to={`/suppliers/${product.seller_id}`} />}
                    >
                      Visit Store ({product.supplierInfo.productCount} Items)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-11 h-11 p-0 rounded-[10px] border-border text-muted-foreground text-foreground/80 hover:text-[#00B074] hover:border-[#00B074]"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Realtime Supplier Info */}
            <div className="bg-card rounded-[24px] shadow-sm border border-border text-foreground p-6 text-sm">
              <h4 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#00B074]" /> Supplier
                Information
              </h4>
              <ul className="space-y-4 text-muted-foreground text-foreground/80">
                <li className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span>Verification Status</span>
                  {product.isVerified ? (
                    <VerifiedBadge country={product.country} />
                  ) : (
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Unverified
                    </span>
                  )}
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span>Avg Response Time</span>
                  <span className="font-medium text-foreground">
                    {product.supplierInfo.responseTime}
                  </span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span>Products Listed</span>
                  <span className="font-medium text-foreground">
                    {product.supplierInfo.productCount} Items
                  </span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span>Last Active</span>
                  <span className="font-medium text-[#00B074] flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B074] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B074]"></span>
                    </span>
                    {product.supplierInfo.lastActive}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Member Since</span>
                  <span className="font-medium text-foreground">
                    {product.supplierInfo.established}
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background/80 backdrop-blur-xl z-50 xl:hidden flex gap-3 pb-safe shadow-lg">
        <Button
          variant="outline"
          onClick={() => {}}
          className="h-[52px] w-[52px] shrink-0 rounded-[12px] border-border bg-card hover:bg-muted flex items-center justify-center flex-col gap-0.5 text-muted-foreground"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          onClick={scrollToInquiry}
          className="flex-1 h-[52px] rounded-[12px] bg-[#00B074] hover:bg-[#009260] text-white shadow-lg shadow-[#00B074]/20 font-bold text-base"
        >
          Send Inquiry
        </Button>
        <Button
          onClick={() => setIsRFQModalOpen(true)}
          className="flex-1 h-[52px] rounded-[12px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-bold text-base"
        >
          Request Quote
        </Button>
      </div>

      <CreateRFQModal
        isOpen={isRFQModalOpen}
        onClose={() => setIsRFQModalOpen(false)}
        productId={product?.id}
        categoryId={product?.category_id}
        initialTitle={product?.title}
      />
    </div>
  );
}
