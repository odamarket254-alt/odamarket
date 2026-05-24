import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { ShieldCheck, ShieldAlert, Loader2, CheckCircle2, User, Pencil, Save, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "../../components/theme-toggle";

export default function SettingsPage() {
  const { profile, user, setProfile } = useAuthStore();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    business_name: "",
    location: "",
    logo_url: "",
    bio: "",
  });

  // Read local storage to see if they recently requested
  useEffect(() => {
    if (user?.id) {
      const requested = localStorage.getItem(`verification_requested_${user.id}`);
      if (requested === "true") {
        setHasRequested(true);
      }
    }
  }, [user?.id]);

  // Sync form with profile
  useEffect(() => {
    if (profile && !isEditing) {
      setEditForm({
        business_name: profile.business_name || "",
        location: profile.location || "",
        logo_url: profile.logo_url || "",
        bio: profile.bio || "",
      });
    }
  }, [profile, isEditing]);

  // Realtime subscription for profile updates
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
          // Only show verification toasts if verification status changed
          if (updatedProfile.verified !== profile.verified) {
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
          
          setProfile({ ...profile, ...updatedProfile });
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

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: editForm.business_name,
          location: editForm.location,
          logo_url: profile.verified ? editForm.logo_url : profile.logo_url,
          bio: editForm.bio,
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
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
        <Card className="border-border bg-card/50 backdrop-blur-sm self-start flex flex-col items-stretch">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>
                Your public business details.
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="icon-sm" 
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 rounded-full bg-black/20 hover:bg-emerald-500/20 hover:text-emerald-500 border-border"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    business_name: profile.business_name || "",
                    location: profile.location || "",
                    logo_url: profile.logo_url || "",
                    bio: profile.bio || "",
                  });
                }}
                className="h-8 w-8 rounded-full hover:bg-black/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6 flex-1 mt-2">
            
            {/* Profile Picture Display */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-black/40 flex items-center justify-center relative">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground/50" />
                )}
                {profile.verified && (
                  <div className="absolute bottom-0 right-0 bg-amber-500 p-0.5 rounded-full border-2 border-background">
                    <ShieldCheck className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-base font-medium text-foreground">{profile.business_name || "Unnammed Business"}</h4>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input 
                    id="business_name"
                    value={editForm.business_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                    className="bg-black/40 border-border"
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-black/40 border-border"
                    placeholder="e.g. Nairobi, Kenya"
                  />
                </div>
                {profile.verified ? (
                  <div className="space-y-2">
                    <Label htmlFor="logo_upload">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      {editForm.logo_url && (
                        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border bg-black/40">
                          <img src={editForm.logo_url} className="h-full w-full object-cover" alt="Preview" />
                        </div>
                      )}
                      <Input 
                        id="logo_upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Ensure file is < 2MB
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error("Image must be smaller than 2MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditForm(prev => ({ ...prev, logo_url: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="bg-black/40 border-border cursor-pointer file:cursor-pointer file:text-foreground file:bg-muted/50 file:border-0 hover:file:bg-muted/80"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Premium feature: You can customize your avatar (max 2MB).</p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-500/90 leading-relaxed">
                      Profile picture customization is a premium feature. Unlock it by verifying your business.
                    </p>
                  </div>
                )}
                {profile.role === "seller" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio / Company Description</Label>
                      <Textarea 
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="bg-black/40 border-border"
                        placeholder="Tell buyers about your company..."
                        rows={4}
                      />
                    </div>

                  </>
                )}
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-foreground gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p className="text-base text-foreground">{profile.business_name || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-base text-foreground">{profile.location || "Not set"}</p>
                </div>
                {profile.role === "seller" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Bio / Description</p>
                      <p className="text-base text-foreground">{profile.bio || "Not set"}</p>
                    </div>

                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {profile.role === "seller" && (
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
        )}

        <Card className="border-border bg-card/50 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Theme Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
