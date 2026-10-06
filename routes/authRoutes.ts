import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { sendOTP, formatPhone } from '../src/lib/sms.js';
import { createClient } from '@supabase/supabase-js';
import { runSupabaseAuthDiagnostics } from '../src/utils/supabaseAuthDiagnostics.js';
import {
  sendEmailVerificationEmail,
  sendWelcomeEmail,
  sendRegistrationEmail,
  ensureWelcomeSeriesAutomation,
  sendLoginOtpEmail,
  getCandidateResendApiKeys
} from '../emailService.js';

const router = express.Router();

function cleanEnvValue(val?: string): string {
  return (val || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

function resolveSupabaseUrl(fallbackUrl?: string): string {
  const candidates = [
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    fallbackUrl
  ];
  for (const c of candidates) {
    const cleaned = cleanEnvValue(c);
    if (cleaned && cleaned.startsWith('http') && !cleaned.includes('placeholder-project.supabase.co')) {
      return cleaned;
    }
  }
  return 'https://placeholder-project.supabase.co';
}

function getCandidateSupabaseKeys(clientAnonKey?: string): string[] {
  const rawCandidates = [
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_KEY,
    clientAnonKey
  ];
  const validKeys: string[] = [];
  for (const raw of rawCandidates) {
    const cleaned = cleanEnvValue(raw);
    if (
      cleaned &&
      cleaned.length > 20 &&
      !cleaned.includes('placeholder') &&
      !cleaned.startsWith('YOUR_') &&
      !validKeys.includes(cleaned)
    ) {
      validKeys.push(cleaned);
    }
  }
  return validKeys;
}

const supabaseAdmin = createClient(
  resolveSupabaseUrl(),
  cleanEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'placeholder-service-key'
  )
);

const supabaseAnon = createClient(
  resolveSupabaseUrl(),
  cleanEnvValue(
    process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'placeholder-anon-key'
  )
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

      // Trigger registration template email safely (never fails OTP verification if Resend fails)
      try {
        await sendRegistrationEmail({
          userId: finalUserId,
          email: accountData.email,
          firstName: accountData.first_name,
          lastName: accountData.last_name
        });
      } catch (regEmailErr) {
        console.warn('[Auth:verify-otp] Non-fatal registration email notice:', regEmailErr);
      }
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
    const { accountData, addressData, redirectTo } = req.body;
    if (!accountData?.email || !accountData?.password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = accountData.email.trim().toLowerCase();
    const formattedPhone = formatPhone(accountData.phone || '');

    // Check if phone is already registered by another profile
    if (formattedPhone) {
      const { data: byPhone } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('phone', formattedPhone)
        .maybeSingle();
      if (byPhone && (byPhone.email || '').toLowerCase() !== normalizedEmail) {
        return res.status(400).json({ error: 'Phone number is already registered by another account.' });
      }
    }

    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = redirectTo && typeof redirectTo === 'string' && redirectTo.startsWith('http')
      ? redirectTo
      : `${origin}/login?confirmed=true`;

    const firstName = (accountData.first_name || '').trim();
    const lastName = (accountData.last_name || '').trim();
    const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer';

    const userMetadata = {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: formattedPhone,
      phone_verified: false,
      role: 'customer',
      county: addressData?.county || '',
      town_city: addressData?.town || addressData?.town_city || '',
      street_building: addressData?.street || addressData?.street_building || '',
      estate: addressData?.estate || '',
      house_number: addressData?.house_number || '',
      apartment: addressData?.apartment || '',
      resend_confirmation_handled_by: 'register-complete'
    };

    let userId: string | null = null;
    let actionLink: string | null = null;

    // 1. Create the unconfirmed user AND generate the official Supabase signup verification link atomically
    //    via Admin generateLink(type: 'signup'). This NEVER triggers Supabase's default confirmation email!
    const { data: signupLinkData, error: signupLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password: accountData.password,
      options: {
        redirectTo: redirectUrl,
        data: userMetadata
      }
    });

    if (!signupLinkError && signupLinkData?.user) {
      userId = signupLinkData.user.id;
      actionLink = signupLinkData.properties?.action_link || null;
    } else {
      // Check if an unconfirmed user with this email already exists from a previous incomplete attempt
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = (listData?.users || []).find(
        (u: any) => (u.email || '').toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return res.status(400).json({ error: signupLinkError?.message || 'Failed to create account.' });
      }

      if (existingUser.email_confirmed_at) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }

      userId = existingUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: accountData.password,
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          ...userMetadata
        }
      });

      const { data: magicLinkData, error: magicLinkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo: redirectUrl
        }
      });
      if (!magicLinkErr && magicLinkData?.properties?.action_link) {
        actionLink = magicLinkData.properties.action_link;
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'Failed to create user in Supabase Auth.' });
    }

    // Ensure profile row has updated name & phone
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        phone: formattedPhone,
        role: 'customer'
      } as any, { onConflict: 'id' });
    } catch {
      // Non-fatal if trigger already populated profile
    }

    // 2. Save delivery address if provided
    if (addressData) {
      const phone = accountData.phone || formattedPhone || '';
      const county = addressData.county || '';
      const townCity = addressData.town || addressData.town_city || '';
      const areaLocation = addressData.estate || addressData.area_location || addressData.town || county || '';

      const streetParts = [
        addressData.street || addressData.street_building,
        addressData.apartment ? `Apt ${addressData.apartment}` : '',
        addressData.house_number ? `House ${addressData.house_number}` : '',
        addressData.formatted_address && !addressData.street ? addressData.formatted_address : ''
      ].filter(Boolean);

      const streetBuilding = streetParts.join(', ') || addressData.formatted_address || 'Delivery Address';

      await supabaseAdmin.from('delivery_addresses').delete().eq('user_id', userId);
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
        console.warn('[Auth:register-complete] Address insert notice:', addressError.message);
      }
    }

    // 3. Send ONLY the Resend Confirmation Email Template (never falls back to Supabase default mailer)
    const verificationUrl = actionLink || redirectUrl;
    const emailRes = await sendEmailVerificationEmail({
      email: normalizedEmail,
      confirmationUrl: verificationUrl,
      firstName,
      lastName,
      userId
    });

    if (!emailRes.success) {
      console.error('[Auth:register-complete] Resend confirmation template error:', emailRes.error);
    } else {
      console.log(`[Auth:register-complete] ✅ Sent Resend confirmation template (${emailRes.templateId}) to ${normalizedEmail} (ID: ${emailRes.resendId})`);
    }

    return res.status(200).json({
      success: true,
      userId,
      email: normalizedEmail,
      emailSent: emailRes.success,
      resendId: emailRes.resendId,
      templateId: emailRes.templateId
    });
  } catch (error: any) {
    console.error('Failed to complete registration:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create account.' });
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

