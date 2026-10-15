import React from 'react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

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
  showPaidStamp?: boolean;
  isPaymentVerified?: boolean;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  order,
  id = 'receipt-printable-container',
  className = '',
  showPaidStamp = true,
  isPaymentVerified = true
}) => {
  const formattedDate = React.useMemo(() => {
    if (!order.created_at) return format(new Date(), 'dd/MM/yyyy HH:mm');
    try {
      return format(new Date(order.created_at), 'dd/MM/yyyy  hh:mm a');
    } catch {
      return 'N/A';
    }
  }, [order.created_at]);

  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount || 0);

  return (
    <div
      id={id}
      className={`receipt-print-area bg-white text-neutral-900 w-full max-w-[380px] mx-auto border border-neutral-300/80 shadow-[0_8px_30px_rgba(0,0,0,0.07)] font-mono text-[11.5px] sm:text-[12px] leading-tight relative select-text ${className}`}
      style={{
        fontFamily: "'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace",
        letterSpacing: '-0.01em'
      }}
    >
      {/* Serrated Top Cut Edge (Simulating till cutter blade) */}
      <div className="w-full h-1.5 overflow-hidden bg-neutral-200/50 flex border-b border-neutral-200" aria-hidden="true">
        <svg className="w-full h-1.5 text-white block fill-current" viewBox="0 0 100 3" preserveAspectRatio="none">
          <polygon points="0,3 1.25,0 2.5,3 3.75,0 5,3 6.25,0 7.5,3 8.75,0 10,3 11.25,0 12.5,3 13.75,0 15,3 16.25,0 17.5,3 18.75,0 20,3 21.25,0 22.5,3 23.75,0 25,3 26.25,0 27.5,3 28.75,0 30,3 31.25,0 32.5,3 33.75,0 35,3 36.25,0 37.5,3 38.75,0 40,3 41.25,0 42.5,3 43.75,0 45,3 46.25,0 47.5,3 48.75,0 50,3 51.25,0 52.5,3 53.75,0 55,3 56.25,0 57.5,3 58.75,0 60,3 61.25,0 62.5,3 63.75,0 65,3 66.25,0 67.5,3 68.75,0 70,3 71.25,0 72.5,3 73.75,0 75,3 76.25,0 77.5,3 78.75,0 80,3 81.25,0 82.5,3 83.75,0 85,3 86.25,0 87.5,3 88.75,0 90,3 91.25,0 92.5,3 93.75,0 95,3 96.25,0 97.5,3 98.75,0 100,3" />
        </svg>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* SECTION 1: OdaMarket Logo and Store Heading */}
        <div className="receipt-section-1 text-center space-y-0.5">
          {/* Official OdaMarket Logo (Asset: public/oda-logo.png.jpeg) */}
          <div className="flex justify-center items-center py-1">
            <img
              src="/oda-logo.png.jpeg"
              alt="OdaMarket"
              className="h-9 w-auto object-contain max-w-[150px]"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const sibling = target.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = 'block';
              }}
            />
            {/* Fallback inline branding if image unavailable */}
            <div className="hidden" aria-label="OdaMarket">
              <span className="font-extrabold text-lg tracking-tight text-[#0A2E5C]">ODA</span>
              <span className="font-extrabold text-lg tracking-tight text-[#C65A28]">Market</span>
            </div>
          </div>

          <h1 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950">
            ODAMARKET SUPERMARKET
          </h1>
          <p className="text-[10px] text-neutral-600">
            Quality • Value • Convenience
          </p>
        </div>

        {/* SECTION 2: Store Contact Details */}
        <div className="receipt-section-2 text-center space-y-0.5 pt-0.5 border-t border-dotted border-neutral-300">
          <p className="text-[9.5px] text-neutral-600">
            Nairobi, Kenya • Tel: +254 700 000 000
          </p>
          <p className="text-[9px] text-neutral-500">
            Help: support@odamarket.com • Web: odamarket.com
          </p>
        </div>

        {/* SECTION 3: Receipt Title and Unique Order Number */}
        <div className="receipt-section-3">
          <div className="border-b border-dashed border-neutral-400 my-1.5" />
          <div className="text-[10.5px] font-bold text-[#C65A28] uppercase tracking-wider text-center pb-1">
            TAX INVOICE / CASH SALE
          </div>
          <div className="flex justify-between items-baseline text-[10.5px] text-neutral-800">
            <span className="text-neutral-500 uppercase">RECEIPT NO:</span>
            <span className="font-bold text-neutral-950 tracking-tight">#{order.order_number}</span>
          </div>
          <div className="flex justify-between items-baseline text-[10.5px] text-neutral-800">
            <span className="text-neutral-500 uppercase">TERMINAL:</span>
            <span className="font-medium text-neutral-700">POS-01 (ONLINE CHECKOUT)</span>
          </div>
        </div>

        {/* SECTION 4: Purchase Date and Time */}
        <div className="receipt-section-4">
          <div className="border-b border-dashed border-neutral-400 my-1.5" />
          <div className="flex justify-between items-baseline text-[10.5px] text-neutral-800">
            <span className="text-neutral-500 uppercase">DATE / TIME:</span>
            <span className="font-medium text-neutral-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-baseline text-[10.5px] text-neutral-800">
            <span className="text-neutral-500 uppercase">CASHIER:</span>
            <span className="font-medium text-neutral-700">SYSTEM / M-PESA GATEWAY</span>
          </div>
        </div>

        {/* SECTION 5: Customer Details and Delivery Information */}
        <div className="receipt-section-5">
          <div className="border-b border-dashed border-neutral-400 my-1.5" />
          <div className="space-y-0.5 text-[10.5px] text-neutral-800">
            <div className="flex justify-between items-start gap-2">
              <span className="text-neutral-500 uppercase shrink-0">CUSTOMER:</span>
              <span className="font-bold text-neutral-950 text-right">{order.customer_name}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-neutral-500 uppercase shrink-0">PHONE:</span>
              <span className="font-medium text-neutral-900 text-right">{order.customer_phone}</span>
            </div>
            {order.customer_email && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">EMAIL:</span>
                <span className="font-medium text-neutral-800 text-right truncate max-w-[200px]">
                  {order.customer_email}
                </span>
              </div>
            )}
            <div className="flex justify-between items-start gap-2">
              <span className="text-neutral-500 uppercase shrink-0">LOCATION:</span>
              <span className="font-medium text-neutral-800 text-right">{order.delivery_location}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-neutral-500 uppercase shrink-0">ADDRESS:</span>
              <span className="font-medium text-neutral-800 text-right max-w-[200px] break-words">
                {order.delivery_address}
              </span>
            </div>
            {order.delivery_method && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">METHOD:</span>
                <span className="font-semibold text-[#C65A28] text-right uppercase">
                  {order.delivery_method === 'express' ? 'Express Boda (30-60 min)' : 'Standard Delivery'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Itemized Products, Quantities, Unit Prices, Line Totals */}
        <div className="receipt-section-6">
          <div className="border-b border-dashed border-neutral-400 my-1.5" />
          <div className="grid grid-cols-[32px_1fr_95px] gap-1 text-[9.5px] font-bold uppercase text-neutral-500 pb-1 border-b border-neutral-300">
            <span>QTY</span>
            <span>DESCRIPTION</span>
            <span className="text-right">AMOUNT (KSH)</span>
          </div>

          <div className="py-1 space-y-1.5">
            {order.items && order.items.length > 0 ? (
              order.items.map((it, idx) => {
                const lineTotal = it.total_price || (it.unit_price * it.quantity);
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="grid grid-cols-[32px_1fr_95px] gap-1 items-start text-[11px]">
                      <span className="font-bold text-neutral-950">{it.quantity}x</span>
                      <span className="font-medium text-neutral-900 leading-snug break-words">
                        {it.product_name}
                      </span>
                      <span className="text-right font-bold tabular-nums text-neutral-950">
                        {Number(lineTotal).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {it.quantity > 1 && (
                      <div className="pl-8 text-[9.5px] text-neutral-500 tabular-nums">
                        @ KSh {Number(it.unit_price).toLocaleString('en-KE', { minimumFractionDigits: 2 })} each
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-center text-neutral-400 text-xs italic">
                No items recorded
              </div>
            )}
          </div>
        </div>

        {/* SECTION 7: Subtotal, Delivery Fee, Discounts, and Final Total */}
        <div className="receipt-section-7">
          <div className="border-b border-dashed border-neutral-400 my-1.5" />
          <div className="space-y-1 text-[11px] text-neutral-800">
            <div className="flex justify-between items-baseline">
              <span className="text-neutral-600 uppercase">SUBTOTAL:</span>
              <span className="font-medium tabular-nums text-neutral-900">
                KSh {Number(order.subtotal).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-neutral-600 uppercase">DELIVERY FEE:</span>
              <span className="font-medium tabular-nums text-neutral-900">
                {deliveryFee > 0
                  ? `KSh ${deliveryFee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'FREE'}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-baseline text-emerald-700">
                <span className="uppercase">DISCOUNT:</span>
                <span className="font-medium tabular-nums">
                  -KSh {discount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Supermarket Double Horizontal Rule for Final Total */}
            <div className="border-t-2 border-b-2 border-neutral-950 py-1.5 my-1.5 flex justify-between items-baseline">
              <span className="text-[13px] font-black tracking-wide uppercase text-neutral-950">
                TOTAL PAID:
              </span>
              <span className="text-[14px] font-black tabular-nums text-[#C65A28]">
                KSh {Number(order.grand_total).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 8: M-Pesa Payment Method and Verified Payment Status */}
        <div className="receipt-section-8 space-y-1">
          <div className="space-y-0.5 text-[10px] text-neutral-800 bg-neutral-50 p-2 rounded border border-neutral-200">
            <div className="flex justify-between items-baseline">
              <span className="text-neutral-500 uppercase">PAYMENT METHOD:</span>
              <span className="font-bold text-neutral-900 uppercase">
                {order.payment_method || 'M-Pesa'} (Paystack)
              </span>
            </div>

            {order.transaction_id && (
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-neutral-500 uppercase shrink-0">PAYSTACK REF:</span>
                <span className="font-mono text-[9.5px] font-bold text-neutral-900 break-all select-all text-right">
                  {order.transaction_id}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline">
              <span className="text-neutral-500 uppercase">PAYMENT STATUS:</span>
              <span className={`font-bold uppercase ${isPaymentVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isPaymentVerified ? 'CONFIRMED / PAID ✓' : 'PENDING VERIFICATION'}
              </span>
            </div>
          </div>

          {/* Tasteful PAID Rubber Stamp (Appears only on verified payments in Phase 4) */}
          {showPaidStamp && (
            <div className="py-1">
              {isPaymentVerified ? (
                <div className="animate-paid-stamp border-2 border-emerald-600 bg-emerald-50/90 rounded px-3 py-1.5 text-center text-emerald-800 shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700" />
                    <span>★ OFFICIAL RECEIPT • PAID IN FULL ★</span>
                  </div>
                  <div className="text-[9px] font-mono text-emerald-700 tracking-tight mt-0.5">
                    ODAMARKET LEDGER • M-PESA SETTLED &amp; VERIFIED
                  </div>
                </div>
              ) : (
                <div className="border border-amber-500/80 bg-amber-50 rounded px-3 py-1 text-center text-amber-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    PAYMENT PENDING CONFIRMATION
                  </div>
                  <div className="text-[8.5px] font-mono text-amber-700 mt-0.5">
                    ORDER RECORDED • AWAITING MPESA CLEARANCE
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 9: Thank-You Message and Receipt Footer */}
        <div className="receipt-section-9 space-y-1 pt-1">
          {/* Thermal Barcode */}
          <div className="text-center pt-1 space-y-0.5">
            <svg className="h-6 w-44 mx-auto" viewBox="0 0 200 24" preserveAspectRatio="none">
              <rect x="0" y="0" width="3" height="24" fill="#111827" />
              <rect x="5" y="0" width="1" height="24" fill="#111827" />
              <rect x="8" y="0" width="4" height="24" fill="#111827" />
              <rect x="15" y="0" width="2" height="24" fill="#111827" />
              <rect x="20" y="0" width="5" height="24" fill="#111827" />
              <rect x="28" y="0" width="2" height="24" fill="#111827" />
              <rect x="33" y="0" width="1" height="24" fill="#111827" />
              <rect x="36" y="0" width="4" height="24" fill="#111827" />
              <rect x="43" y="0" width="2" height="24" fill="#111827" />
              <rect x="48" y="0" width="6" height="24" fill="#111827" />
              <rect x="57" y="0" width="1" height="24" fill="#111827" />
              <rect x="61" y="0" width="3" height="24" fill="#111827" />
              <rect x="67" y="0" width="2" height="24" fill="#111827" />
              <rect x="72" y="0" width="5" height="24" fill="#111827" />
              <rect x="80" y="0" width="1" height="24" fill="#111827" />
              <rect x="84" y="0" width="4" height="24" fill="#111827" />
              <rect x="91" y="0" width="2" height="24" fill="#111827" />
              <rect x="96" y="0" width="4" height="24" fill="#111827" />
              <rect x="103" y="0" width="1" height="24" fill="#111827" />
              <rect x="107" y="0" width="3" height="24" fill="#111827" />
              <rect x="113" y="0" width="5" height="24" fill="#111827" />
              <rect x="121" y="0" width="2" height="24" fill="#111827" />
              <rect x="126" y="0" width="3" height="24" fill="#111827" />
              <rect x="132" y="0" width="1" height="24" fill="#111827" />
              <rect x="136" y="0" width="4" height="24" fill="#111827" />
              <rect x="143" y="0" width="2" height="24" fill="#111827" />
              <rect x="148" y="0" width="5" height="24" fill="#111827" />
              <rect x="156" y="0" width="1" height="24" fill="#111827" />
              <rect x="160" y="0" width="3" height="24" fill="#111827" />
              <rect x="166" y="0" width="2" height="24" fill="#111827" />
              <rect x="171" y="0" width="4" height="24" fill="#111827" />
              <rect x="178" y="0" width="2" height="24" fill="#111827" />
              <rect x="183" y="0" width="4" height="24" fill="#111827" />
              <rect x="190" y="0" width="2" height="24" fill="#111827" />
              <rect x="195" y="0" width="3" height="24" fill="#111827" />
            </svg>
            <div className="text-[9.5px] text-neutral-500 tracking-widest uppercase">
              * ODA-{order.order_number} *
            </div>
          </div>

          {/* Supermarket Greeting & ETR record */}
          <div className="text-center pt-1 pb-0.5 space-y-0.5 text-[9.5px] text-neutral-600">
            <p className="font-bold text-neutral-900">
              THANK YOU FOR SHOPPING AT ODAMARKET!
            </p>
            <p>KARIBU TENA • PLEASE VISIT US AGAIN</p>
            <p className="text-[8.5px] text-neutral-400">
              PIN: P051234567Z • ETR FISCAL RECORD
            </p>
            <p className="text-[8.5px] text-neutral-400">
              A confirmation email was dispatched via Resend
            </p>
          </div>
        </div>
      </div>

      {/* Serrated Bottom Cut Edge (Torn till paper teeth extending downward) */}
      <div className="w-full h-2.5 overflow-hidden flex leading-none -mb-px" aria-hidden="true">
        <svg className="w-full h-2.5 text-white block fill-current" viewBox="0 0 100 5" preserveAspectRatio="none">
          <polygon points="0,0 2,5 4,0 6,5 8,0 10,5 12,0 14,5 16,0 18,5 20,0 22,5 24,0 26,5 28,0 30,5 32,0 34,5 36,0 38,5 40,0 42,5 44,0 46,5 48,0 50,5 52,0 54,5 56,0 58,5 60,0 62,5 64,0 66,5 68,0 70,5 72,0 74,5 76,0 78,5 80,0 82,5 84,0 86,5 88,0 90,5 92,0 94,5 96,0 98,5 100,0" />
        </svg>
      </div>
    </div>
  );
};
