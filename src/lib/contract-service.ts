// Stub service - contracts table doesn't exist

export interface Contract {
  id: string;
  name: string;
}

export const fetchContracts = async (): Promise<Contract[]> => {
  console.log("Note: Contracts table does not exist. Returning empty array.");
  return [];
};
