import { supabase } from '../lib/supabase';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  orderId?: string;
}

export interface OrderStatusNotificationParams {
  orderId: string;
  userId: string;
  newStatus: string;
  oldStatus?: string;
  orderNumber?: string;
}

// In-memory deduplication cache: `${userId}_${orderId}_${newStatus}` -> timestamp
const deduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60 * 1000; // 1 minute

const isValidUUID = (str?: string | null): boolean => 
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

/**
 * Generates user-facing title and message for order status transitions.
 */
export function getStatusNotificationDetails(status: string, orderNumber: string): { title: string; message: string; type: string } {
  const normStatus = (status || '').toLowerCase().trim();
  const formattedOrder = orderNumber ? (orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`) : '#ODA-ORDER';

  switch (normStatus) {
    case 'confirmed':
      return {
        title: 'Order Confirmed',
        message: `Your order ${formattedOrder} has been confirmed.`,
        type: 'confirmed'
      };
    case 'processing':
    case 'packed':
      return {
        title: 'Order Processing',
        message: `Your order ${formattedOrder} is being prepared.`,
        type: 'processing'
      };
    case 'ready_for_pickup':
      return {
        title: 'Ready for Pickup',
        message: `Your order ${formattedOrder} is ready for pickup.`,
        type: 'ready_for_pickup'
      };
    case 'out_for_delivery':
    case 'shipped':
      return {
        title: 'Out for Delivery',
        message: `Your order ${formattedOrder} is on the way.`,
        type: 'out_for_delivery'
      };
    case 'delivered':
      return {
        title: 'Order Delivered',
        message: `Your order ${formattedOrder} has been delivered.`,
        type: 'delivered'
      };
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        message: `Your order ${formattedOrder} has been cancelled.`,
        type: 'cancelled'
      };
    case 'pending':
    default:
      return {
        title: 'Order Received',
        message: `Your order ${formattedOrder} has been received and is pending confirmation.`,
        type: 'pending'
      };
  }
}

/**
 * Extracts order ID or order number from notification record.
 */
export function parseOrderIdFromNotification(notification: { 
  order_id?: string | null; 
  type?: string | null; 
  message?: string | null;
}): string | null {
  if (!notification) return null;
  
  if (notification.order_id) {
    return notification.order_id;
  }

  // Check type for encoded orderId (e.g., 'order_status:confirmed:UUID' or 'order:UUID')
  if (notification.type && notification.type.includes(':')) {
    const parts = notification.type.split(':');
    for (const part of parts) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part.trim())) {
        return part.trim();
      }
    }
  }

  // Search message for UUID
  if (notification.message) {
    const uuidMatch = notification.message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) return uuidMatch[0];

    // Search message for #ODA-XXXXX or #XXXXX
    const orderNumMatch = notification.message.match(/#([A-Za-z0-9-]+)/);
    if (orderNumMatch && orderNumMatch[1]) {
      return orderNumMatch[1];
    }
  }

  return null;
}

/**
 * Automatically creates and broadcasts a notification when an order status changes.
 */
export async function notifyOrderStatusChange({
  orderId,
  userId,
  newStatus,
  oldStatus,
  orderNumber
}: OrderStatusNotificationParams): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    if (!userId || !orderId || !newStatus) {
      console.warn('[NotificationService] Missing required parameters for notifyOrderStatusChange');
      return { success: false, error: 'Missing parameters' };
    }

    const normNew = newStatus.toLowerCase().trim();
    const normOld = oldStatus ? oldStatus.toLowerCase().trim() : '';

    // Prevent duplicate notifications if the status didn't actually change
    if (normOld && normOld === normNew) {
      console.log(`[NotificationService] Status unchanged (${normNew}), skipping notification.`);
      return { success: true };
    }

    // Check in-memory deduplication cache
    const cacheKey = `${userId}_${orderId}_${normNew}`;
    const lastSent = deduplicationCache.get(cacheKey);
    const now = Date.now();
    if (lastSent && now - lastSent < DEDUPLICATION_WINDOW_MS) {
      console.log(`[NotificationService] Duplicate status notification prevented by cache window.`);
      return { success: true };
    }
    deduplicationCache.set(cacheKey, now);

    // Format display order number
    const displayOrderNum = orderNumber || (orderId.length > 8 ? `ODA-${orderId.slice(0, 8).toUpperCase()}` : `ODA-${orderId}`);
    const { title, message, type } = getStatusNotificationDetails(normNew, displayOrderNum);

    // Prepare notification payload
    // We encode orderId in type as `order_status:${normNew}:${orderId}` so it's always accessible
    const compositeType = `order_status:${normNew}:${orderId}`;

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
      .single();

    if (error) {
      console.error('[NotificationService] Failed to insert notification in Supabase:', error);
      return { success: false, error };
    }

    const createdRecord = data || {
      id: `local-${Date.now()}`,
      user_id: userId,
      order_id: orderId,
      title,
      message,
      type: compositeType,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Broadcast in real-time to the specific user channel
    try {
      const channel = supabase.channel(`user-notifications:${userId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload: {
              ...createdRecord,
              order_id: orderId
            }
          });
          // Unsubscribe broadcast sender after dispatch
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 1500);
        }
      });
    } catch (realtimeErr) {
      console.warn('[NotificationService] Realtime broadcast notice warning:', realtimeErr);
    }

    console.log(`[NotificationService] Order notification created successfully for user ${userId}: "${title}"`);
    return { success: true, id: createdRecord.id };
  } catch (err) {
    console.error('[NotificationService] Unexpected error in notifyOrderStatusChange:', err);
    return { success: false, error: err };
  }
}

/**
 * General helper to create a generic notification.
 */
export async function createCustomerNotification({
  userId,
  title,
  message,
  type = 'general',
  orderId
}: CreateNotificationParams): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    if (!userId || !title || !message) {
      return { success: false, error: 'Missing parameters' };
    }

    const compositeType = orderId ? `${type}:${orderId}` : type;

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
      .single();

    if (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return { success: false, error };
    }

    // Realtime broadcast
    try {
      const channel = supabase.channel(`user-notifications:${userId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload: {
              ...(data || {}),
              order_id: orderId
            }
          });
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 1500);
        }
      });
    } catch (e) {
      console.warn('Broadcast error:', e);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[NotificationService] Unexpected error in createCustomerNotification:', err);
    return { success: false, error: err };
  }
}
