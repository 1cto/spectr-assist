import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // This is the correct logic for closing the OAuth popup/redirect tab
        if (window.opener) {
          // If this tab was opened by another, communicate success and close itself.
          // window.opener can then handle navigation/updates in the original tab.
          try {
            // Send a message to the original window (optional, but good practice)
            window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
            window.close(); // This call should now reliably close the window
            return; // Stop execution
          } catch (e) {
            console.error("Failed to close window after OAuth success:", e);
          }
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
        window.location.href = "/auth";
      }
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
