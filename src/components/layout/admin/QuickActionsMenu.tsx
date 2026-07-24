import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, FolderPlus, Image as ImageIcon, Truck, Tag, X } from 'lucide-react';

export default function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: 'Add Product', icon: Package, path: '/admin/dashboard/products/new', description: 'Create a new product in the catalog' },
    { label: 'Add Category', icon: FolderPlus, path: '/admin/dashboard/categories', description: 'Organize products with new categories' },
    { label: 'Create Banner', icon: ImageIcon, path: '/admin/dashboard/storefront?tab=banners', description: 'Design promotional banners' },
    { label: 'Add Supplier', icon: Truck, path: '/admin/dashboard/suppliers', description: 'Onboard a new vendor or supplier' },
    { label: 'Create Coupon', icon: Tag, path: '/admin/dashboard/discounts', description: 'Generate discount codes' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 shadow-sm"
        title="Quick Actions"
      >
        <Plus className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#3A2418]/40 backdrop-blur-sm z-50"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#FFFDF8] shadow-2xl z-50 flex flex-col border-l border-[#E8DCC9]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DCC9] bg-[#FAF5EC]">
                <div>
                  <h2 className="text-lg font-bold text-[#3A2418]">Quick Actions</h2>
                  <p className="text-sm text-[#5F5A54]">Fast access to common tasks</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#FFFDF8] rounded-full transition-colors bg-[#E8DCC9]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-[#E8DCC9] hover:border-[#C65A28]/30 hover:bg-[#C65A28]/5 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="p-3 rounded-lg bg-[#FAF5EC] group-hover:bg-[#FFFDF8] text-[#5F5A54] group-hover:text-[#C65A28] transition-colors border border-[#E8DCC9] group-hover:border-[#C65A28]/20 shrink-0">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#3A2418] group-hover:text-[#C65A28] transition-colors">{action.label}</h3>
                      <p className="text-sm text-[#5F5A54] mt-1">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-[#E8DCC9] bg-[#FAF5EC]">
                <div className="flex items-center justify-center p-4 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] border-dashed">
                  <p className="text-sm text-[#5F5A54] text-center font-medium">Use <kbd className="px-2 py-1 bg-[#E8DCC9] rounded text-xs font-mono border border-[#E8DCC9] shadow-sm mx-1">⌘ + K</kbd> to open global search.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
