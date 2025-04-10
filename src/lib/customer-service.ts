
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  created_at?: string;
}

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    console.log("Fetching customers...");
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} customers`);
    return data || [];
  } catch (error) {
    console.error("Error in fetchCustomers:", error);
    throw error;
  }
};

export const fetchCustomerById = async (customerId: string): Promise<Customer | null> => {
  try {
    console.log(`Fetching customer with id: ${customerId}`);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log(`No customer found with id: ${customerId}`);
        return null;
      }
      console.error(`Error fetching customer with id ${customerId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchCustomerById:", error);
    throw error;
  }
};

export const saveCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
  try {
    console.log("Saving customer:", customer);
    
    if (customer.id) {
      // Update existing customer
      const { data, error } = await supabase
        .from("customers")
        .update({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          updated_at: new Date().toISOString()
        })
        .eq("id", customer.id)
        .select();

      if (error) {
        console.error("Error updating customer:", error);
        throw error;
      }
      
      console.log("Customer updated successfully:", data?.[0]);
      return data?.[0] as Customer;
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company
        })
        .select();

      if (error) {
        console.error("Error creating customer:", error);
        throw error;
      }
      
      console.log("Customer created successfully:", data?.[0]);
      return data?.[0] as Customer;
    }
  } catch (error) {
    console.error("Error in saveCustomer:", error);
    throw error;
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    console.log(`Deleting customer ${customerId}`);
    
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
    
    console.log(`Customer ${customerId} deleted successfully`);
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    throw error;
  }
};
