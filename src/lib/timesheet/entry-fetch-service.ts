/* ──────────────────────────────────────────────────────────────
 * entry-fetch-service.ts
 * All read-only queries for timesheets and reports
 * ──────────────────────────────────────────────────────────── */

import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { isAdmin } from "@/utils/roles";
import { TimesheetEntry, ContractTimeEntry, AnyTimeEntry } from "./types";

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
): Promise<AnyTimeEntry[]> => {
  const { includeUserData = false, forceUserId } = options;

  // Session user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  // Fetch timesheet entries
  let timesheetQuery = supabase
    .from("timesheet_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  // Fetch contract time entries
  let contractQuery = supabase
    .from("contract_time_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  /* Row filter logic for both queries */
  if (forceUserId) {
    // Timesheet screen passes its own ID – always self-only
    timesheetQuery = timesheetQuery.eq("user_id", forceUserId);
    contractQuery = contractQuery.eq("user_id", forceUserId);
  } else if (!(await isAdmin(user))) {
    // Employees default to self-only
    timesheetQuery = timesheetQuery.eq("user_id", user.id);
    contractQuery = contractQuery.eq("user_id", user.id);
  }
  // Admins with no forceUserId → no extra filter; RLS decides

  // Execute both queries
  const [timesheetResult, contractResult] = await Promise.all([
    timesheetQuery.order("entry_date", { ascending: true }),
    contractQuery.order("entry_date", { ascending: true })
  ]);

  if (timesheetResult.error) throw timesheetResult.error;
  if (contractResult.error) throw contractResult.error;

  const timesheetEntries = timesheetResult.data as TimesheetEntry[];
  const contractEntries = contractResult.data as ContractTimeEntry[];

  // If we need user data, fetch it separately to avoid join issues
  let enrichedTimesheetEntries = timesheetEntries;
  let enrichedContractEntries = contractEntries;
  
  if (includeUserData && (timesheetEntries.length > 0 || contractEntries.length > 0)) {
    const allUserIds = [
      ...new Set([
        ...timesheetEntries.map(e => e.user_id),
        ...contractEntries.map(e => e.user_id)
      ])
    ];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, organization, time_zone")
      .in("id", allUserIds);

    const profileMap = (profiles ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    enrichedTimesheetEntries = timesheetEntries.map(e => ({
      ...e,
      user: profileMap[e.user_id]
    }));

    enrichedContractEntries = contractEntries.map(e => ({
      ...e,
      user: profileMap[e.user_id]
    }));
  }

  // Enrich timesheet entries with project data
  const projectIds = [...new Set(enrichedTimesheetEntries.map(e => e.project_id))];
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, is_active")
      .in("id", projectIds);

    const projectMap = (projects ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    enrichedTimesheetEntries = enrichedTimesheetEntries.map(e => ({ 
      ...e, 
      project: projectMap[e.project_id] 
    }));
  }

  // Enrich contract entries with contract data
  const contractIds = [...new Set(enrichedContractEntries.map(e => e.contract_id))];
  if (contractIds.length > 0) {
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, name, description, start_date, end_date, status, is_active")
      .in("id", contractIds);

    const contractMap = (contracts ?? []).reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, any>);

    enrichedContractEntries = enrichedContractEntries.map(e => ({ 
      ...e, 
      contract: contractMap[e.contract_id] 
    }));
  }

  // Combine and return all entries
  const allEntries: AnyTimeEntry[] = [
    ...enrichedTimesheetEntries,
    ...enrichedContractEntries
  ];

  // Sort by date
  return allEntries.sort((a, b) => 
    new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );
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
