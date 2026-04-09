import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface PrivilegedRouteProps {
  children: ReactNode;
}

/**
 * Route guard for privileged users only (Admin / SuperAdmin).
 * Students and unauthenticated users are redirected away.
 *
 * - Not logged in       → /auth
 * - Logged in, student  → /dashboard/my-results  (their own results page)
 * - Logged in, admin+   → render children
 */
const PrivilegedRoute = ({ children }: PrivilegedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Student tried to access a privileged page — redirect to their own results
    return <Navigate to="/dashboard/my-results" replace />;
  }

  return <>{children}</>;
};

export default PrivilegedRoute;
