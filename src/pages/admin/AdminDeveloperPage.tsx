import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Terminal, Code, Server } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function AdminDeveloperPage() {
  const { profile } = useAuthStore();
  if (profile?.role !== "super_admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Developer Tools</h1>
        <p className="text-muted-foreground">System logs, background jobs, and API health</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5"/> Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Node ENV:</span> <span className="text-[#C65A28]">production</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime:</span> <span>14 days, 3 hours</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Memory Usage:</span> <span>184 MB / 512 MB</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5"/> Recent Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/80 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
{`[2026-06-30T17:15:22Z] INFO: Server started on port 3000
[2026-06-30T17:21:40Z] WARN: Rate limit triggered for IP 192.168.1.1
[2026-06-30T17:25:11Z] INFO: GCS Upload successful (file: invoice.pdf)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
