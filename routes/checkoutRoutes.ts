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
        .select('id, name, price, sale_price, wholesale_price, is_wholesale, wholesale_min_qty, stock')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product. Available: ${product.stock}, Requested: ${item.quantity}` });
      }

      let price = product.sale_price || product.price;
      if (product.is_wholesale && item.quantity >= (product.wholesale_min_qty || 1)) {
        price = product.wholesale_price || price;
      }
      totalAmount += price * item.quantity;

      orderItems.push({
        product_id: product.id,
        product_name: product.name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: price,
        total_price: price * item.quantity
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
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map(item => ({ ...item, order_id: orderData.id })));

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // In a real app we might want to rollback the order here, but for now we'll proceed
    }

    // 4. Update product stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // 5. Send Order SMS
    try {
      const customerName = shippingDetails?.recipientName || user.user_metadata?.first_name || 'Customer';
      const phone = shippingDetails?.recipientPhone || user.phone || user.user_metadata?.phone;
      
      if (phone) {
        const smsResult = await sendOrderSMS(phone, customerName, orderNumber, totalAmount);
        
        // Update order notes with SMS status
        const currentNotes = JSON.parse(orderData.notes || '{}');
        const updatedNotes = {
          ...currentNotes,
          sms_status: smsResult.success ? 'sent' : 'failed',
          sms_message_id: smsResult.messageId || null,
          sms_error: smsResult.error || null,
          sms_sent_at: new Date().toISOString()
        };
        
        await supabase
          .from('orders')
          .update({ notes: JSON.stringify(updatedNotes) })
          .eq('id', orderData.id);
      }
    } catch (smsError) {
      console.error("Order SMS error:", smsError);
      // Ensure failure does not rollback the order
    }

    res.status(200).json({ success: true, orderId: orderData.id });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

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

    // Get order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name, phone, email)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      // It might be a different foreign key relation name or no relation, let's just fetch profiles safely
      const { data: o, error: e } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (e || !o) return res.status(404).json({ error: "Order not found" });

      const { data: p } = await supabase.from('profiles').select('*').eq('id', o.user_id || o.buyer_id || o.customer_id).single();
      
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);

      // Update to paid (processing)
      await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);

      return res.status(200).json({
        success: true,
        order: o,
        profile: p,
        items: items || []
      });
    }

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);

    // Update to paid
    await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);

    return res.status(200).json({
      success: true,
      order: order,
      profile: order.profiles,
      items: items || []
    });

  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
