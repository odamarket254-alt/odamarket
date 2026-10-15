import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { SupabaseClient } from '@supabase/supabase-js';

// In-memory cache of initialized Firebase Admin app
let firebaseAdminApp: App | null = null;
let isFirebaseConfigured = false;

/**
 * Safely looks up an environment variable across multiple naming conventions:
 * exact snake_case, uppercase with underscores, space-separated, and optional FIREBASE_ prefix.
 */
export function getFlexibleEnvVar(...candidateKeys: string[]): string | undefined {
  for (const key of candidateKeys) {
    if (process.env[key] !== undefined && process.env[key].trim() !== '') {
      return process.env[key].trim();
    }
  }

  // Also check normalized lookup across all process.env keys (casing, spaces, dashes, underscores)
  const normalizedCandidates = new Set(
    candidateKeys.map(k => k.toLowerCase().replace(/[\s\-_]/g, ''))
  );

  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (!envVal || envVal.trim() === '') continue;
    const normalizedEnvKey = envKey.toLowerCase().replace(/[\s\-_]/g, '');
    if (normalizedCandidates.has(normalizedEnvKey)) {
      return envVal.trim();
    }
  }

  return undefined;
}

/**
 * Normalizes and formats a PEM private key:
 * - strips surrounding single/double quotes
 * - restores newline characters if escaped as \n or \\n
 */
export function formatPemPrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();

  // Strip wrapping quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Replace escaped newlines
  key = key.replace(/\\n/g, '\n');

  return key;
}

/**
 * Resolves Firebase service account credentials from environment variables:
 * Supports:
 * 1. Full JSON string/base64 in FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT
 * 2. Individual variables requested by the user:
 *    - project_id / project id / PROJECT_ID / FIREBASE_PROJECT_ID
 *    - private_key_id / private key id / PRIVATE_KEY_ID / FIREBASE_PRIVATE_KEY_ID
 *    - private_key / private key / PRIVATE_KEY / FIREBASE_PRIVATE_KEY
 *    - client_email / client email / CLIENT_EMAIL / FIREBASE_CLIENT_EMAIL
 *    - client_id / client id / CLIENT_ID / FIREBASE_CLIENT_ID
 *    - auth_url / auth url / auth_uri / AUTH_URL / AUTH_URI / FIREBASE_AUTH_URI / FIREBASE_AUTH_URL
 *    - authprovider_x509_cert_url / auth_provider_x509_cert_url / AUTHPROVIDER_X509_CERT_URL / FIREBASE_AUTHPROVIDER_X509_CERT_URL
 *    - client_x509_cert_url / client_x509_cert_url / CLIENT_X509_CERT_URL / FIREBASE_CLIENT_X509_CERT_URL
 *    - universe_domain / universe domain / UNIVERSE_DOMAIN / FIREBASE_UNIVERSE_DOMAIN
 */
