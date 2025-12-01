
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cleanupAuthState } from "./authUtils";
import { logAuditEvent } from "@/lib/audit/audit-service";

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
      
      // Log failed login attempt
      await logAuditEvent({
        action: "user_login_failed",
        details: {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
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

    // Log successful login
    await logAuditEvent({
      action: "user_login_success",
      details: {
        email: data.user?.email,
        userId: data.user?.id,
        timestamp: new Date().toISOString()
      }
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
    
    // Log logout event before cleaning up
    await logAuditEvent({
      action: "user_logout",
      details: {
        email: userEmail,
        timestamp: new Date().toISOString()
      }
    });
    
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
    
    // Log password change event
    await logAuditEvent({
      action: "password_changed",
      details: {
        timestamp: new Date().toISOString()
      }
    });
    
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
    
    // Query user_roles table for role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error fetching user role:", roleError);
    }

    // Query profiles for other data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("email, employment_type")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile data:", profileError);
    }

    // Determine highest privilege role
    let role = "employee";
    if (roleData && roleData.length > 0) {
      const roles = roleData.map((r: any) => r.role);
      if (roles.includes("admin")) role = "admin";
      else if (roles.includes("manager")) role = "manager";
      else role = "employee";
    }

    const result = {
      role,
      email: profileData?.email || null,
      employment_type: profileData?.employment_type || "full-time"
    };

    console.log(`User role fetched: ${role} for ${result.email}, employment: ${result.employment_type}`);
    return result;
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    return null;
  }
};
