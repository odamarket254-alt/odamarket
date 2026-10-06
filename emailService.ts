import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { logEmailDiagnostics } from './src/lib/emailDiagnostics.js';

// Lazy initialized Resend client with automatic failover if a domain-restricted key (e.g. old Vercel Integration key) fails
let resendClient: Resend | null = null;
let cachedApiKey: string = '';
const rejectedResendApiKeys = new Set<string>();

const CANDIDATE_RESEND_KEY_ENV_VARS = [
  'RESEND_FULL_ACCESS_API_KEY',
  'RESEND_MASTER_API_KEY',
  'RESEND_API_KEY',
  'RESEND_EMAIL_VERIFICATION_TEMPLATE_ID',
  'RESEND_WELCOME_TEMPLATE_ID',
  'RESEND_ORDER_CONFIRMATION_TEMPLATE_ID',
  'RESEND_PAYMENT_SUCCESS_TEMPLATE_ID',
  'RESEND_PAYMENT_FAILED_TEMPLATE_ID',
  'RESEND_ORDER_READY_TEMPLATE_ID',
  'RESEND_ORDER_CANCELLED_TEMPLATE_ID',
  'RESEND_SELLER_NEW_ORDER_TEMPLATE_ID',
  'RESEND_FROM_EMAIL'
] as const;

export function getCandidateResendApiKeys(): string[] {
  const keys: string[] = [];
  const envNames = new Set<string>([
    ...CANDIDATE_RESEND_KEY_ENV_VARS,
    ...Object.keys(process.env).filter((k) => k.toUpperCase().includes('RESEND'))
  ]);

  for (const envName of envNames) {
    const raw = (process.env[envName] || '').trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
    const match = raw.match(/re_[A-Za-z0-9_]{15,}/);
    const val = match ? match[0] : raw;
    if (val.startsWith('re_') && val.length >= 18 && !rejectedResendApiKeys.has(val) && !keys.includes(val)) {
      keys.push(val);
    }
  }
  return keys;
}

export function isUnverifiedDomainOrRestrictedKeyError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err.error || JSON.stringify(err)).toLowerCase();
  const name = String(err.name || '').toLowerCase();
  const status = Number(err.statusCode || err.status || 0);
  return (
    msg.includes('associated domain with your api key is not verified') ||
    msg.includes('create a new api key with full access') ||
    msg.includes('not verified') ||
    msg.includes('restricted_api_key') ||
    msg.includes('invalid_api_key') ||
    name === 'restricted_api_key' ||
    name === 'invalid_api_key' ||
    status === 401 ||
    status === 403
  );
}

export function markResendApiKeyRejected(badKey: string, reason?: string): boolean {
  if (!badKey) return false;
  rejectedResendApiKeys.add(badKey);
  if (cachedApiKey === badKey) {
    resendClient = null;
    cachedApiKey = '';
  }
  const remaining = getCandidateResendApiKeys();
  if (remaining.length > 0) {
    console.warn(
      `[Resend Failover] Primary key (${badKey.slice(0, 10)}...) rejected (${reason || 'unverified domain/restricted'}). Automatically failing over to verified Full-Access key (${remaining[0].slice(0, 10)}...).`
    );
    return true;
  }
  return false;
}

export function getActiveResendApiKey(): string {
  const candidates = getCandidateResendApiKeys();
  if (candidates.length > 0) return candidates[0];
  return (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
}

function getResendClient(): Resend | null {
  const apiKey = getActiveResendApiKey();
  if (!apiKey || apiKey.startsWith('YOUR_') || !apiKey.startsWith('re_')) {
    return null;
  }
  if (!resendClient || cachedApiKey !== apiKey) {
    resendClient = new Resend(apiKey);
    cachedApiKey = apiKey;
  }
  return resendClient;
}

// Lazy initialized Supabase admin client
let supabaseAdminClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!url || !serviceKey || url.includes('placeholder') || serviceKey.includes('placeholder')) {
    return null;
  }
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminClient;
}

export type ResendEmailEventType =
  | 'order_confirmation'
  | 'order_confirmed'
  | 'payment_success'
  | 'payment_failed'
  | 'order_ready'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'welcome'
  | 'email_verification'
  | 'seller_new_order';

export const RESEND_TEMPLATE_ENV_KEYS: Record<ResendEmailEventType, string> = {
  order_confirmation: 'RESEND_ORDER_CONFIRMATION_TEMPLATE_ID',
  order_confirmed: 'RESEND_ORDER_CONFIRMED_TEMPLATE_ID',
  payment_success: 'RESEND_PAYMENT_SUCCESS_TEMPLATE_ID',
  payment_failed: 'RESEND_PAYMENT_FAILED_TEMPLATE_ID',
  order_ready: 'RESEND_ORDER_READY_TEMPLATE_ID',
  order_shipped: 'RESEND_ORDER_SHIPPED_TEMPLATE_ID',
  order_delivered: 'RESEND_ORDER_DELIVERED_TEMPLATE_ID',
  order_cancelled: 'RESEND_ORDER_CANCELLED_TEMPLATE_ID',
  welcome: 'RESEND_WELCOME_TEMPLATE_ID',
  email_verification: 'RESEND_EMAIL_VERIFICATION_TEMPLATE_ID',
  seller_new_order: 'RESEND_SELLER_NEW_ORDER_TEMPLATE_ID'
};

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
  productId?: string;
  supplierId?: string;
}

export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber: string;
  orderId: string;
  orderDate: string;
  items: OrderEmailItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  total: number;
  deliveryMethod: string;
  deliveryAddress: string;
  recipientName?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  orderStatus: string;
  storeName?: string;
  trackingUrl: string;
}

export interface SendOrderEmailResult {
  success: boolean;
  skipped?: boolean;
  alreadySent?: boolean;
  orderId?: string;
  resendId?: string;
  templateId?: string;
  sentAt?: string;
  recipient?: string;
  error?: string;
  reason?: string;
}

// In-flight deduplication lock to prevent race conditions when webhook and /verify execute simultaneously
const inFlightDispatches = new Map<string, Promise<SendOrderEmailResult>>();

// Short-lived cache for Resend template discovery and metadata (60 seconds TTL)
interface CachedResendTemplate {
  id: string;
  name: string;
  alias: string | null;
  status: string;
  from: string | null;
  subject: string | null;
  reply_to: string[] | string | null;
  html: string;
  text: string | null;
  variables: Array<{
    key: string;
    type: 'string' | 'number';
    fallback_value: string | number | null;
  }>;
  fetchedAt: number;
}

let cachedTemplateList: { items: Array<{ id: string; name: string; alias: string | null; status: string }>; fetchedAt: number } | null = null;
const cachedTemplateDetails = new Map<string, CachedResendTemplate>();
const TEMPLATE_CACHE_TTL_MS = 60 * 1000;

/**
 * Format amounts into Kenyan Shillings (KSh)
 */
export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Validates whether an email string is real and deliverable (not empty, not placeholder/example.com)
 */
export function isValidCustomerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || !trimmed.includes('@') || !trimmed.includes('.')) return false;
  if (trimmed.endsWith('@example.com') || trimmed.endsWith('@placeholder.com') || trimmed.includes('test@test')) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Validates whether a `from` header string follows `email@domain.com` or `Name <email@domain.com>`
 * and rejects accidental API keys (`re_...`) or placeholders.
 */
export function isValidFromEmailFormat(fromVal?: string | null): boolean {
  if (!fromVal || typeof fromVal !== 'string') return false;
  const trimmed = fromVal.trim();
  if (!trimmed || trimmed.startsWith('re_') || trimmed.startsWith('YOUR_')) return false;
  const angleMatch = trimmed.match(/<([^<>]+)>$/);
  const emailPart = angleMatch ? angleMatch[1].trim() : trimmed;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart);
}

/**
 * Resolves a guaranteed-valid `from` email header string
 */
export function resolveValidFromEmail(
  candidate?: string | null,
  fallback: string = 'ODA Market <orders@odamarket.co.ke>'
): string {
  if (candidate) {
    const cleaned = candidate.trim().replace(/^["']|["']$/g, '');
    if (isValidFromEmailFormat(cleaned)) {
      return cleaned;
    }
  }
  const envFrom = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  if (isValidFromEmailFormat(envFrom)) {
    return envFrom;
  }
  if (isValidFromEmailFormat(fallback)) {
    return fallback;
  }
  return 'ODA Market <orders@odamarket.co.ke>';
}

/**
 * Validates that a template ID / alias is not an accidentally pasted Resend API key (`re_...`) or placeholder
 */
export function isValidResendTemplateIdentifier(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim().replace(/^["']|["']$/g, '');
  if (!trimmed || trimmed.startsWith('YOUR_') || trimmed.startsWith('re_') || trimmed.includes('@')) {
    return false;
  }
  return true;
}

/**
 * Resolves the configured or discovered Resend Template ID / Alias for a given email event
 */
export async function resolveResendTemplateId(eventType: ResendEmailEventType): Promise<string | null> {
  const envKey = RESEND_TEMPLATE_ENV_KEYS[eventType];
  const primaryEnvVal = (process.env[envKey] || '').trim().replace(/^["']|["']$/g, '');
  const genericEnvVal = eventType === 'welcome'
    ? (process.env.RESEND_TEMPLATE_ID || '').trim().replace(/^["']|["']$/g, '')
    : '';
  const rawEnvVal = isValidResendTemplateIdentifier(primaryEnvVal)
    ? primaryEnvVal
    : genericEnvVal;
  const hasValidEnvTemplateId = isValidResendTemplateIdentifier(rawEnvVal);

  // Query published templates in the Resend account to verify or auto-match by alias or name
  const resend = getResendClient();
  if (!resend) {
    return hasValidEnvTemplateId ? rawEnvVal : null;
  }

  try {
    const now = Date.now();
    if (!cachedTemplateList || now - cachedTemplateList.fetchedAt > TEMPLATE_CACHE_TTL_MS) {
      let currentKey = getActiveResendApiKey();
      let listRes = await resend.templates.list({ limit: 100 });
      while (listRes.error && isUnverifiedDomainOrRestrictedKeyError(listRes.error)) {
        const switched = markResendApiKeyRejected(currentKey, listRes.error.message);
        if (!switched) break;
        const nextClient = getResendClient();
        if (!nextClient) break;
        currentKey = getActiveResendApiKey();
        listRes = await nextClient.templates.list({ limit: 100 });
      }
      if (!listRes.error && listRes.data?.data) {
        cachedTemplateList = {
          items: listRes.data.data.map(t => ({
            id: t.id,
            name: t.name,
            alias: t.alias,
            status: t.status
          })),
          fetchedAt: now
        };
      } else if (hasValidEnvTemplateId) {
        // Sending-only API key cannot list templates; trust valid env template ID
        return rawEnvVal;
      }
    }

    const templates = (cachedTemplateList?.items || []).filter(t => t.status === 'published');

    if (hasValidEnvTemplateId) {
      // Check if the configured template ID/alias matches a published template in the account
      const envMatch = templates.find(
        t =>
          t.id.toLowerCase() === rawEnvVal.toLowerCase() ||
          (t.alias && t.alias.toLowerCase() === rawEnvVal.toLowerCase()) ||
          t.name.toLowerCase() === rawEnvVal.toLowerCase()
      );
      if (envMatch) {
        return envMatch.alias || envMatch.id;
      }
    }

    if (templates.length === 0) return null;

    const matchers: Record<ResendEmailEventType, (t: { id: string; name: string; alias: string | null }) => boolean> = {
      email_verification: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          t.id === '2d5aeedf-970b-4b39-98a6-f6770235d481' ||
          a === 'confirm-your-email-address-template' ||
          a.includes('email-verification') ||
          a.includes('verify-email') ||
          a.includes('confirm-your-email') ||
          (n.includes('confirm') && n.includes('email')) ||
          (n.includes('verification') && n.includes('email'))
        );
      },
      order_confirmation: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a === 'order-confirmation' ||
          a === 'order-confirmation-template' ||
          a === 'order_confirmation' ||
          (n.includes('order') && n.includes('confirm') && !n.includes('seller'))
        );
      },
      order_confirmed: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a === 'order-confirmed' ||
          a === 'order_confirmed' ||
          (n.includes('order') && n.includes('confirmed') && !n.includes('seller'))
        );
      },
      payment_success: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('payment-success') ||
          a.includes('payment_success') ||
          (n.includes('payment') && (n.includes('success') || n.includes('received') || n.includes('confirmed')))
        );
      },
      payment_failed: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('payment-failed') ||
          a.includes('payment_failed') ||
          (n.includes('payment') && n.includes('fail'))
        );
      },
      order_ready: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('order-ready') ||
          a.includes('order_ready') ||
          a.includes('ready-for-pickup') ||
          (n.includes('order') && (n.includes('ready') || n.includes('pickup') || n.includes('dispatched')))
        );
      },
      order_shipped: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('order-shipped') ||
          a.includes('order_shipped') ||
          a.includes('out-for-delivery') ||
          (n.includes('order') && (n.includes('shipped') || n.includes('out for delivery')))
        );
      },
      order_delivered: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('order-delivered') ||
          a.includes('order_delivered') ||
          (n.includes('order') && n.includes('delivered'))
        );
      },
      order_cancelled: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('order-cancel') ||
          a.includes('order_cancel') ||
          (n.includes('order') && n.includes('cancel'))
        );
      },
      welcome: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a === 'welcome' ||
          a === 'welcome-template' ||
          a === 'welcome-email' ||
          (n.includes('welcome') && !n.includes('confirm'))
        );
      },
      seller_new_order: (t) => {
        const a = (t.alias || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return (
          a.includes('seller-new-order') ||
          a.includes('seller_new_order') ||
          a.includes('new-seller-order') ||
          (n.includes('seller') && n.includes('order'))
        );
      }
    };

    const matched = templates.find(matchers[eventType]);
    return matched ? (matched.alias || matched.id) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetches template details from Resend (cached for 60s)
 */
async function getResendTemplateDetails(templateIdOrAlias: string): Promise<CachedResendTemplate | null> {
  const resend = getResendClient();
  if (!resend || !templateIdOrAlias) return null;

  const now = Date.now();
  const cached = cachedTemplateDetails.get(templateIdOrAlias);
  if (cached && now - cached.fetchedAt < TEMPLATE_CACHE_TTL_MS) {
    return cached;
  }

  try {
    let activeKey = getActiveResendApiKey();
    let res = await resend.templates.get(templateIdOrAlias);
    while (res.error && isUnverifiedDomainOrRestrictedKeyError(res.error)) {
      const switched = markResendApiKeyRejected(activeKey, res.error.message);
      if (!switched) break;
      const nextClient = getResendClient();
      if (!nextClient) break;
      activeKey = getActiveResendApiKey();
      res = await nextClient.templates.get(templateIdOrAlias);
    }
    if (res.error || !res.data) {
      return null;
    }
    const d = res.data;
    const entry: CachedResendTemplate = {
      id: d.id,
      name: d.name,
      alias: d.alias,
      status: d.status,
      from: d.from,
      subject: d.subject,
      reply_to: d.reply_to,
      html: d.html || '',
      text: d.text || null,
      variables: (d.variables || []).map(v => ({
        key: v.key,
        type: v.type,
        fallback_value: v.fallback_value
      })),
      fetchedAt: now
    };
    cachedTemplateDetails.set(templateIdOrAlias, entry);
    cachedTemplateDetails.set(d.id, entry);
    if (d.alias) cachedTemplateDetails.set(d.alias, entry);
    return entry;
  } catch {
    return null;
  }
}

/**
 * Normalizes a variable key for flexible matching between Resend templates and ODA Market data
 * e.g., ".ConfirmationURL" -> "confirmationurl", "customer_name" -> "customername"
 */
function normalizeVarKey(key: string): string {
  return key.trim().replace(/^\.+/, '').replace(/[\s_-]+/g, '').toLowerCase();
}

/**
 * Substitutes {{ .Var }}, {{Var}}, and {{{Var}}} placeholders in a template string
 * using the canonical variables map.
 */
