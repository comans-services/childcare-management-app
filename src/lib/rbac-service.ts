
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "staff";

export interface UserRoleInfo {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    console.log(`Fetching role for user: ${userId}`);
    
    // Check if user has a role in user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) {
      console.error("Error fetching user role from user_roles:", roleError);
      
      // Fallback: check auth user email and assign appropriate role
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.error("Error fetching auth user:", authError);
        return null;
      }

      const userEmail = authData.user.email;
      console.log(`No role found for user ${userId}, checking email: ${userEmail}`);
      
      // Check if user should be admin based on email
      const isAdminEmail = userEmail === 'jason.comeau@comansservices.com.au' || 
                          userEmail === 'belinda.comeau@comansservices.com.au';
      
      const assignedRole: UserRole = isAdminEmail ? 'admin' : 'staff';
      
      // Try to create the role assignment
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: assignedRole
        });
      
      if (insertError) {
        console.error("Error creating user role:", insertError);
        // Return the determined role even if we couldn't save it
        return assignedRole;
      }
      
      console.log(`Created ${assignedRole} role for user ${userId}`);
      return assignedRole;
    }

    const role = roleData?.role as UserRole || null;
    console.log(`User role fetched: ${role || 'none'}`);
    
    // Additional check: ensure admin emails always have admin role
    if (role) {
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData.user?.email;
      
      if (userEmail && 
          (userEmail === 'jason.comeau@comansservices.com.au' || 
           userEmail === 'belinda.comeau@comansservices.com.au') &&
          role !== 'admin') {
        
        console.log(`Correcting role for admin email ${userEmail}`);
        
        // Update to admin role
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role: 'admin' })
          .eq("user_id", userId);
        
        if (updateError) {
          console.error("Error updating user role to admin:", updateError);
        } else {
          console.log(`Updated role to admin for ${userEmail}`);
          return 'admin';
        }
      }
    }
    
    return role;
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    return null;
  }
};

export const assignUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    console.log(`Assigning role ${role} to user ${userId}`);
    
    const { error } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error assigning user role:", error);
      return false;
    }

    console.log(`Role ${role} successfully assigned to user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error in assignUserRole:", error);
    return false;
  }
};

export const isAdminUser = (role: UserRole | null): boolean => {
  return role === "admin";
};

export const isStaffUser = (role: UserRole | null): boolean => {
  return role === "staff";
};

export const canAccessProjects = (role: UserRole | null): boolean => {
  return isAdminUser(role);
};

export const canAccessContracts = (role: UserRole | null): boolean => {
  return isAdminUser(role);
};

export const canAccessTeamManagement = (role: UserRole | null): boolean => {
  return isAdminUser(role);
};

export const canAccessCustomers = (role: UserRole | null): boolean => {
  return isAdminUser(role);
};

export const canManageUserRoles = (role: UserRole | null): boolean => {
  return isAdminUser(role);
};
