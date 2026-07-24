import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { CheckoutAuthModal } from "../components/CheckoutAuthModal";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  Headphones,
  RotateCcw
} from "lucide-react";

const RECOMMENDED_PRODUCTS = [
  { id: 'r1', name: 'Fresh Milk', weight: '1L', price: 120, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80' },
  { id: 'r2', name: 'Sliced Bread', weight: '400g', price: 65, image: 'https://images.unsplash.com/photo-1585478259715-876a6a81fa08?w=500&q=80' },
  { id: 'r3', name: 'Coca Cola', weight: '2L', price: 200, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' },
  { id: 'r4', name: 'Minute Maid', weight: '1L', price: 180, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, addItem } = useCartStore();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || "Customer";
  const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || "+254 700 000000";

  const [coupon, setCoupon] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate("/checkout");
    }
  };

  const getSubtotal = (priceStr: string, qty: number) => {
    const numPrice = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
    return (numPrice * qty).toLocaleString();
  };

  const cartTotal = getCartTotal();
  const freeDeliveryThreshold = 4000;
  const awayFromFreeDelivery = Math.max(0, freeDeliveryThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeDeliveryThreshold) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-8 pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-[13px] text-[#6B7280] mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-[slate-900]">Home</Link>
          <span>&gt;</span>
          <span className="text-[slate-900] font-medium">Cart</span>
        </div>

        <div className="mb-8">
          <h1 className="text-[32px] md:text-[40px] font-bold text-[slate-900] tracking-tight">Shopping Cart</h1>
          <p className="text-[#6B7280] text-[15px] mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-[#FFFDF8] rounded-[20px] border border-[#E5E7EB] p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-[#C65A28]" />
            </div>
            <h2 className="text-[slate-900] font-bold text-[28px] mb-3">Your cart is empty</h2>
            <p className="text-[#6B7280] text-[16px] mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Discover our premium selection of products.</p>
            <Link 
              to="/products" 
              className="inline-flex items-center justify-center h-[56px] px-8 bg-[#C65A28] hover:bg-[#C65A28] text-white font-bold text-[18px] rounded-[16px] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column (72%) */}
            <div className="w-full lg:w-[72%] space-y-6">
              
              {/* Delivery Information Card */}
              <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-[slate-900] font-bold text-[18px] mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C65A28]" /> Delivery Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Deliver To */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[#6B7280] text-[13px] font-medium mb-2">
                      <MapPin className="w-4 h-4" /> Deliver To
                    </div>
                    <p className="text-[slate-900] font-bold text-[15px]">{user ? fullName : "Sign in to add address"}</p>
                    <p className="text-[#6B7280] text-[14px] mt-1">{user ? "123 Supermarket Road, Nairobi, Kenya" : "No address saved"}</p>
                    <p className="text-[#6B7280] text-[14px] mt-1">{user ? userPhone : ""}</p>
                    <button className="text-[slate-900] font-bold text-[13px] hover:underline mt-3 text-left w-fit">Change Address</button>
                  </div>
                  
                  {/* Delivery Time */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[#6B7280] text-[13px] font-medium mb-2">
                      <Clock className="w-4 h-4" /> Delivery Time
                    </div>
                    <p className="text-[slate-900] font-bold text-[15px]">Tomorrow</p>
                    <p className="text-[#6B7280] text-[14px] mt-1">8:00 AM - 10:00 AM</p>
                    <button className="text-[slate-900] font-bold text-[13px] hover:underline mt-auto text-left w-fit">Change Time</button>
                  </div>
                  
                  {/* Delivery Method */}
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-2 text-[#6B7280] text-[13px] font-medium mb-1">
                      Delivery Method
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="deliveryMethod" className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" defaultChecked />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[slate-900] font-bold text-[14px]">Standard Delivery</span>
                          <span className="text-[#C65A28] font-bold text-[14px]">FREE</span>
                        </div>
                        <span className="text-[#6B7280] text-[12px]">Estimated Tomorrow</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="deliveryMethod" className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[slate-900] font-bold text-[14px]">Express</span>
                          <span className="text-[slate-900] font-bold text-[14px]">Ksh 250</span>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="deliveryMethod" className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[slate-900] font-bold text-[14px]">Pickup</span>
                          <span className="text-[#C65A28] font-bold text-[14px]">FREE</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Free Delivery Progress */}
              <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[slate-900] font-bold text-[14px]">KES 0</span>
                  <span className="text-[slate-900] font-bold text-[14px]">Free Delivery KES 4,000</span>
                </div>
                <div className="w-full h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E5E7EB]">
                  <div 
                    className="h-full bg-[#C65A28] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-4 text-center">
                  {awayFromFreeDelivery > 0 ? (
                    <p className="text-[slate-900] font-medium text-[15px]">
                      🎉 You're <span className="font-bold">KES {awayFromFreeDelivery.toLocaleString()}</span> away from FREE Delivery!
                    </p>
                  ) : (
                    <p className="text-[#C65A28] font-bold text-[15px] flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Congratulations! You've unlocked FREE Delivery.
                    </p>
                  )}
                </div>
              </div>

              {/* Product Recommendations */}
              <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                <h3 className="text-[slate-900] font-bold text-[16px] mb-5">Add any of these items to unlock FREE Delivery</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {RECOMMENDED_PRODUCTS.map(product => (
                    <div key={product.id} className="min-w-[180px] border border-[#E5E7EB] rounded-[16px] p-4 flex flex-col snap-start group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <div className="aspect-square bg-[#F8FAFC] rounded-[12px] mb-4 overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="text-[slate-900] font-semibold text-[14px] line-clamp-1">{product.name}</h4>
                      <p className="text-[#6B7280] text-[12px] mb-3">{product.weight}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-[slate-900] font-bold text-[15px]">Ksh {product.price}</span>
                        <button 
                          onClick={() => addItem({ id: product.id, name: product.name, price: `Ksh ${product.price}`, image_url: product.image }, 1)}
                          className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[slate-900] flex items-center justify-center hover:bg-[slate-900] hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Items */}
              <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  {items.map((item, i) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-[#E5E7EB] last:border-0 last:pb-0 group">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" className="w-5 h-5 rounded border-[#E5E7EB] text-[#C65A28] focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" defaultChecked />
                        <div className="w-[100px] h-[100px] shrink-0 bg-[#F8FAFC] rounded-[16px] p-2 flex items-center justify-center border border-[#E5E7EB]">
                          <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-[slate-900] font-bold text-[16px] line-clamp-2">{item.name}</h3>
                            <p className="text-[#6B7280] text-[13px] mt-1">{item.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[slate-900] font-bold text-[16px]">
                              {String(item.price).startsWith('Ksh') ? item.price : `Ksh ${item.price}`}
                            </p>
                            <p className="text-[#6B7280] text-[12px]">Unit Price</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-full h-[40px] px-1 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#FFFDF8] hover:text-[slate-900] transition-colors disabled:opacity-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center text-[slate-900] font-bold text-[15px]">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#FFFDF8] hover:text-[slate-900] transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[slate-900] font-bold text-[18px]">
                              Ksh {getSubtotal(item.price, item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (28%) - Order Summary */}
            <div className="w-full lg:w-[28%] shrink-0">
              <div className="space-y-6 sticky top-[120px]">
                
                {/* Order Summary Card */}
                <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                  <h2 className="text-[slate-900] font-bold text-[20px] mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-[#6B7280]">Subtotal</span>
                      <span className="text-[slate-900] font-bold">Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-[#6B7280]">Delivery</span>
                      <span className={awayFromFreeDelivery > 0 ? "text-[slate-900] font-bold" : "text-[#C65A28] font-bold"}>
                        {awayFromFreeDelivery > 0 ? "Calculated at checkout" : "FREE"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-[#6B7280]">VAT</span>
                      <span className="text-[slate-900] font-bold">Included</span>
                    </div>
                  </div>

                  <div className="mb-6 flex">
                    <input 
                      type="text" 
                      placeholder="Coupon Code" 
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 h-[48px] px-4 border border-[#E5E7EB] border-r-0 rounded-l-[12px] outline-none focus:border-[slate-900] transition-colors text-[14px] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                    />
                    <button className="h-[48px] px-6 bg-[slate-900] text-white font-bold text-[14px] rounded-r-[12px] hover:bg-[slate-900]/90 transition-colors shrink-0">
                      Apply
                    </button>
                  </div>

                  <div className="border-t border-[#E5E7EB] pt-5 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="text-[slate-900] font-bold text-[18px]">Total</span>
                      <span className="text-[#C65A28] font-black text-[28px] leading-none">Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full h-[56px] bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 transition-colors mb-4 shadow-sm hover:scale-[1.02] transform duration-300"
                  >
                    Proceed to Checkout <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280] font-medium">
                    <Lock className="h-4 w-4" /> Secure checkout
                  </div>
                </div>

                {/* Shop with confidence */}
                <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                  <h3 className="text-[slate-900] font-bold text-[16px] mb-4">Shop with confidence</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#6B7280] text-[14px]">
                      <CheckCircle2 className="w-5 h-5 text-[#C65A28]" /> Quality products
                    </div>
                    <div className="flex items-center gap-3 text-[#6B7280] text-[14px]">
                      <Truck className="w-5 h-5 text-[#C65A28]" /> Fast delivery
                    </div>
                    <div className="flex items-center gap-3 text-[#6B7280] text-[14px]">
                      <Lock className="w-5 h-5 text-[#C65A28]" /> Secure payment
                    </div>
                    <div className="flex items-center gap-3 text-[#6B7280] text-[14px]">
                      <RotateCcw className="w-5 h-5 text-[#C65A28]" /> Easy returns
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
      <CheckoutAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => navigate("/checkout")} 
      />
    </div>
  );
}
