
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "../contract-service";

export const fetchUserContracts = async (): Promise<Contract[]> => {
  try {
    console.log("Fetching contracts assigned to current user...");
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // First, get the contract IDs the user is assigned to
    const { data: assignments } = await supabase
      .from('contract_assignments')
      .select('contract_id')
      .eq('user_id', user.id);

    const contractIds = assignments?.map(a => a.contract_id) || [];
    
    // If user has no assignments, return empty array
    if (contractIds.length === 0) {
      console.log("User has no contract assignments");
      return [];
    }

    // Fetch only the contracts the user is assigned to and that are active
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .in('id', contractIds)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching user contracts:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} assigned contracts for user`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchUserContracts:", error);
    throw error;
  }
};
