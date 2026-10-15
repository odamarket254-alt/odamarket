import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  CheckCircle2, 
  Clock, 
  Package, 
  Store, 
  Truck, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  LogIn,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore, AppNotification } from '../store/useNotificationStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setupRealtimeSubscription
  } = useNotificationStore();

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications(user.id);
    const unsubscribe = setupRealtimeSubscription(user.id);

    return () => {
      unsubscribe();
    };
  }, [user?.id, fetchNotifications, setupRealtimeSubscription]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    if (notif.order_id) {
      navigate(`/track-order?orderId=${encodeURIComponent(notif.order_id)}`);
    }
  };

  const getStatusIcon = (type?: string | null, title?: string, message?: string) => {
    const raw = `${type || ''} ${title || ''} ${message || ''}`.toLowerCase();
    
    if (raw.includes('delivered')) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (raw.includes('out_for_delivery') || raw.includes('on the way') || raw.includes('shipped')) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5" />
        </div>
      );
    }
    if (raw.includes('ready_for_pickup') || raw.includes('pickup')) {
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5" />
        </div>
      );
    }
    if (raw.includes('processing') || raw.includes('prepared') || raw.includes('packed')) {
      return (
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5" />
        </div>
      );
    }
    if (raw.includes('confirmed')) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 stroke-[2.5]" />
        </div>
      );
    }
    if (raw.includes('cancelled')) {
      return (
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
      );
    }
    if (raw.includes('pending')) {
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-[#FAF5EC] text-[#C65A28] flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const formatNotificationTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter((n) => !n.is_read);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Notifications</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#3A2418] flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#B94A48]/10 text-[#B94A48] font-semibold">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your live order status, pickups, and delivery milestones.
          </p>
        </div>

        {user && unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead(user.id)}
            className="text-xs text-[#C65A28] border-[#C65A28]/30 hover:bg-[#C65A28]/10 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Logged Out State */}
      {!user && (
        <Card className="p-8 md:p-12 text-center max-w-md mx-auto border-border/80 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FAF5EC] text-[#C65A28] flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[#3A2418] mb-2">Sign in to view your notifications</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Log in to view personalized real-time order updates, tracking alerts, and store notices.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#C65A28] hover:bg-[#A0441D] text-white px-6 font-medium"
          >
            Sign In to Account
          </Button>
        </Card>
      )}

      {/* Logged In Content */}
      {user && (
        <div className="space-y-6">
          {/* Tabs */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                  activeTab === 'all'
                    ? 'bg-[#3A2418] text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                  activeTab === 'unread'
                    ? 'bg-[#3A2418] text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && notifications.length === 0 && (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#C65A28] mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading your notifications...</p>
            </div>
          )}

          {/* Error */}
          {error && notifications.length === 0 && (
            <Card className="p-8 text-center border-rose-200 bg-rose-50/30">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-rose-800 mb-1">Unable to load notifications</h3>
              <p className="text-sm text-rose-600 mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(user.id)}
                className="text-xs"
              >
                Try Again
              </Button>
            </Card>
          )}

          {/* Empty */}
          {!loading && filteredNotifications.length === 0 && (
            <div className="py-16 px-4 text-center bg-card border border-dashed border-border rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-[#FAF5EC] text-[#C65A28]/60 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-[#3A2418] mb-1">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Your order updates and important messages will appear here.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/products')}
                className="text-xs"
              >
                Explore Market Products
              </Button>
            </div>
          )}

          {/* List */}
          {filteredNotifications.length > 0 && (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const hasOrder = Boolean(notif.order_id);

                return (
                  <Card
                    key={notif.id}
                    className={cn(
                      'p-4 md:p-5 flex items-start gap-4 transition-all duration-150 cursor-pointer border-border hover:shadow-md group',
                      !notif.is_read
                        ? 'bg-[#FAF5EC]/70 border-[#C65A28]/30 hover:bg-[#FAF5EC]'
                        : 'bg-white hover:bg-slate-50'
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {getStatusIcon(notif.type, notif.title, notif.message)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            'text-base leading-snug',
                            !notif.is_read ? 'font-semibold text-[#3A2418]' : 'font-medium text-[#5F5A54]'
                          )}>
                            {notif.title}
                          </h3>
                          {!notif.is_read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C65A28] shrink-0" title="Unread" />
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatNotificationTime(notif.created_at)}
                        </span>
                      </div>

                      <p className={cn(
                        'text-sm leading-relaxed mb-3',
                        !notif.is_read ? 'text-[#3A2418]/90' : 'text-muted-foreground'
                      )}>
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        {hasOrder ? (
                          <span className="text-xs font-semibold text-[#C65A28] group-hover:underline inline-flex items-center gap-1">
                            Track Order Progress
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Notification</span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-muted-foreground hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
