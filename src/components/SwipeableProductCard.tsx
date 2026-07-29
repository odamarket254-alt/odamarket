import { OptimizedImage } from "../components/ui/OptimizedImage";
import React, { MouseEvent } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";

import { VerifiedBadge } from "./ui/VerifiedBadge";

export interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  categories?: { name: string, slug: string };
  image_url?: string;
  stock?: string;
  seller_id?: string;
  created_at?: string;
  profiles?: {
    business_name: string;
    verified: boolean;
    location: string;
    country?: string;
  };
}

export const SwipeableProductCard = React.memo(({ product }: { product: MarketplaceProduct }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  const handleClick = (e: MouseEvent) => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price?.toString() || "Ksh 0",
      image_url: product.image_url || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=80",
      seller_id: product.seller_id
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl h-full flex flex-col group border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
        {Math.random() > 0.5 && (
          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
            -{Math.floor(Math.random() * 20 + 5)}%
          </span>
        )}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.success("Product added to wishlist!");
        }}
        className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground hover:text-destructive transition-colors border border-border shadow-sm"
        aria-label="Save product"
      >
        <Bookmark className="w-4 h-4" />
      </button>

      <div
        onClick={handleClick}
        className="relative z-10 w-full h-full cursor-pointer flex flex-col"
      >
        <div className="aspect-[4/3] overflow-hidden relative bg-[#FFFDF8] flex items-center justify-center p-6 flex-shrink-0">
          <OptimizedImage             src={
              product.image_url
                ? (product.image_url.includes('unsplash.com') ? `${product.image_url}&auto=format&fit=crop&w=500&q=80` : product.image_url)
                : "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=80"
            }
            alt={product.name}
            loading="lazy"
            draggable={false}
            imgClassName="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" className="w-full h-full flex items-center justify-center bg-transparent"
          />
        </div>
        
        <CardContent className="p-5 flex flex-col flex-1 border-t border-border/40 bg-background pointer-events-none">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              {product.categories?.name || product.category || "Grocery"}
            </span>
          </div>
          
          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 transition-colors group-hover:text-primary mb-4">
            {product.name}
          </h3>
          
          <div className="mt-auto flex flex-col gap-3 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-xl font-black text-primary tracking-tight">
                {product.price ? product.price : "Price on Request"}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {product.price ? `Ksh ${(parseFloat(product.price.toString().replace(/[^0-9.]/g, '')) * 1.2).toLocaleString()}` : ''}
              </span>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              Add to Cart
            </button>
          </div>
        </CardContent>
      </div>
    </div>
  );
});

SwipeableProductCard.displayName = "SwipeableProductCard";
