import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, ShoppingCart, Eye, ArrowRightLeft } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { OptimizedImage } from "../ui/OptimizedImage";

export const ProductCard = ({ product, index, viewMode = "grid" }: { product: any; index?: number; viewMode?: "grid" | "list" }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAdd = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.regular_price || product.price || 0,
      image_url: product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      seller_id: product.seller_id,
    });
    toast.success("Added to cart");
  };

  const handleWishlist = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const regularPrice = Number(product.regular_price || product.price || 0);
  const oldPrice = regularPrice * 1.2;
  const rating = product.rating || (Math.random() * (5 - 3.5) + 3.5).toFixed(1);
  const reviews = product.reviews_count || Math.floor(Math.random() * 200) + 10;
  
  const categoryName = product.product_type?.name || "Groceries";
  const stock = product.stock || product.stock || Math.floor(Math.random() * 50) + 1;
  const isList = viewMode === "list";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-[#FFFDF8] border border-[#E8DCC9] rounded-[20px] sm:rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent flex",
        isList ? "flex-row h-48" : "flex-col h-full"
      )}
    >
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-20">
        <span className="bg-[#C65A28] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
          -20%
        </span>
      </div>

      {/* Image Container */}
      <div className={cn("relative bg-[#FAF5EC] overflow-hidden flex items-center justify-center p-4 sm:p-6", isList ? "w-48 shrink-0" : "w-full aspect-[4/3]")}>
        <OptimizedImage src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} alt={product.name} imgClassName="w-full h-full object-contain mix-blend-multiply transform group-hover:scale-110 transition-transform duration-500" className="w-full h-full" />

        {/* Action Buttons Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/5 flex flex-col justify-center items-center gap-2 transition-all duration-300 z-10",
            isList ? "opacity-0" : isHovered ? "opacity-100" : "opacity-0"
          )}
        >
           <div className={`flex gap-2 transform transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-4'}`}>
             <button
               onClick={handleWishlist}
               className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF8] flex items-center justify-center text-[#3A2418]/60 hover:text-[#B94A48] hover:bg-[#B94A48]/10 shadow-md transition-colors"
             >
               <Heart className={cn("w-5 h-5", isWishlisted && "fill-[#B94A48] text-[#B94A48]")} />
             </button>
             <button
               className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF8] flex items-center justify-center text-[#3A2418]/60 hover:text-[#C65A28] hover:bg-[#C65A28]/10 shadow-md transition-colors"
             >
               <Eye className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 relative bg-[#FFFDF8] z-20">
        <Link to={`/products/${product.id}`} className="block flex-1">
          <p className="text-xs font-semibold text-[#3A2418]/40 uppercase tracking-wider mb-1">
            {categoryName}
          </p>
          <h3 className="font-semibold text-[#3A2418] text-sm sm:text-base leading-tight mb-2 group-hover:text-[#C65A28] transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-[#D9A62E]">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs text-[#3A2418]/60">({reviews})</span>
          </div>
          
          {/* Stock Indicator */}
          <div className="mb-3">
             <div className="flex items-center gap-1.5">
               <div className={cn("w-2 h-2 rounded-full", stock > 10 ? "bg-green-500" : "bg-[#D9A62E]")}></div>
               <span className="text-xs text-[#3A2418]/60 font-medium">{stock > 10 ? 'In Stock' : `Only ${stock} left`}</span>
             </div>
          </div>
        </Link>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E8DCC9]">
          <div className="flex flex-col">
            <span className="text-xs text-[#3A2418]/40 line-through">KSh {oldPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            <span className="text-base sm:text-lg lg:text-xl font-bold text-[#C65A28] leading-none">KSh {regularPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <button
            onClick={handleAdd}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#C65A28] to-[#D9A62E] text-white hover:shadow-lg hover:scale-110 flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(198,90,40,0.3)]"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
