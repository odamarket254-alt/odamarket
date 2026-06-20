import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();

    // Verify API key is available
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const { type, record } = payload;
    
    // We only process new RFQ inserts from Supabase Webhooks
    if (type !== "INSERT" || !record || !record.title) {
      return new Response("Not an RFQ insert or invalid payload", { status: 200 });
    }

    // Note: In a fully deployed production environment, you would instantiate a Supabase client
    // here to query 'profiles' and fetch all relevant suppliers (e.g., matching the category_id)
    // const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // For demonstration, we'll send to a generic supplier mailing list or test address
    const supplierEmail = "suppliers@odamarket.com";

    // Professional HTML Email Template
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E293B;">
        <h1 style="color: #0F172A; margin-bottom: 24px;">New Request for Quotation (RFQ) Available</h1>
        <p style="font-size: 16px; line-height: 1.5;">A new RFQ has been posted on OdaMarket that matches your supplier profile. Submit your quotation quickly to win this business.</p>
        
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h2 style="margin-top: 0; color: #0F172A; font-size: 20px;">${record.title}</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; width: 140px;">Quantity required:</td>
              <td style="padding: 8px 0; font-weight: 600;">${record.quantity} ${record.unit}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B;">Delivery Location:</td>
              <td style="padding: 8px 0; font-weight: 600;">${record.delivery_location}</td>
            </tr>
            ${record.target_price ? `
            <tr>
              <td style="padding: 8px 0; color: #64748B;">Target Price:</td>
              <td style="padding: 8px 0; font-weight: 600;">$${record.target_price}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748B;">Posted on:</td>
              <td style="padding: 8px 0; font-weight: 600;">${new Date(record.created_at).toLocaleDateString()}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; font-size: 14px; color: #475569; border-top: 1px solid #E2E8F0; pt-4;">
            <strong>Details:</strong><br/>
            ${record.description}
          </div>
        </div>
        
        <p style="margin: 32px 0;">
          <a href="https://odamarket.com/seller/dashboard/rfqs" style="display: inline-block; background: #00C389; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">View RFQ & Quote Now</a>
        </p>
        
        <p style="font-size: 14px; color: #94A3B8; margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          You received this email because you are registered as a verified supplier on OdaMarket.<br>
          © ${new Date().getFullYear()} OdaMarket. All rights reserved.
        </p>
      </div>
    `;

    // Send email via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OdaMarket RFQ <rfq@odamarket.com>",
        to: [supplierEmail],
        subject: `New B2B RFQ: ${record.title}`,
        html: emailTemplate,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
