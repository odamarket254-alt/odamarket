import React from 'react';
import { Users, Search, Download } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Customers</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage your customer database and purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden flex flex-col h-[600px] items-center justify-center text-[#8B857D]">
        <Users className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-semibold text-[#5F5A54] mb-1">Customers Module</h3>
        <p className="text-sm max-w-md text-center">This module has been rebuilt to the new design system. Full data table integration is pending next sprint.</p>
      </div>
    </div>
  );
}
