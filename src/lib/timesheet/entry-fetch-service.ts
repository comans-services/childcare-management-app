
/* ──────────────────────────────────────────────────────────────
 * entry-fetch-service.ts
 * All read-only queries for timesheets and reports
 * ──────────────────────────────────────────────────────────── */

import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { isAdmin } from "@/utils/roles";
import { TimesheetEntry } from "./types";
import { ContractTimeEntry } from "../contract-service";

/*-------------------------------------------------------------
  1 · Daily / weekly fetch   (Timesheet & Dashboard)
-------------------------------------------------------------*/
export const fetchTimesheetEntries = async (
  startDate: Date,
  endDate: Date,
  options: {
    /** join profiles table? (dashboard needs it) */
    includeUserData?: boolean;
    /** always restrict to this user_id (Timesheet view forces self) */
    forceUserId?: string;
  } = {}
): Promise<(TimesheetEntry | ContractTimeEntry)[]> => {
  const { includeUserData = false, forceUserId } = options;

  // Session user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  // Fetch regular timesheet entries
  let q = supabase
    .from("timesheet_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  /* Row filter logic for timesheet entries */
  if (forceUserId) {
    q = q.eq("user_id", forceUserId);
  } else if (!(await isAdmin(user))) {
    q = q.eq("user_id", user.id);
  }

  const { data: timesheetData, error: timesheetError } = await q.order("entry_date", { ascending: true });
  if (timesheetError) throw timesheetError;

  // Fetch contract time entries
  let contractQuery = supabase
    .from("contract_time_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  /* Row filter logic for contract entries */
  if (forceUserId) {
    contractQuery = contractQuery.eq("user_id", forceUserId);
  } else if (!(await isAdmin(user))) {
    contractQuery = contractQuery.eq("user_id", user.id);
  }

  const { data: contractData, error: contractError } = await contractQuery.order("entry_date", { ascending: true });
  if (contractError) throw contractError;

  // Combine both datasets
  const allEntries = [...(timesheetData || []), ...(contractData || [])];

  // If we need user data, fetch it separately to avoid join issues
  let entriesWithUserData = allEntries;
  
  if (includeUserData && allEntries.length > 0) {
    const userIds = [...new Set(allEntries.map(e => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, organization, time_zone")
      .in("id", userIds);

    const profileMap = (profiles ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    entriesWithUserData = allEntries.map(e => ({
      ...e,
      user: profileMap[e.user_id]
    }));
  }

  // Handle project data for timesheet entries
  const timesheetEntries = entriesWithUserData.filter(e => 'project_id' in e);
  const contractEntries = entriesWithUserData.filter(e => 'contract_id' in e);

  // Fetch projects for timesheet entries
  let enrichedTimesheetEntries = timesheetEntries;
  if (timesheetEntries.length > 0) {
    const projectIds = [...new Set(timesheetEntries.map(e => (e as TimesheetEntry).project_id))];
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, is_active")
      .in("id", projectIds);

    const projectMap = (projects ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    enrichedTimesheetEntries = timesheetEntries.map(e => ({ 
      ...e, 
      project: projectMap[(e as TimesheetEntry).project_id] 
    }));
  }

  // Fetch contracts for contract entries
  let enrichedContractEntries = contractEntries;
  if (contractEntries.length > 0) {
    const contractIds = [...new Set(contractEntries.map(e => (e as ContractTimeEntry).contract_id))];
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, name, description, start_date, end_date, status, is_active")
      .in("id", contractIds);

    const contractMap = (contracts ?? []).reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, any>);

    enrichedContractEntries = contractEntries.map(e => ({ 
      ...e, 
      contract: contractMap[(e as ContractTimeEntry).contract_id] 
    }));
  }

  // Combine enriched entries and sort by date
  const finalEntries = [...enrichedTimesheetEntries, ...enrichedContractEntries];
  return finalEntries.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
};

/*-------------------------------------------------------------
  2 · Report fetch   (Reports page)
-------------------------------------------------------------*/
export const fetchReportData = async (
  startDate: Date,
  endDate: Date,
  filters: {
    userId?: string | null;
    projectId?: string | null;
    customerId?: string | null;
    contractId?: string | null;
  } = {}
): Promise<TimesheetEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  console.log("=== FETCH REPORT DATA ===");
  console.log("User:", user.id);
  console.log("Date range:", formatDate(startDate), "to", formatDate(endDate));
  console.log("Filters before normalization:", filters);

  // Helper function to normalize filter values
  const normalizeFilterValue = (value: string | null | undefined): string | null => {
    if (!value || value === "" || value === "all" || value === "empty") {
      return null;
    }
    return value;
  };

  // Normalize all filter values
  const normalizedFilters = {
    userId: normalizeFilterValue(filters.userId),
    projectId: normalizeFilterValue(filters.projectId),
    customerId: normalizeFilterValue(filters.customerId),
    contractId: normalizeFilterValue(filters.contractId)
  };

  console.log("Normalized filters:", normalizedFilters);

  if (await isAdmin(user)) {
    console.log("Admin user - calling RPC function");
    
    // Prepare parameters for the RPC call with normalized values
    const rpcParams = {
      p_start_date: formatDate(startDate),
      p_end_date: formatDate(endDate),
      p_user_id: normalizedFilters.userId,
      p_project_id: normalizedFilters.projectId,
      p_customer_id: normalizedFilters.customerId,
      p_contract_id: normalizedFilters.contractId
    };
    
    console.log("RPC Parameters:", rpcParams);
    
    try {
      const { data, error } = await supabase.rpc("timesheet_entries_report", rpcParams);
      
      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      
      console.log("RPC Success - entries found:", data?.length || 0);
      
      // Transform the flattened RPC response into the expected nested format
      const transformedData = (data ?? []).map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        project_id: entry.project_id,
        entry_date: entry.entry_date,
        hours_logged: entry.hours_logged,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        notes: entry.notes,
        jira_task_id: entry.jira_task_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
        // Transform flattened project data into nested format
        project: {
          id: entry.project_id,
          name: entry.project_name,
          description: entry.project_description,
          customer_id: entry.project_customer_id
        },
        // Transform flattened user data into nested format
        user: {
          id: entry.user_id,
          full_name: entry.user_full_name,
          email: entry.user_email,
          organization: entry.user_organization,
          time_zone: entry.user_time_zone
        }
      }));
      
      console.log("Transformed data sample:", transformedData[0]);
      console.log("Final filter verification - applied filters:", normalizedFilters);
      
      return transformedData;
    } catch (error) {
      console.error("Error calling RPC function:", error);
      throw error;
    }
  }

  console.log("Non-admin user - using direct query");
  /* Non-admin → fall back to self-only fetch with user data */
  return fetchTimesheetEntries(startDate, endDate, {
    includeUserData: true,
    forceUserId: user.id
  }) as Promise<TimesheetEntry[]>;
};
