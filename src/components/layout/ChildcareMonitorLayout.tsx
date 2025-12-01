import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Loader2 } from "lucide-react";
import logo from '@/assets/childcare-monitor-logo.svg';
import { useDeviceAuth } from "@/hooks/useDeviceAuth";

export const ChildcareMonitorLayout = () => {
  const { session, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDevice, isValidating, deviceInfo } = useDeviceAuth();

  // Wait for device validation to complete before making auth decisions
  if (isValidating) {
    return (
      <div className="min-h-screen bg-care-green flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If it's a valid device, allow access without user session
  // Render minimal layout for iPad devices (no header)
  if (isDevice && deviceInfo) {
    return (
      <div className="min-h-screen bg-care-green">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    );
  }

  // For non-device access, require user session
  if (!session && location.pathname !== '/auth') {
    console.log(`Saving intended path before redirect: ${location.pathname}`);
    localStorage.setItem('intended_path', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  return (
    <div className="min-h-screen bg-care-green">
      {/* Childcare Monitor Header */}
      <header className="bg-care-darkGreen border-b border-care-accentGreen shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2">
                <img src={logo} alt="Childcare Monitor Logo" className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Childcare Room Monitor</h1>
                <p className="text-xs text-care-paleGreen">Real-time room management</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-care-paleGreen hover:text-white hover:bg-care-lightGreen"
            >
              <Home className="h-4 w-4" />
              Back to Hub
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-care-paleGreen">
              Hi, {displayName}
            </span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ChildcareMonitorLayout;
