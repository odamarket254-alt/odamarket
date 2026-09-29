import { Resend } from 'resend';

export interface EmailDiagnosticsReport {
  timestamp: string;
  environment: {
    nodeEnv: string;
    isProduction: boolean;
    vercelEnv?: string;
  };
  resend: {
    apiKeyConfigured: boolean;
    apiKeyLength: number;
    apiKeyFormatValid: boolean;
    fromEmailConfigured: boolean;
    fromEmailResolved: string;
    resendClientInitialized: boolean;
  };
  connectionTest?: {
    status: 'success' | 'unauthorized' | 'not_configured' | 'error';
    verifiedDomainsCount?: number;
    verifiedDomains?: string[];
    error?: string;
  };
  templates?: {
    configuredEnvVars: Record<string, { configured: boolean; value: string | null }>;
    availableInResend?: Array<{
      id: string;
      name: string;
      alias: string | null;
      status: string;
      from?: string | null;
      subject?: string | null;
      declaredVariables?: string[];
      htmlPlaceholders?: string[];
    }>;
  };
  automations?: Array<{
    id: string;
    name: string;
    status: string;
    created_at?: string;
  }>;
}

export const RESEND_TEMPLATE_ENV_VAR_NAMES = [
  'RESEND_TEMPLATE_ID',
  'RESEND_ORDER_CONFIRMATION_TEMPLATE_ID',
  'RESEND_PAYMENT_SUCCESS_TEMPLATE_ID',
  'RESEND_PAYMENT_FAILED_TEMPLATE_ID',
  'RESEND_ORDER_READY_TEMPLATE_ID',
  'RESEND_ORDER_CANCELLED_TEMPLATE_ID',
  'RESEND_WELCOME_TEMPLATE_ID',
  'RESEND_EMAIL_VERIFICATION_TEMPLATE_ID',
  'RESEND_SELLER_NEW_ORDER_TEMPLATE_ID'
] as const;

function isValidFromEmailFormat(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.startsWith('re_') || trimmed.startsWith('YOUR_')) return false;
  // Matches either `email@domain.com` or `Name <email@domain.com>`
  const angleMatch = trimmed.match(/<([^<>]+)>$/);
  const emailPart = angleMatch ? angleMatch[1].trim() : trimmed;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart);
}

function isValidTemplateIdFormat(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.startsWith('YOUR_') || trimmed.startsWith('re_') || trimmed.includes('@')) {
    return false;
  }
  return true;
}

