import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Shield, ShieldAlert, ShieldCheck, Mail, Building, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface Profile {
  id: string;
  role: string;
  business_name: string;
  verified: boolean;
  email?: string;
  created_at: string;
  country?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Listen to real-time profile updates for verification requests
    const channel = supabase
      .channel('public:profiles:verification_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers(currentUsers => 
            currentUsers.map(user => 
              user.id === payload.new.id ? { ...user, ...payload.new } : user
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      // If verifying, we also clear the verification_requested flag
      const { error } = await supabase
        .from("profiles")
        .update({ 
          verified: !currentStatus,
          verification_requested: false 
        })
        .eq("id", userId);

      if (error) throw error;

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
        u.id === userId ? { ...u, verified: !currentStatus, verification_requested: false } : u
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
    const aPending = (a as any).verification_requested && !a.verified;
    const bPending = (b as any).verification_requested && !b.verified;
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
                            <VerifiedBadge country={user.country} className="pointer-events-none" />
                          ) : (user as any).verification_requested ? (
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
                                : (user as any).verification_requested
                                  ? "border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400"
                                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {user.verified ? "Revoke" : (user as any).verification_requested ? "Approve Request" : "Verify Badge"}
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
