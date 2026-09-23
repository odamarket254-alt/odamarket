import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logEmailDiagnostics } from './src/lib/emailDiagnostics.js';

// Lazy initialized Resend client
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Lazy initialized Supabase admin client
let supabaseAdminClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!url || !serviceKey) {
    return null;
  }
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminClient;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber: string;
  orderId: string;
  orderDate: string;
  items: OrderEmailItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  total: number;
  deliveryMethod: string;
  deliveryAddress: string;
  recipientName?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  orderStatus: string;
  storeName?: string;
  trackingUrl: string;
}

export interface SendOrderEmailResult {
  success: boolean;
  skipped?: boolean;
  alreadySent?: boolean;
  orderId?: string;
  resendId?: string;
  sentAt?: string;
  recipient?: string;
  error?: string;
  reason?: string;
}

/**
 * Format amounts into Kenyan Shillings (KSh)
 */
export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Validates whether an email string is real and deliverable (not empty, not placeholder/example.com)
 */
function isValidCustomerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || !trimmed.includes('@') || !trimmed.includes('.')) return false;
  if (trimmed.endsWith('@example.com') || trimmed.endsWith('@placeholder.com') || trimmed.includes('test@test')) {
    return false;
  }
  // Basic standard RFC email regex check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Builds responsive, email-client compatible HTML matching ODA Market brand guidelines
 */
