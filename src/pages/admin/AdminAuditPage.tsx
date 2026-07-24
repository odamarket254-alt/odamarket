import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { List, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";

export default function AdminAuditPage() {
  const { profile } = useAuthStore();
  if (profile?.role !== "super_admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground">Immutable record of system and administrative actions</p>
      </div>
      
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search audit logs..." className="pl-9 bg-background" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 font-medium border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User ID / Role</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="hover:bg-muted/30">
                  <td className="px-6 py-4 text-muted-foreground font-mono">2026-06-30 17:28:10</td>
                  <td className="px-6 py-4">super_admin (self)</td>
                  <td className="px-6 py-4">Updated user role to Admin</td>
                  <td className="px-6 py-4 text-[#C65A28] font-medium">SUCCESS</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-6 py-4 text-muted-foreground font-mono">2026-06-30 17:15:00</td>
                  <td className="px-6 py-4">System</td>
                  <td className="px-6 py-4">Configuration modified (Rate Limiter)</td>
                  <td className="px-6 py-4 text-[#C65A28] font-medium">SUCCESS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
