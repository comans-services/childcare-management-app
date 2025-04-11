
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
    
    // First, get the authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Error fetching current user:", authError);
      throw authError;
    }
    
    console.log("Current authenticated user:", authData?.user?.email);
    
    // Get all profiles from the profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log(`Fetched ${profilesData?.length || 0} profiles`);
    
    // If no profiles are found, create one for the current user
    if ((!profilesData || profilesData.length === 0) && authData.user) {
      console.log("No profiles found, creating one for current user");
      
      // Create a profile for the current user
      const newProfile = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || "Admin User",
        role: "admin",
        organization: "Comans Services",
        time_zone: "Australia/Sydney",
        email: authData.user.email,
      };
      
      // Insert the new profile
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select();
      
      if (createError) {
        console.error("Error creating profile:", createError);
      } else if (createdProfile && createdProfile.length > 0) {
        console.log("Created profile for current user:", createdProfile);
        // Return the newly created profile with email
        return createdProfile.map(profile => ({
          ...profile,
          email: authData.user?.email || null
        }));
      }
    }
    
    // Get all auth users to match emails with profiles
    const { data: allAuthUsers, error: allAuthError } = await supabase.auth.admin.listUsers();
    
    if (allAuthError) {
      console.error("Error fetching all auth users:", allAuthError);
      // Continue with the data we have, just won't have emails for all users
    }
    
    // Map of user IDs to emails
    const userEmailMap = new Map();
    
    if (allAuthUsers?.users) {
      allAuthUsers.users.forEach(user => {
        userEmailMap.set(user.id, user.email);
      });
    }
    
    // Ensure the current user is included
    if (authData.user) {
      userEmailMap.set(authData.user.id, authData.user.email);
    }
    
    // Enhance profiles with email data
    const users: User[] = profilesData?.map(profile => {
      return {
        ...profile,
        email: userEmailMap.get(profile.id) || null
      };
    }) || [];
    
    // Check if the current user's profile exists in the list
    const currentUserExists = users.some(u => u.id === authData.user?.id);
    
    // If the current user doesn't exist in the profiles but is authenticated, add them
    if (!currentUserExists && authData.user) {
      console.log("Current user's profile not found, creating it:", authData.user.email);
      
      const newUserProfile = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || "Admin User",
        role: "admin",
        organization: "Comans Services",
        time_zone: "Australia/Sydney",
        email: authData.user.email,
      };
      
      try {
        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([{
            id: newUserProfile.id,
            full_name: newUserProfile.full_name,
            role: newUserProfile.role,
            organization: newUserProfile.organization,
            time_zone: newUserProfile.time_zone
          }])
          .select();
        
        if (insertError) {
          console.error("Error inserting current user profile:", insertError);
        } else if (insertedProfile) {
          // Fix: Add proper type checking and type assertion
          const profileArray = insertedProfile as Array<{
            id: string;
            full_name?: string;
            role?: string;
            organization?: string;
            time_zone?: string;
          }>;
          
          if (profileArray.length > 0) {
            const profileData = profileArray[0];
            const newUser: User = {
              id: profileData.id,
              full_name: profileData.full_name,
              role: profileData.role,
              organization: profileData.organization,
              time_zone: profileData.time_zone,
              email: authData.user.email
            };
            users.push(newUser);
            console.log("Created profile for current user:", newUser);
          }
        }
      } catch (err) {
        console.error("Error creating user profile:", err);
      }
    }
    
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
    
    // Create the User object directly from available data, rather than depending on the data array
    const newUser: User = {
      id: authData.user.id,
      full_name: userData.full_name,
      role: userData.role || "employee",
      organization: userData.organization,
      time_zone: userData.time_zone,
      email: userData.email
    };
    
    console.log("User profile created successfully:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};
