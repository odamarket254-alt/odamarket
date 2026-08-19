import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Plus } from "lucide-react";
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
    }, product.wholesale_min_qty || 1);

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
  
  const categoryName = product.category?.name || product.categories?.name || "Uncategorized";
  // Attempt to extract a weight/size from the product name (e.g. 500g, 1kg) or default to empty
  const sizeMatch = product.name?.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|pcs|pack))/i);
  const variantText = sizeMatch ? sizeMatch[1] : (product.unit || "1 pc");

  const isList = viewMode === "list";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white border border-[#F2EDE4] rounded-[14px] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(149,139,125,0.08)] hover:border-[#E8DCC9] flex",
        isList ? "flex-row h-[160px]" : "flex-col h-full"
      )}
    >
      {/* Image Area */}
      <div className={cn(
        "relative bg-white flex items-center justify-center p-4 z-0 shrink-0",
        isList ? "w-[140px]" : "w-full h-[150px] sm:h-[180px]"
      )}>
        {/* Discount Badge */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="bg-[#B94A48] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wide leading-none">
            -20%
          </span>
        </div>
        
        {/* Wishlist Icon */}
        <button 
          onClick={handleWishlist} 
          className="absolute top-2.5 right-2.5 z-20 text-[#958B7D]/60 hover:text-[#B94A48] transition-colors"
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-[#B94A48] text-[#B94A48]")} />
        </button>

        <Link to={`/products/${product.id}`} className="block w-full h-full relative">
          <OptimizedImage 
            src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} 
            alt={product.name} 
            imgClassName="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
            className="w-full h-full" 
          />
        </Link>
      </div>

      {/* Info Area */}
      <div className={cn("flex flex-col flex-1 bg-white relative z-10", isList ? "p-3" : "px-3.5 pb-3.5 pt-3")}>
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-[11px] h-[11px] fill-[#D9A62E] text-[#D9A62E]" />
          <span className="text-[10px] font-semibold text-[#5F5A54] leading-none">{rating} <span className="text-[#958B7D] font-normal">({reviews})</span></span>
        </div>
        
        <Link to={`/products/${product.id}`} className="block mb-0.5 mt-0.5">
          <h3 className="font-semibold text-[#3A2418] text-[13px] leading-[1.3] line-clamp-2 group-hover:text-[#C65A28] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-[10px] font-medium text-[#958B7D] uppercase tracking-wider mb-2">
          {variantText}
        </p>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[#958B7D] line-through decoration-[#958B7D]/40 leading-none">
              KSh {oldPrice.toLocaleString('en-US', {minimumFractionDigits: 0})}
            </span>
            <span className="text-[15px] font-bold text-[#C65A28] leading-none">
              KSh {regularPrice.toLocaleString('en-US', {minimumFractionDigits: 0})}
            </span>
          </div>
          
          <button 
            onClick={handleAdd} 
            className="w-8 h-8 shrink-0 rounded-full bg-[#C65A28] text-white flex items-center justify-center hover:scale-105 hover:bg-[#B94A48] transition-all shadow-[0_4px_12px_rgba(198,90,40,0.15)]"
            aria-label="Add to cart"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
