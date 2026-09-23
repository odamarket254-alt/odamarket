import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { sendOTP, formatPhone } from '../src/lib/sms.js';
import { createClient } from '@supabase/supabase-js';
import { runSupabaseAuthDiagnostics } from '../src/utils/supabaseAuthDiagnostics.js';

const router = express.Router();

const supabaseAdmin = createClient(
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^["']|["']$/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key").trim().replace(/^["']|["']$/g, '')
);

const supabaseAnon = createClient(
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^["']|["']$/g, ''),
  (process.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key").trim().replace(/^["']|["']$/g, '')
);

const requestLimits = new Map<string, number>();

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

router.post('/register-step1', async (req, res) => {
  try {
    const { accountData } = req.body;
    const formattedPhone = formatPhone(accountData.phone);

    let userId;
    if (accountData.email) {
      const { data: byEmail } = await supabaseAdmin.from('profiles').select('id, verified').eq('email', accountData.email).maybeSingle();
      if (byEmail) {
        if (byEmail.verified) {
           return res.status(400).json({ error: 'Email is already registered and verified.' });
        } else {
           userId = byEmail.id;
        }
      }
    }
    
    if (formattedPhone) {
      const { data: byPhone } = await supabaseAdmin.from('profiles').select('id, verified').eq('phone', formattedPhone).maybeSingle();
      if (byPhone && byPhone.id !== userId) {
         return res.status(400).json({ error: 'Phone number is already registered by another account.' });
      }
    }

    if (userId) {
       const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
         phone: formattedPhone,
         password: accountData.password,
         user_metadata: {
           first_name: accountData.first_name,
           last_name: accountData.last_name,
           full_name: `${accountData.first_name} ${accountData.last_name}`,
           phone: formattedPhone,
           phone_verified: false,
         }
       });
       if (updateError) return res.status(400).json({ error: updateError.message });
       
       await supabaseAdmin.from('profiles').update({ phone: formattedPhone }).eq('id', userId);
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: accountData.email,
        password: accountData.password,
        phone: formattedPhone,
        email_confirm: true,
        phone_confirm: false,
        user_metadata: {
          first_name: accountData.first_name,
          last_name: accountData.last_name,
          full_name: `${accountData.first_name} ${accountData.last_name}`,
          phone: formattedPhone,
          phone_verified: false,
          role: 'customer'
        }
      });
      if (authError) {
         return res.status(400).json({ error: authError.message });
      }
      userId = authData.user.id;
    }
    
    const now = Date.now();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = hashOtp(otp);
    const expires_at = now + 5 * 60 * 1000;

    const { error: dbError } = await supabaseAdmin.from('phone_verifications').upsert({
      phone: formattedPhone,
      otp_hash,
      expires_at,
      attempts: 0,
      status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'phone' });

    if (dbError) {
      console.error('Supabase Error saving OTP:', dbError.message);
      return res.status(500).json({ error: 'Failed to create account due to database error.' });
    }

    const smsResult = await sendOTP(formattedPhone, otp);
    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      return res.status(500).json({ error: 'Failed to send OTP via SMS. Please try again.', details: smsResult.error });
    }

    res.status(200).json({ success: true, userId: userId });
  } catch (error) {
    console.error('Failed to register step 1:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/check-user', async (req, res) => {
  try {
    const { email, phone } = req.body;
    const formattedPhone = formatPhone(phone);

    if (email) {
      const { data: byEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
      if (byEmail) return res.status(400).json({ error: 'Email is already registered' });
    }

    if (phone) {
      const { data: byPhone } = await supabaseAdmin.from('profiles').select('id').eq('phone', formattedPhone).maybeSingle();
      if (byPhone) return res.status(400).json({ error: 'Phone number is already registered' });
    }

    res.status(200).json({ success: true, formattedPhone });
  } catch (error) {
    console.error('Failed to check user:', error);
    res.status(500).json({ error: 'Failed to verify availability.' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const formattedPhone = formatPhone(phone);

    const now = Date.now();
    const lastRequest = requestLimits.get(formattedPhone);

    if (lastRequest && now - lastRequest < 60000) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = hashOtp(otp);
    const expires_at = now + 5 * 60 * 1000;

    const { error: dbError } = await supabaseAdmin.from('phone_verifications').upsert({
      phone: formattedPhone,
      otp_hash,
      expires_at,
      attempts: 0,
      status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'phone' });

    if (dbError) {
      console.error('Supabase Error saving OTP:', dbError.message);
      return res.status(500).json({ error: 'Failed to send OTP due to database error. Please try again.' });
    }

    requestLimits.set(formattedPhone, now);

    const smsResult = await sendOTP(formattedPhone, otp);
    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      return res.status(500).json({ error: 'Failed to send OTP via SMS. Please try again.', details: smsResult.error });
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, userId, accountData } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const formattedPhone = formatPhone(phone);

    const { data: record, error: fetchError } = await supabaseAdmin
      .from('phone_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (fetchError || !record) {
      return res.status(400).json({ error: 'No OTP requested for this number or it has expired.' });
    }

    const { otp_hash: otpHashToCompare, attempts, expires_at: expiresAt } = record;

    if (Date.now() > expiresAt) {
      await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);
      return res.status(400).json({ error: 'Your verification code has expired. Please request a new code.' });
    }

    if (attempts >= 5) {
      await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    const inputHash = hashOtp(otp);
    if (otpHashToCompare !== inputHash) {
      await supabaseAdmin.from('phone_verifications').update({ attempts: attempts + 1 }).eq('phone', formattedPhone);
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);

    let finalUserId = userId;

    if (accountData && !userId) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: accountData.email,
        password: accountData.password,
        phone: formattedPhone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          first_name: accountData.first_name,
          last_name: accountData.last_name,
          full_name: `${accountData.first_name} ${accountData.last_name}`,
          phone: formattedPhone,
          phone_verified: true,
          role: 'customer'
        }
      });
      if (authError) throw authError;
      finalUserId = authData.user.id;
    } else if (userId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        phone_confirm: true,
        user_metadata: { phone_verified: true }
      });
      await supabaseAdmin.from('profiles').update({ verified: true }).eq('id', userId);
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully.', userId: finalUserId });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});


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
    console.warn('[EmailTemplate] Could not load template from disk, using inline fallback:', err);
  }

  const nameGreeting = firstName && firstName.trim() ? `Hi <strong>${firstName.trim()}</strong>, welcome to <strong>ODA Market</strong>!` : `Welcome to <strong>ODA Market</strong>!`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your ODA Market Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC;">
    <tr>
      <td align="center" style="padding: 40px 15px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(58, 36, 24, 0.08); border: 1px solid #E8DCC9;">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #D96A27 0%, #F49C64 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 36px 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0; color: #D96A27; font-size: 30px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">ODA MARKET</h1>
              <p style="margin: 6px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Fresh Groceries Delivered</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 36px 40px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                <h2 style="margin: 0 0 12px 0; color: #3A2418; font-size: 20px; font-weight: 700;">Confirm your email address</h2>
                <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 15px; line-height: 1.6;">${nameGreeting} We're thrilled to have you join our marketplace.</p>
                <p style="margin: 0; color: #4B5563; font-size: 15px; line-height: 1.6;">To activate your account, secure your profile, and start ordering fresh farm produce, groceries, and household essentials, please verify your email address below.</p>
              </div>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27; box-shadow: 0 4px 14px rgba(217, 106, 39, 0.35); text-align: center;">
                      Confirm Email Address &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; line-height: 1.5;">If the button above does not work in your email client, copy and paste this link into your browser:</p>
              <div style="background-color: #FAF5EC; border: 1px solid #E8DCC9; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; word-break: break-all;">
                <a href="${actionLink}" target="_blank" style="color: #D96A27; font-size: 12px; text-decoration: underline;">${actionLink}</a>
              </div>
              <div style="border-top: 1px solid #F0E6D8; padding-top: 20px;">
                <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.6;">This verification link will expire in 24 hours. If you did not create an account with ODA Market, please safely disregard this email.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF5EC; padding: 24px 30px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0 0 6px 0; color: #3A2418; font-size: 12px; font-weight: 600;">&copy; 2026 ODA Market. All rights reserved.</p>
              <p style="margin: 0; color: #8B857D; font-size: 12px;">Nairobi, Kenya &bull; Need help? Contact us at <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none; font-weight: 600;">info@odamarket.co.ke</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

