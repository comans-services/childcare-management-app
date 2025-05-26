
import { supabase } from "@/integrations/supabase/client";

export interface AdminCreateUserData {
  email: string;
  password: string;
  full_name?: string;
  role?: "admin" | "staff";
  organization?: string;
  time_zone?: string;
}

export const createUserAsAdmin = async (userData: AdminCreateUserData) => {
  try {
    console.log("Creating user as admin:", userData.email);
    
    // Create the auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name || "",
      },
    });
    
    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      throw authError || new Error("Failed to create user");
    }
    
    console.log("Auth user created successfully:", authData.user.id);
    
    // Create profile record for the new user
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([{
        id: authData.user.id,
        full_name: userData.full_name || "",
        role: userData.role || "staff",
        organization: userData.organization || "Comans Services",
        time_zone: userData.time_zone || "Australia/Sydney",
        email: userData.email,
        updated_at: new Date().toISOString(),
      }])
      .select();
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
    
    console.log("User profile created successfully:", profileData);
    
    return {
      id: authData.user.id,
      email: userData.email,
      full_name: userData.full_name || "",
      role: userData.role || "staff",
      organization: userData.organization || "Comans Services",
      time_zone: userData.time_zone || "Australia/Sydney",
    };
  } catch (error) {
    console.error("Error in createUserAsAdmin:", error);
    throw error;
  }
};
