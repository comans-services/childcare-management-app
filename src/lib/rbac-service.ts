
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
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    console.log(`User role fetched: ${data?.role || 'none'}`);
    return data?.role as UserRole || null;
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
