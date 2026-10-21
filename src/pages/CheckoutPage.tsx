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
import { ThermalPrinter } from "../components/receipt/ThermalPrinter";
import { OrderReceiptData } from "../components/receipt/OrderReceipt";
import { downloadDigitalReceiptPdf } from "../utils/receiptPdf";
import { generateWhatsAppMessage, getWhatsAppUrl, WhatsAppOrderData } from "../lib/whatsapp";
import { toPng, toBlob } from "html-to-image";
import { 
  Download,
  Printer,
  PackageCheck,
  Mail,
  RefreshCw,
  ExternalLink,
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
  Headphones
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function CheckoutPage() {
  const { t, language } = useTranslation();
  const { 
    items, 
    deliveryMethod, 
    setDeliveryMethod, 
    getCartSubtotal, 
    getDeliveryFee, 
    getCartTotal, 
    clearCart 
  } = useCartStore();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || profile?.full_name || "";
  const fullName = profileName || user?.user_metadata?.full_name || user?.user_metadata?.first_name || "";
  const userEmail = user?.email || profile?.email || "";
  const userPhone = profile?.phone_number || profile?.phone || user?.phone || user?.user_metadata?.phone || "";

  const [coupon, setCoupon] = useState("");
  const [isGeneratingWA, setIsGeneratingWA] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("");
  const [isEditingDeliveryMethod, setIsEditingDeliveryMethod] = useState(false);
  const [activePendingOrderId, setActivePendingOrderId] = useState<string | null>(null);
  const [activePaymentReference, setActivePaymentReference] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentPendingNotice, setPaymentPendingNotice] = useState<string | null>(null);

  // Real-time listener for authoritative order status transitions (e.g. background Paystack webhooks)
  useEffect(() => {
    if (!activePendingOrderId || isSuccess) return;

    const channel = supabase
      .channel(`checkout-order-${activePendingOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activePendingOrderId}`
        },
        async (payload: any) => {
          if (payload.new && payload.new.payment_status === 'success') {
            const { data: items } = await supabase.from('order_items').select('*').eq('order_id', activePendingOrderId);
            setConfirmedOrder({
              success: true,
              status: 'paid',
              orderId: activePendingOrderId,
              order: payload.new,
              items: items || []
            });
            setIsProcessing(false);
            setIsSuccess(true);
            setPaymentError(null);
            setPaymentPendingNotice(null);
            clearCart();
            toast.success("Payment verified! Your order has been placed.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePendingOrderId, isSuccess, clearCart]);

  // Load Paystack Script safely
  useEffect(() => {
    if (typeof (window as any).PaystackPop === "undefined") {
      const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);
  
  const [shippingDetails, setShippingDetails] = useState({
    recipientName: fullName,
    recipientPhone: userPhone,
    location: profile?.address || "Nairobi, Westlands",
    fullAddress: profile?.address || "Spring Valley Estate, Peponi Road, Building A, Opposite Mall"
  });
  
  const [contactDetails, setContactDetails] = useState({
    fullName: fullName,
    userPhone: userPhone,
    userEmail: userEmail
  });
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('delivery_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();
          
        if (data && !error) {
          const addrRecipient =
            data.full_name ||
            [data.first_name, data.last_name].filter(Boolean).join(' ').trim() ||
            fullName;
          const addrPhone = data.phone_number || data.phone || userPhone;
          const locParts = [data.county, data.city_town || data.town_city].filter(Boolean).join(', ');
          const streetParts = [
            data.area_estate || data.area_location,
            data.street_building,
            data.house_apartment,
            data.landmark
          ].filter(Boolean).join(', ');

          setShippingDetails(prev => ({
            recipientName: addrRecipient || prev.recipientName,
            recipientPhone: addrPhone || prev.recipientPhone,
            location: locParts || prev.location,
            fullAddress: streetParts || prev.fullAddress
          }));
        }
      } catch(err) {
        // ignore
      }
    };
    fetchDefaultAddress();
  }, [user, fullName, userPhone]);

  const [editAddressData, setEditAddressData] = useState(shippingDetails);
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContactData, setEditContactData] = useState(contactDetails);

  // Sync when user/profile loads
  useEffect(() => {
    const resolvedName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.first_name || "";
    const resolvedPhone = profile?.phone || user?.phone || user?.user_metadata?.phone || "";
    const resolvedEmail = user?.email || profile?.email || "";

    setShippingDetails(prev => ({
      ...prev,
      recipientName: !prev.recipientName ? resolvedName : prev.recipientName,
      recipientPhone: !prev.recipientPhone ? resolvedPhone : prev.recipientPhone
    }));
    
    setContactDetails(prev => ({
      ...prev,
      fullName: !prev.fullName ? resolvedName : prev.fullName,
      userPhone: !prev.userPhone ? resolvedPhone : prev.userPhone,
      userEmail: !prev.userEmail ? resolvedEmail : prev.userEmail
    }));
  }, [user, profile]);

  const subtotal = getCartSubtotal();
  const deliveryFee = getDeliveryFee();
  const cartTotal = getCartTotal();

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0 && !isSuccess && !isProcessing) {
      navigate("/cart");
    }
  }, [items, navigate, isSuccess, isProcessing]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    setLoadingText("Connecting to secure checkout...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login to place an order");
        setIsProcessing(false);
        return;
      }

      if (!items || items.length === 0) {
        toast.error("Your cart is empty. Please add items before placing an order.");
        setIsProcessing(false);
        return;
      }

      setLoadingText("Validating inventory and processing...");
      
      // Clean and validate existingOrderId as a UUID
      const cleanExistingOrderId = (activePendingOrderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activePendingOrderId.trim()))
        ? activePendingOrderId.trim()
        : null;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
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
          paymentMethod: 'M-Pesa',
          deliveryMethod: deliveryMethod,
          deliveryFee: deliveryFee,
          existingOrderId: cleanExistingOrderId
        })
      });

      let data: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          throw new Error("Unable to parse order creation response from server. Please try again.");
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON API response from /api/checkout:", response.status, text.slice(0, 300));
        throw new Error(response.status >= 500
          ? "Server error processing checkout. Please try again in a few moments."
          : `Order creation failed (${response.status}). Please check your connection and try again.`);
      }

      if (!response.ok || !data?.orderId) {
        throw new Error(data?.error || (data?.details ? JSON.stringify(data.details) : 'Failed to create order'));
      }

      if (data?.alreadyPaid) {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', data.orderId)
          .maybeSingle();
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', data.orderId);
        setConfirmedOrder({
          success: true,
          status: 'paid',
          orderId: data.orderId,
          order: dbOrder,
          items: items || []
        });
        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
        toast.success("Order has already been confirmed as paid!");
        return;
      }

      const currentOrderId = data.orderId;
      const orderNumber = data.orderNumber || "";
      const authoritativeRef = data.paymentReference || `ord_${currentOrderId}_${Date.now()}`;
      
      setActivePendingOrderId(currentOrderId);
      setActivePaymentReference(authoritativeRef);

      const verifyAndComplete = async (referenceToVerify?: string) => {
        const ref = referenceToVerify || authoritativeRef;
        setIsProcessing(true);
        setPaymentError(null);
        setPaymentPendingNotice(null);
        setLoadingText("Verifying payment with Safaricom M-Pesa & Paystack...");

        const maxAttempts = 10;
        let attempt = 0;

        const pollVerify = async (): Promise<void> => {
          attempt++;
          try {
            // 1. Direct check in Supabase database in case webhook already confirmed it
            const { data: dbOrder } = await supabase
              .from('orders')
              .select('*')
              .eq('id', currentOrderId)
              .maybeSingle();

            if (dbOrder?.payment_status === 'success') {
              const { data: items } = await supabase.from('order_items').select('*').eq('order_id', currentOrderId);
              setConfirmedOrder({
                success: true,
                status: 'paid',
                orderId: currentOrderId,
                order: dbOrder,
                items: items || []
              });
              setIsProcessing(false);
              setIsSuccess(true);
              setPaymentError(null);
              setPaymentPendingNotice(null);
              clearCart();
              toast.success("Payment verified! Order placed successfully.");
              return;
            }

            // 2. Call server-side authoritative verification API
            const verifyResponse = await fetch('/api/checkout/verify', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ orderId: currentOrderId, reference: ref })
            });

            let verifyData: any = null;
            try {
              verifyData = await verifyResponse.json();
            } catch {
              // Ignore non-json and retry
            }

            if (verifyData?.success && verifyData?.status === 'paid') {
              setConfirmedOrder(verifyData);
              setIsProcessing(false);
              setIsSuccess(true);
              setPaymentError(null);
              setPaymentPendingNotice(null);
              clearCart();
              toast.success("Payment verified! Order placed successfully.");
              return;
            }

            // 3. Handle Asynchronous Pending M-Pesa Payments (Prompt sent to user's phone)
            if (verifyData?.retryable || verifyData?.status === 'pending') {
              if (attempt < maxAttempts) {
                setLoadingText(`Waiting for Safaricom M-Pesa confirmation... (${attempt}/${maxAttempts})`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                return pollVerify();
              } else {
                // Max attempts reached while still pending: Inform buyer accurately without declaring failure
                setIsProcessing(false);
                setIsSuccess(false);
                setPaymentPendingNotice(
                  "Your M-Pesa payment is awaiting final network confirmation from Safaricom. If you entered your M-Pesa PIN, your order will automatically be confirmed. You do not need to pay again."
                );
                return;
              }
            }

            // 4. Definite failure returned by gateway (e.g. wrong PIN, declined, cancelled)
            const errorMsg = verifyData?.message || "Payment could not be completed. Your M-Pesa account was not charged.";
            console.error("Payment verification failure response:", verifyData);
            setPaymentError(errorMsg);
            setIsProcessing(false);
            setIsSuccess(false);
            toast.error(errorMsg);
          } catch (e: any) {
            console.error("Verification error during attempt " + attempt + ":", e);
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
              return pollVerify();
            }
            setIsProcessing(false);
            setIsSuccess(false);
            setPaymentPendingNotice(
              "Network verification is taking a moment. If your M-Pesa payment went through, your order will confirm automatically without needing to pay again."
            );
          }
        };

        return pollVerify();
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

      // Format customer email safely
      const rawEmail = (contactDetails.userEmail || user?.email || profile?.email || "").trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : "customer@odamarket.co.ke";
      const cleanTotal = Math.max(1, Math.round((Number(cartTotal) || 0) * 100));

      try {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: validEmail,
          amount: cleanTotal, // in cents/kobo
          currency: 'KES',
          channels: ['mobile_money', 'card'],
          ref: authoritativeRef,
          metadata: {
            order_id: currentOrderId,
            orderId: currentOrderId,
            order_number: orderNumber,
            custom_fields: [
              { display_name: "Order ID", variable_name: "order_id", value: currentOrderId },
              { display_name: "Order Number", variable_name: "order_number", value: orderNumber }
            ]
          },
          onClose: function(){
            toast.info("Payment window was closed. Your cart items are saved and you can retry payment whenever you are ready.");
            setPaymentError("Payment window was closed. Your pending order is saved. Click 'Retry Payment with M-Pesa' when ready.");
            setIsProcessing(false);
          },
          callback: function(response: any){
            const returnedRef = response?.reference || response?.trxref || authoritativeRef;
            if (!returnedRef) {
              toast.error("Payment was not completed or missing reference.");
              setIsProcessing(false);
              return;
            }
            verifyAndComplete(returnedRef);
          }
        });

        if (handler && typeof handler.openIframe === 'function') {
          handler.openIframe();
        } else {
          toast.error("Could not open payment window. Please check your browser settings or try again.");
          setIsProcessing(false);
        }
      } catch (paystackInitErr: any) {
        console.error("Paystack initialization error:", paystackInitErr);
        toast.error("Payment gateway could not be launched. Please try again or refresh the page.");
        setIsProcessing(false);
      }
      
    } catch (err: any) {
      console.error("Checkout submission error:", err);
      const rawMsg = String(err?.message || "");
      const isSyntaxOrPatternErr = rawMsg.includes("did not match the expected pattern") || rawMsg.includes("SyntaxError");
      toast.error(isSyntaxOrPatternErr
        ? "Checkout encountered a temporary browser communication issue. Please retry placing your order."
        : (rawMsg || "Checkout failed. Please try again."));
      setIsProcessing(false);
    }
  };

  const handleCheckPendingStatus = async () => {
    if (!activePendingOrderId) return;
    setIsProcessing(true);
    setLoadingText("Checking order payment status with Safaricom M-Pesa...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Check database first
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', activePendingOrderId)
        .maybeSingle();

      if (dbOrder?.payment_status === 'success') {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', activePendingOrderId);
        setConfirmedOrder({
          success: true,
          status: 'paid',
          orderId: activePendingOrderId,
          order: dbOrder,
          items: items || []
        });
        setIsProcessing(false);
        setIsSuccess(true);
        setPaymentError(null);
        setPaymentPendingNotice(null);
        clearCart();
        toast.success("Payment verified! Your order has been placed.");
        return;
      }

      // Query server verification
      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: activePendingOrderId,
          reference: activePaymentReference || dbOrder?.payment_reference || ''
        })
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (verifyData?.success && verifyData?.status === 'paid') {
        setConfirmedOrder(verifyData);
        setIsProcessing(false);
        setIsSuccess(true);
        setPaymentError(null);
        setPaymentPendingNotice(null);
        clearCart();
        toast.success("Payment confirmed! Your order is being processed.");
        return;
      }

      if (verifyData?.retryable || verifyData?.status === 'pending') {
        setIsProcessing(false);
        setPaymentPendingNotice(
          verifyData?.message || "Payment is still awaiting clearance from Safaricom M-Pesa. Please allow 1-2 minutes."
        );
        toast.info("Payment is still processing on Safaricom M-Pesa network.");
        return;
      }

      setPaymentError(verifyData?.message || "Payment verification failed. Your M-Pesa account was not charged.");
      setIsProcessing(false);
    } catch (e: any) {
      console.error("Check status error:", e);
      setIsProcessing(false);
      toast.error("Could not reach verification server. Please try again in a few moments.");
    }
  };

  const getSubtotal = (priceStr: string, qty: number) => {
    const numPrice = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
    return (numPrice * qty).toLocaleString();
  };


  const getReceiptData = (): OrderReceiptData | null => {
    if (!confirmedOrder) return null;
    const { order, profile, items: orderItems } = confirmedOrder;
    if (!order) return null;
    
    // Attempt to parse notes for delivery info
    let location = shippingDetails.location || "Nairobi, Westlands";
    let address = shippingDetails.fullAddress || "Spring Valley Estate, Peponi Road";
    let orderNumberFromNotes = "";
    let deliveryMethodVal = deliveryMethod || 'standard';
    let parsedContact: any = null;
    let parsedShipping: any = null;
    
    try {
      if (order.notes) {
        const parsed = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        if (parsed.shippingDetails) {
          parsedShipping = parsed.shippingDetails;
          location = parsedShipping.location || location;
          address = parsedShipping.fullAddress || address;
          if (parsedShipping.deliveryMethod) {
            deliveryMethodVal = parsedShipping.deliveryMethod;
          }
        }
        if (parsed.deliveryMethod) {
          deliveryMethodVal = parsed.deliveryMethod;
        }
        if (parsed.contactDetails) {
          parsedContact = parsed.contactDetails;
        }
        if (parsed.orderNumber) {
          orderNumberFromNotes = parsed.orderNumber;
        }
      }
    } catch(e){}

    const cName =
      parsedContact?.fullName ||
      parsedShipping?.recipientName ||
      shippingDetails.recipientName ||
      contactDetails.fullName ||
      (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '') ||
      profile?.full_name ||
      "Valued Customer";

    const cPhone =
      parsedContact?.userPhone ||
      parsedShipping?.recipientPhone ||
      shippingDetails.recipientPhone ||
      contactDetails.userPhone ||
      profile?.phone ||
      profile?.phone_number ||
      userPhone ||
      "N/A";

    const cEmail =
      parsedContact?.userEmail ||
      contactDetails.userEmail ||
      user?.email ||
      profile?.email ||
      userEmail ||
      "";

    // Products list from Supabase order_items or in-memory items
    const itemsList = (orderItems && Array.isArray(orderItems) && orderItems.length > 0)
      ? orderItems.map((i: any) => ({
          product_name: i.product_name || i.name || 'Product',
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
          total_price: Number(i.total_price || (i.unit_price * i.quantity)) || 0,
          product_image: i.product_image || ''
        }))
      : items.map(i => ({
          product_name: i.name || 'Product',
          quantity: i.quantity || 1,
          unit_price: Number(i.price) || 0,
          total_price: (Number(i.price) || 0) * (i.quantity || 1),
          product_image: i.image_url || ''
        }));

    const finalSubtotal = Number(order.subtotal ?? subtotal);
    const finalDeliveryFee = Number(order.delivery_fee ?? deliveryFee);
    const finalDiscount = Number(order.discount || order.discount_amount || 0);
    const finalTotal = Number(order.total || order.grand_total || (finalSubtotal + finalDeliveryFee - finalDiscount));

    const authoritativeTxn =
      order.payment_reference ||
      confirmedOrder.reference ||
      `ord_${order.id}`;

    return {
      order_number: order.order_number || orderNumberFromNotes || `ODA-${order.id.split('-')[0].toUpperCase()}`,
      order_id: order.id,
      created_at: order.created_at || new Date().toISOString(),
      customer_name: cName,
      customer_phone: cPhone,
      customer_email: cEmail,
      items: itemsList,
      subtotal: finalSubtotal,
      delivery_fee: finalDeliveryFee,
      discount: finalDiscount,
      grand_total: finalTotal,
      payment_method: order.payment_method || 'M-Pesa',
      payment_status: (confirmedOrder?.success || order.payment_status === 'paid' || order.payment_status === 'PAID') ? "PAID" : (order.payment_status || "PENDING"),
      delivery_location: location,
      delivery_address: address,
      delivery_method: deliveryMethodVal,
      status: order.status || 'processing',
      transaction_id: authoritativeTxn,
      email_sent: true
    };
  };

  const handleDownloadPdf = async () => {
    const receiptData = getReceiptData();
    if (!receiptData) return;
    setIsDownloadingPdf(true);
    try {
      toast.loading("Generating high-resolution digital receipt PDF...", { id: "pdf-gen" });
      const success = await downloadDigitalReceiptPdf(
        "receipt-printable-container",
        receiptData,
        `ODA-Market-Receipt-${receiptData.order_number}.pdf`
      );
      if (success) {
        toast.success("Digital receipt PDF downloaded successfully!", { id: "pdf-gen" });
      } else {
        toast.error("Failed to generate PDF. Please try again or use Print.", { id: "pdf-gen" });
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to download PDF receipt.", { id: "pdf-gen" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintReceipt = () => {
    try {
      toast.info("Preparing digital receipt for printing...");
      setTimeout(() => {
        window.print();
      }, 250);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to initiate printing. Please check your browser print settings.");
    }
  };

  const handleViewOrder = () => {
    const receiptData = getReceiptData();
    if (receiptData?.order_number || receiptData?.order_id) {
      const targetId = receiptData.order_number || receiptData.order_id;
      navigate(`/track-order?id=${encodeURIComponent(targetId)}`);
    } else {
      navigate("/dashboard/orders");
    }
  };

  const handleResendReceiptEmail = async () => {
    if (!confirmedOrder?.order?.id) return;
    setIsResendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("Please login to resend email receipt.");
        return;
      }
      toast.loading("Dispatching digital receipt to your inbox...", { id: "email-resend" });
      const res = await fetch("/api/checkout/resend-receipt-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: confirmedOrder.order.id })
      });
      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          // Fallback handled below
        }
      }
      if (res.ok && data?.success) {
        setEmailStatusMessage(`Receipt sent to ${data.recipient || "your email"}`);
        toast.success(`Digital receipt dispatched to ${data.recipient || "your email"} via Resend!`, { id: "email-resend" });
      } else {
        toast.error(data?.error || "Failed to dispatch receipt email.", { id: "email-resend" });
      }
    } catch (err: any) {
      console.error("Resend email error:", err);
      toast.error("Network error sending receipt email.", { id: "email-resend" });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleWhatsAppImage = async () => {
    setIsGeneratingWA(true);
    try {
      const el = document.getElementById('receipt-printable-container');
      const orderNumber = confirmedOrder?.order?.order_number || 'Order';
      if (el) {
        try {
          const url = await toPng(el, { pixelRatio: 2, backgroundColor: '#FFFDF8' });
          const a = document.createElement('a');
          a.href = url;
          a.download = `ODA-Market-Receipt-${orderNumber}.png`;
          a.click();
        } catch (imgErr) {
          console.warn("Could not capture PNG for WhatsApp:", imgErr);
        }
      }

      toast.success("Opening WhatsApp with your receipt...", { duration: 3000 });
      setTimeout(() => {
        const text = `Hello ODA Market, I have completed payment for Order ${orderNumber}. Please find my order receipt details.`;
        const waUrl = getWhatsAppUrl(text);
        const a = document.createElement('a');
        a.href = waUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 1000);
    } catch(e) {
      console.error(e);
      toast.error("Failed to generate WhatsApp link");
    } finally {
      setIsGeneratingWA(false);
    }
  };

  if (isSuccess) {
    const receiptData = getReceiptData();

    return (
      <div className="min-h-screen bg-[#ECEEF2] py-8 sm:py-12 px-3 sm:px-4 flex flex-col items-center justify-start">
        {receiptData ? (
          <ThermalPrinter
            receiptData={receiptData}
            onDownloadPdf={handleDownloadPdf}
            onPrintReceipt={handlePrintReceipt}
            onViewOrder={handleViewOrder}
            onResendEmail={handleResendReceiptEmail}
            onWhatsAppShare={handleWhatsAppImage}
            onContinueShopping={() => navigate("/products")}
            isDownloadingPdf={isDownloadingPdf}
            isResendingEmail={isResendingEmail}
            emailStatusMessage={emailStatusMessage}
          />
        ) : (
          <div className="w-full max-w-[390px] mx-auto p-8 bg-white border border-neutral-300 rounded shadow-sm text-center font-mono text-xs text-neutral-500">
            <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading receipt data...
          </div>
        )}
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
          <Link to="/" className="hover:text-[slate-900]">{t('nav.home', 'Home')}</Link>
          <span>&gt;</span>
          <Link to="/cart" className="hover:text-[slate-900]">{t('nav.cart', 'Cart')}</Link>
          <span>&gt;</span>
          <span className="text-[slate-900] font-medium">{t('checkout.title', 'Checkout')}</span>
        </div>

        {/* Checkout Progress */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#C65A28] text-white flex items-center justify-center font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[slate-900] font-bold text-[15px]">{t('nav.cart', 'Cart')}</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-[#C65A28] shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[slate-900] text-white flex items-center justify-center font-bold text-[14px]">
                2
              </div>
              <span className="text-[slate-900] font-bold text-[15px]">{t('checkout.title', 'Checkout')}</span>
            </div>
            <div className="w-8 sm:w-12 h-[2px] bg-[#E5E7EB] shrink-0" />
            <div className="flex items-center gap-2 shrink-0 opacity-50">
              <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border-2 border-[#E5E7EB] text-[#6B7280] flex items-center justify-center font-bold text-[14px]">
                3
              </div>
              <span className="text-[#6B7280] font-bold text-[15px]">{language === 'sw' ? 'Agizo Limekamilika' : 'Order Complete'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#C65A28] bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0] shrink-0 self-start md:self-auto">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-[13px]">{t('cart.secure_checkout', 'Secure Checkout')}</span>
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
                  {!isEditingDeliveryMethod ? (
                    <>
                      <div>
                        <div className="flex items-center gap-2 text-[#6B7280] text-[14px] font-medium mb-2">
                          <Truck className="w-5 h-5" /> Delivery Method
                        </div>
                        <p className="text-[slate-900] font-bold text-[16px]">
                          {deliveryMethod === 'express' ? 'Express' : deliveryMethod === 'pickup' ? 'Pickup' : 'Standard Delivery'}
                        </p>
                        <p className="text-[#6B7280] text-[14px] mt-1">
                          {deliveryMethod === 'express' ? 'Estimated Today' : deliveryMethod === 'pickup' ? 'Pickup at store' : 'Estimated Tomorrow'}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={deliveryFee > 0 ? "text-[slate-900] font-bold text-[16px] mb-1" : "text-[#C65A28] font-bold text-[16px] mb-1"}>
                          {deliveryFee > 0 ? `Ksh ${deliveryFee.toLocaleString()}` : "FREE"}
                        </span>
                        <button 
                          onClick={() => setIsEditingDeliveryMethod(true)}
                          className="text-[slate-900] font-bold text-[14px] hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 text-[#6B7280] text-[14px] font-medium">
                          <Truck className="w-5 h-5" /> Select Delivery Method
                        </div>
                        <button 
                          onClick={() => setIsEditingDeliveryMethod(false)}
                          className="text-[#C65A28] font-bold text-[13px] hover:underline"
                        >
                          Done
                        </button>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-[#F8FAFC]">
                        <input 
                          type="radio" 
                          name="checkoutDeliveryMethod" 
                          value="standard"
                          checked={deliveryMethod === 'standard'}
                          onChange={() => {
                            setDeliveryMethod('standard');
                            setIsEditingDeliveryMethod(false);
                          }}
                          className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[slate-900] font-bold text-[14px]">Standard Delivery</span>
                            <span className="text-[#C65A28] font-bold text-[14px]">FREE</span>
                          </div>
                          <span className="text-[#6B7280] text-[12px]">Estimated Tomorrow</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-[#F8FAFC]">
                        <input 
                          type="radio" 
                          name="checkoutDeliveryMethod" 
                          value="express"
                          checked={deliveryMethod === 'express'}
                          onChange={() => {
                            setDeliveryMethod('express');
                            setIsEditingDeliveryMethod(false);
                          }}
                          className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[slate-900] font-bold text-[14px]">Express</span>
                            <span className="text-[slate-900] font-bold text-[14px]">Ksh 250</span>
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-[#F8FAFC]">
                        <input 
                          type="radio" 
                          name="checkoutDeliveryMethod" 
                          value="pickup"
                          checked={deliveryMethod === 'pickup'}
                          onChange={() => {
                            setDeliveryMethod('pickup');
                            setIsEditingDeliveryMethod(false);
                          }}
                          className="mt-1 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[slate-900] font-bold text-[14px]">Pickup</span>
                            <span className="text-[#C65A28] font-bold text-[14px]">FREE</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Payment Method */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <h2 className="text-[slate-900] font-bold text-[20px] mb-6">4. Payment Method</h2>
              
              {/* Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                {/* Credit / Debit Card (Coming Soon) */}
                <div className="border border-[#E5E7EB] bg-[#F8FAFC] opacity-75 rounded-[16px] p-6 relative cursor-not-allowed select-none">
                  <div className="absolute top-0 right-0 bg-[#E5E7EB] text-[#6B7280] px-3 py-1 rounded-bl-[12px] font-bold text-[11px] uppercase tracking-wider">
                    Coming Soon
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-[12px] shadow-sm flex items-center justify-center shrink-0 text-[#9CA3AF]">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-slate-700 font-bold text-[18px]">Credit / Debit Card</h3>
                      <p className="text-[#6B7280] text-[13px] leading-tight mt-1">Visa, Mastercard & Verve</p>
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

            {/* Payment Pending Notice Banner for Asynchronous M-Pesa clearance */}
            {paymentPendingNotice && (
              <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-sm">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-950 mb-1">M-Pesa Authorization Pending</p>
                    <p className="text-amber-800 leading-relaxed">{paymentPendingNotice}</p>
                    <p className="text-xs text-amber-700 font-medium mt-1">
                      ⚠️ Do NOT pay again if your M-Pesa balance was already deducted. Your order will confirm automatically.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckPendingStatus}
                  disabled={isProcessing}
                  className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  Check Status
                </button>
              </div>
            )}

            {/* Payment Error Banner if verification definitely failed */}
            {paymentError && !paymentPendingNotice && (
              <div className="bg-rose-50 border border-rose-200 rounded-[16px] p-4 flex items-start gap-3 text-rose-800">
                <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold mb-1">Payment Unsuccessful</p>
                  <p className="text-rose-700">{paymentError}</p>
                  <p className="text-xs text-rose-600 mt-2">
                    Your items are safely retained. Click below to retry payment securely.
                  </p>
                </div>
              </div>
            )}

            {/* Place Order or Check Status Button */}
            {paymentPendingNotice ? (
              <div className="space-y-3">
                <button 
                  onClick={handleCheckPendingStatus}
                  disabled={isProcessing}
                  className="w-full h-[64px] bg-amber-600 hover:bg-amber-700 text-white rounded-[16px] font-bold text-[18px] flex items-center justify-center gap-3 transition-colors shadow-lg shadow-amber-600/20 hover:scale-[1.01] transform duration-300 disabled:opacity-70 disabled:hover:scale-100"
                >
                  <RefreshCw className={`w-6 h-6 ${isProcessing ? 'animate-spin' : ''}`} /> Check M-Pesa Payment Status
                </button>
                <div className="text-center">
                  <button
                    onClick={() => {
                      setPaymentPendingNotice(null);
                      setPaymentError(null);
                      handlePlaceOrder();
                    }}
                    className="text-xs text-[#6B7280] hover:text-[#C65A28] underline transition-colors"
                  >
                    Didn't receive STK prompt? Start a fresh M-Pesa payment
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handlePlaceOrder}
                disabled={items.length === 0 || isProcessing}
                className="w-full h-[64px] bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-[16px] font-bold text-[20px] flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#C65A28]/20 hover:scale-[1.01] transform duration-300 disabled:opacity-70 disabled:hover:scale-100"
              >
                <Lock className="w-6 h-6" /> {activePendingOrderId ? "Retry Payment with M-Pesa" : "Place Order with M-Pesa"}
              </button>
            )}

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
                    <span className="text-[slate-900] font-bold">Ksh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[#6B7280]">Delivery</span>
                    <span className={deliveryFee > 0 ? "text-[slate-900] font-bold" : "text-[#C65A28] font-bold"}>
                      {deliveryFee > 0 ? `Ksh ${deliveryFee.toLocaleString()}` : "FREE"}
                    </span>
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

                {deliveryFee === 0 ? (
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[12px] p-3 text-center mb-2 flex items-center justify-center gap-2">
                    <PackageCheck className="w-5 h-5 text-[#C65A28]" />
                    <span className="text-[slate-900] font-bold text-[14px]">🎉 You're getting FREE Delivery</span>
                  </div>
                ) : (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] p-3 text-center mb-2 flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5 text-[#C65A28]" />
                    <span className="text-[slate-900] font-bold text-[14px]">⚡ Express Delivery (Ksh {deliveryFee.toLocaleString()})</span>
                  </div>
                )}
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
