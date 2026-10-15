import express from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  saveUserDeviceToken,
  removeUserDeviceToken,
  sendPushToUser,
  sendPushToTokens,
  broadcastPromotion,
  getFirebaseAdmin,
  resolveFirebaseServiceAccount,
  PushNotificationPayload
} from './fcmServerService.js';
import { getStatusNotificationDetails } from '../src/services/notificationService.js';

const router = express.Router();

function getSupabase(): SupabaseClient | null {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Middleware to extract and verify authenticated Supabase user
 */
async function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication session.' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed.', details: err.message });
  }
}

/**
 * GET /api/notifications/status
 * Public health check for FCM service status
 */
router.get('/status', (req, res) => {
  const { isConfigured } = getFirebaseAdmin();
  const { projectId } = resolveFirebaseServiceAccount();
  res.status(200).json({
    status: 'ok',
    configured: isConfigured,
    projectId: projectId || 'odamarket-4cfaf',
    vapidKeyConfigured: Boolean(process.env.VITE_FIREBASE_VAPID_KEY),
    mode: isConfigured ? 'production' : 'staging_simulation'
  });
});

/**
 * POST /api/notifications/register-device
 * Registers an FCM token for the authenticated user
 */
router.post('/register-device', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { token, preferences, device_type, platform, browser, is_pwa, user_agent } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing registration token.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    const success = await saveUserDeviceToken(supabase, {
      user_id: user.id,
      token: token.trim(),
      preferences: preferences || { orders: true, promotions: false, price_drops: false, security: true },
      device_type,
      platform,
      browser,
      is_pwa: Boolean(is_pwa),
      user_agent
    });

    if (success) {
      return res.status(200).json({ success: true, message: 'Device token registered successfully.' });
    } else {
      return res.status(500).json({ error: 'Failed to record device token.' });
    }
  } catch (err: any) {
    console.error('[FCM-ROUTE] Error in /register-device:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * POST /api/notifications/unregister-device
 * Removes an FCM token upon user signout or permission revoke
 */
router.post('/unregister-device', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token to unregister.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    await removeUserDeviceToken(supabase, user.id, token.trim());
    return res.status(200).json({ success: true, message: 'Device unregistered successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unregister device.' });
  }
});

/**
 * POST /api/notifications/update-preferences
 * Updates notification category preferences for a token
 */
router.post('/update-preferences', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { token, preferences } = req.body;

  if (!token || !preferences) {
    return res.status(400).json({ error: 'Missing token or preferences.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    await saveUserDeviceToken(supabase, {
      user_id: user.id,
      token: token.trim(),
      preferences
    });
    return res.status(200).json({ success: true, preferences });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

/**
 * POST /api/notifications/test-push
 * Dispatches an immediate test push to the calling user's specified device
 */
router.post('/test-push', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { token } = req.body;

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    const tokens = token ? [token.trim()] : [];
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No active device token provided for test.' });
    }

    const testPayload: PushNotificationPayload = {
      title: 'ODA Market Test Alert',
      body: 'Your device is configured and receiving live push notifications successfully! 🔔',
      url: '/buyer/settings',
      type: 'test',
      tag: `test-${Date.now()}`
    };

    const result = await sendPushToTokens(supabase, tokens, testPayload);

    return res.status(200).json({
      success: true,
      message: 'Test notification sent! Check your notification center or lock screen.',
      result
    });
  } catch (err: any) {
    console.error('[FCM-ROUTE] Test push error:', err);
    return res.status(500).json({ error: 'Failed to dispatch test push.', details: err.message });
  }
});

/**
 * POST /api/notifications/send-order-status
 * Sends an order status push notification to the buyer.
 * Callable internally or by authenticated admins.
 */
router.post('/send-order-status', async (req, res) => {
  const { orderId, newStatus, userId, orderNumber } = req.body;

  if (!orderId || !newStatus) {
    return res.status(400).json({ error: 'Missing orderId or newStatus.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    // 1. Fetch order details if userId not supplied
    let targetUserId = userId;
    let targetOrderNumber = orderNumber;

    if (!targetUserId) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .maybeSingle();

      if (order) {
        targetUserId = order.user_id;
        targetOrderNumber = targetOrderNumber || order.order_number;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'Order or associated user not found.' });
    }

    // 2. Generate title and message
    const displayNum = targetOrderNumber || `#ODA-${orderId.slice(0, 8).toUpperCase()}`;
    const { title, message } = getStatusNotificationDetails(newStatus, displayNum);

    const payload: PushNotificationPayload = {
      title,
      body: message,
      orderId,
      url: `/track-order?orderId=${encodeURIComponent(orderId)}`,
      type: `order_status:${newStatus}:${orderId}`,
      tag: `order-${orderId}`,
      category: 'orders'
    };

    const pushResult = await sendPushToUser(supabase, targetUserId, payload);

    return res.status(200).json({
      success: true,
      message: 'Order status notification processed.',
      pushResult
    });
  } catch (err: any) {
    console.error('[FCM-ROUTE] Error in /send-order-status:', err);
    return res.status(500).json({ error: 'Failed to send order status notification.', details: err.message });
  }
});

/**
 * POST /api/notifications/broadcast-announcement
 * Admin-only broadcast of promotional or system announcements
 */
router.post('/broadcast-announcement', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { title, body, url, targetRole } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }

  try {
    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required to send broadcasts.' });
    }

    const payload: PushNotificationPayload = {
      title: title.trim(),
      body: body.trim(),
      url: url ? url.trim() : '/products',
      type: 'promotional_announcement',
      category: 'promotions'
    };

    const result = await broadcastPromotion(supabase, payload);

    return res.status(200).json({
      success: true,
      message: `Announcement broadcast successfully to ${result.totalSent} device(s).`,
      totalSent: result.totalSent
    });
  } catch (err: any) {
    console.error('[FCM-ROUTE] Broadcast error:', err);
    return res.status(500).json({ error: 'Failed to send broadcast.', details: err.message });
  }
});

export default router;
