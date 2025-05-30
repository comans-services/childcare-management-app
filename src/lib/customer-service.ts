
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

export const checkCustomerNameExists = async (name: string, excludeId?: string): Promise<boolean> => {
  try {
    console.log(`Checking if customer name exists: ${name}`);
    
    let query = supabase
      .from("customers")
      .select("id")
      .ilike("name", name.trim());
    
    // When editing, exclude the current customer from the check
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking customer name:", error);
      throw error;
    }

    const exists = data && data.length > 0;
    console.log(`Customer name exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error("Error in checkCustomerNameExists:", error);
    throw error;
  }
};

export const saveCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
  try {
    console.log("Saving customer:", customer);
    
    // Check for duplicate names before saving (except when editing the same customer)
    if (customer.name) {
      const nameExists = await checkCustomerNameExists(customer.name, customer.id);
      if (nameExists) {
        throw new Error(`A customer with the name "${customer.name}" already exists. Please choose a different name.`);
      }
    }
    
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
        // Handle database constraint violation
        if (error.code === '23505' && error.message.includes('idx_customers_name_unique')) {
          throw new Error(`A customer with the name "${customer.name}" already exists. Please choose a different name.`);
        }
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
        // Handle database constraint violation
        if (error.code === '23505' && error.message.includes('idx_customers_name_unique')) {
          throw new Error(`A customer with the name "${customer.name}" already exists. Please choose a different name.`);
        }
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