export function resolveFirebaseServiceAccount(): {
  serviceAccount: any | null;
  projectId: string;
} {
  const projectId =
    getFlexibleEnvVar(
      'project_id',
      'project id',
      'PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_PROJECT_ID'
    ) || 'odamarket-4cfaf';

  // 1. Try full JSON in FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT
  const rawServiceAccountJson = getFlexibleEnvVar(
    'FIREBASE_SERVICE_ACCOUNT',
    'SERVICE_ACCOUNT',
    'firebase_service_account',
    'service_account'
  );

  if (rawServiceAccountJson) {
    try {
      if (rawServiceAccountJson.startsWith('{')) {
        const parsed = JSON.parse(rawServiceAccountJson);
        return { serviceAccount: parsed, projectId: parsed.project_id || projectId };
      }
      // Try base64
      const decoded = Buffer.from(rawServiceAccountJson, 'base64').toString('utf8');
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        return { serviceAccount: parsed, projectId: parsed.project_id || projectId };
      }
    } catch (parseErr) {
      console.warn('[FCM-ADMIN] Could not parse service account JSON:', parseErr);
    }
  }

  // 2. Try individual environment variables
  const rawPrivateKey = getFlexibleEnvVar(
    'private_key',
    'private key',
    'PRIVATE_KEY',
    'FIREBASE_PRIVATE_KEY'
  );
  const clientEmail = getFlexibleEnvVar(
    'client_email',
    'client email',
    'CLIENT_EMAIL',
    'FIREBASE_CLIENT_EMAIL'
  );

  if (clientEmail && rawPrivateKey) {
    const privateKey = formatPemPrivateKey(rawPrivateKey);
    const privateKeyId = getFlexibleEnvVar(
      'private_key_id',
      'private key id',
      'PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY_ID'
    );
    const clientId = getFlexibleEnvVar(
      'client_id',
      'client id',
      'CLIENT_ID',
      'FIREBASE_CLIENT_ID'
    );
    const authUrl = getFlexibleEnvVar(
      'auth_url',
      'auth url',
      'auth_uri',
      'AUTH_URL',
      'AUTH_URI',
      'FIREBASE_AUTH_URI',
      'FIREBASE_AUTH_URL'
    ) || 'https://accounts.google.com/o/oauth2/auth';
    const authProviderCertUrl = getFlexibleEnvVar(
      'authprovider_x509_cert_url',
      'auth_provider_x509_cert_url',
      'AUTHPROVIDER_X509_CERT_URL',
      'AUTH_PROVIDER_X509_CERT_URL',
      'FIREBASE_AUTHPROVIDER_X509_CERT_URL',
      'FIREBASE_AUTH_PROVIDER_X509_CERT_URL'
    ) || 'https://www.googleapis.com/oauth2/v1/certs';
    const clientCertUrl = getFlexibleEnvVar(
      'client_x509_cert_url',
      'client x509 cert url',
      'CLIENT_X509_CERT_URL',
      'FIREBASE_CLIENT_X509_CERT_URL'
    ) || `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`;
    const universeDomain = getFlexibleEnvVar(
      'universe_domain',
      'universe domain',
      'UNIVERSE_DOMAIN',
      'FIREBASE_UNIVERSE_DOMAIN'
    ) || 'googleapis.com';

    const serviceAccountObj = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: privateKeyId,
      private_key: privateKey,
      client_email: clientEmail,
      client_id: clientId,
      auth_uri: authUrl,
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: authProviderCertUrl,
      client_x509_cert_url: clientCertUrl,
      universe_domain: universeDomain
    };

    return { serviceAccount: serviceAccountObj, projectId };
  }

  return { serviceAccount: null, projectId };
}

/**
 * Initializes Firebase Admin SDK server-side using secure environment variables.
 * Never exposes credentials to frontend code.
 */
export function getFirebaseAdmin(): { app: App | null; isConfigured: boolean } {
  if (firebaseAdminApp) {
    return { app: firebaseAdminApp, isConfigured: true };
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAdminApp = existingApps[0]!;
      isFirebaseConfigured = true;
      return { app: firebaseAdminApp, isConfigured: true };
    }

    let credential: any = null;
    const { serviceAccount, projectId } = resolveFirebaseServiceAccount();

    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
      try {
        credential = cert(serviceAccount);
      } catch (certErr) {
        console.warn('[FCM-ADMIN] Failed to initialize credential from service account:', certErr);
      }
    }

    // Fallback to Google Cloud Application Default Credentials if running on GCP / Cloud Run
    if (!credential && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        credential = applicationDefault();
      } catch (e) {
        // Fallback
      }
    }

    if (credential) {
      firebaseAdminApp = initializeApp({
        credential,
        projectId
      });
      isFirebaseConfigured = true;
      console.log(`[FCM-ADMIN] Successfully initialized Firebase Admin for project: ${projectId}`);
    } else {
      console.warn('[FCM-ADMIN] Firebase service-account credentials not configured in environment variables. FCM pushes will run in staging/simulation mode until credentials are provided.');
    }
  } catch (err) {
    console.error('[FCM-ADMIN] Unexpected initialization error:', err);
  }

  return { app: firebaseAdminApp, isConfigured: isFirebaseConfigured };
}

export interface DeviceTokenRecord {
  token: string;
  user_id: string;
  device_type?: string;
  platform?: string;
  browser?: string;
  is_pwa?: boolean;
  user_agent?: string;
  preferences?: {
    orders?: boolean;
    promotions?: boolean;
    price_drops?: boolean;
    security?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  orderId?: string;
  type?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, string>;
  category?: 'orders' | 'promotions' | 'price_drops' | 'security';
}

/**
 * Saves or updates a device token in Supabase.
 * Uses `fcm_tokens` table if available, with fallback to `auth.users` metadata.
 */
export async function saveUserDeviceToken(
  supabase: SupabaseClient,
  record: DeviceTokenRecord
): Promise<boolean> {
  const { user_id, token, device_type, platform, browser, is_pwa, user_agent, preferences } = record;

  if (!user_id || !token) return false;

  // 1. Attempt writing to public.fcm_tokens table
  try {
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id,
        token,
        device_type: device_type || 'desktop',
        platform: platform || 'web',
        browser: browser || 'browser',
        is_pwa: Boolean(is_pwa),
        user_agent: user_agent || '',
        preferences: preferences || { orders: true, promotions: false, price_drops: false, security: true },
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });

