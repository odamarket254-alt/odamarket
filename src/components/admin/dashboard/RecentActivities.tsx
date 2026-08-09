import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Clock, Loader2, User, ShoppingBag, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivities() {
  const queryClient = useQueryClient();

  // We'll approximate recent activities by looking at recent orders and recent user registrations
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('id, created_at, status, profiles:user_id(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, created_at, first_name, last_name, role').order('created_at', { ascending: false }).limit(5)
      ]);
      
      const orders = (ordersRes.data || []).map(o => ({
        id: `order-${o.id}`,
        type: 'order',
        title: `New order placed`,
        desc: `${(o.profiles as any)?.first_name || 'Guest'} placed order #${o.id.substring(0, 8).toUpperCase()}`,
        date: new Date(o.created_at),
        icon: ShoppingBag,
        color: 'text-[#C65A28]',
        bg: 'bg-blue-100'
      }));

      const profiles = (profilesRes.data || []).map(p => ({
        id: `profile-${p.id}`,
        type: 'user',
        title: `New ${p.role || 'user'} registered`,
        desc: `${p.first_name || 'A user'} created an account`,
        date: new Date(p.created_at),
        icon: User,
        color: 'text-[#C65A28]',
        bg: 'bg-[#E8DCC9]'
      }));

      return [...orders, ...profiles].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
    }
  });

  useEffect(() => {
    // Listen to profile changes and order changes to update activities
    

    

    
  }, [queryClient]);

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#3A2418]">Recent Activities</h2>
        <Clock className="w-5 h-5 text-[#8B857D]" />
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#C65A28] animate-spin" />
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="relative border-l-2 border-[#E8DCC9] ml-3 space-y-6">
            {activities.map((activity, i) => (
              <div key={activity.id} className="relative pl-6">
                <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${activity.bg} flex items-center justify-center border-4 border-white shadow-sm`}>
                  <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3A2418]">{activity.title}</p>
                  <p className="text-xs text-[#5F5A54] mt-0.5">{activity.desc}</p>
                  <span className="text-[10px] font-medium text-[#8B857D] mt-1 block">
                    {formatDistanceToNow(activity.date, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#8B857D] text-sm">
            No recent activities
          </div>
        )}
      </div>
    </div>
  );
}