router.post('/register-complete', async (req, res) => {
  try {
    const { accountData, addressData } = req.body;
    const formattedPhone = formatPhone(accountData.phone);
    
    // Check email
    if (accountData.email) {
      const { data: byEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', accountData.email).maybeSingle();
      if (byEmail) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
    }
    
    // Create user with email_confirm: false so Supabase requires email verification
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      phone: formattedPhone,
      email_confirm: false,
      phone_confirm: false,
      user_metadata: {
        first_name: accountData.first_name,
        last_name: accountData.last_name,
        full_name: `${accountData.first_name} ${accountData.last_name}`,
        phone: formattedPhone,
        phone_verified: false,
        role: 'customer'
      }
    });

    if (authError) {
       return res.status(400).json({ error: authError.message });
    }
    const userId = authData.user.id;

    // Save address if provided
    if (addressData) {
      const fullName = [accountData.first_name, accountData.last_name].filter(Boolean).join(' ').trim() || 'Valued Customer';
      const phone = accountData.phone || formattedPhone || '';
      const county = addressData.county || '';
      const townCity = addressData.town || addressData.town_city || '';
      const areaLocation = addressData.estate || addressData.area_location || addressData.town || county || '';

      const streetParts = [
        addressData.street,
        addressData.apartment ? `Apt ${addressData.apartment}` : '',
        addressData.house_number ? `House ${addressData.house_number}` : '',
        addressData.formatted_address && !addressData.street ? addressData.formatted_address : ''
      ].filter(Boolean);

      const streetBuilding = streetParts.join(', ') || addressData.formatted_address || 'Delivery Address';

      const { error: addressError } = await supabaseAdmin.from('delivery_addresses').insert({
        user_id: userId,
        full_name: fullName,
        phone: phone,
        county: county,
        town_city: townCity,
        area_location: areaLocation,
        street_building: streetBuilding,
        delivery_instructions: addressData.delivery_instructions || '',
        is_default: true,
      });
      if (addressError) {
        console.error("Failed to save address:", addressError);
      }
    }

    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = `${origin}/login?confirmed=true`;
    let emailSent = false;

    // 1. Send the branded HTML template directly via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: accountData.email,
          password: accountData.password,
          options: {
            redirectTo: redirectUrl
          }
        });

        const actionLink = linkData?.properties?.action_link;
        if (actionLink) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const emailRes = await resend.emails.send({
            from: 'ODA Market <noreply@odamarket.co.ke>', 
            to: accountData.email,
            subject: 'Confirm your ODA Market account',
            html: getConfirmationEmailHtml(actionLink, accountData.first_name)
          });
          if (!emailRes.error) {
            emailSent = true;
            console.log(`[Auth] Branded template confirmation email sent successfully to ${accountData.email}, id: ${emailRes?.data?.id}`);
          } else {
            console.warn("[Auth] Resend error:", emailRes.error);
          }
        } else if (linkError) {
          console.warn("[Auth] generateLink error:", linkError.message);
        }
      } catch (e) {
        console.warn("[Auth] Resend sending exception:", e);
      }
    }

    // 2. If Resend was not configured or failed, fallback to Supabase native mailer
    if (!emailSent) {
      try {
        const { data: resendData, error: resendError } = await supabaseAnon.auth.resend({
          type: 'signup',
          email: accountData.email,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (resendError) {
          console.warn("[Auth] Supabase native auth.resend fallback notice:", resendError.message);
        } else {
          console.log("[Auth] Supabase native confirmation email fallback dispatched to:", accountData.email);
        }
      } catch (sbErr) {
        console.warn("[Auth] Supabase native resend fallback exception:", sbErr);
      }
    }

    res.status(200).json({ success: true, userId: userId, email: accountData.email });
  } catch (error) {
    console.error('Failed to complete registration:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/save-address', async (req, res) => {
  try {
    const { userId, email, addressData } = req.body;
    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (profile) targetUserId = profile.id;
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'User not found to associate address.' });
    }

    if (addressData) {
      const county = addressData.county || '';
      const townCity = addressData.town || addressData.town_city || '';
      const areaLocation = addressData.estate || addressData.area_location || addressData.town || county || '';

      const streetParts = [
        addressData.street || addressData.street_building,
        addressData.apartment ? `Apt ${addressData.apartment}` : '',
        addressData.house_number ? `House ${addressData.house_number}` : '',
      ].filter(Boolean);

      const streetBuilding = streetParts.join(', ') || addressData.formatted_address || 'Delivery Address';

      const { error: addressError } = await supabaseAdmin.from('delivery_addresses').insert({
        user_id: targetUserId,
        full_name: addressData.full_name || 'Valued Customer',
        phone: addressData.phone || '',
        county: county,
        town_city: townCity,
        area_location: areaLocation,
        street_building: streetBuilding,
        delivery_instructions: addressData.delivery_instructions || '',
        is_default: true,
      });

      if (addressError) {
        console.warn('[Address] Warning inserting delivery address:', addressError.message);
        return res.status(400).json({ error: addressError.message });
      }
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Address] Failed to save address:', err);
    res.status(500).json({ error: 'Failed to save address.' });
  }
});

