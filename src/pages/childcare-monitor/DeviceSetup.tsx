import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deviceService } from "@/lib/childcare-monitor/device-service";
import { setDeviceToken, getDeviceSessionId } from "@/hooks/useDeviceAuth";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/childcare-monitor-logo.svg";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const DeviceSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"validating" | "success" | "error">("validating");
  const [message, setMessage] = useState("Validating device token...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ roomId: string; roomName: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const setupDevice = useCallback(async () => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No device token provided in setup URL.");
      setErrorDetail("Please ask your administrator for a valid setup link with a token parameter.");
      return;
    }

    setStatus("validating");
    setMessage("Validating device token...");
    setErrorDetail(null);

    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          setMessage(`Retrying... (attempt ${attempt} of ${MAX_RETRIES})`);
          await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
        }

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
          return;
        } else {
          // Non-retryable error — token is invalid or expired
          setStatus("error");
          setMessage("Device token is invalid or has expired.");
          setErrorDetail(result.message || "Please ask your administrator to generate a new setup link.");
          return;
        }
      } catch (error: any) {
        console.error(`Device setup attempt ${attempt} failed:`, error);
        lastError = error;

        if (attempt < MAX_RETRIES) {
          continue;
        }
      }
    }

    // All retries exhausted
    setStatus("error");
    setMessage("Failed to register device after multiple attempts.");
    const detail = lastError?.message || "Network or server error.";
    setErrorDetail(`${detail} — Please check your network connection and try again, or contact your administrator.`);
  }, [searchParams, navigate]);

  useEffect(() => {
    setupDevice();
  }, [setupDevice]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    await setupDevice();
    setIsRetrying(false);
  };

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
            <p className="text-lg mb-2">{message}</p>
            {errorDetail && (
              <p className="text-sm text-care-lightText mb-4">{errorDetail}</p>
            )}
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-care-darkGreen mt-2"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? "Retrying..." : "Try Again"}
            </Button>
            {retryCount > 0 && (
              <p className="text-xs text-care-lightText mt-3">
                Tried {retryCount + 1} time{retryCount + 1 !== 1 ? "s" : ""}. Contact your administrator if this continues.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeviceSetup;
