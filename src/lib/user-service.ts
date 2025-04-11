
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  full_name?: string;
  role?: string;
  organization?: string;
  time_zone?: string;
  email?: string; // Adding email field to the User interface
}

export interface NewUser extends Omit<User, "id"> {
  email: string;
  password: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users...");
    
    // Get all profiles from the profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log(`Fetched ${profilesData?.length || 0} profiles`);
    
    // Get authenticated users to get emails
    const { data: authData } = await supabase.auth.getUser();
    console.log("Current authenticated user:", authData?.user?.email);
    
    // If no profiles are found, create one for the current user
    if ((!profilesData || profilesData.length === 0) && authData.user) {
      console.log("No profiles found, creating one for current user");
      
      // Create a profile for the current user
      const newProfile = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || "Admin User",
        role: "admin",
        organization: "Default Organization",
        time_zone: "UTC",
        email: authData.user.email,
      };
      
      // Insert the new profile
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select();
      
      if (createError) {
        console.error("Error creating profile:", createError);
      } else {
        console.log("Created profile for current user:", createdProfile);
        // Return the newly created profile with email
        return createdProfile.map(profile => ({
          ...profile,
          email: authData.user?.email
        }));
      }
    }
    
    // Enhance profiles with email data if available
    const users: User[] = profilesData?.map(profile => {
      // For the current user, we can add the email
      if (authData.user && profile.id === authData.user.id) {
        return {
          ...profile,
          email: authData.user.email
        };
      }
      return profile;
    }) || [];
    
    console.log("Enhanced users with available email data:", users);
    return users;
  } catch (error) {
    console.error("Error in fetchUsers:", error);
    throw error;
  }
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log(`Fetching user with ID: ${userId}`);
    
    // First check if the profile exists
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone")
      .eq("id", userId)
      .maybeSingle(); // Using maybeSingle instead of single to avoid error when no profile found
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    // If no profile exists, we need to create one
    if (!data) {
      console.log("No profile found, creating default profile");
      
      // Get current user's email to include in profile
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        console.error("No authenticated user found");
        return null;
      }
      
      // Create default profile
      const newProfile = {
        id: userId,
        full_name: authData.user.user_metadata?.full_name || "",
        role: "employee",
        organization: "",
        time_zone: "UTC",
        email: authData.user.email
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating profile:", createError);
        return null;
      }
      
      return createdProfile;
    }
    
    // Try to get the email from auth
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user && authData.user.id === userId) {
      return {
        ...data,
        email: authData.user.email
      };
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
    
    // Return user data with the email from the auth data
    const newUser: User = {
      ...(data?.[0] as User),
      email: userData.email
    };
    
    console.log("User profile updated successfully:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};