router.post('/resend-confirmation-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = `${origin}/login?confirmed=true`;
    let emailSent = false;

    // 1. Send the branded HTML template directly via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: redirectUrl
          }
        });
        const actionLink = linkData?.properties?.action_link;
        if (actionLink) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const emailRes = await resend.emails.send({
            from: 'ODA Market <noreply@odamarket.co.ke>',
            to: email,
            subject: 'Confirm your ODA Market account',
            html: getConfirmationEmailHtml(actionLink)
          });
          if (!emailRes.error) {
            emailSent = true;
            console.log(`[Auth] Resend template confirmation email dispatched to ${email}, id: ${emailRes?.data?.id}`);
          } else {
            console.warn('[Auth] Resend error during resend:', emailRes.error);
          }
        } else if (linkError) {
          console.warn('[Auth] generateLink error during resend:', linkError.message);
        }
      } catch (err) {
        console.warn('[Auth] Resend backup send error:', err);
      }
    }

    // 2. Fallback to Supabase native mailer
    if (!emailSent) {
      try {
        const { error: resendError } = await supabaseAnon.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (!resendError) {
          console.log(`[Auth] Supabase native resend dispatched to ${email}`);
        } else {
          console.warn('[Auth] Supabase native resend warning:', resendError.message);
        }
      } catch (e) {
        console.warn('[Auth] Supabase native resend exception:', e);
      }
    }

    return res.status(200).json({ success: true, message: 'Confirmation email sent.' });
  } catch (error) {
    console.error('Failed to resend confirmation email:', error);
    res.status(500).json({ error: 'Failed to resend confirmation email.' });
  }
});