    if (!error) {
      return true;
    }
  } catch (tableErr) {
    // Table may not exist yet, fallback below
  }

  // 2. Fallback: store device tokens in user_metadata.fcm_tokens
  try {
    const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(user_id);
    if (!userErr && userRes?.user) {
      const existingMeta = userRes.user.user_metadata || {};
      const tokensList: DeviceTokenRecord[] = existingMeta.fcm_tokens || [];
      
      // Filter out existing matching token and prepend updated one
      const updatedList = [
        {
          token,
          user_id,
          device_type,
          platform,
          browser,
          is_pwa,
          preferences: preferences || { orders: true, promotions: false, price_drops: false, security: true },
          updated_at: new Date().toISOString()
        },
        ...tokensList.filter(t => t.token !== token)
      ].slice(0, 10); // keep last 10 devices per user

      await supabase.auth.admin.updateUserById(user_id, {
        user_metadata: {
          ...existingMeta,
          fcm_tokens: updatedList,
          notification_preferences: preferences || existingMeta.notification_preferences
        }
      });
      return true;
    }
  } catch (metaErr) {
    console.warn('[FCM-ADMIN] Fallback token save to user_metadata warning:', metaErr);
  }

  return false;
}

/**
 * Removes a device token on user logout or unsubscribe
 */
export async function removeUserDeviceToken(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<boolean> {
  if (!token) return false;

  try {
    await supabase.from('fcm_tokens').delete().eq('token', token);
  } catch (e) {
    // Ignore table missing error
  }

  if (userId) {
    try {
      const { data: userRes } = await supabase.auth.admin.getUserById(userId);
      if (userRes?.user?.user_metadata?.fcm_tokens) {
        const existing = userRes.user.user_metadata.fcm_tokens as DeviceTokenRecord[];
        const filtered = existing.filter(t => t.token !== token);
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userRes.user.user_metadata,
            fcm_tokens: filtered
          }
        });
      }
    } catch (e) {}
  }

  return true;
}

/**
 * Retrieves all registered tokens for a user
 */
export async function getUserDeviceTokens(
  supabase: SupabaseClient,
  userId: string
): Promise<DeviceTokenRecord[]> {
  if (!userId) return [];

  // 1. Try fcm_tokens table
  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // 2. Try user_metadata
  try {
    const { data: userRes } = await supabase.auth.admin.getUserById(userId);
    if (userRes?.user?.user_metadata?.fcm_tokens) {
      return userRes.user.user_metadata.fcm_tokens as DeviceTokenRecord[];
    }
  } catch (e) {}

  return [];
}

/**
 * Sends an FCM push notification directly to a list of tokens via FCM HTTP v1 API.
 * Automatically prunes dead/unregistered tokens.
 */
export async function sendPushToTokens(
  supabase: SupabaseClient,
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number; errors: any[] }> {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, errors: [] };
  }

  const { app, isConfigured } = getFirebaseAdmin();
  if (!app || !isConfigured) {
    console.log(`[FCM-ADMIN] Simulation mode: Push notification "${payload.title}" would be sent to ${tokens.length} device(s).`);
    return { successCount: tokens.length, failureCount: 0, errors: [] };
  }

  const targetUrl = payload.url || (payload.orderId ? `/track-order?orderId=${encodeURIComponent(payload.orderId)}` : '/notifications');

  const multicastMessage: MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.image || undefined
    },
    data: {
      title: payload.title,
      body: payload.body,
      url: targetUrl,
      orderId: payload.orderId || '',
      type: payload.type || 'general',
      tag: payload.tag || `oda-${Date.now()}`,
      ...(payload.data || {})
    },
    webpush: {
      fcmOptions: {
        link: targetUrl
      },
      headers: {
        Urgency: 'high'
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-192x192.png',
        badge: payload.badge || '/favicon.png',
        image: payload.image || undefined,
        tag: payload.tag || `oda-${Date.now()}`,
        renotify: true,
        data: {
          url: targetUrl,
          orderId: payload.orderId || null,
          type: payload.type || 'general'
        }
      }
    }
  };

  try {
    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(multicastMessage);
    const tokensToRemove: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          tokensToRemove.push(tokens[idx]);
        }
      }
    });

    // Prune dead tokens from database asynchronously
    if (tokensToRemove.length > 0) {
      console.log(`[FCM-ADMIN] Pruning ${tokensToRemove.length} inactive or expired token(s).`);
      supabase.from('fcm_tokens').delete().in('token', tokensToRemove).then(() => {}, () => {});
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.responses.filter(r => !r.success).map(r => r.error)
    };
  } catch (err: any) {
    console.error('[FCM-ADMIN] sendEachForMulticast failed:', err);
    return { successCount: 0, failureCount: tokens.length, errors: [err] };
  }
}

