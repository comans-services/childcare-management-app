


/* ──────────────────────────────────────────────────────────────
 * entry-fetch-service.ts
 * All read-only queries for timesheets and reports
 * ──────────────────────────────────────────────────────────── */

import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { isAdmin } from "@/utils/roles";
import { TimesheetEntry } from "./types";

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
): Promise<TimesheetEntry[]> => {
  const { includeUserData = false, forceUserId } = options;

  // Session user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  let q = supabase
    .from("timesheet_entries")
    .select("*")
    .gte("entry_date", formatDate(startDate))
    .lte("entry_date", formatDate(endDate));

  /* Row filter logic
     ──────────────────────────────────────── */
  if (forceUserId) {
    // Timesheet screen passes its own ID – always self-only
    q = q.eq("user_id", forceUserId);
  } else if (!isAdmin(user)) {
    // Employees default to self-only
    q = q.eq("user_id", user.id);
  }
  // Admins with no forceUserId → no extra filter; RLS decides

  const { data, error } = await q.order("entry_date", { ascending: true });
  if (error) throw error;

  // If we need user data, fetch it separately
  let entriesWithUserData = data as TimesheetEntry[];
  
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
      user: profileMap[e.user_id]
    }));
  }

  /* Optionally join projects (kept from your original logic) */
  const projectIds = [...new Set(entriesWithUserData.map(e => e.project_id))];
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, is_active")
      .in("id", projectIds);

    const projectMap = (projects ?? []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    return entriesWithUserData.map(e => ({ ...e, project: projectMap[e.project_id] }));
  }

  return entriesWithUserData;
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

  if (isAdmin(user)) {
    /* Admin → call your RPC (full access) */
    const { data, error } = await supabase.rpc("timesheet_entries_report", {
      p_start_date: startDate.toISOString().slice(0, 10),
      p_end_date:   endDate.toISOString().slice(0, 10),
      p_user_id:    filters.userId   || null,
      p_project_id: filters.projectId|| null,
      p_customer_id:filters.customerId|| null
    });
    if (error) throw error;
    return data ?? [];
  }

  /* Non-admin → fall back to self-only fetch */
  return fetchTimesheetEntries(startDate, endDate, {
    includeUserData: true,
    forceUserId: user.id
  });
};
