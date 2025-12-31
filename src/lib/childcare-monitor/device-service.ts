import { supabase } from "@/integrations/supabase/client";

export interface DeviceInfo {
  id: string;
  device_name: string;
  room_id: string;
  room_name: string;
  mac_address: string;
  device_token: string | null;
  is_active: boolean;
  last_seen: string | null;
  created_at: string;
}

export const deviceService = {
  // Validate device token from localStorage with optional session binding
  async validateDeviceToken(token: string, sessionId?: string) {
    const { data, error } = await supabase.rpc("validate_device_token", {
      p_token: token,
      p_session_id: sessionId || null,
    });

    if (error) throw error;
    return data as {
      valid: boolean;
      message?: string;
      device_id?: string;
      device_name?: string;
      room_id?: string;
      room_name?: string;
      session_bound?: boolean;
    };
  },

  // Generate new device token (admin only)
  async generateDeviceToken(roomId: string, deviceName: string) {
    const { data, error } = await supabase.rpc("generate_device_token", {
      p_room_id: roomId,
      p_device_name: deviceName,
    });

    if (error) throw error;
    return data as {
      success: boolean;
      device_id: string;
      token: string;
    };
  },

  // Get all devices (admin only)
  async getAllDevices() {
    const { data, error } = await supabase
      .from("room_devices")
      .select(
        `
        *,
        childcare_rooms!room_devices_room_id_fkey(name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((device) => ({
      ...device,
      room_name: device.childcare_rooms?.name || "Unknown",
    })) as DeviceInfo[];
  },

  // Revoke device access (admin only)
  async revokeDevice(deviceId: string) {
    const { error } = await supabase
      .from("room_devices")
      .update({ is_active: false })
      .eq("id", deviceId);

    if (error) throw error;
  },

  // Reactivate device (admin only)
  async reactivateDevice(deviceId: string) {
    const { error } = await supabase
      .from("room_devices")
      .update({ is_active: true })
      .eq("id", deviceId);

    if (error) throw error;
  },

  // Delete device permanently (admin only)
  async deleteDevice(deviceId: string) {
    const { error } = await supabase
      .from("room_devices")
      .delete()
      .eq("id", deviceId);

    if (error) throw error;
  },

  // Regenerate device token (clears session binding)
  async regenerateDeviceToken(deviceId: string) {
    // Generate new token
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Update device with new token and clear session binding
    const { error } = await supabase
      .from("room_devices")
      .update({ 
        device_token: newToken, 
        bound_session_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", deviceId);

    if (error) throw error;
    
    return {
      success: true,
      token: newToken,
      device_id: deviceId,
    };
  },
};
