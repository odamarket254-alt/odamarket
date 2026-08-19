const fs = require('fs');

const file = 'src/components/products/ProductCard.tsx';
let content = `import { useState } from "react";
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
  const sizeMatch = product.name?.match(/(\\d+(?:\\.\\d+)?\\s*(?:g|kg|ml|l|oz|lb|pcs|pack))/i);
  const variantText = sizeMatch ? sizeMatch[1] : (product.unit || "1 pc");

  const isList = viewMode === "list";

  return (
    <div
      className={cn(
        "group flex bg-transparent w-full mx-auto",
        isList ? "flex-row h-[160px] max-w-full" : "flex-col max-w-[176px]"
      )}
    >
      {/* Image Area Container (approx 158px width inside 176px card) */}
      <div className={cn("w-full", isList ? "w-[140px] shrink-0" : "px-[9px] pt-[8px]")}>
        <div className={cn(
          "relative bg-white border border-[#E5E7EB] rounded-[11px] flex items-center justify-center shrink-0 overflow-visible",
          isList ? "w-full h-full p-2" : "w-full aspect-[158/151] p-[8px]"
        )}>
          <Link to={\`/products/\${product.id}\`} className="block w-full h-full relative z-0">
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
              className="absolute bottom-[5px] right-[5px] w-[30px] h-[30px] rounded-full bg-blue-600 text-white flex items-center justify-center border-[1.5px] border-white shadow-sm hover:scale-105 active:scale-95 transition-transform z-10"
              aria-label="Add to cart"
            >
              <Plus className="w-[18px] h-[18px] stroke-[2.5px]" />
            </button>
          )}
        </div>
      </div>

      {/* Info Area */}
      <div className={cn("flex flex-col text-left", isList ? "p-3 flex-1" : "px-[9px] pt-[9px] pb-[8px]")}>
        <Link to={\`/products/\${product.id}\`} className="block">
          <h3 className="text-[#111827] text-[15px] font-medium leading-[18px] line-clamp-2 hover:text-[#C65A28] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-[13px] text-[#4B5563] mt-[5px]">
          {variantText}
        </p>
        
        <div className="flex flex-col items-start mt-[5px]">
          <div className="flex items-baseline">
            <span className="text-[22px] font-extrabold text-black leading-[1]">
              {Number(whole).toLocaleString('en-US')}
            </span>
            <span className="text-[16px] font-bold text-black leading-[1]">
              .{fraction}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#6B7280] leading-[1] mt-[2px]">
            KES
          </span>
        </div>
        
        {isList && (
          <button 
            onClick={handleAdd} 
            className="mt-auto self-end w-[32px] h-[32px] rounded-full bg-blue-600 text-white flex items-center justify-center border-[1.5px] border-white shadow-sm hover:scale-105 active:scale-95 transition-transform"
            aria-label="Add to cart"
          >
            <Plus className="w-[18px] h-[18px] stroke-[2.5px]" />
          </button>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync(file, content);
console.log('Successfully updated ProductCard.tsx');
