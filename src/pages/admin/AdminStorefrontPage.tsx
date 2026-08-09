import React, { useState } from 'react';
import AdminHomepageManagerPage from './AdminHomepageManagerPage';
import AdminBannersManager from './AdminBannersManager';

export default function AdminStorefrontPage() {
  const [activeTab, setActiveTab] = useState<'sections' | 'banners'>('banners');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3A2418]">Storefront Management</h1>
      </div>
      
      <div className="flex gap-4 border-b border-[#E8DCC9]">
        <button 
          onClick={() => setActiveTab('banners')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'banners' ? 'border-[#F97316] text-[#F97316]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Hero Banners
        </button>
        <button 
          onClick={() => setActiveTab('sections')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'sections' ? 'border-[#F97316] text-[#F97316]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Homepage Sections
        </button>
      </div>

      {activeTab === 'banners' ? <AdminBannersManager /> : <AdminHomepageManagerPage />}
    </div>
  );
}