export function interpolateTemplateString(
  content: string,
  variables: Record<string, string | number | undefined>,
  numericMap: Record<string, number | undefined> = {}
): string {
  if (!content) return content;

  // Build normalized lookup map
  const normalizedLookup = new Map<string, string>();
  for (const [k, v] of Object.entries(variables)) {
    if (v !== undefined && v !== null) {
      normalizedLookup.set(normalizeVarKey(k), String(v));
    }
  }
  for (const [k, v] of Object.entries(numericMap)) {
    const norm = normalizeVarKey(k);
    if (!normalizedLookup.has(norm) && v !== undefined && v !== null) {
      normalizedLookup.set(norm, String(v));
    }
  }

  return content.replace(/\{\{\{?\s*([^{}]+?)\s*\}?\}\}/g, (fullMatch, rawVarName) => {
    const trimmed = String(rawVarName).trim();
    const cleaned = trimmed.replace(/^\.+/, '');
    if (variables[trimmed] !== undefined) return String(variables[trimmed]);
    if (variables[cleaned] !== undefined) return String(variables[cleaned]);
    const norm = normalizeVarKey(cleaned);
    if (normalizedLookup.has(norm)) {
      return normalizedLookup.get(norm)!;
    }
    return fullMatch;
  });
}

/**
 * Dispatches an email using an existing Resend template.
 * - Uses Resend's native `template: { id, variables }` API when the template defines Resend variables
 *   or has no un-declared {{ ... }} placeholders.
 * - Only passes variable keys that actually exist in the Resend template definition.
 * - If the Resend template contains un-declared {{ .ConfirmationURL }} or {{variable}} placeholders
 *   (where `variables` in Resend is empty), interpolates the variables into the live Resend template's
 *   HTML/text/subject so no unreplaced placeholders ever reach the customer.
 */
