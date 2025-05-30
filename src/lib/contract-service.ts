import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "./date-utils";

export interface Service {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: string;
  name: string;
  description?: string;
  customer_id?: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'pending_renewal' | 'renewed';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  services?: Service[];
  customer_name?: string;
  days_until_expiry?: number;
  renewal_reminder_sent?: boolean;
  file_id?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  uploaded_at?: string;
}

export interface ContractTimeEntry {
  id?: string;
  contract_id: string;
  user_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  contract?: Contract;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    organization?: string;
    time_zone?: string;
    employee_card_id?: string;
  };
}

export const fetchServices = async (): Promise<Service[]> => {
  try {
    console.log("Fetching services...");
    
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching services:", error);
      return []; // Return empty array instead of throwing error
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchServices:", error);
    return []; // Return empty array to avoid breaking UI
  }
};

/**
 * Determines the contract status based on start and end dates
 */
export const determineContractStatus = (startDate: string, endDate: string): 'active' | 'expired' | 'pending_renewal' => {
  const today = new Date();
  const endDateObj = new Date(endDate);
  const daysUntilExpiry = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Contract has expired
  if (daysUntilExpiry < 0) {
    return 'expired';
  }
  
  // Contract is pending renewal (less than 30 days until expiry)
  if (daysUntilExpiry <= 30) {
    return 'pending_renewal';
  }
  
  // Contract is active
  return 'active';
};

export const fetchContracts = async (filters?: {
  status?: string;
  customerId?: string;
  searchTerm?: string;
  isActive?: boolean;
}): Promise<Contract[]> => {
  try {
    console.log("Fetching contracts with filters:", filters);
    
    // Start building the query
    let query = supabase
      .from("contracts")
      .select("*");
    
    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }
      
      if (filters.customerId && filters.customerId !== 'all') {
        query = query.eq("customer_id", filters.customerId);
      }
      
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim().toLowerCase();
        query = query.ilike("name", `%${searchTerm}%`);
      }
      
      if (filters.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }
    }
    
    // Execute the query with ordering
    const { data, error } = await query
      .order("is_active", { ascending: false })
      .order("end_date", { ascending: true });

    if (error) {
      console.error("Error fetching contracts:", error);
      return [];
    }

    console.log("Contracts fetched:", data);

    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Get customer details separately for each contract if needed
    const enhancedContracts = await Promise.all(data.map(async (contract) => {
      // Calculate days until expiry
      const today = new Date();
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine if we need to update the contract status based on dates
      const calculatedStatus = determineContractStatus(contract.start_date, contract.end_date);
      
      // If the status has changed, update it in the database
      if (calculatedStatus !== contract.status) {
        console.log(`Updating contract ${contract.id} status from ${contract.status} to ${calculatedStatus}`);
        try {
          await supabase
            .from("contracts")
            .update({ 
              status: calculatedStatus,
              updated_at: new Date().toISOString() 
            })
            .eq("id", contract.id);
            
          // Update the local object with the new status
          contract.status = calculatedStatus;
        } catch (err) {
          console.error("Error updating contract status:", err);
        }
      }

      let customerName = null;
      // If there's a customer_id, try to fetch the customer name
      if (contract.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name")
          .eq("id", contract.customer_id)
          .single();
        
        if (customerData) {
          customerName = customerData.name;
        }
      }

      // Try to get services if available
      let services: Service[] = [];
      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from("contract_services")
          .select(`
            service_id
          `)
          .eq("contract_id", contract.id);

        if (!serviceError && serviceData && serviceData.length > 0) {
          // Fetch service details
          const serviceIds = serviceData.map((item: any) => item.service_id);
          
          const { data: servicesData } = await supabase
            .from("services")
            .select("*")
            .in("id", serviceIds);
            
          if (servicesData) {
            services = servicesData;
          }
        }
      } catch (err) {
        console.log("Error fetching services for contract, skipping:", err);
      }
      
      return {
        ...contract,
        customer_name: customerName,
        days_until_expiry: daysUntilExpiry,
        services
      };
    }));

    console.log(`Enhanced contracts (${enhancedContracts.length}):`, enhancedContracts);
    return enhancedContracts as Contract[];
  } catch (error) {
    console.error("Error in fetchContracts:", error);
    return []; // Return empty array to prevent UI from breaking
  }
};

