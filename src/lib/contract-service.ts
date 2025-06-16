
import { supabase } from "@/integrations/supabase/client";

export interface Contract {
  id: string;
  name: string;
  description?: string;
  customer_id?: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active?: boolean;
  file_id?: string;
  file_name?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  uploaded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTimeEntry {
  id: string;
  user_id: string;
  contract_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  contract?: Contract;
}

export const fetchContracts = async (filters?: {
  status?: string;
  customerId?: string;
  searchTerm?: string;
  isActive?: boolean;
}): Promise<Contract[]> => {
  try {
    console.log("Fetching contracts with filters:", filters);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    let query = supabase
      .from("contracts")
      .select("*");

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }

    if (filters?.customerId && filters.customerId !== 'all') {
      query = query.eq("customer_id", filters.customerId);
    }

    if (filters?.searchTerm) {
      query = query.ilike("name", `%${filters.searchTerm}%`);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    const { data, error } = await query
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching contracts:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} contracts`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchContracts:", error);
    throw error;
  }
};

export const saveContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<Contract> => {
  try {
    console.log("Saving contract:", contractData);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert([{
        ...contractData,
        is_active: contractData.is_active ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving contract:", error);
      throw new Error(`Failed to save contract: ${error.message}`);
    }

    console.log("Contract saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in saveContract:", error);
    throw error;
  }
};

export const updateContract = async (contractId: string, updates: Partial<Contract>): Promise<Contract> => {
  try {
    console.log("Updating contract:", contractId, updates);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("contracts")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", contractId)
      .select()
      .single();

    if (error) {
      console.error("Error updating contract:", error);
      throw new Error(`Failed to update contract: ${error.message}`);
    }

    console.log("Contract updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in updateContract:", error);
    throw error;
  }
};

export const deleteContract = async (contractId: string): Promise<void> => {
  try {
    console.log("Deleting contract:", contractId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    if (error) {
      console.error("Error deleting contract:", error);
      throw new Error(`Failed to delete contract: ${error.message}`);
    }

    console.log("Contract deleted successfully");
  } catch (error) {
    console.error("Error in deleteContract:", error);
    throw error;
  }
};

export const uploadContractFile = async (file: File, contractId?: string): Promise<{ path: string; url: string }> => {
  try {
    console.log("Uploading contract file:", file.name);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = contractId ? `${contractId}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(data.path);

    console.log("File uploaded successfully:", data.path);
    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error("Error in uploadContractFile:", error);
    throw error;
  }
};

export const deleteContractFile = async (filePath: string): Promise<void> => {
  try {
    console.log("Deleting contract file:", filePath);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase.storage
      .from('contracts')
      .remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    console.log("File deleted successfully");
  } catch (error) {
    console.error("Error in deleteContractFile:", error);
    throw error;
  }
};
