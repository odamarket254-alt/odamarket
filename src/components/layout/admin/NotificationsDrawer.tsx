import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, ShoppingCart, AlertTriangle, UserPlus, CreditCard, Star, CheckCircle2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

export default function NotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Placeholder data for UI demonstration
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', title: 'New Order Received', message: 'Order #ORD-2024-001 has been placed.', time: new Date(Date.now() - 1000 * 60 * 5), read: false, icon: ShoppingCart, color: 'bg-blue-100 text-[#C65A28]' },
    { id: 2, type: 'alert', title: 'Low Stock Alert', message: 'Product "Premium Coffee Beans" is below minimum threshold.', time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false, icon: AlertTriangle, color: 'bg-[#D9A62E]/10 text-[#D9A62E]' },
    { id: 3, type: 'user', title: 'New Customer Registration', message: 'Jane Doe just created an account.', time: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true, icon: UserPlus, color: 'bg-[#E8DCC9] text-[#C65A28]' },
    { id: 4, type: 'payment', title: 'Payment Failed', message: 'Payment for order #ORD-2024-002 failed to process.', time: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true, icon: CreditCard, color: 'bg-[#B94A48]/10 text-[#B94A48]' },
    { id: 5, type: 'review', title: 'New 5-Star Review', message: 'John Smith left a 5-star review for "Organic Honey".', time: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true, icon: Star, color: 'bg-purple-100 text-[#6B8E23]' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = activeTab === 'all' ? notifications : notifications.filter(n => !n.read);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-[#5F5A54] hover:bg-[#E8DCC9] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-[#B94A48] rounded-full ring-2 ring-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#3A2418]/20 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#FFFDF8] shadow-2xl z-50 flex flex-col border-l border-[#E8DCC9]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DCC9]">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#3A2418]">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-[#C65A28]/10 text-[#C65A28] text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   {unreadCount > 0 && (
                     <button onClick={markAllAsRead} className="text-xs font-medium text-[#C65A28] hover:text-[#C65A28] transition-colors" title="Mark all as read">
                       <CheckCircle2 className="w-4 h-4" />
                     </button>
                   )}
                   <button onClick={() => setIsOpen(false)} className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-full transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center px-6 border-b border-[#E8DCC9]">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'all' ? "border-[#C65A28] text-[#C65A28]" : "border-transparent text-[#5F5A54] hover:text-[#5F5A54]"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                    activeTab === 'unread' ? "border-[#C65A28] text-[#C65A28]" : "border-transparent text-[#5F5A54] hover:text-[#5F5A54]"
                  )}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#B94A48]"></span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 bg-[#FAF5EC] rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-[#8B857D]" />
                    </div>
                    <h3 className="text-[#3A2418] font-medium mb-1">No notifications</h3>
                    <p className="text-sm text-[#5F5A54]">You're all caught up! Check back later for updates.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={cn(
                          "p-6 hover:bg-[#FAF5EC] transition-colors cursor-pointer group relative",
                          !notification.read && "bg-[#F3F6F4]/30"
                        )}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C65A28]"></div>
                        )}
                        <div className="flex gap-4">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", notification.color)}>
                            <notification.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-semibold mb-1", !notification.read ? "text-[#3A2418]" : "text-[#5F5A54]")}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-[#5F5A54] mb-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#8B857D] font-medium">
                              {format(notification.time, 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
