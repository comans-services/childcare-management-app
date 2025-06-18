
import { supabase } from "@/integrations/supabase/client";
import { removeContractFile } from "@/lib/contract-service";

export const removeFileFromBallDoggettContract = async (): Promise<boolean> => {
  try {
    console.log("Looking for Ball & Doggett Pty Ltd {CASPAK} contract...");
    
    // Find the contract by name
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, name, file_name')
      .ilike('name', '%Ball & Doggett%CASPAK%');

    if (error) {
      console.error("Error searching for contract:", error);
      throw error;
    }

    if (!contracts || contracts.length === 0) {
      console.log("Contract not found");
      return false;
    }

    const contract = contracts[0];
    console.log("Found contract:", contract.name, "with file:", contract.file_name);

    if (!contract.file_name) {
      console.log("Contract has no file attachment");
      return false;
    }

    // Remove the file
    await removeContractFile(contract.id);
    console.log("File removed successfully from contract:", contract.name);
    return true;

  } catch (error) {
    console.error("Error removing file from contract:", error);
    throw error;
  }
};
