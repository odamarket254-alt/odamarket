import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Users, ShoppingCart, Truck, ChevronRight, Loader2, Folder, Tag, TagIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: any[];
    categories: any[];
    orders: any[];
    customers: any[];
    suppliers: any[];
    brands: any[];
    coupons: any[];
  }>({
    products: [],
    categories: [],
    orders: [],
    customers: [],
    suppliers: [],
    brands: [],
    coupons: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults({
        products: [], categories: [], orders: [], customers: [], suppliers: [], brands: [], coupons: []
      });
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const searchTerm = `%${debouncedQuery}%`;
        const [
          productsRes,
          categoriesRes,
          ordersRes,
          customersRes,
          suppliersRes,
          brandsRes,
          couponsRes
        ] = await Promise.all([
          supabase.from('products').select('id, name, slug').ilike('name', searchTerm).limit(5),
          supabase.from('categories').select('id, name, slug').ilike('name', searchTerm).limit(5),
          supabase.from('orders').select('id, order_number').ilike('order_number', searchTerm).limit(5),
          supabase.from('profiles').select('id, full_name, email').ilike('full_name', searchTerm).limit(5),
          supabase.from('suppliers').select('id, name').ilike('name', searchTerm).limit(5),
          supabase.from('brands').select('id, name').ilike('name', searchTerm).limit(5),
          supabase.from('coupons').select('id, code').ilike('code', searchTerm).limit(5)
        ]);

        setResults({
          products: productsRes.data || [],
          categories: categoriesRes.data || [],
          orders: ordersRes.data || [],
          customers: customersRes.data || [],
          suppliers: suppliersRes.data || [],
          brands: brandsRes.data || [],
          coupons: couponsRes.data || []
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  const quickLinks = [
    { label: 'Add New Product', icon: Package, path: '/admin/dashboard/products/new' },
    { label: 'View Pending Orders', icon: ShoppingCart, path: '/admin/dashboard/orders?tab=pending' },
    { label: 'Customer Directory', icon: Users, path: '/admin/dashboard/customers' },
    { label: 'Low Stock Report', icon: Truck, path: '/admin/dashboard/inventory?tab=low_stock' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#E8DCC9]/50 hover:bg-[#E8DCC9] text-[#5F5A54] rounded-lg transition-colors w-full md:w-64 border border-transparent focus:outline-none focus:border-[#C65A28]/30 focus:ring-4 focus:ring-[#C65A28]/10"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium">Search...</span>
        <span className="ml-auto hidden md:flex items-center text-xs font-semibold px-1.5 py-0.5 rounded border border-[#E8DCC9] bg-[#FFFDF8] text-[#8B857D]">
          ⌘K
        </span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#3A2418]/40 backdrop-blur-sm z-50 p-4 sm:p-6 md:p-20 flex justify-center items-start"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#FFFDF8] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              >
                {/* Search Input */}
                <div className="relative flex items-center px-4 py-4 border-b border-[#E8DCC9]">
                  <Search className="w-5 h-5 text-[#8B857D] shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search products, orders, customers..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 px-4 py-2 text-lg text-[#3A2418] bg-transparent focus:outline-none placeholder:text-[#8B857D]"
                  />
                  {loading && <Loader2 className="w-5 h-5 animate-spin text-[#C65A28] mr-2" />}
                  {query && !loading && (
                    <button 
                      onClick={() => setQuery('')}
                      className="p-1 text-[#8B857D] hover:text-[#5F5A54] rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1 ml-4 border-l border-[#E8DCC9] pl-4">
                     <span className="text-xs text-[#8B857D] font-medium bg-[#E8DCC9] px-1.5 py-0.5 rounded border border-[#E8DCC9]">ESC</span>
                     <span className="text-xs text-[#8B857D] font-medium">to close</span>
                  </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                  {!query ? (
                    <div className="space-y-6">
                      {/* Quick Links */}
                      <div>
                        <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-3 px-2">Quick Links</h3>
                        <div className="space-y-1">
                          {quickLinks.map(link => (
                            <button
                              key={link.label}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(link.path);
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-[#FAF5EC] rounded-xl transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#FFFDF8] rounded-lg border border-[#E8DCC9] text-[#5F5A54] group-hover:text-[#C65A28] group-hover:border-[#C65A28]/30 transition-colors">
                                  <link.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-[#5F5A54] group-hover:text-[#3A2418]">{link.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#8B857D] group-hover:text-[#C65A28] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {!loading && !hasResults && (
                        <div className="py-12 text-center">
                           <Search className="w-8 h-8 text-[#8B857D] mx-auto mb-4" />
                           <p className="text-[#5F5A54] font-medium">No results found for "{query}"</p>
                           <p className="text-sm text-[#8B857D] mt-1">Try adjusting your search terms.</p>
                        </div>
                      )}

                      {hasResults && (
                        <div className="space-y-4">
                          {results.products.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Package className="w-3 h-3"/> Products</h3>
                              {results.products.map(p => (
                                <button key={p.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/products/${p.id}`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{p.name}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {results.categories.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Folder className="w-3 h-3"/> Categories</h3>
                              {results.categories.map(c => (
                                <button key={c.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/categories`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{c.name}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}

                          {results.orders.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><ShoppingCart className="w-3 h-3"/> Orders</h3>
                              {results.orders.map(o => (
                                <button key={o.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/orders/${o.id}`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{o.order_number}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {results.customers.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Users className="w-3 h-3"/> Customers</h3>
                              {results.customers.map(c => (
                                <button key={c.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/customers/${c.id}`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{c.full_name || c.email}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {results.brands.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><TagIcon className="w-3 h-3"/> Brands</h3>
                              {results.brands.map(b => (
                                <button key={b.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/brands`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{b.name}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {results.suppliers.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Truck className="w-3 h-3"/> Suppliers</h3>
                              {results.suppliers.map(s => (
                                <button key={s.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/suppliers`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{s.name}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {results.coupons.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-[#5F5A54] uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Tag className="w-3 h-3"/> Coupons</h3>
                              {results.coupons.map(c => (
                                <button key={c.id} onClick={() => { setIsOpen(false); navigate(`/admin/dashboard/discounts`); }} className="w-full flex items-center justify-between p-2 hover:bg-[#FAF5EC] rounded-lg transition-colors group">
                                  <span className="text-sm font-medium text-[#5F5A54]">{c.code}</span>
                                  <ChevronRight className="w-4 h-4 text-[#8B857D] opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
