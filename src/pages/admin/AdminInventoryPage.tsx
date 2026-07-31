import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Filter, ArrowUpRight, ArrowDownRight, PackageOpen, 
  AlertTriangle, History, Download, MapPin, Boxes, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  useEffect(() => {
    fetchInventory();
    
    

    
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock, low_stock_threshold, regular_price').limit(100)
        .order('stock', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'low_stock') return matchesSearch && p.stock > 0 && p.stock <= (p.low_stock_threshold || 10);
    if (activeTab === 'out_of_stock') return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

  const stats = {
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.low_stock_threshold || 10)).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    value: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Inventory</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage stock levels, locations, and track valuation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm">
            <History className="w-4 h-4" />
            Stock History
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#3A2418] hover:bg-[#3A2418] text-white rounded-lg transition-colors font-medium text-sm shadow-sm">
            <Boxes className="w-4 h-4" />
            Receive Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border border-[#E8DCC9] shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-[#5F5A54]">Total Items in Stock</p>
                <h3 className="text-2xl font-bold text-[#3A2418] mt-1">{stats.totalItems.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-xl bg-[#E8DCC9] text-[#C65A28]">
                <PackageOpen className="w-5 h-5" />
              </div>
           </div>
        </div>
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border border-[#E8DCC9] shadow-sm border-l-4 border-l-amber-500">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-[#5F5A54]">Low Stock Alerts</p>
                <h3 className="text-2xl font-bold text-[#3A2418] mt-1">{stats.lowStock}</h3>
              </div>
              <div className="p-2 rounded-xl bg-[#D9A62E]/10 text-[#D9A62E]">
                <AlertTriangle className="w-5 h-5" />
              </div>
           </div>
        </div>
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border border-[#E8DCC9] shadow-sm border-l-4 border-l-[#B94A48]">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-[#5F5A54]">Out of Stock</p>
                <h3 className="text-2xl font-bold text-[#3A2418] mt-1">{stats.outOfStock}</h3>
              </div>
              <div className="p-2 rounded-xl bg-[#B94A48]/10 text-[#B94A48]">
                <AlertTriangle className="w-5 h-5" />
              </div>
           </div>
        </div>
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border border-[#E8DCC9] shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-[#5F5A54]">Total Valuation</p>
                <h3 className="text-2xl font-bold text-[#3A2418] mt-1">KSh {stats.value.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-xl bg-[#E8DCC9] text-[#C65A28]">
                <TrendingUp className="w-5 h-5" />
              </div>
           </div>
        </div>
      </div>

      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-[#E8DCC9] px-2 flex overflow-x-auto scrollbar-hide">
          {['all', 'low_stock', 'out_of_stock'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize",
                activeTab === tab 
                  ? "border-[#C65A28] text-[#C65A28]" 
                  : "border-transparent text-[#5F5A54] hover:text-[#5F5A54] hover:border-slate-300"
              )}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FAF5EC]/50 border-b border-[#E8DCC9]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B857D]" />
            <input
              type="text"
              placeholder="Search inventory by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] shadow-sm text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF5EC] border-b border-[#E8DCC9]">
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Product</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">SKU</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Available</th>
                <th className="py-3 px-6 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider text-right">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C65A28] mx-auto"></div></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-[#5F5A54]">No inventory records found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAF5EC] transition-colors">
                    <td className="py-3 px-6 font-medium text-[#3A2418]">{product.name}</td>
                    <td className="py-3 px-6 text-sm text-[#5F5A54]">{product.sku || 'N/A'}</td>
                    <td className="py-3 px-6 text-right">
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded text-sm font-bold",
                        product.stock === 0 ? "bg-[#B94A48]/10 text-[#B94A48]" :
                        product.stock <= (product.low_stock_threshold || 10) ? "bg-[#D9A62E]/10 text-[#D9A62E]" :
                        "text-[#3A2418]"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                       <input 
                         type="number" 
                         defaultValue={product.stock} 
                         className="w-20 px-2 py-1 border border-[#E8DCC9] rounded text-sm focus:outline-none focus:border-[#C65A28] ml-auto text-right text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                       />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
