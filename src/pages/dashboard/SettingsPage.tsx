import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { ShieldCheck, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

export default function SettingsPage() {
  const { profile, user, setProfile } = useAuthStore();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // Read local storage to see if they recently requested
  useEffect(() => {
    if (user?.id) {
      const requested = localStorage.getItem(`verification_requested_${user.id}`);
      if (requested === "true") {
        setHasRequested(true);
      }
    }
  }, [user?.id]);

  // Realtime subscription for profile updates (specifically the `verified` field)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile_changes_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile.verified !== profile.verified) {
            setProfile({ ...profile, verified: updatedProfile.verified });
            if (updatedProfile.verified) {
              toast.success("Congratulations! Your account has been verified.", {
                icon: <ShieldCheck className="h-5 w-5 text-amber-500" />
              });
              setHasRequested(false);
              localStorage.removeItem(`verification_requested_${profile.id}`);
            } else {
              toast.error("Your verification badge has been revoked.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, setProfile]);

  const handleRequestVerification = async () => {
    if (!user?.id) return;
    setIsRequesting(true);
    
    // Simulate a network request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In a real app we might insert into a verification_requests table
    const requests = JSON.parse(localStorage.getItem("verification_requests") || "[]");
    if (!requests.includes(user.id)) {
      requests.push(user.id);
      localStorage.setItem("verification_requests", JSON.stringify(requests));
    }
    
    localStorage.setItem(`verification_requested_${user.id}`, "true");
    setHasRequested(true);
    setIsRequesting(false);
    toast.success("Verification request submitted successfully. An admin will review your profile shortly.");
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account preferences and verification status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card/50 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle className="text-lg">Account Verification</CardTitle>
            <CardDescription>
              Verified sellers get a premium badge and higher trust from buyers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={cn(
              "flex flex-col items-center justify-center p-6 rounded-xl border",
              profile.verified 
                ? "bg-amber-500/10 border-amber-500/20" 
                : "bg-muted/50 border-border"
            )}>
              {profile.verified ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <ShieldCheck className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium text-amber-500">Premium Verified</h3>
                  <p className="text-sm text-amber-500/80 text-center mt-2 max-w-[250px]">
                    Your profile stands out and buyers know they can trust your business.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 border border-border">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Not Verified</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2 max-w-[250px]">
                    Verify your business to earn the premium badge and attract more buyers.
                  </p>
                </>
              )}
            </div>

            {!profile.verified && (
              <div className="pt-2">
                {hasRequested ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-emerald-500">Verification in progress</p>
                      <p className="text-xs text-emerald-500/80">
                        We have received your verification request. Our admins are reviewing your profile. 
                        Your status will update automatically here when approved.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-500 text-foreground gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    onClick={handleRequestVerification}
                    disabled={isRequesting}
                  >
                    {isRequesting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Request Premium Verification
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <CardDescription>
              Your public business details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-base text-foreground">{profile.business_name || "Not set"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-base text-foreground">{profile.location || "Not set"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Account Role</p>
              <p className="text-base text-foreground capitalize">{profile.role}</p>
            </div>
            <div className="pt-4 mt-2 border-t border-border">
              <p className="text-xs text-muted-foreground text-opacity-70">
                To update your profile information, please contact support or edit via the main profile page (coming soon).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