/**
 * Stores notification in Supabase `notifications` table idempotently
 */
export async function storeInAppNotification(
  supabase: SupabaseClient,
  {
    userId,
    title,
    message,
    type,
    orderId,
    idempotencyKey
  }: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    orderId?: string;
    idempotencyKey?: string;
  }
) {
  if (!userId || !title || !message) return null;

  try {
    const compositeType = orderId ? (type?.includes(':') ? type : `${type || 'general'}:${orderId}`) : (type || 'general');

    const isValidUUID = (str?: string | null): boolean => 
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        order_id: isValidUUID(orderId) ? orderId : null,
        title,
        message,
        type: compositeType,
        is_read: false
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[FCM-ADMIN] In-app notification insert warning:', error.message);
    }

    return data;
  } catch (err) {
    console.warn('[FCM-ADMIN] Error saving in-app notification:', err);
    return null;
  }
}

/**
 * Sends a push notification to a specific user, honoring their category preferences
 * and writing the in-app notification history into Supabase.
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; deliveredDevices: number }> {
  if (!userId) return { success: false, deliveredDevices: 0 };

  // 1. Record in-app notification in Supabase
  await storeInAppNotification(supabase, {
    userId,
    title: payload.title,
    message: payload.body,
    type: payload.type || 'order_status',
    orderId: payload.orderId
  });

  // 2. Fetch user's registered devices
  const devices = await getUserDeviceTokens(supabase, userId);
  if (!devices || devices.length === 0) {
    return { success: true, deliveredDevices: 0 };
  }

  // 3. Filter devices by category preferences
  const category = payload.category || (payload.type?.includes('promo') ? 'promotions' : 'orders');
  const eligibleTokens = devices
    .filter((d) => {
      const prefs = d.preferences || { orders: true, promotions: false, price_drops: false, security: true };
      if (category === 'promotions') return prefs.promotions === true;
      if (category === 'price_drops') return prefs.price_drops === true;
      if (category === 'security') return prefs.security !== false;
      return prefs.orders !== false; // Default orders to true
    })
    .map((d) => d.token);

  if (eligibleTokens.length === 0) {
    console.log(`[FCM-ADMIN] User ${userId} has 0 devices opted in to category "${category}".`);
    return { success: true, deliveredDevices: 0 };
  }

  // 4. Send push via FCM
  const result = await sendPushToTokens(supabase, eligibleTokens, payload);
  return { success: result.successCount > 0, deliveredDevices: result.successCount };
}

/**
 * Sends alert push to all Admins and Super Admins
 */
export async function sendPushToAdmins(
  supabase: SupabaseClient,
  payload: PushNotificationPayload
): Promise<number> {
  try {
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (!adminProfiles || adminProfiles.length === 0) return 0;

    let totalDelivered = 0;
    for (const profile of adminProfiles) {
      const res = await sendPushToUser(supabase, profile.id, {
        ...payload,
        category: 'orders'
      });
      totalDelivered += res.deliveredDevices;
    }
    return totalDelivered;
  } catch (err) {
    console.error('[FCM-ADMIN] Error sending push to admins:', err);
    return 0;
  }
}

/**
 * Broadcasts a promotional message to all opted-in users (restricted to admins)
 */
export async function broadcastPromotion(
  supabase: SupabaseClient,
  payload: PushNotificationPayload
): Promise<{ totalSent: number }> {
  try {
    // 1. Query all tokens from fcm_tokens table where promotions is enabled
    let tokens: string[] = [];
    try {
      const { data } = await supabase
        .from('fcm_tokens')
        .select('token, preferences');

      if (data) {
        tokens = data
          .filter(row => row.preferences?.promotions === true)
          .map(row => row.token);
      }
    } catch (e) {}

    if (tokens.length === 0) {
      return { totalSent: 0 };
    }

    const res = await sendPushToTokens(supabase, tokens, {
      ...payload,
      category: 'promotions'
    });

    return { totalSent: res.successCount };
  } catch (err) {
    console.error('[FCM-ADMIN] Error broadcasting promotion:', err);
    return { totalSent: 0 };
  }
}