/**
 * Server-side endpoint to send the existing Resend registration template (POST https://api.resend.com/emails)
 * after confirming the Supabase user was actually created.
 * Never exposes RESEND_API_KEY to the browser and never causes registration to fail if Resend errors.
 */
router.post('/send-registration-email', async (req, res) => {
  try {
    const { userId, email, name, firstName, lastName } = req.body || {};
    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'userId or email is required' });
    }

    const result = await sendRegistrationEmail({
      userId,
      email,
      name,
      firstName,
      lastName
    });

    return res.status(200).json({
      success: result.success,
      skipped: result.skipped,
      alreadySent: result.alreadySent,
      event: 'user.created',
      automation: 'Welcome series',
      resendId: result.resendId,
      templateId: result.templateId,
      recipient: result.recipient,
      error: result.error
    });
  } catch (err: any) {
    console.error('[Auth:send-registration-email] Safe error handler:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: err?.message || 'Failed to send registration email'
    });
  }
});

/**
 * Ensures the `user.created` event and `Welcome series` automation exist and are enabled in Resend.
 */
router.post('/setup-resend-automation', async (req, res) => {
  try {
    const { templateId } = req.body || {};
    const result = await ensureWelcomeSeriesAutomation(templateId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to configure Resend automation'
    });
  }
});

