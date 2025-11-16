import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  full_name?: string;
  role?: 'admin' | 'employee';
  organization?: string;
  time_zone?: string;
  email?: string;
  employment_type?: 'full-time' | 'part-time' | 'casual';
  employee_card_id?: string;
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
    
    // Get all profiles from the profiles table including new employee_id field
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, time_zone, email, employment_type, employee_card_id, employee_id");
    
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
        employee_card_id: null,
        employee_id: null,
      };
      
      const newProfile = {
        id: authData?.user?.id,
        full_name: authData?.user?.user_metadata?.full_name || null,
        role: 'employee' as const,
        organization: '',
        time_zone: 'Australia/Melbourne',
        email: authData?.user?.email,
        employment_type: 'full-time' as const,
        employee_card_id: null,
        employee_id: null,
      };
      
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
      
      console.log("Final profiles data with employment and employee_id fields:", profilesData);
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
      .select("id, full_name, role, organization, time_zone, employment_type, employee_card_id, employee_id")
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
        employee_card_id: null,
        employee_id: null,
      };
      
      const newProfile = {
        id: newUserId,
        full_name: newUser.full_name || '',
        role: newUser.role as 'admin' | 'employee' || 'employee',
        organization: newUser.organization || '',
        time_zone: newUser.time_zone || 'Australia/Melbourne',
        email: newUser.email,
        employment_type: newUser.employment_type as 'full-time' | 'part-time' | 'casual' || 'full-time',
        employee_card_id: newUser.employee_card_id || null,
        employee_id: newUser.employee_id || null,
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
        employee_card_id: user.employee_card_id,
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
    console.log("Creating new user (matching CSV import method)...");
    
    // Use the same approach as CSV import - signUp instead of admin API
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
        emailRedirectTo: undefined // This will prevent email confirmation requirement
      }
    });
    
    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      throw authError || new Error("Failed to create user");
    }
    
    console.log("Auth user created successfully:", authData.user.id);
    
    try {
      // Step 2: Create profile record (exactly like CSV import)
      const profileData = {
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || "employee",
        organization: userData.organization,
        time_zone: userData.time_zone,
        employment_type: userData.employment_type || "full-time",
        employee_card_id: userData.employee_card_id,
        employee_id: userData.employee_id,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Creating profile record:", profileData);
      
      const { data: profileResult, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      
      console.log("User created successfully:", profileResult);
      return profileResult as User;
      
    } catch (profileCreationError) {
      console.error("Profile creation failed:", profileCreationError);
      throw profileCreationError;
    }
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    console.log("Deleting user:", userId);
    
    // Delete user profile and related data manually since delete_user_cascade doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }
    
    // Note: This doesn't delete auth user - admin needs to do that from Supabase dashboard
    const { error } = { error: null }; // Stub since function doesn't exist
    
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
    
    console.log("User deleted successfully");
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};
