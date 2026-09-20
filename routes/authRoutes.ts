import express from 'express';
import crypto from 'crypto';
import { sendOTP, formatPhone } from '../src/lib/sms.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^["']|["']$/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key").trim().replace(/^["']|["']$/g, '')
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


function getConfirmationEmailHtml(firstName: string, actionLink: string) {
  const name = firstName ? firstName.trim() : 'there';
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your ODA Market Account</title>
      </head>
      <body style="margin:0;padding:0;background-color:#F8F3EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8F3EB;padding:40px 15px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #E8DCC9;">
                <tr>
                  <td style="height:6px;background:linear-gradient(90deg, #D96A27, #f49c64);"></td>
                </tr>
                <tr>
                  <td style="padding:36px 36px 20px 36px;text-align:center;">
                    <h1 style="margin:0 0 6px 0;color:#D96A27;font-size:28px;font-weight:800;letter-spacing:-0.5px;">ODA MARKET</h1>
                    <p style="margin:0;color:#8C7E72;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Fresh Groceries Delivered</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 36px 36px 36px;">
                    <div style="background-color:#FFFDF8;border:1px solid #E8DCC9;border-radius:14px;padding:24px;margin-bottom:28px;">
                      <h2 style="margin:0 0 12px 0;color:#1A1A1A;font-size:20px;font-weight:700;">Confirm your email address</h2>
                      <p style="margin:0 0 12px 0;color:#4B5563;font-size:15px;line-height:1.6;">
                        Hi <strong>${name}</strong>,
                      </p>
                      <p style="margin:0;color:#4B5563;font-size:15px;line-height:1.6;">
                        Thank you for registering with ODA Market! Please confirm your email address by clicking the button below to activate your account and start shopping for fresh groceries and household essentials.
                      </p>
                    </div>

                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${actionLink}" style="display:inline-block;background-color:#D96A27;color:#ffffff;padding:15px 36px;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 14px rgba(217,106,39,0.35);">
                        Confirm Email Address
                      </a>
                    </div>

                    <p style="margin:0 0 8px 0;color:#6B7280;font-size:13px;line-height:1.5;">
                      If the button above does not work, copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 24px 0;font-size:12px;color:#D96A27;word-break:break-all;line-height:1.4;">
                      <a href="${actionLink}" style="color:#D96A27;text-decoration:underline;">${actionLink}</a>
                    </p>

                    <div style="border-top:1px solid #F0E6D8;padding-top:20px;">
                      <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                        This verification link will expire in 24 hours. If you did not sign up for an ODA Market account, you can safely ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#FAF5EC;padding:20px 36px;text-align:center;border-top:1px solid #E8DCC9;">
                    <p style="margin:0;color:#8C7E72;font-size:12px;font-weight:500;">
                      © 2026 ODA Market. All rights reserved. Nairobi, Kenya.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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
      const { error: addressError } = await supabaseAdmin.from('delivery_addresses').insert({
        user_id: userId,
        phone_number: accountData.phone,
        street_address: addressData.street || addressData.formatted_address || "",
        apartment_suite: addressData.apartment || addressData.house_number || "",
        city: addressData.town || "",
        county: addressData.county,
        postal_code: "",
        is_default: true,
      });
      if (addressError) {
        console.error("Failed to save address:", addressError);
      }
    }

    // Generate link for email confirmation and send via Resend
    const origin = req.headers.origin || process.env.APP_URL || 'https://odamarket.co.ke';
    const redirectUrl = `${origin}/login?confirmed=true`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: accountData.email,
      password: accountData.password,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error("Supabase generateLink error:", linkError);
    }

    const actionLink = linkData?.properties?.action_link;

    if (actionLink && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailRes = await resend.emails.send({
          from: 'ODA Market <noreply@odamarket.co.ke>', 
          to: accountData.email,
          subject: 'Confirm your ODA Market account',
          html: getConfirmationEmailHtml(accountData.first_name, actionLink)
        });
        console.log(`Confirmation email sent successfully to ${accountData.email}, id: ${emailRes?.data?.id}`);
      } catch (e) {
        console.error("Resend confirmation email error:", e);
      }
    } else if (!actionLink) {
      console.warn("Could not generate action_link for user confirmation email.");
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

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error('Failed to generate resend link:', linkError);
      return res.status(400).json({ error: 'Could not generate confirmation link. Please verify your email.' });
    }

    const actionLink = linkData?.properties?.action_link;
    if (actionLink && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'ODA Market <noreply@odamarket.co.ke>',
        to: email,
        subject: 'Confirm your ODA Market account',
        html: getConfirmationEmailHtml('there', actionLink)
      });
      console.log(`Resend confirmation email dispatched to ${email}`);
    }

    return res.status(200).json({ success: true, message: 'Confirmation email sent.' });
  } catch (error) {
    console.error('Failed to resend confirmation email:', error);
    res.status(500).json({ error: 'Failed to resend confirmation email.' });
  }
});

export default router;