router.post('/resend-confirmation-email', async (req, res) => {
  try {
    const { email, redirectTo } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = redirectTo && typeof redirectTo === 'string' && redirectTo.startsWith('http')
      ? redirectTo
      : `${origin}/login?confirmed=true`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: redirectUrl
      }
    });

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink || linkError) {
      return res.status(400).json({ error: linkError?.message || 'Could not generate verification link for this email.' });
    }

    const emailRes = await sendEmailVerificationEmail({
      email: normalizedEmail,
      confirmationUrl: actionLink,
      forceResend: true
    });

    if (!emailRes.success) {
      return res.status(500).json({ error: emailRes.error || 'Failed to send confirmation email via Resend.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent.',
      resendId: emailRes.resendId,
      templateId: emailRes.templateId
    });
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
 * Endpoint for authenticated buyers to safely deactivate/delete their own account
 */
router.post('/delete-own-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    const targetUserId = user.id;
    const nowIso = new Date().toISOString();

    console.log(`[Auth:self-delete] Buyer ${targetUserId} requested account deactivation.`);

    // 1. Update user auth metadata
    const updatedUserMetadata = {
      ...(user.user_metadata || {}),
      is_deleted: true,
      deleted_at: nowIso,
      status: 'deactivated'
    };

    await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      ban_duration: '876600h',
      user_metadata: updatedUserMetadata
    });

    // 2. Mark profile as deleted
    try {
      await supabaseAdmin.from('profiles').update({
        is_deleted: true,
        deleted_at: nowIso,
        updated_at: nowIso
      } as any).eq('id', targetUserId);
    } catch (profileErr) {
      console.warn('[Auth:self-delete] Could not update profiles table soft-delete:', profileErr);
    }

    // 3. Sign out sessions
    try {
      await supabaseAdmin.auth.admin.signOut(targetUserId);
    } catch (soErr) {
      console.warn('[Auth:self-delete] signOut warning:', soErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Your ODA Market account has been safely deactivated.'
    });
  } catch (err: any) {
    console.error('[Auth:self-delete] Error deactivating account:', err);
    return res.status(500).json({ error: err.message || 'Failed to deactivate account.' });
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
          from: 'Team ODA Market <team@odamarket.co.ke>',
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

    // If Resend API Key is available, dispatch existing Resend Email Verification template
    let emailSent = false;
    if (process.env.RESEND_API_KEY && actionLink) {
      try {
        const verifyRes = await sendEmailVerificationEmail({
          email,
          confirmationUrl: actionLink,
          firstName,
          forceResend: true
        });
        emailSent = verifyRes.success;
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

// ============================================================================
// TWO-STEP EMAIL + PASSWORD + RESEND 6-DIGIT OTP LOGIN FLOW
// ============================================================================

interface LoginOtpChallengeRecord {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  otp_hash: string;
  challenge_token_hash: string;
  encrypted_session: string;
  expires_at: string;
  resend_available_at: string;
  attempts: number;
  max_attempts: number;
  verified_at: string | null;
  invalidated_at: string | null;
  created_at: string;
}

const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const LOGIN_OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const LOGIN_OTP_MAX_ATTEMPTS = 5;

function getOtpServerSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    'oda-market-login-otp-secret-key-2026'
  ).trim();
}

function generateSecureLoginOtp(): string {
  // Cryptographically secure 6-digit integer in [100000, 999999]
  return crypto.randomInt(100000, 1000000).toString();
}

function hashLoginOtp(challengeId: string, otp: string): string {
  return crypto
    .createHmac('sha256', getOtpServerSecret())
    .update(`${challengeId}:${otp.trim()}`)
    .digest('hex');
}

function hashChallengeToken(token: string): string {
  return crypto
    .createHmac('sha256', getOtpServerSecret())
    .update(`token:${token.trim()}`)
    .digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function encryptPendingSession(
  sessionPayload: { access_token: string; refresh_token: string },
  challengeToken: string
): string {
  const key = crypto.scryptSync(getOtpServerSecret(), `session:${challengeToken}`, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(sessionPayload);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
}

function decryptPendingSession(
  encryptedPayload: string,
  challengeToken: string
): { access_token: string; refresh_token: string } | null {
  try {
    const parts = (encryptedPayload || '').split('.');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, cipherHex] = parts;
    const key = crypto.scryptSync(getOtpServerSecret(), `session:${challengeToken}`, 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(cipherHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted);
    if (parsed?.access_token && parsed?.refresh_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token
      };
    }
    return null;
  } catch (err) {
    console.error('[LoginOTP] Failed to decrypt pending session:', err);
    return null;
  }
}

function maskEmailAddress(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return clean;
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

const LOGIN_OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_OTP_MAX_REQUESTS_PER_WINDOW = 6; // max 6 OTP challenges/resends per 15 min per user
const loginOtpRequestHistory = new Map<string, number[]>();
const memoryOtpChallenges = new Map<string, LoginOtpChallengeRecord>();

function checkAndRecordOtpRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const cutoff = now - LOGIN_OTP_WINDOW_MS;
  const timestamps = (loginOtpRequestHistory.get(key) || []).filter((ts) => ts > cutoff);
  if (timestamps.length >= LOGIN_OTP_MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + LOGIN_OTP_WINDOW_MS - now) / 1000));
    loginOtpRequestHistory.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }
  timestamps.push(now);
  loginOtpRequestHistory.set(key, timestamps);
  return { allowed: true };
}

