
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  organization?: string;
  time_zone?: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users...");
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, organization, time_zone");
    
    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} users`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchUsers:", error);
    throw error;
  }
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log(`Fetching user with ID: ${userId}`);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, organization, time_zone")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchUserById:", error);
    return null;
  }
};
