/* ──────────────────────────────────────────────────────────────
 * entry-fetch-service.ts
 * All read-only queries for timesheets and reports
 * ──────────────────────────────────────────────────────────── */

import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { isAdmin } from "@/utils/roles";
import { TimesheetEntry } from "./types";

export const fetchTimesheetEntries = async (
  startDate: Date,
  endDate: Date,
  options: {
    includeUserData?: boolean;
    forceUserId?: string;
  } = {}
): Promise<TimesheetEntry[]> => {
  const { includeUserData = false, forceUserId } = options;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  let q = supabase
    .from("timesheet_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  if (forceUserId) {
    q = q.eq("user_id", forceUserId);
  } else if (!(await isAdmin(user))) {
    q = q.eq("user_id", user.id);
  }

  const { data, error } = await q.order("entry_date", { ascending: true });
  if (error) throw error;

  let entriesWithUserData: TimesheetEntry[] = data.map(e => ({...e, entry_type: 'project' as const}));
  
  if (includeUserData && data.length > 0) {
    const userIds = [...new Set(data.map(e => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, organization, time_zone")
      .in("id", userIds);

    const profileMap = (profiles ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    entriesWithUserData = data.map(e => ({
      ...e,
      entry_type: 'project' as const,
      user: profileMap[e.user_id]
    }));
  }

  return entriesWithUserData;
};

export const fetchReportData = async (
  filters: {
    startDate: Date;
    endDate: Date;
    userIds?: string[];
    employmentType?: string;
    includeEmployeeData?: boolean;
  }
): Promise<TimesheetEntry[]> => {
  try {
    let query = supabase
      .from("timesheet_entries")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          employee_card_id,
          employee_id,
          employment_type,
          organization,
          time_zone
        )
      `)
      .gte("entry_date", formatDate(filters.startDate))
      .lte("entry_date", formatDate(filters.endDate))
      .order("entry_date", { ascending: true })
      .order("user_id", { ascending: true });

    if (filters.userIds && filters.userIds.length > 0) {
      query = query.in("user_id", filters.userIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching report data:", error);
      throw error;
    }

    // Filter by employment type after fetching (since we need to check the joined profiles data)
    let filteredData = data || [];
    if (filters.employmentType) {
      if (filters.employmentType === 'permanent') {
        // Permanent includes full-time and part-time
        filteredData = filteredData.filter((entry: any) => 
          entry.profiles?.employment_type === 'full-time' || 
          entry.profiles?.employment_type === 'part-time'
        );
      } else if (filters.employmentType === 'casual') {
        filteredData = filteredData.filter((entry: any) => 
          entry.profiles?.employment_type === 'casual'
        );
      }
    }

    const entries: TimesheetEntry[] = filteredData.map((entry: any) => ({
      ...entry,
      entry_type: 'project' as const,
      user: filters.includeEmployeeData ? entry.profiles : undefined
    }));

    return entries;
  } catch (error) {
    console.error("Error in fetchReportData:", error);
    throw error;
  }
};
