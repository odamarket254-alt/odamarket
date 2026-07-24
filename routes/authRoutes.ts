import express from 'express';
import crypto from 'crypto';
import { africastalking } from '../src/lib/africastalking.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase Admin client for updating user verification status
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder-service-key"
);

// In-memory fallback if DB fails (since table might not exist in all environments yet)
interface OtpData {
  otp_hash: string;
  expiresAt: number;
  attempts: number;
}
const fallbackOtpStore = new Map<string, OtpData>();

// Rate limits
const requestLimits = new Map<string, number>();

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

router.post('/check-user', async (req, res) => {
  try {
    const { email, phone } = req.body;
    let formattedPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Since we don't have direct access to auth.users without admin, we can check profiles.
    // If profiles exist, user exists.
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

    let formattedPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const now = Date.now();
    const lastRequest = requestLimits.get(formattedPhone);

    // Limit to 1 request per 60 seconds
    if (lastRequest && now - lastRequest < 60000) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = hashOtp(otp);
    const expires_at = now + 5 * 60 * 1000; // 5 mins

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin.from('phone_verifications').upsert({
      phone: formattedPhone,
      otp_hash,
      expires_at,
      attempts: 0,
      status: 'pending',
      updated_at: new Date().toISOString()
    });

    if (dbError) {
      console.warn('Supabase Error saving OTP, falling back to memory store:', dbError.message);
      fallbackOtpStore.set(formattedPhone, {
        otp_hash,
        expiresAt: expires_at,
        attempts: 0
      });
    }

    requestLimits.set(formattedPhone, now);

    const sms = africastalking.SMS;
    
    // Send SMS
    if (process.env.AFRICASTALKING_API_KEY) {
        await sms.send({
          to: [formattedPhone],
          message: `ODA Market Verification Code\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nDo not share this code with anyone.`,
          from: process.env.AFRICASTALKING_SENDER_ID || undefined
        });
    } else {
        // Log the OTP in development mode
        console.log(`\n[AFRICAS TALKING] 📱 To: ${formattedPhone} | OTP: ${otp}\n`);
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

    let formattedPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    let otpHashToCompare = null;
    let attempts = 0;
    let expiresAt = 0;

    const { data: record, error: fetchError } = await supabaseAdmin
      .from('phone_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!fetchError && record) {
      otpHashToCompare = record.otp_hash;
      attempts = record.attempts;
      expiresAt = record.expires_at;
    } else {
      const fb = fallbackOtpStore.get(formattedPhone);
      if (fb) {
        otpHashToCompare = fb.otp_hash;
        attempts = fb.attempts;
        expiresAt = fb.expiresAt;
      }
    }

    if (!otpHashToCompare) {
      return res.status(400).json({ error: 'No OTP requested for this number or it has expired.' });
    }

    if (Date.now() > expiresAt) {
      await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);
      fallbackOtpStore.delete(formattedPhone);
      return res.status(400).json({ error: 'Your verification code has expired. Please request a new code.' });
    }

    if (attempts >= 5) {
      await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);
      fallbackOtpStore.delete(formattedPhone);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    const inputHash = hashOtp(otp);
    if (otpHashToCompare !== inputHash) {
      await supabaseAdmin.from('phone_verifications').update({ attempts: attempts + 1 }).eq('phone', formattedPhone);
      if (fallbackOtpStore.has(formattedPhone)) {
        const fb = fallbackOtpStore.get(formattedPhone)!;
        fb.attempts += 1;
        fallbackOtpStore.set(formattedPhone, fb);
      }
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // OTP is valid
    await supabaseAdmin.from('phone_verifications').delete().eq('phone', formattedPhone);
    fallbackOtpStore.delete(formattedPhone);

    let finalUserId = userId;

    // If accountData is provided, create the user!
    if (accountData && !userId) {
      // Create user
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
      // Existing user (e.g. from checkout)
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