/**
 * Admin endpoint to delete a user.
 * Implements SOFT DELETE by default, safely deactivating the account,
 * revoking access, banning the user in GoTrue, and preserving data integrity without
 * foreign key constraint failures ("Database error deleting user").
 * Also provides optional hardDelete=true with graceful fallback to soft-delete.
 */
router.post('/admin/delete-user', async (req, res) => {
  try {
    const { userId, email, softDelete = true, hardDelete = false } = req.body;
    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const match = (usersData?.users as any[])?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (match) {
        targetUserId = match.id;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target userId or valid email is required' });
    }

    const isSoftDelete = softDelete && !hardDelete;

    if (isSoftDelete) {
      console.log(`[Auth:soft-delete] Initiating soft delete for user: ${targetUserId}`);
      const nowIso = new Date().toISOString();

      // 1. Fetch current user from Supabase Auth to preserve existing metadata
      const { data: userData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (getUserErr) {
        console.error(`[Auth:soft-delete] getUserById error for ${targetUserId}:`, getUserErr);
        return res.status(404).json({ error: getUserErr.message });
      }

      const existingUser = userData.user;
      const updatedAppMetadata = {
        ...(existingUser.app_metadata || {}),
        is_deleted: true,
        deleted_at: nowIso,
        status: 'deleted'
      };
      const updatedUserMetadata = {
        ...(existingUser.user_metadata || {}),
        is_deleted: true,
        deleted_at: nowIso,
        status: 'deleted'
      };

      // 2. Ban user for 100 years and set soft-delete flags in auth
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876600h', // 100 years
        app_metadata: updatedAppMetadata,
        user_metadata: updatedUserMetadata
      });

      if (banError) {
        console.error(`[Auth:soft-delete] Failed to update user auth flags:`, banError);
        return res.status(500).json({ error: banError.message });
      }

      // 3. Revoke any active sessions
      try {
        await supabaseAdmin.auth.admin.signOut(targetUserId);
      } catch (signOutErr) {
        console.warn(`[Auth:soft-delete] Notice: signOut error (non-fatal):`, signOutErr);
      }

      // 4. Update profile in public.profiles table (attempting soft-delete fields)
      try {
        await supabaseAdmin.from('profiles').update({
          is_deleted: true,
          deleted_at: nowIso,
          updated_at: nowIso
        } as any).eq('id', targetUserId);
      } catch (profileUpdateErr) {
        console.warn(`[Auth:soft-delete] Note: profiles table update (non-fatal):`, profileUpdateErr);
      }

      console.log(`[Auth:soft-delete] Successfully soft-deleted user ${targetUserId}`);
      return res.status(200).json({
        success: true,
        softDeleted: true,
        userId: targetUserId,
        deletedAt: nowIso,
        message: `User account deactivated and soft-deleted safely. Database references and order records are preserved.`
      });
    }

    // HARD PURGE FLOW (Explicitly requested)
    console.log(`[Auth:delete-user] Initiating hard deletion cascade for user: ${targetUserId}`);

    const cleanupOps = [
      supabaseAdmin.from('delivery_addresses').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('reward_points').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('support_tickets').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('support_tickets').delete().eq('customer_id', targetUserId),
      supabaseAdmin.from('cart_items').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('wishlists').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('wishlists').delete().eq('buyer_id', targetUserId),
      supabaseAdmin.from('notifications').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('saved_for_later').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('price_drop_alerts').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('back_in_stock_notifications').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('recent_views').delete().eq('buyer_id', targetUserId),
      supabaseAdmin.from('recent_views').delete().eq('user_id', targetUserId),
      supabaseAdmin.from('inquiries').delete().eq('buyer_id', targetUserId),
      supabaseAdmin.from('inquiries').delete().eq('seller_id', targetUserId),
      supabaseAdmin.from('profiles').delete().eq('id', targetUserId)
    ];

    await Promise.allSettled(cleanupOps);

    // Delete user from GoTrue / Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.warn(`[Auth:delete-user] Hard delete error (${deleteError.message}). Falling back to safe soft-delete.`);
      // Automatic fallback so operation never fails with foreign key violation
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876600h',
        app_metadata: { is_deleted: true, deleted_at: new Date().toISOString(), status: 'deleted' },
        user_metadata: { is_deleted: true, deleted_at: new Date().toISOString(), status: 'deleted' }
      });
      return res.status(200).json({
        success: true,
        softDeleted: true,
        fallback: true,
        message: `User is tied to existing database records. Safely deactivated and soft-deleted instead.`
      });
    }

    console.log(`[Auth:delete-user] Successfully purged user ${targetUserId}`);
    return res.status(200).json({ success: true, hardDeleted: true, message: `User ${targetUserId} deleted successfully.` });
  } catch (err: any) {
    console.error('[Auth:delete-user] Unexpected error deleting user:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

/**
 * Admin endpoint to restore a soft-deleted user
 */
router.post('/admin/restore-user', async (req, res) => {
  try {
    const { userId, email } = req.body;
    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const match = (usersData?.users as any[])?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (match) {
        targetUserId = match.id;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target userId or valid email is required' });
    }

    console.log(`[Auth:restore-user] Restoring user: ${targetUserId}`);

    const { data: userData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (getUserErr) {
      return res.status(404).json({ error: getUserErr.message });
    }

    const existingUser = userData.user;
    const updatedAppMetadata = {
      ...(existingUser.app_metadata || {}),
      is_deleted: false,
      deleted_at: null,
      status: 'active'
    };
    const updatedUserMetadata = {
      ...(existingUser.user_metadata || {}),
      is_deleted: false,
      deleted_at: null,
      status: 'active'
    };

    // Remove ban and reset soft-delete metadata
    const { error: restoreError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      ban_duration: 'none',
      app_metadata: updatedAppMetadata,
      user_metadata: updatedUserMetadata
    });

    if (restoreError) {
      return res.status(500).json({ error: restoreError.message });
    }

    // Attempt profile restore
    try {
      await supabaseAdmin.from('profiles').update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString()
      } as any).eq('id', targetUserId);
    } catch (profileErr) {
      console.warn('[Auth:restore-user] Profile update notice:', profileErr);
    }

    return res.status(200).json({
      success: true,
      restored: true,
      message: `User account restored and unbanned successfully.`
    });
  } catch (err: any) {
    console.error('[Auth:restore-user] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Failed to restore user' });
  }
});

