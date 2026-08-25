import { OptimizedImage } from "../../components/ui/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, Copy,
  Archive, Globe, EyeOff, Package, Check, X, AlertCircle, Image as ImageIcon,
  ChevronDown, Download, Upload, SlidersHorizontal, Loader2, ArrowUpRight, ArrowDownRight, Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BulkProductUploadModal } from '../../components/admin/products/BulkProductUploadModal';
import { BulkProductEditModal } from '../../components/admin/products/BulkProductEditModal';
import * as XLSX from 'xlsx';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived' | 'out_of_stock' | 'wholesale'>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0, wholesale: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchProducts();
        fetchStats();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);
  
  const fetchStats = async () => {
    try {
      // Fetch counts for tabs
      const [totalReq, activeReq, draftReq, archReq, outReq, lowReq] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false).eq('is_public', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_public', false),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 0),
        supabase.from('products').select('id', { count: 'exact', head: true }).not('wholesale_price', 'is', null),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 10).gt('stock', 0)
      ]);
      setStats({
        total: totalReq.count || 0,
        active: activeReq.count || 0,
        draft: draftReq.count || 0,
        archived: archReq.count || 0,
        outOfStock: outReq.count || 0,
        lowStock: lowReq.count || 0,
        wholesale: 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*, category:categories!left(name), brand:brands!left(name)', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
      }

      if (activeTab === 'out_of_stock') {
        query = query.lte('stock', 0);
      } else if (activeTab === 'active') {
        query = query.eq('is_active', true);
      } else if (activeTab === 'draft') {
        query = query.eq('is_active', false).eq('is_public', true);
      } else if (activeTab === 'archived') {
        query = query.eq('is_public', false);
      } else if (activeTab === 'wholesale') {
        query = query.not('wholesale_price', 'is', null);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setProducts(data || []);
      setTotalCount(count || 0);
      
    } catch (error: any) {
      console.error('Error fetching products:', JSON.stringify(error));
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    
    try {
      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
        const { error } = await supabase.from('products').delete().in('id', selectedIds);
        if (error) throw error;
        toast.success(`Deleted ${selectedIds.length} products`);
      } else if (action === 'archive') {
        const { error } = await supabase.from('products').update({ is_public: false, is_active: false }).in('id', selectedIds);
        if (error) throw error;
        toast.success(`Archived ${selectedIds.length} products`);
      } else if (action === 'active') {
        const { error } = await supabase.from('products').update({ is_public: true, is_active: true }).in('id', selectedIds);
        if (error) throw error;
        toast.success(`Activated ${selectedIds.length} products`);
      }
      setSelectedIds([]);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Bulk action failed');
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*, category:categories(name)');
      if (error) throw error;
      
      const exportData = data.map((p: any) => ({
        'Product Name': p.name,
        'SKU': p.sku || '',
        'Category': p.category?.name || '',
        'Description': p.description || '',
        'Selling Price': p.price || 0,
        'Wholesale Price': p.wholesale_price || '',
        'Stock Quantity': p.stock || 0,
        'Minimum Order Quantity': p.wholesale_min_qty || '',
        'Unit': p.wholesale_unit || '',
        'Product Image URL': p.image_url || '',
        'Status': p.is_active ? 'active' : 'draft'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "ODAMarket_Products_Export.xlsx");
      toast.success("Products exported successfully");
    } catch (err: any) {
      toast.error("Failed to export products: " + err.message);
    }
  };

  const filteredProducts = products;

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-[#5F5A54] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[#3A2418]">{value}</h3>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {trend > 0 ? (
            <span className="text-[#C65A28] flex items-center"><ArrowUpRight className="w-4 h-4" /> +{trend}%</span>
          ) : (
            <span className="text-[#B94A48] flex items-center"><ArrowDownRight className="w-4 h-4" /> {trend}%</span>
          )}
          <span className="text-[#5F5A54]">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Product Catalog</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage inventory, pricing, variants, and merchandising.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <Link
            to="/admin/dashboard/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={stats.total} icon={Package} colorClass="bg-[#E8DCC9] text-[#C65A28]" trend={12} />
        <StatCard title="Active Listings" value={stats.active} icon={Check} colorClass="bg-[#E8DCC9] text-[#C65A28]" trend={8} />
        <StatCard title="Low Stock Alerts" value={stats.lowStock} icon={AlertCircle} colorClass="bg-[#D9A62E]/10 text-[#D9A62E]" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={X} colorClass="bg-[#B94A48]/10 text-[#B94A48]" />
      </div>

      {/* Main Content */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E8DCC9] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 border-b sm:border-b-0 overflow-x-auto hide-scrollbar">
              {[
                { id: 'all', label: 'All Products' },
                { id: 'active', label: 'Active' },
                { id: 'draft', label: 'Draft' },
                { id: 'archived', label: 'Archived' },
                { id: 'out_of_stock', label: 'Out of Stock' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab.id 
                      ? "border-[#C65A28] text-[#C65A28]" 
                      : "border-transparent text-[#5F5A54] hover:text-[#5F5A54] hover:border-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D]" />
                <input
                  type="text"
                  placeholder="Search products, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 h-9 pl-9 pr-4 text-sm bg-[#FAF5EC] border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] transition-all text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                />
              </div>
              <button className="h-9 px-3 flex items-center gap-2 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] transition-colors text-sm font-medium">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#E8DCC9] border-b border-[#E8DCC9] px-4 py-3 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-800">{selectedIds.length} products selected</span>
                <div className="h-4 w-px bg-emerald-200"></div>
                
                <button onClick={() => setIsBulkEditOpen(true)} className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> Bulk Edit</button>
                <button onClick={() => handleBulkAction('active')} className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors">Set Active</button>

                <button onClick={() => handleBulkAction('archive')} className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors">Archive</button>
                <button onClick={() => handleBulkAction('delete')} className="text-sm font-medium text-[#B94A48] hover:text-[#B94A48] transition-colors">Delete</button>
                <button className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors flex items-center gap-1"><Tag className="w-3.5 h-3.5"/> Edit Categories</button>
              </div>
              <button onClick={() => setSelectedIds([])} className="p-1 hover:bg-[#E8DCC9] rounded-md text-emerald-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-[#FFFDF8]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[#FAF5EC] z-10 border-b border-[#E8DCC9] shadow-sm">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                  />
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Inventory</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Type / Category</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5A54] uppercase tracking-wider">Price</th>
                <th className="py-3 px-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C65A28] mx-auto mb-4" />
                    <p className="text-[#5F5A54] font-medium">Loading catalog...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-[#FAF5EC] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E8DCC9]">
                      <Package className="w-8 h-8 text-[#8B857D]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#3A2418] mb-1">No products found</h3>
                    <p className="text-[#5F5A54] max-w-sm mx-auto mb-6">Your search or filter did not match any products in the catalog.</p>
                    <button onClick={() => {setSearch(''); setActiveTab('all');}} className="text-[#C65A28] font-medium hover:underline">
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={cn("hover:bg-[#FAF5EC] transition-colors group", selectedIds.includes(product.id) && "bg-[#E8DCC9]/30")}>
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleSelect(product.id)}
                        className="rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-[#E8DCC9] border border-[#E8DCC9] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <OptimizedImage src={product.image_url} alt={product.name} imgClassName="h-full w-full object-cover mix-blend-multiply" className="w-full h-full flex items-center justify-center bg-transparent" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-[#8B857D]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/admin/dashboard/products/${product.id}`} className="font-medium text-[#3A2418] hover:text-[#C65A28] truncate block transition-colors">
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#5F5A54] truncate font-mono bg-[#E8DCC9] px-1.5 py-0.5 rounded">
                              {product.sku || 'NO-SKU'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize border",
                        product.status === 'active' ? "bg-[#E8DCC9] text-[#C65A28] border-emerald-200" :
                        product.status === 'draft' ? "bg-[#D9A62E]/10 text-[#D9A62E] border-amber-200" :
                        "bg-[#FAF5EC] text-[#5F5A54] border-[#E8DCC9]"
                      )}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-semibold", product.stock > 10 ? "text-[#5F5A54]" : product.stock > 0 ? "text-[#D9A62E]" : "text-[#B94A48]")}>
                          {product.stock} in stock
                        </span>
                        <span className="text-xs text-[#5F5A54] mt-0.5">for {product.variants_count || 1} variant(s)</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#5F5A54]">
                      {product.product_type?.name || 'Uncategorized'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#3A2418]">
                          KSh {Number(product.price || product.regular_price || 0).toLocaleString()}
                        </span>
                        {product.cost_price && (
                           <span className="text-xs text-[#5F5A54] mt-0.5">Margin: {Math.round(((product.regular_price - product.cost_price) / product.regular_price) * 100)}%</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link to={`/admin/dashboard/products/${product.id}`} className="inline-flex p-2 text-[#8B857D] hover:text-[#C65A28] hover:bg-[#E8DCC9] rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-[#E8DCC9] p-4 flex items-center justify-between text-sm text-[#5F5A54] bg-[#FFFDF8] rounded-b-2xl">
          <div>Showing <span className="font-medium text-[#3A2418]">{products.length}</span> products</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-[#E8DCC9] rounded-md bg-[#FFFDF8] hover:bg-[#FAF5EC] disabled:opacity-50 transition-colors">Previous</button>
            <button className="px-3 py-1.5 border border-[#E8DCC9] rounded-md bg-[#FFFDF8] hover:bg-[#FAF5EC] disabled:opacity-50 transition-colors">Next</button>
          </div>
        </div>
      </div>

      <BulkProductUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onComplete={() => {
          setIsBulkUploadOpen(false);
          fetchProducts();
          fetchStats();
        }}
      />
    
      <BulkProductEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedIds={selectedIds}
        onComplete={() => {
          setIsBulkEditOpen(false);
          setSelectedIds([]);
          fetchProducts();
        }}
      />
    </div>
  );
}
