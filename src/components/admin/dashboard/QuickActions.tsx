import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Image, Tag, Users, LayoutDashboard, Truck, Settings } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { title: 'Add Product', icon: Package, link: '/admin/dashboard/products/new', color: 'bg-[#C65A28]/10 text-[#C65A28] hover:bg-[#C65A28] hover:text-white' },
    { title: 'Create Category', icon: Tag, link: '/admin/dashboard/categories', color: 'bg-blue-100 text-[#C65A28] hover:bg-blue-600 hover:text-white' },
    { title: 'Manage Banners', icon: Image, link: '/admin/dashboard/storefront', color: 'bg-purple-100 text-[#6B8E23] hover:bg-purple-600 hover:text-white' },
    { title: 'Add Supplier', icon: Truck, link: '/admin/dashboard/customers', color: 'bg-orange-100 text-[#C65A28] hover:bg-orange-600 hover:text-white' },
    { title: 'View Orders', icon: Plus, link: '/admin/dashboard/orders', color: 'bg-[#E8DCC9] text-[#C65A28] hover:bg-[#C65A28] hover:text-white' },
    { title: 'Manage Inventory', icon: LayoutDashboard, link: '/admin/dashboard/inventory', color: 'bg-indigo-100 text-[#C65A28] hover:bg-indigo-600 hover:text-white' },
  ];

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#3A2418] mb-6">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, i) => (
          <Link 
            key={i}
            to={action.link}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border border-[#E8DCC9] transition-all duration-200 group ${action.color.split(' ')[0]} hover:border-transparent`}
          >
            <div className={`p-3 rounded-full mb-3 transition-colors ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#5F5A54] group-hover:text-[#3A2418] text-center">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