export const saveContract = async (contract: Omit<Contract, 'id'> & { id?: string }, selectedServiceIds: string[]): Promise<Contract> => {
  try {
    console.log("Saving contract:", contract);
    console.log("Selected services:", selectedServiceIds);

    // Calculate the contract status based on dates
    const calculatedStatus = determineContractStatus(contract.start_date, contract.end_date);

    // Use the calculated status unless it's a renewed contract (which should stay as 'renewed')
    const finalStatus = contract.status === 'renewed' ? 'renewed' : calculatedStatus;

    let contractId = contract.id;
    let savedContract: Contract;

    if (contractId) {
      // Update existing contract
      const { data, error } = await supabase
        .from("contracts")
        .update({
          name: contract.name,
          description: contract.description,
          customer_id: contract.customer_id,
          start_date: contract.start_date,
          end_date: contract.end_date,
          status: finalStatus, // Use the calculated or preserved status
          is_active: contract.is_active ?? true,
          updated_at: new Date().toISOString()
        })
        .eq("id", contractId)
        .select();

      if (error) {
        console.error("Error updating contract:", error);
        throw error;
      }

      savedContract = data?.[0] as Contract;
      console.log("Contract updated successfully:", savedContract);
    } else {
      // Create new contract
      console.log("Creating new contract with data:", {
        name: contract.name,
        description: contract.description,
        customer_id: contract.customer_id,
        start_date: contract.start_date,
        end_date: contract.end_date,
        status: finalStatus, // Use the calculated status
        is_active: contract.is_active ?? true
      });
      
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          name: contract.name,
          description: contract.description,
          customer_id: contract.customer_id,
          start_date: contract.start_date,
          end_date: contract.end_date,
          status: finalStatus, // Use the calculated status
          is_active: contract.is_active ?? true
        })
        .select();

      if (error) {
        console.error("Error creating contract:", error);
        throw error;
      }

      savedContract = data?.[0] as Contract;
      contractId = savedContract.id;
      console.log("Contract created successfully:", savedContract);
    }

    // Handle service associations
    if (selectedServiceIds.length > 0 && contractId) {
      try {
        // First, remove all existing service associations
        const { error: deleteError } = await supabase
          .from("contract_services")
          .delete()
          .eq("contract_id", contractId);

        if (deleteError) {
          console.error("Error removing existing service associations:", deleteError);
        } else {
          // Then add new service associations
          const serviceAssociations = selectedServiceIds.map(serviceId => ({
            contract_id: contractId as string,
            service_id: serviceId
          }));

          const { error: insertError } = await supabase
            .from("contract_services")
            .insert(serviceAssociations);

          if (insertError) {
            console.error("Error creating service associations:", insertError);
          }
        }
      } catch (err) {
        console.error("Error handling service associations:", err);
      }
    }

    return savedContract;
  } catch (error) {
    console.error("Error in saveContract:", error);
    throw error;
  }
};

export const deleteContract = async (contractId: string): Promise<void> => {
  try {
    console.log(`Deleting contract ${contractId}`);
    
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    if (error) {
      console.error("Error deleting contract:", error);
      throw error;
    }
    
    console.log(`Contract ${contractId} deleted successfully`);
  } catch (error) {
    console.error("Error in deleteContract:", error);
    throw error;
  }
};

export const updateContractStatus = async (contractId: string, isActive: boolean): Promise<void> => {
  try {
    console.log(`Updating contract ${contractId} status to ${isActive ? 'active' : 'inactive'}`);
    
    const { error } = await supabase
      .from("contracts")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", contractId);

    if (error) {
      console.error("Error updating contract status:", error);
      throw error;
    }
    
    console.log(`Contract ${contractId} status updated successfully`);
  } catch (error) {
    console.error("Error in updateContractStatus:", error);
    throw error;
  }
};

