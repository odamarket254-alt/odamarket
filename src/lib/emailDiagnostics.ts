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
}

/**
 * Checks server-side access to RESEND_API_KEY and RESEND_FROM_EMAIL
 * without exposing sensitive secrets or credentials.
 * 
 * @param performLiveCheck If true, runs a safe metadata query (resend.domains.list()) to verify credentials with Resend.
 */
export async function getEmailDiagnostics(performLiveCheck: boolean = false): Promise<EmailDiagnosticsReport> {
  const rawKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const rawFrom = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const vercelEnv = process.env.VERCEL_ENV || (process.env.VERCEL ? 'vercel' : undefined);

  const apiKeyConfigured = Boolean(rawKey && rawKey.length > 5);
  const apiKeyFormatValid = Boolean(apiKeyConfigured && rawKey.startsWith('re_') && rawKey.length >= 20);
  const fromEmailConfigured = Boolean(rawFrom && rawFrom.length > 3);
  const fromEmailResolved = rawFrom || 'ODA Market <orders@odamarket.co.ke>';

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

  console.log(`[Resend Diagnostics - ${context}]`, {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    resendApiKeyAccessible: Boolean(rawKey),
    resendApiKeyLength: rawKey.length,
    resendApiKeyValidFormat: Boolean(rawKey.startsWith('re_') && rawKey.length >= 20),
    resendFromEmailAccessible: Boolean(rawFrom),
    resendFromEmailResolved: rawFrom || 'ODA Market <orders@odamarket.co.ke>'
  });
}
