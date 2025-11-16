// Stub service - customers table doesn't exist

export interface Customer {
  id: string;
  name: string;
}

export const fetchCustomers = async (): Promise<Customer[]> => {
  console.log("Note: Customers table does not exist. Returning empty array.");
  return [];
};