export async function dispatchResendTemplateEmail(params: {
  templateIdOrAlias: string;
  to: string;
  defaultSubject: string;
  defaultFrom?: string;
  replyTo?: string;
  stringVariables: Record<string, string>;
  numericVariables?: Record<string, number>;
  idempotencyKey?: string;
}): Promise<{ success: boolean; resendId?: string; templateId?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured on server' };
  }

  const {
    templateIdOrAlias,
    to,
    defaultSubject,
    defaultFrom,
    replyTo = 'info@odamarket.co.ke',
    stringVariables,
    numericVariables = {},
    idempotencyKey
  } = params;

  const rawEnvFrom = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  const validEnvFrom = isValidFromEmailFormat(rawEnvFrom) ? rawEnvFrom : '';
  const fallbackFrom = resolveValidFromEmail(validEnvFrom || defaultFrom, 'ODA Market <orders@odamarket.co.ke>');

  // 1. Inspect the template in Resend to determine its exact declared variables & placeholders
  const templateDoc = await getResendTemplateDetails(templateIdOrAlias);

  // Normalized lookup for matching templateDoc.variables
  const normStringMap = new Map<string, string>();
  for (const [k, v] of Object.entries(stringVariables)) {
    if (v !== undefined && v !== null) {
      normStringMap.set(normalizeVarKey(k), String(v));
    }
  }
  const normNumberMap = new Map<string, number>();
  for (const [k, v] of Object.entries(numericVariables)) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) {
      normNumberMap.set(normalizeVarKey(k), Number(v));
    }
  }

  if (templateDoc) {
    const resolvedFrom = resolveValidFromEmail(validEnvFrom || templateDoc.from, fallbackFrom);
    const rawSubject = templateDoc.subject || defaultSubject;
    const resolvedSubject = interpolateTemplateString(rawSubject, stringVariables, numericVariables);
    const resolvedReplyTo = templateDoc.reply_to || replyTo;

    // Map ONLY the variables that actually exist in this Resend template
    const exactTemplateVariables: Record<string, string | number> = {};
    const declaredKeysNormalized = new Set<string>();

    for (const vDef of templateDoc.variables || []) {
      const key = vDef.key;
      const normKey = normalizeVarKey(key);
      declaredKeysNormalized.add(normKey);

      if (vDef.type === 'number') {
        if (numericVariables[key] !== undefined) {
          exactTemplateVariables[key] = numericVariables[key];
        } else if (normNumberMap.has(normKey)) {
          exactTemplateVariables[key] = normNumberMap.get(normKey)!;
        } else if (vDef.fallback_value !== null && vDef.fallback_value !== undefined) {
          exactTemplateVariables[key] = Number(vDef.fallback_value) || 0;
        } else {
          exactTemplateVariables[key] = 0;
        }
      } else {
        if (stringVariables[key] !== undefined) {
          exactTemplateVariables[key] = stringVariables[key];
        } else if (normStringMap.has(normKey)) {
          exactTemplateVariables[key] = normStringMap.get(normKey)!;
        } else if (vDef.fallback_value !== null && vDef.fallback_value !== undefined) {
          exactTemplateVariables[key] = String(vDef.fallback_value);
        } else {
          const appUrlFallback = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
          if (normKey === 'shopurl') {
            exactTemplateVariables[key] = `${appUrlFallback}/products`;
          } else if (normKey === 'appurl') {
            exactTemplateVariables[key] = appUrlFallback;
          } else if (normKey === 'loginurl') {
            exactTemplateVariables[key] = `${appUrlFallback}/login`;
          } else if (normKey === 'confirmationurl' || normKey === 'verificationurl' || normKey === 'actionurl') {
            exactTemplateVariables[key] = `${appUrlFallback}/login?confirmed=true`;
          } else if (normKey === 'name' || normKey === 'customername' || normKey === 'firstname') {
            exactTemplateVariables[key] = 'Valued Customer';
          } else if (normKey === 'email' || normKey === 'customeremail') {
            exactTemplateVariables[key] = to;
          } else {
            exactTemplateVariables[key] = '';
          }
        }
      }
    }

    // Check if the Resend template HTML contains any undeclared {{ ... }} placeholders
    // (such as {{ .ConfirmationURL }} or {{customer_name}} when templateDoc.variables is empty)
    const htmlPlaceholders = (templateDoc.html || '').match(/\{\{\{?\s*([^{}]+?)\s*\}?\}\}/g) || [];
    const hasUndeclaredPlaceholders = htmlPlaceholders.some(ph => {
      const inner = ph.replace(/^\{+|\}+$/g, '').trim();
      if (inner.startsWith('.')) return true; // Go-template syntax like {{ .ConfirmationURL }} is not substituted by Resend native variables
      return !declaredKeysNormalized.has(normalizeVarKey(inner));
    });

    if (!hasUndeclaredPlaceholders) {
      // Use Resend's native `template: { id, variables }` API with automatic failover if key is tied to an unverified domain
      let activeClient = getResendClient() || resend;
      let activeKey = getActiveResendApiKey();
      let sendRes = await activeClient.emails.send(
        {
          from: resolvedFrom,
          to: [to],
          subject: resolvedSubject,
          replyTo: resolvedReplyTo,
          template: {
            id: templateDoc.id,
            ...(Object.keys(exactTemplateVariables).length > 0 ? { variables: exactTemplateVariables } : {})
          }
        },
        idempotencyKey ? { idempotencyKey } : undefined
      );

      while (sendRes.error && isUnverifiedDomainOrRestrictedKeyError(sendRes.error)) {
        const switched = markResendApiKeyRejected(activeKey, sendRes.error.message);
        if (!switched) break;
        const nextClient = getResendClient();
        if (!nextClient) break;
        activeClient = nextClient;
        activeKey = getActiveResendApiKey();
        sendRes = await activeClient.emails.send(
          {
            from: resolvedFrom,
            to: [to],
            subject: resolvedSubject,
            replyTo: resolvedReplyTo,
            template: {
              id: templateDoc.id,
              ...(Object.keys(exactTemplateVariables).length > 0 ? { variables: exactTemplateVariables } : {})
            }
          },
          idempotencyKey ? { idempotencyKey: `${idempotencyKey}-fo` } : undefined
        );
      }

      if (!sendRes.error) {
        return {
          success: true,
          resendId: sendRes.data?.id || `resend_${Date.now()}`,
          templateId: templateDoc.id
        };
      }
      console.warn(`[Resend Template] Native template send returned error (${sendRes.error.message}), falling back to rendered Resend template HTML.`);
    }

    // If the template in Resend has undeclared {{ .ConfirmationURL }} / {{var}} placeholders,
    // render them directly into the exact HTML & text fetched from the user's Resend template
    const renderedHtml = interpolateTemplateString(templateDoc.html, stringVariables, numericVariables);
    const renderedText = templateDoc.text
      ? interpolateTemplateString(templateDoc.text, stringVariables, numericVariables)
      : undefined;

    let renderedClient = getResendClient() || resend;
    let renderedKey = getActiveResendApiKey();
    let renderedSendRes = await renderedClient.emails.send(
      {
        from: resolvedFrom,
        to: [to],
        subject: resolvedSubject,
        replyTo: resolvedReplyTo,
        html: renderedHtml,
        ...(renderedText ? { text: renderedText } : {})
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    while (renderedSendRes.error && isUnverifiedDomainOrRestrictedKeyError(renderedSendRes.error)) {
      const switched = markResendApiKeyRejected(renderedKey, renderedSendRes.error.message);
      if (!switched) break;
      const nextClient = getResendClient();
      if (!nextClient) break;
      renderedClient = nextClient;
      renderedKey = getActiveResendApiKey();
      renderedSendRes = await renderedClient.emails.send(
        {
          from: resolvedFrom,
          to: [to],
          subject: resolvedSubject,
          replyTo: resolvedReplyTo,
          html: renderedHtml,
          ...(renderedText ? { text: renderedText } : {})
        },
        idempotencyKey ? { idempotencyKey: `${idempotencyKey}-fo` } : undefined
      );
    }

    if (renderedSendRes.error) {
      return {
        success: false,
        templateId: templateDoc.id,
        error: renderedSendRes.error.message || JSON.stringify(renderedSendRes.error)
      };
    }

    return {
      success: true,
      resendId: renderedSendRes.data?.id || `resend_${Date.now()}`,
      templateId: templateDoc.id
    };
  }

  // 2. Fallback if templates.get() is unavailable (e.g. Sending-Only API Key):
  // Call resend.emails.send with template: { id, variables } directly
  let directClient = getResendClient() || resend;
  let directKey = getActiveResendApiKey();
  let directRes = await directClient.emails.send(
    {
      from: fallbackFrom,
      to: [to],
      subject: interpolateTemplateString(defaultSubject, stringVariables, numericVariables),
      replyTo,
      template: {
        id: templateIdOrAlias,
        variables: stringVariables
      }
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  while (directRes.error && isUnverifiedDomainOrRestrictedKeyError(directRes.error)) {
    const switched = markResendApiKeyRejected(directKey, directRes.error.message);
    if (!switched) break;
    const nextClient = getResendClient();
    if (!nextClient) break;
    directClient = nextClient;
    directKey = getActiveResendApiKey();
    directRes = await directClient.emails.send(
      {
        from: fallbackFrom,
        to: [to],
        subject: interpolateTemplateString(defaultSubject, stringVariables, numericVariables),
        replyTo,
        template: {
          id: templateIdOrAlias,
          variables: stringVariables
        }
      },
      idempotencyKey ? { idempotencyKey: `${idempotencyKey}-fo` } : undefined
    );
  }

  if (!directRes.error) {
    return {
      success: true,
      resendId: directRes.data?.id || `resend_${Date.now()}`,
      templateId: templateIdOrAlias
    };
  }

  // If Resend rejected unknown variable keys, retry with template ID only
  if (directRes.error.name === 'validation_error' || directRes.error.statusCode === 422) {
    const retryRes = await resend.emails.send(
      {
        from: fallbackFrom,
        to: [to],
        subject: interpolateTemplateString(defaultSubject, stringVariables, numericVariables),
        replyTo,
        template: {
          id: templateIdOrAlias
        }
      },
      idempotencyKey ? { idempotencyKey: `${idempotencyKey}-retry` } : undefined
    );

    if (!retryRes.error) {
      return {
        success: true,
        resendId: retryRes.data?.id || `resend_${Date.now()}`,
        templateId: templateIdOrAlias
      };
    }
  }

  return {
    success: false,
    templateId: templateIdOrAlias,
    error: directRes.error.message || JSON.stringify(directRes.error)
  };
}

/**
 * Builds canonical template variables from real ODA Market order, buyer, payment, and seller data
 */
export function buildOrderTemplateVariables(
  data: OrderEmailData,
  sellerInfo?: { sellerName?: string; sellerEmail?: string }
): {
  stringVariables: Record<string, string>;
  numericVariables: Record<string, number>;
} {
  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
  const deliveryDisplay = data.deliveryFee > 0 ? formatCurrency(data.deliveryFee) : 'Free';
  const deliveryMethodLabel =
    data.deliveryMethod === 'express'
      ? 'Express Delivery (Same Day)'
      : data.deliveryMethod === 'pickup'
      ? 'Store Pickup'
      : 'Standard Delivery';

  const itemsTextSummary = (data.items || [])
    .map(i => `${i.name} (x${i.quantity}) - ${formatCurrency(i.lineTotal)}`)
    .join(', ');

  const itemsMultiline = (data.items || [])
    .map(i => `• ${i.name} — Qty: ${i.quantity} × ${formatCurrency(i.unitPrice)} = ${formatCurrency(i.lineTotal)}`)
    .join('\n');

  const itemsHtmlRows = (data.items || [])
    .map(
      item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #F0E6D8; vertical-align: top;">
        <strong style="color: #3A2418;">${item.name}</strong><br/>
        <span style="font-size: 13px; color: #8B857D;">Qty: ${item.quantity} &times; ${formatCurrency(item.unitPrice)}</span>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #F0E6D8; vertical-align: top; font-weight: 700; color: #3A2418;">
        ${formatCurrency(item.lineTotal)}
      </td>
    </tr>`
    )
    .join('');

  const totalItemsQuantity = (data.items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const firstName = (data.customerName || 'Customer').trim().split(/\s+/)[0] || 'Customer';
  const resolvedSellerName = sellerInfo?.sellerName || data.storeName || 'ODA Market';
  const resolvedSellerEmail = sellerInfo?.sellerEmail || 'info@odamarket.co.ke';

  const stringVariables: Record<string, string> = {
    name: data.customerName || 'Valued Customer',
    customer_name: data.customerName || 'Valued Customer',
    CUSTOMER_NAME: data.customerName || 'Valued Customer',
    customerName: data.customerName || 'Valued Customer',
    first_name: firstName,
    firstName: firstName,
    recipient_name: data.recipientName || data.customerName || 'Valued Customer',
    customer_email: data.customerEmail,
    customerEmail: data.customerEmail,
    email: data.customerEmail,
    customer_phone: data.customerPhone || '',
    customerPhone: data.customerPhone || '',
    phone: data.customerPhone || '',
    order_id: data.orderNumber || data.orderId,
    order_uuid: data.orderId,
    orderId: data.orderId,
    order_number: data.orderNumber,
    orderNumber: data.orderNumber,
    order_date: data.orderDate,
    orderDate: data.orderDate,
    order_total: formatCurrency(data.total),
    orderTotal: formatCurrency(data.total),
    total: formatCurrency(data.total),
    subtotal: formatCurrency(data.subtotal),
    order_subtotal: formatCurrency(data.subtotal),
    delivery_fee: deliveryDisplay,
    deliveryFee: deliveryDisplay,
    discount_amount: formatCurrency(data.discountAmount || 0),
    payment_reference: data.paymentReference || 'N/A',
    paymentReference: data.paymentReference || 'N/A',
    transaction_reference: data.paymentReference || 'N/A',
    payment_method: data.paymentMethod || 'M-Pesa (Paystack)',
    paymentMethod: data.paymentMethod || 'M-Pesa (Paystack)',
    payment_status: data.paymentStatus || 'PAID',
    paymentStatus: data.paymentStatus || 'PAID',
    order_status: data.orderStatus || 'processing',
    orderStatus: data.orderStatus || 'processing',
    status: data.orderStatus || 'processing',
    delivery_method: deliveryMethodLabel,
    deliveryMethod: deliveryMethodLabel,
    delivery_address: data.deliveryAddress || 'Nairobi, Kenya',
    deliveryAddress: data.deliveryAddress || 'Nairobi, Kenya',
    tracking_url: data.trackingUrl,
    trackingUrl: data.trackingUrl,
    order_url: data.trackingUrl,
    items: itemsTextSummary,
    order_items: itemsTextSummary,
    items_list: itemsMultiline,
    items_html: itemsHtmlRows,
    items_count: String(totalItemsQuantity),
    seller_name: resolvedSellerName,
    sellerName: resolvedSellerName,
    seller_email: resolvedSellerEmail,
    store_name: resolvedSellerName,
    storeName: resolvedSellerName,
    seller_dashboard_url: `${appUrl}/admin/dashboard/orders`,
    app_url: appUrl,
    shop_url: `${appUrl}/products`,
    login_url: `${appUrl}/login`,
    support_email: 'info@odamarket.co.ke',
    support_phone: '0792867386'
  };

  const numericVariables: Record<string, number> = {
    order_total: Number(data.total) || 0,
    orderTotal: Number(data.total) || 0,
    total: Number(data.total) || 0,
    subtotal: Number(data.subtotal) || 0,
    order_subtotal: Number(data.subtotal) || 0,
    delivery_fee: Number(data.deliveryFee) || 0,
    deliveryFee: Number(data.deliveryFee) || 0,
    discount_amount: Number(data.discountAmount) || 0,
    items_count: totalItemsQuantity
  };

  return { stringVariables, numericVariables };
}

/**
 * Checks whether a specific email event has already been sent for an order/user
 */
async function checkEmailEventAlreadySent(
  supabase: SupabaseClient,
  order: any | null,
  eventType: ResendEmailEventType,
  recipientEmail?: string
): Promise<{ alreadySent: boolean; sentAt?: string; resendId?: string }> {
  const normRecipient = (recipientEmail || '').trim().toLowerCase();

  // 1. Check dedicated order_email_events table if it exists
  if (order?.id) {
    try {
      let query = supabase
        .from('order_email_events')
        .select('sent_at, resend_id, status')
        .eq('order_id', order.id)
        .eq('email_type', eventType)
        .eq('status', 'sent');

      if (normRecipient) {
        query = query.eq('recipient_email', normRecipient);
      }

      const { data: existingEvent, error: tableErr } = await query.limit(1).maybeSingle();
      if (!tableErr && existingEvent) {
        return {
          alreadySent: true,
          sentAt: existingEvent.sent_at,
          resendId: existingEvent.resend_id
        };
      }
    } catch {
      // Table may not exist yet; continue to order columns and notes checks
    }
  }

  if (!order) {
    return { alreadySent: false };
  }

  let parsedNotes: any = {};
  if (order.notes) {
    try {
      parsedNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
    } catch {
      parsedNotes = {};
    }
  }

  // 2. For order_confirmation, check dedicated columns and legacy notes keys
  if (eventType === 'order_confirmation') {
    const alreadySentAt = order.confirmation_email_sent_at || parsedNotes.confirmation_email_sent_at;
    const isAlreadySent = Boolean(alreadySentAt || parsedNotes.email_status === 'sent' || order.confirmation_email_status === 'sent');
    if (isAlreadySent) {
      return {
        alreadySent: true,
        sentAt: alreadySentAt,
        resendId: order.confirmation_email_id || parsedNotes.email_resend_id
      };
    }
  }

  // 3. Check structured email_events map inside orders.notes
  const eventKey = eventType === 'seller_new_order' && normRecipient
    ? `${eventType}:${normRecipient}`
    : eventType;

  const recordedEvent = parsedNotes.email_events?.[eventKey];
  if (recordedEvent && recordedEvent.status === 'sent') {
    return {
      alreadySent: true,
      sentAt: recordedEvent.sent_at,
      resendId: recordedEvent.resend_id
    };
  }

  return { alreadySent: false };
}

/**
 * Records an email dispatch event idempotently in `order_email_events` (if available) and `orders.notes`
 */
async function recordOrderEmailEvent(params: {
  supabase: SupabaseClient;
  order: any;
  eventType: ResendEmailEventType;
  recipientEmail: string;
  status: 'sent' | 'failed' | 'skipped';
  resendId?: string;
  templateId?: string;
  errorMessage?: string;
}): Promise<void> {
  const { supabase, order, eventType, recipientEmail, status, resendId, templateId, errorMessage } = params;
  const nowIso = new Date().toISOString();
  const normRecipient = recipientEmail.trim().toLowerCase();

  // 1. Attempt insert into public.order_email_events (non-fatal if table not yet migrated)
  try {
    await supabase.from('order_email_events').upsert(
      {
        order_id: order.id,
        user_id: order.user_id || null,
        email_type: eventType,
        recipient_email: normRecipient,
        template_id: templateId || null,
        resend_id: resendId || null,
        status,
        error_message: errorMessage || null,
        sent_at: nowIso
      },
      { onConflict: 'order_id,email_type,recipient_email' }
    );
  } catch {
    // Ignore if table does not exist yet
  }

  // 2. Update orders.notes and (if order_confirmation) dedicated columns
  let parsedNotes: any = {};
  if (order.notes) {
    try {
      parsedNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : { ...order.notes };
    } catch {
      parsedNotes = {};
    }
  }

  if (!parsedNotes.email_events || typeof parsedNotes.email_events !== 'object') {
    parsedNotes.email_events = {};
  }

  const eventKey = eventType === 'seller_new_order' && normRecipient
    ? `${eventType}:${normRecipient}`
    : eventType;

  parsedNotes.email_events[eventKey] = {
    status,
    sent_at: nowIso,
    resend_id: resendId || null,
    template_id: templateId || null,
    recipient: normRecipient,
    ...(errorMessage ? { error: errorMessage } : {})
  };

  if (eventType === 'order_confirmation') {
    if (status === 'sent') {
      parsedNotes.confirmation_email_sent_at = nowIso;
      parsedNotes.email_status = 'sent';
      parsedNotes.email_resend_id = resendId;
      parsedNotes.email_recipient = normRecipient;
      if (templateId) parsedNotes.email_template_id = templateId;

      const { error: colUpdateError } = await supabase
        .from('orders')
        .update({
          confirmation_email_sent_at: nowIso,
          confirmation_email_status: 'sent',
          confirmation_email_id: resendId,
          notes: JSON.stringify(parsedNotes)
        })
        .eq('id', order.id);

      if (colUpdateError) {
        await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', order.id);
      }
      return;
    } else {
      parsedNotes.email_status = status;
      parsedNotes.email_error = errorMessage;
      parsedNotes.email_attempted_at = nowIso;
    }
  }

  await supabase.from('orders').update({ notes: JSON.stringify(parsedNotes) }).eq('id', order.id);
}

/**
 * Helper to load full OrderEmailData + raw order record from Supabase
 */
async function loadOrderEmailContext(
  supabase: SupabaseClient,
  orderId: string
): Promise<{
  order?: any;
  parsedNotes?: any;
  emailData?: OrderEmailData;
  rawItems?: any[];
  error?: string;
}> {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { error: `Order ${orderId} not found` };
  }

  let parsedNotes: any = {};
  if (order.notes) {
    try {
      parsedNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
    } catch {
      parsedNotes = {};
    }
  }

  let buyerEmail: string | null = null;
  let customerName = 'Customer';
  let customerPhone: string | undefined = undefined;

  if (order.user_id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone_number')
        .eq('id', order.user_id)
        .single();

      if (profile) {
        if (profile.email && isValidCustomerEmail(profile.email)) {
          buyerEmail = profile.email.trim();
        }
        const profileFullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        if (profileFullName) {
          customerName = profileFullName;
        }
        if (profile.phone_number) {
          customerPhone = profile.phone_number;
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
      if (authUser?.user) {
        if (!buyerEmail && authUser.user.email && isValidCustomerEmail(authUser.user.email)) {
          buyerEmail = authUser.user.email.trim();
        }
        const meta: any = authUser.user.user_metadata || {};
        if (customerName === 'Customer') {
          const metaName = (meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`).trim();
          if (metaName) customerName = metaName;
        }
        if (!customerPhone && (meta.phone || meta.phone_number || authUser.user.phone)) {
          customerPhone = String(meta.phone || meta.phone_number || authUser.user.phone);
        }
      }
    } catch {
      // ignore
    }
  }

  if (parsedNotes.contactDetails) {
    if (!buyerEmail && parsedNotes.contactDetails.userEmail && isValidCustomerEmail(parsedNotes.contactDetails.userEmail)) {
      buyerEmail = parsedNotes.contactDetails.userEmail.trim();
    }
    if (customerName === 'Customer' && parsedNotes.contactDetails.fullName) {
      customerName = parsedNotes.contactDetails.fullName.trim();
    }
    if (!customerPhone && parsedNotes.contactDetails.userPhone) {
      customerPhone = parsedNotes.contactDetails.userPhone;
    }
  }

  if (parsedNotes.shippingDetails) {
    if (customerName === 'Customer' && parsedNotes.shippingDetails.recipientName) {
      customerName = parsedNotes.shippingDetails.recipientName.trim();
    }
    if (!customerPhone && parsedNotes.shippingDetails.recipientPhone) {
      customerPhone = parsedNotes.shippingDetails.recipientPhone;
    }
  }

  const { data: rawItems } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const items: OrderEmailItem[] = (rawItems || []).map((i: any) => {
    const quantity = Number(i.quantity) || 1;
    const unitPrice = Number(i.unit_price) || 0;
    const lineTotal = Number(i.subtotal ?? i.total_price) || quantity * unitPrice;
    return {
      name: i.product_name || 'Grocery Item',
      quantity,
      unitPrice,
      lineTotal,
      image: i.product_image || undefined,
      productId: i.product_id || undefined
    };
  });

  let deliveryAddress = '';
  let deliveryMethod = 'standard';
  const deliveryFee = Number(order.delivery_fee) || 0;

  if (parsedNotes.shippingDetails) {
    const parts = [
      parsedNotes.shippingDetails.fullAddress,
      parsedNotes.shippingDetails.location
    ]
      .map((s) => (s || '').trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // Avoid repeating location if already inside fullAddress
      deliveryAddress =
        parts.length === 2 && parts[0].toLowerCase().includes(parts[1].toLowerCase())
          ? parts[0]
          : parts.join(' — ');
    }
  }

  if (!deliveryAddress && (order.address_id || order.user_id)) {
    try {
      let addrQuery = supabase.from('delivery_addresses').select('*');
      if (order.address_id) {
        addrQuery = addrQuery.eq('id', order.address_id);
      } else {
        addrQuery = addrQuery.eq('user_id', order.user_id).eq('is_default', true);
      }
      const { data: addr } = await addrQuery.limit(1).maybeSingle();
      if (addr) {
        const addrParts = [addr.street_building, addr.area_location, addr.town_city, addr.county]
          .map((s) => (s || '').trim())
          .filter(Boolean);
        if (addrParts.length > 0) {
          deliveryAddress = [...new Set(addrParts)].join(', ');
        }
        if (customerName === 'Customer' && addr.full_name) {
          customerName = addr.full_name.trim();
        }
        if (!customerPhone && addr.phone) {
          customerPhone = addr.phone;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!deliveryAddress) {
    deliveryAddress = 'Nairobi, Kenya';
  }

  if (parsedNotes.deliveryMethod) {
    deliveryMethod = parsedNotes.deliveryMethod;
  }

  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
  const trackingUrl = `${appUrl}/track-order?id=${orderId}`;
  const orderNumber = order.order_number || parsedNotes.orderNumber || `ODA-${orderId.substring(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailData: OrderEmailData = {
    customerName,
    customerEmail: buyerEmail || '',
    customerPhone,
    orderNumber,
    orderId,
    orderDate,
    items,
    subtotal: Number(order.subtotal) || Number(order.total) - deliveryFee,
    deliveryFee,
    discountAmount: Number(order.discount_amount) || 0,
    total: Number(order.total) || 0,
    deliveryMethod,
    deliveryAddress,
    recipientName: parsedNotes.shippingDetails?.recipientName || customerName,
    paymentMethod: parsedNotes.paymentMethod || 'M-Pesa (Paystack)',
    paymentStatus: order.payment_status === 'success' ? 'PAID' : (order.payment_status || 'PENDING').toUpperCase(),
    paymentReference: order.payment_reference || parsedNotes.paymentReference,
    orderStatus: order.status || 'processing',
    storeName: 'ODA Market Verified Fulfillment',
    trackingUrl
  };

  return { order, parsedNotes, emailData, rawItems: rawItems || [] };
}

/**
 * Sends an HTML + text email through Resend with automatic API-key failover
 * (if a key is domain-restricted or invalid) and automatic 429 rate-limit backoff retry.
 */
async function sendResendHtmlEmailWithFailover(params: {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; resendId?: string; error?: string }> {
  let activeClient = getResendClient();
  if (!activeClient) {
    return { success: false, error: 'RESEND_API_KEY is not configured on server' };
  }

  const { from, to, replyTo = 'info@odamarket.co.ke', subject, html, text, idempotencyKey } = params;
  const resolvedFrom = resolveValidFromEmail(from, 'ODA Market <orders@odamarket.co.ke>');

  let activeKey = getActiveResendApiKey();
  let attempt = 0;

  const isRateLimitError = (err: any): boolean => {
    if (!err) return false;
    const name = String(err.name || '').toLowerCase();
    const msg = String(err.message || err.error || '').toLowerCase();
    const status = Number(err.statusCode || err.status || 0);
    return (
      status === 429 ||
      name.includes('rate_limit') ||
      msg.includes('too many requests') ||
      msg.includes('rate limit')
    );
  };

  while (attempt < 12) {
    attempt += 1;
    const keySuffix = attempt === 1 ? '' : `-a${attempt}`;
    const sendRes = await activeClient.emails.send(
      {
        from: resolvedFrom,
        to: [to],
        replyTo,
        subject,
        html,
        ...(text ? { text } : {})
      },
      idempotencyKey ? { idempotencyKey: `${idempotencyKey}${keySuffix}` } : undefined
    );

    if (!sendRes.error) {
      return {
        success: true,
        resendId: sendRes.data?.id || `resend_${Date.now()}`
      };
    }

    // 1. Handle 429 burst rate-limit (2 req/s) with backoff on the SAME key
    if (isRateLimitError(sendRes.error)) {
      let rlRetry = 0;
      let rlRes = sendRes;
      while (rlRes.error && isRateLimitError(rlRes.error) && rlRetry < 4) {
        rlRetry += 1;
        await new Promise((r) => setTimeout(r, 650 * rlRetry));
        rlRes = await activeClient.emails.send(
          {
            from: resolvedFrom,
            to: [to],
            replyTo,
            subject,
            html,
            ...(text ? { text } : {})
          },
          idempotencyKey ? { idempotencyKey: `${idempotencyKey}${keySuffix}-rl${rlRetry}` } : undefined
        );
      }
      if (!rlRes.error) {
        return {
          success: true,
          resendId: rlRes.data?.id || `resend_${Date.now()}`
        };
      }
      if (!isUnverifiedDomainOrRestrictedKeyError(rlRes.error)) {
        return {
          success: false,
          error: rlRes.error.message || JSON.stringify(rlRes.error)
        };
      }
    }

    // 2. Handle domain-restricted / invalid key by failing over to next candidate key
    if (isUnverifiedDomainOrRestrictedKeyError(sendRes.error)) {
      const switched = markResendApiKeyRejected(activeKey, sendRes.error.message);
      if (!switched) {
        return {
          success: false,
          error: sendRes.error.message || JSON.stringify(sendRes.error)
        };
      }
      const nextClient = getResendClient();
      if (!nextClient) {
        return {
          success: false,
          error: sendRes.error.message || 'No valid Resend API keys remaining'
        };
      }
      activeClient = nextClient;
      activeKey = getActiveResendApiKey();
      // Brief pause so failover call does not trigger 2 req/sec rate limit
      await new Promise((r) => setTimeout(r, 550));
      continue;
    }

    return {
      success: false,
      error: sendRes.error.message || JSON.stringify(sendRes.error)
    };
  }

  return { success: false, error: 'Exhausted Resend dispatch attempts' };
}

/**
 * Formats an internal order status code into a human-friendly label
 */
function formatOrderStatusLabel(status?: string): string {
  const norm = (status || 'processing').toLowerCase().trim();
  switch (norm) {
    case 'confirmed':
      return 'Confirmed';
    case 'processing':
      return 'Confirmed & Processing';
    case 'packed':
      return 'Packed & Ready';
    case 'ready_for_pickup':
    case 'ready':
      return 'Ready for Pickup';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'shipped':
      return 'Shipped / On the Way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    case 'pending':
      return 'Pending';
    default:
      return norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Builds plain-text representation of an ODA Market order email
 */
export function buildOrderEmailPlainText(
  data: OrderEmailData,
  heading: string,
  introMessage: string
): string {
  const deliveryDisplay = data.deliveryFee > 0 ? formatCurrency(data.deliveryFee) : 'Free';
  const deliveryMethodLabel =
    data.deliveryMethod === 'express'
      ? 'Express Delivery (Same Day)'
      : data.deliveryMethod === 'pickup'
      ? 'Store Pickup'
      : 'Standard Delivery';

  const itemLines = (data.items || []).map(
    (item) => `  - ${item.name} | Qty: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.lineTotal)}`
  );

  return [
    `ODA MARKET - ${heading.toUpperCase()}`,
    `============================================================`,
    `Hello ${data.customerName || 'Valued Customer'},`,
    ``,
    introMessage,
    ``,
    `ORDER DETAILS`,
    `------------------------------------------------------------`,
    `Order ID: ${data.orderNumber}`,
    `Order Date: ${data.orderDate}`,
    `Order Status: ${formatOrderStatusLabel(data.orderStatus)}`,
    `Payment Status: ${data.paymentStatus || 'PAID'} (${data.paymentMethod || 'M-Pesa'})`,
    ...(data.paymentReference ? [`Payment Reference: ${data.paymentReference}`] : []),
    ``,
    `PRODUCTS ORDERED`,
    `------------------------------------------------------------`,
    ...(itemLines.length > 0 ? itemLines : ['  - Order items attached to your account']),
    ``,
    `ORDER SUMMARY`,
    `------------------------------------------------------------`,
    `Subtotal: ${formatCurrency(data.subtotal)}`,
    `Delivery (${deliveryMethodLabel}): ${deliveryDisplay}`,
    ...(data.discountAmount && data.discountAmount > 0 ? [`Discount: -${formatCurrency(data.discountAmount)}`] : []),
    `Order Total: ${formatCurrency(data.total)}`,
    ``,
    `DELIVERY INFORMATION`,
    `------------------------------------------------------------`,
    `Delivery Method: ${deliveryMethodLabel}`,
    `Delivery Address: ${data.deliveryAddress || 'Nairobi, Kenya'}`,
    `Recipient: ${data.recipientName || data.customerName}`,
    ...(data.customerPhone ? [`Phone: ${data.customerPhone}`] : []),
    ``,
    `View & Track Your Order: ${data.trackingUrl}`,
    ``,
    `Need help? Contact ODA Market Support at info@odamarket.co.ke or call/WhatsApp +254 792 867386.`,
    `© ${new Date().getFullYear()} ODA Market • Nairobi, Kenya`
  ].join('\n');
}

/**
 * Builds responsive, email-client compatible HTML matching ODA Market brand guidelines
 * Contains all required fields: Buyer Name, Order ID, Products Ordered, Quantities,
 * Order Total, Payment Status, Delivery Information, Order Date, and View Order Button.
 */
export function buildOrderConfirmationEmailHtml(data: OrderEmailData): string {
  const {
    customerName,
    customerPhone,
    recipientName,
    orderNumber,
    orderDate,
    items,
    subtotal,
    deliveryFee,
    discountAmount = 0,
    total,
    deliveryMethod,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    paymentReference,
    orderStatus,
    storeName,
    trackingUrl,
  } = data;

  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
  const deliveryDisplay = deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free';
  const deliveryMethodLabel =
    deliveryMethod === 'express'
      ? 'Express Delivery (Same Day)'
      : deliveryMethod === 'pickup'
      ? 'Store Pickup'
      : 'Standard Delivery';
  const totalQuantity = (items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const statusLabel = formatOrderStatusLabel(orderStatus);

  // Render product line items with explicit Product Name, Quantity, Unit Price, and Line Total
  const itemsHtml = (items || []).map((item) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0E6D8; vertical-align: top;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #3A2418; line-height: 1.4;">
                ${item.name}
              </p>
              <p style="margin: 0; font-size: 13px; color: #8B857D; line-height: 1.4;">
                Quantity: <strong style="color: #3A2418;">${item.quantity}</strong> &times; ${formatCurrency(item.unitPrice)}
              </p>
            </td>
            <td align="right" style="vertical-align: top; white-space: nowrap; padding-left: 12px;">
              <span style="font-size: 14px; font-weight: 700; color: #3A2418;">
                ${formatCurrency(item.lineTotal)}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed: ${orderNumber} - ODA Market</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF5EC; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid-padding { padding-left: 18px !important; padding-right: 18px !important; }
      .col-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 12px 40px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(58, 36, 24, 0.08); border: 1px solid #E8DCC9;">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #D96A27 0%, #F49C64 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px; text-align: center;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none;">
                <h1 style="margin: 0; color: #D96A27; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                  ODA MARKET
                </h1>
              </a>
              <p style="margin: 5px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                Fresh Groceries Delivered
              </p>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #16A34A; color: #FFFFFF; border-radius: 50%; font-size: 22px; font-weight: bold; margin-bottom: 8px;">
                      &#10003;
                    </div>
                    <h2 style="margin: 4px 0 6px 0; color: #166534; font-size: 22px; font-weight: 800; line-height: 1.3;">
                      Order Confirmed
                    </h2>
                    <p style="margin: 0; color: #15803D; font-size: 14px; font-weight: 600; line-height: 1.5;">
                      Payment Status: ${paymentStatus || 'PAID'} via ${paymentMethod || 'M-Pesa (Paystack)'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 20px 32px;">
              <p style="margin: 0 0 12px 0; color: #3A2418; font-size: 16px; font-weight: 600; line-height: 1.5;">
                Hello ${customerName || 'Valued Customer'},
              </p>
              <p style="margin: 0; color: #5F5A54; font-size: 15px; line-height: 1.6;">
                Thank you for shopping with <strong>ODA Market</strong>! Your payment has been verified and your order <strong>${orderNumber}</strong> is now confirmed and being prepared by our fulfillment team.
              </p>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D; width: 42%;">Buyer Name:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #3A2418;">${customerName || 'Valued Customer'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order ID:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #D96A27; font-family: monospace;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Date:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #3A2418;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Payment Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #16A34A;">${paymentStatus || 'PAID'} (${paymentMethod || 'M-Pesa'})</td>
                  </tr>
                  ${paymentReference ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Payment Reference:</td>
                    <td align="right" style="padding: 5px 0; font-size: 12px; font-weight: 500; color: #5F5A54; font-family: monospace;">${paymentReference}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #D96A27; text-transform: uppercase;">${statusLabel}</td>
                  </tr>
                  ${storeName ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Fulfillment:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #3A2418;">${storeName}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 20px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #3A2418; border-bottom: 2px solid #E8DCC9; padding-bottom: 8px;">
                Products Ordered (${totalQuantity} ${totalQuantity === 1 ? 'Item' : 'Items'})
              </h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; border-radius: 12px; padding: 18px 20px; border: 1px solid #E8DCC9;">
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Subtotal:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Delivery Fee (${deliveryMethodLabel}):</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${deliveryDisplay}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #16A34A;">Discount Applied:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #16A34A;">-${formatCurrency(discountAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">Order Total:</td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">${formatCurrency(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #3A2418; text-transform: uppercase; letter-spacing: 0.5px;">
                  Delivery Information
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #3A2418;">
                  <strong>Method:</strong> ${deliveryMethodLabel}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #5F5A54; line-height: 1.5;">
                  <strong>Delivery Address:</strong> ${deliveryAddress || 'Nairobi, Kenya'}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #5F5A54;">
                  <strong>Recipient:</strong> ${recipientName || customerName}
                </p>
                ${customerPhone ? `
                <p style="margin: 0; font-size: 14px; color: #5F5A54;">
                  <strong>Phone:</strong> ${customerPhone}
                </p>
                ` : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 32px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #D96A27;">
                          <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 16px 38px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27; box-shadow: 0 4px 14px rgba(217, 106, 39, 0.35); text-align: center;">
                            View My Order &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 14px 0 0 0; color: #8B857D; font-size: 12px; line-height: 1.5;">
                You can also view all your orders and download invoices anytime in <a href="${appUrl}/buyer/dashboard/orders" target="_blank" style="color: #D96A27; text-decoration: underline; font-weight: 600;">My Orders</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 28px 32px;">
              <div style="border-top: 1px solid #F0E6D8; padding-top: 20px;">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #3A2418;">
                  Need assistance with your order?
                </h4>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #5F5A54; line-height: 1.5;">
                  Our Nairobi customer support team is ready to help:
                </p>
                <p style="margin: 0; font-size: 13px; color: #5F5A54; line-height: 1.6;">
                  &bull; Email: <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none; font-weight: 600;">info@odamarket.co.ke</a><br/>
                  &bull; Phone / WhatsApp: <a href="tel:+254792867386" style="color: #D96A27; text-decoration: none; font-weight: 600;">+254 792 867386 (0792867386)</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF5EC; padding: 24px 30px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0 0 6px 0; color: #3A2418; font-size: 12px; font-weight: 700;">
                &copy; ${new Date().getFullYear()} ODA Market. All rights reserved.
              </p>
              <p style="margin: 0; color: #8B857D; font-size: 12px; line-height: 1.5;">
                Nairobi, Kenya &bull; Fresh Farm Produce &amp; Groceries
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

/**
 * Builds responsive, ODA Market-branded HTML for Order Status Change notifications:
 * - order_confirmed ('confirmed')
 * - order_ready ('ready_for_pickup', 'packed', 'ready')
 * - order_shipped ('shipped', 'out_for_delivery')
 * - order_delivered ('delivered')
 * - order_cancelled ('cancelled', 'refunded')
 */
export function buildOrderStatusEmailHtml(
  data: OrderEmailData,
  eventType: 'order_confirmed' | 'order_ready' | 'order_shipped' | 'order_delivered' | 'order_cancelled'
): { subject: string; html: string; text: string } {
  const {
    customerName,
    customerPhone,
    recipientName,
    orderNumber,
    orderDate,
    items,
    subtotal,
    deliveryFee,
    discountAmount = 0,
    total,
    deliveryMethod,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    paymentReference,
    orderStatus,
    trackingUrl
  } = data;

  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
  const deliveryDisplay = deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free';
  const deliveryMethodLabel =
    deliveryMethod === 'express'
      ? 'Express Delivery (Same Day)'
      : deliveryMethod === 'pickup'
      ? 'Store Pickup'
      : 'Standard Delivery';
  const totalQuantity = (items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const statusLabel = formatOrderStatusLabel(orderStatus);

  let subject = `Order Update: ${orderNumber} - ODA Market`;
  let bannerBg = '#F0FDF4';
  let bannerBorder = '#BBF7D0';
  let badgeBg = '#16A34A';
  let titleColor = '#166534';
  let subtitleColor = '#15803D';
  let topBarGradient = 'linear-gradient(90deg, #D96A27 0%, #16A34A 100%)';
  let heroIcon = '&#10003;';
  let heroTitle = 'Order Confirmed';
  let heroSubtitle = `Order ${orderNumber} • Status: ${statusLabel}`;
  let introMessage = `Your order ${orderNumber} has been confirmed by our team and is being prepared for ${deliveryMethodLabel}.`;
  let ctaLabel = 'View My Order &rarr;';

  if (eventType === 'order_confirmed') {
    subject = `Order Confirmed: ${orderNumber} - ODA Market`;
    heroTitle = 'Order Confirmed';
    heroSubtitle = `Order ${orderNumber} is Confirmed`;
    introMessage = `Your order ${orderNumber} has been confirmed by ODA Market and is now being prepared for ${deliveryMethodLabel}.`;
  } else if (eventType === 'order_ready') {
    const isPickup = (orderStatus || '').toLowerCase() === 'ready_for_pickup' || deliveryMethod === 'pickup';
    subject = isPickup
      ? `Your Order ${orderNumber} is Ready for Pickup - ODA Market`
      : `Your Order ${orderNumber} is Packed & Ready - ODA Market`;
    bannerBg = '#FFFBEB';
    bannerBorder = '#FDE68A';
    badgeBg = '#D97706';
    titleColor = '#92400E';
    subtitleColor = '#B45309';
    heroIcon = '&#128230;';
    heroTitle = isPickup ? 'Order Ready for Pickup!' : 'Your Order is Ready!';
    heroSubtitle = `Order ${orderNumber} • Status: ${statusLabel}`;
    introMessage = isPickup
      ? `Great news! Your fresh groceries for order ${orderNumber} have been packed and are ready for pickup.`
      : `Great news! Your fresh groceries for order ${orderNumber} have been packed and are ready for ${deliveryMethodLabel}.`;
    ctaLabel = 'Track Order Status &rarr;';
  } else if (eventType === 'order_shipped') {
    const isOutForDelivery = (orderStatus || '').toLowerCase() === 'out_for_delivery';
    subject = isOutForDelivery
      ? `Your Order ${orderNumber} is Out for Delivery - ODA Market`
      : `Your Order ${orderNumber} Has Shipped - ODA Market`;
    bannerBg = '#EFF6FF';
    bannerBorder = '#BFDBFE';
    badgeBg = '#2563EB';
    titleColor = '#1E40AF';
    subtitleColor = '#1D4ED8';
    topBarGradient = 'linear-gradient(90deg, #D96A27 0%, #2563EB 100%)';
    heroIcon = '&#128666;';
    heroTitle = isOutForDelivery ? 'Out for Delivery!' : 'Your Order is On the Way!';
    heroSubtitle = `Order ${orderNumber} • Status: ${statusLabel}`;
    introMessage = `Your order ${orderNumber} has been dispatched and is on its way to ${deliveryAddress || 'your delivery address'}. Please keep your phone (${customerPhone || 'registered number'}) reachable for our delivery rider.`;
    ctaLabel = 'Track My Delivery &rarr;';
  } else if (eventType === 'order_delivered') {
    subject = `Order Delivered: ${orderNumber} - ODA Market`;
    bannerBg = '#F0FDF4';
    bannerBorder = '#BBF7D0';
    badgeBg = '#16A34A';
    titleColor = '#166534';
    subtitleColor = '#15803D';
    topBarGradient = 'linear-gradient(90deg, #16A34A 0%, #D96A27 100%)';
    heroIcon = '&#10003;';
    heroTitle = 'Order Delivered!';
    heroSubtitle = `Order ${orderNumber} • Delivered`;
    introMessage = `Your order ${orderNumber} has been delivered! Thank you for shopping with ODA Market. You can view your order receipt, download your invoice, or rate your products anytime from your account.`;
    ctaLabel = 'View Order & Rate Products &rarr;';
  } else if (eventType === 'order_cancelled') {
    subject = `Order Cancelled: ${orderNumber} - ODA Market`;
    bannerBg = '#FEF2F2';
    bannerBorder = '#FECACA';
    badgeBg = '#DC2626';
    titleColor = '#991B1B';
    subtitleColor = '#B91C1C';
    topBarGradient = 'linear-gradient(90deg, #6B7280 0%, #DC2626 100%)';
    heroIcon = '&#10005;';
    heroTitle = `Order ${orderNumber} Cancelled`;
    heroSubtitle = `Status: ${statusLabel}`;
    introMessage = `Your order ${orderNumber} (Total: ${formatCurrency(total)}) has been marked as ${statusLabel}. If you already paid for this order and require refund assistance, or if you have any questions, please reply to this email or contact ODA Market Support at +254 792 867386.`;
    ctaLabel = 'View Order Details &rarr;';
  }

  const itemsHtml = (items || []).map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #F0E6D8; vertical-align: top;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #3A2418; line-height: 1.4;">
                ${item.name}
              </p>
              <p style="margin: 0; font-size: 13px; color: #8B857D; line-height: 1.4;">
                Quantity: <strong style="color: #3A2418;">${item.quantity}</strong> &times; ${formatCurrency(item.unitPrice)}
              </p>
            </td>
            <td align="right" style="vertical-align: top; white-space: nowrap; padding-left: 12px;">
              <span style="font-size: 14px; font-weight: 700; color: #3A2418;">
                ${formatCurrency(item.lineTotal)}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; padding: 30px 12px 40px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DCC9; box-shadow: 0 10px 30px rgba(58, 36, 24, 0.08);">
          <tr>
            <td style="height: 6px; background: ${topBarGradient};"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px; text-align: center;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none;">
                <h1 style="margin: 0; color: #D96A27; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">ODA MARKET</h1>
              </a>
              <p style="margin: 5px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Order Status Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bannerBg}; border: 1px solid ${bannerBorder}; border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: ${badgeBg}; color: #FFFFFF; border-radius: 50%; font-size: 20px; font-weight: bold; margin-bottom: 8px;">
                      ${heroIcon}
                    </div>
                    <h2 style="margin: 4px 0 6px 0; color: ${titleColor}; font-size: 22px; font-weight: 800;">${heroTitle}</h2>
                    <p style="margin: 0; color: ${subtitleColor}; font-size: 14px; font-weight: 600;">${heroSubtitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <p style="margin: 0 0 12px 0; color: #3A2418; font-size: 16px; font-weight: 600;">Hello ${customerName || 'Valued Customer'},</p>
              <p style="margin: 0; color: #5F5A54; font-size: 15px; line-height: 1.6;">${introMessage}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D; width: 42%;">Buyer Name:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #3A2418;">${customerName || 'Valued Customer'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order ID:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #D96A27; font-family: monospace;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Date:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #3A2418;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Order Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: ${titleColor}; text-transform: uppercase;">${statusLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Payment Status:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: ${paymentStatus === 'PAID' ? '#16A34A' : '#3A2418'};">${paymentStatus || 'PAID'} (${paymentMethod || 'M-Pesa'})</td>
                  </tr>
                  ${paymentReference ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #8B857D;">Payment Reference:</td>
                    <td align="right" style="padding: 5px 0; font-size: 12px; font-weight: 500; color: #5F5A54; font-family: monospace;">${paymentReference}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #3A2418; border-bottom: 2px solid #E8DCC9; padding-bottom: 8px;">
                Products Ordered (${totalQuantity} ${totalQuantity === 1 ? 'Item' : 'Items'})
              </h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; border-radius: 12px; padding: 18px 20px; border: 1px solid #E8DCC9;">
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Subtotal:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #5F5A54;">Delivery Fee (${deliveryMethodLabel}):</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #3A2418;">${deliveryDisplay}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #16A34A;">Discount Applied:</td>
                  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 600; color: #16A34A;">-${formatCurrency(discountAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">Order Total:</td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #D96A27; border-top: 1px solid #E8DCC9;">${formatCurrency(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; padding: 18px 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #3A2418; text-transform: uppercase; letter-spacing: 0.5px;">
                  Delivery Information
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #3A2418;">
                  <strong>Method:</strong> ${deliveryMethodLabel}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #5F5A54; line-height: 1.5;">
                  <strong>Delivery Address:</strong> ${deliveryAddress || 'Nairobi, Kenya'}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #5F5A54;">
                  <strong>Recipient:</strong> ${recipientName || customerName}
                </p>
                ${customerPhone ? `
                <p style="margin: 0; font-size: 14px; color: #5F5A54;">
                  <strong>Phone:</strong> ${customerPhone}
                </p>
                ` : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 16px 38px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27;">
                ${ctaLabel}
              </a>
              <p style="margin: 14px 0 0 0; color: #8B857D; font-size: 12px;">
                Or view your full order history at <a href="${appUrl}/buyer/dashboard/orders" target="_blank" style="color: #D96A27; text-decoration: underline; font-weight: 600;">My Orders</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF5EC; padding: 24px 30px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0 0 6px 0; color: #3A2418; font-size: 12px; font-weight: 700;">&copy; ${new Date().getFullYear()} ODA Market. All rights reserved.</p>
              <p style="margin: 0; color: #8B857D; font-size: 12px;">Need help? Contact <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none;">info@odamarket.co.ke</a> or call/WhatsApp +254 792 867386</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = buildOrderEmailPlainText(data, heroTitle, introMessage);
  return { subject, html, text };
}

export interface BroadcastProductItem {
  id: string;
  name: string;
  priceFormatted: string;
  imageUrl: string;
  productUrl: string;
}

export interface BroadcastEmailOptions {
  headline?: string;
  introMessage?: string;
  products?: BroadcastProductItem[];
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Builds a clean, premium, mobile-responsive HTML promotional broadcast email for ODA Market.
 * Features real products, actual prices, live product images, and a single clear "Shop Now" button.
 */
export function buildBroadcastEmailHtml(options: BroadcastEmailOptions = {}): { subject: string; html: string; text: string } {
  const {
    headline = 'Featured Products',
    introMessage = 'Explore current pricing on popular grocery essentials available for delivery across Nairobi.',
    ctaText = 'Shop Now &rarr;',
    ctaUrl = 'https://odamarket.co.ke',
    unsubscribeUrl = 'https://odamarket.co.ke/profile'
  } = options;

  // Real ODA Market products directly from the database
  const defaultProducts: BroadcastProductItem[] = [
    {
      id: '76862c1f-d8ce-4329-b1f8-ab7bef6c9706',
      name: '25kg BIRIYANI Rice',
      priceFormatted: 'KSh 2,100',
      imageUrl: 'https://vjzgqhsvgknmnjpaefvy.supabase.co/storage/v1/object/public/products/product-images/0.9951940623077672.jpg',
      productUrl: 'https://odamarket.co.ke/products/76862c1f-d8ce-4329-b1f8-ab7bef6c9706'
    },
    {
      id: '2f0688a2-d7f4-4d10-84e2-df17629f8502',
      name: 'CIL Blended Long Grain Rice 2Kg',
      priceFormatted: 'KSh 360',
      imageUrl: 'https://vjzgqhsvgknmnjpaefvy.supabase.co/storage/v1/object/public/products/product-images/0.6112465496460913.jpeg',
      productUrl: 'https://odamarket.co.ke/products/2f0688a2-d7f4-4d10-84e2-df17629f8502'
    },
    {
      id: 'b4511c9d-91dc-418c-af9a-58d24e68dad5',
      name: 'Soko Maize Meal 2Kg',
      priceFormatted: 'KSh 161',
      imageUrl: 'https://vjzgqhsvgknmnjpaefvy.supabase.co/storage/v1/object/public/products/product-images/0.10452747601319312.jpeg',
      productUrl: 'https://odamarket.co.ke/products/b4511c9d-91dc-418c-af9a-58d24e68dad5'
    },
    {
      id: 'd3b143b6-20ee-4945-b19c-bbd9d01b7e2e',
      name: 'Prestige Margarine Original 500G',
      priceFormatted: 'KSh 300',
      imageUrl: 'https://vjzgqhsvgknmnjpaefvy.supabase.co/storage/v1/object/public/products/product-images/0.39748895025458664.jpeg',
      productUrl: 'https://odamarket.co.ke/products/d3b143b6-20ee-4945-b19c-bbd9d01b7e2e'
    }
  ];

  const products = (options.products && options.products.length > 0) ? options.products : defaultProducts;

  // Render products into a clean responsive 2-column email table
  const productRowsHtml: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const p1 = products[i];
    const p2 = products[i + 1];

    const renderCard = (p: BroadcastProductItem) => `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF8; border: 1px solid #E8DCC9; border-radius: 12px; overflow: hidden; height: 100%;">
        <tr>
          <td align="center" style="background-color: #FAF5EC; padding: 14px;">
            <a href="${p.productUrl}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${p.imageUrl}" alt="${p.name}" width="220" height="180" class="product-img" style="width: 100%; max-width: 220px; height: 180px; object-fit: contain; margin: 0 auto; border-radius: 8px;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; line-height: 1.3;">
              <a href="${p.productUrl}" target="_blank" class="product-link" style="color: #3A2418; text-decoration: none;">
                ${p.name}
              </a>
            </h3>
            <p style="margin: 0; font-size: 18px; font-weight: 800; color: #D96A27;">
              ${p.priceFormatted}
            </p>
          </td>
        </tr>
      </table>
    `;

    productRowsHtml.push(`
      <tr>
        <td class="fluid-padding" style="padding: 0 24px ${i + 2 >= products.length ? '28px' : '16px'} 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="${p2 ? '48%' : '100%'}" class="col-stack ${p2 ? 'col-pad' : ''}" style="vertical-align: top;">
                ${renderCard(p1)}
              </td>
              ${p2 ? `
              <td width="4%" class="col-stack" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <td width="48%" class="col-stack" style="vertical-align: top;">
                ${renderCard(p2)}
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
    `);
  }

  const subject = 'Featured Products - ODA Market';
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF5EC; color: #3A2418; }
    .btn-shop:hover { background-color: #C65A28 !important; }
    .product-link:hover { color: #D96A27 !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .col-stack { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
      .col-pad { padding-left: 0 !important; padding-right: 0 !important; padding-bottom: 16px !important; }
      .product-img { width: 100% !important; height: auto !important; max-height: 220px !important; object-fit: contain !important; }
      .btn-shop { width: 100% !important; display: block !important; padding: 16px 20px !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preview Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    Featured groceries and daily essentials available now on ODA Market.
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px 40px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DCC9; box-shadow: 0 4px 20px rgba(58, 36, 24, 0.05);">
          <!-- Top Brand Accent -->
          <tr>
            <td style="height: 6px; background-color: #D96A27;"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px; text-align: center;">
              <a href="${ctaUrl}" target="_blank" style="text-decoration: none;">
                <h1 style="margin: 0; color: #D96A27; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">
                  ODA MARKET
                </h1>
                <p style="margin: 6px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                  Fresh Groceries &bull; Nairobi
                </p>
              </a>
            </td>
          </tr>

          <!-- Simple Headline -->
          <tr>
            <td class="fluid-padding" style="padding: 0 32px 24px 32px; text-align: center;">
              <h2 style="margin: 0 0 8px 0; color: #3A2418; font-size: 24px; font-weight: 800; line-height: 1.3;">
                ${headline}
              </h2>
              <p style="margin: 0; color: #5F5A54; font-size: 15px; line-height: 1.5;">
                ${introMessage}
              </p>
            </td>
          </tr>

          <!-- Products Grid -->
          ${productRowsHtml.join('')}

          <!-- Single Clear "Shop Now" Button -->
          <tr>
            <td align="center" style="padding: 0 24px 36px 24px;">
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #D96A27;">
                    <a href="${ctaUrl}" target="_blank" class="btn-shop" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #D96A27; text-align: center; letter-spacing: 0.2px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clean Minimal Footer -->
          <tr>
            <td style="background-color: #FAF5EC; padding: 22px 24px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0 0 6px 0; color: #3A2418; font-size: 12px; font-weight: 700;">
                ODA Market &bull; Nairobi, Kenya
              </p>
              <p style="margin: 0 0 8px 0; color: #8B857D; font-size: 12px;">
                <a href="${ctaUrl}" target="_blank" style="color: #D96A27; text-decoration: none; font-weight: 600;">odamarket.co.ke</a> &bull;
                <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none; font-weight: 600;">info@odamarket.co.ke</a>
              </p>
              <p style="margin: 0; color: #8B857D; font-size: 11px;">
                <a href="${unsubscribeUrl}" target="_blank" style="color: #8B857D; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    `ODA MARKET - Fresh Groceries Delivered • Nairobi`,
    `================================================`,
    headline,
    ``,
    introMessage,
    ``,
    `FEATURED PRODUCTS:`,
    ...products.map(p => `• ${p.name} - ${p.priceFormatted} (${p.productUrl})`),
    ``,
    `Shop Now: ${ctaUrl}`,
    ``,
    `ODA Market • Nairobi, Kenya`,
    `info@odamarket.co.ke | odamarket.co.ke`,
    `Unsubscribe: ${unsubscribeUrl}`
  ];

  return { subject, html, text: textLines.join('\n') };
}

/**
 * Dispatches an ODA Market promotional broadcast email to a recipient or list of recipients using Resend
 * with automatic API key failover, rate-limit retry, and logging.
 */
export async function sendBroadcastEmail(params: {
  to: string | string[];
  subject?: string;
  options?: BroadcastEmailOptions;
  idempotencyKey?: string;
}): Promise<{ success: boolean; resendId?: string; error?: string }> {
  const { to, subject: customSubject, options = {}, idempotencyKey } = params;
  const { subject, html, text } = buildBroadcastEmailHtml(options);
  const fromSender = resolveValidFromEmail(
    process.env.RESEND_FROM_EMAIL,
    'ODA Market <orders@odamarket.co.ke>'
  );

  const recipientList = Array.isArray(to) ? to : [to];
  const validRecipients = recipientList.map(r => (r || '').trim()).filter(r => isValidCustomerEmail(r));

  if (validRecipients.length === 0) {
    return { success: false, error: 'No valid recipient email address provided' };
  }

  // Resend supports sending to up to 50 recipients per batch or individual send
  const targetRecipient = validRecipients.length === 1 ? validRecipients[0] : validRecipients;

  return await sendResendHtmlEmailWithFailover({
    from: fromSender,
    to: targetRecipient as any,
    replyTo: 'info@odamarket.co.ke',
    subject: customSubject || subject,
    html,
    text,
    idempotencyKey
  });
}

/**
 * 1. ORDER CONFIRMATION EMAIL
 * Strictly requires verified payment before dispatching.
 */
export async function sendOrderConfirmationEmailForOrder(
  orderId: string,
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) {
    console.warn('[Resend Email] Missing orderId for confirmation email.');
    return { success: false, error: 'Missing orderId' };
  }

  const lockKey = `order_confirmation:${cleanOrderId}`;
  if (!options.forceResend && inFlightDispatches.has(lockKey)) {
    return inFlightDispatches.get(lockKey)!;
  }

  const task = (async (): Promise<SendOrderEmailResult> => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('[Resend Email] Supabase admin client unavailable.');
      return { success: false, error: 'Database configuration unavailable' };
    }

    try {
      const ctx = await loadOrderEmailContext(supabase, cleanOrderId);
      if (ctx.error || !ctx.order || !ctx.emailData) {
        console.error(`[Resend Email] Order ${cleanOrderId} not found.`);
        return { success: false, error: ctx.error || `Order ${cleanOrderId} not found` };
      }

      const { order, emailData } = ctx;
      logEmailDiagnostics(`Order ${cleanOrderId} (status=${order.status}, payment=${order.payment_status})`);

      // Strict Payment Verification Guard:
      // NEVER send order confirmation if payment is pending, failed, cancelled, or abandoned
      const isPaid =
        order.payment_status === 'success' ||
        ['processing', 'paid', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'shipped', 'delivered'].includes(order.status);

      if (!isPaid || order.payment_status === 'failed' || order.payment_status === 'abandoned') {
        console.warn(
          `[Resend Email] Skipped: Order ${cleanOrderId} is not confirmed/paid (status: ${order.status}, payment_status: ${order.payment_status}).`
        );
        return {
          success: false,
          skipped: true,
          reason: `Order is not paid (status: ${order.status}, payment_status: ${order.payment_status})`
        };
      }

      // Idempotency Check
      const idemp = await checkEmailEventAlreadySent(supabase, order, 'order_confirmation', emailData.customerEmail);
      if (idemp.alreadySent && !options.forceResend) {
        console.log(
          `[Resend Email] ℹ️ Idempotency: Order ${cleanOrderId} confirmation email already sent at ${idemp.sentAt || 'prior execution'}. Skipping.`
        );
        return {
          success: true,
          skipped: true,
          alreadySent: true,
          orderId: cleanOrderId,
          sentAt: idemp.sentAt,
          resendId: idemp.resendId
        };
      }

      if (!emailData.customerEmail || !isValidCustomerEmail(emailData.customerEmail)) {
        console.warn(`[Resend Email] ⚠️ No valid customer email found for order ${cleanOrderId}. Buyer ID: ${order.user_id}`);
        await recordOrderEmailEvent({
          supabase,
          order,
          eventType: 'order_confirmation',
          recipientEmail: emailData.customerEmail || 'invalid',
          status: 'failed',
          errorMessage: 'No valid customer email address found'
        });
        return {
          success: false,
          error: 'No valid customer email address found for this order'
        };
      }

      if (!getResendClient()) {
        console.warn('[Resend Email] ⚠️ RESEND_API_KEY is not configured in environment. Skipping email dispatch.');
        await recordOrderEmailEvent({
          supabase,
          order,
          eventType: 'order_confirmation',
          recipientEmail: emailData.customerEmail,
          status: 'failed',
          errorMessage: 'RESEND_API_KEY missing on server'
        });
        return {
          success: false,
          error: 'RESEND_API_KEY is not configured on server'
        };
      }

      const idempotencyKey = options.forceResend
        ? `oda-order-confirmation-${cleanOrderId}-force-${Date.now()}`
        : `oda-order-confirmation-${cleanOrderId}`;

      const fromSender = resolveValidFromEmail(
        process.env.RESEND_FROM_EMAIL,
        'ODA Market <orders@odamarket.co.ke>'
      );
      const html = buildOrderConfirmationEmailHtml(emailData);
      const text = buildOrderEmailPlainText(
        emailData,
        'Order Confirmed',
        `Thank you for shopping with ODA Market! Your payment has been verified and your order ${emailData.orderNumber} is now confirmed and being prepared by our fulfillment team.`
      );

      console.log(
        `[Resend Email] 📤 Dispatching Order Confirmation email to ${emailData.customerEmail} for ${emailData.orderNumber}...`
      );

      const sendResult = await sendResendHtmlEmailWithFailover({
        from: fromSender,
        to: emailData.customerEmail,
        replyTo: 'info@odamarket.co.ke',
        subject: `Order Confirmed: ${emailData.orderNumber} - ODA Market`,
        html,
        text,
        idempotencyKey
      });

      if (!sendResult.success) {
        console.error(`[Resend Email] ❌ Resend API returned error for order ${cleanOrderId}:`, sendResult.error);
        await recordOrderEmailEvent({
          supabase,
          order,
          eventType: 'order_confirmation',
          recipientEmail: emailData.customerEmail,
          status: 'failed',
          errorMessage: sendResult.error || 'Resend error'
        });
        return {
          success: false,
          error: sendResult.error || 'Resend error'
        };
      }

      const resendId = sendResult.resendId || `resend_${Date.now()}`;
      const sentAtIso = new Date().toISOString();
      console.log(
        `[Resend Email] ✅ Successfully sent order confirmation to ${emailData.customerEmail}! (Resend ID: ${resendId})`
      );

      await recordOrderEmailEvent({
        supabase,
        order,
        eventType: 'order_confirmation',
        recipientEmail: emailData.customerEmail,
        status: 'sent',
        resendId
      });

      // Notify seller(s) if products belong to registered supplier accounts
      try {
        await sendSellerNewOrderEmailForOrder(cleanOrderId);
      } catch (sellerErr) {
        console.warn(`[Resend Email] Non-fatal notice on seller_new_order template:`, sellerErr);
      }

      return {
        success: true,
        orderId: cleanOrderId,
        resendId,
        sentAt: sentAtIso,
        recipient: emailData.customerEmail
      };
    } catch (error: any) {
      console.error(`[Resend Email] ❌ Unexpected exception sending confirmation email for order ${cleanOrderId}:`, error);
      return {
        success: false,
        error: error.message || 'Unexpected exception'
      };
    }
  })();

  inFlightDispatches.set(lockKey, task);
  try {
    return await task;
  } finally {
    inFlightDispatches.delete(lockKey);
  }
}

