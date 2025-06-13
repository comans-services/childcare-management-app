
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "../contract-service";

export const fetchUserContracts = async (): Promise<Contract[]> => {
  try {
    console.log("=== DEBUGGING CONTRACT FETCH ===");
    console.log("Fetching contracts assigned to current user...");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Authentication error:", userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User not authenticated");
    }

    console.log("Authenticated user details:", {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role
    });

    // First, get the contract IDs the user is assigned to
    console.log("Querying contract_assignments for user:", user.id);
    const { data: assignments, error: assignmentError } = await supabase
      .from('contract_assignments')
      .select('contract_id')
      .eq('user_id', user.id);

    if (assignmentError) {
      console.error("Error fetching contract assignments:", assignmentError);
      throw assignmentError;
    }

    console.log("Raw assignment data:", assignments);
    const contractIds = assignments?.map(a => a.contract_id) || [];
    console.log("Extracted contract IDs:", contractIds);
    
    // If user has no assignments, return empty array
    if (contractIds.length === 0) {
      console.log("User has no contract assignments - this is the issue!");
      return [];
    }

    // Fetch only the contracts the user is assigned to with proper filtering
    console.log("Fetching contracts with IDs:", contractIds);
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .in('id', contractIds)
      .eq("is_active", true)
      .eq("status", "active")  // Add status filter
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching user contracts:", error);
      console.log("Trying without status filter...");
      
      // Fallback: try without status filter to see what we get
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("contracts")
        .select("*")
        .in('id', contractIds)
        .eq("is_active", true)
        .order("name", { ascending: true });
        
      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw error; // throw original error
      }
      
      console.log("Fallback query returned:", fallbackData);
      console.log("Contract statuses:", fallbackData?.map(c => ({ id: c.id, name: c.name, status: c.status })));
      
      // Return fallback data if available
      return fallbackData || [];
    }

    console.log("Final contracts fetched:", data);
    console.log("Contract details:", data?.map(c => ({ id: c.id, name: c.name, status: c.status, is_active: c.is_active })));
    console.log(`Successfully fetched ${data?.length || 0} assigned contracts for user`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchUserContracts:", error);
    throw error;
  }
};
