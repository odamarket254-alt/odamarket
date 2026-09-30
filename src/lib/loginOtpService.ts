import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const LOGIN_OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const LOGIN_OTP_MAX_ATTEMPTS = 5;
export const LOGIN_OTP_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_OTP_MAX_SENDS_PER_WINDOW = 5; // Max 5 OTP sends per user/email per 15 min

export interface LoginOtpChallengeRecord {
  id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  challenge_token_hash: string;
  encrypted_session: string;
  expires_at: number; // epoch ms
  resend_available_at: number; // epoch ms
  attempts: number;
  max_attempts: number;
  verified_at: string | null;
  invalidated_at: string | null;
  created_at: string;
}

export interface PendingSessionPayload {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}

// In-memory store & rate-limit tracker (backed by Supabase database + encrypted app_metadata for serverless persistence)
const memoryChallenges = new Map<string, LoginOtpChallengeRecord>();
const emailSendHistory = new Map<string, number[]>();

let supabaseAdminInstance: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
    supabaseAdminInstance = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseAdminInstance;
}

function getServerSecret(): string {
  const base = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    'oda-market-login-otp-secret-key'
  ).trim();
  return base;
}

/**
 * Generates a cryptographically secure random 6-digit OTP (100000 - 999999)
 * Never uses Math.random() or timestamps.
 */
export function generateSecureSixDigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a cryptographically secure random token for binding the client's OTP session to the challenge.
 */
export function generateChallengeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes the 6-digit OTP with HMAC-SHA256 bound to the challengeId and userId.
 */
export function hashLoginOtp(otp: string, challengeId: string, userId: string): string {
  return crypto
    .createHmac('sha256', getServerSecret())
    .update(`otp:${challengeId}:${userId}:${otp.trim()}`)
    .digest('hex');
}

/**
 * Hashes the challenge token with HMAC-SHA256.
 */
export function hashChallengeToken(token: string, challengeId: string): string {
  return crypto
    .createHmac('sha256', getServerSecret())
    .update(`token:${challengeId}:${token.trim()}`)
    .digest('hex');
}

/**
 * Constant-time hash comparison to prevent timing side-channel attacks.
 */
