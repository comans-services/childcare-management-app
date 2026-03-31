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
  default_start_time?: string;
  default_end_time?: string;
  is_active?: boolean;
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

// Helper to fetch roles from user_roles table and map to user IDs
const fetchUserRoles = async (userIds: string[]): Promise<Record<string, string>> => {
  if (userIds.length === 0) return {};
  
  const { data: rolesData, error } = await supabase
    .from('user_roles' as any)
    .select('user_id, role')
    .in('user_id', userIds);

  if (error) {
    console.error("Error fetching user roles:", error);
    return {};
  }

  const roleMap: Record<string, string> = {};
  if (rolesData) {
    for (const r of rolesData as any[]) {
      // If user has multiple roles, prefer admin > employee
      if (!roleMap[r.user_id] || r.role === 'admin') {
        roleMap[r.user_id] = r.role;
      }
    }
  }
  return roleMap;
};

const fetchSingleUserRole = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('user_roles' as any)
    .select('role')
    .eq('user_id', userId);

  if (error || !data || (data as any[]).length === 0) {
    return 'employee';
  }

  const roles = (data as any[]).map(r => r.role);
  if (roles.includes('admin')) return 'admin';
  return 'employee';
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users...");
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Error fetching current user:", authError);
      throw authError;
    }
    
    // Get all profiles (without role column) — include inactive so admin can reactivate
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, organization, time_zone, email, employment_type, employee_card_id, employee_id, is_active");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log(`Fetched ${profilesData?.length || 0} profiles`);
    
    // If no profiles found, create one for the current user
    if ((!profilesData || profilesData.length === 0) && authData.user) {
      console.log("No profiles found, creating one for current user");
      
      const newProfileData = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || "",
        organization: "",
        time_zone: "Australia/Melbourne",
        email: authData.user.email || "",
        employment_type: 'full-time' as const,
        employee_card_id: null,
        employee_id: null,
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfileData])
        .select();
      
      if (createError) {
        console.error("Error creating profile:", createError);
      } else if (createdProfile && createdProfile.length > 0) {
        // Also create default role
        await supabase.from('user_roles' as any).insert({ user_id: authData.user.id, role: 'employee' } as any);
        return createdProfile.map(p => ({ ...p, role: 'employee' as const })) as User[];
      }
    }
    
    if (profilesData && profilesData.length > 0) {
      // Fetch roles for all users
      const userIds = profilesData.map(p => p.id);
      const roleMap = await fetchUserRoles(userIds);
      
      // Handle profiles without emails
      const profilesWithoutEmails = profilesData.filter(profile => !profile.email);
      if (profilesWithoutEmails.length > 0) {
        try {
          const { data: authUsersData } = await supabase.auth.admin.listUsers();
          if (authUsersData && 'users' in authUsersData && Array.isArray(authUsersData.users)) {
            for (const profile of profilesWithoutEmails) {
              const users = authUsersData.users as SupabaseAuthUser[];
              const matchingAuthUser = users.find(user => user.id === profile.id);
              if (matchingAuthUser && matchingAuthUser.email) {
                await supabase.from("profiles").update({ email: matchingAuthUser.email }).eq("id", profile.id);
                profile.email = matchingAuthUser.email;
              }
            }
          }
        } catch (authError) {
          if (authData.user) {
            const currentUserProfile = profilesWithoutEmails.find(p => p.id === authData.user?.id);
            if (currentUserProfile && authData.user.email) {
              await supabase.from("profiles").update({ email: authData.user.email }).eq("id", authData.user.id);
              currentUserProfile.email = authData.user.email;
            }
          }
        }
      }
      
      // Merge roles into profiles
      const usersWithRoles = profilesData.map(p => ({
        ...p,
        role: (roleMap[p.id] || 'employee') as 'admin' | 'employee',
      }));
      
      console.log("Final profiles data with roles from user_roles table:", usersWithRoles);
      return usersWithRoles as User[];
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
      .select("id, full_name, organization, time_zone, employment_type, employee_card_id, employee_id, default_start_time, default_end_time")
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
      
      const newProfileData = {
        id: userId,
        full_name: authData.user.user_metadata?.full_name || "",
        organization: "",
        time_zone: "UTC",
        email: authData.user.email || "",
        employment_type: "full-time" as const,
        employee_card_id: null,
        employee_id: null,
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfileData])
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating profile:", createError);
        return null;
      }
      
      // Create default role
      await supabase.from('user_roles' as any).insert({ user_id: userId, role: 'employee' } as any);
      
      return { ...createdProfile, role: 'employee' as const };
    }
    
    // Fetch role from user_roles
    const role = await fetchSingleUserRole(userId);
    
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user && authData.user.id === userId) {
      return {
        ...data,
        role: role as 'admin' | 'employee',
        email: authData.user.email
      };
    }
    
    return { ...data, role: role as 'admin' | 'employee' };
  } catch (error) {
    console.error("Error in fetchUserById:", error);
    return null;
  }
};

