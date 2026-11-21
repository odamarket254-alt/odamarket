import React from 'react';
import {
  X,
  Package,
  User,
  Calendar,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BellRing
} from 'lucide-react';
import { format } from 'date-fns';

export interface OrderPaymentReminderRecord {
  id: string;
  order_id: string;
  buyer_id: string | null;
  buyer_email: string;
  status: 'sent' | 'failed';
  resend_email_id: string | null;
  error_message: string | null;
  sent_by_admin_id: string;
  sent_by_admin_email: string | null;
  sent_by_admin_name: string | null;
  sent_at: string;
  created_at: string;
}

export interface OrderReminderSummary {
  orderId: string;
  totalAttempts: number;
  sentCount: number;
  failedCount: number;
  lastRemindedAt: string | null;
  lastAttemptAt: string | null;
  lastStatus: 'sent' | 'failed' | null;
  lastResendEmailId: string | null;
  lastAdminName: string | null;
  lastAdminEmail: string | null;
  cooldownActive: boolean;
  nextEligibleAt: string | null;
  reminders: OrderPaymentReminderRecord[];
}

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
  reminderSummary?: OrderReminderSummary | null;
  loadingReminders?: boolean;
  isRemindable?: boolean;
  isReminding?: boolean;
  onRemindBuyer?: (order: any) => void;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  orderItems,
  loadingItems,
  reminderSummary,
  loadingReminders = false,
  isRemindable = false,
  isReminding = false,
  onRemindBuyer
}: OrderDetailsModalProps) {
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

  const customerName = contactDetails?.fullName || 
    (order.customer?.first_name ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : null) || 
    'Guest Customer';
  const customerPhone = contactDetails?.userPhone || order.customer?.phone_number || order.customer_phone || 'N/A';
  const customerEmail = contactDetails?.userEmail || order.customer?.email || order.customer_email || 'N/A';
  const deliveryAddress = shippingDetails?.deliveryAddress || shippingDetails?.fullAddress || order.delivery_address || 'N/A';
  const deliveryLocation = shippingDetails?.location || order.delivery_location || 'N/A';

  const isPaid = order.payment_status === 'success';
  const sentCount = reminderSummary?.sentCount ?? 0;
  const lastRemindedAt = reminderSummary?.lastRemindedAt || null;
  const cooldownActive = Boolean(reminderSummary?.cooldownActive);
  const nextEligibleAt = reminderSummary?.nextEligibleAt || null;
  const reminderHistory = reminderSummary?.reminders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col text-neutral-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header - Clean White & Orange Theme */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-white via-white to-orange-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#C65A28]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Order Details
              </h2>
              <p className="text-xs font-mono font-semibold text-[#C65A28]">
                {order?.order_number || '#' + (order?.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-orange-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Customer & Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="bg-gradient-to-br from-orange-50/40 to-white border border-orange-100/90 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#C65A28]" />
                <span>Customer Information</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="flex justify-between">
                  <span className="text-neutral-500">Name:</span> 
                  <span className="font-bold text-neutral-900">{customerName}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-neutral-500">Phone:</span> 
                  <span className="font-semibold text-neutral-800">{customerPhone}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-neutral-500">Email:</span> 
                  <span className="font-semibold text-neutral-800 truncate max-w-[190px]">{customerEmail}</span>
                </p>
                <p className="flex justify-between items-start pt-1 border-t border-orange-100/60">
                  <span className="text-neutral-500">Location:</span> 
                  <span className="font-semibold text-neutral-800 text-right">{deliveryLocation}</span>
                </p>
                <p className="flex justify-between items-start">
                  <span className="text-neutral-500">Address:</span> 
                  <span className="font-semibold text-neutral-800 text-right max-w-[190px] break-words">{deliveryAddress}</span>
                </p>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-gradient-to-br from-orange-50/40 to-white border border-orange-100/90 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#C65A28]" />
                <span>Order Summary</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="flex justify-between">
                  <span className="text-neutral-500">Order ID:</span> 
                  <span className="font-mono font-bold text-neutral-900">
                    {order?.order_number || '#' + (order?.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN')}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-neutral-500">Date & Time:</span> 
                  <span className="font-semibold text-neutral-800">
                    {order?.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy • h:mm a') : 'N/A'}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-neutral-500">Fulfillment:</span> 
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize bg-orange-50 text-[#C65A28] border border-orange-200">
                    {(parsedNotes?.sub_status || order.status || 'pending').replace(/_/g, ' ')}
                  </span>
                </p>
                <p className="flex justify-between items-center pt-1 border-t border-orange-100/60">
                  <span className="text-neutral-500">Payment Status:</span> 
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                    isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isPaid ? 'PAID ✓' : (order.payment_status || 'PENDING')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Reminder Tracking & History */}
          <div className="bg-gradient-to-br from-orange-50/40 to-white border border-orange-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100/80 text-[#C65A28] flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Payment Reminder History
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {isRemindable
                      ? 'Pending order email reminders include a 24-hour duplicate cooldown.'
                      : 'Audit log of payment reminders sent while order was pending.'}
                  </p>
                </div>
              </div>

              {isRemindable && onRemindBuyer && (
                <button
                  onClick={() => onRemindBuyer(order)}
                  disabled={isReminding || cooldownActive}
                  title={
                    cooldownActive && nextEligibleAt
                      ? `24h cooldown active until ${format(new Date(nextEligibleAt), 'MMM dd, h:mm a')}`
                      : 'Send pending payment reminder email to buyer'
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isReminding || cooldownActive
                      ? 'bg-orange-50 text-orange-400 border border-orange-200 cursor-not-allowed'
                      : 'bg-white hover:bg-orange-50 text-[#C65A28] border border-orange-300 hover:border-[#C65A28] active:scale-95'
                  }`}
                >
                  {isReminding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reminder...</span>
                    </>
                  ) : cooldownActive ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Cooldown Active (24h)</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Remind Buyer</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Summary KPIs: Reminder Count & Last Reminder Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white border border-orange-100 rounded-xl px-3 py-2.5">
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Reminders Sent
                </span>
                <span className="text-sm font-extrabold text-neutral-900 tabular-nums">
                  {loadingReminders ? '...' : sentCount}
                </span>
                {reminderSummary && reminderSummary.failedCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-semibold text-rose-600">
                    ({reminderSummary.failedCount} failed)
                  </span>
                )}
              </div>

              <div className="bg-white border border-orange-100 rounded-xl px-3 py-2.5">
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Last Reminder Date
                </span>
                <span className="text-xs font-bold text-neutral-900">
                  {loadingReminders
                    ? 'Loading...'
                    : lastRemindedAt
                    ? format(new Date(lastRemindedAt), 'MMM dd, yyyy • h:mm a')
                    : 'Never reminded'}
                </span>
              </div>

              <div className="bg-white border border-orange-100 rounded-xl px-3 py-2.5">
                <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Cooldown Status
                </span>
                <span
                  className={`text-xs font-bold ${
                    !isRemindable
                      ? 'text-neutral-500'
                      : cooldownActive
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {!isRemindable
                    ? 'Not applicable'
                    : cooldownActive && nextEligibleAt
                    ? `Next: ${format(new Date(nextEligibleAt), 'MMM dd, h:mm a')}`
                    : 'Ready to send'}
                </span>
              </div>
            </div>

            {/* Detailed Audit Log Entries */}
            {!loadingReminders && reminderHistory.length > 0 && (
              <div className="bg-white border border-orange-100 rounded-xl overflow-hidden">
                <div className="divide-y divide-orange-100/70 max-h-44 overflow-y-auto">
                  {reminderHistory.slice(0, 10).map((rec) => {
                    const isSent = rec.status === 'sent';
                    return (
                      <div
                        key={rec.id}
                        className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase text-[10px] border shrink-0 ${
                              isSent
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isSent ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <AlertCircle className="w-2.5 h-2.5" />
                            )}
                            {rec.status}
                          </span>
                          <span className="font-semibold text-neutral-800 truncate">
                            {rec.buyer_email}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-neutral-500 sm:text-right">
                          <span>
                            {format(new Date(rec.sent_at || rec.created_at), 'MMM dd, yyyy h:mm a')}
                          </span>
                          <span className="truncate max-w-[140px]" title={rec.sent_by_admin_email || ''}>
                            By: <strong className="text-neutral-700">{rec.sent_by_admin_name || rec.sent_by_admin_email || 'Admin'}</strong>
                          </span>
                          {rec.resend_email_id && (
                            <span
                              className="font-mono text-[10px] text-[#C65A28] bg-orange-50 px-1.5 py-0.5 rounded"
                              title={`Resend Email ID: ${rec.resend_email_id}`}
                            >
                              {rec.resend_email_id.slice(0, 14)}
                            </span>
                          )}
                          {!isSent && rec.error_message && (
                            <span className="text-rose-600 truncate max-w-[200px]" title={rec.error_message}>
                              {rec.error_message}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ordered Products Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Ordered Products ({orderItems.length})
              </h3>
            </div>
            
            <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-orange-50/50 border-b border-orange-100 text-neutral-600 font-bold">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/60">
                  {loadingItems ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                        <div className="w-6 h-6 border-2 border-[#C65A28] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading products...
                      </td>
                    </tr>
                  ) : orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-neutral-400 font-medium">No product records found.</p>
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name} 
                                className="w-10 h-10 rounded-lg object-cover bg-white border border-orange-100 shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C65A28] shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <span className="font-bold text-neutral-900 leading-snug">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-neutral-800">{item.quantity}x</td>
                        <td className="px-4 py-3 text-right text-neutral-600 tabular-nums">
                          KSh {Number(item.unit_price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-neutral-900 text-right tabular-nums">
                          KSh {Number(getSubtotal(item)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2 border-t border-orange-100">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-800 tabular-nums">
                  KSh {Number(order.subtotal || order.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Delivery Fee</span>
                <span className="font-semibold text-neutral-800 tabular-nums">
                  {Number(order.delivery_fee || order.shipping_fee || 0) > 0 
                    ? `KSh ${Number(order.delivery_fee || order.shipping_fee || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
                    : 'FREE'}
                </span>
              </div>
              {Number(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold tabular-nums">
                    -KSh {Number(order.discount_amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-neutral-900 pt-2 border-t border-orange-200">
                <span>Grand Total</span>
                <span className="text-[#C65A28] tabular-nums text-lg">
                  KSh {Number(order.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-orange-100 bg-gradient-to-r from-white via-white to-orange-50/40 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-gradient-to-r from-[#C65A28] to-orange-500 hover:from-[#b34e20] hover:to-[#C65A28] text-white font-bold text-xs rounded-xl shadow-xs shadow-orange-500/20 active:scale-95 transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
