import React, { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const subscription = supabase
      .channel(`notifications-${user.id}-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast(newNotif.title, {
            description: newNotif.message,
            icon: <Bell className="h-4 w-4 text-emerald-500" />,
            action: newNotif.link ? {
              label: "View",
              onClick: () => window.location.href = newNotif.link
            } : undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.read).length);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("user_id", user!.id);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1 text-emerald-500 hover:text-emerald-400"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors flex gap-3",
                  !notif.read ? "bg-muted/30" : ""
                )}
              >
                <div className="mt-1">
                  {!notif.read && (
                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {notif.link && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-emerald-500"
                        render={<Link to={notif.link} />}
                        onClick={() => {
                          markAsRead(notif.id);
                          setIsOpen(false);
                        }}
                      >
                        View details
                      </Button>
                    )}
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs ml-auto hover:bg-transparent text-muted-foreground hover:text-foreground flex gap-1"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <Check className="h-3 w-3" /> Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
