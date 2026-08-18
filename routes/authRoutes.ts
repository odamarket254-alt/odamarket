import express from 'express';
import crypto from 'crypto';
import { sendOTP, formatPhone } from '../src/lib/sms.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
  (process.env.SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^["']|["']$/g, ''),
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
      return res.status(500).json({ error: 'Failed to send OTP via SMS. Please try again.' });
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
      return res.status(500).json({ error: 'Failed to send OTP via SMS. Please try again.' });
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

export default router;
