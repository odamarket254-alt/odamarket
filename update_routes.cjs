const fs = require('fs');

const file = 'routes/checkoutRoutes.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `      .from('orders')
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
});`;

const replacement = `      .from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name, phone, email)')
      .eq('id', orderId)
      .single();

    let finalOrder = null;
    let finalProfile = null;

    if (orderErr || !order) {
      // It might be a different foreign key relation name or no relation, let's just fetch profiles safely
      const { data: o, error: e } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (e || !o) return res.status(404).json({ error: "Order not found" });
      const { data: p } = await supabase.from('profiles').select('*').eq('id', o.user_id || o.buyer_id || o.customer_id).single();
      finalOrder = o;
      finalProfile = p;
    } else {
      finalOrder = order;
      finalProfile = order.profiles;
    }

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);

    // Update to paid (processing)
    await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);

    // 5. Send Order Confirmation SMS (Idempotent)
    try {
      const currentNotes = finalOrder.notes ? (typeof finalOrder.notes === 'string' ? JSON.parse(finalOrder.notes) : finalOrder.notes) : {};
      
      if (currentNotes.sms_status !== 'sent') {
        const customerName = currentNotes.contactDetails?.fullName || currentNotes.shippingDetails?.recipientName || finalProfile?.full_name || 'Customer';
        const phone = currentNotes.contactDetails?.userPhone || currentNotes.shippingDetails?.recipientPhone || finalProfile?.phone;
        const orderNumber = currentNotes.orderNumber || finalOrder.id;

        if (phone) {
          const smsResult = await sendOrderSMS(phone, customerName, orderNumber, finalOrder.total);
          
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
            .eq('id', orderId);
        }
      }
    } catch (smsError) {
      console.error("Order SMS error during verification:", smsError);
      // Do not fail the verification process just because SMS failed
    }

    return res.status(200).json({
      success: true,
      order: finalOrder,
      profile: finalProfile,
      items: items || []
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully updated file.');
} else {
  console.log('Target not found. Please review the file content manually.');
}
