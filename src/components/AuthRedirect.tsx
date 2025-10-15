// src/components/AuthRedirect.tsx
import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Assuming this is the path to your useAuth hook

/**
 * AuthRedirect component
 * Handles redirecting an authenticated user away from the login page.
 * It is mounted on the '/auth' route.
 */
export function AuthRedirect({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Only attempt to navigate if authentication state is settled (not loading)
        // AND a user session exists.
        // Also ensure we are currently on the '/auth' route to prevent loops.
        if (!loading && user) {
            // Log for debugging: user found, redirecting to home.
            console.log('AuthRedirect: User found. Navigating to /');
            
            // Navigate the user to the main authenticated page ('/')
            navigate('/', { replace: true });
        }
        
        // Note: If !user, the component stays on the /auth route (the login form).

    }, [user, loading, navigate, location.pathname]);

    // Render children (the Auth page) while handling redirect logic
    return <>{children}</>;
}
