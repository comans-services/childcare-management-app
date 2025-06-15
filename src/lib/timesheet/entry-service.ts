
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry } from "../timesheet-service";

export const fetchTimesheetEntries = async (filters?: {
  userId?: string;
  projectId?: string;
  contractId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TimesheetEntry[]> => {
  console.log("Fetching timesheet entries with filters:", filters);

  let query = supabase
    .from("timesheet_entries")
    .select(`
      *,
      project:projects (
        id,
        name,
        description,
        customer:customers (
          id,
          name
        )
      ),
      contract:contracts (
        id,
        name,
        description,
        customer:customers (
          id,
          name
        )
      ),
      user:profiles (
        id,
        full_name,
        email
      )
    `)
    .order("entry_date", { ascending: false });

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters?.contractId) {
    query = query.eq("contract_id", filters.contractId);
  }

  if (filters?.startDate) {
    query = query.gte("entry_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("entry_date", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timesheet entries:", error);
    throw new Error(`Failed to fetch timesheet entries: ${error.message}`);
  }

  console.log("Fetched timesheet entries:", data);
  return data || [];
};

export const fetchReportData = async (
  startDate: Date,
  endDate: Date,
  filters: {
    userId?: string | null;
    projectId?: string | null;
    contractId?: string | null;
    customerId?: string | null;
  }
): Promise<any[]> => {
  console.log("Fetching report data with filters:", { startDate, endDate, filters });

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  let query = supabase
    .from("timesheet_entries")
    .select(`
      *,
      project:projects (
        id,
        name,
        description,
        customer_id,
        customer:customers (
          id,
          name
        )
      ),
      contract:contracts (
        id,
        name,
        description,
        customer_id,
        customer:customers (
          id,
          name
        )
      ),
      user:profiles (
        id,
        full_name,
        email,
        employee_id
      )
    `)
    .gte("entry_date", startDateStr)
    .lte("entry_date", endDateStr);

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.contractId) {
    query = query.eq("contract_id", filters.contractId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching report data:", error);
    throw new Error(`Failed to fetch report data: ${error.message}`);
  }

  console.log("Fetched report data:", data);
  return data || [];
};

export const saveTimesheetEntry = async (entryData: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log("Saving timesheet entry with data:", entryData);

  try {
    const { data, error } = await supabase
      .from("timesheet_entries")
      .insert([entryData])
      .select()
      .single();

    if (error) {
      console.error("Error saving timesheet entry:", error);
      throw new Error(`Failed to save timesheet entry: ${error.message}`);
    }

    console.log("Timesheet entry saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

export const duplicateTimesheetEntry = async (entryId: string): Promise<TimesheetEntry> => {
  console.log("Duplicating timesheet entry with ID:", entryId);

  try {
    // First fetch the entry to duplicate
    const { data: originalEntry, error: fetchError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (fetchError) {
      console.error("Error fetching entry to duplicate:", fetchError);
      throw new Error(`Failed to fetch entry: ${fetchError.message}`);
    }

    // Create new entry without the ID
    const { id, created_at, updated_at, ...entryToDuplicate } = originalEntry;
    
    const { data, error } = await supabase
      .from("timesheet_entries")
      .insert([entryToDuplicate])
      .select()
      .single();

    if (error) {
      console.error("Error duplicating timesheet entry:", error);
      throw new Error(`Failed to duplicate timesheet entry: ${error.message}`);
    }

    console.log("Timesheet entry duplicated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in duplicateTimesheetEntry:", error);
    throw error;
  }
};

export const deleteTimesheetEntry = async (id: string): Promise<void> => {
  console.log(`Deleting timesheet entry with ID: ${id}`);

  try {
    const { error } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting timesheet entry:", error);
      throw new Error(`Failed to delete timesheet entry: ${error.message}`);
    }

    console.log("Timesheet entry deleted successfully");
  } catch (error) {
    console.error("Error in deleteTimesheetEntry:", error);
    throw error;
  }
};

export const deleteAllTimesheetEntries = async (userId: string): Promise<void> => {
  console.log(`Deleting all timesheet entries for user ID: ${userId}`);

  try {
    const { error } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting all timesheet entries:", error);
      throw new Error(`Failed to delete timesheet entries: ${error.message}`);
    }

    console.log("All timesheet entries deleted successfully");
  } catch (error) {
    console.error("Error in deleteAllTimesheetEntries:", error);
    throw error;
  }
};
