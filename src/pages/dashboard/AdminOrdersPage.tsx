import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Filter, MoreVertical, Eye, FileText, Download,
  CheckCircle2, Clock, Truck, Package, XCircle, AlertCircle, Store
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { OrderDetailsModal } from '../../components/admin/orders/OrderDetailsModal';
import { toast } from 'sonner';
import { notifyOrderStatusChange } from '../../services/notificationService';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Realtime subscription for new orders
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast.info('New order received: #' + payload.new.id.split('-')[0].toUpperCase());
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error && error.code !== '42P01') throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error("Error fetching order items:", err);
      toast.error("Failed to load ordered products");
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles(id, first_name, last_name, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error; // Ignore table not found for now if user hasn't created it
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const existingOrder = orders.find((o) => o.id === id);
      if (existingOrder && existingOrder.status?.toLowerCase() === status.toLowerCase()) {
        toast.info(`Order is already marked as ${status.replace(/_/g, ' ')}`);
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // Optimistically update order in state
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

      // Trigger automatic customer notification
      if (existingOrder?.user_id) {
        await notifyOrderStatusChange({
          orderId: id,
          userId: existingOrder.user_id,
          newStatus: status,
          oldStatus: existingOrder.status,
          orderNumber: existingOrder.order_number
        });
      }

      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id?.toLowerCase().includes(search.toLowerCase()) || 
                          o.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': 
        return { icon: Clock, color: 'text-[#D9A62E]', bg: 'bg-[#D9A62E]/10' };
      case 'confirmed': 
        return { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' };
      case 'processing':
      case 'packed': 
        return { icon: Package, color: 'text-indigo-700', bg: 'bg-indigo-100' };
      case 'ready_for_pickup':
        return { icon: Store, color: 'text-amber-700', bg: 'bg-amber-100' };
      case 'out_for_delivery':
      case 'shipped': 
        return { icon: Truck, color: 'text-blue-700', bg: 'bg-blue-100' };
      case 'delivered': 
        return { icon: CheckCircle2, color: 'text-emerald-800', bg: 'bg-emerald-100' };
      case 'cancelled': 
        return { icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100' };
      default: 
        return { icon: AlertCircle, color: 'text-[#5F5A54]', bg: 'bg-[#FAF5EC]' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3A2418] dark:text-white tracking-tight">Orders</h1>
          <p className="text-[#5F5A54] dark:text-[#8B857D] mt-1">Manage and track customer orders.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center justify-center rounded-xl bg-[#FFFDF8] dark:bg-[#3A2418] border border-[#E8DCC9] dark:border-slate-700 px-4 py-2 text-sm font-medium text-[#5F5A54] dark:text-[#8B857D] shadow-sm hover:bg-[#FAF5EC] dark:hover:bg-slate-700/50 transition-colors">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#FFFDF8] dark:bg-[#3A2418] rounded-[18px] shadow-sm border border-[#E8DCC9] dark:border-slate-700/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E8DCC9] dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['all', 'pending', 'confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors",
                  statusFilter === status 
                    ? "bg-[#E8DCC9] dark:bg-slate-700 text-[#3A2418] dark:text-white"
                    : "text-[#5F5A54] dark:text-[#8B857D] hover:bg-[#FAF5EC] dark:hover:bg-slate-700/50"
                )}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B857D] group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-lg bg-[#FAF5EC] dark:bg-[#3A2418] border border-[#E8DCC9] dark:border-slate-700 focus:bg-[#FFFDF8] dark:focus:bg-[#3A2418] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full transition-all outline-none text-sm text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
              />
            </div>
            <button className="p-2.5 rounded-lg border border-[#E8DCC9] dark:border-slate-700 text-[#5F5A54] hover:bg-[#FAF5EC] dark:hover:bg-slate-700/50 transition-colors">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF5EC]/50 dark:bg-[#3A2418]/50 text-xs uppercase tracking-wider text-[#5F5A54] dark:text-[#8B857D] font-semibold border-b border-[#E8DCC9] dark:border-slate-700/50">
                <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-[#C65A28] focus:ring-blue-500 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" /></th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#5F5A54]">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-[#8B857D] mb-3" />
                      <h3 className="text-lg font-medium text-[#3A2418] dark:text-white">No orders found</h3>
                      <p className="text-[#5F5A54] mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusConf = getStatusConfig(order.status);
                  const StatusIcon = statusConf.icon;
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EC] dark:hover:bg-[#3A2418]/50 transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-[#C65A28] focus:ring-blue-500 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" /></td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#C65A28] dark:text-blue-400 cursor-pointer">
                          #{order.id.slice(0,8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#3A2418] dark:text-white">{order.customer?.first_name || 'Guest User'}</span>
                          <span className="text-xs text-[#5F5A54]">{order.customer?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#5F5A54] dark:text-[#8B857D]">
                          {format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize", statusConf.bg, statusConf.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#3A2418] dark:text-white">
                          KSh {Number(order.total || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleViewOrder(order)} className="p-1.5 rounded-md hover:bg-[#E8DCC9] dark:hover:bg-slate-700 text-[#5F5A54] transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-[#E8DCC9] dark:hover:bg-slate-700 text-[#5F5A54] transition-colors" title="Print Invoice">
                            <FileText className="h-4 w-4" />
                          </button>
                          <div className="relative group/menu">
                            <button className="p-1.5 rounded-md hover:bg-[#E8DCC9] dark:hover:bg-slate-700 text-[#5F5A54] transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-44 bg-[#FFFDF8] dark:bg-[#3A2418] rounded-lg shadow-xl border border-[#E8DCC9] dark:border-slate-700 hidden group-hover/menu:block z-10">
                              <div className="py-1">
                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => (
                                  <button 
                                    key={s}
                                    onClick={() => updateOrderStatus(order.id, s)}
                                    className="w-full text-left px-4 py-2 text-xs capitalize hover:bg-[#FAF5EC] dark:hover:bg-slate-700 text-[#5F5A54] dark:text-[#8B857D]"
                                  >
                                    Mark as {s.replace(/_/g, ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
          </div>
        <OrderDetailsModal 
          isOpen={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          order={selectedOrder} 
          orderItems={orderItems} 
          loadingItems={loadingItems} 
        />
      </div>
    );
  }
  