/**
 * 2. PAYMENT SUCCESSFUL TEMPLATE EMAIL
 * Dispatches only if RESEND_PAYMENT_SUCCESS_TEMPLATE_ID is configured (or discovered in Resend)
 * and distinct from RESEND_ORDER_CONFIRMATION_TEMPLATE_ID, and strictly after payment is verified.
 */
export async function sendPaymentSuccessEmailForOrder(
  orderId: string,
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) return { success: false, error: 'Missing orderId' };

  const templateId = await resolveResendTemplateId('payment_success');
  const orderConfirmTemplateId = await resolveResendTemplateId('order_confirmation');

  if (!templateId || (orderConfirmTemplateId && templateId === orderConfirmTemplateId)) {
    return {
      success: true,
      skipped: true,
      reason: 'RESEND_PAYMENT_SUCCESS_TEMPLATE_ID not separately configured'
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: 'Database configuration unavailable' };

  const ctx = await loadOrderEmailContext(supabase, cleanOrderId);
  if (ctx.error || !ctx.order || !ctx.emailData) {
    return { success: false, error: ctx.error || 'Order not found' };
  }

  const { order, emailData } = ctx;
  const isPaid =
    order.payment_status === 'success' ||
    ['processing', 'paid', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'shipped', 'delivered'].includes(order.status);

  if (!isPaid || order.payment_status === 'failed' || order.payment_status === 'abandoned') {
    return {
      success: false,
      skipped: true,
      reason: `Order ${cleanOrderId} is not paid`
    };
  }

  const idemp = await checkEmailEventAlreadySent(supabase, order, 'payment_success', emailData.customerEmail);
  if (idemp.alreadySent && !options.forceResend) {
    return {
      success: true,
      skipped: true,
      alreadySent: true,
      orderId: cleanOrderId,
      sentAt: idemp.sentAt,
      resendId: idemp.resendId
    };
  }

  if (!isValidCustomerEmail(emailData.customerEmail)) {
    return { success: false, error: 'Invalid customer email' };
  }

  const { stringVariables, numericVariables } = buildOrderTemplateVariables(emailData);
  const res = await dispatchResendTemplateEmail({
    templateIdOrAlias: templateId,
    to: emailData.customerEmail,
    defaultSubject: `Payment Received: ${emailData.orderNumber} - ODA Market`,
    stringVariables,
    numericVariables,
    idempotencyKey: options.forceResend
      ? `oda-payment-success-${cleanOrderId}-${Date.now()}`
      : `oda-payment-success-${cleanOrderId}`
  });

  await recordOrderEmailEvent({
    supabase,
    order,
    eventType: 'payment_success',
    recipientEmail: emailData.customerEmail,
    status: res.success ? 'sent' : 'failed',
    resendId: res.resendId,
    templateId: res.templateId || templateId,
    errorMessage: res.error
  });

  return {
    success: res.success,
    orderId: cleanOrderId,
    resendId: res.resendId,
    templateId: res.templateId || templateId,
    recipient: emailData.customerEmail,
    error: res.error
  };
}