function getConfiguredTemplateEnvVars(): Record<string, { configured: boolean; value: string | null }> {
  const result: Record<string, { configured: boolean; value: string | null }> = {};
  for (const envName of RESEND_TEMPLATE_ENV_VAR_NAMES) {
    const raw = (process.env[envName] || '').trim().replace(/^["']|["']$/g, '');
    const isValid = isValidTemplateIdFormat(raw);
    result[envName] = {
      configured: isValid,
      value: isValid ? raw : null
    };
  }
  return result;
}

/**
 * Checks server-side access to RESEND_API_KEY, RESEND_FROM_EMAIL, and RESEND_*_TEMPLATE_ID
 * without exposing sensitive secrets or credentials.
 * 
 * @param performLiveCheck If true, runs a safe metadata query (resend.domains.list() and resend.templates.list()) to verify credentials and templates with Resend.
 */
export async function getEmailDiagnostics(performLiveCheck: boolean = false): Promise<EmailDiagnosticsReport> {
  const rawKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const rawFrom = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const vercelEnv = process.env.VERCEL_ENV || (process.env.VERCEL ? 'vercel' : undefined);

  const apiKeyConfigured = Boolean(rawKey && rawKey.length > 5);
  const apiKeyFormatValid = Boolean(apiKeyConfigured && rawKey.startsWith('re_') && rawKey.length >= 20);
  const fromEmailConfigured = isValidFromEmailFormat(rawFrom);
  const fromEmailResolved = fromEmailConfigured ? rawFrom : 'ODA Market <orders@odamarket.co.ke>';

  const report: EmailDiagnosticsReport = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv,
      isProduction,
      vercelEnv
    },
    resend: {
      apiKeyConfigured,
      apiKeyLength: rawKey.length,
      apiKeyFormatValid,
      fromEmailConfigured,
      fromEmailResolved,
      resendClientInitialized: false
    },
    templates: {
      configuredEnvVars: getConfiguredTemplateEnvVars()
    }
  };

  if (!apiKeyConfigured) {
    if (performLiveCheck) {
      report.connectionTest = {
        status: 'not_configured',
        error: 'RESEND_API_KEY is not defined in the server environment variables.'
      };
    }
    return report;
  }

  report.resend.resendClientInitialized = true;

  if (performLiveCheck) {
    try {
      const resend = new Resend(rawKey);
      const domainsResult = await resend.domains.list();

      if (domainsResult.error) {
        report.connectionTest = {
          status: 'error',
          error: domainsResult.error.message || 'Resend API returned an error'
        };
      } else {
        const verifiedDomains = (domainsResult.data?.data || [])
          .filter(d => d.status === 'verified')
          .map(d => d.name);

        report.connectionTest = {
          status: 'success',
          verifiedDomainsCount: verifiedDomains.length,
          verifiedDomains
        };
      }

      // Inspect existing Resend templates in the account
      try {
        const templatesList = await resend.templates.list({ limit: 50 });
        if (!templatesList.error && templatesList.data?.data) {
          const detailedTemplates = [];
          for (const item of templatesList.data.data) {
            const detail = await resend.templates.get(item.id);
            const html = detail.data?.html || '';
            const placeholders = [...new Set((html.match(/\{\{\{?[^{}]+\}?\}\}/g) || []).map(p => p.trim()))];
            detailedTemplates.push({
              id: item.id,
              name: item.name,
              alias: item.alias,
              status: item.status,
              from: detail.data?.from || null,
              subject: detail.data?.subject || null,
              declaredVariables: (detail.data?.variables || []).map(v => `${v.key} (${v.type})`),
              htmlPlaceholders: placeholders
            });
          }
          if (report.templates) {
            report.templates.availableInResend = detailedTemplates;
          }
        }
      } catch (tplErr) {
        // Non-fatal if API key is restricted to sending only
      }

      // Inspect Resend Automations in the account
      try {
        const autoRes = await fetch('https://api.resend.com/automations', {
          headers: { Authorization: `Bearer ${rawKey}` }
        });
        if (autoRes.ok) {
          const autoData: any = await autoRes.json().catch(() => ({}));
          if (Array.isArray(autoData?.data)) {
            report.automations = autoData.data.map((a: any) => ({
              id: a.id,
              name: a.name,
              status: a.status,
              created_at: a.created_at
            }));
          }
        }
      } catch {
        // Non-fatal
      }
    } catch (err: any) {
      report.connectionTest = {
        status: err?.status === 401 || err?.statusCode === 401 ? 'unauthorized' : 'error',
        error: err?.message || 'Failed to connect to Resend API'
      };
    }
  }

  return report;
}

/**
 * Server-side console diagnostic logging helper.
 * Safely logs Resend configuration accessibility to stdout/logs without printing keys or credentials.
 */
export function logEmailDiagnostics(context: string = 'General'): void {
  const rawKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const rawFrom = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  const validFrom = isValidFromEmailFormat(rawFrom);

  console.log(`[Resend Diagnostics - ${context}]`, {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    resendApiKeyAccessible: Boolean(rawKey),
    resendApiKeyLength: rawKey.length,
    resendApiKeyValidFormat: Boolean(rawKey.startsWith('re_') && rawKey.length >= 20),
    resendFromEmailAccessible: validFrom,
    resendFromEmailResolved: validFrom ? rawFrom : 'ODA Market <orders@odamarket.co.ke>'
  });
}
