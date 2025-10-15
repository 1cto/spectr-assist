import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth"; // Assuming AuthProvider is here
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
// Import the new component
import { AuthRedirect } from "@/components/AuthRedirect"; // Adjust path as needed

// Your existing imports (queryClient, etc.)
// ...
const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Wrap the Auth page with AuthRedirect. 
              The AuthRedirect component will contain the logic to check if a user 
              is logged in and navigate them away from the login page.
            */}
            <Route
              path="/auth"
              element={
                <AuthRedirect>
                  <Auth />
                </AuthRedirect>
              }
            />

            <Route path="/" element={<Index />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
