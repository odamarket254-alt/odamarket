import React from 'react';
import { Database, Server, Activity, CheckCircle, Shield } from 'lucide-react';

export default function SystemHealth() {
  const statusItems = [
    { name: 'Database Status', icon: Database, status: 'Healthy', color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
    { name: 'Realtime Subscriptions', icon: Activity, status: 'Connected', color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
    { name: 'API Endpoints', icon: Server, status: 'Operational', color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
    { name: 'Authentication', icon: Shield, status: 'Secure', color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
  ];

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#3A2418] mb-6">System Health</h2>
      <div className="space-y-4">
        {statusItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#E8DCC9] bg-[#FAF5EC]/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-[#5F5A54]">{item.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#C65A28]" />
              <span className="text-xs font-semibold text-[#C65A28]">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
