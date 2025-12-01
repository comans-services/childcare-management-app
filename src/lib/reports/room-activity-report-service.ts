import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { startOfDay, endOfDay } from "date-fns";

type StaffRoomEntry = Database["public"]["Tables"]["staff_room_entries"]["Row"];
type RoomActivityLog = Database["public"]["Tables"]["room_activity_log"]["Row"];

export interface RoomActivityReportFilters {
  startDate: Date;
  endDate: Date;
  roomIds?: string[];
  staffIds?: string[];
}

export interface RoomActivityReportData {
  staffEntries: (StaffRoomEntry & { staff?: any; room?: any })[];
  activityLogs: (RoomActivityLog & { room?: any; staff?: any; performer?: any })[];
  complianceViolations: any[];
}

export const fetchRoomActivityReportData = async (
  filters: RoomActivityReportFilters
): Promise<RoomActivityReportData> => {
  try {
    // Normalize dates to full day ranges
    const startDateISO = startOfDay(filters.startDate).toISOString();
    const endDateISO = endOfDay(filters.endDate).toISOString();

    // Fetch staff room entries
    let entriesQuery = supabase
      .from("staff_room_entries")
      .select(`
        *,
        profiles!staff_room_entries_staff_id_fkey(full_name, email, employment_type),
        childcare_rooms!staff_room_entries_room_id_fkey(name, room_number),
        room_devices!staff_room_entries_device_id_fkey(device_name)
      `)
      .gte("entered_at", startDateISO)
      .lte("entered_at", endDateISO)
      .order("entered_at", { ascending: false });

    if (filters.roomIds && filters.roomIds.length > 0) {
      entriesQuery = entriesQuery.in("room_id", filters.roomIds);
    }

    if (filters.staffIds && filters.staffIds.length > 0) {
      entriesQuery = entriesQuery.in("staff_id", filters.staffIds);
    }

    const { data: staffEntries, error: entriesError } = await entriesQuery;
    if (entriesError) throw entriesError;

    // Fetch room activity logs
    let logsQuery = supabase
      .from("room_activity_log")
      .select(`
        *,
        childcare_rooms!room_activity_log_room_id_fkey(name, room_number),
        staff:profiles!room_activity_log_staff_id_fkey(full_name),
        performer:profiles!room_activity_log_performed_by_fkey(full_name),
        room_devices!room_activity_log_device_id_fkey(device_name)
      `)
      .gte("performed_at", startDateISO)
      .lte("performed_at", endDateISO)
      .order("performed_at", { ascending: false });

    if (filters.roomIds && filters.roomIds.length > 0) {
      logsQuery = logsQuery.in("room_id", filters.roomIds);
    }

    const { data: activityLogs, error: logsError } = await logsQuery;
    if (logsError) throw logsError;

    // Fetch compliance violations (from view)
    let violationsQuery = supabase
      .from("compliance_violations")
      .select("*")
      .gte("performed_at", startDateISO)
      .lte("performed_at", endDateISO)
      .order("performed_at", { ascending: false });

    const { data: violations, error: violationsError } = await violationsQuery;
    if (violationsError) throw violationsError;

    return {
      staffEntries: staffEntries || [],
      activityLogs: activityLogs || [],
      complianceViolations: violations || [],
    };
  } catch (error) {
    console.error("Error fetching room activity report data:", error);
    throw error;
  }
};