export function buildOrderConfirmationEmailHtml(data: OrderEmailData): string {
  const {
    customerName,
    orderNumber,
    orderDate,
    items,
    subtotal,
    deliveryFee,
    discountAmount = 0,
    total,
    deliveryMethod,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    paymentReference,
    orderStatus,
    storeName,
    trackingUrl,
  } = data;

  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
  const deliveryDisplay = deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free';
  const deliveryMethodLabel = deliveryMethod === 'express' ? 'Express Delivery (Same Day)' : (deliveryMethod === 'pickup' ? 'Store Pickup' : 'Standard Delivery');

  // Render product line items
  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0E6D8; vertical-align: top;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #3A2418; line-height: 1.4;">
                ${item.name}
              </p>
              <p style="margin: 0; font-size: 13px; color: #8B857D; line-height: 1.4;">
                Qty: <strong style="color: #3A2418;">${item.quantity}</strong> &times; ${formatCurrency(item.unitPrice)}
              </p>
            </td>
            <td align="right" style="vertical-align: top; white-space: nowrap; padding-left: 12px;">
              <span style="font-size: 14px; font-weight: 700; color: #3A2418;">
                ${formatCurrency(item.lineTotal)}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed: ${orderNumber} - ODA Market</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF5EC; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid-padding { padding-left: 18px !important; padding-right: 18px !important; }
      .col-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; -webkit-font-smoothing: antialiased;">
  <!-- Full Background Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 12px 40px 12px;">
        
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(58, 36, 24, 0.08); border: 1px solid #E8DCC9;">
          
          <!-- Top Orange Brand Gradient Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #D96A27 0%, #F49C64 100%);"></td>
          </tr>

          <!-- Header Logo & Tagline -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px; text-align: center;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none;">
                <h1 style="margin: 0; color: #D96A27; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                  ODA MARKET
                </h1>
              </a>
              <p style="margin: 5px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                Fresh Groceries Delivered
              </p>
            </td>
          </tr>

          <!-- Confirmation Hero Banner -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #16A34A; color: #FFFFFF; border-radius: 50%; font-size: 22px; font-weight: bold; margin-bottom: 8px;">
                      &#10003;
                    </div>
                    <h2 style="margin: 4px 0 6px 0; color: #166534; font-size: 22px; font-weight: 800; line-height: 1.3;">
                      Order Confirmed
                    </h2>
                    <p style="margin: 0; color: #15803D; font-size: 14px; font-weight: 500; line-height: 1.5;">
                      Payment Received via ${paymentMethod || 'M-Pesa (Paystack)'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Friendly Greeting Message -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 20px 32px;">
              <p style="margin: 0 0 12px 0; color: #3A2418; font-size: 16px; font-weight: 600; line-height: 1.5;">
                Hello ${customerName || 'Valued Customer'},
              </p>
              <p style="margin: 0; color: #5F5A54; font-size: 15px; line-height: 1.6;">
                Thank you for your order. Your payment has been successfully received and your order is now confirmed. Our fulfillment team is carefully preparing your fresh produce and groceries.
              </p>
            </td>
          </tr>

          <!-- Order Summary Metadata Card -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D; width: 40%;">Order Number:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #D96A27; font-family: monospace;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Date:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #3A2418;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Payment Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #16A34A;">PAID</td>
                  </tr>
                  ${paymentReference ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Paystack Reference:</td>
                    <td align="right" style="padding: 5px 0; font-size: 12px; font-weight: 500; color: #5F5A54; font-family: monospace;">${paymentReference}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #D96A27; text-transform: uppercase;">${orderStatus || 'Processing'}</td>
                  </tr>
                  ${storeName ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Fulfillment:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #3A2418;">${storeName}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </td>
          </tr>

          <!-- Order Items Section -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 20px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #3A2418; border-bottom: 2px solid #E8DCC9; padding-bottom: 8px;">
                Items in Your Order
              </h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Order Financial Breakdown -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; border-radius: 12px; padding: 18px 20px; border: 1px solid #E8DCC9;">
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Subtotal:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Delivery Fee (${deliveryMethodLabel}):</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${deliveryDisplay}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #16A34A;">Discount Applied:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #16A34A;">-${formatCurrency(discountAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">Total Paid:</td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">${formatCurrency(total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery & Fulfillment Information -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #3A2418; text-transform: uppercase; letter-spacing: 0.5px;">
                  Delivery Information
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #3A2418;">
                  <strong>Method:</strong> ${deliveryMethodLabel}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #5F5A54; line-height: 1.5;">
                  <strong>Destination:</strong> ${deliveryAddress || 'Nairobi, Kenya'}
                </p>
                <p style="margin: 0; font-size: 14px; color: #5F5A54;">
                  <strong>Recipient:</strong> ${customerName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Call to Action Button: View My Order -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 32px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #D96A27;">
                          <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 16px 38px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27; box-shadow: 0 4px 14px rgba(217, 106, 39, 0.35); text-align: center;">
                            View My Order &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 14px 0 0 0; color: #8B857D; font-size: 12px; line-height: 1.5;">
                You can track live dispatch progress and review your items anytime.
              </p>
            </td>
          </tr>

          <!-- Need Help / Support Section -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 28px 32px;">
              <div style="border-top: 1px solid #F0E6D8; padding-top: 20px;">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #3A2418;">
                  Need assistance with your order?
                </h4>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #5F5A54; line-height: 1.5;">
                  Our Nairobi customer support team is ready to help:
                </p>
                <p style="margin: 0; font-size: 13px; color: #5F5A54; line-height: 1.6;">
                  &bull; Email: <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none; font-weight: 600;">info@odamarket.co.ke</a><br/>
                  &bull; Phone / WhatsApp: <a href="tel:0792867386" style="color: #D96A27; text-decoration: none; font-weight: 600;">0792867386</a><br/>
                  &bull; Hours: Mon - Fri: 8:00 AM - 5:00 PM | Sat: 9:00 AM - 3:00 PM
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF5EC; padding: 24px 30px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0 0 6px 0; color: #3A2418; font-size: 12px; font-weight: 700;">
                &copy; ${new Date().getFullYear()} ODA Market. All rights reserved.
              </p>
              <p style="margin: 0; color: #8B857D; font-size: 12px; line-height: 1.5;">
                Nairobi, Kenya &bull; Fresh Farm Produce & Groceries
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Main authoritative function to dispatch an order confirmation email via Resend
 * 
 * Flow:
 * 1. Checks that order exists and is paid/confirmed (payment_status === 'success' or status in [processing, paid, shipped, delivered])
 * 2. Idempotency: Checks whether confirmation email was already sent (unless forceResend is true)
 * 3. Resolves buyer's REAL email from Supabase Auth / profile
 * 4. Gathers order items and calculated totals from Supabase database
 * 5. Sends responsive branded HTML email via Resend
 * 6. Records dispatch timestamp and Resend message ID in orders table and notes
 * 7. Decoupled error handling: Resend failure never reverses or affects payment status
 */
export async function sendOrderConfirmationEmailForOrder(
  orderId: string, 
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) {
    console.warn('[Resend Email] Missing orderId for confirmation email.');
    return { success: false, error: 'Missing orderId' };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[Resend Email] Supabase admin client unavailable.');
    return { success: false, error: 'Database configuration unavailable' };
  }

  try {
    // 1. Fetch the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', cleanOrderId)
      .single();

    if (orderErr || !order) {
      console.error(`[Resend Email] Order ${cleanOrderId} not found:`, orderErr);
      return { success: false, error: `Order ${cleanOrderId} not found` };
    }

    // Safe Server-Side Diagnostic Logging (never prints secrets or PII tokens)
    logEmailDiagnostics(`Order ${cleanOrderId} (status=${order.status}, payment=${order.payment_status})`);

    // 2. Strict Payment Verification Check:
    // Only send if payment has actually succeeded / order is confirmed
    const isPaid = order.payment_status === 'success' || 
                   ['processing', 'paid', 'shipped', 'delivered'].includes(order.status);

    if (!isPaid) {
      console.warn(`[Resend Email] Skipped: Order ${cleanOrderId} is not confirmed/paid (status: ${order.status}, payment_status: ${order.payment_status}).`);
      return { 
        success: false, 
        skipped: true, 
        reason: `Order is not paid (status: ${order.status}, payment_status: ${order.payment_status})` 
      };
    }

    // 3. Idempotency Check: Prevent duplicate emails
    let parsedNotes: any = {};
    if (order.notes) {
      try {
        parsedNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
      } catch (e) {
        parsedNotes = {};
      }
    }

    const alreadySentAt = order.confirmation_email_sent_at || parsedNotes.confirmation_email_sent_at;
    const isAlreadySent = Boolean(alreadySentAt || parsedNotes.email_status === 'sent');

    if (isAlreadySent && !options.forceResend) {
      console.log(`[Resend Email] ℹ️ Idempotency: Order ${cleanOrderId} confirmation email already sent at ${alreadySentAt || 'prior execution'}. Skipping.`);
      return {
        success: true,
        skipped: true,
        alreadySent: true,
        orderId: cleanOrderId,
        sentAt: alreadySentAt,
        resendId: order.confirmation_email_id || parsedNotes.email_resend_id
      };
    }

    // 4. Resolve the buyer's REAL email from authenticated user / profile
    let buyerEmail: string | null = null;
    let customerName = 'Customer';
    let customerPhone: string | undefined = undefined;

    // A) Check Supabase Auth user record (authoritative)
    if (order.user_id) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
        if (authUser?.user?.email && isValidCustomerEmail(authUser.user.email)) {
          buyerEmail = authUser.user.email.trim();
        }
      } catch (authLookupErr) {
        console.warn(`[Resend Email] Note: Auth user lookup failed for ${order.user_id}:`, authLookupErr);
      }

      // B) Check public.profiles
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone_number')
          .eq('id', order.user_id)
          .single();

        if (profile) {
          if (!buyerEmail && profile.email && isValidCustomerEmail(profile.email)) {
            buyerEmail = profile.email.trim();
          }
          const profileFullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          if (profileFullName) {
            customerName = profileFullName;
          }
          if (profile.phone_number) {
            customerPhone = profile.phone_number;
          }
        }
      } catch (profLookupErr) {
        console.warn(`[Resend Email] Profile lookup notice:`, profLookupErr);
      }
    }

    // C) Check parsed notes from checkout contact details
    if (parsedNotes.contactDetails) {
      if (!buyerEmail && parsedNotes.contactDetails.userEmail && isValidCustomerEmail(parsedNotes.contactDetails.userEmail)) {
        buyerEmail = parsedNotes.contactDetails.userEmail.trim();
      }
      if (customerName === 'Customer' && parsedNotes.contactDetails.fullName) {
        customerName = parsedNotes.contactDetails.fullName.trim();
      }
      if (!customerPhone && parsedNotes.contactDetails.userPhone) {
        customerPhone = parsedNotes.contactDetails.userPhone;
      }
    }

    // D) Check shipping details
    if (parsedNotes.shippingDetails) {
      if (customerName === 'Customer' && parsedNotes.shippingDetails.recipientName) {
        customerName = parsedNotes.shippingDetails.recipientName.trim();
      }
      if (!customerPhone && parsedNotes.shippingDetails.recipientPhone) {
        customerPhone = parsedNotes.shippingDetails.recipientPhone;
      }
    }

    // Validate email
    if (!buyerEmail || !isValidCustomerEmail(buyerEmail)) {
      console.warn(`[Resend Email] ⚠️ No valid customer email found for order ${cleanOrderId}. Buyer ID: ${order.user_id}`);
      
      // Record failed state in notes safely
      parsedNotes.email_status = 'failed';
      parsedNotes.email_error = 'No valid customer email address found';
      await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', cleanOrderId);

      return {
        success: false,
        error: 'No valid customer email address found for this order'
      };
    }

    // 5. Fetch order items
    const { data: rawItems, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', cleanOrderId);

    if (itemsErr) {
      console.warn(`[Resend Email] Notice fetching order items for ${cleanOrderId}:`, itemsErr);
    }

    const items: OrderEmailItem[] = (rawItems || []).map((i: any) => {
      const quantity = Number(i.quantity) || 1;
      const unitPrice = Number(i.unit_price) || 0;
      const lineTotal = Number(i.subtotal || i.total_price) || (quantity * unitPrice);
      return {
        name: i.product_name || 'Grocery Item',
        quantity,
        unitPrice,
        lineTotal,
        image: i.product_image || undefined
      };
    });

    // 6. Gather shipping and metadata
    let deliveryAddress = 'Nairobi, Kenya';
    let deliveryMethod = 'standard';
    let deliveryFee = Number(order.delivery_fee) || 0;

    if (parsedNotes.shippingDetails) {
      deliveryAddress = parsedNotes.shippingDetails.fullAddress || 
                        parsedNotes.shippingDetails.location || 
                        deliveryAddress;
    }
    if (parsedNotes.deliveryMethod) {
      deliveryMethod = parsedNotes.deliveryMethod;
    }

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
    const trackingUrl = `${appUrl}/track-order?id=${cleanOrderId}`;
    const orderNumber = order.order_number || parsedNotes.orderNumber || `ODA-${cleanOrderId.substring(0, 8).toUpperCase()}`;
    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailData: OrderEmailData = {
      customerName,
      customerEmail: buyerEmail,
      customerPhone,
      orderNumber,
      orderId: cleanOrderId,
      orderDate,
      items,
      subtotal: Number(order.subtotal) || Number(order.total) - deliveryFee,
      deliveryFee,
      discountAmount: Number(order.discount_amount) || 0,
      total: Number(order.total) || 0,
      deliveryMethod,
      deliveryAddress,
      paymentMethod: parsedNotes.paymentMethod || 'M-Pesa (Paystack)',
      paymentStatus: 'PAID',
      paymentReference: order.payment_reference || parsedNotes.paymentReference,
      orderStatus: order.status || 'processing',
      storeName: 'ODA Market Verified Fulfillment',
      trackingUrl
    };

    // 7. Verify Resend Configuration
    const resend = getResendClient();
    if (!resend) {
      console.warn('[Resend Email] ⚠️ RESEND_API_KEY is not configured in environment. Skipping email dispatch.');
      
      parsedNotes.email_status = 'pending_configuration';
      parsedNotes.email_error = 'RESEND_API_KEY missing on server';
      await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', cleanOrderId);

      return {
        success: false,
        error: 'RESEND_API_KEY is not configured on server'
      };
    }

    const fromSender = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '') || 'ODA Market <orders@odamarket.co.ke>';
    const html = buildOrderConfirmationEmailHtml(emailData);

    console.log(`[Resend Email] 📤 Dispatching order confirmation email to ${buyerEmail} for ${orderNumber}...`);

    // 8. Dispatch Email via Resend
    const resendResponse = await resend.emails.send({
      from: fromSender,
      to: [buyerEmail],
      replyTo: 'info@odamarket.co.ke',
      subject: `Order Confirmed: ${orderNumber} - ODA Market`,
      html
    });

    if (resendResponse.error) {
      console.error(`[Resend Email] ❌ Resend API returned error for order ${cleanOrderId}:`, resendResponse.error);
      
      // Decoupled: Record failure in order notes safely without impacting order/payment status
      parsedNotes.email_status = 'failed';
      parsedNotes.email_error = resendResponse.error.message || JSON.stringify(resendResponse.error);
      parsedNotes.email_attempted_at = new Date().toISOString();
      await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', cleanOrderId);

      return {
        success: false,
        error: resendResponse.error.message || 'Resend error'
      };
    }

    const resendId = resendResponse.data?.id || 'resend_' + Date.now();
    const sentAtIso = new Date().toISOString();
    console.log(`[Resend Email] ✅ Successfully sent order confirmation to ${buyerEmail}! (Resend ID: ${resendId})`);

    // 9. Record Success Idempotently in Database
    parsedNotes.confirmation_email_sent_at = sentAtIso;
    parsedNotes.email_status = 'sent';
    parsedNotes.email_resend_id = resendId;
    parsedNotes.email_recipient = buyerEmail;

    // Try updating dedicated columns if available in database
    const { error: colUpdateError } = await supabase
      .from('orders')
      .update({
        confirmation_email_sent_at: sentAtIso,
        confirmation_email_status: 'sent',
        confirmation_email_id: resendId,
        notes: JSON.stringify(parsedNotes)
      })
      .eq('id', cleanOrderId);

    // If dedicated columns don't exist yet, fallback to updating notes
    if (colUpdateError) {
      await supabase
        .from('orders')
        .update({ notes: JSON.stringify(parsedNotes) })
        .eq('id', cleanOrderId);
    }

    return {
      success: true,
      orderId: cleanOrderId,
      resendId,
      sentAt: sentAtIso,
      recipient: buyerEmail
    };

  } catch (error: any) {
    console.error(`[Resend Email] ❌ Unexpected exception sending confirmation email for order ${cleanOrderId}:`, error);
    
    // Decoupled: Ensure failure does NOT alter or reverse payment
    return {
      success: false,
      error: error.message || 'Unexpected exception'
    };
  }
}

/**
 * Legacy wrapper for compatibility with existing imports
 */
export async function sendOrderConfirmationEmail(orderInfo: any) {
  if (orderInfo?.orderId) {
    return sendOrderConfirmationEmailForOrder(orderInfo.orderId);
  }
  // If raw order info passed without orderId
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'RESEND_API_KEY not configured' };

  try {
    const fromSender = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '') || 'ODA Market <orders@odamarket.co.ke>';
    const response = await resend.emails.send({
      from: fromSender,
      to: [orderInfo.customerEmail],
      replyTo: 'info@odamarket.co.ke',
      subject: `Order Confirmed: ${orderInfo.orderNumber} - ODA Market`,
      html: buildOrderConfirmationEmailHtml({
        customerName: orderInfo.customerName || 'Customer',
        customerEmail: orderInfo.customerEmail,
        orderNumber: orderInfo.orderNumber || 'ODA-ORDER',
        orderId: orderInfo.orderId || 'order',
        orderDate: orderInfo.orderDate || new Date().toLocaleDateString(),
        items: (orderInfo.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          lineTotal: i.price * i.quantity
        })),
        subtotal: orderInfo.subtotal || 0,
        deliveryFee: orderInfo.deliveryFee || 0,
        total: orderInfo.total || 0,
        deliveryMethod: orderInfo.deliveryMethod || 'standard',
        deliveryAddress: orderInfo.deliveryAddress || 'Nairobi, Kenya',
        paymentMethod: orderInfo.paymentMethod || 'Paystack',
        paymentStatus: 'PAID',
        paymentReference: orderInfo.transactionReference,
        orderStatus: 'processing',
        trackingUrl: orderInfo.trackingUrl || `https://odamarket.co.ke/track-order`
      })
    });
    return { success: true, data: response };
  } catch (err: any) {
    console.error('Legacy sendOrderConfirmationEmail error:', err);
    return { success: false, error: err.message };
  }
}
