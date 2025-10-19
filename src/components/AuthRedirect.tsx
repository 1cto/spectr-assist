import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { AuthGuard } from "@/components/AuthGuard";

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only navigate away from the login page if not loading AND user exists
    if (!loading && user && location.pathname === "/auth") {
      console.log("Log in authredirect");
      navigate("/", { replace: true });
    }
    if (!loading && !user) {
      console.log("Log out from redirect component");
      navigate("/auth", { replace: true });
    }
    // If not loading and no user, and on a protected route, navigate to login
    // This is often handled better by a <ProtectedRoute> component.
  }, [user, loading, navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/"
        element={
          <AuthGuard>
            <Index />
          </AuthGuard>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