/**
 * Admin endpoint: List all users with status, soft-delete state, and roles
 */
router.get('/admin/all-users', async (req, res) => {
  try {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (usersError) {
      return res.status(500).json({ error: usersError.message });
    }

    const allUsers = usersData?.users || [];
    const userIds = allUsers.map(u => u.id);
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name, phone_number, role, avatar_url, created_at')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    const formatted = allUsers.map(u => {
      const profile = profilesMap[u.id] || {};
      const isSoftDeleted = Boolean(
        u.banned_until || 
        u.app_metadata?.is_deleted || 
        (u.user_metadata as any)?.is_deleted ||
        profile.is_deleted
      );
      const isConfirmed = Boolean(u.email_confirmed_at);
      const email = u.email || profile.email || 'No email';

      return {
        id: u.id,
        email,
        firstName: profile.first_name || (u.user_metadata as any)?.first_name || '',
        lastName: profile.last_name || (u.user_metadata as any)?.last_name || '',
        phoneNumber: profile.phone_number || u.phone || '',
        role: profile.role || (u.user_metadata as any)?.role || 'customer',
        isConfirmed,
        emailConfirmedAt: u.email_confirmed_at,
        isSoftDeleted,
        bannedUntil: u.banned_until,
        deletedAt: u.app_metadata?.deleted_at || (u.user_metadata as any)?.deleted_at || null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
      };
    });

    formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = formatted.length;
    const softDeletedCount = formatted.filter(u => u.isSoftDeleted).length;
    const activeCount = formatted.filter(u => !u.isSoftDeleted && u.isConfirmed).length;
    const unconfirmedCount = formatted.filter(u => !u.isSoftDeleted && !u.isConfirmed).length;

    return res.status(200).json({
      success: true,
      users: formatted,
      counts: {
        total,
        active: activeCount,
        unconfirmed: unconfirmedCount,
        softDeleted: softDeletedCount
      }
    });
  } catch (err: any) {
    console.error('[Auth:all-users] Error listing users:', err);
    return res.status(500).json({ error: err.message || 'Failed to list users' });
  }
});