export function verifyHashConstantTime(expectedHex: string, actualHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(actualHex, 'hex');
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Encrypts sensitive payload (such as the pending Supabase session tokens or challenge state)
 * using AES-256-GCM with a key derived from the server secret.
 */
export function encryptServerPayload(payload: object): string {
  const key = crypto.scryptSync(getServerSecret(), 'oda-login-otp-salt-v1', 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
}

/**
 * Decrypts a payload encrypted with encryptServerPayload.
 */
export function decryptServerPayload<T = any>(ciphertext: string): T | null {
  try {
    const parts = ciphertext.split('.');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const key = crypto.scryptSync(getServerSecret(), 'oda-login-otp-salt-v1', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    return null;
  }
}

/**
 * Masks an email address for safe UI display (e.g., "john@gmail.com" -> "j***@gmail.com")
 */
export function maskEmailAddress(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex + 1);
  const firstChar = local.charAt(0);
  return `${firstChar}***@${domain}`;
}

/**
 * Checks whether the user/email has exceeded the maximum number of OTP sends within the rate window.
 */
export function checkOtpSendRateLimit(
  email: string,
  recentHistoryFromMeta: number[] = []
): { allowed: boolean; retryAfterSeconds?: number } {
  const normEmail = email.trim().toLowerCase();
  const now = Date.now();
  const cutoff = now - LOGIN_OTP_RATE_WINDOW_MS;

  const memTimestamps = (emailSendHistory.get(normEmail) || []).filter(ts => ts > cutoff);
  const metaTimestamps = (recentHistoryFromMeta || []).filter(ts => ts > cutoff);

  const merged = Array.from(new Set([...memTimestamps, ...metaTimestamps])).sort((a, b) => a - b);
  emailSendHistory.set(normEmail, merged);

  if (merged.length >= LOGIN_OTP_MAX_SENDS_PER_WINDOW) {
    const oldestInWindow = merged[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + LOGIN_OTP_RATE_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordOtpSendTimestamp(email: string, existingHistory: number[] = []): number[] {
  const normEmail = email.trim().toLowerCase();
  const now = Date.now();
  const cutoff = now - LOGIN_OTP_RATE_WINDOW_MS;
  const memTimestamps = (emailSendHistory.get(normEmail) || []).filter(ts => ts > cutoff);
  const metaTimestamps = (existingHistory || []).filter(ts => ts > cutoff);
  const updated = Array.from(new Set([...memTimestamps, ...metaTimestamps, now])).sort((a, b) => a - b);
  emailSendHistory.set(normEmail, updated);
  return updated;
}

/**
 * Persists a challenge record in `public.login_otp_challenges` (if migrated)
 * and in encrypted server-only `app_metadata` on the Supabase Auth user record.
 */
export async function saveLoginOtpChallenge(
  record: LoginOtpChallengeRecord,
  sendHistoryTimestamps?: number[]
): Promise<void> {
  memoryChallenges.set(record.id, record);
  const supabase = getSupabaseAdmin();

  // 1. Invalidate any previous active challenges in memory for this user
  for (const [id, existing] of memoryChallenges.entries()) {
    if (id !== record.id && existing.user_id === record.user_id && !existing.invalidated_at && !existing.verified_at) {
      existing.invalidated_at = new Date().toISOString();
    }
  }

  // 2. Try persisting to `public.login_otp_challenges` table (service_role only)
  try {
    await supabase
      .from('login_otp_challenges')
      .update({ invalidated_at: new Date().toISOString() })
      .eq('user_id', record.user_id)
      .is('verified_at', null)
      .is('invalidated_at', null);

    await supabase.from('login_otp_challenges').upsert({
      id: record.id,
      user_id: record.user_id,
      email: record.email,
      otp_hash: record.otp_hash,
      challenge_token_hash: record.challenge_token_hash,
      encrypted_session: record.encrypted_session,
      expires_at: new Date(record.expires_at).toISOString(),
      resend_available_at: new Date(record.resend_available_at).toISOString(),
      attempts: record.attempts,
      max_attempts: record.max_attempts,
      verified_at: record.verified_at,
      invalidated_at: record.invalidated_at,
      created_at: record.created_at
    });
  } catch {
    // Non-fatal if SQL migration has not been run yet; encrypted app_metadata provides full persistence
  }

  // 3. Persist encrypted challenge envelope in Supabase Auth `app_metadata` (server-only writable)
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(record.user_id);
    const existingAppMeta = userData?.user?.app_metadata || {};
    const encryptedChallenge = encryptServerPayload(record);
    await supabase.auth.admin.updateUserById(record.user_id, {
      app_metadata: {
        ...existingAppMeta,
        login_otp_pending: !record.verified_at && !record.invalidated_at,
        login_otp_challenge_id: record.id,
        login_otp_envelope: encryptedChallenge,
        ...(sendHistoryTimestamps ? { login_otp_send_history: sendHistoryTimestamps } : {})
      }
    });
  } catch (err) {
    console.warn('[LoginOTP] Notice updating user app_metadata:', err);
  }
}

/**
 * Loads a challenge record by challengeId (and optional userId).
 */
export async function loadLoginOtpChallenge(
  challengeId: string,
  userIdHint?: string
): Promise<{ record: LoginOtpChallengeRecord | null; sendHistory: number[] }> {
  const supabase = getSupabaseAdmin();

  // 1. Check `public.login_otp_challenges` table first
  try {
    const { data: row, error } = await supabase
      .from('login_otp_challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle();

    if (!error && row) {
      const rec: LoginOtpChallengeRecord = {
        id: row.id,
        user_id: row.user_id,
        email: row.email,
        otp_hash: row.otp_hash,
        challenge_token_hash: row.challenge_token_hash,
        encrypted_session: row.encrypted_session,
        expires_at: new Date(row.expires_at).getTime(),
        resend_available_at: new Date(row.resend_available_at).getTime(),
        attempts: Number(row.attempts) || 0,
        max_attempts: Number(row.max_attempts) || LOGIN_OTP_MAX_ATTEMPTS,
        verified_at: row.verified_at || null,
        invalidated_at: row.invalidated_at || null,
        created_at: row.created_at
      };
      memoryChallenges.set(rec.id, rec);

      let sendHistory: number[] = [];
      try {
        const { data: uData } = await supabase.auth.admin.getUserById(rec.user_id);
        sendHistory = uData?.user?.app_metadata?.login_otp_send_history || [];
      } catch {
        // ignore
      }
      return { record: rec, sendHistory };
    }
  } catch {
    // Table may not exist yet
  }

  // 2. Check in-memory store
  const mem = memoryChallenges.get(challengeId);
  const targetUserId = userIdHint || mem?.user_id;

  // 3. Check Supabase Auth `app_metadata` for cross-instance serverless consistency
  if (targetUserId) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      const appMeta = userData?.user?.app_metadata || {};
      const sendHistory: number[] = Array.isArray(appMeta.login_otp_send_history)
        ? appMeta.login_otp_send_history
        : [];
      if (appMeta.login_otp_envelope) {
        const decoded = decryptServerPayload<LoginOtpChallengeRecord>(appMeta.login_otp_envelope);
        if (decoded && decoded.id === challengeId) {
          memoryChallenges.set(decoded.id, decoded);
          return { record: decoded, sendHistory };
        }
      }
      if (mem) {
        return { record: mem, sendHistory };
      }
    } catch {
      // Fall through to memory
    }
  }

  return { record: mem || null, sendHistory: [] };
}

/**
 * Invalidates all pending OTP challenges for a user (e.g. on logout or when a new OTP is issued).
 */
export async function invalidateUserLoginOtpChallenges(userId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  for (const [, rec] of memoryChallenges.entries()) {
    if (rec.user_id === userId && !rec.verified_at && !rec.invalidated_at) {
      rec.invalidated_at = nowIso;
    }
  }

  const supabase = getSupabaseAdmin();
  try {
    await supabase
      .from('login_otp_challenges')
      .update({ invalidated_at: nowIso })
      .eq('user_id', userId)
      .is('verified_at', null)
      .is('invalidated_at', null);
  } catch {
    // Ignore if table not yet migrated
  }

  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (userData?.user) {
      const existingAppMeta = userData.user.app_metadata || {};
      let updatedEnvelope = existingAppMeta.login_otp_envelope || null;
      if (updatedEnvelope) {
        const decoded = decryptServerPayload<LoginOtpChallengeRecord>(updatedEnvelope);
        if (decoded && !decoded.verified_at) {
          decoded.invalidated_at = nowIso;
          updatedEnvelope = encryptServerPayload(decoded);
        }
      }
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...existingAppMeta,
          login_otp_pending: false,
          login_otp_envelope: updatedEnvelope
        }
      });
    }
  } catch {
    // Non-fatal
  }
}
