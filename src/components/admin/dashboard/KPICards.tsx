import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { 
  TrendingUp, Users, Package, ShoppingBag, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, Truck, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const fetchKPIData = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: todayOrders },
    { count: pendingOrders },
    { count: completedOrders },
    { count: cancelledOrders },
    { count: todayCustomers },
    { count: totalProducts },
    { count: totalSuppliers },
    { data: revenueData },
    { data: lowStockData }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier'),
    supabase.from('orders').select('total_amount').limit(100).gte('created_at', today.toISOString()),
    supabase.from('products').select('stock, low_stock_threshold').limit(100)
  ]);

  const todayRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
  
  let lowStockCount = 0;
  let outOfStockCount = 0;
  
  lowStockData?.forEach(p => {
    if (p.stock === 0) outOfStockCount++;
    else if (p.stock <= (p.low_stock_threshold || 10)) lowStockCount++;
  });

  return {
    todayRevenue,
    todayOrders: todayOrders || 0,
    pendingOrders: pendingOrders || 0,
    completedOrders: completedOrders || 0,
    cancelledOrders: cancelledOrders || 0,
    todayCustomers: todayCustomers || 0,
    totalProducts: totalProducts || 0,
    totalSuppliers: totalSuppliers || 0,
    lowStockCount,
    outOfStockCount,
  };
};

export default function KPICards() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-kpi'],
    queryFn: fetchKPIData,
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    

    
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="bg-[#FFFDF8] rounded-2xl h-32 border border-[#E8DCC9] p-6">
            <div className="h-4 bg-[#E8DCC9] w-1/2 rounded mb-2"></div>
            <div className="h-8 bg-[#E8DCC9] w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-[#B94A48] p-4 bg-[#B94A48]/10 rounded-xl border border-red-100">Failed to load KPIs.</div>;
  }

  const kpis = [
    { title: "Today's Revenue", value: `KSh ${data?.todayRevenue.toLocaleString()}`, icon: DollarSign, color: "text-[#C65A28]", bg: "bg-[#E8DCC9]" },
    { title: "Today's Orders", value: data?.todayOrders.toString(), icon: ShoppingBag, color: "text-[#C65A28]", bg: "bg-[#E8DCC9]" },
    { title: "Pending Orders", value: data?.pendingOrders.toString(), icon: Clock, color: "text-[#D9A62E]", bg: "bg-[#D9A62E]/10" },
    { title: "Completed Orders", value: data?.completedOrders.toString(), icon: CheckCircle, color: "text-[#C65A28]", bg: "bg-[#E8DCC9]" },
    { title: "Cancelled Orders", value: data?.cancelledOrders.toString(), icon: XCircle, color: "text-[#B94A48]", bg: "bg-[#B94A48]/10" },
    { title: "New Customers", value: data?.todayCustomers.toString(), icon: Users, color: "text-[#C65A28]", bg: "bg-[#E8DCC9]" },
    { title: "Total Products", value: data?.totalProducts.toString(), icon: Package, color: "text-[#6B8E23]", bg: "bg-[#E8DCC9]" },
    { title: "Total Suppliers", value: data?.totalSuppliers.toString(), icon: Truck, color: "text-[#D9A62E]", bg: "bg-[#D9A62E]/10" },
    { title: "Low Stock", value: data?.lowStockCount.toString(), icon: AlertTriangle, color: "text-[#C65A28]", bg: "bg-[#C65A28]/10" },
    { title: "Out of Stock", value: data?.outOfStockCount.toString(), icon: AlertTriangle, color: "text-[#B94A48]", bg: "bg-[#B94A48]/10" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-4">
      {kpis.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E8DCC9] shadow-sm relative overflow-hidden group hover:border-[#C65A28]/30 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-[#5F5A54] line-clamp-1">{stat.title}</p>
              <h3 className="text-xl font-bold text-[#3A2418] mt-2">{stat.value}</h3>
            </div>
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
