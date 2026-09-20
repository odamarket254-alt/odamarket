import express from 'express';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Helper to generate branded confirmation HTML email
 */
function getConfirmationEmailHtml(actionLink: string, firstName?: string): string {
  try {
    const templatePath = path.join(process.cwd(), 'email-templates', 'email-confirmation.html');
    if (fs.existsSync(templatePath)) {
      let html = fs.readFileSync(templatePath, 'utf8');
      html = html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, actionLink);
      if (firstName && firstName.trim()) {
        html = html.replace('Welcome to <strong>ODA Market</strong>!', `Hi <strong>${firstName.trim()}</strong>, welcome to <strong>ODA Market</strong>!`);
      }
      return html;
    }
  } catch (err) {
    console.warn('[Webhook] Could not load template from disk, using fallback:', err);
  }

  const nameGreeting = firstName && firstName.trim() ? `Hi <strong>${firstName.trim()}</strong>, welcome to <strong>ODA Market</strong>!` : `Welcome to <strong>ODA Market</strong>!`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your ODA Market Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DCC9;">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #D96A27 0%, #F49C64 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 36px 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0; color: #D96A27; font-size: 30px; font-weight: 800;">ODA MARKET</h1>
              <p style="margin: 6px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Fresh Groceries Delivered</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 36px 40px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                <h2 style="margin: 0 0 12px 0; color: #3A2418; font-size: 20px; font-weight: 700;">Confirm your email address</h2>
                <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 15px; line-height: 1.6;">${nameGreeting}</p>
                <p style="margin: 0; color: #4B5563; font-size: 15px; line-height: 1.6;">To activate your account and start shopping for fresh groceries, please verify your email address below.</p>
              </div>
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27;">
                  Confirm Email Address &rarr;
                </a>
              </div>
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px;">Or copy and paste this link into your browser:</p>
              <div style="background-color: #FAF5EC; border: 1px solid #E8DCC9; border-radius: 8px; padding: 12px 14px; word-break: break-all;">
                <a href="${actionLink}" target="_blank" style="color: #D96A27; font-size: 12px;">${actionLink}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Webhook endpoint invoked by PostgreSQL trigger on public.profiles insertion
 * Can receive either:
 *  - Supabase Database Webhook format: { type: 'INSERT', table: 'profiles', schema: 'public', record: { ... } }
 *  - pg_net custom trigger format: { event: 'INSERT', table: 'profiles', record: { ... } }
 *  - Direct profile payload: { id: '...', email: '...', first_name: '...' }
 */
router.post('/profile-created', async (req, res) => {
  try {
    const payload = req.body || {};
    const record = payload.record || payload.new || payload;

    const email = record.email;
    const userId = record.id;
    const firstName = record.first_name || record.business_name || '';

    if (!email) {
      console.warn('[Webhook:profile-created] Ignored event: Missing email address in payload', payload);
      return res.status(400).json({ error: 'Missing email in profile record' });
    }

    console.log(`[Webhook:profile-created] Received profile insertion trigger for user ${userId || email} (${email})`);

    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = `${origin}/login?confirmed=true`;

    let actionLink: string | null = null;

    // 1. Generate GoTrue confirmation or magic link
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      } else if (linkError) {
        console.warn('[Webhook:profile-created] generateLink notice:', linkError.message);
      }
    } catch (genErr) {
      console.warn('[Webhook:profile-created] Error generating link:', genErr);
    }

    const finalLink = actionLink || `${origin}/login?confirmed=true`;

    // 2. Dispatch the branded confirmation email via Resend
    let resendMessageId: string | null = null;
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailResult = await resend.emails.send({
          from: 'ODA Market <noreply@odamarket.co.ke>',
          to: email,
          subject: 'Confirm your ODA Market account',
          html: getConfirmationEmailHtml(finalLink, firstName)
        });

        if (emailResult.error) {
          console.error('[Webhook:profile-created] Resend error:', emailResult.error);
        } else {
          resendMessageId = emailResult.data?.id || null;
          console.log(`[Webhook:profile-created] Successfully dispatched branded confirmation email to ${email} (ID: ${resendMessageId})`);
        }
      } catch (sendErr) {
        console.error('[Webhook:profile-created] Resend dispatch exception:', sendErr);
      }
    } else {
      console.warn('[Webhook:profile-created] RESEND_API_KEY is not configured on server.');
    }

    // 3. Return successful response to PostgreSQL trigger / webhook caller
    return res.status(200).json({
      success: true,
      message: 'Profile insertion processed and email dispatch triggered',
      email: email,
      userId: userId,
      resendId: resendMessageId
    });
  } catch (error: any) {
    console.error('[Webhook:profile-created] Error processing trigger request:', error);
    return res.status(500).json({ error: error.message || 'Internal server error processing profile webhook' });
  }
});

export default router;
