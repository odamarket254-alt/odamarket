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

    // Call the RPC function to handle the transaction safely
    const { data: orderData, error: rpcError } = await supabase.rpc("process_checkout", {
      p_user_id: user.id,
      p_items: items,
      p_shipping_details: shippingDetails,
      p_payment_method: paymentMethod || "M-Pesa"
    });

    if (rpcError) {
      console.error("Checkout RPC error:", rpcError);
      return res.status(400).json({ error: rpcError.message || "Failed to process checkout due to inventory or validation issues" });
    }

    res.status(200).json({ success: true, orderId: orderData });
  } catch (error: any) {
    console.error("Checkout route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
