import React from 'react';
import { format } from 'date-fns';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderReceiptProps {
  order: {
    order_number: string;
    created_at: string;
    subtotal: number;
    delivery_fee?: number;
    discount?: number;
    grand_total: number;
    payment_method: string;
    payment_status: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_location: string;
    delivery_address: string;
    items: OrderItem[];
    transaction_id?: string;
  };
  id?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, id = 'receipt-element' }) => {
  return (
    <div id={id} className="bg-[#FFFDF8] w-full max-w-[400px] mx-auto overflow-hidden p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6">
        <h1 className="text-[28px] font-bold text-[#C65A28] uppercase tracking-wider mb-2">ODAMARKET</h1>
        <p className="text-[14px] text-[#5F5A54] italic mb-6">Quality. Value. Convenience.</p>
        
        <div className="bg-[#C65A28] text-white py-2 px-4 rounded-lg font-bold uppercase tracking-wider text-[16px] mb-6 inline-block">
          NEW PAID ORDER
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-[12px] text-[#8B857D] uppercase font-bold tracking-wider mb-1">Order Number</p>
            <p className="text-[14px] font-bold text-[#3A2418]">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[#8B857D] uppercase font-bold tracking-wider mb-1">Date</p>
            <p className="text-[14px] font-bold text-[#3A2418]">
              {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy • hh:mm a') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6">
        <h2 className="text-[14px] font-bold text-[#C65A28] uppercase tracking-wider mb-4">Customer Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <span className="text-[14px] text-[#5F5A54] min-w-[80px]">Name:</span>
            <span className="text-[14px] font-bold text-[#3A2418] text-right">{order.customer_name}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-[14px] text-[#5F5A54] min-w-[80px]">Phone:</span>
            <span className="text-[14px] font-bold text-[#3A2418] text-right">{order.customer_phone}</span>
          </div>
          {order.customer_email && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-[14px] text-[#5F5A54] min-w-[80px]">Email:</span>
              <span className="text-[14px] font-bold text-[#3A2418] text-right break-all">{order.customer_email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Details */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6">
        <h2 className="text-[14px] font-bold text-[#C65A28] uppercase tracking-wider mb-4">Delivery Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <span className="text-[14px] text-[#5F5A54] min-w-[80px]">Location:</span>
            <span className="text-[14px] font-bold text-[#3A2418] text-right">{order.delivery_location}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-[14px] text-[#5F5A54] min-w-[80px]">Address:</span>
            <span className="text-[14px] font-bold text-[#3A2418] text-right">{order.delivery_address}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 mb-4 border-b border-[#E8DCC9] pb-2">
          <span className="text-[12px] font-bold text-[#8B857D] uppercase tracking-wider">Product</span>
          <span className="text-[12px] font-bold text-[#8B857D] uppercase tracking-wider text-center w-12">Qty</span>
          <span className="text-[12px] font-bold text-[#8B857D] uppercase tracking-wider text-right w-24">Total</span>
        </div>
        
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="text-[14px] font-bold text-[#3A2418] line-clamp-2">{item.product_name}</div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                <span className="text-[12px] text-[#8B857D]">{item.quantity} × KSh {item.unit_price.toLocaleString()}</span>
                <span className="text-[14px] font-medium text-[#3A2418] text-center w-12">{item.quantity}</span>
                <span className="text-[14px] font-bold text-[#3A2418] text-right w-24">KSh {item.total_price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-[#5F5A54]">Subtotal:</span>
          <span className="text-[14px] font-medium text-[#3A2418]">KSh {order.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-[#5F5A54]">Delivery Fee:</span>
          <span className="text-[14px] font-medium text-[#3A2418]">KSh {(order.delivery_fee || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-[#5F5A54]">Discount:</span>
          <span className="text-[14px] font-medium text-[#3A2418]">KSh {(order.discount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#E8DCC9]">
          <span className="text-[18px] font-bold text-[#3A2418]">TOTAL:</span>
          <span className="text-[20px] font-black text-[#C65A28]">KSh {order.grand_total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-[12px] text-[#8B857D] uppercase font-bold tracking-wider mb-1">Method</span>
            <span className="text-[14px] font-bold text-[#3A2418]">{order.payment_method}</span>
          </div>
          <div className="text-right">
            <span className="block text-[12px] text-[#8B857D] uppercase font-bold tracking-wider mb-1">Status</span>
            <span className="inline-flex items-center gap-1 text-[14px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {order.payment_status} ✓
            </span>
          </div>
          {order.transaction_id && (
            <div className="col-span-2">
              <span className="block text-[12px] text-[#8B857D] uppercase font-bold tracking-wider mb-1">Transaction ID</span>
              <span className="text-[14px] font-mono font-bold text-[#3A2418] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E5E7EB] block break-all">
                {order.transaction_id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-[16px] font-bold text-[#3A2418] uppercase tracking-wider mb-2">ODAMARKET</p>
        <p className="text-[12px] text-[#5F5A54] space-y-1">
          <span className="block">Quality Products</span>
          <span className="block">Fast & Reliable Delivery</span>
          <span className="block">Better Value Every Day</span>
        </p>
      </div>
    </div>
  );
};
