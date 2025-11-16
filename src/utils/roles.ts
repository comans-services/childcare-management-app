
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let cachedAdminIds = new Set<string>();       // memoise per session
let cachedManagerIds = new Set<string>();     // memoise per session

/**
 * True when the user is an admin.
 * Queries the user_roles table with security definer function.
 */
export const isAdmin = async (user: Session["user"] | null | undefined): Promise<boolean> => {
  if (!user) return false;

  // Check cache first
  if (cachedAdminIds.has(user.id)) return true;

  // Query user_roles table
  try {
    const { data, error } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle() as any;
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    if (data?.role === "admin") {
      cachedAdminIds.add(user.id);
      return true;
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
  }

  return false;
};

/**
 * True when the user is a manager.
 * Queries the user_roles table with security definer function.
 */
export const isManager = async (user: Session["user"] | null | undefined): Promise<boolean> => {
  if (!user) return false;

  // Check cache first
  if (cachedManagerIds.has(user.id)) return true;

  // Query user_roles table
  try {
    const { data, error } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .maybeSingle() as any;
    
    if (error) {
      console.error("Error checking manager status:", error);
      return false;
    }
    
    if (data?.role === "manager") {
      cachedManagerIds.add(user.id);
      return true;
    }
  } catch (error) {
    console.error("Error checking manager status:", error);
  }

  return false;
};

/**
 * True when the user is a manager or admin (has manager-level access or above)
 */
export const isManagerOrAbove = async (user: Session["user"] | null | undefined): Promise<boolean> => {
  const adminCheck = await isAdmin(user);
  if (adminCheck) return true;
  
  const managerCheck = await isManager(user);
  return managerCheck;
};

/**
 * Clear the admin and manager cache - useful when user roles change
 */
export const clearAdminCache = (): void => {
  cachedAdminIds.clear();
  cachedManagerIds.clear();
};

/**
 * Get user role from database with fallback
 * Returns highest privilege role if user has multiple roles
 */
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error fetching user role:", error);
      return "employee";
    }
    
    if (!data || data.length === 0) {
      return "employee";
    }
    
    // Return highest privilege role
    const roles = data.map((r: any) => r.role);
    if (roles.includes("admin")) return "admin";
    if (roles.includes("manager")) return "manager";
    return "employee";
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return "employee";
  }
};