/**
 * Diagnostic endpoint to check Supabase Auth 'Confirm email' setting & SMTP configuration
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnosticReport = await runSupabaseAuthDiagnostics();
    return res.status(200).json(diagnosticReport);
  } catch (err: any) {
    console.error('[Auth:diagnostics] Error running diagnostics:', err);
    return res.status(500).json({ error: err.message || 'Failed to run auth diagnostics' });
  }
});

/**
 * Diagnostic test dispatch endpoint: Sends a test confirmation email to verify delivery pipeline
 */
router.post('/diagnostics/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Target email is required for delivery test' });
    }

    const report = await runSupabaseAuthDiagnostics();
    let resendResult: any = null;
    let gotrueResult: any = null;

    // Test Resend dispatch if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: 'ODA Market <noreply@odamarket.co.ke>',
          to: email,
          subject: 'ODA Market - SMTP & Auth Diagnostic Test',
          html: `<div style="font-family: sans-serif; padding: 20px; background-color: #FAF5EC; border-radius: 8px;">
            <h2 style="color: #D96A27;">Supabase Auth & SMTP Diagnostic Test</h2>
            <p>This is a live diagnostic verification email sent from ODA Market.</p>
            <ul>
              <li><strong>Confirm Email Setting:</strong> ${report.confirmEmailEnabled ? 'Enabled' : 'Disabled'}</li>
              <li><strong>Email Provider:</strong> ${report.emailProviderEnabled ? 'Active' : 'Inactive'}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
            <p style="color: #4B5563;">If you received this message, transactional email delivery is functioning correctly.</p>
          </div>`
        });
        resendResult = { success: !error, data, error };
      } catch (rErr: any) {
        resendResult = { success: false, error: rErr.message };
      }
    }

    return res.status(200).json({
      success: true,
      email,
      report,
      resendResult,
      gotrueResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error executing test email' });
  }
});

