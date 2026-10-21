import { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  processAuthoritativePaymentVerification,
  logPaymentEvent,
  normalizeUuid,
  normalizeAlphanumeric
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

    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
    const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // Resolve orderId from database stored reference, metadata, or embedded reference
    let orderId = '';

    // 1. Primary: Direct lookup in orders table by payment_reference
    if (supabase && reference) {
      try {
        const { data: refOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', reference)
          .maybeSingle();
        if (refOrder?.id) {
          orderId = refOrder.id;
        }
      } catch (dbErr) {
        logPaymentEvent('warn', 'WEBHOOK_DB_LOOKUP_WARN', { reference, error: (dbErr as any)?.message });
      }
    }

    // Safely parse Paystack metadata whether it's an object or a JSON string
    let meta: any = {};
    const rawMetadata = event.data?.metadata;
    if (typeof rawMetadata === 'string' && rawMetadata.trim()) {
      try {
        meta = JSON.parse(rawMetadata);
      } catch {
        meta = {};
      }
    } else if (rawMetadata && typeof rawMetadata === 'object') {
      meta = rawMetadata;
    }

    // 2. Secondary: Paystack metadata fields (order_id, orderId)
    if (!orderId && (meta?.order_id || meta?.orderId || meta?.orderID)) {
      orderId = String(meta.order_id || meta.orderId || meta.orderID);
    }
    if (!orderId && Array.isArray(meta?.custom_fields)) {
      for (const f of meta.custom_fields) {
        if ((f.variable_name === 'order_id' || f.display_name === 'Order ID') && f.value) {
          orderId = String(f.value);
          break;
        }
      }
    }

    // 3. Tertiary: Paystack order_number metadata
    if (!orderId && (meta?.order_number || meta?.orderNumber)) {
      const orderNum = String(meta.order_number || meta.orderNumber);
      if (supabase) {
        try {
          const { data: numOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', orderNum)
            .maybeSingle();
          if (numOrder?.id) {
            orderId = numOrder.id;
          }
        } catch {}
      }
    }

    // 4. Quaternary: Parse embedded ID from reference format (e.g. ord_<orderId/orderNumber>_<timestamp>)
    if (!orderId && reference.startsWith('ord_')) {
      const parts = reference.split('_');
      if (parts.length >= 2) {
        const candidate = parts[1];
        const normCandidate = normalizeUuid(candidate);
        if (supabase) {
          try {
            // Check direct id match (UUID format) or order_number match
            const { data: candidateOrder } = await supabase
              .from('orders')
              .select('id')
              .or(`id.eq.${normCandidate},order_number.eq.${candidate}`)
              .maybeSingle();
            if (candidateOrder?.id) {
              orderId = candidateOrder.id;
            }
          } catch {}
        }
        if (!orderId) {
          orderId = normCandidate;
        }
      }
    }

    // 5. Quinary: Check order notes containing this reference
    if (!orderId && supabase && reference) {
      try {
        const { data: noteOrder } = await supabase
          .from('orders')
          .select('id')
          .like('notes', `%${reference}%`)
          .maybeSingle();
        if (noteOrder?.id) {
          orderId = noteOrder.id;
        }
      } catch {}
    }

    if (!orderId) {
      logPaymentEvent('warn', 'WEBHOOK_NO_ORDER_ASSOCIATED', { reference, eventType });
      // Acknowledge receipt to Paystack so webhook doesn't continuously fail
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
