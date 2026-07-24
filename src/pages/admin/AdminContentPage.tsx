import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FileEdit, Globe, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Management</h1>
        <p className="text-muted-foreground">Manage homepage, banners, and static pages</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5"/> Homepage Banners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border/50 rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Summer Electronics Sale</p>
                <p className="text-sm text-muted-foreground">Active until Aug 31</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <Button className="w-full">Add New Banner</Button>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/> Static Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Terms of Service", "Privacy Policy", "About Us"].map(page => (
              <div key={page} className="border border-border/50 rounded-md p-4 flex items-center justify-between">
                <p className="font-medium">{page}</p>
                <Button variant="outline" size="sm">Edit Text</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
