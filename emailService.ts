import { Resend } from 'resend';

let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendOrderConfirmationEmail(orderInfo: any) {
  try {
    const { 
      customerName, 
      customerEmail, 
      orderNumber, 
      orderDate, 
      items, 
      subtotal, 
      deliveryFee, 
      total, 
      paymentMethod, 
      paymentStatus, 
      deliveryAddress, 
      trackingUrl, 
      transactionReference 
    } = orderInfo;

    const formatCurrency = (amount: number) => `KSh ${Number(amount).toLocaleString()}`;

    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #374151;">
          <strong>${item.name}</strong><br/>
          <span style="color: #6B7280; font-size: 14px;">${item.quantity} &times; ${formatCurrency(item.price)}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #111827; font-weight: 500;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmed 🎉</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #C65A28; padding: 32px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 16px; margin-bottom: 24px; }
        .card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .card-row:last-child { margin-bottom: 0; }
        .label { color: #6B7280; font-size: 14px; font-weight: 500; }
        .value { color: #111827; font-size: 14px; font-weight: 600; }
        table { w-full: 100%; width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .totals { margin-top: 24px; border-top: 2px solid #E5E7EB; padding-top: 16px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .totals-row.grand { font-size: 18px; font-weight: bold; color: #C65A28; margin-top: 12px; }
        .delivery-info { background-color: #FAF5EC; border: 1px solid #E8DCC9; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
        .delivery-title { font-size: 16px; font-weight: bold; color: #3A2418; margin-top: 0; margin-bottom: 12px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #C65A28; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; border-top: 1px solid #F3F4F6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed 🎉</h1>
        </div>
        <div class="content">
          <div class="greeting">
            Thank you for your order, <strong>${customerName}</strong>. Your order has been successfully confirmed and is now being processed.
          </div>
          
          <div class="card">
            <table style="width: 100%; border: none; margin: 0;">
              <tr><td class="label" style="padding-bottom: 8px;">Order Number:</td><td class="value" style="text-align: right;">${orderNumber}</td></tr>
              <tr><td class="label" style="padding-bottom: 8px;">Order Date:</td><td class="value" style="text-align: right;">${orderDate}</td></tr>
              <tr><td class="label" style="padding-bottom: 8px;">Payment Status:</td><td class="value" style="text-align: right; color: #059669;">${paymentStatus}</td></tr>
              <tr><td class="label" style="padding-bottom: 8px;">Payment Method:</td><td class="value" style="text-align: right;">${paymentMethod}</td></tr>
              <tr><td class="label">Transaction Ref:</td><td class="value" style="text-align: right;">${transactionReference || 'N/A'}</td></tr>
            </table>
          </div>

          <h3 style="margin-top: 0; color: #111827;">Order Summary</h3>
          <table>
            ${itemsHtml}
          </table>

          <div class="totals">
            <table style="width: 100%; border: none; margin: 0;">
              <tr><td class="label" style="padding-bottom: 8px;">Subtotal:</td><td class="value" style="text-align: right;">${formatCurrency(subtotal)}</td></tr>
              <tr><td class="label" style="padding-bottom: 8px;">Delivery Fee:</td><td class="value" style="text-align: right;">${formatCurrency(deliveryFee)}</td></tr>
              <tr><td class="label" style="font-size: 18px; font-weight: bold; color: #C65A28; padding-top: 8px;">Total:</td><td class="value" style="text-align: right; font-size: 18px; font-weight: bold; color: #C65A28; padding-top: 8px;">${formatCurrency(total)}</td></tr>
            </table>
          </div>

          <div class="delivery-info" style="margin-top: 24px;">
            <h3 class="delivery-title">Delivery Information</h3>
            <p style="margin: 0 0 8px 0; color: #5F5A54;"><strong>Address:</strong> ${deliveryAddress}</p>
            <p style="margin: 0; color: #5F5A54;"><strong>Customer:</strong> ${customerName}</p>
          </div>

          <div class="btn-container">
            <a href="${trackingUrl}" class="btn" style="color: #ffffff;">Track My Order</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ODA Market. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.warn("[EMAIL EDGE FUNCTION] ⚠️ RESEND_API_KEY is not configured. Email not sent.");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }
    const data = await resendClient.emails.send({
      from: 'ODA Market <orders@odamarket.co.ke>',
      to: [customerEmail],
      subject: `Order Confirmed: ${orderNumber} 🎉`,
      html: htmlContent,
    });
    
    console.log(`[EMAIL EDGE FUNCTION] 📧 Successfully sent confirmation to ${customerEmail}. Resend ID:`, data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("[EMAIL EDGE FUNCTION] ❌ Failed to send order confirmation email:", error);
    // Important: we just return false instead of throwing to not break the payment flow
    return { success: false, error };
  }
}
