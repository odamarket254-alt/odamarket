import React, { useState, useRef, MouseEvent } from "react";
import { motion, useAnimation, PanInfo } from "motion/react";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Bookmark, MessageCircle, MapPin, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";

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
  };
}

export const SwipeableProductCard: React.FC<{ product: MarketplaceProduct }> = ({ product }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const controls = useAnimation();
  const isDragging = useRef(false);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Swiped right - Favorite
      toast.success("Product added to favorites!");
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      // Swiped left - Contact
      if (!user || !profile) {
        toast.error("Authentication required", {
          description: "You must be signed in to send inquiries."
        });
      } else {
        toast.success("Opening chat with supplier...");
        navigate(`/${profile.role}/dashboard/inquiries?seller=${product.seller_id}`);
      }
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
    
    // reset dragging state slightly after to prevent click firing
    setTimeout(() => {
      isDragging.current = false;
    }, 10);
  };


  const handleClick = (e: MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      return;
    }
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="relative overflow-hidden rounded-xl h-full flex flex-col group">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-8 bg-zinc-800 rounded-xl">
         <div className="flex flex-col items-center justify-center text-amber-600 dark:text-amber-500">
            <Bookmark className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Save</span>
         </div>
         <div className="flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-500">
            <MessageCircle className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Contact</span>
         </div>
      </div>

      {/* Draggable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleClick}
        className="relative z-10 w-full h-full cursor-pointer flex flex-col"
        whileDrag={{ cursor: "grabbing" }}
      >
        <Card className="overflow-hidden h-full border-border bg-card text-card-foreground hover:border-primary/30 shadow-sm transition-all duration-300 flex flex-col w-full">
          <div className="aspect-[4/3] overflow-hidden relative bg-muted flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent navigation
                toast.success("Product added to favorites!");
              }}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/60 backdrop-blur-md hover:bg-background/90 text-muted-foreground hover:text-red-500 transition-colors border border-border/50"
              aria-label="Save product"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <img
              src={
                product.image_url ||
                "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60"
              }
              alt={product.name}
              loading="lazy"
              draggable={false}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
          <CardContent className="p-4 flex flex-col flex-1 pointer-events-none">
            <div className="mb-2 flex items-start justify-between gap-1">
              <div className="flex bg-transparent flex-row items-center space-x-1 flex-1">
                <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2 transition-colors">
                  {product.name}
                </h3>
                  {product.profiles?.verified && (
                    <VerifiedBadge showText={false} className="shrink-0 px-1 py-1" iconClassName="w-4 h-4 ml-[2px] mr-[2px]" />
                  )}
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 md:text-[10px] uppercase font-bold shrink-0 mt-0.5 pointer-events-auto truncate max-w-[120px]">
                 {product.categories?.name || product.category}
              </Badge>
            </div>
            <div className="mt-1">
               <p className="text-primary font-bold text-lg">
                {product.price ? product.price : "Price on Request"}
               </p>
            </div>
            
            <div className="mt-auto space-y-2 pt-3 border-t border-border/50 pointer-events-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate max-w-[70%] text-muted-foreground">
                  {product.profiles?.business_name || `Supplier ${product.seller_id?.slice(0, 5)}`}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[60px]">{product.profiles?.location || "Global"}</span>
                </span>
              </div>
              
              <div className="text-[10px] text-muted-foreground text-center mt-2 opacity-60">
                <span className="hidden sm:inline">Swipe horizontally for quick actions</span>
                <span className="sm:hidden">Swipe for quick actions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
