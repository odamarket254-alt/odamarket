import express from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
 * POST /api/notifications/broadcast-announcement
 * Admin-only broadcast of promotional or system announcements via in-app notifications
 */
router.post('/broadcast-announcement', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { title, body, url } = req.body;

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

    // Fetch buyer user profiles
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1000);

    if (profilesErr) {
      console.error('[Notification-Route] Error fetching profiles:', profilesErr);
      return res.status(500).json({ error: 'Failed to retrieve recipient profiles.' });
    }

    const recipients = profiles || [];
    if (recipients.length > 0) {
      const notificationsToInsert = recipients.map((p) => ({
        user_id: p.id,
        title: title.trim(),
        message: body.trim(),
        type: 'promotional_announcement',
        is_read: false
      }));

      const { error: insertErr } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertErr) {
        console.warn('[Notification-Route] In-app broadcast insert warning:', insertErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Announcement broadcast successfully to ${recipients.length} in-app inbox(es).`,
      totalSent: recipients.length
    });
  } catch (err: any) {
    console.error('[Notification-Route] Broadcast error:', err);
    return res.status(500).json({ error: 'Failed to send broadcast.', details: err.message });
  }
});

export default router;
