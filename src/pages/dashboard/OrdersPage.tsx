import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { Package, Search, ExternalLink, RefreshCcw, Download, Clock, Truck, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
        
      if (data) {
        setOrders(data);
      } else {
        // Mock data if table doesn't exist
        setOrders([
          { id: 'ORD-2023-1045', status: 'shipped', grand_total: 4500, created_at: new Date().toISOString(), items_count: 5 },
          { id: 'ORD-2023-1044', status: 'delivered', grand_total: 1250, created_at: new Date(Date.now() - 86400000).toISOString(), items_count: 2 },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'out_for_delivery': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
                  <p className="font-medium text-sm">Ksh {order.grand_total?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Download className="w-3 h-3 mr-1" /> Invoice
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
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(order.status)}`}>
                  {order.status === 'delivered' ? <Check className="w-3 h-3" /> : 
                   order.status === 'shipped' ? <Truck className="w-3 h-3" /> : 
                   <Clock className="w-3 h-3" />}
                  {order.status?.toUpperCase() || 'PENDING'}
                </div>
                <h3 className="font-semibold">{order.items_count || 1} items in this order</h3>
                <p className="text-sm text-muted-foreground mt-1">Paid via {order.payment_method || 'M-Pesa'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-primary border-primary hover:bg-primary/5">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Buy Again
                </Button>
                {order.status === 'delivered' && (
                  <Button variant="outline" className="w-full sm:w-auto">
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
      </div>
    </div>
  );
}
