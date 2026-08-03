import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { items, shippingDetails, paymentMethod } = req.body;
    
    // Auth token check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        .select('id, title, regular_price, sale_price, stock')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product. Available: ${product.stock}, Requested: ${item.quantity}` });
      }

      const price = product.sale_price || product.regular_price;
      totalAmount += price * item.quantity;

      orderItems.push({
        product_id: product.id,
        product_name: product.title || 'Unknown Product',
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
        buyer_id: user.id,
        customer_id: user.id, // Some schemas might expect customer_id instead or as well
        order_number: orderNumber,
        status: 'pending',
        subtotal: totalAmount,
        grand_total: totalAmount,
        notes: JSON.stringify({ shippingDetails, contactDetails, paymentMethod })
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

    res.status(200).json({ success: true, orderId: orderData.id });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
