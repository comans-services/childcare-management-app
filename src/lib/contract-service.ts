import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export interface Contract {
  id: string;
  name: string;
  description?: string;
  customer_id: string;
  customer_name?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending_renewal' | 'expired' | 'renewed';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_id?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  days_until_expiry?: number;
  services?: Service[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractInput {
  id?: string;
  name: string;
  description?: string | null;
  customer_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending_renewal' | 'expired' | 'renewed';
  file?: File | null;
}

export interface ContractTimeEntry {
  id: string;
  user_id: string;
  contract_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchServices = async (): Promise<Service[]> => {
  console.log("Fetching services...");
  
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    throw new Error(`Failed to fetch services: ${error.message}`);
  }

  console.log("Fetched services:", data);
  return data || [];
};

export const fetchContracts = async (filters?: {
  status?: string;
  customerId?: string;
  searchTerm?: string;
  isActive?: boolean;
}): Promise<Contract[]> => {
  console.log("Fetching contracts with filters:", filters);
  
  let query = supabase
    .from("contracts")
    .select(`
      *,
      customers (
        id,
        name,
        email,
        company
      ),
      contract_services (
        services (
          id,
          name,
          description
        )
      )
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.customerId && filters.customerId !== 'all') {
    query = query.eq('customer_id', filters.customerId);
  }
  
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  
  if (filters?.searchTerm) {
    query = query.ilike('name', `%${filters.searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching contracts:", error);
    throw new Error(`Failed to fetch contracts: ${error.message}`);
  }

  console.log("Fetched contracts:", data);
  
  // Transform the data to include customer_name, days_until_expiry, and services
  const transformedData = (data || []).map((contract: any) => {
    const endDate = new Date(contract.end_date);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      ...contract,
      customer_name: contract.customers?.name,
      days_until_expiry: daysDiff,
      services: contract.contract_services?.map((cs: any) => cs.services) || []
    };
  });
  
  return transformedData;
};

export const fetchUserContracts = async (): Promise<Contract[]> => {
  console.log("Fetching user contracts...");
  
  const { data, error } = await supabase
    .from("contract_assignments")
    .select(`
      contracts (
        *,
        customers (
          id,
          name,
          email,
          company
        )
      )
    `)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) {
    console.error("Error fetching user contracts:", error);
    throw new Error(`Failed to fetch user contracts: ${error.message}`);
  }

  console.log("Fetched user contracts:", data);
  
  // Transform the data
  const contracts = (data || []).map((assignment: any) => ({
    ...assignment.contracts,
    customer_name: assignment.contracts?.customers?.name
  }));
  
  return contracts;
};

export const fetchContractById = async (id: string): Promise<Contract | null> => {
  console.log("Fetching contract by ID:", id);
  
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      customers (
        id,
        name,
        email,
        company
      ),
      contract_services (
        services (
          id,
          name,
          description
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching contract:", error);
    if (error.code === 'PGRST116') {
      return null; // Contract not found
    }
    throw new Error(`Failed to fetch contract: ${error.message}`);
  }

  console.log("Fetched contract:", data);
  return {
    ...data,
    customer_name: data.customers?.name,
    services: data.contract_services?.map((cs: any) => cs.services) || []
  };
};

const uploadContractFile = async (file: File, contractId: string): Promise<{
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_id: string;
}> => {
  console.log("Uploading contract file:", { fileName: file.name, fileSize: file.size, contractId });

  const fileExt = file.name.split('.').pop();
  const fileName = `${contractId}_${Date.now()}.${fileExt}`;
  const filePath = `contracts/${fileName}`;

  console.log("File upload path:", filePath);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error("File upload error:", uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  console.log("File uploaded successfully:", uploadData);

  // Get the public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('contracts')
    .getPublicUrl(filePath);

  console.log("Public URL generated:", urlData.publicUrl);

  return {
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    file_id: uploadData.path,
  };
};

const deleteContractFile = async (filePath: string): Promise<void> => {
  console.log("Deleting contract file:", filePath);
  
  if (!filePath) {
    console.log("No file path provided, skipping deletion");
    return;
  }

  const { error } = await supabase.storage
    .from('contracts')
    .remove([filePath]);

  if (error) {
    console.error("Error deleting file:", error);
    // Don't throw error for file deletion failure as it shouldn't block contract updates
    console.warn("Failed to delete old file, continuing with contract update");
  } else {
    console.log("File deleted successfully");
  }
};

export const saveContract = async (contractData: ContractInput, selectedServiceIds?: string[]): Promise<Contract> => {
  console.log("Saving contract with data:", contractData);

  try {
    const contractId = contractData.id || uuidv4();
    console.log("Contract ID:", contractId);

    // Prepare the base contract data
    let contractRecord: any = {
      id: contractId,
      name: contractData.name,
      description: contractData.description,
      customer_id: contractData.customer_id,
      start_date: contractData.start_date,
      end_date: contractData.end_date,
      status: contractData.status,
      updated_at: new Date().toISOString(),
    };

    // Handle file upload if a new file is provided
    if (contractData.file) {
      console.log("Processing file upload...");
      
      try {
        const fileData = await uploadContractFile(contractData.file, contractId);
        console.log("File upload completed:", fileData);
        
        // Add file data to contract record
        contractRecord = {
          ...contractRecord,
          file_url: fileData.file_url,
          file_name: fileData.file_name,
          file_size: fileData.file_size,
          file_type: fileData.file_type,
          file_id: fileData.file_id,
          uploaded_at: new Date().toISOString(),
        };
      } catch (fileError) {
        console.error("File upload failed:", fileError);
        throw new Error(`File upload failed: ${fileError.message}`);
      }
    }

    console.log("Final contract record to save:", contractRecord);

    // Save or update the contract
    let result;
    if (contractData.id) {
      console.log("Updating existing contract...");
      
      // For updates, fetch the existing contract first to handle file deletion
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("file_id")
        .eq("id", contractData.id)
        .single();

      // If there's a new file and an old file exists, delete the old file
      if (contractData.file && existingContract?.file_id) {
        console.log("Deleting old contract file...");
        await deleteContractFile(existingContract.file_id);
      }

      const { data, error } = await supabase
        .from("contracts")
        .update(contractRecord)
        .eq("id", contractData.id)
        .select()
        .single();

      if (error) {
        console.error("Contract update error:", error);
        throw new Error(`Failed to update contract: ${error.message}`);
      }

      result = data;
      console.log("Contract updated successfully:", result);
    } else {
      console.log("Creating new contract...");
      
      contractRecord.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("contracts")
        .insert(contractRecord)
        .select()
        .single();

      if (error) {
        console.error("Contract creation error:", error);
        throw new Error(`Failed to create contract: ${error.message}`);
      }

      result = data;
      console.log("Contract created successfully:", result);
    }

    // Handle service assignments if provided
    if (selectedServiceIds && selectedServiceIds.length > 0) {
      console.log("Updating contract services...");
      
      // First, remove existing service assignments
      await supabase
        .from("contract_services")
        .delete()
        .eq("contract_id", contractId);
      
      // Then add new service assignments
      const serviceAssignments = selectedServiceIds.map(serviceId => ({
        contract_id: contractId,
        service_id: serviceId
      }));
      
      const { error: serviceError } = await supabase
        .from("contract_services")
        .insert(serviceAssignments);
      
      if (serviceError) {
        console.error("Error updating contract services:", serviceError);
        // Don't throw error for service assignments as the contract is already saved
        console.warn("Contract saved but service assignment failed");
      }
    }

    console.log("Contract save operation completed successfully");
    return result;

  } catch (error) {
    console.error("Error in saveContract:", error);
    
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unexpected error occurred while saving the contract");
    }
  }
};

export const deleteContract = async (id: string): Promise<void> => {
  console.log("Deleting contract:", id);

  try {
    // First, get the contract to check if it has a file
    const { data: contract } = await supabase
      .from("contracts")
      .select("file_id")
      .eq("id", id)
      .single();

    // Delete the file if it exists
    if (contract?.file_id) {
      console.log("Deleting contract file before contract deletion...");
      await deleteContractFile(contract.file_id);
    }

    // Delete the contract record
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Contract deletion error:", error);
      throw new Error(`Failed to delete contract: ${error.message}`);
    }

    console.log("Contract deleted successfully");
  } catch (error) {
    console.error("Error in deleteContract:", error);
    throw error;
  }
};
