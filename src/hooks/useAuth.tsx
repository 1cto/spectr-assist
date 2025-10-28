import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { createBitrixLead } from "@/lib/utils";
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST (before getSession)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Synchronous state updates only - no async operations!
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle signed in event
      if (event === "SIGNED_IN" && session) {
        // Defer async operations with setTimeout to prevent deadlock
        setTimeout(() => {
          const lastProvider = session.user.app_metadata.provider;
          if (session.user && lastProvider === "google") {
            if (!session.user.id || session.user.id == "") {
              console.log("auth_lead_create");
              createBitrixLead(session.user);
              localStorage.setItem("isNewRegistration", "true");
            }
          }
        }, 0);

        // Handle OAuth popup closure
        if (window.opener) {
          try {
            window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
            window.close();
            return;
          } catch (e) {
            console.error("Failed to close window after OAuth success:", e);
          }
        }
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
