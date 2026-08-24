import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { OptimizedImage } from "../ui/OptimizedImage";

export const ProductCard = ({ product, index, viewMode = "grid" }: { product: any; index?: number; viewMode?: "grid" | "list" }) => {
  const addItem = useCartStore((state) => state.addItem);

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

  const regularPrice = Number(product.regular_price || product.price || 0);
  const [whole, fraction] = regularPrice.toFixed(2).split('.');
  
  // Attempt to extract a weight/size from the product name (e.g. 500g, 1kg) or default to empty
  const sizeMatch = product.name?.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|pcs|pack))/i);
  const variantText = sizeMatch ? sizeMatch[1] : (product.unit || "1 pc");

  const isList = viewMode === "list";

  return (
    <div
      className={cn(
        "group flex bg-transparent w-full h-full",
        isList ? "flex-row h-[160px]" : "flex-col"
      )}
    >
      {/* Image Area Container */}
      <div className={cn("w-full shrink-0", isList ? "w-[140px]" : "mb-2")}>
        <div className={cn(
          "relative bg-[#FDFBF7] border border-[#EBE4D8] rounded-2xl shadow-[0_2px_10px_rgba(95,90,84,0.04)] flex items-center justify-center overflow-visible transition-colors duration-300 group-hover:bg-white group-hover:border-[#E1D7C6]",
          isList ? "w-full h-full p-2" : "w-full aspect-square p-2 md:p-3"
        )}>
          <Link to={`/products/${product.id}`} className="block w-full h-full relative z-0">
            <OptimizedImage 
              src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} 
              alt={product.name} 
              imgClassName="w-full h-full object-contain mix-blend-multiply" 
              className="w-full h-full" 
            />
          </Link>
          
          {/* Circular Add Button */}
          {!isList && (
            <button 
              onClick={handleAdd} 
              className="absolute bottom-2 right-2 w-[30px] h-[30px] rounded-full bg-[#C65A28] text-white flex items-center justify-center border-[1.5px] border-[#FDFBF7] group-hover:border-white shadow-[0_2px_8px_rgba(198,90,40,0.25)] hover:scale-105 active:scale-95 transition-all z-10"
              aria-label="Add to cart"
            >
              <Plus className="w-[18px] h-[18px] stroke-[2.5px]" />
            </button>
          )}
        </div>
      </div>

      {/* Info Area */}
      <div className={cn("flex flex-col text-left flex-1", isList ? "p-3" : "py-1")}>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-[#111827] text-sm md:text-[15px] font-semibold leading-tight line-clamp-2 hover:text-[#C65A28] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xs text-[#6B7280] mt-1">
          {variantText}
        </p>
        
        <div className="flex items-baseline gap-1 mt-auto pt-2">
          <span className="text-[11px] md:text-xs font-bold text-[#C65A28]">KES</span>
          <div className="flex items-baseline">
            <span className="text-lg md:text-xl font-extrabold text-black tracking-tight">
              {Number(whole).toLocaleString('en-US')}
            </span>
            <span className="text-xs md:text-sm font-bold text-black">
              .{fraction}
            </span>
          </div>
        </div>
        
        {isList && (
          <button 
            onClick={handleAdd} 
            className="mt-auto self-end w-[32px] h-[32px] rounded-full bg-[#C65A28] text-white flex items-center justify-center border-[1.5px] border-white shadow-sm hover:scale-105 active:scale-95 transition-transform"
            aria-label="Add to cart"
          >
            <Plus className="w-[18px] h-[18px] stroke-[2.5px]" />
          </button>
        )}
      </div>
    </div>
  );
};
