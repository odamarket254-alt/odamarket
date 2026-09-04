const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('sendOrderConfirmationEmail')) {
  serverCode = `import { sendOrderConfirmationEmail } from "./emailService.js";\n` + serverCode;
}

const targetStr = `if (product) await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.product_id);
                 }
               }`;

const injectionStr = `
               // SEND PROFESSIONAL ORDER CONFIRMATION EMAIL
               try {
                 const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', order.user_id).single();
                 
                 let customerName = userProfile?.first_name ? \`\${userProfile.first_name} \${userProfile.last_name || ''}\`.trim() : "Customer";
                 let customerEmail = userProfile?.email;
                 let deliveryAddress = "N/A";
                 
                 if (order.notes) {
                   try {
                     const parsedNotes = JSON.parse(order.notes);
                     if (parsedNotes.shippingDetails) {
                       deliveryAddress = parsedNotes.shippingDetails.fullAddress || parsedNotes.shippingDetails.location || "N/A";
                     }
                     if (parsedNotes.contactDetails) {
                       if (!customerName || customerName === "Customer") {
                         customerName = parsedNotes.contactDetails.fullName || customerName;
                       }
                       if (!customerEmail) {
                         customerEmail = parsedNotes.contactDetails.userEmail || customerEmail;
                       }
                     }
                   } catch(e) {}
                 }

                 if (customerEmail) {
                   const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://odamarket.co.ke";
                   
                   const orderInfo = {
                     customerName,
                     customerEmail,
                     orderNumber: "ODA-" + orderId.substring(0, 8).toUpperCase(),
                     orderDate: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                     items: (items || []).map(i => ({ name: i.product_name || 'Product', quantity: i.quantity || 1, price: i.unit_price || 0 })),
                     subtotal: order.subtotal || 0,
                     deliveryFee: order.delivery_fee || 0,
                     total: order.total || 0,
                     paymentMethod: "Paystack",
                     paymentStatus: "PAID",
                     deliveryAddress,
                     trackingUrl: \`\${appUrl}/track-order?id=\${orderId}\`,
                     transactionReference: reference
                   };
                   
                   // Fire and forget email dispatch to not block the webhook response
                   sendOrderConfirmationEmail(orderInfo).catch(err => console.error("Email error:", err));
                 } else {
                   console.warn("[EMAIL EDGE FUNCTION] ⚠️ No email address found for order", orderId);
                 }
               } catch (emailDataError) {
                 console.error("[EMAIL EDGE FUNCTION] ❌ Error gathering data for confirmation email:", emailDataError);
               }
`;

if (serverCode.includes(targetStr) && !serverCode.includes('SEND PROFESSIONAL ORDER CONFIRMATION EMAIL')) {
  serverCode = serverCode.replace(targetStr, targetStr + injectionStr);
  fs.writeFileSync('server.ts', serverCode);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find target string in server.ts or already patched");
}
