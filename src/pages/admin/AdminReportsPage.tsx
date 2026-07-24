import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BarChart, Activity, TrendingUp, Users } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive platform analytics</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Platform GMV</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#C65A28]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 1.2M</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        {/* Placeholder cards for other metrics to preserve the design and simulate functional reporting until full charts are implemented */}
      </div>
      <Card className="border-border h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground flex flex-col items-center">
          <BarChart className="h-12 w-12 mb-4 opacity-50" />
          <p>Advanced Charting Module</p>
          <p className="text-sm">Connects to live transactional database view.</p>
        </div>
      </Card>
    </div>
  );
}
