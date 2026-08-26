import { OptimizedImage } from "../components/ui/OptimizedImage";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { OrderReceipt } from "../components/receipt/OrderReceipt";
import { generateWhatsAppMessage, getWhatsAppUrl, WhatsAppOrderData } from "../lib/whatsapp";
import { toPng, toBlob } from "html-to-image";
import { 
  Download,
  MessageCircle,
  Share2,
  FileText,
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

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || "";
  const userEmail = user?.email || "";
  const userPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || "";

  const [coupon, setCoupon] = useState("");
  const [isGeneratingWA, setIsGeneratingWA] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("");

  // Load Paystack Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  const [shippingDetails, setShippingDetails] = useState({
    recipientName: fullName,
    recipientPhone: userPhone,
    location: "Nairobi, Westlands",
    fullAddress: "Spring Valley Estate, Peponi Road, Building A, Opposite Mall"
  });
  
  const [contactDetails, setContactDetails] = useState({
    fullName: fullName,
    userPhone: userPhone,
    userEmail: userEmail
  });
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState(shippingDetails);
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContactData, setEditContactData] = useState(contactDetails);

  // Sync when user/profile loads
  useEffect(() => {
    setShippingDetails(prev => ({
      ...prev,
      recipientName: !prev.recipientName ? (user?.user_metadata?.full_name || user?.user_metadata?.first_name || "") : prev.recipientName,
      recipientPhone: !prev.recipientPhone ? (profile?.phone || user?.phone || user?.user_metadata?.phone || "") : prev.recipientPhone
    }));
    
    setContactDetails(prev => ({
      ...prev,
      fullName: !prev.fullName ? (user?.user_metadata?.full_name || user?.user_metadata?.first_name || "") : prev.fullName,
      userPhone: !prev.userPhone ? (profile?.phone || user?.phone || user?.user_metadata?.phone || "") : prev.userPhone,
      userEmail: !prev.userEmail ? (user?.email || "") : prev.userEmail
    }));
  }, [user, profile]);

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
          shippingDetails: shippingDetails,
          contactDetails: contactDetails,
          paymentMethod: 'M-Pesa'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error + (data.details ? " " + JSON.stringify(data.details) : ''));
      }

      const verifyAndComplete = async (reference?: string) => {
        setLoadingText("Verifying payment...");
        try {
          const verifyResponse = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId, reference })
          });
          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            setConfirmedOrder(verifyData);
          } else {
            setReceiptError("Your payment was successful, but we couldn't generate the receipt. Please contact support.");
          }
        } catch (e) {
          console.error(e);
          setReceiptError("Your payment was successful, but we couldn't generate the receipt. Please try again.");
        }
        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
      };

      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_placeholder";
      
      if (paystackKey === "pk_live_placeholder") {
        console.warn("Using placeholder Paystack key. Payment will fail in production.");
      }

      if (typeof (window as any).PaystackPop === "undefined") {
          toast.error("Payment gateway is still loading. Please try again in a moment.");
          setIsProcessing(false);
          return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: paystackKey,
        email: contactDetails.userEmail || "customer@example.com",
        amount: Math.round(cartTotal * 100), // in cents/kobo
        currency: 'KES', // adjust to your currency
        channels: ['mobile_money'], // Force M-Pesa/Mobile Money only
        ref: `ord_${data.orderId}_${Math.floor((Math.random() * 1000000000) + 1)}`,
        onClose: function(){
          toast.error("Payment window closed.");
          setIsProcessing(false);
        },
        callback: function(response: any){
          verifyAndComplete(response.reference);
        }
      });
      handler.openIframe();
      
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


  const getReceiptData = (): WhatsAppOrderData | null => {
    if (!confirmedOrder) return null;
    const { order, profile, items } = confirmedOrder;
    
    // Attempt to parse notes for delivery info
    let location = "Nairobi";
    let address = "Nairobi, Kenya";
    let orderNumberFromNotes = "";
    let parsedContact: any = null;
    let parsedShipping: any = null;
    
    try {
      if (order.notes) {
        const parsed = JSON.parse(order.notes);
        if (parsed.shippingDetails) {
          parsedShipping = parsed.shippingDetails;
          location = parsedShipping.location || location;
          address = parsedShipping.fullAddress || address;
        }
        if (parsed.contactDetails) {
          parsedContact = parsed.contactDetails;
        }
        if (parsed.orderNumber) {
           orderNumberFromNotes = parsed.orderNumber;
        }
      }
    } catch(e){}

    const cName = parsedContact?.fullName || parsedShipping?.recipientName || (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '') || profile?.full_name || "Name unavailable";
    const cPhone = parsedContact?.userPhone || parsedShipping?.recipientPhone || profile?.phone || "Phone unavailable";
    const cEmail = parsedContact?.userEmail || profile?.email || "Email unavailable";

    return {
      order_number: order.order_number || orderNumberFromNotes || order.id.split('-')[0],
      created_at: order.created_at,
      customer_name: cName,
      customer_phone: cPhone,
      customer_email: cEmail,
      items: items.map((i: any) => ({
        product_name: i.product_name || 'Product',
        quantity: i.quantity || 1,
        unit_price: i.unit_price || 0,
        total_price: i.total_price || 0
      })),
      subtotal: order.subtotal || 0,
      delivery_fee: order.shipping_fee || order.delivery_fee || 0,
      discount: order.discount || order.discount_amount || 0,
      grand_total: order.grand_total || order.total_amount || order.total || order.subtotal || 0,
      payment_method: 'M-Pesa',
      payment_status: "PAID",
      delivery_location: location,
      delivery_address: address,
      status: order.status,
      transaction_id: "TXN" + Math.floor(Math.random() * 100000000) // Mocking transaction ID if missing
    };
  };

  const handleDownloadReceipt = async () => {
    const el = document.getElementById('receipt-element');
    if (!el) return;
    try {
      const url = await toPng(el, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${confirmedOrder?.order?.order_number || 'Order'}.png`;
      a.click();
    } catch(e) {
      console.error(e);
      toast.error("Failed to download receipt");
    }
  };

  const handleShareReceipt = async () => {
    const el = document.getElementById('receipt-element');
    if (!el) return;
    try {
      const blob = await toBlob(el, { pixelRatio: 2 });
      if (blob) (async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${confirmedOrder?.order?.order_number || 'Order'}.png`, { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({
            title: 'Order Receipt',
            text: 'Here is your OdaMarket order receipt.',
            files: [file]
          });
        } else {
          toast.error("Native sharing not supported on this device. Please download instead.");
        }
      })(blob);
    } catch(e) {
      console.error(e);
    }
  };

  
  const handleWhatsAppImage = async () => {
    setIsGeneratingWA(true);
    try {
      const el = document.getElementById('receipt-element');
      if (!el) return;
      const url = await toPng(el, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `OdaMarket-Receipt-${confirmedOrder?.order?.order_number || 'Order'}.png`;
      a.click();

      toast.success("Receipt downloaded! Opening WhatsApp...", { duration: 3000 });
      
      setTimeout(() => {
        const text = encodeURIComponent(`Hello OdaMarket, I have just paid for order ${confirmedOrder?.order?.order_number || 'Order'}. I will attach the receipt image I just downloaded.`);
        window.open(getWhatsAppUrl(`Hello OdaMarket, I have just paid for order ${confirmedOrder?.order?.order_number || 'Order'}. I will attach the receipt image I just downloaded.`), '_blank');
      }, 1500);
    } catch(e) {
      console.error(e);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsGeneratingWA(false);
    }
  };


  if (isSuccess) {
    const receiptData = getReceiptData();

    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-12 pb-24 flex items-center justify-center">
        <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E5E7EB] p-6 sm:p-10 max-w-4xl w-full mx-4 flex flex-col md:flex-row gap-8">
          
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#C65A28]" />
            </div>
            <h1 className="text-[slate-900] font-bold text-[32px] mb-2">Payment Successful</h1>
            <p className="text-[#6B7280] text-[16px] mb-2">Your order has been confirmed.</p>
            {receiptData && (
              <p className="text-[slate-900] font-bold text-[18px] mb-8">Order {receiptData.order_number}</p>
            )}

            {receiptError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                {receiptError}
              </div>
            )}

            {!receiptData && !receiptError && (
              <div className="animate-pulse flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-8">
                <div className="w-5 h-5 border-2 border-[#C65A28] border-t-transparent rounded-full animate-spin"></div>
                Generating secure receipt...
              </div>
            )}

            {receiptData && (
              <div className="space-y-4">
                
                <button 
                  onClick={handleWhatsAppImage}
                  disabled={isGeneratingWA}
                  className="w-full h-[56px] bg-[#25D366] text-white rounded-[16px] font-bold text-[16px] hover:bg-[#1DA851] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isGeneratingWA ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  {isGeneratingWA ? "Preparing Receipt..." : "Send Receipt to WhatsApp"}
                </button>

                
                <div className="flex gap-3">
                  <button 
                    onClick={handleDownloadReceipt}
                    className="flex-1 h-[56px] bg-[#FFFDF8] border border-[#E8DCC9] text-[#3A2418] rounded-[16px] font-bold text-[15px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download Receipt
                  </button>
                  {navigator.share && (
                    <button 
                      onClick={handleShareReceipt}
                      className="flex-1 h-[56px] bg-[#FFFDF8] border border-[#E8DCC9] text-[#3A2418] rounded-[16px] font-bold text-[15px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" /> Share Receipt
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate("/products")}
                  className="w-full h-[56px] mt-4 bg-[#C65A28] text-white rounded-[16px] font-bold text-[16px] hover:bg-[#A94A1F] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-[#E5E7EB] pt-8 md:pt-0 md:pl-8 flex justify-center">
            {receiptData ? (
              <div className="w-full max-w-[400px] border border-[#E8DCC9] rounded-xl overflow-hidden shadow-sm relative">
                <OrderReceipt order={receiptData} />
              </div>
            ) : (
               <div className="w-full max-w-[400px] h-[600px] bg-slate-50 border border-slate-100 rounded-xl animate-pulse"></div>
            )}
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
                {!isEditingContact && (
                  <button 
                    onClick={() => {
                      setEditContactData(contactDetails);
                      setIsEditingContact(true);
                    }}
                    className="text-[#C65A28] font-bold text-[14px] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingContact ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactFullName">Full Name</Label>
                      <Input 
                        id="contactFullName" 
                        value={editContactData.fullName} 
                        onChange={(e) => setEditContactData({...editContactData, fullName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input 
                        id="contactPhone" 
                        value={editContactData.userPhone} 
                        onChange={(e) => setEditContactData({...editContactData, userPhone: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="contactEmail">Email (Optional)</Label>
                      <Input 
                        id="contactEmail" 
                        type="email"
                        value={editContactData.userEmail} 
                        onChange={(e) => setEditContactData({...editContactData, userEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsEditingContact(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setContactDetails(editContactData);
                      setIsEditingContact(false);
                    }} className="bg-[#C65A28] hover:bg-[#A0451C] text-white">Save Contact</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Full Name</label>
                    <div className="text-[slate-900] font-semibold text-[15px]">{contactDetails.fullName}</div>
                  </div>
                  <div>
                    <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Phone Number</label>
                    <div className="text-[slate-900] font-semibold text-[15px]">{contactDetails.userPhone}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[#6B7280] text-[13px] font-medium mb-1">Email (Optional)</label>
                    <div className="text-[slate-900] font-semibold text-[15px]">{contactDetails.userEmail}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Delivery Address */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[slate-900] font-bold text-[20px]">2. Delivery Address</h2>
                {!isEditingAddress && (
                  <button 
                    onClick={() => {
                      setEditAddressData(shippingDetails);
                      setIsEditingAddress(true);
                    }}
                    className="text-[#C65A28] font-bold text-[14px] hover:underline"
                  >
                    Change Address
                  </button>
                )}
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input 
                        id="recipientName" 
                        value={editAddressData.recipientName} 
                        onChange={(e) => setEditAddressData({...editAddressData, recipientName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientPhone">Phone Number</Label>
                      <Input 
                        id="recipientPhone" 
                        value={editAddressData.recipientPhone} 
                        onChange={(e) => setEditAddressData({...editAddressData, recipientPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location (City, Area)</Label>
                    <Input 
                      id="location" 
                      value={editAddressData.location} 
                      onChange={(e) => setEditAddressData({...editAddressData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullAddress">Full Address (Building, Street)</Label>
                    <Input 
                      id="fullAddress" 
                      value={editAddressData.fullAddress} 
                      onChange={(e) => setEditAddressData({...editAddressData, fullAddress: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsEditingAddress(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setShippingDetails(editAddressData);
                      setIsEditingAddress(false);
                    }} className="bg-[#C65A28] hover:bg-[#A0451C] text-white">Save Address</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E5E7EB] flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-[#C65A28] shrink-0 mt-1" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
                    <div>
                      <span className="text-[#6B7280] text-[13px] block">Recipient</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.recipientName} ({shippingDetails.recipientPhone})</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] text-[13px] block">Location</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.location}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[#6B7280] text-[13px] block">Full Address</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.fullAddress}</span>
                    </div>
                  </div>
                </div>
              )}
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
              
              {/* Payment Methods */}
              <div className="mb-6">
                {/* Premium M-Pesa Card */}
                <div className="border-2 border-[#C65A28] bg-[#ECFDF5] rounded-[16px] p-6 relative cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#C65A28] text-white px-3 py-1 rounded-bl-[12px] font-bold text-[12px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-[12px] shadow-sm flex items-center justify-center shrink-0">
                      <Smartphone className="w-8 h-8 text-[#C65A28]" />
                    </div>
                    <div>
                      <h3 className="text-[slate-900] font-bold text-[18px]">M-Pesa</h3>
                      <p className="text-[slate-900]/70 text-[13px] leading-tight mt-1">Pay securely with Safaricom M-Pesa</p>
                    </div>
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
