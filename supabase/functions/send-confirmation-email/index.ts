import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTION_SENDER = "Team ODA Market <team@odamarket.co.ke>";
const PRODUCTION_REDIRECT_URL = "https://odamarket.co.ke/login?confirmed=true";
const FALLBACK_CONFIRMATION_TEMPLATE_ID = "2d5aeedf-970b-4b39-98a6-f6770235d481";

/**
 * Supabase Edge Function: send-confirmation-email
 *
 * Flow:
 *   NEW USER REGISTERS ON ODA MARKET
 *   ↓
 *   SUPABASE AUTH CREATES USER
 *   ↓
 *   Generate official Supabase email confirmation link (action_link)
 *   ↓
 *   Send Resend Template from `Team ODA Market <team@odamarket.co.ke>`
 *   ↓
 *   User receives confirmation email, clicks link -> Supabase verifies email -> returns to ODA Market
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = (Deno.env.get("RESEND_API_KEY") || "").trim().replace(/^["']|["']$/g, "");
    if (!resendApiKey || !resendApiKey.startsWith("re_")) {
      console.error("[send-confirmation-email] RESEND_API_KEY is missing or invalid in Supabase secrets.");
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
    let confirmationUrl: string = (
      payload.confirmationUrl ||
      payload.confirmation_url ||
      payload.actionLink ||
      ""
    ).trim();
    const redirectTo: string = (payload.redirectTo || PRODUCTION_REDIRECT_URL).trim();

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
          console.warn(`[send-confirmation-email] Rejected: User ${userId} not found in Supabase Auth.`);
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

        if (!payload.forceResend && existingMeta.resend_confirmation_sent_at) {
          return new Response(
            JSON.stringify({
              success: true,
              skipped: true,
              alreadySent: true,
              recipient: email,
              sentAt: existingMeta.resend_confirmation_sent_at,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (!confirmationUrl && email) {
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo },
        });
        if (!linkErr && linkData?.properties?.action_link) {
          confirmationUrl = linkData.properties.action_link;
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
    const resolvedConfirmationUrl = confirmationUrl || redirectTo;

    const configuredTemplateId = (
      Deno.env.get("RESEND_EMAIL_VERIFICATION_TEMPLATE_ID") ||
      Deno.env.get("RESEND_TEMPLATE_ID") ||
      "34a080c9-b17d-4187-ad80-5af20266e535"
    ).trim().replace(/^["']|["']$/g, "");

    const candidateTemplates = Array.from(
      new Set([configuredTemplateId, FALLBACK_CONFIRMATION_TEMPLATE_ID].filter(Boolean))
    );

    let resendId: string | null = null;
    let usedTemplateId: string = configuredTemplateId;
    let lastError: unknown = null;

    for (const tplId of candidateTemplates) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payload.forceResend
            ? `oda-verify-${email}-${Date.now()}`
            : `oda-verify-${email}-${tplId}`,
        },
        body: JSON.stringify({
          from: PRODUCTION_SENDER,
          to: [email],
          subject: "Confirm your email address",
          template: {
            id: tplId,
            variables: {
              ConfirmationURL: resolvedConfirmationUrl,
              confirmation_url: resolvedConfirmationUrl,
              name: resolvedName,
              email,
            },
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        resendId = data?.id || null;
        usedTemplateId = tplId;
        lastError = null;
        break;
      }

      lastError = data;
      const errMsg = String(data?.message || "").toLowerCase();
      if (errMsg.includes("associated domain with your api key is not verified")) {
        console.error(
          "[send-confirmation-email] RESEND_API_KEY is bound to an older/unverified domain UUID. Update RESEND_API_KEY to an API key associated with the verified odamarket.co.ke domain (bb7256e6-2044-4288-a37c-a24ab6a63e41)."
        );
        break;
      }
    }

    if (!resendId && lastError) {
      console.error("[send-confirmation-email] Resend dispatch error:", {
        recipient: email,
        error: lastError,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: (lastError as { message?: string })?.message || "Failed to send confirmation email",
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
            resend_confirmation_sent_at: sentAt,
            resend_confirmation_id: resendId,
          },
        });
      } catch {
        // Non-fatal
      }
    }

    console.log(`[send-confirmation-email] Sent confirmation template (${usedTemplateId}) from ${PRODUCTION_SENDER} to ${email} (ID: ${resendId})`);
    return new Response(
      JSON.stringify({
        success: true,
        from: PRODUCTION_SENDER,
        recipient: email,
        templateId: usedTemplateId,
        resendId,
        sentAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[send-confirmation-email] Unhandled exception:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
