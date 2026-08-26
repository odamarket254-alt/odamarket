import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Package, Search, ChevronRight, CheckCircle2, Clock, Truck, FileText, AlertCircle, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";


export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setError("Please enter your Order ID");
      return;
    }

    setIsLoading(true);
    setError("");
    setOrder(null);
    setOrderItems([]);

    try {
      // Basic security check: We require either phone or email match, but since we don't know the exact schema 
      // (whether it's user_id, contact_email, phone), we will try to fetch the order and verify if it matches user input if provided.
      // But let's first query by ID. If it's a UUID, we query id. If it's a short string, we might need to query id.ilike.
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      
      let query = supabase.from("orders").select("*");
      if (isUuid) {
        query = query.eq("id", orderId);
      } else {
        query = query.ilike("notes", `%${orderId.trim()}%`);
      }

      const { data, error: fetchError } = await query.limit(1).single();

      if (fetchError || !data) {
        // If order_number failed, they might have entered the short part of the UUID. 
        // We cannot ilike a UUID safely from JS without rpc, so we will show an error.
        setError("Order not found. Please enter a valid full Order ID or Order Number.");
        setIsLoading(false);
        return;
      }
      
      if (data.payment_status === 'failed') {
        setError("This order's payment failed. Please place a new order.");
        setIsLoading(false);
        return;
      }
      
      if (data.payment_status === 'abandoned') {
        setError("This order's payment was not completed. Please place a new order.");
        setIsLoading(false);
        return;
      }

      setOrder(data);

      // Fetch items
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", data.id);
        
      if (items) {
        setOrderItems(items);
      }

    } catch (err: any) {
      console.error(err);
      setError("An error occurred while tracking your order.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === 'cancelled' || s === 'refunded') return -1;
    if (s === 'delivered') return 4;
    if (s === 'out for delivery' || s === 'out_for_delivery') return 3;
    if (s === 'shipped' || s === 'ready for delivery') return 2;
    if (s === 'processing' || s === 'confirmed') return 1;
    return 0; // pending / placed
  };

  const statusStep = order ? getStatusStep(order.status) : 0;
  const isCancelled = statusStep === -1;

  const steps = [
    { title: "Order Placed", icon: FileText },
    { title: "Processing", icon: Clock },
    { title: "Ready / Shipped", icon: Package },
    { title: "Out for Delivery", icon: Truck },
    { title: "Delivered", icon: CheckCircle2 }
  ];

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3A2418] mb-3">Track Your Order</h1>
          <p className="text-[#5F5A54] max-w-xl mx-auto">
            Enter your order number to check the current status of your delivery.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E8DCC9] mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
              <input
                type="text"
                placeholder="Order Number (e.g., ORD-12345)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF5EC] border border-[#E8DCC9] rounded-xl text-[#3A2418] focus:outline-none focus:border-[#C65A28] focus:ring-1 focus:ring-[#C65A28]"
              />
            </div>
            {/* Optional field if needed by business rules 
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
              <input
                type="text"
                placeholder="Phone Number or Email"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF5EC] border border-[#E8DCC9] rounded-xl text-[#3A2418] focus:outline-none focus:border-[#C65A28] focus:ring-1 focus:ring-[#C65A28]"
              />
            </div> */}
            <button
              type="submit"
              disabled={isLoading || !orderId}
              className="bg-[#C65A28] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#A84A1E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Track Order</>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Order Results */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Tracker */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E8DCC9]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#3A2418]">Order #{order.id?.split('-')[0] || order.id}</h2>
                  <p className="text-[#5F5A54] text-sm mt-1">
                    Placed on {order.created_at ? format(new Date(order.created_at), 'MMMM d, yyyy h:mm a') : 'Unknown date'}
                  </p>
                </div>
                <div className="px-4 py-2 bg-[#FAF5EC] text-[#C65A28] font-bold rounded-lg uppercase tracking-wider text-sm border border-[#E8DCC9]">
                  {order.status || 'Pending'}
                </div>
              </div>

              {isCancelled ? (
                <div className="p-6 bg-red-50 text-red-800 rounded-xl flex items-center gap-3 border border-red-100">
                  <XCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold">Order Cancelled</h3>
                    <p className="text-sm">This order has been cancelled. Please contact support if you need assistance.</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-[#FAF5EC] md:hidden z-0"></div>
                  <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 relative z-10">
                    {steps.map((step, idx) => {
                      const isActive = statusStep >= idx;
                      const Icon = step.icon;
                      
                      return (
                        <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 flex-1 md:text-center group">
                          {/* Desktop Line Connector */}
                          {idx !== 0 && (
                            <div className={`hidden md:block absolute top-5 left-[calc(${idx * 25}%-50%)] w-full h-1 -z-10 transition-colors duration-500 ${isActive ? 'bg-[#C65A28]' : 'bg-[#FAF5EC]'}`} />
                          )}
                          
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 border-4 ${isActive ? 'bg-[#C65A28] border-white text-white shadow-md' : 'bg-[#FAF5EC] border-white text-[#8B857D]'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="md:mt-2">
                            <span className={`text-sm font-bold ${isActive ? 'text-[#3A2418]' : 'text-[#8B857D]'}`}>
                              {step.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC9]">
                <h3 className="font-bold text-[#3A2418] mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#C65A28]" /> Order Items
                </h3>
                
                {orderItems.length > 0 ? (
                  <div className="divide-y divide-[#E8DCC9]">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="py-4 flex gap-4 items-center">
                        {item.product_image_url ? (
                          <div className="w-16 h-16 bg-[#FAF5EC] rounded-lg border border-[#E8DCC9] overflow-hidden shrink-0">
                            <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-[#FAF5EC] rounded-lg border border-[#E8DCC9] flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-[#8B857D]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#3A2418] font-medium truncate">{item.product_name || `Product #${item.product_id}`}</h4>
                          <p className="text-sm text-[#5F5A54]">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-[#3A2418]">
                          KSh {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5F5A54] italic">Item details not available.</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC9] flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-[#3A2418] mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#5F5A54]">Items Total</span>
                      <span className="font-medium text-[#3A2418]">KSh {(order.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5F5A54]">Delivery Fee</span>
                      <span className="font-medium text-[#3A2418]">{order.total_amount >= 5000 ? 'Free' : 'Calculated at checkout'}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#E8DCC9] flex justify-between">
                      <span className="font-bold text-[#3A2418]">Total</span>
                      <span className="font-bold text-[#C65A28] text-lg">KSh {(order.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {order.shipping_address && (
                  <div>
                    <h3 className="font-bold text-[#3A2418] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C65A28]" /> Delivery Info
                    </h3>
                    <p className="text-sm text-[#5F5A54] leading-relaxed">
                      {order.shipping_address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
