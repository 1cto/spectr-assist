import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import BrowserRouter directly
import useGtmVirtualPageView from "./useGtmVirtualPageView.tsx"; // Import the hook
// UI Components
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context & Auth
import { AuthProvider } from "@/hooks/useAuth";
// Application Components
import AuthRedirect from "@/components/AuthRedirect";

const queryClient = new QueryClient();

// 🔑 CORRECTION 1: Define App as a standard functional component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* 🔑 CORRECTION 2: BrowserRouter MUST wrap all router-related components and hooks */}
        <BrowserRouter>
          {/* 🔑 CORRECTION 3: Call the hook INSIDE the functional component and BEFORE rendering the children */}
          {/* This hook listens to URL changes and pushes the GTM event */}
          <GtmTracker />

          {/* AuthProvider must be inside BrowserRouter if it uses router hooks (like useNavigate) */}
          <AuthProvider>
            <AuthRedirect />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

// 🔑 CORRECTION 4: Create a dedicated wrapper component for the hook
// React hooks MUST be called at the top level of a functional component.
const GtmTracker = () => {
  useGtmVirtualPageView();
  return null; // This component doesn't render any visible elements
};
