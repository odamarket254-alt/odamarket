const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// add the import for emailService if not present
if (!serverCode.includes('sendOrderConfirmationEmail')) {
  serverCode = `import { sendOrderConfirmationEmail } from "./emailService.ts";\n` + serverCode;
}

// Find the webhook block and replace it
const oldWebhookBlock = `          if (order && order.status === 'pending') { 
             const expectedAmount = Math.round(order.total * 100);
             if (event.data.amount === expectedAmount && event.data.currency === 'KES') {
               await supabase.from('orders').update({
                  status: 'processing',
                  payment_status: 'success',
                 payment_reference: reference
               }).eq('id', orderId);
               
               const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
               if (items) {
                 for (const item of items) {
                   const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                   if (product) await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.product_id);
                 }
               }
             }
          }`;

// It might have different formatting, let's just use regex or extract the whole block