async function saveLoginOtpChallenge(record: LoginOtpChallengeRecord): Promise<void> {
  // 0. Invalidate previous in-memory challenges for this user and store new record
  for (const [cid, existing] of memoryOtpChallenges.entries()) {
    if (existing.user_id === record.user_id && cid !== record.id && !existing.verified_at && !existing.invalidated_at) {
      memoryOtpChallenges.set(cid, {
        ...existing,
        invalidated_at: new Date().toISOString(),
        encrypted_session: ''
      });
    }
  }
  memoryOtpChallenges.set(record.id, { ...record });

  // 1. Try primary dedicated table `public.login_otp_challenges`
  try {
    await supabaseAdmin
      .from('login_otp_challenges')
      .update({ invalidated_at: new Date().toISOString() })
      .eq('user_id', record.user_id)
      .is('verified_at', null)
      .is('invalidated_at', null);

    await supabaseAdmin.from('login_otp_challenges').insert({
      id: record.id,
      user_id: record.user_id,
      email: record.email,
      otp_hash: record.otp_hash,
      challenge_token_hash: record.challenge_token_hash,
      encrypted_session: record.encrypted_session,
      expires_at: record.expires_at,
      resend_available_at: record.resend_available_at,
      attempts: record.attempts,
      max_attempts: record.max_attempts,
      verified_at: record.verified_at,
      invalidated_at: record.invalidated_at,
      created_at: record.created_at
    });
  } catch {
    // Fallback handled below
  }

  // 2. Also persist in `public.phone_verifications` (which has service_role-only RLS in Supabase)
  //    Invalidate any previous active challenge for this user first
  try {
    const { data: prevUserRow } = await supabaseAdmin
      .from('phone_verifications')
      .select('otp_hash')
      .eq('phone', `login_otp_user:${record.user_id}`)
      .maybeSingle();

    if (prevUserRow?.otp_hash && prevUserRow.otp_hash !== record.id) {
      await supabaseAdmin
        .from('phone_verifications')
        .delete()
        .eq('phone', `login_otp:${prevUserRow.otp_hash}`);
    }

    await supabaseAdmin.from('phone_verifications').upsert(
      {
        phone: `login_otp_user:${record.user_id}`,
        otp_hash: record.id,
        expires_at: new Date(record.expires_at).getTime(),
        attempts: 0,
        status: 'active_challenge_pointer',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'phone' }
    );

    await supabaseAdmin.from('phone_verifications').upsert(
      {
        phone: `login_otp:${record.id}`,
        otp_hash: record.otp_hash,
        expires_at: new Date(record.expires_at).getTime(),
        attempts: record.attempts,
        status: JSON.stringify(record),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'phone' }
    );
  } catch (err) {
    console.warn('[LoginOTP] phone_verifications mirror notice:', err);
  }

  // 3. Store only non-sensitive verification state metadata on auth.users.app_metadata
  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(record.user_id);
    const existingAppMeta = userData?.user?.app_metadata || {};
    const { login_otp_challenge: _legacy, ...cleanAppMeta } = existingAppMeta;
    await supabaseAdmin.auth.admin.updateUserById(record.user_id, {
      app_metadata: {
        ...cleanAppMeta,
        login_otp_challenge_id: record.id,
        login_otp_pending: true,
        login_otp_verified_at: null
      }
    });
  } catch (err) {
    console.warn('[LoginOTP] app_metadata update notice:', err);
  }
}

