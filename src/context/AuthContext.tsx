
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: "employee" | "admin" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, organization?: string, timeZone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Session cleanup utility
const cleanupAuthState = () => {
  // Clear all auth-related data from localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage as well
  Object.keys(sessionStorage || {}).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log("Auth state cleaned up");
};

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  userRole: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"employee" | "admin" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Session validation helper
  const validateSession = (currentSession: Session | null) => {
    if (!currentSession?.user?.id) {
      console.log("Session validation failed: No valid user ID");
      return false;
    }
    
    console.log(`Session validated for user: ${currentSession.user.id} (${currentSession.user.email})`);
    return true;
  };

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
              fetchUserRole(newSession.user.id);
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
        fetchUserRole(existingSession.user.id);
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

  const fetchUserRole = async (userId: string) => {
    try {
      console.log(`Fetching role for user: ${userId}`);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return;
      }

      if (data) {
        console.log(`User role fetched: ${data.role} for ${data.email}`);
        setUserRole(data.role as "employee" | "admin" || "employee");
        
        // Update user profile with email if missing
        if (!data.email && user?.email) {
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
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log(`Attempting sign in for: ${email}`);
      
      // Clean up any existing auth state first
      cleanupAuthState();
      
      // Attempt global sign out to clear any lingering sessions
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Global signout attempt (ignoring errors):", err);
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      console.log("Sign in successful", {
        userId: data.user?.id,
        userEmail: data.user?.email
      });

      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, organization?: string, timeZone?: string) => {
    try {
      console.log(`Attempting sign up for: ${email}`);
      
      // Clean up any existing auth state first
      cleanupAuthState();

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Create profile after signup - using same pattern as createUser in user-service.ts
      if (data.user) {
        console.log(`Creating profile for new user: ${data.user.id}`);
        
        const profileData = {
          id: data.user.id,
          full_name: fullName,
          role: "employee", // Always set to employee for public signups
          email: email, // Explicitly store email
          organization: organization || null,
          time_zone: timeZone || null,
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: profileError } = await supabase
          .from("profiles")
          .insert([profileData])
          .select();

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't throw here as the auth user was created successfully
          // This allows the user to still sign in even if profile creation fails
          toast({
            title: "Account created with minor issue",
            description: "Your account was created but some profile data may need to be updated later.",
            variant: "default",
          });
        } else {
          console.log("Profile created successfully:", createdProfile);
          toast({
            title: "Account created successfully",
            description: "Welcome! Your account has been created.",
          });
        }
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log(`Signing out user: ${user?.email}`);
      
      // Clear state immediately
      clearUserState();
      
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          console.error("Sign out error:", error);
        }
      } catch (err) {
        console.log("Sign out attempt completed (ignoring errors):", err);
      }

      toast({
        title: "Signed out successfully",
      });
      
      // Force page reload for complete cleanup
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error: any) {
      console.error("Sign out error:", error);
      // Force reload even on error
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        signIn,
        signUp,
        signOut,
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
