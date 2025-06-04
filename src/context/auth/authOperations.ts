
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cleanupAuthState } from "./authUtils";

export const signInOperation = async (email: string, password: string) => {
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

export const signOutOperation = async (userEmail?: string) => {
  try {
    console.log(`Signing out user: ${userEmail}`);
    
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

export const changePasswordOperation = async (newPassword: string) => {
  try {
    console.log("Attempting to change password");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error("Password change error:", error);
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    console.log("Password changed successfully");
    toast({
      title: "Password changed successfully",
      description: "Your password has been updated",
    });
  } catch (error: any) {
    throw error;
  }
};

export const fetchUserRole = async (userId: string) => {
  try {
    console.log(`Fetching role for user: ${userId}`);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    if (data) {
      console.log(`User role fetched: ${data.role} for ${data.email}`);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    return null;
  }
};
