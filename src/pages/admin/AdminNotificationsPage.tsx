import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Bell, Send, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const { profile } = useAuthStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/products?deal=flash");
  const [isSending, setIsSending] = useState(false);
  const [lastBroadcastResult, setLastBroadcastResult] = useState<string | null>(null);

  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both an announcement title and message body.");
      return;
    }

    setIsSending(true);
    setLastBroadcastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        toast.error("Authentication expired. Please re-login.");
        return;
      }

      const res = await fetch("/api/notifications/broadcast-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/products"
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to broadcast announcement.");
      } else {
        toast.success(data.message || "Announcement broadcast dispatched successfully! 🚀");
        setLastBroadcastResult(`Dispatched to ${data.totalSent ?? 0} buyer account(s).`);
        setTitle("");
        setBody("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error sending broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notification Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Broadcast promotional alerts and system announcements to buyer accounts via in-app notifications.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#C65A28]" />
            New In-App Announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Announcement Title
              </label>
              <Input 
                placeholder="e.g., Weekend Flash Sale: 20% Off Farm Produce!" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Target Click URL
              </label>
              <Input 
                placeholder="e.g., /products?deal=flash or /products/fresh-tomatoes" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Where the buyer is taken when opening the notification link.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Notification Message Body
              </label>
              <textarea 
                className="w-full min-h-[120px] p-3 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/50 outline-none text-foreground placeholder:text-muted-foreground text-sm"
                placeholder="Write your announcement details here. E.g., Stock up on freshly picked vegetables and pantry essentials before midnight..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={240}
                required
              />
            </div>

            {/* Notification Preview */}
            {(title || body) && (
              <div className="p-3.5 bg-[#FAF5EC] dark:bg-card border border-[#D9A62E]/30 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#C65A28] uppercase tracking-wider block">
                  Notification Preview
                </span>
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="w-8 h-8 rounded-lg bg-[#3A2418] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    ODA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{title || "Announcement Title"}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{body || "Notification body text goes here..."}</p>
                  </div>
                </div>
              </div>
            )}

            {lastBroadcastResult && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{lastBroadcastResult}</span>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSending || !title.trim() || !body.trim()}
              className="w-full sm:w-auto bg-[#3A2418] hover:bg-[#2A1810] text-white flex items-center gap-2 text-sm h-10 px-6"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Broadcast to Buyers
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
