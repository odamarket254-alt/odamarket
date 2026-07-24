import React from 'react';
import { Download, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import KPICards from '../../components/admin/dashboard/KPICards';
import SalesAnalytics from '../../components/admin/dashboard/SalesAnalytics';
import RecentOrders from '../../components/admin/dashboard/RecentOrders';
import LowStockAlerts from '../../components/admin/dashboard/LowStockAlerts';
import TopProducts from '../../components/admin/dashboard/TopProducts';
import RecentActivities from '../../components/admin/dashboard/RecentActivities';
import SystemHealth from '../../components/admin/dashboard/SystemHealth';
import QuickActions from '../../components/admin/dashboard/QuickActions';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminDashboardHome() {
  const { profile } = useAuthStore();
  
  // Basic role check if needed, but the layout protects the route.
  // We can pass `profile` to widgets if they need to filter by role, but for now they fetch general data.

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Command Center</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Live overview of OdaMarket operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors text-sm font-medium shadow-sm">
            <CalendarIcon className="w-4 h-4" />
            Today
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-lg transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>

      {/* 1. KPI Cards Row */}
      <KPICards />

      {/* 2. Main Analytics & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesAnalytics />
        </div>
        <div className="lg:col-span-1 h-[400px]">
          <RecentOrders />
        </div>
      </div>

      {/* 3. Alerts, Top Products & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-[400px]">
          <LowStockAlerts />
        </div>
        <div className="h-[400px]">
          <TopProducts />
        </div>
        <div className="h-[400px]">
          <RecentActivities />
        </div>
      </div>

      {/* 4. Bottom Utilities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div className="lg:col-span-1">
          <SystemHealth />
        </div>
      </div>
      
      {/* View Storefront Link */}
      <div className="pt-4 border-t border-[#E8DCC9] flex justify-end">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-[#5F5A54] hover:text-[#C65A28] transition-colors">
          Open Storefront <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
