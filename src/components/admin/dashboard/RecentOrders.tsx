import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { ShoppingBag, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';

export default function RecentOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    

    
  }, [queryClient]);

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
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-[#E8DCC9]">
        <div>
          <h2 className="text-lg font-bold text-[#3A2418]">Recent Orders</h2>
          <p className="text-sm text-[#5F5A54]">Latest transactions in real-time</p>
        </div>
        <Link to="/admin/dashboard/orders" className="text-sm font-semibold text-[#C65A28] hover:underline">
          View All
        </Link>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#C65A28] animate-spin" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF5EC] border-b border-[#E8DCC9]">
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Customer</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-center">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF5EC] transition-colors">
                  <td className="py-3 px-6">
                    <span className="font-semibold text-[#3A2418] text-sm">#{order.id.substring(0, 8).toUpperCase()}</span>
                    <div className="text-xs text-[#5F5A54]">{format(new Date(order.created_at), 'MMM d, h:mm a')}</div>
                  </td>
                  <td className="py-3 px-6">
                    <p className="text-sm font-medium text-[#3A2418]">{(order.profiles as any)?.full_name || 'Guest'}</p>
                    <p className="text-xs text-[#5F5A54]">{(order.profiles as any)?.email}</p>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <p className="text-sm font-bold text-[#3A2418]">KSh {Number(order.grand_total).toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Link to={`/admin/dashboard/orders/${order.id}`} className="inline-flex p-1.5 text-[#8B857D] hover:text-[#C65A28] hover:bg-[#C65A28]/10 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-[#8B857D]">
            <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No recent orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
