import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Save, Search, Filter, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function BulkProductEditModal({ isOpen, onClose, selectedIds, onComplete }: { isOpen: boolean, onClose: () => void, selectedIds: string[], onComplete: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [updateFields, setUpdateFields] = useState({
    price: '',
    wholesale_price: '',
    stock: '',
    wholesale_min_qty: '',
    category_id: '',
    status: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setUpdateFields({
        price: '',
        wholesale_price: '',
        stock: '',
        wholesale_min_qty: '',
        category_id: '',
        status: ''
      });
      setIsProcessing(false);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const handleApply = async () => {
    if (selectedIds.length === 0) {
      toast.error('No products selected');
      return;
    }

    const updates: any = {};
    if (updateFields.price) updates.price = parseFloat(updateFields.price);
    if (updateFields.wholesale_price) updates.wholesale_price = parseFloat(updateFields.wholesale_price);
    if (updateFields.stock) updates.stock = parseInt(updateFields.stock, 10);
    if (updateFields.wholesale_min_qty) updates.wholesale_min_qty = parseInt(updateFields.wholesale_min_qty, 10);
    if (updateFields.category_id) updates.category_id = updateFields.category_id;
    if (updateFields.status) {
      updates.is_active = updateFields.status === 'active';
      updates.is_public = updateFields.status === 'active' || updateFields.status === 'draft';
    }
    
    if (updateFields.wholesale_price) {
      updates.is_wholesale = true;
    }

    if (Object.keys(updates).length === 0) {
      toast.error('No changes specified');
      return;
    }

    if (!confirm(`Are you sure you want to apply these changes to ${selectedIds.length} products?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.from('products').update(updates).in('id', selectedIds);
      if (error) throw error;
      
      toast.success(`Successfully updated ${selectedIds.length} products`);
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update products');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFDF8] w-full max-w-xl rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DCC9]">
          <h2 className="text-xl font-bold text-[#3A2418]">Bulk Edit Products</h2>
          <button onClick={onClose} className="p-2 text-[#5F5A54] hover:bg-[#FAF5EC] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
            <p className="text-sm text-[#3A2418] font-medium mb-1">Editing {selectedIds.length} Products</p>
            <p className="text-xs text-[#5F5A54]">Only filled fields will be applied. Leave fields empty to keep their current values.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Selling Price</label>
                <input 
                  type="number" 
                  value={updateFields.price}
                  onChange={e => setUpdateFields({...updateFields, price: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]" 
                  placeholder="Leave empty to ignore"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Stock Quantity</label>
                <input 
                  type="number" 
                  value={updateFields.stock}
                  onChange={e => setUpdateFields({...updateFields, stock: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]" 
                  placeholder="Leave empty to ignore"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Wholesale Price</label>
                <input 
                  type="number" 
                  value={updateFields.wholesale_price}
                  onChange={e => setUpdateFields({...updateFields, wholesale_price: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]" 
                  placeholder="Leave empty to ignore"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Min Order Qty (Wholesale)</label>
                <input 
                  type="number" 
                  value={updateFields.wholesale_min_qty}
                  onChange={e => setUpdateFields({...updateFields, wholesale_min_qty: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]" 
                  placeholder="Leave empty to ignore"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Category</label>
                <select 
                  value={updateFields.category_id}
                  onChange={e => setUpdateFields({...updateFields, category_id: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]"
                >
                  <option value="">Leave empty to ignore</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2418] mb-1">Status</label>
                <select 
                  value={updateFields.status}
                  onChange={e => setUpdateFields({...updateFields, status: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28]"
                >
                  <option value="">Leave empty to ignore</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E8DCC9] bg-[#FAF5EC] flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-white border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] text-white rounded-lg hover:bg-[#C65A28]/90 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
