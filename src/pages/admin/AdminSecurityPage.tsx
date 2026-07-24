import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ShieldAlert, ShieldCheck, Search, Activity, Users, Lock, Key } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function AdminSecurityPage() {
  const { profile } = useAuthStore();
  
  if (profile?.role !== "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Security Center
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage platform security. Super Admin access only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Failed Logins</CardTitle>
            <ShieldAlert className="h-4 w-4 text-[#B94A48]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1 text-[#B94A48]">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Suspicious IPs</CardTitle>
            <Activity className="h-4 w-4 text-[#D9A62E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Blocked automatically</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-[#C65A28]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground mt-1 text-[#C65A28]">Live</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">API Keys</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="border-border bg-muted/50">
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-sm text-muted-foreground text-center py-8">
               Audit logging is active. No critical events in the last hour.
             </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/50">
          <CardHeader>
            <CardTitle>Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-center gap-2 text-sm text-[#C65A28] font-medium py-8">
               <ShieldCheck className="h-5 w-5" />
               No active threats detected. Platform secure.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
