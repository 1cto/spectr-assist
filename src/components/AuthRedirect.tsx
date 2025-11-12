import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import Fillout from "@/pages/Fillout";
import NotFound from "@/pages/NotFound";
import { AuthGuard } from "@/components/AuthGuard";

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const isNewRegistration = localStorage.getItem("isNewRegistration");

    // Redirect new registrations to fillout page
    if (!loading && user && isNewRegistration === "true" && location.pathname !== "/fillout") {
      localStorage.removeItem("isNewRegistration");
      navigate(`/fillout?email=${user.email}`, { replace: true });
      return;
    }

    // Only navigate away from the login page if not loading AND user exists
    if (!loading && user && location.pathname === "/auth") {
      navigate("/", { replace: true });
    }
    if (!loading && !user) {
      const currentQueryString = searchParams.toString();

      // 2. Build the new path: '/auth' + '?' + 'param1=value1&param2=value2'
      // We only add the '?' if there are actually parameters to prevent an empty '?'
      const newPath = currentQueryString ? `/auth?${currentQueryString}` : "/auth";

      // 3. Navigate to the new path, replacing the current entry in the history
      navigate(newPath, { replace: true });
      //   navigate("/auth", { replace: true });
    }
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

      <Route
        path="/fillout"
        element={
          <AuthGuard>
            <Fillout />
          </AuthGuard>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
