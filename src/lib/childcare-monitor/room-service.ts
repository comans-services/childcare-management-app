import { supabase } from "@/integrations/supabase/client";

export interface Room {
  id: string;
  name: string;
  room_number: number;
  children_under_3: number;
  children_over_3: number;
  ratio_under_3: number;
  ratio_over_3: number;
  last_updated: string;
  is_active: boolean;
}

export interface StaffInRoom {
  staff_id: string;
  full_name: string;
  email: string;
  room_id: string;
  entered_at: string;
  entry_method: string;
}

export interface RoomStatus {
  room_id: string;
  room_name: string;
  room_number: number;
  children: {
    under_3: number;
    over_3: number;
    total: number;
  };
  staff: {
    current: number;
    required: number;
    list: Array<{
      staff_id: string;
      name: string;
      entered_at: string;
      duration_minutes: number;
    }>;
  };
  compliance: {
    is_compliant: boolean;
    show_warning: boolean;
    staff_shortage: number;
  };
  last_updated: string;
}

export const roomService = {
  async getRooms() {
    const { data, error } = await supabase
      .from("childcare_rooms")
      .select("*")
      .eq("is_active", true)
      .order("room_number");

    if (error) throw error;
    return data as Room[];
  },

  async getRoom(roomId: string) {
    const { data, error } = await supabase
      .from("childcare_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error) throw error;
    return data as Room;
  },

  async getRoomStatus(roomId: string): Promise<RoomStatus> {
    const { data, error } = await supabase.rpc("get_room_status", {
      p_room_id: roomId,
    });

    if (error) throw error;
    return data as unknown as RoomStatus;
  },

  async getStaffInRoom(roomId: string) {
    const { data, error } = await supabase
      .from("staff_in_room")
      .select("*")
      .eq("room_id", roomId);

    if (error) throw error;
    return data as StaffInRoom[];
  },

  async getAllStaff() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("is_active", true)
      .order("full_name");

    if (error) throw error;
    return data;
  },

  async isStaffInAnyRoom(staffId: string) {
    const { data, error } = await supabase.rpc("is_staff_in_room", {
      p_staff_id: staffId,
    });

    if (error) throw error;
    return data as boolean;
  },

  async getStaffCurrentRoom(staffId: string) {
    const { data, error } = await supabase.rpc("get_staff_current_room", {
      p_staff_id: staffId,
    });

    if (error) throw error;
    return data as string | null;
  },

  async staffEnterRoom(
    staffId: string,
    roomId: string,
    entryMethod: string = "manual",
    deviceId?: string
  ) {
    const { data, error } = await supabase.rpc("staff_enter_room", {
      p_staff_id: staffId,
      p_room_id: roomId,
      p_entry_method: entryMethod,
      p_entered_by: (await supabase.auth.getUser()).data.user?.id,
      p_device_id: deviceId || null,
    });

    if (error) throw error;
    return data;
  },

  async staffExitRoom(
    staffId: string,
    roomId?: string,
    exitMethod: string = "manual",
    deviceId?: string
  ) {
    const { data, error } = await supabase.rpc("staff_exit_room", {
      p_staff_id: staffId,
      p_room_id: roomId || null,
      p_exit_method: exitMethod,
      p_exited_by: (await supabase.auth.getUser()).data.user?.id,
      p_device_id: deviceId || null,
    });

    if (error) throw error;
    return data;
  },

  async updateChildCounts(
    roomId: string,
    childrenUnder3: number,
    childrenOver3: number,
    deviceId?: string
  ) {
    const { data, error } = await supabase.rpc("update_child_counts", {
      p_room_id: roomId,
      p_children_under_3: childrenUnder3,
      p_children_over_3: childrenOver3,
      p_updated_by: (await supabase.auth.getUser()).data.user?.id,
      p_device_id: deviceId || null,
    });

    if (error) throw error;
    return data;
  },

  async getRoomActivityLog(roomId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from("room_activity_log")
      .select("*, profiles:performed_by(full_name)")
      .eq("room_id", roomId)
      .order("performed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getCurrentRoomStatus() {
    const { data, error } = await supabase
      .from("current_room_status")
      .select("*")
      .order("room_number");

    if (error) throw error;
    return data;
  },
};
