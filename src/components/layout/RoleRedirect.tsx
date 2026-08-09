import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function RoleRedirect() {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#C65A28] dark:text-[#C65A28]" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Map roles to their respective dashboards
  let dashboardPath = `/${profile.role}/dashboard`;
  if (profile.role === 'customer') {
    dashboardPath = '/buyer/dashboard';
  }

  return <Navigate to={dashboardPath} replace />;

}