async function loadLoginOtpChallenge(
  challengeId: string,
  _userId?: string
): Promise<LoginOtpChallengeRecord | null> {
  // 1. Try `public.login_otp_challenges` first
  try {
    const { data, error } = await supabaseAdmin
      .from('login_otp_challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        email: data.email,
        otp_hash: data.otp_hash,
        challenge_token_hash: data.challenge_token_hash,
        encrypted_session: data.encrypted_session,
        expires_at: data.expires_at,
        resend_available_at: data.resend_available_at,
        attempts: Number(data.attempts || 0),
        max_attempts: Number(data.max_attempts || LOGIN_OTP_MAX_ATTEMPTS),
        verified_at: data.verified_at || null,
        invalidated_at: data.invalidated_at || null,
        created_at: data.created_at
      };
    }
  } catch {
    // Fallback to phone_verifications
  }

  // 2. Fallback to `public.phone_verifications` (service_role-only RLS table)
  try {
    const { data: pvData, error: pvErr } = await supabaseAdmin
      .from('phone_verifications')
      .select('*')
      .eq('phone', `login_otp:${challengeId}`)
      .maybeSingle();

    if (!pvErr && pvData?.status) {
      const parsed = JSON.parse(pvData.status) as LoginOtpChallengeRecord;
      if (parsed && parsed.id === challengeId) {
        memoryOtpChallenges.set(challengeId, { ...parsed });
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }

  // 3. Fallback to in-memory cache
  const mem = memoryOtpChallenges.get(challengeId);
  if (mem) {
    return { ...mem };
  }

  return null;
}

async function updateLoginOtpChallengeState(
  record: LoginOtpChallengeRecord
): Promise<void> {
  memoryOtpChallenges.set(record.id, { ...record });

  try {
    await supabaseAdmin
      .from('login_otp_challenges')
      .update({
        otp_hash: record.otp_hash,
        encrypted_session: record.encrypted_session,
        expires_at: record.expires_at,
        resend_available_at: record.resend_available_at,
        attempts: record.attempts,
        verified_at: record.verified_at,
        invalidated_at: record.invalidated_at
      })
      .eq('id', record.id);
  } catch {
    // Ignore if table not created yet
  }

  try {
    await supabaseAdmin.from('phone_verifications').upsert(
      {
        phone: `login_otp:${record.id}`,
        otp_hash: record.otp_hash,
        expires_at: new Date(record.expires_at).getTime(),
        attempts: record.attempts,
        status: JSON.stringify(record),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'phone' }
    );

    if (record.verified_at || record.invalidated_at) {
      await supabaseAdmin
        .from('phone_verifications')
        .delete()
        .eq('phone', `login_otp_user:${record.user_id}`);
    }
  } catch (err) {
    console.warn('[LoginOTP] phone_verifications update notice:', err);
  }

  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(record.user_id);
    const existingAppMeta = userData?.user?.app_metadata || {};
    const { login_otp_challenge: _legacy, ...cleanAppMeta } = existingAppMeta;
    await supabaseAdmin.auth.admin.updateUserById(record.user_id, {
      app_metadata: {
        ...cleanAppMeta,
        login_otp_challenge_id: record.id,
        login_otp_pending: !record.verified_at && !record.invalidated_at,
        login_otp_verified_at: record.verified_at
      }
    });
  } catch (err) {
    console.warn('[LoginOTP] app_metadata update notice:', err);
  }
}

/**
 * STEP 1 OF LOGIN:
 * Verifies email/phone + password against Supabase Auth on the server without exposing
 * session tokens to the browser. Generates a 6-digit OTP and sends it via Resend.
 */