/**
 * 3. PAYMENT FAILED TEMPLATE EMAIL
 * Dispatches when a Paystack transaction explicitly fails (never marks order paid).
 */
export async function sendPaymentFailedEmailForOrder(
  orderId: string,
  paymentReference?: string,
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) return { success: false, error: 'Missing orderId' };

  const templateId = await resolveResendTemplateId('payment_failed');
  if (!templateId) {
    return {
      success: true,
      skipped: true,
      reason: 'RESEND_PAYMENT_FAILED_TEMPLATE_ID not configured'
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: 'Database configuration unavailable' };

  const ctx = await loadOrderEmailContext(supabase, cleanOrderId);
  if (ctx.error || !ctx.order || !ctx.emailData) {
    return { success: false, error: ctx.error || 'Order not found' };
  }

  const { order, emailData } = ctx;
  // Never send a payment failed email for an order that has already succeeded
  if (order.payment_status === 'success' || ['processing', 'paid', 'shipped', 'delivered'].includes(order.status)) {
    return {
      success: false,
      skipped: true,
      reason: 'Order payment already succeeded'
    };
  }

  const idemp = await checkEmailEventAlreadySent(supabase, order, 'payment_failed', emailData.customerEmail);
  if (idemp.alreadySent && !options.forceResend) {
    return {
      success: true,
      skipped: true,
      alreadySent: true,
      orderId: cleanOrderId,
      sentAt: idemp.sentAt,
      resendId: idemp.resendId
    };
  }

  if (!isValidCustomerEmail(emailData.customerEmail)) {
    return { success: false, error: 'Invalid customer email' };
  }

  emailData.paymentStatus = 'FAILED';
  emailData.orderStatus = 'payment_failed';
  if (paymentReference) {
    emailData.paymentReference = paymentReference;
  }

  const { stringVariables, numericVariables } = buildOrderTemplateVariables(emailData);
  const res = await dispatchResendTemplateEmail({
    templateIdOrAlias: templateId,
    to: emailData.customerEmail,
    defaultSubject: `Payment Unsuccessful for Order ${emailData.orderNumber} - ODA Market`,
    stringVariables,
    numericVariables,
    idempotencyKey: options.forceResend
      ? `oda-payment-failed-${cleanOrderId}-${Date.now()}`
      : `oda-payment-failed-${cleanOrderId}`
  });

  await recordOrderEmailEvent({
    supabase,
    order,
    eventType: 'payment_failed',
    recipientEmail: emailData.customerEmail,
    status: res.success ? 'sent' : 'failed',
    resendId: res.resendId,
    templateId: res.templateId || templateId,
    errorMessage: res.error
  });

  return {
    success: res.success,
    orderId: cleanOrderId,
    resendId: res.resendId,
    templateId: res.templateId || templateId,
    recipient: emailData.customerEmail,
    error: res.error
  };
}

