import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Supabase Edge Function: send-registration-email
 *
 * Flow:
 *   NEW ODA MARKET USER REGISTERS
 *   ↓
 *   Verify user exists in Supabase Auth & check idempotency (`resend_user_created_sent_at`)
 *   ↓
 *   Sync contact in Resend (POST https://api.resend.com/contacts)
 *   ↓
 *   Emit `user.created` event (POST https://api.resend.com/events/send)
 *   ↓
 *   Resend Automation ("Welcome series") triggers & sends Welcome template to the user's email
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = (Deno.env.get("RESEND_API_KEY") || "").trim().replace(/^["']|["']$/g, "");
    if (!resendApiKey || !resendApiKey.startsWith("re_")) {
      console.error("[send-registration-email] RESEND_API_KEY is missing or invalid in Supabase secrets.");
      return new Response(
        JSON.stringify({ success: false, error: "Server email configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const record = payload.record || payload.user || payload;
    let userId: string = (record.userId || record.id || "").trim();
    let email: string = (record.email || "").trim().toLowerCase();
    let firstName: string = (record.firstName || record.first_name || record.user_metadata?.first_name || "").trim();
    let lastName: string = (record.lastName || record.last_name || record.user_metadata?.last_name || "").trim();
    let fullName: string = (
      record.name ||
      record.full_name ||
      record.user_metadata?.full_name ||
      `${firstName} ${lastName}`.trim()
    ).trim();

    // 1. Verify user exists in Supabase Auth and enforce persistent idempotency
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    let existingMeta: Record<string, unknown> = {};
    let supabaseAdmin: ReturnType<typeof createClient> | null = null;

    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      if (userId) {
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userErr || !userData?.user) {
          console.warn(`[send-registration-email] Rejected: User ${userId} not found in Supabase Auth.`);
          return new Response(
            JSON.stringify({ success: false, skipped: true, error: "User not found in Supabase Auth" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!email && userData.user.email) {
          email = userData.user.email.trim().toLowerCase();
        }
        existingMeta = (userData.user.user_metadata as Record<string, unknown>) || {};
        if (!firstName && existingMeta.first_name) firstName = String(existingMeta.first_name).trim();
        if (!lastName && existingMeta.last_name) lastName = String(existingMeta.last_name).trim();
        if (!fullName) {
          fullName = String(existingMeta.full_name || `${firstName} ${lastName}`.trim() || "").trim();
        }

        // Prevent duplicate user.created events for the same registration
        if (existingMeta.resend_user_created_sent_at) {
          return new Response(
            JSON.stringify({
              success: true,
              skipped: true,
              alreadySent: true,
              recipient: email,
              sentAt: existingMeta.resend_user_created_sent_at,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid user email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedName = fullName || `${firstName} ${lastName}`.trim() || "Valued Customer";
    const resolvedFirstName = firstName || resolvedName.split(" ")[0] || "Valued Customer";

    // 2. Sync contact to Resend Contacts so `contact.first_name` / `contact.email` are available
    try {
      await fetch("https://api.resend.com/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: resolvedFirstName,
          last_name: lastName || undefined,
          unsubscribed: false,
        }),
      });
    } catch {
      // Non-fatal if contact already exists
    }

    // 3. Emit `user.created` event to Resend (`POST https://api.resend.com/events/send`)
    // This triggers the "Welcome series" Resend Automation for the newly registered user
    const eventRes = await fetch("https://api.resend.com/events/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "user.created",
        email,
        payload: {
          user_id: userId,
          email,
          name: resolvedName,
          customer_name: resolvedName,
          first_name: resolvedFirstName,
          last_name: lastName,
          shop_url: "https://odamarket.co.ke/products",
          login_url: "https://odamarket.co.ke/login",
        },
      }),
    });

    const eventData = await eventRes.json().catch(() => ({}));
    if (!eventRes.ok) {
      console.error("[send-registration-email] Resend /events/send error:", {
        status: eventRes.status,
        recipient: email,
        error: eventData,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: eventData?.message || `Resend returned HTTP ${eventRes.status}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentAt = new Date().toISOString();
    if (supabaseAdmin && userId) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            resend_user_created_sent_at: sentAt,
          },
        });
      } catch {
        // Non-fatal
      }
    }

    console.log(`[send-registration-email] Triggered user.created automation for ${email}`);
    return new Response(
      JSON.stringify({
        success: true,
        event: "user.created",
        automation: "Welcome series",
        recipient: email,
        sentAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[send-registration-email] Unhandled exception:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