router.post('/login-initiate', async (req, res) => {
  try {
    const { emailOrPhone, email: rawEmail, password } = req.body || {};
    const identifier = String(emailOrPhone || rawEmail || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let email: string | undefined;
    let phone: string | undefined;

    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
    } else {
      let formattedPhone = identifier.replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      phone = formattedPhone;
    }

    // Create an ephemeral non-persisting Supabase client and try all candidate keys if one is misconfigured
    const clientSupabaseUrl = cleanEnvValue(req.body?.supabaseUrl || (req.headers['x-supabase-url'] as string));
    const clientSupabaseAnonKey = cleanEnvValue(req.body?.supabaseAnonKey || (req.headers['x-supabase-anon-key'] as string));
    const resolvedUrl = resolveSupabaseUrl(clientSupabaseUrl);
    const candidateKeys = getCandidateSupabaseKeys(clientSupabaseAnonKey);

    if (resolvedUrl.includes('placeholder-project.supabase.co') || candidateKeys.length === 0) {
      return res.status(500).json({
        error: 'Supabase URL or API key is missing in server environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY).'
      });
    }

    const authCredentials = email
      ? { email, password: String(password) }
      : { phone: phone!, password: String(password) };

    let authData: any = null;
    let authError: any = null;

    for (const apiKey of candidateKeys) {
      const ephemeralSupabase = createClient(resolvedUrl, apiKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const attempt = await ephemeralSupabase.auth.signInWithPassword(authCredentials);
      authData = attempt.data;
      authError = attempt.error;

      const errMsg = String(authError?.message || '').toLowerCase();
      if (!authError || (!errMsg.includes('invalid api key') && !errMsg.includes('apikey') && !errMsg.includes('jwt'))) {
        break;
      }
      console.warn('[Auth:login-initiate] Candidate Supabase API key rejected with Invalid API key, trying next fallback key...');
    }

    if (authError || !authData?.user || !authData?.session) {
      const msg = authError?.message || 'Invalid login credentials.';
      if (msg.includes('Email not confirmed')) {
        return res.status(401).json({
          error: 'Please confirm your email before signing in. Check your inbox for the confirmation link.'
        });
      }
      if (msg.toLowerCase().includes('invalid api key')) {
        return res.status(500).json({
          error: 'Supabase returned "Invalid API key". Please verify VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in your production environment variables.'
        });
      }
      return res.status(401).json({ error: msg });
    }

    const authenticatedUser = authData.user;

    // Check if soft-deleted or banned
    if (authenticatedUser.app_metadata?.is_deleted || authenticatedUser.user_metadata?.is_deleted) {
      return res.status(403).json({
        error: 'This account has been deactivated. Please contact ODA Market support.'
      });
    }

    // Look up user profile for email / first_name
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, role, verified')
      .eq('id', authenticatedUser.id)
      .maybeSingle();

    const targetEmail = (
      authenticatedUser.email ||
      profileData?.email ||
      email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({
        error: 'No registered email address is associated with this account to receive a verification code.'
      });
    }

    const rateCheck = checkAndRecordOtpRateLimit(`user:${authenticatedUser.id}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many login verification requests. Please wait ${Math.ceil((rateCheck.retryAfterSeconds || 60) / 60)} minute(s) before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds
      });
    }

    const firstName =
      profileData?.first_name ||
      authenticatedUser.user_metadata?.first_name ||
      authenticatedUser.user_metadata?.full_name?.split(' ')[0] ||
      '';

    // Generate cryptographically secure 6-digit OTP and challenge credentials
    const challengeId = crypto.randomUUID();
    const challengeToken = crypto.randomBytes(32).toString('hex');
    const otp = generateSecureLoginOtp();
    const otpHash = hashLoginOtp(challengeId, otp);
    const challengeTokenHash = hashChallengeToken(challengeToken);
    const encryptedSession = encryptPendingSession(
      {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      },
      challengeToken
    );

    const nowMs = Date.now();
    const expiresAtIso = new Date(nowMs + LOGIN_OTP_EXPIRY_MS).toISOString();
    const resendAvailableAtIso = new Date(nowMs + LOGIN_OTP_RESEND_COOLDOWN_MS).toISOString();

    const challengeRecord: LoginOtpChallengeRecord = {
      id: challengeId,
      user_id: authenticatedUser.id,
      email: targetEmail,
      first_name: firstName,
      otp_hash: otpHash,
      challenge_token_hash: challengeTokenHash,
      encrypted_session: encryptedSession,
      expires_at: expiresAtIso,
      resend_available_at: resendAvailableAtIso,
      attempts: 0,
      max_attempts: LOGIN_OTP_MAX_ATTEMPTS,
      verified_at: null,
      invalidated_at: null,
      created_at: new Date(nowMs).toISOString()
    };

    await saveLoginOtpChallenge(challengeRecord);

    // Send 6-digit OTP via Resend
    const emailResult = await sendLoginOtpEmail({
      email: targetEmail,
      otp,
      firstName,
      challengeId
    });

    if (!emailResult.success) {
      challengeRecord.invalidated_at = new Date().toISOString();
      challengeRecord.encrypted_session = '';
      await updateLoginOtpChallengeState(challengeRecord);
      const rawErr = String(emailResult.error || '');
      const friendlyErr = rawErr.toLowerCase().includes('api key is invalid') || rawErr.toLowerCase().includes('invalid_api_key')
        ? 'Resend returned "API key is invalid". Please update RESEND_API_KEY in your production environment variables with a valid Full Access key (starts with re_).'
        : rawErr || 'Failed to send verification code email. Please try again.';
      return res.status(500).json({
        error: friendlyErr
      });
    }

    return res.status(200).json({
      success: true,
      otpRequired: true,
      challengeId,
      challengeToken,
      userId: authenticatedUser.id,
      email: targetEmail,
      maskedEmail: maskEmailAddress(targetEmail),
      expiresAt: expiresAtIso,
      expiresInSeconds: Math.floor(LOGIN_OTP_EXPIRY_MS / 1000),
      resendCooldownSeconds: Math.floor(LOGIN_OTP_RESEND_COOLDOWN_MS / 1000),
      resendId: emailResult.resendId
    });
  } catch (err: any) {
    console.error('[Auth:login-initiate] Unexpected error:', err);
    return res.status(500).json({
      error: err?.message || 'An error occurred while initiating sign in.'
    });
  }
});

/**
 * STEP 2 OF LOGIN:
 * Verifies the 6-digit OTP server-side. Only when valid, unexpired, and unverified
 * does the backend release the Supabase session tokens to complete login.
 */
router.post('/login-verify-otp', async (req, res) => {
  try {
    const { challengeId, challengeToken, userId, otp } = req.body || {};
    const cleanOtp = String(otp || '').trim().replace(/\s+/g, '');

    if (!challengeId || !challengeToken || !cleanOtp) {
      return res.status(400).json({ error: 'Verification code and challenge credentials are required.' });
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
    }

    const record = await loadLoginOtpChallenge(String(challengeId), userId ? String(userId) : undefined);
    if (!record) {
      return res.status(400).json({
        error: 'Login verification session not found or has expired. Please sign in again.',
        expired: true
      });
    }

    if (record.verified_at) {
      return res.status(400).json({
        error: 'This verification code has already been used. Please sign in again.',
        expired: true
      });
    }

    if (record.invalidated_at) {
      return res.status(400).json({
        error: 'This verification code is no longer valid. Please request a new code.',
        expired: true
      });
    }

    const incomingTokenHash = hashChallengeToken(String(challengeToken));
    if (!timingSafeHexEqual(incomingTokenHash, record.challenge_token_hash)) {
      return res.status(403).json({
        error: 'Invalid verification session token. Please sign in again.'
      });
    }

    if (Date.now() > new Date(record.expires_at).getTime()) {
      record.invalidated_at = new Date().toISOString();
      record.encrypted_session = '';
      await updateLoginOtpChallengeState(record);
      return res.status(400).json({
        error: 'Your verification code has expired. Please request a new code or sign in again.',
        expired: true
      });
    }

    if (record.attempts >= record.max_attempts) {
      record.invalidated_at = new Date().toISOString();
      record.encrypted_session = '';
      await updateLoginOtpChallengeState(record);
      return res.status(429).json({
        error: 'Too many failed verification attempts. Please sign in again to receive a new code.',
        locked: true
      });
    }

    const expectedOtpHash = hashLoginOtp(record.id, cleanOtp);
    if (!timingSafeHexEqual(expectedOtpHash, record.otp_hash)) {
      record.attempts += 1;
      const isNowLocked = record.attempts >= record.max_attempts;
      if (isNowLocked) {
        record.invalidated_at = new Date().toISOString();
        record.encrypted_session = '';
      }
      await updateLoginOtpChallengeState(record);

      const remaining = Math.max(0, record.max_attempts - record.attempts);
      return res.status(isNowLocked ? 429 : 400).json({
        error: isNowLocked
          ? 'Too many incorrect attempts. This code has been invalidated. Please sign in again.'
          : `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
        locked: isNowLocked
      });
    }

    // OTP is valid! Decrypt the pending Supabase session before wiping it
    const sessionTokens = decryptPendingSession(record.encrypted_session, String(challengeToken));
    if (!sessionTokens) {
      return res.status(400).json({
        error: 'Could not restore authentication session. Please sign in again.',
        expired: true
      });
    }

    // Mark challenge verified and clear encrypted_session so it can never be replayed
    record.verified_at = new Date().toISOString();
    record.encrypted_session = '';
    await updateLoginOtpChallengeState(record);

    // Fetch user & profile details for immediate client hydration
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(record.user_id);
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', record.user_id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      verified: true,
      session: sessionTokens,
      user: userData?.user || null,
      profile: profileData || null
    });
  } catch (err: any) {
    console.error('[Auth:login-verify-otp] Unexpected error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to verify login code.'
    });
  }
});

