import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (!loading && !user) {
      //console.log("Log out authguard");
      const currentQueryString = searchParams.toString();

      // 2. Build the new path: '/auth' + '?' + 'param1=value1&param2=value2'
      // We only add the '?' if there are actually parameters to prevent an empty '?'
      const newPath = currentQueryString ? `/auth?${currentQueryString}` : "/auth";

      // 3. Navigate to the new path, replacing the current entry in the history
      navigate(newPath, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{user ? children : null}</>;
}
