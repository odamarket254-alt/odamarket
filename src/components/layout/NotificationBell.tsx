import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  LogIn
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore, AppNotification } from '../../store/useNotificationStore';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface NotificationBellProps {
  className?: string;
  triggerClassName?: string;
  isMobile?: boolean;
}

export function NotificationBell({ className, triggerClassName, isMobile = false }: NotificationBellProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription
  } = useNotificationStore();

  // Load initial notifications and setup realtime listener
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications(user.id);
    const unsubscribe = setupRealtimeSubscription(user.id);

    return () => {
      unsubscribe();
    };
  }, [user?.id, fetchNotifications, setupRealtimeSubscription]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: AppNotification) => {
    // Mark as read immediately
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    // If notification has an order_id, navigate to existing track-order page
    if (notif.order_id) {
      navigate(`/track-order?orderId=${encodeURIComponent(notif.order_id)}`);
    }
  };

  const getStatusIcon = (type?: string | null, title?: string, message?: string) => {
    const raw = `${type || ''} ${title || ''} ${message || ''}`.toLowerCase();
    
    if (raw.includes('delivered')) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (raw.includes('out_for_delivery') || raw.includes('on the way') || raw.includes('shipped')) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4" />
        </div>
      );
    }
    if (raw.includes('ready_for_pickup') || raw.includes('pickup')) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Store className="w-4 h-4" />
        </div>
      );
    }
    if (raw.includes('processing') || raw.includes('prepared') || raw.includes('packed')) {
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4" />
        </div>
      );
    }
    if (raw.includes('confirmed')) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }
    if (raw.includes('cancelled')) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <XCircle className="w-4 h-4" />
        </div>
      );
    }
    if (raw.includes('pending')) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-[#FAF5EC] text-[#C65A28] flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4" />
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
    <div className={cn('relative inline-block', className)}>
      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={cn(
          'relative w-10 h-10 rounded-full bg-[#FAF5EC] flex items-center justify-center text-[#5F5A54] hover:bg-[#C65A28]/10 hover:text-[#C65A28] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C65A28]/30',
          isOpen && 'bg-[#C65A28]/10 text-[#C65A28]',
          triggerClassName
        )}
      >
        <Bell className="w-5 h-5" strokeWidth={2} />
        
        {/* Red unread count badge */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#B94A48] text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown / Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-border/80 z-50 overflow-hidden flex flex-col transition-all duration-150 animate-in fade-in zoom-in-95',
            isMobile && 'top-16 right-2 left-2 w-auto sm:w-[380px]'
          )}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border/60 bg-[#FAF5EC]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-[#3A2418]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#B94A48]/10 text-[#B94A48] rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {user && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead(user.id)}
                  className="text-xs font-medium text-[#C65A28] hover:text-[#A0441D] hover:underline flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-black/5 sm:hidden"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          {user && notifications.length > 0 && (
            <div className="px-4 pt-2.5 pb-2 flex items-center gap-2 border-b border-border/40 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  activeTab === 'all'
                    ? 'bg-[#3A2418] text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  activeTab === 'unread'
                    ? 'bg-[#3A2418] text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-border/40">
            {/* Logged-out State */}
            {!user && (
              <div className="py-8 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF5EC] text-[#C65A28] flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm text-[#3A2418] mb-1">Sign in to view notifications</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Log in to track your order status updates and receive live delivery alerts.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="bg-[#C65A28] hover:bg-[#A0441D] text-white font-medium text-xs px-4"
                >
                  Sign In
                </Button>
              </div>
            )}

            {/* Loading State */}
            {user && loading && notifications.length === 0 && (
              <div className="py-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#C65A28] mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading notifications...</p>
              </div>
            )}

            {/* Error State */}
            {user && error && notifications.length === 0 && (
              <div className="py-8 px-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-rose-600 mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(user.id)}
                  className="text-xs h-7"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty State */}
            {user && !loading && filteredNotifications.length === 0 && (
              <div className="py-10 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF5EC] text-[#C65A28]/60 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm text-[#3A2418] mb-1">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h4>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                  Your order updates and important messages will appear here.
                </p>
              </div>
            )}

            {/* Notification Items */}
            {user && filteredNotifications.map((notif) => {
              const hasOrder = Boolean(notif.order_id);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left group',
                    !notif.is_read
                      ? 'bg-[#FAF5EC]/60 hover:bg-[#FAF5EC]'
                      : 'bg-white hover:bg-slate-50'
                  )}
                >
                  {/* Status Icon */}
                  {getStatusIcon(notif.type, notif.title, notif.message)}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={cn(
                        'text-sm truncate leading-snug',
                        !notif.is_read ? 'font-semibold text-[#3A2418]' : 'font-medium text-[#5F5A54]'
                      )}>
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#C65A28] shrink-0" title="Unread" />
                      )}
                    </div>

                    <p className={cn(
                      'text-xs leading-relaxed line-clamp-2',
                      !notif.is_read ? 'text-[#3A2418]/90 font-normal' : 'text-muted-foreground'
                    )}>
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 pt-0.5">
                      <span className="text-[11px] text-muted-foreground font-normal">
                        {formatNotificationTime(notif.created_at)}
                      </span>

                      {hasOrder && (
                        <span className="text-[11px] font-medium text-[#C65A28] group-hover:underline inline-flex items-center gap-0.5">
                          Track Order
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {user && (
            <div className="px-4 py-2.5 bg-[#FAF5EC]/40 border-t border-border/60 flex items-center justify-between text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="font-semibold text-[#C65A28] hover:underline flex items-center gap-1 transition-colors"
              >
                See all notifications →
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/track-order');
                }}
                className="font-medium text-muted-foreground hover:text-[#C65A28] transition-colors"
              >
                Track by ID
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
