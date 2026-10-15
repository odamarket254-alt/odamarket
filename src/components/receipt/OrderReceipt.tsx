import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, ShieldCheck, Mail, MapPin, Phone, User, Package, Calendar, Hash } from 'lucide-react';

export interface OrderReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string;
}

export interface OrderReceiptData {
  order_number: string;
  order_id?: string;
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
  delivery_method?: string;
  items: OrderReceiptItem[];
  transaction_id?: string;
  email_sent?: boolean;
}

export interface OrderReceiptProps {
  order: OrderReceiptData;
  id?: string;
  className?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  order,
  id = 'receipt-printable-container',
  className = ''
}) => {
  const formattedDate = React.useMemo(() => {
    if (!order.created_at) return 'N/A';
    try {
      return format(new Date(order.created_at), 'dd MMM yyyy • hh:mm a');
    } catch {
      return 'N/A';
    }
  }, [order.created_at]);

  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount || 0);

  return (
    <div
      id={id}
      className={`receipt-print-area bg-[#FFFDF8] w-full max-w-[480px] mx-auto overflow-hidden p-6 sm:p-8 rounded-2xl border border-[#E8DCC9] shadow-sm relative font-sans ${className}`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top perforated / sawtooth visual motif */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C65A28] via-[#2BB673] to-[#C65A28] opacity-80" />

      {/* Header with Official ODA Market Branding */}
      <div className="text-center border-b-2 border-dashed border-[#E8DCC9] pb-6 mb-5">
        {/* Brand Lockup Inline SVG to prevent cross-origin canvas taint */}
        <div className="flex items-center justify-center mb-1">
          <svg
            className="h-10 w-auto"
            viewBox="0 0 240 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="ODA Market"
          >
            <path
              d="M43.7143 30C43.7143 40.2561 35.4053 48.5714 25.1429 48.5714C14.8804 48.5714 6.57143 40.2561 6.57143 30C6.57143 19.7439 14.8804 11.4286 25.1429 11.4286C35.4053 11.4286 43.7143 19.7439 43.7143 30Z"
              stroke="#0A2E5C"
              strokeWidth="7"
            />
            <path
              d="M25.1429 38.5714C29.8767 38.5714 33.7143 34.7339 33.7143 30C33.7143 25.2661 29.8767 21.4286 25.1429 21.4286C20.409 21.4286 16.5714 25.2661 16.5714 30C16.5714 34.7339 20.409 38.5714 25.1429 38.5714Z"
              fill="#2BB673"
            />
            <text
              x="56"
              y="41"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="#0A2E5C"
              letterSpacing="-1.5"
            >
              ODA
            </text>
            <text
              x="132"
              y="41"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="34"
              fill="#2BB673"
              letterSpacing="-1"
            >
              Market
            </text>
          </svg>
        </div>
        <p className="text-xs text-[#5F5A54] italic mb-4">Quality. Value. Convenience.</p>

        {/* Verification Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#2BB673]/10 border border-[#2BB673]/30 text-[#1E7E4F] py-1 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2BB673]" />
          Official Digital Receipt • Paid
        </div>

        {/* Order Meta Grid */}
        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <div>
            <p className="text-[11px] text-[#8B857D] uppercase font-bold tracking-wider mb-0.5">Order Number</p>
            <p className="text-sm font-bold text-[#3A2418] font-mono tracking-tight">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#8B857D] uppercase font-bold tracking-wider mb-0.5">Date & Time</p>
            <p className="text-xs font-semibold text-[#3A2418]">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Details */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-5 mb-5 text-sm">
        <h2 className="text-xs font-bold text-[#C65A28] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Buyer & Delivery Details
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs text-[#5F5A54]">Customer:</span>
            <span className="text-xs font-bold text-[#3A2418] text-right">{order.customer_name}</span>
          </div>
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs text-[#5F5A54]">Phone:</span>
            <span className="text-xs font-semibold text-[#3A2418] font-mono text-right">{order.customer_phone}</span>
          </div>
          {order.customer_email && (
            <div className="flex justify-between items-start gap-3">
              <span className="text-xs text-[#5F5A54]">Email:</span>
              <span className="text-xs font-semibold text-[#3A2418] text-right break-all">{order.customer_email}</span>
            </div>
          )}
          <div className="flex justify-between items-start gap-3 pt-1 border-t border-[#F2ECE1]">
            <span className="text-xs text-[#5F5A54]">Delivery Location:</span>
            <span className="text-xs font-bold text-[#3A2418] text-right">{order.delivery_location}</span>
          </div>
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs text-[#5F5A54]">Full Address:</span>
            <span className="text-xs text-[#3A2418] text-right max-w-[240px]">{order.delivery_address}</span>
          </div>
          {order.delivery_method && (
            <div className="flex justify-between items-start gap-3">
              <span className="text-xs text-[#5F5A54]">Method:</span>
              <span className="text-xs font-semibold text-[#3A2418] capitalize text-right">
                {order.delivery_method === 'express' ? 'Express Delivery (Boda)' : 'Standard Delivery'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Purchased Products Itemized Table */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-5 mb-5">
        <h2 className="text-xs font-bold text-[#C65A28] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          Purchased Products
        </h2>

        <div className="grid grid-cols-[1fr_40px_76px] gap-2 mb-2 pb-1.5 border-b border-[#E8DCC9] text-[11px] font-bold text-[#8B857D] uppercase tracking-wider">
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Total</span>
        </div>

        <div className="space-y-3">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => {
              const lineTotal = item.total_price || (item.unit_price * item.quantity);
              return (
                <div key={idx} className="flex flex-col gap-0.5 text-xs">
                  <div className="font-semibold text-[#3A2418] line-clamp-2">
                    {item.product_name}
                  </div>
                  <div className="grid grid-cols-[1fr_40px_76px] gap-2 items-center text-[#5F5A54]">
                    <span className="text-[11px] text-[#8B857D]">
                      {item.quantity} × KSh {Number(item.unit_price).toLocaleString('en-KE')}
                    </span>
                    <span className="text-center font-mono tabular-nums font-medium text-[#3A2418]">
                      {item.quantity}
                    </span>
                    <span className="text-right font-mono tabular-nums font-bold text-[#3A2418]">
                      KSh {Number(lineTotal).toLocaleString('en-KE')}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[#8B857D] italic py-2">No product items found.</p>
          )}
        </div>
      </div>

      {/* Financial Breakdown & Grand Total */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-5 mb-5 space-y-2 text-xs">
        <div className="flex justify-between items-center text-[#5F5A54]">
          <span>Subtotal:</span>
          <span className="font-mono tabular-nums font-medium text-[#3A2418]">
            KSh {Number(order.subtotal).toLocaleString('en-KE')}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#5F5A54]">
          <span>Delivery Fee:</span>
          <span className="font-mono tabular-nums font-medium text-[#3A2418]">
            {deliveryFee > 0 ? `KSh ${deliveryFee.toLocaleString('en-KE')}` : 'FREE'}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-[#5F5A54]">
            <span>Discount:</span>
            <span className="font-mono tabular-nums font-medium text-emerald-600">
              -KSh {discount.toLocaleString('en-KE')}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-[#E8DCC9]">
          <span className="text-sm font-bold text-[#3A2418] uppercase tracking-wide">TOTAL PAID:</span>
          <span className="text-lg font-black text-[#C65A28] font-mono tabular-nums">
            KSh {Number(order.grand_total).toLocaleString('en-KE')}
          </span>
        </div>
      </div>

      {/* Payment & Authoritative Verification Details */}
      <div className="border-b-2 border-dashed border-[#E8DCC9] pb-5 mb-5 text-xs">
        <div className="grid grid-cols-2 gap-3 mb-2.5">
          <div>
            <span className="block text-[11px] text-[#8B857D] uppercase font-bold tracking-wider mb-0.5">
              Payment Method
            </span>
            <span className="font-semibold text-[#3A2418]">
              {order.payment_method || 'M-Pesa'} (Paystack)
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[11px] text-[#8B857D] uppercase font-bold tracking-wider mb-0.5">
              Payment Status
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              PAID ✓
            </span>
          </div>
        </div>

        {order.transaction_id && (
          <div className="mt-2 pt-2 border-t border-[#F2ECE1]">
            <span className="block text-[11px] text-[#8B857D] uppercase font-bold tracking-wider mb-0.5">
              Paystack Transaction Ref
            </span>
            <span className="font-mono text-[11px] text-[#3A2418] bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB] block break-all font-semibold select-all">
              {order.transaction_id}
            </span>
          </div>
        )}
      </div>

      {/* Resend Email Notification Status */}
      <div className="bg-[#FAF5EC] rounded-xl p-3 mb-5 border border-[#E8DCC9] flex items-center gap-2.5 text-xs text-[#5F5A54]">
        <Mail className="w-4 h-4 text-[#C65A28] shrink-0" />
        <p className="leading-snug">
          Digital receipt confirmation automatically dispatched via <strong className="text-[#3A2418]">Resend</strong> to{' '}
          <span className="font-semibold text-[#3A2418]">{order.customer_email || 'your email'}</span>.
        </p>
      </div>

      {/* Digital Barcode / Security Stamp Motif */}
      <div className="text-center pt-1 pb-2">
        <div className="inline-block py-1 px-3 bg-white border border-[#E8DCC9] rounded mb-2">
          {/* Stylized Barcode SVG */}
          <svg className="h-6 w-48 mx-auto" viewBox="0 0 200 24" preserveAspectRatio="none">
            <rect x="0" y="0" width="3" height="24" fill="#3A2418" />
            <rect x="6" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="10" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="17" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="22" y="0" width="5" height="24" fill="#3A2418" />
            <rect x="30" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="35" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="38" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="45" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="50" y="0" width="6" height="24" fill="#3A2418" />
            <rect x="59" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="63" y="0" width="3" height="24" fill="#3A2418" />
            <rect x="69" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="74" y="0" width="5" height="24" fill="#3A2418" />
            <rect x="82" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="86" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="93" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="98" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="105" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="109" y="0" width="3" height="24" fill="#3A2418" />
            <rect x="115" y="0" width="5" height="24" fill="#3A2418" />
            <rect x="123" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="128" y="0" width="3" height="24" fill="#3A2418" />
            <rect x="134" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="138" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="145" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="150" y="0" width="5" height="24" fill="#3A2418" />
            <rect x="158" y="0" width="1" height="24" fill="#3A2418" />
            <rect x="162" y="0" width="3" height="24" fill="#3A2418" />
            <rect x="168" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="173" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="180" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="185" y="0" width="4" height="24" fill="#3A2418" />
            <rect x="192" y="0" width="2" height="24" fill="#3A2418" />
            <rect x="197" y="0" width="3" height="24" fill="#3A2418" />
          </svg>
          <span className="text-[10px] text-[#8B857D] font-mono tracking-widest uppercase block mt-0.5">
            AUTH-{order.order_number}
          </span>
        </div>

        <p className="text-[13px] font-bold text-[#3A2418] uppercase tracking-wider mb-1">ODA MARKET</p>
        <p className="text-[11px] text-[#8B857D]">
          Quality Products • Fast & Reliable Delivery • Better Value Every Day
        </p>
      </div>
    </div>
  );
};
