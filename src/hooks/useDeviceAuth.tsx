import { useState, useEffect } from "react";
import { deviceService } from "@/lib/childcare-monitor/device-service";

const DEVICE_TOKEN_KEY = "childcare_device_token";

export interface DeviceAuthInfo {
  isDevice: boolean;
  isValidating: boolean;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    roomId: string;
    roomName: string;
  } | null;
  error: string | null;
}

export const useDeviceAuth = () => {
  const [authInfo, setAuthInfo] = useState<DeviceAuthInfo>({
    isDevice: false,
    isValidating: true,
    deviceInfo: null,
    error: null,
  });

  useEffect(() => {
    const validateDevice = async () => {
      try {
        const token = localStorage.getItem(DEVICE_TOKEN_KEY);

        if (!token) {
          setAuthInfo({
            isDevice: false,
            isValidating: false,
            deviceInfo: null,
            error: null,
          });
          return;
        }

        const result = await deviceService.validateDeviceToken(token);

        if (result.valid) {
          setAuthInfo({
            isDevice: true,
            isValidating: false,
            deviceInfo: {
              deviceId: result.device_id!,
              deviceName: result.device_name!,
              roomId: result.room_id!,
              roomName: result.room_name!,
            },
            error: null,
          });
        } else {
          // Invalid token - clear it
          localStorage.removeItem(DEVICE_TOKEN_KEY);
          setAuthInfo({
            isDevice: false,
            isValidating: false,
            deviceInfo: null,
            error: result.message || "Invalid device token",
          });
        }
      } catch (error) {
        console.error("Device validation error:", error);
        localStorage.removeItem(DEVICE_TOKEN_KEY);
        setAuthInfo({
          isDevice: false,
          isValidating: false,
          deviceInfo: null,
          error: "Failed to validate device",
        });
      }
    };

    validateDevice();
  }, []);

  return authInfo;
};

export const setDeviceToken = (token: string) => {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
};

export const clearDeviceToken = () => {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
};
