import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useCartStore } from "../store/useCartStore";
import { toast } from "sonner";
import { Button } from "../components/ui/Button";
import { Minus, Plus, ShoppingCart, Star, Shield, Truck, RotateCcw, Heart, Share2 } from "lucide-react";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select('*, profiles(business_name, verified), category:categories(name), brand:brands(name)').limit(100)
        .eq("id", id)
        .single();
      
      setProduct(data);
      setLoading(false);
    };
    
    if (id) {
      fetchProduct();
      

      
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.regular_price || "Ksh 0",
        image_url: product.image_url,
        seller_id: product.seller_id
      });
    }
    toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
  };

  if (loading) return <div className="min-h-screen bg-background pt-32 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen bg-background pt-32 flex items-center justify-center"><h1 className="text-2xl font-bold">Product not found</h1></div>;

  
  return (
    <div className="w-full bg-[#FAF5EC] font-poppins text-[#3A2418] pt-20 md:pt-28 pb-16 md:pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#5F5A54] mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-[#C65A28] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#C65A28] transition-colors">Products</Link>
          <span>/</span>
          <span className="text-[#3A2418] truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 bg-[#FFFDF8] rounded-3xl p-4 sm:p-8 lg:p-12 shadow-sm">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] lg:rounded-[40px] bg-[#FAF5EC] p-6 sm:p-8 lg:p-16 flex items-center justify-center aspect-square relative"
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 flex flex-col gap-2 sm:gap-4 z-10">
              <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FFFDF8] shadow-sm hover:bg-[#E8DCC9] hover:text-[#B94A48] transition-colors">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FFFDF8] shadow-sm hover:bg-[#E8DCC9] hover:text-[#C65A28] transition-colors">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <OptimizedImage src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"} alt={product.name} imgClassName="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" className="w-full h-full" />
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-6 sm:mb-8">
              <div className="text-[#C65A28] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 sm:mb-4">
                {product.product_type?.name || "Premium Category"}
              </div>
              <h1 className="text-[clamp(28px,4vw,48px)] font-bold text-[#3A2418] mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-[#D9A62E]" />)}
                </div>
                <span className="text-[#5F5A54] font-medium text-xs sm:text-sm">(128 Reviews)</span>
              </div>
              
              <div className="flex items-end gap-3 sm:gap-4 mb-6 sm:mb-8">
                <span className="text-[clamp(32px,5vw,48px)] font-bold text-[#C65A28] leading-none">
                  Ksh {product.regular_price ? product.regular_price.toString().replace(/\D/g, '') : "0"}
                </span>
                <span className="text-base sm:text-xl text-[#8B857D] line-through mb-1 sm:mb-2">
                  Ksh {(parseInt(String(product.regular_price).replace(/\D/g, '')) * 1.2) || 500}
                </span>
              </div>
              
              <p className="text-sm sm:text-base lg:text-lg text-[#5F5A54] leading-relaxed">
                {product.description || "Experience the finest quality with our carefully curated selection. Designed for those who appreciate the extraordinary in their everyday life."}
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="font-bold text-[#3A2418] text-sm sm:text-base">Quantity</div>
                <div className="flex items-center gap-4 bg-[#FAF5EC] rounded-full p-1 sm:p-2 border border-[#E8DCC9] w-fit">
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:bg-[#E8DCC9]" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <span className="w-8 sm:w-12 text-center font-bold text-lg">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:bg-[#E8DCC9]" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full h-14 sm:h-16 rounded-full bg-[#C65A28] hover:bg-[#C65A28] text-white font-bold text-base sm:text-xl transition-all shadow-lg shadow-[#C65A28]/30 hover:-translate-y-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-3 h-5 w-5 sm:h-6 sm:w-6" /> Add to Cart
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-6 sm:pt-8 border-t border-[#E8DCC9]">
               <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                 <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#C65A28]/10 flex items-center justify-center text-[#C65A28]">
                   <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
                 </div>
                 <span className="font-semibold text-xs sm:text-sm text-[#5F5A54] leading-tight">Next Day<br className="sm:hidden" /> Delivery</span>
               </div>
               <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                 <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#C65A28]/10 flex items-center justify-center text-[#C65A28]">
                   <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                 </div>
                 <span className="font-semibold text-xs sm:text-sm text-[#5F5A54] leading-tight">Premium<br className="sm:hidden" /> Quality</span>
               </div>
               <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                 <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#C65A28]/10 flex items-center justify-center text-[#C65A28]">
                   <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
                 </div>
                 <span className="font-semibold text-xs sm:text-sm text-[#5F5A54] leading-tight">Easy<br className="sm:hidden" /> Returns</span>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

