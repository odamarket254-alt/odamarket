import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, ArrowRight, Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'sonner';

export const WholesaleSection = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWholesaleProducts = async () => {
    try {
      if (products.length === 0) setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, brands (name), category:categories!left(name)')
        .eq('is_wholesale', true)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching wholesale products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWholesaleProducts();
    const channel = supabase.channel("wholesale_changes_" + Math.random().toString(36).substring(7)).on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchWholesaleProducts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (isLoading || products.length === 0) {
    return null; // Don't show anything if loading or no wholesale products
  }

  return (
    <div className="w-full bg-[#FAF5EC] py-10 md:py-14 text-[#3A2418]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[#3A2418]">
              Wholesale Products
            </h2>
            <p className="text-[#5F5A54] mt-1.5 text-sm md:text-base">Buy in bulk and save more everyday</p>
          </div>
          <Link
            to="/products?is_wholesale=true"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#C65A28] hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {/* Horizontal Carousel (All Devices) */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map(product => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[calc(50vw-22px)] sm:w-[260px] lg:w-[280px]"
            >
              <WholesaleProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Mobile View All Link */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            to="/products?is_wholesale=true"
            className="flex items-center justify-center gap-2 w-full max-w-[200px] py-2.5 px-4 border border-[#C65A28] text-[#C65A28] rounded-full text-sm font-medium hover:bg-[#C65A28] hover:text-white transition-colors"
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const WholesaleProductCard = ({ product }: { product: any }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAdd = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.wholesale_price || product.price || 0,
      image_url: product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      seller_id: product.seller_id,
    }, product.wholesale_min_qty || 1);
    toast.success("Added bulk to cart");
  };

  const handleWishlist = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const retailPrice = Number(product.price || product.regular_price || 0);
  const wholesalePrice = Number(product.wholesale_price || retailPrice);
  const rating = product.rating || (Math.random() * (5 - 3.5) + 3.5).toFixed(1);
  const reviews = product.reviews_count || Math.floor(Math.random() * 200) + 10;
  const categoryName = product.category?.name || product.categories?.name || "Uncategorized";

  return (
    <div 
      className="group relative bg-[#FFFDF8] border border-[#E8DCC9] rounded-[20px] sm:rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-3 left-3 z-20">
        <span className="bg-[#B94A48] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider uppercase">
          Wholesale
        </span>
      </div>

      <div className="relative bg-[#FAF5EC] overflow-hidden flex items-center justify-center p-4 sm:p-6 w-full aspect-[4/3]">
        <OptimizedImage 
          src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} 
          alt={product.name} 
          imgClassName="w-full h-full object-contain mix-blend-multiply transform group-hover:scale-110 transition-transform duration-500" 
          className="w-full h-full" 
        />
        
        <div className={cn(
          "absolute inset-0 bg-black/5 flex flex-col justify-center items-center gap-2 transition-all duration-300 z-10",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
           <div className={`flex gap-2 transform transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-4'}`}>
             <button
               onClick={handleWishlist}
               className="w-10 h-10 rounded-full bg-[#FFFDF8] flex items-center justify-center text-[#3A2418]/60 hover:text-[#B94A48] hover:bg-[#B94A48]/10 shadow-md transition-colors"
             >
               <Heart className={cn("w-4 h-4", isWishlisted && "fill-[#B94A48] text-[#B94A48]")} />
             </button>
             <button
               className="w-10 h-10 rounded-full bg-[#FFFDF8] flex items-center justify-center text-[#3A2418]/60 hover:text-[#C65A28] hover:bg-[#C65A28]/10 shadow-md transition-colors"
             >
               <Eye className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 relative bg-[#FFFDF8] z-20">
        <Link to={`/products/${product.id}`} className="block flex-1">
          <p className="text-[10px] sm:text-xs font-semibold text-[#3A2418]/40 uppercase tracking-wider mb-1 line-clamp-1">
            {categoryName}
          </p>
          <h3 className="font-semibold text-[#3A2418] text-sm sm:text-base leading-tight mb-2 group-hover:text-[#C65A28] transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-[#D9A62E]">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            </div>
            <span className="text-[10px] sm:text-xs text-[#3A2418]/60">({reviews})</span>
          </div>
          
          <div className="bg-[#FAF5EC] border border-[#E8DCC9] rounded p-2 mb-3">
             <div className="flex justify-between items-center text-[10px] sm:text-xs text-[#5F5A54]">
               <span>Min Qty: <strong className="text-[#3A2418]">{product.wholesale_min_qty || 1}</strong></span>
               <span>Unit: <strong className="text-[#3A2418]">{product.wholesale_unit || 'Item'}</strong></span>
             </div>
          </div>
        </Link>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E8DCC9]">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-[#3A2418]/40 line-through">Retail: KSh {retailPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            <span className="text-sm sm:text-lg font-bold text-[#B94A48] leading-none mt-0.5">KSh {wholesalePrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <button
            onClick={handleAdd}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#C65A28] to-[#D9A62E] text-white hover:shadow-lg hover:scale-110 flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(198,90,40,0.3)] shrink-0"
          >
            <ShoppingCart className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
