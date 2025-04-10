
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  full_name?: string;
  role?: string;
  organization?: string;
  time_zone?: string;
}

export interface NewUser extends Omit<User, "id"> {
  email: string;
  password: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users...");
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone");
    
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
      .select("id, full_name, role, organization, time_zone")
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

export const updateUser = async (user: User): Promise<User> => {
  try {
    console.log("Updating user:", user);
    
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: user.full_name,
        role: user.role,
        organization: user.organization,
        time_zone: user.time_zone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();
    
    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    
    console.log("User updated successfully:", data?.[0]);
    return data?.[0] as User;
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
};

export const createUser = async (userData: NewUser): Promise<User> => {
  try {
    console.log("Creating new user...");
    
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      }
    });
    
    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      throw authError || new Error("Failed to create user");
    }
    
    console.log("Auth user created successfully");
    
    // The profile should be created automatically by the trigger, but we'll update it with additional info
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: userData.full_name,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)
      .select();
    
    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
    
    console.log("User profile updated successfully:", data?.[0]);
    return data?.[0] as User;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};