export const updateUser = async (user: User): Promise<User> => {
  try {
    console.log("Updating user:", user);
    
    // Update profile (without role)
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: user.full_name,
        organization: user.organization,
        time_zone: user.time_zone,
        email: user.email,
        employment_type: user.employment_type,
        employee_card_id: user.employee_card_id?.trim() || null,
        employee_id: user.employee_id?.trim() || null,
        default_start_time: user.default_start_time || null,
        default_end_time: user.default_end_time || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();
    
    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    
    // Update role in user_roles table if provided
    if (user.role) {
      // Delete existing roles and insert new one
      await supabase.from('user_roles' as any).delete().eq('user_id', user.id);
      const { error: roleError } = await supabase
        .from('user_roles' as any)
        .insert({ user_id: user.id, role: user.role } as any);
      
      if (roleError) {
        console.error("Error updating user role:", roleError);
      }
    }
    
    console.log("User updated successfully:", data?.[0]);
    return { ...data?.[0], role: user.role } as User;
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
        emailRedirectTo: `${window.location.origin}/auth`
      }
    });
    
    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      throw authError || new Error("Failed to create user");
    }
    
    console.log("Auth user created successfully:", authData.user.id);
    
    try {
      // Create profile (without role)
      const profileData = {
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        organization: userData.organization,
        time_zone: userData.time_zone,
        employment_type: userData.employment_type || "full-time",
        employee_card_id: userData.employee_card_id?.trim() || null,
        employee_id: userData.employee_id?.trim() || null,
        updated_at: new Date().toISOString(),
      };
      
      const { data: profileResult, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      
      // Insert role into user_roles table
      const userRoleValue = userData.role || "employee";
      const { error: roleError } = await supabase
        .from("user_roles" as any)
        .insert({
          user_id: authData.user.id,
          role: userRoleValue,
        } as any);
      
      if (roleError) {
        console.error("Error inserting user role:", roleError);
      }
      
      console.log("User created successfully:", profileResult);

      // Send welcome email (fire-and-forget — don't block user creation on email failure)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          userId: authData.user.id,
          email: userData.email,
          fullName: userData.full_name || userData.email,
          temporaryPassword: userData.password,
        },
      }).then(({ error: emailError }) => {
        if (emailError) console.warn("Welcome email failed to send:", emailError);
        else console.log("Welcome email sent successfully");
      });

      return { ...profileResult, role: userRoleValue } as User;

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

    // Delete user roles first
    await supabase.from('user_roles' as any).delete().eq('user_id', userId);

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }

    console.log("User deleted successfully");
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};

export const deactivateUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() } as any)
    .eq('id', userId);
  if (error) throw error;
};

export const reactivateUser = async (userId: string, userEmail: string): Promise<void> => {
  // Re-enable the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() } as any)
    .eq('id', userId);
  if (profileError) throw profileError;

  // Fire-and-forget: send reactivation email without blocking
  supabase.functions.invoke('send-reactivation-email', {
    body: { userId, email: userEmail },
  }).then(({ error: emailError }) => {
    if (emailError) console.warn("Reactivation email failed to send:", emailError);
  });
};
