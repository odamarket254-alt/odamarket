import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Search, Grid, List, Trash2, Eye, Minus, Plus, ShoppingCart, Info, Loader2 } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";

export default function WishlistPage() {
  const { user } = useAuthStore();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchWishlist();

    }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id, product_id, products(*)').limit(100)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlist(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success("Removed from wishlist");
      // UI updates optimistically via real-time!
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: String(product.regular_price),
      image_url: product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      seller_id: product.seller_id
    });
    toast.success("Added to cart");
  };

  const handleAddAllAvailable = () => {
    let added = 0;
    wishlist.forEach((item) => {
      if (item.products.stock > 0) {
        handleAddToCart(item.products);
        added++;
      }
    });
    if (added > 0) toast.success(`Added ${added} items to cart`);
  };

  const availableItems = wishlist.filter(item => item.products.stock > 0).length;
  const unavailableItems = wishlist.filter(item => item.products.stock === 0).length;
  const estimatedValue = wishlist.reduce((acc, item) => acc + (item.products.price || 0), 0);
  const totalSavings = wishlist.reduce((acc, item) => acc + ((item.products.compare_at_price || item.products.price) - item.products.price), 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#22C55E]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] py-12 px-4 flex flex-col items-center justify-center">
        <Heart className="w-16 h-16 text-[#94A3B8] mb-6" />
        <h1 className="text-[32px] font-bold text-[#0B2346] mb-4">Your Wishlist is Empty</h1>
        <p className="text-[#6B7280] text-[16px] mb-8">Please login to view and manage your wishlist.</p>
        <Link to="/login" className="px-8 h-[48px] bg-[#22C55E] text-white rounded-[12px] font-bold text-[15px] flex items-center justify-center shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-[#0B2346] mb-3">My Wishlist</h1>
          <p className="text-[#6B7280] text-[16px]">Keep track of the fresh produce you want to buy later.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-12">
            <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E5E7EB] p-8">
              {wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-[#94A3B8] mx-auto mb-6" />
                  <h3 className="text-[20px] font-bold text-[#0B2346] mb-2">No items saved yet</h3>
                  <p className="text-[#6B7280] mb-6">Start exploring fresh produce and save your favorites.</p>
                  <Link to="/products" className="inline-flex h-[44px] items-center justify-center px-6 bg-[#22C55E] text-white rounded-[12px] font-bold">
                    Explore Market
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishlist.map((item) => (
                    <div key={item.id} className="group relative bg-[#F8FAFC] rounded-[16px] border border-[#E5E7EB] overflow-hidden flex shadow-sm hover:shadow-md transition-all">
                      <div className="w-[140px] shrink-0 relative bg-white border-r border-[#E5E7EB]">
                        <OptimizedImage 
                          src={item.products.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'} 
                          alt={item.products.name} 
                          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" className="w-full h-full flex items-center justify-center bg-transparent" 
                        />
                        {item.products.compare_at_price > item.products.price && (
                          <span className="absolute top-2 left-2 bg-[#EF4444] text-white text-[11px] font-bold px-2 py-1 rounded-[6px]">
                            SALE
                          </span>
                        )}
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-1">
                            <h3 className="text-[#0B2346] font-bold text-[16px] line-clamp-1 group-hover:text-[#22C55E] transition-colors">
                              {item.products.name}
                            </h3>
                            <button 
                              onClick={() => removeFromWishlist(item.id)}
                              className="text-[#94A3B8] hover:text-[#EF4444] p-1.5 -mr-1.5 rounded-full hover:bg-[#EF4444]/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[#0B2346] font-black text-[18px]">{formatCurrency(item.products.price)}</span>
                            {item.products.compare_at_price > item.products.price && (
                              <span className="text-[#94A3B8] text-[14px] line-through">{formatCurrency(item.products.compare_at_price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-[6px] ${item.products.stock > 0 ? 'bg-[#22C55E]/10 text-[#16A34A]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                            {item.products.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <button 
                            onClick={() => handleAddToCart(item.products)}
                            disabled={item.products.stock === 0}
                            className="h-[36px] px-4 bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-[#94A3B8] text-white rounded-[8px] font-bold text-[13px] flex items-center gap-2 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[30%] shrink-0">
            <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E5E7EB] p-8 sticky top-[120px]">
              <h2 className="text-[#0B2346] font-bold text-[22px] mb-6">Shopping Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#6B7280]">Saved Items</span>
                  <span className="text-[#0B2346] font-bold">{wishlist.length}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#6B7280]">Estimated Cost</span>
                  <span className="text-[#0B2346] font-bold">{formatCurrency(estimatedValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#6B7280]">Potential Savings</span>
                  <span className="text-[#22C55E] font-bold">{formatCurrency(totalSavings)}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#6B7280]">Available Items</span>
                  <span className="text-[#0B2346] font-bold">{availableItems}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleAddAllAvailable}
                  disabled={availableItems === 0}
                  className="w-full h-[52px] bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-[#94A3B8] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ShoppingCart className="w-5 h-5" /> Add All Available
                </button>
                <Link 
                  to="/products"
                  className="w-full h-[52px] bg-white border-2 border-[#E5E7EB] hover:border-[#0B2346] text-[#0B2346] rounded-[12px] font-bold text-[16px] flex items-center justify-center transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
