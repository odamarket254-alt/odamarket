import { OptimizedImage } from "../components/ui/OptimizedImage";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CreditCard,
  Lock,
  Truck,
  RotateCcw,
  Smartphone,
  Info,
  ChevronRight,
  PackageCheck,
  Headphones
} from "lucide-react";

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || "Customer Name";
  const userEmail = user?.email || "customer@example.com";
  const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || "+254 700 000000";

  const [coupon, setCoupon] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const cartTotal = getCartTotal();

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0 && !isSuccess && !isProcessing) {
      navigate("/cart");
    }
  }, [items, navigate, isSuccess, isProcessing]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setLoadingText("Connecting to secure checkout...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login to place an order");
        setIsProcessing(false);
        return;
      }

      setLoadingText("Validating inventory and processing...");
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          })),
          shippingDetails: {
            county: "Nairobi",
            address: "Default Address"
          },
          paymentMethod: 'M-Pesa'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setLoadingText("Finalizing order...");
      
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const getSubtotal = (priceStr: string, qty: number) => {
    const numPrice = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
    return (numPrice * qty).toLocaleString();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-12 pb-24 flex items-center justify-center">
        <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E5E7EB] p-10 max-w-lg w-full mx-4 text-center">
          <div className="w-24 h-24 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-[#C65A28]" />
          </div>
          <h1 className="text-[slate-900] font-bold text-[32px] mb-2">Payment Successful</h1>
          <p className="text-[#6B7280] text-[16px] mb-8">Thank you for your purchase!</p>
          
          <div className="bg-[#F8FAFC] rounded-[16px] p-6 mb-8 text-left border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#6B7280] text-[14px]">Order Number</span>
              <span className="text-[slate-900] font-bold text-[15px]">#ODA-{Math.floor(Math.random() * 1000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B7280] text-[14px]">Estimated Delivery</span>
              <span className="text-[slate-900] font-bold text-[15px]">Tomorrow, 8:00 AM - 10:00 AM</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 h-[56px] bg-[#FFFDF8] border border-[slate-900] text-[slate-900] rounded-[16px] font-bold text-[16px] hover:bg-[#F8FAFC] transition-colors">
              Track Order
            </button>
            <button 
              onClick={() => navigate("/products")}
              className="flex-1 h-[56px] bg-[#C65A28] text-white rounded-[16px] font-bold text-[16px] hover:bg-[#C65A28] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-8 pb-24 relative">
      
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#FFFDF8]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-4 border-[#E5E7EB] border-t-[#C65A28] rounded-full animate-spin mb-6" />
          <h2 className="text-[slate-900] font-bold text-[24px] mb-2">{loadingText}</h2>
          {loadingText.includes("phone") && (
             <p className="text-[#6B7280] text-[16px] max-w-xs text-center animate-pulse">
               Check your phone for the M-Pesa prompt and enter your PIN to confirm payment.
             </p>
          )}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-[13px] text-[#6B7280] mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-[slate-900]">Home</Link>
          <span>&gt;</span>
          <Link to="/cart" className="hover:text-[slate-900]">Cart</Link>
          <span>&gt;</span>
          <span className="text-[slate-900] font-medium">Checkout</span>
        </div>

        {/* Checkout Progress */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#C65A28] text-white flex items-center justify-center font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[slate-900] font-bold text-[15px]">Cart</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-[#C65A28] shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[slate-900] text-white flex items-center justify-center font-bold text-[14px]">
                2
              </div>
              <span className="text-[slate-900] font-bold text-[15px]">Checkout</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-[#E5E7EB] shrink-0" />
            <div className="flex items-center gap-2 shrink-0 opacity-50">
              <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border-2 border-[#E5E7EB] text-[#6B7280] flex items-center justify-center font-bold text-[14px]">
                3
              </div>
              <span className="text-[#6B7280] font-bold text-[15px]">Order Complete</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#C65A28] bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0] shrink-0 self-start md:self-auto">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-[13px]">Secure Checkout</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column (70%) */}
          <div className="w-full lg:w-[70%] space-y-6">
            
            {/* Section 1: Contact Information */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[slate-900] font-bold text-[20px]">1. Contact Information</h2>
                <button className="text-[slate-900] font-bold text-[14px] hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Full Name</label>
                  <div className="text-[slate-900] font-semibold text-[15px]">{fullName}</div>
                </div>
                <div>
                  <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Phone Number</label>
                  <div className="text-[slate-900] font-semibold text-[15px]">{userPhone}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Email (Optional)</label>
                  <div className="text-[slate-900] font-semibold text-[15px]">{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Address */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[slate-900] font-bold text-[20px]">2. Delivery Address</h2>
                <button className="text-[slate-900] font-bold text-[14px] hover:underline">Change Address</button>
              </div>
              <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E5E7EB] flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#C65A28] shrink-0 mt-1" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
                  <div>
                    <span className="text-[#6B7280] text-[13px] block">Recipient</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">{fullName} ({userPhone})</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] text-[13px] block">Location</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">Nairobi, Westlands</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[#6B7280] text-[13px] block">Full Address</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">Spring Valley Estate, Peponi Road, Building A, Opposite Mall</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Delivery Details */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <h2 className="text-[slate-900] font-bold text-[20px] mb-6">3. Delivery Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between items-start border-b md:border-b-0 md:border-r border-[#E5E7EB] pb-6 md:pb-0 md:pr-6">
                  <div>
                    <div className="flex items-center gap-2 text-[#6B7280] text-[14px] font-medium mb-2">
                      <Clock className="w-5 h-5" /> Delivery Time
                    </div>
                    <p className="text-[slate-900] font-bold text-[16px]">Tomorrow</p>
                    <p className="text-[#6B7280] text-[14px] mt-1">8:00 AM - 10:00 AM</p>
                  </div>
                  <button className="text-[slate-900] font-bold text-[14px] hover:underline">Change</button>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-[#6B7280] text-[14px] font-medium mb-2">
                      <Truck className="w-5 h-5" /> Delivery Method
                    </div>
                    <p className="text-[slate-900] font-bold text-[16px]">Standard Delivery</p>
                    <p className="text-[#6B7280] text-[14px] mt-1">Estimated Tomorrow</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[#C65A28] font-bold text-[16px] mb-1">FREE</span>
                    <button className="text-[slate-900] font-bold text-[14px] hover:underline">Change</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Payment Method */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <h2 className="text-[slate-900] font-bold text-[20px] mb-6">4. Payment Method</h2>
              
              {/* Premium M-Pesa Card */}
              <div className="border-2 border-[#C65A28] bg-[#ECFDF5] rounded-[16px] p-6 relative cursor-pointer overflow-hidden mb-6">
                <div className="absolute top-0 right-0 bg-[#C65A28] text-white px-3 py-1 rounded-bl-[12px] font-bold text-[12px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Selected
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#FFFDF8] rounded-[12px] shadow-sm flex items-center justify-center shrink-0">
                    <Smartphone className="w-8 h-8 text-[#C65A28]" />
                  </div>
                  <div>
                    <h3 className="text-[slate-900] font-bold text-[18px]">M-Pesa</h3>
                    <p className="text-[slate-900]/70 text-[14px]">Pay securely using Safaricom M-Pesa</p>
                  </div>
                </div>
              </div>

              {/* Blue Info Box */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px] p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <p className="text-[#1E3A8A] text-[14px] leading-relaxed">
                  You will receive an M-Pesa STK Push notification on your phone after placing the order. Please enter your M-Pesa PIN to complete the transaction.
                </p>
              </div>
            </div>

            {/* Section 5: Optional Notes */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <h2 className="text-[slate-900] font-bold text-[18px] mb-4">5. Optional Notes</h2>
              <textarea 
                placeholder="Delivery Instructions (e.g., Leave at the door, call before arriving...)" 
                className="w-full h-[120px] p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] outline-none focus:border-[slate-900] transition-colors resize-none text-[14px] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>

            {/* Place Order Button */}
            <button 
              onClick={handlePlaceOrder}
              disabled={items.length === 0}
              className="w-full h-[64px] bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-[16px] font-bold text-[20px] flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#C65A28]/20 hover:scale-[1.01] transform duration-300 disabled:opacity-70 disabled:hover:scale-100"
            >
              <Lock className="w-6 h-6" /> Place Order with M-Pesa
            </button>

          </div>

          {/* Right Column (30%) - Order Summary */}
          <div className="w-full lg:w-[30%] shrink-0">
            <div className="space-y-6 sticky top-[120px]">
              
              {/* Order Summary Card */}
              <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-[slate-900] font-bold text-[20px] mb-6">Order Summary</h2>
                
                {/* Product List Mini */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                        <OptimizedImage src={item.image_url} alt={item.name} imgClassName="max-w-full max-h-full object-contain" className="w-full h-full flex items-center justify-center bg-transparent" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-[slate-900] font-semibold text-[13px] line-clamp-2 leading-snug mb-1">{item.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-[#6B7280] text-[12px]">Qty: {item.quantity}</span>
                          <span className="text-[slate-900] font-bold text-[14px]">
                             Ksh {getSubtotal(item.price, item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6 flex">
                  <input 
                    type="text" 
                    placeholder="Coupon Code" 
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 h-[44px] px-3 border border-[#E5E7EB] border-r-0 rounded-l-[10px] outline-none focus:border-[slate-900] transition-colors text-[13px] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  />
                  <button className="h-[44px] px-4 bg-[slate-900] text-white font-bold text-[13px] rounded-r-[10px] hover:bg-[slate-900]/90 transition-colors shrink-0">
                    Apply
                  </button>
                </div>

                <div className="space-y-3 mb-6 border-t border-[#E5E7EB] pt-6">
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[#6B7280]">Subtotal</span>
                    <span className="text-[slate-900] font-bold">Ksh {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[#6B7280]">Delivery</span>
                    <span className="text-[#C65A28] font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[#6B7280]">VAT</span>
                    <span className="text-[slate-900] font-bold">Included</span>
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] pt-5 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[slate-900] font-bold text-[18px]">Total</span>
                    <span className="text-[#C65A28] font-black text-[28px] leading-none">Ksh {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[12px] p-3 text-center mb-2 flex items-center justify-center gap-2">
                  <PackageCheck className="w-5 h-5 text-[#C65A28]" />
                  <span className="text-[slate-900] font-bold text-[14px]">🎉 You're getting FREE Delivery</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FFFDF8] rounded-[12px] border border-[#E5E7EB] p-3 flex flex-col items-center justify-center text-center gap-2">
                  <Lock className="w-6 h-6 text-[#6B7280]" />
                  <span className="text-[slate-900] font-bold text-[12px]">Secure Payments</span>
                </div>
                <div className="bg-[#FFFDF8] rounded-[12px] border border-[#E5E7EB] p-3 flex flex-col items-center justify-center text-center gap-2">
                  <Truck className="w-6 h-6 text-[#6B7280]" />
                  <span className="text-[slate-900] font-bold text-[12px]">Fast Delivery</span>
                </div>
                <div className="bg-[#FFFDF8] rounded-[12px] border border-[#E5E7EB] p-3 flex flex-col items-center justify-center text-center gap-2">
                  <RotateCcw className="w-6 h-6 text-[#6B7280]" />
                  <span className="text-[slate-900] font-bold text-[12px]">Easy Returns</span>
                </div>
                <div className="bg-[#FFFDF8] rounded-[12px] border border-[#E5E7EB] p-3 flex flex-col items-center justify-center text-center gap-2">
                  <Headphones className="w-6 h-6 text-[#6B7280]" />
                  <span className="text-[slate-900] font-bold text-[12px]">24/7 Support</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