/**
 * 4. ORDER STATUS CHANGE EMAILS
 * Supports all order status transitions in ODA Market:
 * - 'order_confirmed' ('confirmed')
 * - 'order_ready' ('ready_for_pickup', 'packed', 'ready')
 * - 'order_shipped' ('shipped', 'out_for_delivery')
 * - 'order_delivered' ('delivered')
 * - 'order_cancelled' ('cancelled', 'refunded')
 * Verified against actual database order status before sending.
 */
export async function sendOrderStatusEmailForOrder(
  orderId: string,
  eventType: 'order_confirmed' | 'order_ready' | 'order_shipped' | 'order_delivered' | 'order_cancelled',
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) return { success: false, error: 'Missing orderId' };

  const lockKey = `${eventType}:${cleanOrderId}`;
  if (!options.forceResend && inFlightDispatches.has(lockKey)) {
    return inFlightDispatches.get(lockKey)!;
  }

  const task = (async (): Promise<SendOrderEmailResult> => {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: false, error: 'Database configuration unavailable' };

    const ctx = await loadOrderEmailContext(supabase, cleanOrderId);
    if (ctx.error || !ctx.order || !ctx.emailData) {
      return { success: false, error: ctx.error || 'Order not found' };
    }

    const { order, emailData, parsedNotes } = ctx;
    const normStatus = (parsedNotes?.sub_status || order.status || '').toLowerCase().trim();
    const dbStatus = (order.status || '').toLowerCase().trim();

    // Verify that the order's actual status in the database matches the status notification being sent
    if (eventType === 'order_confirmed') {
      if (!['confirmed', 'processing'].includes(normStatus) && !['confirmed', 'processing'].includes(dbStatus)) {
        return {
          success: false,
          skipped: true,
          reason: `Order status in DB (${normStatus}) does not match order_confirmed`
        };
      }
      emailData.orderStatus = 'confirmed';
    } else if (eventType === 'order_ready') {
      const readyStatuses = ['ready_for_pickup', 'packed', 'ready', 'processing'];
      if (!readyStatuses.includes(normStatus) && !readyStatuses.includes(dbStatus)) {
        return {
          success: false,
          skipped: true,
          reason: `Order status in DB (${normStatus}) does not match order_ready`
        };
      }
      if (normStatus === 'processing') {
        emailData.orderStatus = 'ready_for_pickup';
      }
    } else if (eventType === 'order_shipped') {
      const shippedStatuses = ['shipped', 'out_for_delivery'];
      if (!shippedStatuses.includes(normStatus) && !shippedStatuses.includes(dbStatus)) {
        return {
          success: false,
          skipped: true,
          reason: `Order status in DB (${normStatus}) does not match order_shipped`
        };
      }
    } else if (eventType === 'order_delivered') {
      if (normStatus !== 'delivered' && dbStatus !== 'delivered') {
        return {
          success: false,
          skipped: true,
          reason: `Order status in DB (${normStatus}) is not delivered`
        };
      }
    } else if (eventType === 'order_cancelled') {
      if (!['cancelled', 'refunded'].includes(normStatus) && !['cancelled', 'refunded'].includes(dbStatus)) {
        return {
          success: false,
          skipped: true,
          reason: `Order status in DB (${normStatus}) is not cancelled`
        };
      }
    }

    const idemp = await checkEmailEventAlreadySent(supabase, order, eventType, emailData.customerEmail);
    if (idemp.alreadySent && !options.forceResend) {
      console.log(
        `[Resend Email] ℹ️ Idempotency: ${eventType} email for order ${cleanOrderId} already sent at ${idemp.sentAt}. Skipping.`
      );
      return {
        success: true,
        skipped: true,
        alreadySent: true,
        orderId: cleanOrderId,
        sentAt: idemp.sentAt,
        resendId: idemp.resendId
      };
    }

    if (!isValidCustomerEmail(emailData.customerEmail)) {
      return { success: false, error: 'Invalid customer email' };
    }

    if (!getResendClient()) {
      return { success: false, error: 'RESEND_API_KEY is not configured on server' };
    }

    const fromSender = resolveValidFromEmail(
      process.env.RESEND_FROM_EMAIL,
      'ODA Market <orders@odamarket.co.ke>'
    );
    const { subject, html, text } = buildOrderStatusEmailHtml(emailData, eventType);
    const idempotencyKey = options.forceResend
      ? `oda-${eventType}-${cleanOrderId}-${Date.now()}`
      : `oda-${eventType}-${cleanOrderId}`;

    console.log(
      `[Resend Email] 📤 Dispatching ${eventType} email (${ normStatus }) to ${emailData.customerEmail} for ${emailData.orderNumber}...`
    );

    const res = await sendResendHtmlEmailWithFailover({
      from: fromSender,
      to: emailData.customerEmail,
      replyTo: 'info@odamarket.co.ke',
      subject,
      html,
      text,
      idempotencyKey
    });

    await recordOrderEmailEvent({
      supabase,
      order,
      eventType,
      recipientEmail: emailData.customerEmail,
      status: res.success ? 'sent' : 'failed',
      resendId: res.resendId,
      errorMessage: res.error
    });

    if (res.success) {
      console.log(
        `[Resend Email] ✅ Sent ${eventType} email to ${emailData.customerEmail} for ${emailData.orderNumber} (Resend ID: ${res.resendId})`
      );
    } else {
      console.error(
        `[Resend Email] ❌ Failed to send ${eventType} email for ${emailData.orderNumber}:`,
        res.error
      );
    }

    return {
      success: res.success,
      orderId: cleanOrderId,
      resendId: res.resendId,
      recipient: emailData.customerEmail,
      sentAt: res.success ? new Date().toISOString() : undefined,
      error: res.error
    };
  })();

  inFlightDispatches.set(lockKey, task);
  try {
    return await task;
  } finally {
    inFlightDispatches.delete(lockKey);
  }
}

/**
 * 6. SELLER NEW ORDER TEMPLATE EMAIL
 * Resolves seller(s) for the ordered products and sends the Seller New Order Resend template idempotently.
 */
