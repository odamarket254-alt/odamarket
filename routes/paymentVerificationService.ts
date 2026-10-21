import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendOrderSMS } from '../src/lib/sms.js';
import {
  sendOrderConfirmationEmailForOrder,
  sendPaymentFailedEmailForOrder
} from '../emailService.js';

// Structured logging helper that sanitizes sensitive data (excluding secrets and card/token details)
export function logPaymentEvent(level: 'info' | 'warn' | 'error', event: string, details: Record<string, any>) {
  const sanitized = { ...details };
  // Redact secrets, auth tokens, and full card details if present
  const keysToRedact = ['authorization', 'secret', 'key', 'token', 'card_number', 'cvv', 'password'];
  for (const k of Object.keys(sanitized)) {
    if (keysToRedact.some(red => k.toLowerCase().includes(red))) {
      sanitized[k] = '[REDACTED]';
    }
  }
  const timestamp = new Date().toISOString();
  const logObj = { timestamp, level, event, ...sanitized };
  if (level === 'error') {
    console.error(`[PAYMENT LOG] ${JSON.stringify(logObj)}`);
  } else if (level === 'warn') {
    console.warn(`[PAYMENT LOG] ${JSON.stringify(logObj)}`);
  } else {
    console.log(`[PAYMENT LOG] ${JSON.stringify(logObj)}`);
  }
}

// In-flight mutex per order ID to prevent race conditions between concurrent /verify and webhook calls
const inFlightVerificationLocks = new Map<string, Promise<VerificationResult>>();

export interface VerificationResult {
  success: boolean;
  status: 'paid' | 'pending' | 'failed' | 'abandoned';
  orderId: string;
  order?: any;
  profile?: any;
  items?: any[];
  message: string;
  isDuplicateOrAlreadyProcessed?: boolean;
  retryable?: boolean;
}

function getSupabase(): SupabaseClient | null {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export function normalizeUuid(id: string | null | undefined): string {
  const trimmed = String(id || '').trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[0-9a-f]{32}$/i.test(trimmed)) {
    return `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20, 32)}`.toLowerCase();
  }
  return trimmed;
}

