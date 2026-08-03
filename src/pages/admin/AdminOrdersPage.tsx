import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Filter, MoreVertical, Eye, Download, Printer, 
  CheckCircle, Clock, XCircle, Truck, Inbox, Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
    
    

    
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select('*, profiles:user_id(full_name, email)', { count: 'exact' });

      // Search by order ID is possible, but ilike on UUID might fail. Let's just filter by status for now if UUID is complex, or let search handle it.
      if (search) {
        query = query.ilike('id', `%${search}%`);
      }

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredOrders = orders;

  const tabs = [
    { id: 'all', label: 'All Orders', count: totalCount },
    { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-[#E8DCC9] text-[#C65A28]';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'cancelled': return 'bg-[#B94A48]/10 text-[#B94A48]';
      case 'pending':
      default: return 'bg-[#D9A62E]/10 text-[#D9A62E]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Orders</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage and track customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="border-b border-[#E8DCC9] px-2 flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-[#C65A28] text-[#C65A28]" 
                  : "border-transparent text-[#5F5A54] hover:text-[#5F5A54] hover:border-slate-300"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                activeTab === tab.id ? "bg-[#C65A28]/10 text-[#C65A28]" : "bg-[#E8DCC9] text-[#5F5A54]"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FAF5EC]/50 border-b border-[#E8DCC9]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B857D]" />
            <input
              type="text"
              placeholder="Search by order ID, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] transition-all shadow-sm text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm">
              <CalendarIcon className="w-4 h-4" />
              Date Range
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#F3F6F4] border-b border-[#C65A28]/20 px-4 py-3 flex items-center gap-3 overflow-hidden"
            >
              <span className="text-sm font-semibold text-[#C65A28]">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-[#C65A28]/20"></div>
              <button className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418]">Mark as Processing</button>
              <button className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418]">Mark as Shipped</button>
              <button className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418]">Print Packing Slips</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF5EC] border-b border-[#E8DCC9]">
                <th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                  />
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Order</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C65A28] mx-auto mb-4"></div>
                    <p className="text-[#5F5A54] font-medium">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 bg-[#E8DCC9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Inbox className="w-8 h-8 text-[#8B857D]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#3A2418] mb-1">No orders found</h3>
                    <p className="text-[#5F5A54] max-w-sm mx-auto mb-6">We couldn't find any orders matching your filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={cn("hover:bg-[#FAF5EC] transition-colors group", selectedIds.includes(order.id) && "bg-[#F3F6F4]/50")}>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(order.id)}
                        onChange={() => handleSelect(order.id)}
                        className="rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/admin/dashboard/orders/${order.id}`} className="font-semibold text-[#3A2418] hover:text-[#C65A28]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#5F5A54]">
                      {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#3A2418]">{order.profiles?.full_name || 'Guest'}</span>
                        <span className="text-xs text-[#5F5A54]">{order.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                        getStatusColor(order.status)
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-[#3A2418] text-right">
                      KSh {Number(order.grand_total).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                         <Link to={`/admin/dashboard/orders/${order.id}`} className="p-2 text-[#8B857D] hover:text-[#C65A28] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="View details">
                           <Eye className="w-4 h-4" />
                         </Link>
                         <button className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="Print invoice">
                           <Printer className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-[#E8DCC9] p-4 flex items-center justify-between text-sm text-[#5F5A54] bg-[#FAF5EC]">
          <div>Showing {orders.length} orders</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-[#E8DCC9] rounded-md bg-[#FFFDF8] hover:bg-[#FAF5EC] disabled:opacity-50">Previous</button>
            <button className="px-3 py-1.5 border border-[#E8DCC9] rounded-md bg-[#FFFDF8] hover:bg-[#FAF5EC] disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
