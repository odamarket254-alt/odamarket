import { useState, useEffect } from "react";
import { VerifiedBadge } from "../../components/ui/VerifiedBadge";
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
import { ShieldCheck, ShieldAlert, BadgeCheck, Loader2, CheckCircle2, User, Pencil, Save, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "../../components/theme-toggle";
import { useSoundSettings } from "../../hooks/useMessageSound";

function SoundToggle() {
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  return (
    <button
      role="switch"
      aria-checked={soundEnabled}
      onClick={() => setSoundEnabled(!soundEnabled)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        soundEnabled ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          soundEnabled ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

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

  // Sync verification requested status from profile
  useEffect(() => {
    if (profile?.id) {
      if ((profile as any).verification_requested) {
        setHasRequested(true);
      } else {
        setHasRequested(false);
      }
    }
  }, [profile]);

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
                icon: <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              });
              setHasRequested(false);
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
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_requested: true })
        .eq("id", user.id);

      if (error) throw error;
      
      setHasRequested(true);
      toast.success("Verification request submitted successfully. An admin will review your profile shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit verification request");
    } finally {
      setIsRequesting(false);
    }
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

      <div className="space-y-10">
        {/* Profile Information Section */}
        <div className="grid md:grid-cols-4 gap-y-4 gap-x-8">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-lg font-medium text-foreground">Profile Details</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your public business information. This will be visible to other users on the platform.
            </p>
          </div>
          
          <div className="md:col-span-3">
            <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-border bg-background flex flex-shrink-0 items-center justify-center relative shadow-sm">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground/50" />
                    )}
                    {profile.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 p-0.5 rounded-full border-2 border-background">
                        <ShieldCheck className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-foreground tracking-tight">
                        {profile.business_name || "Unnamed Business"}
                      </h4>
                      {profile.verified && <VerifiedBadge textClassName="text-[10px]" />}
                    </div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500 capitalize">{profile.role}</p>
                  </div>
                </div>
                
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="h-9 gap-2 shrink-0 border-border bg-background/50 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-500 hover:border-emerald-500/50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        business_name: profile.business_name || "",
                        location: profile.location || "",
                        logo_url: profile.logo_url || "",
                        bio: profile.bio || "",
                      });
                    }}
                    className="h-9 gap-2 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                )}
              </div>

              <CardContent className="p-0">
                {isEditing ? (
                  <div className="p-6 space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="business_name" className="text-foreground/90 font-medium">Business Name</Label>
                        <Input 
                          id="business_name"
                          value={editForm.business_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                          className="bg-background/50 border-border focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="location" className="text-foreground/90 font-medium">Location</Label>
                        <Input 
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          className="bg-background/50 border-border focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                          placeholder="e.g. Nairobi, Kenya"
                        />
                      </div>
                    </div>

                    {profile.verified ? (
                      <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                        <Label htmlFor="logo_upload" className="text-foreground/90 font-medium flex items-center gap-2">
                          Brand Logo
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] uppercase font-bold tracking-wider border border-amber-500/20">Premium</span>
                        </Label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-border bg-background flex items-center justify-center relative">
                            {editForm.logo_url ? (
                              <img src={editForm.logo_url} className="h-full w-full object-cover" alt="Preview" />
                            ) : (
                              <User className="h-6 w-6 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input 
                              id="logo_upload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
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
                              className="bg-background/50 border-border cursor-pointer file:cursor-pointer file:font-medium file:text-foreground file:bg-muted file:border-0 hover:file:bg-muted/80 h-10 w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Recommended size: 256x256px. Max file size: 2MB.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-500/90">Custom Avatar Locked</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Uploading a custom business logo is an exclusive feature for verified sellers. Secure your verified badge to unlock branding options and increase buyer trust.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {profile.role === "seller" && (
                      <div className="space-y-2.5">
                        <Label htmlFor="bio" className="text-foreground/90 font-medium">Company Profile</Label>
                        <Textarea 
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="bg-background/50 border-border focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 min-h-[120px] resize-y"
                          placeholder="Provide a detailed overview of your company, products, and services..."
                        />
                      </div>
                    )}
                    
                    <div className="pt-2 flex justify-end">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-all h-10 px-8"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                      <div className="p-6 border-b sm:border-b-0 sm:border-r border-border/50 space-y-1.5">
                         <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Name</h5>
                         <p className="text-sm text-foreground font-medium">{profile.business_name || <span className="text-muted-foreground italic font-normal">Not configured</span>}</p>
                      </div>
                      <div className="p-6 space-y-1.5">
                         <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Location</h5>
                         <p className="text-sm text-foreground font-medium">{profile.location || <span className="text-muted-foreground italic font-normal">Not configured</span>}</p>
                      </div>
                    </div>
                    {profile.role === "seller" && (
                      <div className="p-6 space-y-2">
                         <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Description</h5>
                         <p className="text-sm text-foreground/90 leading-relaxed max-w-3xl whitespace-pre-line">
                           {profile.bio || <span className="text-muted-foreground italic">No description provided. Add a bio to tell buyers about your business.</span>}
                         </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Verification Section */}
        {profile.role === "seller" && (
          <div className="grid md:grid-cols-4 gap-y-4 gap-x-8">
            <div className="md:col-span-1 space-y-1">
              <h3 className="text-lg font-medium text-foreground">Verification</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Establish trust with buyers by requesting a verified merchant badge.
              </p>
            </div>
            
            <div className="md:col-span-3">
              <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                    <div className={cn(
                        "h-20 w-20 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-sm",
                        profile.verified 
                          ? "bg-blue-50 border-blue-200/60 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" 
                          : "bg-muted border-border text-muted-foreground"
                      )}>
                        {profile.verified ? <BadgeCheck className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className={cn("text-lg font-semibold", profile.verified ? "text-blue-700 dark:text-blue-400" : "text-foreground")}>
                          {profile.verified ? "Premium Verified Seller" : "Unverified Account"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                          {profile.verified 
                            ? "Your business has been successfully verified. You now have access to premium features including custom branding, and your profile displays a badge to signal trust to buyers."
                            : "Verified sellers receive priority placement, a verified badge, and the ability to upload custom logos. Strengthen your market presence by submitting a verification request."}
                        </p>
                      </div>

                      {!profile.verified && (
                        <div className="pt-3">
                          {hasRequested ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-600 dark:text-emerald-500">
                              <CheckCircle2 className="h-4 w-4" />
                              Verification Request Under Review
                            </div>
                          ) : (
                            <Button 
                              onClick={handleRequestVerification}
                              disabled={isRequesting}
                              className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 font-medium px-6 h-10 shadow-sm"
                            >
                              {isRequesting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 mr-2" />
                              )}
                              Request Verification
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preferences Section */}
        <div className="grid md:grid-cols-4 gap-y-4 gap-x-8">
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-lg font-medium text-foreground">Preferences</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Manage your local application settings and display preferences.
            </p>
          </div>
          
          <div className="md:col-span-3">
            <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 flex items-center justify-between border-b border-border/50">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground tracking-tight">Appearance Interface</p>
                    <p className="text-sm text-muted-foreground">Toggle the application theme between light and dark modes.</p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground tracking-tight">Message Sound Alerts</p>
                    <p className="text-sm text-muted-foreground">Play a notification sound when a new message arrives.</p>
                  </div>
                  <SoundToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
