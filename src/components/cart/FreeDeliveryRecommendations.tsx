import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { OptimizedImage } from "../ui/OptimizedImage";
import { useCartStore } from "../../store/useCartStore";
import { getFreeDeliveryRecommendations } from "../../lib/api/products";
import { supabase } from "../../lib/supabase";
import { Product } from "../../types/product";

interface FreeDeliveryRecommendationsProps {
  cartItemIds?: string[];
  awayFromFreeDelivery?: number;
}

export function FreeDeliveryRecommendations({ 
  cartItemIds = [], 
  awayFromFreeDelivery = 0 
}: FreeDeliveryRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  // Keep a stable ref of cartItemIds to avoid continuous refetches on every cart quantity change
  const cartIdsRef = useRef(cartItemIds);
  cartIdsRef.current = cartItemIds;

  const loadRecommendations = useCallback(async () => {
    try {
      setError(null);
      const data = await getFreeDeliveryRecommendations(cartIdsRef.current, 12);
      setProducts(data);
    } catch (err: any) {
      console.error("[FreeDeliveryRecommendations] Failed to fetch products:", err);
      setError("Unable to load recommended products right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();

    // Subscribe to realtime database changes so any added, updated, or removed products reflect immediately
    const channel = supabase
      .channel('public:products_recommendations_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadRecommendations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRecommendations]);

  const handleAddToCart = (product: Product) => {
    const effectivePrice = product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;
    addItem({
      id: product.id,
      name: product.name,
      price: `Ksh ${effectivePrice}`,
      image_url: product.image_url || "",
      seller_id: product.seller_id || undefined,
    }, 1);
    toast.success(`${product.name} added to cart`);
  };

  const getProductWeight = (product: Product) => {
    const sizeMatch = product.name?.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|pcs|pack|lrts|gm))/i);
    if (sizeMatch) return sizeMatch[1];
    if (product.wholesale_unit) return product.wholesale_unit;
    if (product.unit) return product.unit;
    if (product.weight) return `${product.weight}g`;
    return "";
  };

  return (
    <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[slate-900] font-bold text-[16px]">
          Add any of these items to unlock FREE Delivery
        </h3>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-[#C65A28]" />
        )}
      </div>

      {loading && products.length === 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin">
          {[1, 2, 3, 4].map((n) => (
            <div 
              key={n} 
              className="min-w-[180px] max-w-[200px] border border-[#E5E7EB] rounded-[16px] p-4 flex flex-col snap-start animate-pulse"
            >
              <div className="aspect-square bg-[#F1F5F9] rounded-[12px] mb-4" />
              <div className="h-4 bg-[#F1F5F9] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#F1F5F9] rounded w-1/2 mb-4" />
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="h-5 bg-[#F1F5F9] rounded w-16" />
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-[13px] text-[#6B7280] mb-3">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadRecommendations();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C65A28] border border-[#C65A28]/30 rounded-lg hover:bg-[#C65A28]/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center text-[#6B7280] text-[14px]">
          No products available right now.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {products.map((product) => {
            const effectivePrice = product.sale_price && product.sale_price > 0 ? product.sale_price : product.price;
            const weightText = getProductWeight(product);

            return (
              <div 
                key={product.id} 
                className="min-w-[180px] max-w-[200px] border border-[#E5E7EB] rounded-[16px] p-4 flex flex-col snap-start group hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white"
              >
                <Link to={`/products/${product.id}`} className="block">
                  <div className="aspect-square bg-[#F8FAFC] rounded-[12px] mb-4 overflow-hidden flex items-center justify-center p-2 relative">
                    <OptimizedImage 
                      src={product.image_url || undefined} 
                      alt={product.name} 
                      imgClassName="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                      className="w-full h-full" 
                      imageType="product"
                    />
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 rounded">
                        Only {product.stock} left
                      </span>
                    )}
                  </div>
                  <h4 className="text-[slate-900] font-semibold text-[14px] line-clamp-1 hover:text-[#C65A28] transition-colors">
                    {product.name}
                  </h4>
                </Link>

                {weightText ? (
                  <p className="text-[#6B7280] text-[12px] mb-3 mt-0.5">{weightText}</p>
                ) : (
                  <div className="h-4 mb-3" />
                )}

                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="text-[slate-900] font-bold text-[15px]">
                    Ksh {Number(effectivePrice).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[slate-900] flex items-center justify-center hover:bg-[slate-900] hover:text-white transition-colors"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
