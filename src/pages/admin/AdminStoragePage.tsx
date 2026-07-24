import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HardDrive, Cloud, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function AdminStoragePage() {
  const { profile } = useAuthStore();
  if (profile?.role !== "super_admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Storage Management</h1>
        <p className="text-muted-foreground">Monitor GCS and database storage usage</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5"/> GCS Bucket Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142.5 GB</div>
            <p className="text-muted-foreground mt-2">12,402 files</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5"/> Postgres Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.4 GB</div>
            <p className="text-muted-foreground mt-2">Scale-to-zero active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
