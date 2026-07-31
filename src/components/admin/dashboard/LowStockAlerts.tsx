import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { AlertTriangle, Loader2, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LowStockAlerts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      // Find products where stock is <= threshold
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, low_stock_threshold, regular_price').limit(100)
        .order('stock', { ascending: true })
        .limit(5);
        
      if (error) throw error;
      
      // Filter out those that are actually above threshold (if threshold is null, default to 10)
      return data.filter(p => p.stock <= (p.low_stock_threshold || 10));
    }
  });

  useEffect(() => {
    

    
  }, [queryClient]);

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#B94A48]/30 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-[#B94A48]/20 bg-[#B94A48]/10/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#B94A48]/10 text-[#B94A48] rounded-lg">
             <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#3A2418]">Low Stock Alerts</h2>
            <p className="text-sm text-[#B94A48] font-medium">Items requiring immediate restock</p>
          </div>
        </div>
        <Link to="/admin/dashboard/inventory?tab=low_stock" className="text-sm font-semibold text-[#B94A48] hover:underline flex items-center gap-1">
          Manage <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#B94A48] animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border border-[#E8DCC9] rounded-xl hover:border-[#B94A48]/30 hover:bg-[#B94A48]/10/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF5EC] flex items-center justify-center border border-[#E8DCC9]">
                     <Package className="w-5 h-5 text-[#8B857D]" />
                  </div>
                  <div>
                    <Link to={`/admin/dashboard/products/${product.id}`} className="text-sm font-semibold text-[#3A2418] hover:text-[#C65A28]">
                      {product.name}
                    </Link>
                    <p className="text-xs text-[#5F5A54]">Threshold: {product.low_stock_threshold || 10}</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="inline-flex items-center justify-center px-2 py-1 bg-[#B94A48]/10 text-[#B94A48] text-xs font-bold rounded">
                     {product.stock} left
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-[#C65A28]">
            <div className="w-12 h-12 rounded-full bg-[#E8DCC9] flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">Inventory is healthy!</p>
            <p className="text-xs text-[#C65A28]/80 mt-1">No items below minimum stock level.</p>
          </div>
        )}
      </div>
    </div>
  );
}
