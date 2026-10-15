import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  processAuthoritativePaymentVerification,
  logPaymentEvent
} from "./paymentVerificationService.js";
import {
  sendOrderConfirmationEmailForOrder,
  sendOrderStatusEmailForOrder
} from "../emailService.js";

const router = Router();

/**
 * POST /api/checkout
 * Creates a new order or updates an existing pending order (safe payment retry)
 * Initially marks order with status: 'pending', payment_status: 'pending'.
 */
router.post("/", async (req, res) => {
  try {
    const { items, shippingDetails, contactDetails, paymentMethod, deliveryMethod, existingOrderId } = req.body;
    
    // Auth token check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing on server" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // 1. Verify stock and calculate total
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, sale_price, wholesale_price, is_wholesale, wholesale_min_qty, stock, image_url')
        .eq('id', item.product_id)
        .single();
      
      if (productError || !product) {
        console.error("Error fetching product in checkout:", productError);
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name || 'product'}. Available: ${product.stock}, Requested: ${item.quantity}` });
      }

      let price = Number(product.sale_price || product.price || 0);
      if (product.is_wholesale && item.quantity >= (product.wholesale_min_qty || 1)) {
        price = Number(product.wholesale_price || price);
      }

      totalAmount += price * item.quantity;
      orderItems.push({
        product_id: product.id,
        product_name: product.name || 'Unknown Product',
        product_image: product.image_url || '',
        quantity: item.quantity,
        unit_price: price,
        subtotal: price * item.quantity,
        total_price: price * item.quantity
      });
    }

    // 2. Derive delivery fee and total
    const validDeliveryMethod = (deliveryMethod === 'express' || deliveryMethod === 'pickup') 
      ? deliveryMethod 
      : 'standard';
    const deliveryFee = validDeliveryMethod === 'express' ? 250 : 0;
    const finalTotal = totalAmount + deliveryFee;

    // 3. Check for safe retry of existing pending order for this user to prevent duplicate orders
    if (existingOrderId) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', existingOrderId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingOrder && existingOrder.payment_status !== 'success' && existingOrder.status === 'pending') {
        // Reuse existing pending order with refreshed pricing/shipping
        await supabase
          .from('orders')
          .update({
            subtotal: totalAmount,
            delivery_fee: deliveryFee,
            total: finalTotal,
            updated_at: new Date().toISOString(),
            notes: JSON.stringify({
              shippingDetails,
              contactDetails,
              paymentMethod: paymentMethod || 'M-Pesa',
              deliveryMethod: validDeliveryMethod,
              deliveryFee,
              orderNumber: existingOrder.order_number
            })
          })
          .eq('id', existingOrder.id);

        // Refresh order items
        await supabase.from('order_items').delete().eq('order_id', existingOrder.id);
        await supabase.from('order_items').insert(orderItems.map(item => ({ ...item, order_id: existingOrder.id })));

        logPaymentEvent('info', 'EXISTING_PENDING_ORDER_REUSED', {
          orderId: existingOrder.id,
          userId: user.id,
          total: finalTotal
        });

        return res.status(200).json({ success: true, orderId: existingOrder.id, isRetry: true });
      }
    }

    // 4. Create new pending order
    const odaNumber = 'ODA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderNumber = odaNumber;
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: odaNumber,
        status: 'pending',
        payment_status: 'pending',
        subtotal: totalAmount,
        delivery_fee: deliveryFee,
        total: finalTotal,
        notes: JSON.stringify({ 
          shippingDetails, 
          contactDetails, 
          paymentMethod: paymentMethod || 'M-Pesa', 
          deliveryMethod: validDeliveryMethod,
          deliveryFee,
          orderNumber 
        })
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Order creation error:", orderError);
      return res.status(500).json({ error: "Failed to create order", details: orderError });
    }

    // 5. Create order items
    let { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map(item => ({ ...item, order_id: orderData.id })));
      
    if (itemsError && itemsError.code === 'PGRST204') {
      const fallbackItems = orderItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        order_id: orderData.id
      }));
      const fallbackRes = await supabase.from('order_items').insert(fallbackItems);
      itemsError = fallbackRes.error;
    }

    if (itemsError) {
      console.error("Order items error:", itemsError);
    }

    logPaymentEvent('info', 'PENDING_ORDER_CREATED', {
      orderId: orderData.id,
      userId: user.id,
      total: finalTotal
    });

    res.status(200).json({ success: true, orderId: orderData.id });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/checkout/verify
 * Verifies Paystack transaction authoritatively on the server.
 * Requires authentic user token and verifies ownership.
 */
router.post("/verify", async (req, res) => {
  try {
    const { orderId, reference } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    // User authentication & ownership verification
    let authenticatedUserId: string | undefined;
    let isAdmin = false;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
      const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          authenticatedUserId = user.id;
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
          if (profile && ['admin', 'super_admin', 'moderator'].includes(profile.role)) {
            isAdmin = true;
          }
        }
      }
    }

    const result = await processAuthoritativePaymentVerification({
      orderId,
      reference,
      source: 'inline_checkout',
      authenticatedUserId,
      isAdmin
    });

    if (!result.success) {
      if (result.retryable) {
        return res.status(503).json({
          success: false,
          retryable: true,
          status: result.status,
          message: result.message,
          orderId
        });
      }
      return res.status(400).json({
        success: false,
        retryable: false,
        status: result.status,
        message: result.message,
        orderId
      });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * Server-side endpoint to dispatch Resend transactional emails when an order status transitions.
 */
router.post("/order-status-email", async (req, res) => {
  try {
    const { orderId, newStatus, forceResend } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    const normStatus = String(newStatus || '').toLowerCase().trim();
    const opts = { forceResend: Boolean(forceResend) };
    let result: any = { success: true, skipped: true };

    if (normStatus === 'confirmed') {
      const confirmRes = await sendOrderConfirmationEmailForOrder(orderId, opts);
      if (confirmRes.alreadySent) {
        result = await sendOrderStatusEmailForOrder(orderId, 'order_confirmed', opts);
      } else {
        result = confirmRes;
      }
    } else if (normStatus === 'processing') {
      result = await sendOrderConfirmationEmailForOrder(orderId, opts);
    } else if (['ready_for_pickup', 'packed', 'ready'].includes(normStatus)) {
      result = await sendOrderStatusEmailForOrder(orderId, 'order_ready', opts);
    } else if (['shipped', 'out_for_delivery'].includes(normStatus)) {
      result = await sendOrderStatusEmailForOrder(orderId, 'order_shipped', opts);
    } else if (normStatus === 'delivered') {
      result = await sendOrderStatusEmailForOrder(orderId, 'order_delivered', opts);
    } else if (normStatus === 'cancelled' || normStatus === 'refunded') {
      result = await sendOrderStatusEmailForOrder(orderId, 'order_cancelled', opts);
    }

    return res.status(200).json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error("[Order Status Email] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process order status email" });
  }
});

/**
 * Admin endpoint to safely resend or retry an order confirmation email
 */
router.post("/admin/resend-confirmation-email", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid admin token" });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const allowedRoles = ['admin', 'super_admin', 'moderator', 'support_agent'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const result = await sendOrderConfirmationEmailForOrder(orderId, { forceResend: true });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Failed to dispatch email", details: result });
    }

    return res.status(200).json({
      success: true,
      message: `Confirmation email dispatched successfully to ${result.recipient}`,
      resendId: result.resendId,
      sentAt: result.sentAt
    });
  } catch (err: any) {
    console.error("Admin resend email error:", err);
    return res.status(500).json({ error: err.message || "Failed to resend confirmation email" });
  }
});

export default router;
