
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
        organization: row.organization?.toString().trim() || '',
        time_zone: row.time_zone?.toString().trim() || 'UTC',
        employee_id: row.employee_id?.toString().trim() || '',
        employee_card_id: row.employee_card_id?.toString().trim() || ''
      };

      // Validate required fields
      if (!user.full_name) {
        throw new Error('Full name is required');
      }
      if (!user.email) {
        throw new Error('Email is required');
      }

      console.log(`Processed user ${index + 1}:`, user);
      return user;
    } catch (error) {
      console.error(`Error processing user row ${index + 1}:`, error);
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  });
};

export const processCustomers = (data: any[]): any[] => {
  console.log("Processing customers data:", data);

  return data.map((row, index) => {
    try {
      const customer = {
        name: row.name?.toString().trim(),
        industry: row.industry?.toString().trim() || '',
        website: row.website?.toString().trim() || '',
        contact_name: row.contact_name?.toString().trim() || '',
        contact_email: row.contact_email?.toString().trim() || '',
        contact_phone: row.contact_phone?.toString().trim() || ''
      };

      // Validate required fields
      if (!customer.name) {
        throw new Error('Customer name is required');
      }

      console.log(`Processed customer ${index + 1}:`, customer);
      return customer;
    } catch (error) {
      console.error(`Error processing customer row ${index + 1}:`, error);
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  });
};

export const processProjects = (data: any[]): any[] => {
  console.log("Processing projects data:", data);

  return data.map((row, index) => {
    try {
      const project = {
        name: row.name?.toString().trim(),
        description: row.description?.toString().trim() || '',
        customer_id: row.customer_id?.toString().trim() || '',
        is_active: row.is_active !== undefined ? 
          (row.is_active.toString().toLowerCase() === 'true' || row.is_active.toString() === '1') : 
          true
      };

      // Validate required fields
      if (!project.name) {
        throw new Error('Project name is required');
      }
      if (!project.customer_id) {
        throw new Error('Customer ID is required');
      }

      console.log(`Processed project ${index + 1}:`, project);
      return project;
    } catch (error) {
      console.error(`Error processing project row ${index + 1}:`, error);
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  });
};

export const processContracts = (data: any[]): any[] => {
  console.log("Processing contracts data:", data);
  
  return data.map((row, index) => {
    try {
      // Helper function to parse DD/MM/YYYY format
      const parseDate = (dateString: string): string => {
        if (!dateString || dateString.trim() === '') {
          throw new Error('Date is required');
        }
        
        const trimmedDate = dateString.trim();
        
        // Check if it's already in ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
          return trimmedDate;
        }
        
        // Parse DD/MM/YYYY format
        const ddmmyyyyMatch = trimmedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          const paddedDay = day.padStart(2, '0');
          const paddedMonth = month.padStart(2, '0');
          
          // Validate the date
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (date.getFullYear() !== parseInt(year) || 
              date.getMonth() !== parseInt(month) - 1 || 
              date.getDate() !== parseInt(day)) {
            throw new Error('Invalid date');
          }
          
          return `${year}-${paddedMonth}-${paddedDay}`;
        }
        
        throw new Error('Date must be in DD/MM/YYYY format');
      };

      const contract = {
        name: row.name?.toString().trim(),
        description: row.description?.toString().trim() || '',
        start_date: parseDate(row.start_date?.toString() || ''),
        end_date: parseDate(row.end_date?.toString() || ''),
        status: (row.status?.toString().trim().toLowerCase() || 'active'),
        is_active: row.is_active !== undefined ? 
          (row.is_active.toString().toLowerCase() === 'true' || row.is_active.toString() === '1') : 
          true
      };

      // Validate required fields
      if (!contract.name) {
        throw new Error('Contract name is required');
      }

      // Validate status
      const validStatuses = ['active', 'expired', 'pending_renewal', 'renewed'];
      if (!validStatuses.includes(contract.status)) {
        contract.status = 'active'; // Default to active if invalid
      }

      // Validate date range
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      console.log(`Processed contract ${index + 1}:`, contract);
      return contract;
      
    } catch (error) {
      console.error(`Error processing contract row ${index + 1}:`, error);
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
      case 'projects':
        processedData = processProjects([row])[0];
        break;
      case 'customers':
        processedData = processCustomers([row])[0];
        break;
      case 'contracts':
        processedData = processContracts([row])[0];
        break;
      case 'team-members':
        processedData = processUsers([row])[0];
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Save the processed data to the database
    let savedData;
    
    switch (entityType) {
      case 'contracts':
        console.log('Saving contract to database:', processedData);
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .insert(processedData)
          .select()
          .single();
        
        if (contractError) {
          console.error('Error saving contract:', contractError);
          throw new Error(`Failed to save contract: ${contractError.message}`);
        }
        
        savedData = contractData;
        console.log('Contract saved successfully:', savedData);
        break;
        
      case 'customers':
        console.log('Saving customer to database:', processedData);
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert(processedData)
          .select()
          .single();
        
        if (customerError) {
          console.error('Error saving customer:', customerError);
          throw new Error(`Failed to save customer: ${customerError.message}`);
        }
        
        savedData = customerData;
        console.log('Customer saved successfully:', savedData);
        break;
        
      case 'projects':
        console.log('Saving project to database:', processedData);
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert(processedData)
          .select()
          .single();
        
        if (projectError) {
          console.error('Error saving project:', projectError);
          throw new Error(`Failed to save project: ${projectError.message}`);
        }
        
        savedData = projectData;
        console.log('Project saved successfully:', savedData);
        break;
        
      case 'team-members':
        // For team members, we would need to handle user creation differently
        // This is more complex as it involves authentication
        throw new Error('Team member import not implemented yet');
        
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
