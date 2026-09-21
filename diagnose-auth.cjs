#!/usr/bin/env node
/**
 * ODA MARKET - Supabase Auth & SMTP Diagnostic CLI
 * Tests whether 'Confirm email' is enabled and inspects SMTP configuration.
 */

const https = require('https');
const http = require('http');

async function runCLI() {
  console.log('\n================================================================');
  console.log('🔍 SUPABASE AUTH & SMTP CONFIGURATION DIAGNOSTIC');
  console.log('================================================================\n');

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  console.log('📋 Environment Configuration:');
  console.log('  • Supabase URL:', supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '...supabase.co' : '❌ NOT SET');
  console.log('  • Anon Key:', anonKey ? '✅ Present (' + anonKey.slice(0, 12) + '...)' : '❌ NOT SET');
  console.log('  • Service Role Key:', serviceKey ? '✅ Present (' + serviceKey.slice(0, 12) + '...)' : '❌ NOT SET');
  console.log('  • Resend API Key:', resendApiKey ? '✅ Present (' + resendApiKey.slice(0, 8) + '...)' : '⚠️  NOT SET (Server fallback unavailable)');
  console.log('');

  if (!supabaseUrl) {
    console.error('❌ FATAL: VITE_SUPABASE_URL is missing. Please configure it in your environment.');
    process.exit(1);
  }

  // 1. Check GoTrue /auth/v1/settings
  console.log('📡 Step 1: Querying Supabase GoTrue Auth Settings (/auth/v1/settings)...');
  try {
    const settingsUrl = new URL('/auth/v1/settings', supabaseUrl);
    const headers = {
      'apikey': serviceKey || anonKey,
      'User-Agent': 'OdaMarket-Diagnostic/1.0'
    };
    if (serviceKey) {
      headers['Authorization'] = `Bearer ${serviceKey}`;
    }

    const settingsData = await new Promise((resolve, reject) => {
      const req = https.get(settingsUrl, { headers }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('Invalid JSON response: ' + body));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      req.on('error', reject);
    });

    console.log('✅ Settings retrieved successfully.');
    console.log('');
    console.log('📊 Auth Configuration Analysis:');
    
    // Check Confirm Email
    // In GoTrue, mailer_autoconfirm = false means Email Confirmation IS REQUIRED / ENABLED!
    const confirmEmailEnabled = settingsData.mailer_autoconfirm === false;
    const emailProviderEnabled = Boolean(settingsData.external?.email);
    const signupsAllowed = settingsData.disable_signup === false;

    console.log(`  • Email Provider:             ${emailProviderEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  • Confirm Email Setting:       ${confirmEmailEnabled ? '✅ ENABLED (mailer_autoconfirm = false)' : '⚠️  DISABLED / AUTO-CONFIRM (mailer_autoconfirm = true)'}`);
    console.log(`  • User Signups Allowed:        ${signupsAllowed ? '✅ YES' : '❌ NO (disable_signup = true)'}`);
    console.log(`  • Phone Provider:              ${settingsData.external?.phone ? 'ENABLED' : 'DISABLED'}`);
    console.log(`  • Google OAuth:                ${settingsData.external?.google ? 'ENABLED' : 'DISABLED'}`);
    console.log('');

    // Diagnostics verdict for Confirm email
    if (!confirmEmailEnabled) {
      console.log('⚠️  ALERT: "Confirm email" is currently DISABLED in Supabase.');
      console.log('   Users are auto-confirmed immediately upon registration, so Supabase');
      console.log('   will NOT send a confirmation email link.');
      console.log('   👉 To enable: Supabase Dashboard > Authentication > Providers > Email');
      console.log('      Toggle "Confirm email" ON.\n');
    } else {
      console.log('✅ "Confirm email" IS ENABLED.');
      console.log('   Supabase is expected to dispatch confirmation emails upon registration.\n');
    }

    // 2. Step 2: Check SMTP Settings
    console.log('📡 Step 2: Checking SMTP & Email Delivery Pipeline...');
    console.log('  • Supabase Built-in Mailer Limit: ~3-4 emails/hour per project.');
    if (!resendApiKey) {
      console.log('  ⚠️  WARNING: No custom transactional email provider (RESEND_API_KEY) found in app.');
      console.log('     If you have NOT configured Custom SMTP in the Supabase Dashboard,');
      console.log('     Supabase will quickly hit rate-limits (HTTP 429: "Email rate limit exceeded")');
      console.log('     causing registration emails to silently fail to arrive.\n');
      console.log('  👉 Action Required in Supabase Dashboard:');
      console.log('     1. Open https://supabase.com/dashboard/project/_/settings/auth');
      console.log('     2. Scroll down to "SMTP Settings"');
      console.log('     3. Enable "Enable Custom SMTP"');
      console.log('     4. Fill in your SMTP provider details (e.g., Resend, SendGrid, Mailgun):');
      console.log('        - Host: smtp.resend.com');
      console.log('        - Port: 465 or 587');
      console.log('        - User: resend');
      console.log('        - Pass: <your_resend_api_key>');
      console.log('        - Sender Email: noreply@odamarket.co.ke');
      console.log('        - Sender Name: ODA Market\n');
    } else {
      console.log('  ✅ RESEND_API_KEY is configured in this environment.');
      console.log('     The server-side fallback is ready to bypass Supabase rate limits if needed.\n');
    }

    // 3. Step 3: Admin Link Generation Test
    if (serviceKey) {
      console.log('📡 Step 3: Testing Supabase GoTrue Admin Action Link Generation...');
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: 'odamarket254+diagnostic@gmail.com',
          password: 'TestPassword123!@#',
          options: {
            redirectTo: 'https://odamarket.co.ke/login?confirmed=true'
          }
        });

        if (linkError) {
          // If user already exists, try magiclink
          const { data: mData, error: mError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: 'odamarket254+diagnostic@gmail.com',
            options: {
              redirectTo: 'https://odamarket.co.ke/login?confirmed=true'
            }
          });
          if (mError) {
            console.log('  ❌ Action link generation failed:', mError.message);
          } else {
            console.log('  ✅ Action link generation SUCCESS: GoTrue email pipeline can generate valid verification tokens.');
          }
        } else {
          console.log('  ✅ Signup action link generation SUCCESS: GoTrue email pipeline can generate valid verification tokens.');
        }
      } catch (err) {
        console.log('  ⚠️  Admin test skipped or encountered error:', err.message);
      }
    }

    console.log('\n================================================================');
    console.log('🎯 SUMMARY & DIAGNOSIS:');
    console.log('================================================================');
    console.log(`• "Confirm email" status:    ${confirmEmailEnabled ? '✅ ENABLED (verification required)' : '⚠️  DISABLED'}`);
    console.log(`• Email signups enabled:     ${emailProviderEnabled && signupsAllowed ? '✅ YES' : '❌ NO'}`);
    console.log(`• SMTP Delivery status:      ${resendApiKey ? '✅ Resend Provider Configured' : '⚠️  Verify Custom SMTP in Supabase Dashboard'}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Failed to run diagnostic check:', err.message);
  }
}

runCLI();
