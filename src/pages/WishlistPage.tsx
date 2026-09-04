import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Search, Grid, List, Trash2, Eye, Minus, Plus, ShoppingCart, Info, Loader2 } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { items: wishlist, loading, fetchWishlist, toggleWishlist, initialized } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (user && !initialized) {
      fetchWishlist(user.id);
    }
  }, [user, initialized, fetchWishlist]);

  const removeFromWishlist = (id: string, productId: string) => {
    if (user) {
      toggleWishlist(user.id, productId);
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: String(product.regular_price || product.price || 0),
      image_url: product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      seller_id: product.seller_id
    });
    toast.success("Added to cart");
  };

  const validWishlist = wishlist.filter(item => item.products);
  
  const handleAddAllAvailable = () => {
    let added = 0;
    validWishlist.forEach((item) => {
      if (item.products.stock > 0) {
        handleAddToCart(item.products);
        added++;
      }
    });
    if (added > 0) toast.success(`Added ${added} items to cart`);
  };

  const availableItems = validWishlist.filter(item => item.products.stock > 0).length;
  const unavailableItems = validWishlist.filter(item => item.products.stock === 0).length;
  const estimatedValue = validWishlist.reduce((acc, item) => acc + (item.products.price || 0), 0);
  const totalSavings = validWishlist.reduce((acc, item) => acc + ((item.products.compare_at_price || item.products.price) - item.products.price), 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF5EC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#FAF5EC] py-12 px-4 flex flex-col items-center justify-center">
        <Heart className="w-16 h-16 text-[#8B857D] mb-6" />
        <h1 className="text-[32px] font-bold text-[#3A2418] mb-4">Your Wishlist is Empty</h1>
        <p className="text-[#5F5A54] text-[16px] mb-8">Please login to view and manage your wishlist.</p>
        <Link to="/login" className="px-8 h-[48px] bg-[#C65A28] text-white rounded-[12px] font-bold text-[15px] flex items-center justify-center shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF5EC] py-12 px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-[#3A2418] mb-3">My Wishlist</h1>
          <p className="text-[#5F5A54] text-[16px]">Keep track of the fresh produce you want to buy later.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-12">
            <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E8DCC9] p-8">
              {validWishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-[#8B857D] mx-auto mb-6" />
                  <h3 className="text-[20px] font-bold text-[#3A2418] mb-2">No items saved yet</h3>
                  <p className="text-[#5F5A54] mb-6">Start exploring fresh produce and save your favorites.</p>
                  <Link to="/products" className="inline-flex h-[44px] items-center justify-center px-6 bg-[#C65A28] text-white rounded-[12px] font-bold">
                    Explore Market
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {validWishlist.map((item) => (
                    <div key={item.id} className="group relative bg-[#FAF5EC] rounded-[16px] border border-[#E8DCC9] overflow-hidden flex shadow-sm hover:shadow-md transition-all">
                      <div className="w-[140px] shrink-0 relative bg-white border-r border-[#E8DCC9]">
                        <OptimizedImage 
                          src={item.products.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'} 
                          alt={item.products.name} 
                          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" className="w-full h-full flex items-center justify-center bg-transparent" 
                        />
                        {item.products.compare_at_price > item.products.price && (
                          <span className="absolute top-2 left-2 bg-[#B94A48] text-white text-[11px] font-bold px-2 py-1 rounded-[6px]">
                            SALE
                          </span>
                        )}
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-1">
                            <h3 className="text-[#3A2418] font-bold text-[16px] line-clamp-1 group-hover:text-[#C65A28] transition-colors">
                              {item.products.name}
                            </h3>
                            <button 
                              onClick={() => removeFromWishlist(item.id, item.product_id)}
                              className="text-[#8B857D] hover:text-[#B94A48] p-1.5 -mr-1.5 rounded-full hover:bg-[#B94A48]/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[#3A2418] font-black text-[18px]">{formatCurrency(item.products.price)}</span>
                            {item.products.compare_at_price > item.products.price && (
                              <span className="text-[#8B857D] text-[14px] line-through">{formatCurrency(item.products.compare_at_price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-[6px] ${item.products.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#B94A48]/10 text-[#B94A48]'}`}>
                            {item.products.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <button 
                            onClick={() => handleAddToCart(item.products)}
                            disabled={item.products.stock === 0}
                            className="h-[36px] px-4 bg-[#C65A28] hover:bg-[#a64a20] disabled:bg-[#8B857D] text-white rounded-[8px] font-bold text-[13px] flex items-center gap-2 transition-colors"
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
            <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E8DCC9] p-8 sticky top-[120px]">
              <h2 className="text-[#3A2418] font-bold text-[22px] mb-6">Shopping Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#5F5A54]">Saved Items</span>
                  <span className="text-[#3A2418] font-bold">{validWishlist.length}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#5F5A54]">Estimated Cost</span>
                  <span className="text-[#3A2418] font-bold">{formatCurrency(estimatedValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#5F5A54]">Potential Savings</span>
                  <span className="text-[#C65A28] font-bold">{formatCurrency(totalSavings)}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#5F5A54]">Available Items</span>
                  <span className="text-[#3A2418] font-bold">{availableItems}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleAddAllAvailable}
                  disabled={availableItems === 0}
                  className="w-full h-[52px] bg-[#C65A28] hover:bg-[#a64a20] disabled:bg-[#8B857D] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ShoppingCart className="w-5 h-5" /> Add All Available
                </button>
                <Link 
                  to="/products"
                  className="w-full h-[52px] bg-white border-2 border-[#E8DCC9] hover:border-[#C65A28] hover:text-[#C65A28] text-[#3A2418] rounded-[12px] font-bold text-[16px] flex items-center justify-center transition-colors"
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
