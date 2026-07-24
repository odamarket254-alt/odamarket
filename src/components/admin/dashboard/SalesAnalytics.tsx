import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Loader2, MoreVertical, Calendar as CalendarIcon } from 'lucide-react';

export default function SalesAnalytics() {
  const [period, setPeriod] = useState<'7days' | '30days'>('7days');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-analytics', period],
    queryFn: async () => {
      const days = period === '7days' ? 7 : 30;
      const startDate = subDays(new Date(), days - 1);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(new Date()).toISOString());
        
      if (error) throw error;
      
      // Group by day
      const grouped = Array.from({ length: days }).map((_, i) => {
        const date = subDays(new Date(), (days - 1) - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          name: format(date, 'MMM d'),
          revenue: 0,
          orders: 0
        };
      });
      
      orders?.forEach(order => {
        const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
        const day = grouped.find(d => d.date === dateStr);
        if (day) {
          day.revenue += Number(order.total_amount || 0);
          day.orders += 1;
        }
      });
      
      return grouped;
    }
  });

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-lg font-bold text-[#3A2418]">Revenue Analytics</h2>
           <p className="text-sm text-[#5F5A54]">Track your store's financial performance</p>
        </div>
        <div className="flex items-center gap-2">
           <select 
             value={period} 
             onChange={(e) => setPeriod(e.target.value as any)}
             className="text-sm border border-[#E8DCC9] rounded-lg px-3 py-2 bg-[#FAF5EC] focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
           >
             <option value="7days">Last 7 Days</option>
             <option value="30days">Last 30 Days</option>
           </select>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FFFDF8]/50 z-10">
            <Loader2 className="w-8 h-8 text-[#C65A28] animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C65A28" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C65A28" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `KSh ${value >= 1000 ? (value / 1000) + 'k' : value}`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C65A28" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
