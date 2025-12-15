import { parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { EntityType } from './config';

export const processUsers = (data: any[]): any[] => {
  console.log("Processing users data:", data);

  return data.map((row, index) => {
    try {
      const user = {
        full_name: row.full_name?.toString().trim(),
        email: row.email?.toString().trim(),
        password: row.password?.toString().trim(),
        organization: row.organization?.toString().trim() || '',
        time_zone: row.time_zone?.toString().trim() || 'UTC',
        employee_id: row.employee_id?.toString().trim() || null,
        employee_card_id: row.employee_card_id?.toString().trim() || null,
        role: row.role?.toString().trim() || 'employee',
        employment_type: row.employment_type?.toString().trim() || 'full-time'
      };

      // Validate required fields
      if (!user.full_name) {
        throw new Error('Full name is required');
      }
      if (!user.email) {
        throw new Error('Email is required');
      }
      if (!user.password) {
        throw new Error('Password is required');
      }

      // Validate role
      const validRoles = ['admin', 'employee'];
      if (!validRoles.includes(user.role)) {
        user.role = 'employee'; // Default to employee if invalid
      }

      // Validate employment type
      const validEmploymentTypes = ['full-time', 'part-time'];
      if (!validEmploymentTypes.includes(user.employment_type)) {
        user.employment_type = 'full-time'; // Default to full-time if invalid
      }

      console.log(`Processed user ${index + 1}:`, user);
      return user;
    } catch (error) {
      console.error(`Error processing user row ${index + 1}:`, error);
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  });
};




// Main processRow function that routes to appropriate processor and saves to database
export const processRow = async (
  row: any, 
  entityType: EntityType, 
  existingCustomers: any[] = [],
  rowIndex: number = 0
): Promise<any> => {
  console.log(`Processing ${entityType} row ${rowIndex}:`, row);
  
  try {
    let processedData;
    
    switch (entityType) {
      case 'team-members':
        processedData = processUsers([row])[0];
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Save the processed data to the database
    let savedData;
    
    switch (entityType) {
      case 'team-members':
        console.log('Creating team member in Supabase Auth:', processedData);
        
        // For team members, we need to use a different approach since admin API requires service role
        // Let's create the user with signUp instead and handle email confirmation differently
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: processedData.email,
          password: processedData.password,
          options: {
            data: {
              full_name: processedData.full_name,
            },
            emailRedirectTo: undefined // This will prevent email confirmation requirement
          }
        });
        
        if (authError || !authData.user) {
          console.error('Error creating auth user:', authError);
          throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`);
        }
        
        console.log('Auth user created successfully:', authData.user.id);
        
        try {
          // Step 2: Create profile record
          const profileData = {
            id: authData.user.id,
            full_name: processedData.full_name,
            email: processedData.email,
            role: processedData.role,
            organization: processedData.organization,
            time_zone: processedData.time_zone,
            employment_type: processedData.employment_type,
            employee_id: processedData.employee_id || null,
            employee_card_id: processedData.employee_card_id || null,
            updated_at: new Date().toISOString(),
          };
          
          console.log('Creating profile record:', profileData);
          
          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
            
            // Clean up auth user if profile creation fails
            try {
              await supabase.auth.admin.deleteUser(authData.user.id);
              console.log('Cleaned up auth user after profile creation failure');
            } catch (cleanupError) {
              console.error('Failed to cleanup auth user:', cleanupError);
            }
            
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }
          
          savedData = profileResult;
          console.log('Team member created successfully:', savedData);
          
        } catch (profileCreationError) {
          // If profile creation fails, clean up the auth user
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('Cleaned up auth user after error');
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }
          throw profileCreationError;
        }
        break;
        
      default:
        throw new Error(`Unsupported entity type for database save: ${entityType}`);
    }

    console.log(`Successfully processed and saved ${entityType} row ${rowIndex}:`, savedData);
    return savedData;
    
  } catch (error) {
    console.error(`Error processing ${entityType} row ${rowIndex}:`, error);
    throw error;
  }
};
