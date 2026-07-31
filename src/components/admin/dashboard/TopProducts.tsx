import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Trophy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      // For demonstration, let's just fetch random products and mock sales.
      // A real implementation would query order_items and aggregate.
      const { data, error } = await supabase
        .from('products')
        .select('id, name, regular_price, stock')
        .limit(5);
        
      if (error) throw error;
      
      return data.map((p, i) => ({
        ...p,
        sales: 150 - (i * 25),
        revenue: (150 - (i * 25)) * Number(p.regular_price)
      })).sort((a, b) => b.revenue - a.revenue);
    }
  });

  return (
    <div className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-[#E8DCC9]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#D9A62E]/10 text-[#D9A62E] rounded-lg">
             <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#3A2418]">Top Products</h2>
            <p className="text-sm text-[#5F5A54] font-medium">By revenue (Last 30 days)</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#C65A28] animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between p-3 border border-[#E8DCC9] rounded-xl hover:border-[#E8DCC9] hover:bg-[#FAF5EC] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${i === 0 ? 'bg-[#D9A62E]/10 text-[#D9A62E]' : 
                      i === 1 ? 'bg-[#E8DCC9] text-[#5F5A54]' : 
                      i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-[#FAF5EC] text-[#5F5A54] border border-[#E8DCC9]'}
                  `}>
                    #{i + 1}
                  </div>
                  <div>
                    <Link to={`/admin/dashboard/products/${product.id}`} className="text-sm font-semibold text-[#3A2418] hover:text-[#C65A28]">
                      {product.name}
                    </Link>
                    <p className="text-xs text-[#5F5A54]">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-[#C65A28]">KSh {product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-[#8B857D]">
            <Trophy className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No sales data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