export const fetchContractTimeEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ContractTimeEntry[]> => {
  try {
    console.log(`Fetching contract time entries for user ${userId} from ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    const { data: entriesData, error: entriesError } = await supabase
      .from("contract_time_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("entry_date", formatDate(startDate))
      .lte("entry_date", formatDate(endDate));

    if (entriesError) {
      console.error("Error fetching contract time entries:", entriesError);
      throw entriesError;
    }

    if (!entriesData || entriesData.length === 0) {
      console.log("No contract time entries found for the specified date range");
      return [];
    }

    console.log(`Fetched ${entriesData.length} contract time entries`);
    
    // Fetch the associated contracts
    const contractIds = [...new Set(entriesData.map(entry => entry.contract_id))];
    
    if (contractIds.length === 0) {
      return entriesData as ContractTimeEntry[];
    }
    
    const { data: contractsData, error: contractsError } = await supabase
      .from("contracts")
      .select("id, name, description, start_date, end_date, status, is_active")
      .in("id", contractIds);

    if (contractsError) {
      console.error("Error fetching contracts for entries:", contractsError);
      return entriesData as ContractTimeEntry[];
    }

    console.log(`Fetched ${contractsData?.length || 0} contracts for time entries`);

    // Create a map of contracts by ID for quick lookup
    const contractsMap = (contractsData || []).reduce((acc, contract) => {
      acc[contract.id] = contract as Contract;
      return acc;
    }, {} as Record<string, Contract>);

    // Combine the entries with their respective contracts
    const entriesWithContracts = entriesData.map(entry => ({
      ...entry,
      contract: contractsMap[entry.contract_id]
    })) as ContractTimeEntry[];

    return entriesWithContracts;
  } catch (error) {
    console.error("Error in fetchContractTimeEntries:", error);
    throw error;
  }
};

export const saveContractTimeEntry = async (entry: ContractTimeEntry): Promise<ContractTimeEntry> => {
  try {
    console.log("Saving contract time entry:", entry);
    
    if (entry.id) {
      // Update existing entry
      const { data, error } = await supabase
        .from("contract_time_entries")
        .update({
          contract_id: entry.contract_id,
          entry_date: entry.entry_date,
          hours_logged: entry.hours_logged,
          notes: entry.notes,
          jira_task_id: entry.jira_task_id,
          start_time: entry.start_time,
          end_time: entry.end_time
        })
        .eq("id", entry.id)
        .select();

      if (error) {
        console.error("Error updating contract time entry:", error);
        throw error;
      }
      
      console.log("Contract time entry updated successfully:", data?.[0]);
      return data?.[0] as ContractTimeEntry;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("contract_time_entries")
        .insert({
          contract_id: entry.contract_id,
          user_id: entry.user_id,
          entry_date: entry.entry_date,
          hours_logged: entry.hours_logged,
          notes: entry.notes,
          jira_task_id: entry.jira_task_id,
          start_time: entry.start_time,
          end_time: entry.end_time
        })
        .select();

      if (error) {
        console.error("Error creating contract time entry:", error);
        throw error;
      }
      
      console.log("Contract time entry created successfully:", data?.[0]);
      return data?.[0] as ContractTimeEntry;
    }
  } catch (error) {
    console.error("Error in saveContractTimeEntry:", error);
    throw error;
  }
};

export const deleteContractTimeEntry = async (entryId: string): Promise<void> => {
  try {
    console.log(`Deleting contract time entry ${entryId}`);
    
    const { error } = await supabase
      .from("contract_time_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting contract time entry:", error);
      throw error;
    }
    
    console.log(`Contract time entry ${entryId} deleted successfully`);
  } catch (error) {
    console.error("Error in deleteContractTimeEntry:", error);
    throw error;
  }
};
