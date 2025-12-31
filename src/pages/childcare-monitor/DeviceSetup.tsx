import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deviceService } from "@/lib/childcare-monitor/device-service";
import { setDeviceToken, getDeviceSessionId } from "@/hooks/useDeviceAuth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/childcare-monitor-logo.svg";

const DeviceSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"validating" | "success" | "error">("validating");
  const [message, setMessage] = useState("Validating device token...");
  const [deviceInfo, setDeviceInfo] = useState<{ roomId: string; roomName: string } | null>(null);

  useEffect(() => {
    const setupDevice = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No device token provided in setup URL");
        return;
      }

      try {
        // Store token first (this also generates a session ID)
        setDeviceToken(token);
        
        // Get the session ID that was just created
        const sessionId = getDeviceSessionId();
        
        // Validate with session binding
        const result = await deviceService.validateDeviceToken(token, sessionId || undefined);

        if (result.valid) {
          setStatus("success");
          setMessage(`Device registered successfully for ${result.room_name} room`);
          setDeviceInfo({
            roomId: result.room_id!,
            roomName: result.room_name!,
          });

          // Redirect to room after 2 seconds
          setTimeout(() => {
            navigate(`/childcare-monitor/room/${result.room_id}`);
          }, 2000);
        } else {
          setStatus("error");
          setMessage(result.message || "Invalid device token");
        }
      } catch (error) {
        console.error("Device setup error:", error);
        setStatus("error");
        setMessage("Failed to setup device. Please contact an administrator.");
      }
    };

    setupDevice();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-care-green text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-care-darkGreen rounded-lg p-8 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-4 mx-auto mb-6">
          <img src={logo} alt="Room Monitor Logo" className="w-full h-full" />
        </div>

        <h1 className="text-2xl font-bold mb-4">iPad Device Setup</h1>

        {status === "validating" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-care-accentGreen" />
            <p className="text-care-lightText">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg mb-2">{message}</p>
            {deviceInfo && (
              <p className="text-care-paleGreen text-sm">
                Redirecting to {deviceInfo.roomName} room...
              </p>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg mb-4">{message}</p>
            <p className="text-sm text-care-lightText">
              Please contact your administrator for a valid setup link.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DeviceSetup;
