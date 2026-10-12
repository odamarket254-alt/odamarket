import { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  processAuthoritativePaymentVerification,
  logPaymentEvent
} from './paymentVerificationService.js';
import { sendPaymentFailedEmailForOrder } from '../emailService.js';

/**
 * Handles Paystack webhooks (e.g. charge.success, charge.failed)
 * Strictly validates HMAC SHA512 signature using constant-time comparison,
 * verifies payment authoritatively, deduplicates duplicate and late webhooks,
 * deducts stock atomically, and sends order confirmation notifications.
 */
export async function handlePaystackWebhook(req: Request, res: Response) {
  try {
    const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
    const signature = req.headers['x-paystack-signature'];

    if (!secret) {
      logPaymentEvent('error', 'WEBHOOK_SECRET_NOT_CONFIGURED', {});
      return res.status(500).send("Webhook secret not configured");
    }

    if (!signature || typeof signature !== 'string') {
      logPaymentEvent('warn', 'WEBHOOK_MISSING_SIGNATURE', { ip: req.ip });
      return res.status(401).send("Missing signature");
    }

    // Retrieve raw body buffer for authentic cryptographic signature comparison
    let rawBody: Buffer;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      rawBody = Buffer.from(req.body, 'utf8');
    } else if (req.body && typeof req.body === 'object') {
      rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
    } else {
      rawBody = Buffer.from('', 'utf8');
    }

    const computedHash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    // Secure constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, 'utf8');
    const hashBuf = Buffer.from(computedHash, 'utf8');

    if (sigBuf.length !== hashBuf.length || !crypto.timingSafeEqual(sigBuf, hashBuf)) {
      logPaymentEvent('warn', 'WEBHOOK_INVALID_SIGNATURE', { ip: req.ip });
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString('utf8') || '{}');
    const eventType = event.event;
    const reference = event.data?.reference || '';

    logPaymentEvent('info', 'WEBHOOK_EVENT_RECEIVED', {
      eventType,
      reference,
      status: event.data?.status
    });

    // Resolve orderId from reference (format: ord_<orderId>_<random>) or metadata
    let orderId = '';
    if (reference.startsWith('ord_')) {
      const parts = reference.split('_');
      if (parts.length >= 2) {
        orderId = parts[1];
      }
    }
    if (!orderId && event.data?.metadata?.orderId) {
      orderId = String(event.data.metadata.orderId);
    }
    if (!orderId && event.data?.metadata?.order_id) {
      orderId = String(event.data.metadata.order_id);
    }

    if (!orderId) {
      logPaymentEvent('warn', 'WEBHOOK_NO_ORDER_ASSOCIATED', { reference, eventType });
      // Acknowledge receipt to Paystack even if unrelated event
      return res.status(200).send("Webhook processed (no order associated)");
    }

    if (eventType === 'charge.success') {
      // Authoritatively verify and process order status idempotently
      const result = await processAuthoritativePaymentVerification({
        orderId,
        reference,
        source: 'webhook'
      });

      logPaymentEvent('info', 'WEBHOOK_CHARGE_SUCCESS_PROCESSED', {
        orderId,
        reference,
        success: result.success,
        isDuplicate: result.isDuplicateOrAlreadyProcessed
      });

      return res.status(200).send("Charge success processed");
    } else if (eventType === 'charge.failed') {
      const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
      const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();

        if (order && order.payment_status !== 'success') {
          await supabase.from('orders').update({
            payment_status: 'failed',
            payment_reference: reference,
            updated_at: new Date().toISOString()
          }).eq('id', orderId);

          try {
            await sendPaymentFailedEmailForOrder(orderId, reference);
          } catch (failEmailErr) {
            logPaymentEvent('warn', 'WEBHOOK_PAYMENT_FAILED_EMAIL_ERROR', { orderId, error: (failEmailErr as any)?.message });
          }
        }
      }

      logPaymentEvent('info', 'WEBHOOK_CHARGE_FAILED_PROCESSED', { orderId, reference });
      return res.status(200).send("Charge failed processed");
    }

    // Acknowledge all other events
    return res.status(200).send("Webhook event acknowledged");
  } catch (err: any) {
    logPaymentEvent('error', 'WEBHOOK_PROCESSING_EXCEPTION', { error: err.message });
    return res.status(500).send("Webhook Error");
  }
}
