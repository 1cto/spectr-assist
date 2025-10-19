import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// UI Components
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// 🔑 CORRECTION 1: Import the AuthProvider component from its defining file (e.g., context file)
// Assuming AuthProvider is defined in '@/context/AuthContext' for proper separation from the hook.
import { AuthProvider } from "@/hooks/useAuth";

// Application Components

import { AuthRedirect } from "@/components/AuthRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* 🔑 CORRECTION 2: BrowserRouter MUST wrap all components that use React Router hooks (like useNavigate/useLocation) */}
      <BrowserRouter>
        {/* 🔑 CORRECTION 3: AuthProvider must be INSIDE BrowserRouter 
                    if it uses React Router hooks for redirects (which it often does for smooth transitions). */}
        <AuthProvider>
          <AuthRedirect />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