/**
 * Diagnostic endpoint: Lists all users whose email_confirmed_at is null
 * Returns segmentation metrics (by registration age, domain, role)
 */
router.get('/admin/unconfirmed-users', async (req, res) => {
  try {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (usersError) {
      console.error('[Auth:unconfirmed-users] listUsers error:', usersError);
      return res.status(500).json({ error: usersError.message });
    }

    const allUsers = usersData?.users || [];
    const unconfirmedRaw = allUsers.filter(u => !u.email_confirmed_at);

    // Fetch corresponding profiles for extra context (role, name, phone)
    const userIds = unconfirmedRaw.map(u => u.id);
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name, phone_number, role, avatar_url, created_at')
        .in('id', userIds);

      if (!profileErr && profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    const now = Date.now();

    // Map users with diagnostic attributes
    const formattedUsers = unconfirmedRaw.map(u => {
      const profile = profilesMap[u.id] || {};
      const createdAt = new Date(u.created_at).getTime();
      const diffMs = now - createdAt;
      const hoursAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
      const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const email = u.email || profile.email || 'No email';
      const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : 'unknown';

      let timeSegment: 'under24h' | 'from1to7d' | 'over7d' = 'over7d';
      if (hoursAgo < 24) {
        timeSegment = 'under24h';
      } else if (daysAgo <= 7) {
        timeSegment = 'from1to7d';
      }

      const isSoftDeleted = Boolean(
        u.banned_until ||
        u.app_metadata?.is_deleted ||
        (u.user_metadata as any)?.is_deleted ||
        profile.is_deleted
      );
      const deletedAt = u.app_metadata?.deleted_at || (u.user_metadata as any)?.deleted_at || null;

      return {
        id: u.id,
        email,
        domain,
        timeSegment,
        hoursAgo,
        daysAgo,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        provider: u.app_metadata?.provider || 'email',
        role: profile.role || (u.user_metadata as any)?.role || 'customer',
        firstName: profile.first_name || (u.user_metadata as any)?.first_name || '',
        lastName: profile.last_name || (u.user_metadata as any)?.last_name || '',
        phoneNumber: profile.phone_number || u.phone || '',
        avatarUrl: profile.avatar_url || '',
        isSoftDeleted,
        deletedAt
      };
    });

    // Sort newest first
    formattedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute segment breakdowns
    const domainCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    let under24hCount = 0;
    let from1to7dCount = 0;
    let over7dCount = 0;

    formattedUsers.forEach(u => {
      domainCounts[u.domain] = (domainCounts[u.domain] || 0) + 1;
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;

      if (u.timeSegment === 'under24h') under24hCount++;
      else if (u.timeSegment === 'from1to7d') from1to7dCount++;
      else over7dCount++;
    });

    const totalRegistered = allUsers.length;
    const totalUnconfirmed = formattedUsers.length;
    const unconfirmedPercentage = totalRegistered > 0
      ? Number(((totalUnconfirmed / totalRegistered) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalRegistered,
        totalUnconfirmed,
        unconfirmedPercentage,
        segments: {
          under24h: under24hCount,
          from1to7d: from1to7dCount,
          over7d: over7dCount,
          domains: domainCounts,
          roles: roleCounts
        }
      },
      users: formattedUsers
    });
  } catch (err: any) {
    console.error('[Auth:unconfirmed-users] Exception:', err);
    return res.status(500).json({ error: err.message || 'Failed to list unconfirmed users' });
  }
});

