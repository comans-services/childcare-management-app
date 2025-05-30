import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  full_name?: string;
  role?: string;
  organization?: string;
  time_zone?: string;
  email?: string;
  employment_type?: 'full-time' | 'part-time';
  employee_id?: string;
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
    
    // Get all profiles from the profiles table including new fields
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone, email, employment_type, employee_id");
    
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
        employment_type: "full-time" as const,
        employee_id: null,
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
          
          // Fix the type issue here - properly type the authUsersData to avoid the "never" type error
          if (authUsersData && 'users' in authUsersData && Array.isArray(authUsersData.users)) {
            console.log(`Fetched ${authUsersData.users.length} auth users`);
            
            // Update each profile with missing email
            for (const profile of profilesWithoutEmails) {
              // Ensure users array is properly typed
              const users = authUsersData.users as SupabaseAuthUser[];
              const matchingAuthUser = users.find(user => user.id === profile.id);
              
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
      
      console.log("Final profiles data with employment fields:", profilesData);
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
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone, employment_type, employee_id")
      .eq("id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    if (!data) {
      console.log("No profile found, creating default profile");
      
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        console.error("No authenticated user found");
        return null;
      }
      
      const newProfile = {
        id: userId,
        full_name: authData.user.user_metadata?.full_name || "",
        role: "employee",
        organization: "",
        time_zone: "UTC",
        email: authData.user.email,
        employment_type: "full-time" as const,
        employee_id: null,
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
        email: user.email,
        employment_type: user.employment_type,
        employee_id: user.employee_id,
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
    
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([{
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        email: userData.email,
        employment_type: userData.employment_type || "full-time",
        employee_id: userData.employee_id,
        updated_at: new Date().toISOString(),
      }])
      .select();
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
    
    console.log("User profile created successfully:", profileData);
    
    if (profileData && profileData.length > 0) {
      return profileData[0] as User;
    } else {
      const newUser: User = {
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        email: userData.email,
        employment_type: userData.employment_type || "full-time",
        employee_id: userData.employee_id,
      };
      
      console.log("Returning new user:", newUser);
      return newUser;
    }
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};
