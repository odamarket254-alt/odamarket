import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function RoleRedirect() {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${profile.role}/dashboard`} replace />;
}
