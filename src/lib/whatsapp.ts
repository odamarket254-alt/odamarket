import { format } from 'date-fns';

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface WhatsAppOrderData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  delivery_location: string;
  delivery_address: string;
  status: string;
  transaction_id?: string;
}

export const generateWhatsAppMessage = (order: WhatsAppOrderData): string => {
  const formattedDate = order.created_at 
    ? format(new Date(order.created_at), 'dd MMM yyyy • hh:mm a') 
    : 'N/A';

  const itemsList = order.items.map(item => 
    `• ${item.product_name} × ${item.quantity}\n  KSh ${item.total_price.toLocaleString()}`
  ).join('\n\n');

  const statusMap: Record<string, string> = {
    'pending': '🟠 Pending',
    'processing': '🟠 Processing / New Order',
    'paid': '🟢 New Paid Order',
    'shipped': '🔵 Shipped',
    'delivered': '✅ Delivered',
    'cancelled': '🔴 Cancelled'
  };

  const displayStatus = statusMap[order.status.toLowerCase()] || `🟠 ${order.status}`;

  return `🛒 ODAMARKET | NEW PAID ORDER
━━━━━━━━━━━━━━━━━━
Order ${order.order_number}
${formattedDate}

CUSTOMER
${order.customer_name}
${order.customer_phone}

ORDER ITEMS
${itemsList}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
Subtotal: KSh ${order.subtotal.toLocaleString()}
Delivery: KSh ${order.delivery_fee.toLocaleString()}
Discount: KSh ${order.discount.toLocaleString()}

TOTAL: KSh ${order.grand_total.toLocaleString()}

PAYMENT
Method: ${order.payment_method}
Status: ${order.payment_status} ✅

DELIVERY
Location: ${order.delivery_location}
Address: ${order.delivery_address}

ORDER STATUS
${displayStatus}

━━━━━━━━━━━━━━━━━━
OdaMarket
Quality. Value. Convenience.`;
};

export const ODAMARKET_WHATSAPP_NUMBER = "254792867386";

export const getWhatsAppUrl = (message: string): string => {
  const ownerNumber = import.meta.env.VITE_WHATSAPP_NUMBER || ODAMARKET_WHATSAPP_NUMBER;
  // Ensure the number is formatted as required: exactly the digits, no leading plus.
  // If a user puts 07... we should theoretically format it, but falling back to the constant is safer.
  const cleanNumber = ownerNumber.replace(/[^0-9]/g, '');
  const finalNumber = cleanNumber.startsWith('0') ? '254' + cleanNumber.substring(1) : cleanNumber;
  return `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
};
