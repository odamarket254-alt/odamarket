import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { sendOrderSMS } from "../src/lib/sms.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { items, shippingDetails, contactDetails, paymentMethod } = req.body;
    
    // Auth token check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing on server" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
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
        return res.status(400).json({ error: `Insufficient stock for product. Available: ${product.stock}, Requested: ${item.quantity}` });
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
        total_price: price * item.quantity // Keep for backwards compatibility during migration
      });
    }

    // 2. Create the order
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal: totalAmount,
        total: totalAmount,
        notes: JSON.stringify({ shippingDetails, contactDetails, paymentMethod, orderNumber })
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Order creation error:", orderError);
      return res.status(500).json({ error: "Failed to create order", details: orderError });
    }

    // 3. Create order items
    let { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map(item => ({ ...item, order_id: orderData.id })));
      
    if (itemsError && itemsError.code === 'PGRST204') {
      // Fallback for before migration is run
      console.warn('Migration not run. Falling back to old order_items schema.');
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

    // 4. Removed stock deduction here. It now happens securely in /verify upon successful payment.

    res.status(200).json({ success: true, orderId: orderData.id });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { orderId, reference } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    if (reference) {
      const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
      if (paystackSecret) {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            "Authorization": `Bearer ${paystackSecret}`
          }
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.status || verifyData.data.status !== "success") {
          return res.status(400).json({ error: "Payment verification failed with Paystack" });
        }
      } else {
        console.warn("Paystack secret key missing, skipping actual verification for preview environment.");
      }
    }

    const supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing on server" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. First, fetch the pending order BEFORE verifying
    let finalOrder = null;
    let finalProfile = null;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name, phone, email)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      const { data: o, error: e } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (e || !o) return res.status(404).json({ error: "Order not found" });
      const { data: p } = await supabase.from('profiles').select('*').eq('id', o.user_id || o.buyer_id || o.customer_id).single();
      finalOrder = o;
      finalProfile = p;
    } else {
      finalOrder = order;
      finalProfile = order.profiles;
    }

    // Protect against double verification
    if (finalOrder.status !== 'pending' && finalOrder.status !== 'failed') {
       // Already processed
       const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
       return res.status(200).json({ success: true, order: finalOrder, profile: finalProfile, items: items || [], message: "Already processed" });
    }

    // 2. Server-Side Verification
    if (!reference) {
      // Missing reference means payment didn't happen or was abandoned
      // We can update the status to failed/abandoned, but we don't return success.
      await supabase.from('orders').update({ payment_status: 'abandoned' }).eq('id', orderId);
      return res.status(400).json({ error: "Missing Paystack reference. Payment abandoned or failed." });
    }

    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
    if (!paystackSecret) {
      console.warn("Paystack secret key missing. Failing payment securely.");
      return res.status(500).json({ error: "Server payment configuration missing." });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { "Authorization": `Bearer ${paystackSecret}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      // Payment explicitly failed
      await supabase.from('orders').update({ payment_status: 'failed', payment_reference: reference }).eq('id', orderId);
      return res.status(400).json({ error: "Payment verification failed with Paystack. Transaction not successful." });
    }

    // 3. Verify Amount & Currency
    const expectedAmountKobo = Math.round(finalOrder.total * 100);
    const actualAmountKobo = verifyData.data.amount;
    const actualCurrency = verifyData.data.currency;

    if (actualCurrency !== "KES" || actualAmountKobo !== expectedAmountKobo) {
      console.error(`Payment mismatch: Expected ${expectedAmountKobo} KES, got ${actualAmountKobo} ${actualCurrency}`);
      await supabase.from('orders').update({ payment_status: 'failed', payment_reference: reference }).eq('id', orderId);
      return res.status(400).json({ error: "Payment amount or currency mismatch. Order not confirmed." });
    }

    // 4. Update order to paid/processing
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    
    await supabase.from('orders').update({ 
      status: 'processing', 
      payment_status: 'success',
      payment_reference: reference
    }).eq('id', orderId);

    // 5. Deduct Product Stock safely ONLY on successful payment
    if (items) {
      for (const item of items) {
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (product) {
          await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.product_id);
        }
      }
    }

    // 6. Send Order Confirmation SMS
    try {
      const currentNotes = finalOrder.notes ? (typeof finalOrder.notes === 'string' ? JSON.parse(finalOrder.notes) : finalOrder.notes) : {};
      
      if (currentNotes.sms_status !== 'sent') {
        const customerName = currentNotes.contactDetails?.fullName || currentNotes.shippingDetails?.recipientName || finalProfile?.full_name || 'Customer';
        const phone = currentNotes.contactDetails?.userPhone || currentNotes.shippingDetails?.recipientPhone || finalProfile?.phone;

        if (phone) {
          await sendOrderSMS(orderId, phone, customerName, finalOrder.total);
        }
      }
    } catch (smsError) {
      console.error("Order SMS error during verification:", smsError);
    }

    return res.status(200).json({
      success: true,
      order: { ...finalOrder, status: 'processing', payment_status: 'success', payment_reference: reference },
      profile: finalProfile,
      items: items || []
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