export function normalizeAlphanumeric(str: string | null | undefined): string {
  return String(str || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Authoritatively verifies a Paystack transaction and processes order status,
 * stock deduction, and notifications idempotently.
 */
export async function processAuthoritativePaymentVerification({
  orderId,
  reference,
  source,
  authenticatedUserId,
  isAdmin = false
}: {
  orderId: string;
  reference: string;
  source: 'inline_checkout' | 'webhook' | 'admin_manual';
  authenticatedUserId?: string;
  isAdmin?: boolean;
}): Promise<VerificationResult> {
  let cleanOrderId = normalizeUuid(orderId || '');
  const cleanRef = (reference || '').trim();

  // Deduplicate concurrent verification requests for the same orderId or reference
  const lockKey = cleanOrderId || cleanRef;
  const existingLock = lockKey ? inFlightVerificationLocks.get(lockKey) : null;
  if (existingLock) {
    logPaymentEvent('info', 'PAYMENT_CONCURRENT_LOCK_REUSED', { orderId: cleanOrderId, reference: cleanRef, source });
    return existingLock;
  }

  const executionPromise = (async (): Promise<VerificationResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      logPaymentEvent('error', 'SUPABASE_CONFIG_MISSING', { orderId: cleanOrderId });
      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: 'Database configuration missing on server',
        retryable: true
      };
    }

    // 1. Fetch current order state by ID, order_number, or payment_reference
    let order: any = null;
    if (cleanOrderId) {
      const { data: orderById } = await supabase
        .from('orders')
        .select('*')
        .eq('id', cleanOrderId)
        .maybeSingle();
      order = orderById;

      if (!order) {
        const { data: orderByNum } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', cleanOrderId)
          .maybeSingle();
        if (orderByNum) {
          order = orderByNum;
          cleanOrderId = orderByNum.id;
        }
      }
    }

    if (!order && cleanRef) {
      const { data: orderByRef } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', cleanRef)
        .maybeSingle();
      if (orderByRef) {
        order = orderByRef;
        cleanOrderId = orderByRef.id;
      }
    }

    if (!order) {
      logPaymentEvent('warn', 'ORDER_NOT_FOUND', { orderId: cleanOrderId, reference: cleanRef });
      return {
        success: false,
        status: 'failed',
        orderId: cleanOrderId,
        message: 'Order not found'
      };
    }

    // 2. Validate Ownership if user is authenticated (and not webhook or admin)
    if (source === 'inline_checkout' && !isAdmin && authenticatedUserId) {
      const orderOwner = order.user_id || order.customer_id || order.buyer_id;
      if (orderOwner && orderOwner !== authenticatedUserId) {
        logPaymentEvent('error', 'UNAUTHORIZED_ORDER_ACCESS_ATTEMPT', {
          orderId: cleanOrderId,
          authenticatedUserId,
          orderOwner
        });
        return {
          success: false,
          status: 'failed',
          orderId: cleanOrderId,
          message: 'Unauthorized: order belongs to another user'
        };
      }
    }

    // 3. Check if already authoritatively marked paid
    if (order.payment_status === 'success') {
      logPaymentEvent('info', 'ORDER_ALREADY_VERIFIED_AS_PAID', {
        orderId: cleanOrderId,
        reference: order.payment_reference,
        incomingReference: cleanRef,
        source
      });

      // Ensure confirmation email was safely recorded/sent
      try {
        await sendOrderConfirmationEmailForOrder(cleanOrderId);
      } catch (e) {
        logPaymentEvent('warn', 'IDEMPOTENT_EMAIL_DISPATCH_WARN', { orderId: cleanOrderId, error: (e as any)?.message });
      }

      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', cleanOrderId);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', order.user_id).maybeSingle();

      return {
        success: true,
        status: 'paid',
        orderId: cleanOrderId,
        order,
        profile,
        items: items || [],
        message: 'Order is already authoritatively verified as paid',
        isDuplicateOrAlreadyProcessed: true
      };
    }

    // 4. Missing reference check
    if (!cleanRef) {
      logPaymentEvent('warn', 'MISSING_PAYMENT_REFERENCE', { orderId: cleanOrderId, source });
      await supabase
        .from('orders')
        .update({ payment_status: 'abandoned', updated_at: new Date().toISOString() })
        .eq('id', cleanOrderId)
        .eq('payment_status', 'pending');

      return {
        success: false,
        status: 'abandoned',
        orderId: cleanOrderId,
        message: 'Missing Paystack payment reference'
      };
    }

    // 5. Reference format & association check
    const normalizeId = (id: string | null | undefined) => String(id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const normOrderId = normalizeId(cleanOrderId);
    let referenceBelongsToOrder = false;

    // A. Direct match with order's pre-stored payment_reference
    if (order.payment_reference && order.payment_reference === cleanRef) {
      referenceBelongsToOrder = true;
    }

    // B. Embedded order ID in reference (e.g. ord_<orderId>_<random>)
    if (cleanRef.startsWith('ord_')) {
      const parts = cleanRef.split('_');
      if (parts.length >= 2 && normalizeId(parts[1]) === normOrderId) {
        referenceBelongsToOrder = true;
      }
    }

    // 6. Check reference uniqueness across orders (prevent reusing a reference from another already-paid order)
    const { data: existingPaidRefOrder } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('payment_reference', cleanRef)
      .eq('payment_status', 'success')
      .neq('id', cleanOrderId)
      .maybeSingle();

    if (existingPaidRefOrder) {
      logPaymentEvent('error', 'DUPLICATE_PAYMENT_REFERENCE_ATTEMPT', {
        orderId: cleanOrderId,
        reference: cleanRef,
        existingOrderId: existingPaidRefOrder.id
      });
      return {
        success: false,
        status: 'failed',
        orderId: cleanOrderId,
        message: 'This payment reference was already used for another completed order'
      };
    }

    // 7. Verify with Paystack API
    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (!paystackSecret) {
      logPaymentEvent('error', 'PAYSTACK_SECRET_MISSING', { orderId: cleanOrderId });
      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: 'Server payment configuration missing. Payment remains pending verification.',
        retryable: true
      };
    }

    let verifyData: any;
    try {
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`, {
        headers: {
          'Authorization': `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!verifyRes.ok && verifyRes.status >= 500) {
        // Paystack temporary server error - leave pending and allow retry
        logPaymentEvent('warn', 'PAYSTACK_API_TEMPORARY_ERROR', {
          orderId: cleanOrderId,
          reference: cleanRef,
          httpStatus: verifyRes.status
        });
        return {
          success: false,
          status: 'pending',
          orderId: cleanOrderId,
          message: 'Payment gateway temporarily unreachable. Payment status left as pending for automatic retry.',
          retryable: true
        };
      }

      verifyData = await verifyRes.json();
    } catch (networkErr: any) {
      logPaymentEvent('warn', 'PAYSTACK_VERIFY_NETWORK_ERROR', {
        orderId: cleanOrderId,
        reference: cleanRef,
        error: networkErr.message
      });
      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: 'Network error communicating with payment gateway. Transaction left pending for retry.',
        retryable: true
      };
    }

    // 8. Validate Paystack verification response structure
    if (!verifyData?.status) {
      logPaymentEvent('warn', 'PAYSTACK_VERIFICATION_INVALID_DATA', {
        orderId: cleanOrderId,
        reference: cleanRef,
        verifyData
      });
      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: verifyData?.message || 'Transaction could not be verified yet. Left as pending.',
        retryable: true
      };
    }

    const gatewayStatus = String(verifyData.data?.status || '').toLowerCase();
    const gatewayResponse = verifyData.data?.gateway_response || verifyData.message || 'Transaction in progress';

    // ASYNCHRONOUS M-PESA CHECK:
    // If transaction is still ongoing, pending, queued, or awaiting OTP / phone PIN:
    if (['pending', 'ongoing', 'processing', 'queued', 'send_otp'].includes(gatewayStatus)) {
      logPaymentEvent('info', 'PAYMENT_PENDING_ASYNC_GATEWAY', {
        orderId: cleanOrderId,
        reference: cleanRef,
        gatewayStatus,
        gatewayResponse
      });

      // Ensure reference is recorded on order without changing payment_status from pending
      await supabase
        .from('orders')
        .update({
          payment_reference: cleanRef,
          updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId)
        .eq('payment_status', 'pending');

      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: 'Payment is being processed by Safaricom M-Pesa. Please check your phone and enter your PIN if prompted.',
        retryable: true
      };
    }

    // IF ABANDONED (e.g. user closed the modal before sending STK prompt):
    if (gatewayStatus === 'abandoned') {
      logPaymentEvent('info', 'PAYMENT_ABANDONED_OR_CLOSED', {
        orderId: cleanOrderId,
        reference: cleanRef,
        gatewayResponse
      });

      return {
        success: false,
        status: 'abandoned',
        orderId: cleanOrderId,
        message: 'Payment window was closed. Your cart items are saved and you can retry payment whenever you are ready.',
        retryable: true
      };
    }

    // IF EXPLICIT FAILURE (e.g. failed, reversed, declined, cancelled):
    if (gatewayStatus !== 'success') {
      logPaymentEvent('warn', 'PAYSTACK_VERIFICATION_FAILED', {
        orderId: cleanOrderId,
        reference: cleanRef,
        gatewayStatus,
        gatewayResponse
      });

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_reference: cleanRef,
          updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId)
        .neq('payment_status', 'success');

      try {
        await sendPaymentFailedEmailForOrder(cleanOrderId, cleanRef);
      } catch (failEmailErr) {
        logPaymentEvent('warn', 'PAYMENT_FAILED_EMAIL_ERROR', { orderId: cleanOrderId, error: (failEmailErr as any)?.message });
      }

      return {
        success: false,
        status: 'failed',
        orderId: cleanOrderId,
        message: `Payment failed: ${gatewayResponse}`,
        retryable: false
      };
    }

    // Check C: Match with Paystack transaction metadata and order notes
    const normOrderNum = normalizeAlphanumeric(order.order_number);

    // Safely parse Paystack metadata whether it's an object or a JSON string
    let parsedMetadata: any = {};
    const rawMetadata = verifyData.data?.metadata;
    if (typeof rawMetadata === 'string' && rawMetadata.trim()) {
      try {
        parsedMetadata = JSON.parse(rawMetadata);
      } catch {
        parsedMetadata = {};
      }
    } else if (rawMetadata && typeof rawMetadata === 'object') {
      parsedMetadata = rawMetadata;
    }

    // Safely parse order notes for stored references
    let parsedNotes: any = {};
    if (typeof order.notes === 'string' && order.notes.trim()) {
      try {
        parsedNotes = JSON.parse(order.notes);
      } catch {
        parsedNotes = {};
      }
    } else if (order.notes && typeof order.notes === 'object') {
      parsedNotes = order.notes;
    }

    // Check previously stored references in notes
    const pastRefs: string[] = Array.isArray(parsedNotes?.payment_references)
      ? parsedNotes.payment_references
      : [parsedNotes?.payment_reference].filter(Boolean);
    if (pastRefs.some((r: string) => normalizeAlphanumeric(r) === normalizeAlphanumeric(cleanRef))) {
      referenceBelongsToOrder = true;
    }

    const metaOrderId = parsedMetadata.order_id || parsedMetadata.orderId || parsedMetadata.orderID;
    const metaOrderNum = parsedMetadata.order_number || parsedMetadata.orderNumber;

    if (metaOrderId && (normalizeAlphanumeric(metaOrderId) === normOrderId || normalizeAlphanumeric(metaOrderId) === normOrderNum)) {
      referenceBelongsToOrder = true;
    }
    if (metaOrderNum && normOrderNum && (normalizeAlphanumeric(metaOrderNum) === normOrderNum || normalizeAlphanumeric(metaOrderNum) === normOrderId)) {
      referenceBelongsToOrder = true;
    }
    if (Array.isArray(parsedMetadata.custom_fields)) {
      for (const field of parsedMetadata.custom_fields) {
        const valNorm = normalizeAlphanumeric(field?.value);
        if (valNorm && (valNorm === normOrderId || (normOrderNum && valNorm === normOrderNum))) {
          referenceBelongsToOrder = true;
          break;
        }
      }
    }

    // Check D: If not matched yet, check whether reference or metadata is explicitly from ANOTHER actual order
    if (!referenceBelongsToOrder) {
      let conflictingTarget: string | null = null;
      if (cleanRef.startsWith('ord_')) {
        const parts = cleanRef.split('_');
        if (parts.length >= 2) {
          const candidate = normalizeAlphanumeric(parts[1]);
          if (candidate && candidate !== normOrderId && candidate !== normOrderNum) {
            conflictingTarget = parts[1];
          }
        }
      }
      if (metaOrderId && normalizeAlphanumeric(metaOrderId) !== normOrderId && normalizeAlphanumeric(metaOrderId) !== normOrderNum) {
        conflictingTarget = String(metaOrderId);
      }

      // If conflictingTarget is identified, verify if it actually corresponds to a distinct existing order
      if (conflictingTarget) {
        const cleanCandidate = normalizeUuid(conflictingTarget);
        const { data: realOtherOrder } = await supabase
          .from('orders')
          .select('id, user_id')
          .or(`id.eq.${cleanCandidate},order_number.eq.${conflictingTarget}`)
          .neq('id', cleanOrderId)
          .maybeSingle();

        if (realOtherOrder) {
          logPaymentEvent('error', 'PAYMENT_REFERENCE_ORDER_MISMATCH', {
            orderId: cleanOrderId,
            reference: cleanRef,
            storedRef: order.payment_reference,
            conflictingTarget,
            realOtherOrderId: realOtherOrder.id
          });
          return {
            success: false,
            status: 'failed',
            orderId: cleanOrderId,
            message: 'Payment reference is not associated with this order'
          };
        }
      }

      // If no conflict with another real order exists, and no other paid order has claimed this reference
      if (!existingPaidRefOrder) {
        referenceBelongsToOrder = true;
      }
    }

    // Final verification of reference association
    if (!referenceBelongsToOrder) {
      logPaymentEvent('error', 'PAYMENT_REFERENCE_ORDER_MISMATCH', {
        orderId: cleanOrderId,
        reference: cleanRef,
        storedRef: order.payment_reference,
        metaOrderId
      });
      return {
        success: false,
        status: 'failed',
        orderId: cleanOrderId,
        message: 'Payment reference is not associated with this order'
      };
    }

    // 9. Validate Amount and Currency in smallest unit (kobo/cents: 1 KES = 100 cents)
    const expectedAmountSmallestUnit = Math.round(Number(order.total) * 100);
    const actualAmountSmallestUnit = Number(verifyData.data.amount);
    const actualCurrency = String(verifyData.data.currency || '').toUpperCase();

    if (actualCurrency !== 'KES' || actualAmountSmallestUnit !== expectedAmountSmallestUnit) {
      logPaymentEvent('error', 'PAYMENT_AMOUNT_CURRENCY_MISMATCH', {
        orderId: cleanOrderId,
        expectedAmount: expectedAmountSmallestUnit,
        actualAmount: actualAmountSmallestUnit,
        expectedCurrency: 'KES',
        actualCurrency
      });

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_reference: cleanRef,
          updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId)
        .neq('payment_status', 'success');

      return {
        success: false,
        status: 'failed',
        orderId: cleanOrderId,
        message: `Payment amount/currency mismatch. Expected ${expectedAmountSmallestUnit} KES cents, got ${actualAmountSmallestUnit} ${actualCurrency}.`
      };
    }

    // 10. Atomic conditional status update to 'success' & 'processing'
    // ONLY the request that transitions payment_status from non-success to success will proceed to stock deduction & notifications
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'success',
        payment_reference: cleanRef,
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanOrderId)
      .neq('payment_status', 'success')
      .select()
      .maybeSingle();

    if (updateErr) {
      logPaymentEvent('error', 'ORDER_UPDATE_DATABASE_ERROR', { orderId: cleanOrderId, error: updateErr.message });
      return {
        success: false,
        status: 'pending',
        orderId: cleanOrderId,
        message: 'Failed to record payment confirmation in database',
        retryable: true
      };
    }

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', cleanOrderId);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', order.user_id).maybeSingle();

    if (!updatedOrder) {
      // Another thread (e.g. concurrent webhook or verify) just finished marking it success
      logPaymentEvent('info', 'ORDER_ALREADY_UPDATED_CONCURRENTLY', { orderId: cleanOrderId, reference: cleanRef });
      return {
        success: true,
        status: 'paid',
        orderId: cleanOrderId,
        order,
        profile,
        items: items || [],
        message: 'Payment verified and recorded',
        isDuplicateOrAlreadyProcessed: true
      };
    }

    logPaymentEvent('info', 'PAYMENT_VERIFIED_SUCCESSFULLY', {
      orderId: cleanOrderId,
      reference: cleanRef,
      amountKsh: order.total,
      source
    });

    // 11. Deduct Stock safely and atomically once on successful payment
    if (items && items.length > 0) {
      for (const item of items) {
        try {
          const { data: product } = await supabase
            .from('products')
            .select('id, stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 1));
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);

            logPaymentEvent('info', 'PRODUCT_STOCK_DEDUCTED', {
              productId: item.product_id,
              deducted: item.quantity,
              newStock
            });
          }
        } catch (stockErr: any) {
          logPaymentEvent('warn', 'STOCK_DEDUCTION_ERROR', {
            productId: item.product_id,
            error: stockErr.message
          });
        }
      }
    }

    // 12. Send Order Confirmation SMS
    try {
      let parsedNotes: any = {};
      try {
        parsedNotes = typeof updatedOrder.notes === 'string'
          ? JSON.parse(updatedOrder.notes)
          : (updatedOrder.notes || {});
      } catch (e) {}

      if (parsedNotes.sms_status !== 'sent') {
        const customerName = parsedNotes.contactDetails?.fullName ||
          parsedNotes.shippingDetails?.recipientName ||
          profile?.full_name ||
          'Customer';
        const phone = parsedNotes.contactDetails?.userPhone ||
          parsedNotes.shippingDetails?.recipientPhone ||
          profile?.phone;

        if (phone) {
          await sendOrderSMS(cleanOrderId, phone, customerName, updatedOrder.total);
          // Mark SMS as dispatched in notes
          parsedNotes.sms_status = 'sent';
          await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', cleanOrderId);
          logPaymentEvent('info', 'SMS_NOTIFICATION_DISPATCHED', { orderId: cleanOrderId, phone });
        }
      }
    } catch (smsError: any) {
      logPaymentEvent('warn', 'ORDER_SMS_ERROR', { orderId: cleanOrderId, error: smsError.message });
    }

    // 13. Send Professional Order Confirmation Email via Resend
    try {
      const emailResult = await sendOrderConfirmationEmailForOrder(cleanOrderId);
      logPaymentEvent('info', 'CONFIRMATION_EMAIL_DISPATCH_RESULT', {
        orderId: cleanOrderId,
        emailResult: emailResult.success ? 'success' : emailResult.skipped ? 'skipped' : 'failed'
      });
    } catch (emailErr: any) {
      logPaymentEvent('warn', 'CONFIRMATION_EMAIL_ERROR', { orderId: cleanOrderId, error: emailErr.message });
    }

    // 14. In-App Notification to Buyer for Authoritative Order Confirmation
    try {
      const displayOrder = updatedOrder.order_number || `#ODA-${cleanOrderId.slice(0, 8).toUpperCase()}`;
      await supabase
        .from('notifications')
        .insert([{
          user_id: order.user_id,
          order_id: cleanOrderId,
          title: 'Order Confirmed! 🛒',
          message: `Payment verified. Your order ${displayOrder} is confirmed and is being prepared.`,
          type: `order_status:confirmed:${cleanOrderId}`,
          is_read: false
        }]);
      logPaymentEvent('info', 'ORDER_CONFIRMED_IN_APP_NOTIFICATION_CREATED', { orderId: cleanOrderId, userId: order.user_id });
    } catch (notifErr: any) {
      logPaymentEvent('warn', 'IN_APP_NOTIFICATION_WARNING', { orderId: cleanOrderId, error: notifErr.message });
    }

    // 15. In-App Notification to Admins
    try {
      const displayOrder = updatedOrder.order_number || `#ODA-${cleanOrderId.slice(0, 8).toUpperCase()}`;
      const totalKsh = Math.round(Number(updatedOrder.total || 0)).toLocaleString();
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin']);

      if (adminProfiles && adminProfiles.length > 0) {
        const adminNotifs = adminProfiles.map((p: any) => ({
          user_id: p.id,
          order_id: cleanOrderId,
          title: 'New Order Received! 📦',
          message: `New paid order ${displayOrder} (KSh ${totalKsh}) received. Ready for fulfillment.`,
          type: `admin_new_order:${cleanOrderId}`,
          is_read: false
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }
      logPaymentEvent('info', 'ADMIN_ORDER_NOTIFICATION_CREATED', { orderId: cleanOrderId });
    } catch (adminNotifErr: any) {
      logPaymentEvent('warn', 'ADMIN_IN_APP_NOTIFICATION_WARNING', { orderId: cleanOrderId, error: adminNotifErr.message });
    }

    return {
      success: true,
      status: 'paid',
      orderId: cleanOrderId,
      order: updatedOrder,
      profile,
      items: items || [],
      message: 'Payment verified and order confirmed successfully'
    };
  })();

  // Track lock
  inFlightVerificationLocks.set(lockKey, executionPromise);
  try {
    const result = await executionPromise;
    return result;
  } finally {
    inFlightVerificationLocks.delete(lockKey);
  }
}
