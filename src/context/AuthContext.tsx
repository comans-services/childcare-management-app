
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextProps } from "./auth/authTypes";
import { validateSession } from "./auth/authUtils";
import { signInOperation, signOutOperation, changePasswordOperation, fetchUserRole } from "./auth/authOperations";

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  userRole: null,
  signIn: async () => {},
  signOut: async () => {},
  changePassword: async () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"employee" | "admin" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Clear all user-related state
  const clearUserState = () => {
    console.log("Clearing user state");
    setSession(null);
    setUser(null);
    setUserRole(null);
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        console.log(`Auth state change event: ${event}`, {
          userId: newSession?.user?.id,
          userEmail: newSession?.user?.email,
          hasSession: !!newSession
        });

        if (event === 'SIGNED_OUT' || !newSession) {
          clearUserState();
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && validateSession(newSession)) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Defer user role fetching to prevent deadlocks
          setTimeout(() => {
            if (mounted && newSession.user) {
              handleUserRoleFetch(newSession.user.id);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;

      console.log("Initial session check", {
        hasSession: !!existingSession,
        userId: existingSession?.user?.id,
        userEmail: existingSession?.user?.email
      });

      if (existingSession && validateSession(existingSession)) {
        setSession(existingSession);
        setUser(existingSession.user);
        handleUserRoleFetch(existingSession.user.id);
      } else {
        clearUserState();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserRoleFetch = async (userId: string) => {
    const userData = await fetchUserRole(userId);
    if (userData) {
      setUserRole(userData.role as "employee" | "admin" || "employee");
      
      // Update user profile with email if missing
      if (!userData.email && user?.email) {
        console.log(`Updating profile email for user: ${userId}`);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ email: user.email })
          .eq("id", userId);
          
        if (updateError) {
          console.error("Error updating profile email:", updateError);
        }
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInOperation(email, password);
  };

  const signOut = async () => {
    await signOutOperation(user?.email);
  };

  const changePassword = async (newPassword: string) => {
    await changePasswordOperation(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        signIn,
        signOut,
        changePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
