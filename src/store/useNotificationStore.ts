import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { parseOrderIdFromNotification } from '../services/notificationService';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  user_id: string;
  order_id?: string | null;
  type?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  currentUserId: string | null;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: AppNotification, showToast?: boolean) => void;
  setupRealtimeSubscription: (userId: string) => () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentUserId: null,

  fetchNotifications: async (userId: string) => {
    if (!userId) {
      set({ notifications: [], unreadCount: 0, loading: false, error: null, currentUserId: null });
      return;
    }

    set({ loading: true, error: null, currentUserId: userId });

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useNotificationStore] Error fetching notifications:', error);
        set({ error: 'Unable to load notifications. Please try again.', loading: false });
        return;
      }

      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        order_id: parseOrderIdFromNotification(row),
        type: row.type,
        title: row.title,
        message: row.message,
        is_read: row.is_read !== undefined ? Boolean(row.is_read) : Boolean(row.read),
        created_at: row.created_at || new Date().toISOString()
      }));

      const unreadCount = formatted.filter((n: AppNotification) => !n.is_read).length;

      set({
        notifications: formatted,
        unreadCount,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('[useNotificationStore] Unexpected fetch error:', err);
      set({ error: 'Unable to load notifications. Please try again.', loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const { notifications } = get();
    const target = notifications.find((n) => n.id === id);
    if (!target || target.is_read) return;

    // Optimistic local update
    const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    const unreadCount = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount });

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('[useNotificationStore] Failed to update is_read in Supabase:', error);
      }
    } catch (err) {
      console.error('[useNotificationStore] Unexpected markAsRead error:', err);
    }
  },

  markAllAsRead: async (userId: string) => {
    if (!userId) return;
    const { notifications } = get();

    // Optimistic local update
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications: updated, unreadCount: 0 });

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[useNotificationStore] Failed to mark all as read in Supabase:', error);
      } else {
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('[useNotificationStore] Unexpected markAllAsRead error:', err);
    }
  },

  deleteNotification: async (id: string) => {
    const { notifications } = get();
    const updated = notifications.filter((n) => n.id !== id);
    const unreadCount = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount });

    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error('[useNotificationStore] Error deleting notification:', err);
    }
  },

  addNotification: (notification: AppNotification, showToast = true) => {
    const { notifications } = get();
    // Avoid duplicate item in state
    if (notifications.some((n) => n.id === notification.id)) {
      return;
    }

    const order_id = notification.order_id || parseOrderIdFromNotification(notification);
    const fullNotification: AppNotification = {
      ...notification,
      order_id
    };

    const newNotifications = [fullNotification, ...notifications];
    const unreadCount = newNotifications.filter((n) => !n.is_read).length;

    set({ notifications: newNotifications, unreadCount });

    if (showToast) {
      toast.info(fullNotification.title, {
        description: fullNotification.message,
        duration: 5000
      });
    }
  },

  setupRealtimeSubscription: (userId: string) => {
    if (!userId) return () => {};

    // Generate unique channel names to avoid collisions
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const subChannelId = `user-notif-${userId}-${uniqueSuffix}`;
    const broadcastChannelId = `user-notifications-${userId}-${uniqueSuffix}`;
    const ordersChannelId = `orders-watcher-${userId}-${uniqueSuffix}`;

    // 1. Listen for Supabase Postgres changes on notifications table
    const postgresChannel = supabase
      .channel(subChannelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload?.new) {
            const raw = payload.new;
            const newNotif: AppNotification = {
              id: raw.id,
              user_id: raw.user_id,
              order_id: parseOrderIdFromNotification(raw),
              type: raw.type,
              title: raw.title,
              message: raw.message,
              is_read: raw.is_read !== undefined ? Boolean(raw.is_read) : Boolean(raw.read),
              created_at: raw.created_at || new Date().toISOString()
            };
            get().addNotification(newNotif, true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload?.new) {
            const raw = payload.new;
            set((state) => {
              const updatedList = state.notifications.map((item) =>
                item.id === raw.id
                  ? {
                      ...item,
                      is_read: raw.is_read !== undefined ? Boolean(raw.is_read) : Boolean(raw.read),
                      title: raw.title,
                      message: raw.message
                    }
                  : item
              );
              return {
                notifications: updatedList,
                unreadCount: updatedList.filter((n) => !n.is_read).length
              };
            });
          }
        }
      )
      .subscribe();

    // 2. Realtime Broadcast Channel for direct pushes
    const broadcastChannel = supabase
      .channel(broadcastChannelId)
      .on('broadcast', { event: 'new_notification' }, (eventPayload: any) => {
        if (eventPayload?.payload) {
          const raw = eventPayload.payload;
          if (raw.user_id === userId) {
            const newNotif: AppNotification = {
              id: raw.id || `live-${Date.now()}`,
              user_id: raw.user_id,
              order_id: raw.order_id || parseOrderIdFromNotification(raw),
              type: raw.type,
              title: raw.title,
              message: raw.message,
              is_read: Boolean(raw.is_read),
              created_at: raw.created_at || new Date().toISOString()
            };
            get().addNotification(newNotif, true);
          }
        }
      })
      .subscribe();

    // 3. Fallback listener on orders table updates for this customer
    const orderChangesChannel = supabase
      .channel(ordersChannelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload?.new && payload?.old && payload.new.status !== payload.old.status) {
            // Order status changed, refetch notifications to ensure sync
            get().fetchNotifications(userId);
          }
        }
      )
      .subscribe();

    // Return cleanup function to unsubscribe cleanly
    return () => {
      supabase.removeChannel(postgresChannel);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(orderChangesChannel);
    };
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      currentUserId: null
    });
  }
}));
