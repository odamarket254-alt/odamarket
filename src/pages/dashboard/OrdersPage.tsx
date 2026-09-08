import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Package, Star, X, Search, ExternalLink, RefreshCcw, Download, Clock, Truck, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { toast } from "sonner";
import { generateInvoice } from "../../utils/generateInvoice";

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  
  // Rate Products State
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);
  const [ratingItems, setRatingItems] = useState<any[]>([]);
  const [isLoadingRatingItems, setIsLoadingRatingItems] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { rating: number, comment: string }>>({});
  const [isSubmittingRatings, setIsSubmittingRatings] = useState(false);
  const [buyingAgainId, setBuyingAgainId] = useState<string | null>(null);


  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check if orders table exists, if so fetch from it
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (data) {
        setOrders(data);
      } else {
        // Mock data if table doesn't exist
        setOrders([
          { id: 'ORD-2023-1045', status: 'shipped', total: 4500, created_at: new Date().toISOString(), items_count: 5 },
          { id: 'ORD-2023-1044', status: 'delivered', total: 1250, created_at: new Date(Date.now() - 86400000).toISOString(), items_count: 2 },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  
  
  const handleBuyAgain = async (order: any) => {
    setBuyingAgainId(order.id);
    toast.loading("Adding items to cart...", { id: 'buy-again' });
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        items.forEach(item => {
          addItem({
            id: item.product_id,
            name: item.product_name || "Unknown Product",
            price: item.unit_price?.toString() || "0",
            image_url: item.product_image || ""
          }, item.quantity || 1);
        });
        toast.success("Items added to your cart!", { id: 'buy-again' });
        navigate('/cart');
      } else {
         toast.error("No items found to buy again.", { id: 'buy-again' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add items to cart", { id: 'buy-again' });
    } finally {
      setBuyingAgainId(null);
    }
  };

  const handleOpenRateModal = async (order: any) => {
    setRatingOrder(order);
    setIsLoadingRatingItems(true);
    setRatings({});
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      if (error) throw error;
      setRatingItems(data || []);
    } catch (err) {
      toast.error("Failed to load items");
      setRatingOrder(null);
    } finally {
      setIsLoadingRatingItems(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [productId]: { ...prev[productId], rating } }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setRatings(prev => ({ ...prev, [productId]: { ...prev[productId], comment } }));
  };

  const handleSubmitRatings = async () => {
    const reviewsToSubmit = Object.keys(ratings).filter(pid => ratings[pid]?.rating > 0).map(pid => ({
      product_id: pid,
      user_id: user?.id,
      order_id: ratingOrder?.id,
      rating: ratings[pid].rating,
      comment: ratings[pid].comment || "",
      is_approved: true
    }));

    if (reviewsToSubmit.length === 0) {
      toast.error("Please provide at least one rating to submit.");
      return;
    }

    setIsSubmittingRatings(true);
    try {
      const { error } = await supabase.from('reviews').insert(reviewsToSubmit);
      if (error) throw error;
      toast.success("Thank you for your reviews!");
      setRatingOrder(null);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23503') {
        toast.error("One of the products no longer exists in our catalog.");
      } else {
        toast.error("Failed to submit reviews. Please try again.");
      }
    } finally {
      setIsSubmittingRatings(false);
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    setDownloadingOrderId(order.id);
    toast.loading("Generating invoice...");
    try {
      const success = await generateInvoice(order);
      toast.dismiss();
      if (success) {
        toast.success("Invoice downloaded successfully!");
      } else {
        toast.error("Failed to generate invoice. Please try again.");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to generate invoice");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'failed' || paymentStatus === 'abandoned') return 'bg-red-100 text-red-700';
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'out_for_delivery': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisplayStatus = (order: any) => {
    if (order.payment_status === 'failed') return 'Payment Failed';
    if (order.payment_status === 'abandoned') return 'Payment Abandoned';
    if (order.status === 'pending') return 'Payment Pending';
    return order.status ? order.status.replace(/_/g, ' ') : 'Unknown';
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><RefreshCcw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search order ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <Card key={order.id} className="p-0 overflow-hidden">
            <div className="bg-muted/30 px-4 md:px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                  <p className="font-semibold text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date Placed</p>
                  <p className="font-medium text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="font-medium text-sm">Ksh {order.total?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => handleDownloadInvoice(order)}
                  disabled={downloadingOrderId === order.id}
                >
                  {downloadingOrderId === order.id ? (
                    <span className="animate-spin mr-1 text-xs">⏳</span>
                  ) : (
                    <Download className="w-3 h-3 mr-1" />
                  )}
                  Invoice
                </Button>
                <Link to={`/buyer/dashboard/track?id=${order.id}`}>
                  <Button size="sm" className="h-8 text-xs">
                    Track Order
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(order.status, order.payment_status)}`}>
                  {order.status === 'delivered' ? <Check className="w-3 h-3" /> : 
                   order.status === 'shipped' ? <Truck className="w-3 h-3" /> : 
                   <Clock className="w-3 h-3" />}
                  {getDisplayStatus(order).toUpperCase()}
                </div>
                <h3 className="font-semibold">{order.items_count || 1} items in this order</h3>
                <p className="text-sm text-muted-foreground mt-1">Paid via {order.payment_method || 'M-Pesa'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={() => handleBuyAgain(order)} disabled={buyingAgainId === order.id} className="w-full sm:w-auto text-primary border-primary hover:bg-primary/5">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Buy Again
                </Button>
                {order.status === 'delivered' && (
                  <Button variant="outline" onClick={() => handleOpenRateModal(order)} className="w-full sm:w-auto">
                    Rate Products
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )) : (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Link to="/products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      
      {/* Rate Products Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg">Rate Your Items</h2>
              <button onClick={() => setRatingOrder(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingRatingItems ? (
                <div className="flex justify-center py-8"><span className="animate-spin text-primary">⏳</span> Loading items...</div>
              ) : ratingItems.length > 0 ? (
                <div className="space-y-6">
                  {ratingItems.map(item => (
                    <div key={item.product_id} className="border border-gray-100 rounded-lg p-4 shadow-sm">
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400 m-auto mt-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.product_name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">KSh {item.unit_price?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => handleRatingChange(item.product_id, star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={`w-6 h-6 ${(ratings[item.product_id]?.rating || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                      
                      <textarea
                        placeholder="What did you think of this product?"
                        className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        rows={2}
                        value={ratings[item.product_id]?.comment || ""}
                        onChange={(e) => handleCommentChange(item.product_id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No items found for this order.</p>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRatingOrder(null)}>Cancel</Button>
              <Button 
                onClick={handleSubmitRatings} 
                disabled={isSubmittingRatings || isLoadingRatingItems || ratingItems.length === 0}
              >
                {isSubmittingRatings ? "Submitting..." : "Submit Ratings"}
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
