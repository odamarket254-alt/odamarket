import { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmailForOrder } from '../emailService.js';

/**
 * Handles Paystack webhooks (e.g. charge.success)
 * Validates HMAC SHA512 signature, marks order paid, deducts stock,
 * and triggers idempotent Resend order confirmation email.
 */
export async function handlePaystackWebhook(req: Request, res: Response) {
  try {
    const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
    const signature = req.headers['x-paystack-signature'];

    // Retrieve raw body string for cryptographic signature comparison
    let bodyStr = '';
    if (Buffer.isBuffer(req.body)) {
      bodyStr = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      bodyStr = req.body;
    } else if (req.body && typeof req.body === 'object') {
      bodyStr = JSON.stringify(req.body);
    }

    if (secret && signature) {
      const hash = crypto.createHmac('sha512', secret).update(bodyStr).digest('hex');
      if (hash !== signature) {
        console.warn('[Paystack Webhook] ❌ Invalid HMAC signature from IP:', req.ip);
        return res.status(401).send("Invalid signature");
      }
    }

    const event = typeof req.body === 'object' && !Buffer.isBuffer(req.body) 
      ? req.body 
      : JSON.parse(bodyStr || '{}');

    if (event.event === 'charge.success') {
      const reference = event.data?.reference || '';
      const parts = reference.split('_');
      
      // Paystack reference format: ord_<orderId>_<random>
      if (parts.length >= 2 && parts[0] === 'ord') {
        const orderId = parts[1];
        const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
        const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();

          if (order && order.status === 'pending') {
            const expectedAmountKobo = Math.round(Number(order.total) * 100);
            const actualAmountKobo = event.data?.amount;
            const actualCurrency = event.data?.currency;

            if (actualCurrency === 'KES' && actualAmountKobo === expectedAmountKobo) {
              await supabase.from('orders').update({
                status: 'processing',
                payment_status: 'success',
                payment_reference: reference
              }).eq('id', orderId);

              // Stock deduction
              const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
              if (items) {
                for (const item of items) {
                  const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                  if (product) {
                    await supabase.from('products').update({
                      stock: Math.max(0, product.stock - item.quantity)
                    }).eq('id', item.product_id);
                  }
                }
              }

              // Send order confirmation email via Resend (strictly idempotent)
              // NOTE: In serverless environments (Vercel), must be awaited before returning 200 response
              try {
                await sendOrderConfirmationEmailForOrder(orderId);
              } catch (emailErr) {
                console.error("[Paystack Webhook] Order confirmation email dispatch failed:", emailErr);
              }
            } else {
              console.error(`[Paystack Webhook] Currency/amount mismatch for order ${orderId}. Expected ${expectedAmountKobo} KES, got ${actualAmountKobo} ${actualCurrency}`);
            }
          } else if (order && (order.payment_status === 'success' || order.status !== 'pending')) {
            // Already processed by inline verify: ensure confirmation email is sent idempotently
            try {
              await sendOrderConfirmationEmailForOrder(orderId);
            } catch (emailErr) {
              console.error("[Paystack Webhook] Order confirmation email verification failed:", emailErr);
            }
          }
        }
      }
    }

    return res.status(200).send("Webhook received");
  } catch (err: any) {
    console.error("[Paystack Webhook] Error processing webhook:", err);
    return res.status(500).send("Webhook Error");
  }
}
