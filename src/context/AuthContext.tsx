
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import { fetchUserRole, UserRole, assignUserRole } from "@/lib/rbac-service";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  userRole: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  loading: true,
  refreshUserRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUserRole = async () => {
    if (!user?.id) {
      setUserRole(null);
      return;
    }
    
    try {
      const role = await fetchUserRole(user.id);
      setUserRole(role);
      console.log(`User role refreshed: ${role}`);
    } catch (error) {
      console.error("Error refreshing user role:", error);
      setUserRole(null);
    }
  };

  const ensureUserProfile = async (userId: string, userEmail: string, fullName?: string) => {
    try {
      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking profile:", profileError);
        return;
      }

      // Create profile if it doesn't exist
      if (!profileData) {
        console.log("Creating profile for user:", userId);
        
        // Determine if user should be admin based on email
        const isAdminEmail = userEmail === 'jason.comeau@comansservices.com.au' || 
                            userEmail === 'belinda.comeau@comansservices.com.au';
        
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert([{
            id: userId,
            full_name: fullName || "",
            email: userEmail,
            role: isAdminEmail ? "admin" : "employee", // Legacy role field
          }]);

        if (createProfileError) {
          console.error("Error creating profile:", createProfileError);
        } else {
          console.log("Profile created successfully");
        }

        // Ensure user role is set correctly
        const roleToAssign: UserRole = isAdminEmail ? 'admin' : 'staff';
        await assignUserRole(userId, roleToAssign);
      }
    } catch (error) {
      console.error("Error in ensureUserProfile:", error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        ensureUserProfile(
          session.user.id, 
          session.user.email || "", 
          session.user.user_metadata?.full_name
        ).then(() => {
          fetchUserRoleData(session.user.id);
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          ensureUserProfile(
            session.user.id, 
            session.user.email || "", 
            session.user.user_metadata?.full_name
          ).then(() => {
            // Defer role fetching to prevent potential deadlocks
            setTimeout(() => {
              fetchUserRoleData(session.user.id);
            }, 100);
          });
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRoleData = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      const role = await fetchUserRole(userId);
      setUserRole(role);
      console.log("User role set to:", role);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
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
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Account created",
        description: "You have successfully created an account.",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Clear local state
      setUserRole(null);

      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      throw error;
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
        refreshUserRole,
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