/**
 * RESEND LOGIN OTP:
 * Invalidates the previous OTP and sends a brand-new 6-digit OTP via Resend
 * while enforcing the 60-second resend cooldown.
 */
router.post('/login-resend-otp', async (req, res) => {
  try {
    const { challengeId, challengeToken, userId } = req.body || {};

    if (!challengeId || !challengeToken) {
      return res.status(400).json({ error: 'Challenge credentials are required to resend code.' });
    }

    const record = await loadLoginOtpChallenge(String(challengeId), userId ? String(userId) : undefined);
    if (!record) {
      return res.status(400).json({
        error: 'Login session not found. Please sign in again.',
        expired: true
      });
    }

    if (record.verified_at) {
      return res.status(400).json({
        error: 'This login session is already verified.',
        expired: true
      });
    }

    const incomingTokenHash = hashChallengeToken(String(challengeToken));
    if (!timingSafeHexEqual(incomingTokenHash, record.challenge_token_hash)) {
      return res.status(403).json({
        error: 'Invalid verification session token. Please sign in again.'
      });
    }

    if (!record.encrypted_session) {
      return res.status(400).json({
        error: 'Your login session has expired or was locked. Please sign in again with your password.',
        expired: true
      });
    }

    const nowMs = Date.now();
    const resendAvailableMs = new Date(record.resend_available_at).getTime();
    if (nowMs < resendAvailableMs) {
      const waitSeconds = Math.ceil((resendAvailableMs - nowMs) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
        retryAfterSeconds: waitSeconds
      });
    }

    const rateCheck = checkAndRecordOtpRateLimit(`user:${record.user_id}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many verification code requests. Please wait ${Math.ceil((rateCheck.retryAfterSeconds || 60) / 60)} minute(s) before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds
      });
    }

    // Generate a new OTP, reset attempts, and extend expiration by 10 minutes
    const newOtp = generateSecureLoginOtp();
    const newOtpHash = hashLoginOtp(record.id, newOtp);
    const newExpiresAtIso = new Date(nowMs + LOGIN_OTP_EXPIRY_MS).toISOString();
    const newResendAvailableAtIso = new Date(nowMs + LOGIN_OTP_RESEND_COOLDOWN_MS).toISOString();

    record.otp_hash = newOtpHash;
    record.attempts = 0;
    record.invalidated_at = null;
    record.expires_at = newExpiresAtIso;
    record.resend_available_at = newResendAvailableAtIso;

    await updateLoginOtpChallengeState(record);

    const emailResult = await sendLoginOtpEmail({
      email: record.email,
      otp: newOtp,
      firstName: record.first_name,
      challengeId: `${record.id}-r-${nowMs}`
    });

    if (!emailResult.success) {
      return res.status(500).json({
        error: emailResult.error || 'Failed to resend verification code. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      challengeId: record.id,
      maskedEmail: maskEmailAddress(record.email),
      expiresAt: newExpiresAtIso,
      expiresInSeconds: Math.floor(LOGIN_OTP_EXPIRY_MS / 1000),
      resendCooldownSeconds: Math.floor(LOGIN_OTP_RESEND_COOLDOWN_MS / 1000),
      resendId: emailResult.resendId,
      message: 'A new 6-digit verification code has been sent to your email.'
    });
  } catch (err: any) {
    console.error('[Auth:login-resend-otp] Unexpected error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to resend verification code.'
    });
  }
});

/**
 * CANCEL / INVALIDATE PENDING LOGIN OTP CHALLENGE
 */
router.post('/login-cancel-otp', async (req, res) => {
  try {
    const { challengeId, challengeToken, userId } = req.body || {};
    if (!challengeId || !challengeToken) {
      return res.status(200).json({ success: true });
    }
    const record = await loadLoginOtpChallenge(String(challengeId), userId ? String(userId) : undefined);
    if (record && !record.verified_at && !record.invalidated_at) {
      const incomingTokenHash = hashChallengeToken(String(challengeToken));
      if (timingSafeHexEqual(incomingTokenHash, record.challenge_token_hash)) {
        record.invalidated_at = new Date().toISOString();
        record.encrypted_session = '';
        await updateLoginOtpChallengeState(record);
      }
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(200).json({ success: true });
  }
});

/**
 * PRODUCTION DIAGNOSTICS FOR 2-STEP LOGIN OTP
 * Safe GET endpoint (/api/auth/otp-diagnostics) to verify Supabase & Resend API keys in production.
 */
router.get('/otp-diagnostics', async (_req, res) => {
  const url = resolveSupabaseUrl();
  const supabaseKeys = getCandidateSupabaseKeys();
  const resendKeys = getCandidateResendApiKeys();

  const diagnostics: Record<string, any> = {
    supabaseUrlConfigured: !url.includes('placeholder-project.supabase.co'),
    supabaseUrlHost: url.replace(/^https?:\/\//, ''),
    supabaseCandidateKeysCount: supabaseKeys.length,
    envVarsPresent: {
      VITE_SUPABASE_URL: Boolean(cleanEnvValue(process.env.VITE_SUPABASE_URL)),
      SUPABASE_URL: Boolean(cleanEnvValue(process.env.SUPABASE_URL)),
      VITE_SUPABASE_ANON_KEY: Boolean(cleanEnvValue(process.env.VITE_SUPABASE_ANON_KEY)),
      SUPABASE_ANON_KEY: Boolean(cleanEnvValue(process.env.SUPABASE_ANON_KEY)),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)),
      RESEND_API_KEY: Boolean(cleanEnvValue(process.env.RESEND_API_KEY))
    },
    resendCandidateKeysCount: resendKeys.length,
    resendKeyPrefixes: resendKeys.map((k) => `${k.slice(0, 7)}...`)
  };

  return res.status(200).json(diagnostics);
});

export default router;
