
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export interface Contract {
  id: string;
  name: string;
  description?: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  status: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_id?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface ContractInput {
  id?: string;
  name: string;
  description?: string | null;
  customer_id: string;
  start_date: string;
  end_date: string;
  status: string;
  file?: File | null;
}

export const fetchContracts = async (): Promise<Contract[]> => {
  console.log("Fetching contracts...");
  
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      customers (
        id,
        name,
        email,
        company
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contracts:", error);
    throw new Error(`Failed to fetch contracts: ${error.message}`);
  }

  console.log("Fetched contracts:", data);
  return data || [];
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
  return data;
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

export const saveContract = async (contractData: ContractInput): Promise<Contract> => {
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
