import React from 'react';
import { X, Package } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total_price?: number;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  orderItems: OrderItem[];
  loadingItems: boolean;
}

export function OrderDetailsModal({ isOpen, onClose, order, orderItems, loadingItems }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const getSubtotal = (item: OrderItem) => {
    return item.subtotal ?? item.total_price ?? (item.quantity * item.unit_price);
  };

  let parsedNotes: any = null;
  try {
    parsedNotes = order.notes ? (typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes) : null;
  } catch (e) {
    console.error('Error parsing order notes:', e);
  }
  const contactDetails = parsedNotes?.contactDetails || null;
  const shippingDetails = parsedNotes?.shippingDetails || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer Information</h3>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 text-sm">
                <p><span className="font-medium text-gray-900 dark:text-white">Name:</span> {contactDetails?.fullName || order.customer?.first_name || 'Guest'}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Phone:</span> {contactDetails?.userPhone || order.customer?.phone_number || 'N/A'}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Address:</span> {shippingDetails?.deliveryAddress || 'N/A'}</p>
              </div>
            </div>

            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Order Information</h3>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2 text-sm">
                <p><span className="font-medium text-gray-900 dark:text-white">Order Number:</span> #{order?.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN'}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Date:</span> {order?.created_at ? format(new Date(order.created_at), 'PPP p') : 'Unknown Date'}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Status:</span> <span className="capitalize">{order.status}</span></p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ordered Products</h3>
          
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Qty</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Price</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {loadingItems ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading products...</td>
                  </tr>
                ) : orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="w-8 h-8 mb-2" />
                        <p>No products found for this order.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded object-cover bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">KSh {Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-right">KSh {Number(getSubtotal(item)).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-gray-100 dark:border-slate-700 pt-4">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span>KSh {Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Delivery Fee</span>
                <span>KSh {Number(order.delivery_fee || order.shipping_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-700">
                <span>Total</span>
                <span>KSh {Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
