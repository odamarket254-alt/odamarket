import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { sendOTP, formatPhone } from '../src/lib/sms.js';
import { createClient } from '@supabase/supabase-js';

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

export default router;
