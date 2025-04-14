
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  full_name?: string;
  role?: string;
  organization?: string;
  time_zone?: string;
  email?: string;
}

export interface NewUser extends Omit<User, "id"> {
  email: string;
  password: string;
}

// Define the Supabase Auth User interface to ensure correct typing
interface SupabaseAuthUser {
  id: string;
  email?: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
}

interface AuthUsersResponse {
  users: SupabaseAuthUser[];
  total?: number;
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
      .select("id, full_name, role, organization, time_zone, email");
    
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
        return createdProfile as User[];
      }
    }
    
    // If profiles exist but some are missing emails, fetch the emails from auth
    if (profilesData && profilesData.length > 0) {
      // Find profiles with missing emails
      const profilesWithoutEmails = profilesData.filter(profile => !profile.email);
      
      if (profilesWithoutEmails.length > 0) {
        console.log(`Found ${profilesWithoutEmails.length} profiles without emails, attempting to fetch and update`);
        
        try {
          // Fetch all auth users (requires admin privileges)
          const { data: authUsersData } = await supabase.auth.admin.listUsers();
          
          if (authUsersData && 'users' in authUsersData && Array.isArray(authUsersData.users)) {
            console.log(`Fetched ${authUsersData.users.length} auth users`);
            
            // Update each profile with missing email
            for (const profile of profilesWithoutEmails) {
              const matchingAuthUser = authUsersData.users.find(user => user.id === profile.id);
              
              if (matchingAuthUser && matchingAuthUser.email) {
                console.log(`Updating profile ${profile.id} with email ${matchingAuthUser.email}`);
                
                // Update profile in database
                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({ email: matchingAuthUser.email })
                  .eq("id", profile.id);
                
                if (updateError) {
                  console.error(`Error updating email for profile ${profile.id}:`, updateError);
                } else {
                  // Update email in our local data
                  profile.email = matchingAuthUser.email;
                }
              }
            }
          }
        } catch (authError) {
          console.error("Error fetching auth users:", authError);
          
          // Alternative approach for non-admin users: try to match the current user
          if (authData.user) {
            const currentUserProfile = profilesWithoutEmails.find(p => p.id === authData.user?.id);
            if (currentUserProfile && authData.user.email) {
              console.log(`Updating current user profile with email ${authData.user.email}`);
              
              // Update the current user's profile with their email
              await supabase
                .from("profiles")
                .update({ email: authData.user.email })
                .eq("id", authData.user.id);
              
              currentUserProfile.email = authData.user.email;
            }
          }
        }
      }
      
      console.log("Final profiles data with emails:", profilesData);
      return profilesData as User[];
    }
    
    return [];
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
    
    // Ensure the email is included in the update
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: user.full_name,
        role: user.role,
        organization: user.organization,
        time_zone: user.time_zone,
        email: user.email, // Make sure email is updated
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
    
    console.log("Auth user created successfully:", authData.user);
    
    // Create profile record for the new user WITH email field
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([{
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        email: userData.email, // Explicitly store email in profile
        updated_at: new Date().toISOString(),
      }])
      .select();
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
    
    console.log("User profile created successfully:", profileData);
    
    if (profileData && profileData.length > 0) {
      // Return the newly created user from the profile data
      return profileData[0] as User;
    } else {
      // Create the User object manually if no profile data is returned
      const newUser: User = {
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        email: userData.email
      };
      
      console.log("Returning new user:", newUser);
      return newUser;
    }
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};