export async function sendSellerNewOrderEmailForOrder(
  orderId: string,
  options: { forceResend?: boolean } = {}
): Promise<SendOrderEmailResult> {
  const cleanOrderId = (orderId || '').trim();
  if (!cleanOrderId) return { success: false, error: 'Missing orderId' };

  const templateId = await resolveResendTemplateId('seller_new_order');
  if (!templateId) {
    return {
      success: true,
      skipped: true,
      reason: 'RESEND_SELLER_NEW_ORDER_TEMPLATE_ID not configured'
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: 'Database configuration unavailable' };

  const ctx = await loadOrderEmailContext(supabase, cleanOrderId);
  if (ctx.error || !ctx.order || !ctx.emailData) {
    return { success: false, error: ctx.error || 'Order not found' };
  }

  const { order, emailData, rawItems } = ctx;
  const isPaid =
    order.payment_status === 'success' ||
    ['processing', 'paid', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'shipped', 'delivered'].includes(order.status);

  if (!isPaid) {
    return {
      success: false,
      skipped: true,
      reason: 'Order is not paid'
    };
  }

  // Look up supplier_id from products for the ordered items
  const productIds = (rawItems || []).map((i: any) => i.product_id).filter(Boolean);
  const sellerMap = new Map<string, { sellerName: string; sellerEmail: string; items: OrderEmailItem[] }>();

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, supplier_id')
      .in('id', productIds);

    const supplierIds = [...new Set((products || []).map((p: any) => p.supplier_id).filter(Boolean))];
    const profilesById = new Map<string, any>();

    if (supplierIds.length > 0) {
      const { data: sellerProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', supplierIds);

      for (const sp of sellerProfiles || []) {
        profilesById.set(sp.id, sp);
      }
    }

    const productSupplierMap = new Map<string, string>();
    for (const p of products || []) {
      if (p.supplier_id) productSupplierMap.set(p.id, p.supplier_id);
    }

    for (const item of emailData.items) {
      const supId = item.productId ? productSupplierMap.get(item.productId) : undefined;
      const prof = supId ? profilesById.get(supId) : undefined;
      if (prof && isValidCustomerEmail(prof.email)) {
        const emailKey = prof.email.trim().toLowerCase();
        const sellerName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'ODA Market Seller';
        if (!sellerMap.has(emailKey)) {
          sellerMap.set(emailKey, { sellerName, sellerEmail: emailKey, items: [] });
        }
        sellerMap.get(emailKey)!.items.push(item);
      }
    }
  }

  // Fallback to configured seller/fulfillment email if products don't have distinct supplier_id profiles
  const fallbackSellerEmail = (process.env.RESEND_SELLER_NOTIFICATION_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  if (sellerMap.size === 0 && isValidCustomerEmail(fallbackSellerEmail)) {
    sellerMap.set(fallbackSellerEmail.toLowerCase(), {
      sellerName: 'ODA Market Fulfillment Team',
      sellerEmail: fallbackSellerEmail.toLowerCase(),
      items: emailData.items
    });
  }

  if (sellerMap.size === 0) {
    return {
      success: true,
      skipped: true,
      reason: 'No seller email associated with order items'
    };
  }

  let lastResendId: string | undefined = undefined;
  for (const [, seller] of sellerMap.entries()) {
    const idemp = await checkEmailEventAlreadySent(supabase, order, 'seller_new_order', seller.sellerEmail);
    if (idemp.alreadySent && !options.forceResend) {
      continue;
    }

    const sellerOrderData: OrderEmailData = {
      ...emailData,
      items: seller.items.length > 0 ? seller.items : emailData.items,
      storeName: seller.sellerName
    };

    const { stringVariables, numericVariables } = buildOrderTemplateVariables(sellerOrderData, {
      sellerName: seller.sellerName,
      sellerEmail: seller.sellerEmail
    });

    const res = await dispatchResendTemplateEmail({
      templateIdOrAlias: templateId,
      to: seller.sellerEmail,
      defaultSubject: `New Paid Order ${emailData.orderNumber} - ODA Market`,
      stringVariables,
      numericVariables,
      idempotencyKey: options.forceResend
        ? `oda-seller-order-${cleanOrderId}-${seller.sellerEmail}-${Date.now()}`
        : `oda-seller-order-${cleanOrderId}-${seller.sellerEmail}`
    });

    await recordOrderEmailEvent({
      supabase,
      order,
      eventType: 'seller_new_order',
      recipientEmail: seller.sellerEmail,
      status: res.success ? 'sent' : 'failed',
      resendId: res.resendId,
      templateId: res.templateId || templateId,
      errorMessage: res.error
    });

    if (res.resendId) lastResendId = res.resendId;
  }

  return {
    success: true,
    orderId: cleanOrderId,
    resendId: lastResendId,
    templateId
  };
}

const sentVerificationEmailsCache = new Set<string>();

/**
 * 7. EMAIL VERIFICATION TEMPLATE DISPATCH
 * Uses the existing Resend verification template (RESEND_EMAIL_VERIFICATION_TEMPLATE_ID / RESEND_TEMPLATE_ID or
 * auto-discovered `confirm-your-email-address-template` / `2d5aeedf-970b-4b39-98a6-f6770235d481`).
 */
export async function sendEmailVerificationEmail(params: {
  email: string;
  confirmationUrl: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  forceResend?: boolean;
}): Promise<SendOrderEmailResult> {
  const { email, confirmationUrl, firstName = '', lastName = '', userId, forceResend = false } = params;
  if (!isValidCustomerEmail(email)) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  const normEmail = email.trim().toLowerCase();
  const lockKey = `verify:${normEmail}`;
  if (!forceResend && inFlightDispatches.has(lockKey)) {
    return inFlightDispatches.get(lockKey)!;
  }

  const task = (async (): Promise<SendOrderEmailResult> => {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: 'RESEND_API_KEY is not configured on server' };
    }

    const emailCacheKey = `verify:${normEmail}`;
    const userCacheKey = userId ? `verify:${userId}` : emailCacheKey;
    if (!forceResend && (sentVerificationEmailsCache.has(emailCacheKey) || sentVerificationEmailsCache.has(userCacheKey))) {
      return {
        success: true,
        skipped: true,
        alreadySent: true,
        recipient: normEmail
      };
    }

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
    const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer';
    const resolvedFirstName = firstName.trim() || fullName.split(' ')[0] || 'Valued Customer';

    const stringVariables: Record<string, string> = {
      ConfirmationURL: confirmationUrl,
      confirmation_url: confirmationUrl,
      confirmationUrl: confirmationUrl,
      verification_url: confirmationUrl,
      verificationUrl: confirmationUrl,
      action_url: confirmationUrl,
      actionUrl: confirmationUrl,
      name: fullName,
      customer_name: fullName,
      CUSTOMER_NAME: fullName,
      customerName: fullName,
      first_name: resolvedFirstName,
      firstName: resolvedFirstName,
      last_name: lastName.trim(),
      lastName: lastName.trim(),
      customer_email: normEmail,
      email: normEmail,
      app_url: appUrl,
      shop_url: `${appUrl}/products`,
      login_url: `${appUrl}/login`,
      support_email: 'info@odamarket.co.ke',
      support_phone: '0792867386'
    };

    const templateId = (await resolveResendTemplateId('email_verification')) || '2d5aeedf-970b-4b39-98a6-f6770235d481';
    console.log(`[Resend Email] 📤 Dispatching Email Verification via Resend Template (${templateId}) to ${normEmail}...`);

    const tplRes = await dispatchResendTemplateEmail({
      templateIdOrAlias: templateId,
      to: normEmail,
      defaultSubject: 'Confirm your email address',
      defaultFrom: '"odamarket" <team@odamarket.co.ke>',
      stringVariables,
      idempotencyKey: forceResend
        ? `oda-verify-${normEmail}-${Date.now()}`
        : `oda-verify-${normEmail}`
    });

    if (tplRes.success) {
      sentVerificationEmailsCache.add(emailCacheKey);
      sentVerificationEmailsCache.add(userCacheKey);
      const sentAt = new Date().toISOString();

      // Record resend_confirmation_sent_at in Supabase Auth user_metadata to prevent duplicate confirmation emails
      if (userId) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          try {
            const { data: uData } = await supabase.auth.admin.getUserById(userId);
            const existingMeta = uData?.user?.user_metadata || {};
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...existingMeta,
                resend_confirmation_sent_at: sentAt,
                resend_confirmation_id: tplRes.resendId
              }
            });
          } catch {
            // Non-fatal
          }
        }
      }

      console.log(`[Resend Email] ✅ Sent Email Verification template (${tplRes.templateId}) to ${normEmail} (ID: ${tplRes.resendId})`);
      return {
        success: true,
        resendId: tplRes.resendId,
        templateId: tplRes.templateId,
        recipient: normEmail,
        sentAt
      };
    }

    console.error(`[Resend Email] ❌ Email Verification template failed for ${normEmail}: ${tplRes.error}`);
    return {
      success: false,
      templateId: tplRes.templateId || templateId,
      recipient: normEmail,
      error: tplRes.error
    };
  })();

  inFlightDispatches.set(lockKey, task);
  try {
    return await task;
  } finally {
    inFlightDispatches.delete(lockKey);
  }
}

/**
 * 8. RESEND AUTOMATION ("Welcome series" triggered by `user.created`) & WELCOME TEMPLATE
 *
 * Flow:
 *   NEW ODA MARKET USER REGISTERS
 *   ↓
 *   Verify user exists in Supabase Auth & check idempotency
 *   ↓
 *   Sync contact in Resend (POST https://api.resend.com/contacts)
 *   ↓
 *   Emit `user.created` event (POST https://api.resend.com/events/send)
 *   ↓
 *   Resend Automation ("Welcome series") triggers & sends Welcome template
 */
const sentWelcomeEmailsCache = new Set<string>();
let cachedWelcomeAutomationId: string | null = null;
let cachedWelcomeAutomationCheckedAt = 0;

function getRawResendApiKey(): string {
  return getActiveResendApiKey();
}

/**
 * Ensures the `user.created` event and the enabled `Welcome series` automation exist in Resend.
 * Resolves the template ID by checking if the configured template ID (or `34a080c9-b17d-4187-ad80-5af20266e535`)
 * exists in the Resend account, and automatically falls back to the account's published Welcome Template
 * (`f8242719-8b3b-488e-8954-b1408c069f30`) if the example placeholder ID is not in the account.
 */
export async function ensureWelcomeSeriesAutomation(preferredTemplateId?: string): Promise<{
  success: boolean;
  automationId?: string;
  automationName?: string;
  eventName: string;
  templateId?: string;
  status?: string;
  created?: boolean;
  error?: string;
}> {
  const apiKey = getRawResendApiKey();
  if (!apiKey || apiKey.startsWith('YOUR_')) {
    return {
      success: false,
      eventName: 'user.created',
      error: 'RESEND_API_KEY is not configured on server'
    };
  }

  // Resolve the valid published Welcome template in this Resend account
  let resolvedTemplateId = await resolveResendTemplateId('welcome');
  if (preferredTemplateId && isValidResendTemplateIdentifier(preferredTemplateId)) {
    const details = await getResendTemplateDetails(preferredTemplateId);
    if (details && details.status === 'published') {
      resolvedTemplateId = details.id;
    }
  }
  if (resolvedTemplateId) {
    const details = await getResendTemplateDetails(resolvedTemplateId);
    if (details?.id) {
      resolvedTemplateId = details.id;
    }
  }
  if (!resolvedTemplateId) {
    resolvedTemplateId = 'f8242719-8b3b-488e-8954-b1408c069f30';
  }

  const now = Date.now();
  if (cachedWelcomeAutomationId && now - cachedWelcomeAutomationCheckedAt < TEMPLATE_CACHE_TTL_MS) {
    return {
      success: true,
      automationId: cachedWelcomeAutomationId,
      automationName: 'Welcome series',
      eventName: 'user.created',
      templateId: resolvedTemplateId,
      status: 'enabled',
      created: false
    };
  }

  try {
    // 1. Ensure `user.created` event definition exists in Resend
    const eventsListRes = await fetch('https://api.resend.com/events', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (eventsListRes.ok) {
      const eventsData: any = await eventsListRes.json().catch(() => ({}));
      const existingEvent = (eventsData?.data || []).find((e: any) => e.name === 'user.created');
      if (!existingEvent) {
        await fetch('https://api.resend.com/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: 'user.created' })
        });
      }
    }

    // 2. Check existing automations for an enabled "Welcome series" triggered by `user.created`
    const autoListRes = await fetch('https://api.resend.com/automations', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (autoListRes.ok) {
      const autoListData: any = await autoListRes.json().catch(() => ({}));
      const candidates = (autoListData?.data || []).filter(
        (a: any) => a.status === 'enabled' && a.name?.toLowerCase() === 'welcome series'
      );

      for (const candidate of candidates) {
        const detailRes = await fetch(`https://api.resend.com/automations/${candidate.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (detailRes.ok) {
          const detail: any = await detailRes.json().catch(() => ({}));
          const hasUserCreatedTrigger = (detail?.steps || []).some(
            (s: any) => s.type === 'trigger' && s.config?.event_name === 'user.created'
          );
          if (hasUserCreatedTrigger) {
            cachedWelcomeAutomationId = detail.id;
            cachedWelcomeAutomationCheckedAt = now;
            return {
              success: true,
              automationId: detail.id,
              automationName: detail.name,
              eventName: 'user.created',
              templateId: resolvedTemplateId,
              status: detail.status,
              created: false
            };
          }
        }
      }
    }

    // 3. Create the "Welcome series" automation triggered by `user.created`
    const fromSender = resolveValidFromEmail(
      process.env.RESEND_FROM_EMAIL,
      'ODA Market <info@odamarket.co.ke>'
    );

    const createRes = await fetch('https://api.resend.com/automations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Welcome series',
        status: 'enabled',
        steps: [
          {
            key: 'start',
            type: 'trigger',
            config: { event_name: 'user.created' }
          },
          {
            key: 'welcome',
            type: 'send_email',
            config: {
              from: fromSender,
              template: {
                id: resolvedTemplateId,
                variables: {
                  name: { var: 'event.name' },
                  customer_name: { var: 'event.customer_name' },
                  CUSTOMER_NAME: { var: 'event.customer_name' },
                  shop_url: { var: 'event.shop_url' }
                }
              }
            }
          }
        ],
        connections: [
          { from: 'start', to: 'welcome' }
        ]
      })
    });

    const createData: any = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return {
        success: false,
        eventName: 'user.created',
        templateId: resolvedTemplateId,
        error: createData?.message || `Failed to create automation (HTTP ${createRes.status})`
      };
    }

    cachedWelcomeAutomationId = createData.id;
    cachedWelcomeAutomationCheckedAt = now;
    return {
      success: true,
      automationId: createData.id,
      automationName: 'Welcome series',
      eventName: 'user.created',
      templateId: resolvedTemplateId,
      status: 'enabled',
      created: true
    };
  } catch (err: any) {
    return {
      success: false,
      eventName: 'user.created',
      templateId: resolvedTemplateId,
      error: err?.message || 'Unexpected error configuring Resend automation'
    };
  }
}

export async function sendWelcomeEmail(params: {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  forceResend?: boolean;
}): Promise<SendOrderEmailResult> {
  const { email, name = '', firstName = '', lastName = '', userId, forceResend = false } = params;
  if (!isValidCustomerEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  const normEmail = email.trim().toLowerCase();
  const lockKey = `welcome:${normEmail}`;
  if (!forceResend && inFlightDispatches.has(lockKey)) {
    return inFlightDispatches.get(lockKey)!;
  }

  const task = (async (): Promise<SendOrderEmailResult> => {
    const apiKey = getRawResendApiKey();
    if (!apiKey || apiKey.startsWith('YOUR_')) {
      return {
        success: false,
        error: 'RESEND_API_KEY is not configured on server'
      };
    }

    const templateId = (await resolveResendTemplateId('welcome')) || 'f8242719-8b3b-488e-8954-b1408c069f30';

    const emailCacheKey = `welcome:${normEmail}`;
    const userCacheKey = userId ? `welcome:${userId}` : emailCacheKey;
    if (!forceResend && (sentWelcomeEmailsCache.has(emailCacheKey) || sentWelcomeEmailsCache.has(userCacheKey))) {
      return {
        success: true,
        skipped: true,
        alreadySent: true,
        recipient: normEmail,
        templateId
      };
    }

    const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://odamarket.co.ke').replace(/\/$/, '');
    const fullName = name.trim() || `${firstName} ${lastName}`.trim() || 'Valued Customer';
    const resolvedFirstName = firstName.trim() || fullName.split(' ')[0] || 'Valued Customer';
    const resolvedLastName = lastName.trim() || fullName.split(' ').slice(1).join(' ');

    // 1. Ensure the "Welcome series" automation (trigger: `user.created`) is active in Resend
    const autoSetup = await ensureWelcomeSeriesAutomation();

    // 2. Sync the newly registered user to Resend Contacts so `contact.*` fields are populated
    try {
      await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: normEmail,
          first_name: resolvedFirstName,
          last_name: resolvedLastName || undefined,
          unsubscribed: false
        })
      });
    } catch {
      // Non-fatal if contact already exists or key has restricted scope
    }

    // 3. Emit the `user.created` event to Resend (`POST https://api.resend.com/events/send`)
    // This triggers the "Welcome series" Resend Automation for this user's email
    console.log(`[Resend Automation] 📤 Emitting "user.created" event to Resend for ${normEmail}...`);
    try {
      const eventRes = await fetch('https://api.resend.com/events/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'user.created',
          email: normEmail,
          payload: {
            user_id: userId || '',
            email: normEmail,
            name: fullName,
            customer_name: fullName,
            first_name: resolvedFirstName,
            last_name: resolvedLastName,
            shop_url: `${appUrl}/products`,
            login_url: `${appUrl}/login`
          }
        })
      });

      const eventData: any = await eventRes.json().catch(() => ({}));
      if (eventRes.ok) {
        sentWelcomeEmailsCache.add(emailCacheKey);
        sentWelcomeEmailsCache.add(userCacheKey);
        console.log(
          `[Resend Automation] ✅ "user.created" event accepted by Resend for ${normEmail} (Automation: ${autoSetup.automationId || 'Welcome series'}, Template: ${autoSetup.templateId || templateId})`
        );
        return {
          success: true,
          resendId: autoSetup.automationId || eventData?.event || 'user.created',
          templateId: autoSetup.templateId || templateId,
          recipient: normEmail,
          sentAt: new Date().toISOString()
        };
      }

      console.warn(
        `[Resend Automation] Notice: /events/send returned HTTP ${eventRes.status} (${eventData?.message || 'unknown'}). Falling back to direct template send.`
      );
    } catch (evErr: any) {
      console.warn(`[Resend Automation] Notice: /events/send exception (${evErr?.message}). Falling back to direct template send.`);
    }

    // 4. Fallback if /events/send is unavailable: send template directly via /emails
    const stringVariables: Record<string, string> = {
      name: fullName,
      customer_name: fullName,
      CUSTOMER_NAME: fullName,
      customerName: fullName,
      first_name: resolvedFirstName,
      firstName: resolvedFirstName,
      last_name: resolvedLastName,
      lastName: resolvedLastName,
      customer_email: normEmail,
      email: normEmail,
      app_url: appUrl,
      login_url: `${appUrl}/login`,
      shop_url: `${appUrl}/products`,
      support_email: 'info@odamarket.co.ke',
      support_phone: '0792867386'
    };

    const res = await dispatchResendTemplateEmail({
      templateIdOrAlias: templateId,
      to: normEmail,
      defaultSubject: 'Welcome to ODA Market!',
      defaultFrom: 'ODA Market <info@odamarket.co.ke>',
      stringVariables,
      idempotencyKey: forceResend
        ? `oda-registration-${normEmail}-${Date.now()}`
        : `oda-registration-${normEmail}`
    });

    if (res.success) {
      sentWelcomeEmailsCache.add(emailCacheKey);
      sentWelcomeEmailsCache.add(userCacheKey);
      console.log(`[Resend Email] ✅ Registration template (${res.templateId || templateId}) sent to ${normEmail} (Resend ID: ${res.resendId})`);
    } else {
      console.error(`[Resend Email] ❌ Registration template failed for ${normEmail}:`, res.error);
    }

    return {
      success: res.success,
      resendId: res.resendId,
      templateId: res.templateId || templateId,
      recipient: normEmail,
      sentAt: res.success ? new Date().toISOString() : undefined,
      error: res.error
    };
  })();

  inFlightDispatches.set(lockKey, task);
  try {
    return await task;
  } finally {
    inFlightDispatches.delete(lockKey);
  }
}

