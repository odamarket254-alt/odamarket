import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Shield, ShieldAlert, ShieldCheck, Mail, Building, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface Profile {
  id: string;
  role: string;
  business_name: string;
  verified: boolean;
  email?: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [pendingRequests, setPendingRequests] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Let's get profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // In a real scenario we might need to join auth.users to get email, but supabase client doesn't allow joining auth.users easily unless we have rpc or edge function, or we store email in profiles table. For now we just use profile fields.
      setUsers(profiles || []);

      const requests = JSON.parse(localStorage.getItem("verification_requests") || "[]");
      setPendingRequests(requests);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Periodically check for new requests since we are simulating real-time requests via localstorage
    const interval = setInterval(() => {
      const requests = JSON.parse(localStorage.getItem("verification_requests") || "[]");
      setPendingRequests(requests);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verified: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      if (!currentStatus) {
        // If we are verifying, remove from pending requests
        const requests = JSON.parse(localStorage.getItem("verification_requests") || "[]");
        const newRequests = requests.filter((id: string) => id !== userId);
        localStorage.setItem("verification_requests", JSON.stringify(newRequests));
        setPendingRequests(newRequests);
      }

      const userTarget = users.find(u => u.id === userId);

      // Trigger Edge Function / Notification API
      try {
        await fetch("/api/notify-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userId,
            email: userTarget?.email,
            businessName: userTarget?.business_name,
            verified: !currentStatus 
          })
        });
      } catch (notifyErr) {
        console.warn("Failed to dispatch notification webhook", notifyErr);
      }

      toast.success(
        currentStatus ? "User verification revoked (Notification Sent)" : "User verified successfully (Notification Sent)"
      );
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, verified: !currentStatus } : u
      ));
    } catch (err: any) {
      toast.error(
        err.message?.includes("RLS") || err.message?.includes("row level security") || err.code === "42501" 
          ? "Permission denied. Please run 'fix-admin-verification.sql' in your Supabase SQL editor to allow admins to verify users."
          : (err.message || "Failed to update verification status")
      );
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.business_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    // Sort pending requests to the top
    const aPending = pendingRequests.includes(a.id);
    const bPending = pendingRequests.includes(b.id);
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">
            View all users and manage verifications
          </p>
        </div>
      </div>

      <Card className="border-border bg-muted/50 text-foreground backdrop-blur-sm">
        <CardHeader>
          <CardTitle>All Platform Users</CardTitle>
          <CardDescription>
            Verify seller and buyer identities to build trust in the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 font-medium border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4">User ID / Business</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">No users found.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                              {user.business_name || "Unknown Business"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {user.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline" 
                            className="bg-transparent capitalize"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {user.verified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 focus:bg-emerald-500/20 pointer-events-none">
                              <ShieldCheck className="h-3.5 w-3.5" /> Verified
                            </Badge>
                          ) : pendingRequests.includes(user.id) ? (
                            <Badge variant="outline" className="text-amber-500/80 border-amber-500/30 gap-1.5 pointer-events-none bg-amber-500/10">
                              <ShieldAlert className="h-3.5 w-3.5" /> Pending Request
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500/80 border-yellow-500/30 gap-1.5 pointer-events-none">
                              <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(user.id, user.verified)}
                            className={
                              user.verified
                                ? "border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                : pendingRequests.includes(user.id)
                                  ? "border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400"
                                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {user.verified ? "Revoke" : pendingRequests.includes(user.id) ? "Approve Request" : "Verify Badge"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
