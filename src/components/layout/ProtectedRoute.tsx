import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles: Array<"buyer" | "seller" | "admin">;
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuthStore();

  /*
   * Handle the loading state while the Session and Profile are being fetched.
   */
  if (isLoading || (!profile && user)) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-emerald-600 dark:text-emerald-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /*
   * Redirect users who are not signed in.
   */
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Check if the user role is authorized to view this route
   */
  if (!allowedRoles.includes(profile.role)) {
    // Optionally we can push them to an unauthorized page, or just redirect them to their main dashboard
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return <Outlet />;
}
