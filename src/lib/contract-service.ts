
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
}

export interface ContractTimeEntry {
  id?: string;
  contract_id: string;
  user_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  contract?: Contract;
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
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchServices:", error);
    throw error;
  }
};

export const fetchContracts = async (): Promise<Contract[]> => {
  try {
    console.log("Fetching contracts...");
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .order("is_active", { ascending: false })
      .order("status", { ascending: true })
      .order("end_date", { ascending: true });

    if (error) {
      console.error("Error fetching contracts:", error);
      throw error;
    }

    // Get all associated services for each contract
    const contractsWithServices = await Promise.all((data || []).map(async (contract) => {
      // Calculate days until expiry
      const today = new Date();
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const { data: serviceData, error: serviceError } = await supabase
        .from("contract_services")
        .select(`
          services (
            id,
            name,
            description
          )
        `)
        .eq("contract_id", contract.id);

      if (serviceError) {
        console.error(`Error fetching services for contract ${contract.id}:`, serviceError);
        return {
          ...contract,
          customer_name: contract.customers?.name,
          days_until_expiry: daysUntilExpiry,
          services: []
        };
      }

      const services = serviceData.map(item => item.services as Service);
      
      return {
        ...contract,
        customer_name: contract.customers?.name,
        days_until_expiry: daysUntilExpiry,
        services
      };
    }));

    console.log(`Fetched ${contractsWithServices.length} contracts with services`);
    return contractsWithServices;
  } catch (error) {
    console.error("Error in fetchContracts:", error);
    throw error;
  }
};

export const saveContract = async (contract: Omit<Contract, 'id'> & { id?: string }, selectedServiceIds: string[]): Promise<Contract> => {
  try {
    console.log("Saving contract:", contract);
    console.log("Selected services:", selectedServiceIds);

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
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          name: contract.name,
          description: contract.description,
          customer_id: contract.customer_id,
          start_date: contract.start_date,
          end_date: contract.end_date,
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

    // First, remove all existing service associations
    if (contractId) {
      const { error: deleteError } = await supabase
        .from("contract_services")
        .delete()
        .eq("contract_id", contractId);

      if (deleteError) {
        console.error("Error removing existing service associations:", deleteError);
        throw deleteError;
      }

      // Then add new service associations
      if (selectedServiceIds.length > 0) {
        const serviceAssociations = selectedServiceIds.map(serviceId => ({
          contract_id: contractId as string,
          service_id: serviceId
        }));

        const { error: insertError } = await supabase
          .from("contract_services")
          .insert(serviceAssociations);

        if (insertError) {
          console.error("Error creating service associations:", insertError);
          throw insertError;
        }
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
      return entriesData;
    }
    
    const { data: contractsData, error: contractsError } = await supabase
      .from("contracts")
      .select("id, name, description, is_active")
      .in("id", contractIds);

    if (contractsError) {
      console.error("Error fetching contracts for entries:", contractsError);
      return entriesData;
    }

    console.log(`Fetched ${contractsData?.length || 0} contracts for time entries`);

    // Create a map of contracts by ID for quick lookup
    const contractsMap = (contractsData || []).reduce((acc, contract) => {
      acc[contract.id] = contract;
      return acc;
    }, {} as Record<string, Contract>);

    // Combine the entries with their respective contracts
    const entriesWithContracts = entriesData.map(entry => ({
      ...entry,
      contract: contractsMap[entry.contract_id]
    }));

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
          notes: entry.notes
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
          notes: entry.notes
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