/**
 * Diagnostic action: Manually mark an unconfirmed user's email as confirmed
 */
router.post('/admin/confirm-user-email', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[Auth:confirm-user-email] Manually confirming email for user: ${userId}`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      console.error(`[Auth:confirm-user-email] Supabase error:`, error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `User email confirmed successfully.`,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      }
    });
  } catch (err: any) {
    console.error('[Auth:confirm-user-email] Exception:', err);
    return res.status(500).json({ error: err.message || 'Failed to confirm user email' });
  }
});

/**
 * Diagnostic action: Generate a direct action/verification link for manual delivery
 */
router.post('/admin/generate-verification-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://odamarket.co.ke/login?confirmed=true'
      }
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      actionLink: data?.properties?.action_link || null
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate link' });
  }
});

/**
 * Diagnostic action: Trigger re-dispatch of verification email to user
 */
router.post('/admin/resend-verification-email', async (req, res) => {
  try {
    const { email, firstName } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // Generate link first
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://odamarket.co.ke/login?confirmed=true'
      }
    });

    if (linkError) {
      return res.status(500).json({ error: linkError.message });
    }

    const actionLink = linkData?.properties?.action_link;

    // If Resend API Key is available, dispatch custom branded email directly
    let emailSent = false;
    if (process.env.RESEND_API_KEY && actionLink) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const displayName = firstName ? ` ${firstName}` : '';

        await resend.emails.send({
          from: 'ODA Market <noreply@odamarket.co.ke>',
          to: email,
          subject: 'Confirm Your ODA Market Account',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #FAF5EC; border-radius: 12px; border: 1px solid #E8DCC9;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #3A2418; font-size: 24px; margin: 0; font-weight: 700;">ODA MARKET</h1>
                <p style="color: #C65A28; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Account Verification</p>
              </div>
              <div style="background-color: #FFFFFF; padding: 24px; border-radius: 8px; border: 1px solid #E8DCC9;">
                <p style="color: #3A2418; font-size: 15px; line-height: 1.6; margin-top: 0;">
                  Hello${displayName},
                </p>
                <p style="color: #5F5A54; font-size: 14px; line-height: 1.6;">
                  We noticed your ODA Market registration email may not have reached your inbox. Click the button below to verify your account and complete your sign-in:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${actionLink}" style="display: inline-block; background-color: #C65A28; color: #FFFFFF; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(198, 90, 40, 0.2);">
                    Confirm My Account
                  </a>
                </div>
                <p style="color: #8B857D; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
                  If the button above does not work, copy and paste this link into your browser:<br/>
                  <a href="${actionLink}" style="color: #C65A28; word-break: break-all;">${actionLink}</a>
                </p>
              </div>
            </div>
          `
        });
        emailSent = true;
      } catch (sendErr) {
        console.error('[Auth:resend-verification-email] Resend error:', sendErr);
      }
    }

    return res.status(200).json({
      success: true,
      emailSent,
      actionLink,
      message: emailSent
        ? `Verification email successfully dispatched to ${email}.`
        : `Action link generated for ${email}.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to resend verification' });
  }
});

export default router;
