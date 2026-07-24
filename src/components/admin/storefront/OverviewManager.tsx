import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, LayoutDashboard, Globe, Save, CheckCircle, Clock, EyeOff, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

export function OverviewManager() {
  const [stats, setStats] = useState({
    total: 14,
    published: 8,
    draft: 3,
    scheduled: 1,
    hidden: 2
  });
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3A2418]">Homepage Overview</h3>
          <p className="text-sm text-[#5F5A54]">Manage the status of all your homepage sections.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#E8DCC9] hover:bg-[#E8DCC9] text-[#5F5A54] rounded-xl font-medium transition-colors">
            <Save className="w-4 h-4" />
            Save All Drafts
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors">
            <Globe className="w-4 h-4" />
            Publish All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
          <div className="flex items-center gap-2 text-[#5F5A54] mb-2"><LayoutTemplate className="w-4 h-4" /> Total Sections</div>
          <div className="text-2xl font-bold text-[#3A2418]">{stats.total}</div>
        </div>
        <div className="bg-[#E8DCC9] p-4 rounded-xl border border-[#E8DCC9]">
          <div className="flex items-center gap-2 text-[#C65A28] mb-2"><CheckCircle className="w-4 h-4" /> Published</div>
          <div className="text-2xl font-bold text-[#C65A28]">{stats.published}</div>
        </div>
        <div className="bg-[#D9A62E]/10 p-4 rounded-xl border border-[#D9A62E]/20">
          <div className="flex items-center gap-2 text-[#D9A62E] mb-2"><Save className="w-4 h-4" /> Drafts</div>
          <div className="text-2xl font-bold text-[#D9A62E]">{stats.draft}</div>
        </div>
        <div className="bg-[#E8DCC9] p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 text-[#C65A28] mb-2"><Clock className="w-4 h-4" /> Scheduled</div>
          <div className="text-2xl font-bold text-blue-700">{stats.scheduled}</div>
        </div>
        <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
          <div className="flex items-center gap-2 text-[#5F5A54] mb-2"><EyeOff className="w-4 h-4" /> Hidden</div>
          <div className="text-2xl font-bold text-[#5F5A54]">{stats.hidden}</div>
        </div>
      </div>
      
      <div className="bg-[#FFFDF8] border border-[#E8DCC9] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#E8DCC9] bg-[#FAF5EC]/50">
          <h4 className="font-semibold text-[#3A2418]">Section Status</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {/* We'll populate this with real sections */}
          <div className="p-4 flex items-center justify-between hover:bg-[#FAF5EC]">
            <div>
              <p className="font-medium text-[#3A2418]">Hero Slider</p>
              <p className="text-xs text-[#5F5A54]">Last updated: 2 hours ago by Admin</p>
            </div>
            <div className="px-2.5 py-1 bg-[#E8DCC9] text-[#C65A28] text-xs font-bold rounded uppercase tracking-wider">Published</div>
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-[#FAF5EC]">
            <div>
              <p className="font-medium text-[#3A2418]">Flash Sales</p>
              <p className="text-xs text-[#5F5A54]">Last updated: 1 day ago by Admin</p>
            </div>
            <div className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">Scheduled</div>
          </div>
        </div>
      </div>
    </div>
  );
}
