import { generateWhatsAppMessage, getWhatsAppUrl } from './src/lib/whatsapp';

const mock = {
      order_number: "ORD-1234",
      created_at: new Date().toISOString(),
      customer_name: "Customer",
      customer_phone: "+254 700 000000",
      customer_email: "",
      items: [{
        product_name: "Test",
        quantity: 1,
        unit_price: 10,
        total_price: 10
      }],
      subtotal: 10,
      delivery_fee: 0,
      discount: 0,
      grand_total: 10,
      payment_method: "M-Pesa",
      payment_status: "PAID",
      delivery_location: "Nairobi",
      delivery_address: "Address",
      status: "pending",
      transaction_id: "TXN123"
    };
    
const msg = generateWhatsAppMessage(mock as any);
const url = getWhatsAppUrl(msg);
console.log(msg);
console.log(url);
