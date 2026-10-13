import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function AdminNotificationsPage() {
  const { profile } = useAuthStore();
  if (profile?.role !== "super_admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notification Center</h1>
        <p className="text-muted-foreground">Send global platform announcements</p>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Announcement Title" />
          <textarea 
            className="w-full min-h-[150px] p-3 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/50 outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            placeholder="Write your announcement here. This will be sent to all users..."
          />
          <Button className="w-full sm:w-auto flex items-center gap-2"><Send className="h-4 w-4"/> Broadcast to All Users</Button>
        </CardContent>
      </Card>
    </div>
  );
}
