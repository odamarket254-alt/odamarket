/**
 * Supabase Auth & SMTP Diagnostic Utility
 * Checks whether 'Confirm email' is enabled, inspects GoTrue configuration,
 * evaluates SMTP delivery status, and tests email dispatch pipelines.
 */

export interface AuthDiagnosticResult {
  timestamp: string;
  supabaseUrl: string;
  confirmEmailEnabled: boolean;
  emailProviderEnabled: boolean;
  signupsAllowed: boolean;
  rawSettings: {
    mailer_autoconfirm?: boolean;
    phone_autoconfirm?: boolean;
    disable_signup?: boolean;
    external?: Record<string, boolean>;
    sms_provider?: string;
  };
  smtpStatus: {
    isCustomSmtpLikelyConfigured: boolean;
    builtInMailerWarning: boolean;
    resendFallbackAvailable: boolean;
    recommendation: string;
  };
  adminLinkGenerationTest: {
    success: boolean;
    message: string;
    actionLinkGenerated?: boolean;
  };
  summary: {
    status: 'healthy' | 'warning' | 'critical';
    primaryIssues: string[];
    actionItems: string[];
  };
}

/**
 * Executes comprehensive diagnostics against Supabase Auth configuration & SMTP setup
 */
export async function runSupabaseAuthDiagnostics(options?: {
  supabaseUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  resendApiKey?: string;
}): Promise<AuthDiagnosticResult> {
  const url = (options?.supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const anonKey = (options?.anonKey || process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  const serviceKey = (options?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
  const resendKey = (options?.resendApiKey || process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  const result: AuthDiagnosticResult = {
    timestamp: new Date().toISOString(),
    supabaseUrl: url ? url.replace(/https?:\/\//, '').split('.')[0] + '...supabase.co' : 'Not configured',
    confirmEmailEnabled: false,
    emailProviderEnabled: false,
    signupsAllowed: false,
    rawSettings: {},
    smtpStatus: {
      isCustomSmtpLikelyConfigured: false,
      builtInMailerWarning: false,
      resendFallbackAvailable: Boolean(resendKey),
      recommendation: ''
    },
    adminLinkGenerationTest: {
      success: false,
      message: 'Not executed'
    },
    summary: {
      status: 'healthy',
      primaryIssues: [],
      actionItems: []
    }
  };

  if (!url) {
    result.summary.status = 'critical';
    result.summary.primaryIssues.push('VITE_SUPABASE_URL is missing or empty.');
    result.summary.actionItems.push('Set VITE_SUPABASE_URL in your environment or Settings.');
    return result;
  }

  // 1. Query GoTrue Auth settings endpoint
  try {
    const settingsEndpoint = `${url}/auth/v1/settings`;
    const authHeaders: Record<string, string> = {
      'apikey': anonKey || serviceKey
    };
    if (serviceKey) {
      authHeaders['Authorization'] = `Bearer ${serviceKey}`;
    }

    const response = await fetch(settingsEndpoint, { headers: authHeaders });
    if (response.ok) {
      const data = await response.json();
      result.rawSettings = data;

      // In GoTrue: mailer_autoconfirm = false means "Confirm email" IS ENABLED in Supabase Auth.
      result.confirmEmailEnabled = data.mailer_autoconfirm === false;
      result.emailProviderEnabled = Boolean(data.external?.email);
      result.signupsAllowed = data.disable_signup === false;

      if (!result.emailProviderEnabled) {
        result.summary.primaryIssues.push("Email provider is DISABLED in Supabase Auth.");
        result.summary.actionItems.push("Go to Supabase Dashboard > Authentication > Providers > Email, and toggle 'Enable Email provider' ON.");
      }

      if (!result.confirmEmailEnabled) {
        result.summary.primaryIssues.push("'Confirm email' is DISABLED (mailer_autoconfirm is true). Signups are automatically verified and no verification email will be dispatched by Supabase.");
        result.summary.actionItems.push("Go to Supabase Dashboard > Authentication > Providers > Email, and check 'Confirm email' to require email verification.");
      }

      if (!result.signupsAllowed) {
        result.summary.primaryIssues.push("User signups are globally DISABLED (disable_signup is true).");
        result.summary.actionItems.push("Go to Supabase Dashboard > Authentication > Providers, and allow new user signups.");
      }
    } else {
      result.summary.primaryIssues.push(`Failed to fetch /auth/v1/settings (HTTP ${response.status}: ${response.statusText})`);
    }
  } catch (err: any) {
    result.summary.primaryIssues.push(`Error connecting to Supabase Auth settings: ${err.message}`);
  }

  // 2. Evaluate SMTP Settings
  // Supabase's built-in mailer is restricted to ~3-4 emails/hour on free tiers.
  // Custom SMTP configuration in the Supabase Dashboard ensures high delivery and removes rate limit caps.
  if (result.smtpStatus.resendFallbackAvailable) {
    result.smtpStatus.isCustomSmtpLikelyConfigured = true;
    result.smtpStatus.recommendation = 'Application has RESEND_API_KEY configured. Both server-side API routes and webhooks can dispatch emails via Resend directly, bypassing Supabase rate limits.';
  } else {
    result.smtpStatus.builtInMailerWarning = true;
    result.smtpStatus.recommendation = "Supabase built-in SMTP has a strict rate limit of 3-4 emails/hour. To ensure emails reliably reach customers, configure Custom SMTP in Supabase Dashboard > Project Settings > Authentication > SMTP Settings (e.g. using Resend, SendGrid, or AWS SES), or add RESEND_API_KEY to your environment.";
    result.summary.primaryIssues.push("No Custom SMTP or RESEND_API_KEY detected. Built-in Supabase mailer rate-limits may drop registration emails.");
    result.summary.actionItems.push("Configure Custom SMTP in Supabase Dashboard (Project Settings > Authentication > SMTP Settings) or set RESEND_API_KEY.");
  }

  // 3. Test Admin Action Link Generation (if service key is available)
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const testEmail = 'odamarket254+diagnostic@gmail.com';
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: testEmail,
        options: {
          redirectTo: 'https://odamarket.co.ke/login?confirmed=true'
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        result.adminLinkGenerationTest = {
          success: true,
          message: 'Successfully generated authentication action link using GoTrue Admin API.',
          actionLinkGenerated: true
        };
      } else {
        result.adminLinkGenerationTest = {
          success: false,
          message: linkError ? linkError.message : 'No action link returned'
        };
        if (linkError) {
          result.summary.primaryIssues.push(`generateLink check failed: ${linkError.message}`);
        }
      }
    } catch (adminErr: any) {
      result.adminLinkGenerationTest = {
        success: false,
        message: adminErr.message || 'Exception during admin link generation test'
      };
    }
  }

  // Calculate final status
  if (result.summary.primaryIssues.length === 0) {
    result.summary.status = 'healthy';
  } else if (!result.confirmEmailEnabled || !result.emailProviderEnabled) {
    result.summary.status = 'critical';
  } else {
    result.summary.status = 'warning';
  }

  return result;
}