/**
 * Verifies that a newly registered user actually exists in Supabase Auth/profiles
 * and triggers the `user.created` Resend Automation ("Welcome series")
 * safely and idempotently without ever breaking user registration.
 */
export async function sendRegistrationEmail(params: {
  userId?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  forceResend?: boolean;
}): Promise<SendOrderEmailResult> {
  try {
    const supabase = getSupabaseAdmin();
    let verifiedEmail = (params.email || '').trim().toLowerCase();
    let verifiedFirstName = (params.firstName || '').trim();
    let verifiedLastName = (params.lastName || '').trim();
    let verifiedFullName = (params.name || '').trim();
    let verifiedUserId = (params.userId || '').trim();
    let existingUserMetadata: Record<string, any> = {};

    if (supabase) {
      if (verifiedUserId) {
        const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(verifiedUserId);
        if (authErr || !authData?.user) {
          console.warn(`[Resend Registration] Skipped: User ID ${verifiedUserId} was not found in Supabase Auth.`);
          return {
            success: false,
            skipped: true,
            reason: 'User was not found in Supabase Auth'
          };
        }
        const u = authData.user;
        if (u.email) verifiedEmail = u.email.trim().toLowerCase();
        existingUserMetadata = u.user_metadata || {};
        if (!verifiedFirstName && existingUserMetadata.first_name) verifiedFirstName = String(existingUserMetadata.first_name).trim();
        if (!verifiedLastName && existingUserMetadata.last_name) verifiedLastName = String(existingUserMetadata.last_name).trim();
        if (!verifiedFullName && existingUserMetadata.full_name) verifiedFullName = String(existingUserMetadata.full_name).trim();
      } else if (verifiedEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('email', verifiedEmail)
          .maybeSingle();
        if (prof) {
          verifiedUserId = prof.id;
          if (!verifiedFirstName && prof.first_name) verifiedFirstName = prof.first_name;
          if (!verifiedLastName && prof.last_name) verifiedLastName = prof.last_name;
          const { data: authData } = await supabase.auth.admin.getUserById(verifiedUserId);
          if (authData?.user?.user_metadata) {
            existingUserMetadata = authData.user.user_metadata;
          }
        } else {
          // Check Supabase Auth users list
          const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const matchedUser = (listData?.users || []).find(
            (u: any) => (u.email || '').toLowerCase() === verifiedEmail
          );
          if (!matchedUser) {
            console.warn(`[Resend Registration] Skipped: Email ${verifiedEmail} is not registered in Supabase Auth.`);
            return {
              success: false,
              skipped: true,
              reason: 'Email is not registered in Supabase Auth'
            };
          }
          verifiedUserId = matchedUser.id;
          existingUserMetadata = matchedUser.user_metadata || {};
          if (!verifiedFirstName && existingUserMetadata.first_name) verifiedFirstName = String(existingUserMetadata.first_name).trim();
          if (!verifiedLastName && existingUserMetadata.last_name) verifiedLastName = String(existingUserMetadata.last_name).trim();
          if (!verifiedFullName && existingUserMetadata.full_name) verifiedFullName = String(existingUserMetadata.full_name).trim();
        }
      }
    }

    if (!isValidCustomerEmail(verifiedEmail)) {
      return { success: false, error: 'No valid registered user email address found' };
    }

    // Persistent cross-instance deduplication check on Supabase Auth user_metadata
    if (!params.forceResend && existingUserMetadata?.resend_user_created_sent_at) {
      console.log(
        `[Resend Registration] Skipped duplicate user.created event for ${verifiedEmail} (already triggered at ${existingUserMetadata.resend_user_created_sent_at})`
      );
      return {
        success: true,
        skipped: true,
        alreadySent: true,
        recipient: verifiedEmail,
        sentAt: existingUserMetadata.resend_user_created_sent_at
      };
    }

    const result = await sendWelcomeEmail({
      userId: verifiedUserId || undefined,
      email: verifiedEmail,
      name: verifiedFullName || `${verifiedFirstName} ${verifiedLastName}`.trim(),
      firstName: verifiedFirstName,
      lastName: verifiedLastName,
      forceResend: params.forceResend
    });

    // Persist `resend_user_created_sent_at` on the Supabase Auth user record so duplicate webhooks/requests never re-trigger
    if (result.success && !result.alreadySent && supabase && verifiedUserId) {
      try {
        await supabase.auth.admin.updateUserById(verifiedUserId, {
          user_metadata: {
            ...existingUserMetadata,
            resend_user_created_sent_at: result.sentAt || new Date().toISOString()
          }
        });
      } catch (metaErr) {
        console.warn('[Resend Registration] Non-fatal notice persisting resend_user_created_sent_at:', metaErr);
      }
    }

    return result;
  } catch (err: any) {
    console.error('[Resend Registration] Safe error handler caught exception:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Registration email dispatch failed'
    };
  }
}

/**
 * Legacy wrapper for compatibility with existing imports
 */
export async function sendOrderConfirmationEmail(orderInfo: any) {
  if (orderInfo?.orderId) {
    return sendOrderConfirmationEmailForOrder(orderInfo.orderId);
  }
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'RESEND_API_KEY not configured' };

  try {
    const emailData: OrderEmailData = {
      customerName: orderInfo.customerName || 'Customer',
      customerEmail: orderInfo.customerEmail,
      orderNumber: orderInfo.orderNumber || 'ODA-ORDER',
      orderId: orderInfo.orderId || 'order',
      orderDate: orderInfo.orderDate || new Date().toLocaleDateString(),
      items: (orderInfo.items || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        lineTotal: i.price * i.quantity
      })),
      subtotal: orderInfo.subtotal || 0,
      deliveryFee: orderInfo.deliveryFee || 0,
      total: orderInfo.total || 0,
      deliveryMethod: orderInfo.deliveryMethod || 'standard',
      deliveryAddress: orderInfo.deliveryAddress || 'Nairobi, Kenya',
      paymentMethod: orderInfo.paymentMethod || 'Paystack',
      paymentStatus: 'PAID',
      paymentReference: orderInfo.transactionReference,
      orderStatus: 'processing',
      trackingUrl: orderInfo.trackingUrl || `https://odamarket.co.ke/track-order`
    };

    const templateId = await resolveResendTemplateId('order_confirmation');
    if (templateId) {
      const { stringVariables, numericVariables } = buildOrderTemplateVariables(emailData);
      const tplRes = await dispatchResendTemplateEmail({
        templateIdOrAlias: templateId,
        to: orderInfo.customerEmail,
        defaultSubject: `Order Confirmed: ${emailData.orderNumber} - ODA Market`,
        stringVariables,
        numericVariables
      });
      return { success: tplRes.success, data: { id: tplRes.resendId }, error: tplRes.error };
    }

    const fromSender = resolveValidFromEmail(
      process.env.RESEND_FROM_EMAIL,
      'ODA Market <orders@odamarket.co.ke>'
    );
    const response = await resend.emails.send({
      from: fromSender,
      to: [orderInfo.customerEmail],
      replyTo: 'info@odamarket.co.ke',
      subject: `Order Confirmed: ${emailData.orderNumber} - ODA Market`,
      html: buildOrderConfirmationEmailHtml(emailData)
    });
    return { success: true, data: response };
  } catch (err: any) {
    console.error('Legacy sendOrderConfirmationEmail error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 9. LOGIN TWO-FACTOR OTP EMAIL (RESEND)
 * Sends a 6-digit login verification code from "Team ODA Market" via the verified odamarket.co.ke domain.
 */
export function buildLoginOtpEmailHtml(otp: string, firstName?: string): string {
  const greeting = firstName && firstName.trim() ? `Hello ${firstName.trim()},` : 'Hello,';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ODA Market login verification code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5EC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DCC9; box-shadow: 0 10px 30px rgba(58, 36, 24, 0.08);">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #D96A27 0%, #F49C64 100%); background-color: #D96A27;"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 30px 16px 30px; text-align: center;">
              <h1 style="margin: 0; color: #D96A27; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">ODA MARKET</h1>
              <p style="margin: 6px 0 0 0; color: #8B857D; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Login Security Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 36px 36px 36px;">
              <p style="margin: 0 0 14px 0; color: #3A2418; font-size: 15px; line-height: 1.6; font-weight: 600;">${greeting}</p>
              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 15px; line-height: 1.6;">
                We received a login request for your ODA Market account. Your verification code is:
              </p>
              <div style="background-color: #FFFDF8; border: 2px solid #D96A27; border-radius: 12px; padding: 22px 16px; text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #3A2418; font-family: 'Courier New', Courier, monospace;">${otp}</span>
              </div>
              <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
                This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
              <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 13px; line-height: 1.6;">
                If you did not attempt to log in, please secure your account immediately.
              </p>
              <p style="margin: 0; color: #3A2418; font-size: 14px; line-height: 1.6;">
                Regards,<br>
                <strong>Team ODA Market</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF5EC; padding: 20px 30px; text-align: center; border-top: 1px solid #E8DCC9;">
              <p style="margin: 0; color: #8B857D; font-size: 12px;">&copy; 2026 ODA Market &bull; Nairobi, Kenya &bull; <a href="mailto:info@odamarket.co.ke" style="color: #D96A27; text-decoration: none; font-weight: 600;">info@odamarket.co.ke</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendLoginOtpEmail(params: {
  email: string;
  otp: string;
  firstName?: string;
  challengeId: string;
}): Promise<SendOrderEmailResult> {
  const { email, otp, firstName = '', challengeId } = params;
  if (!isValidCustomerEmail(email)) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  const normEmail = email.trim().toLowerCase();
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not configured on server' };
  }

  const loginOtpTemplateId = (process.env.RESEND_LOGIN_OTP_TEMPLATE_ID || '').trim().replace(/^["']|["']$/g, '');
  if (isValidResendTemplateIdentifier(loginOtpTemplateId)) {
    const tplRes = await dispatchResendTemplateEmail({
      templateIdOrAlias: loginOtpTemplateId,
      to: normEmail,
      defaultSubject: 'Your ODA Market login verification code',
      defaultFrom: 'Team ODA Market <info@odamarket.co.ke>',
      stringVariables: {
        otp,
        code: otp,
        verification_code: otp,
        name: firstName || 'Valued Customer',
        first_name: firstName || 'Valued Customer',
        email: normEmail
      },
      idempotencyKey: `oda-login-otp-${challengeId}`
    });
    if (tplRes.success) {
      return {
        success: true,
        resendId: tplRes.resendId,
        templateId: tplRes.templateId,
        recipient: normEmail,
        sentAt: new Date().toISOString()
      };
    }
  }

  const fromSender = resolveValidFromEmail(
    process.env.RESEND_FROM_EMAIL,
    'Team ODA Market <info@odamarket.co.ke>'
  ).replace(/^"?ODA Market"?/i, 'Team ODA Market');

  const html = buildLoginOtpEmailHtml(otp, firstName);
  const text = [
    firstName && firstName.trim() ? `Hello ${firstName.trim()},` : 'Hello,',
    '',
    'We received a login request for your ODA Market account.',
    '',
    'Your verification code is:',
    '',
    otp,
    '',
    'This code expires in 10 minutes.',
    '',
    'If you did not attempt to log in, please secure your account.',
    '',
    'Regards,',
    'Team ODA Market'
  ].join('\n');

  try {
    let activeClient = getResendClient() || resend;
    let activeKey = getActiveResendApiKey();
    let sendRes = await activeClient.emails.send(
      {
        from: isValidFromEmailFormat(fromSender) ? fromSender : 'Team ODA Market <info@odamarket.co.ke>',
        to: [normEmail],
        replyTo: 'info@odamarket.co.ke',
        subject: 'Your ODA Market login verification code',
        html,
        text
      },
      { idempotencyKey: `oda-login-otp-${challengeId}` }
    );

    while (sendRes.error && isUnverifiedDomainOrRestrictedKeyError(sendRes.error)) {
      const switched = markResendApiKeyRejected(activeKey, sendRes.error.message);
      if (!switched) break;
      const nextClient = getResendClient();
      if (!nextClient) break;
      activeClient = nextClient;
      activeKey = getActiveResendApiKey();
      sendRes = await activeClient.emails.send(
        {
          from: isValidFromEmailFormat(fromSender) ? fromSender : 'Team ODA Market <info@odamarket.co.ke>',
          to: [normEmail],
          replyTo: 'info@odamarket.co.ke',
          subject: 'Your ODA Market login verification code',
          html,
          text
        },
        { idempotencyKey: `oda-login-otp-${challengeId}-fo` }
      );
    }

    // Retry automatically if Resend per-second burst limit (429 rate_limit_exceeded) is hit by concurrent logins
    let rateLimitRetries = 0;
    while (
      sendRes.error &&
      rateLimitRetries < 4 &&
      (String((sendRes.error as any).name || '').toLowerCase().includes('rate_limit') ||
        String(sendRes.error.message || '').toLowerCase().includes('too many requests') ||
        String(sendRes.error.message || '').toLowerCase().includes('rate limit'))
    ) {
      rateLimitRetries += 1;
      await new Promise((r) => setTimeout(r, 550 * rateLimitRetries));
      sendRes = await activeClient.emails.send(
        {
          from: isValidFromEmailFormat(fromSender) ? fromSender : 'Team ODA Market <info@odamarket.co.ke>',
          to: [normEmail],
          replyTo: 'info@odamarket.co.ke',
          subject: 'Your ODA Market login verification code',
          html,
          text
        },
        { idempotencyKey: `oda-login-otp-${challengeId}-rl-${rateLimitRetries}` }
      );
    }

    if (sendRes.error) {
      console.error(`[Resend Login OTP] Failed to send OTP to ${normEmail}:`, sendRes.error);
      return {
        success: false,
        recipient: normEmail,
        error: sendRes.error.message || 'Failed to send login verification code'
      };
    }

    console.log(`[Resend Login OTP] Sent 6-digit login OTP to ${normEmail} (Resend ID: ${sendRes.data?.id})`);
    return {
      success: true,
      resendId: sendRes.data?.id,
      recipient: normEmail,
      sentAt: new Date().toISOString()
    };
  } catch (err: any) {
    console.error(`[Resend Login OTP] Exception sending OTP to ${normEmail}:`, err?.message || err);
    return {
      success: false,
      recipient: normEmail,
      error: err?.message || 'Failed to send login verification code'
    };
  }
}
