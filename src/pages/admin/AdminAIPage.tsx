import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Cpu, Activity, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function AdminAIPage() {
  const { profile } = useAuthStore();
  
  if (profile?.role !== "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Management</h1>
        <p className="text-muted-foreground">Monitor and configure AI models and usage</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">API Tokens Used</CardTitle>
            <Cpu className="h-4 w-4 text-[#C65A28]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2M</div>
            <p className="text-xs text-muted-foreground">Gemini 1.5 Pro</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">Concurrent AI sessions</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Model Status</CardTitle>
            <Activity className="h-4 w-4 text-[#D9A62E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C65A28]">Operational</div>
            <p className="text-xs text-muted-foreground">Latency: ~800ms</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
