import { supabase } from "@/integrations/supabase/client";

// Stub file - projects and contracts tables don't exist
export const fetchUserProjectsById = async (userId: string): Promise<any[]> => {
  console.log("Note: Projects table does not exist. Returning empty array.");
  return [];
};

export const fetchUserContractsById = async (userId: string): Promise<any[]> => {
  console.log("Note: Contracts table does not exist. Returning empty array.");
  return [];
};
