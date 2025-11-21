import React from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Mail } from "lucide-react";

export const MassMailerLayout = () => {
  const { session, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Save intended path before redirecting to auth
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
    <div className="min-h-screen bg-slate-50">
      {/* Mass Mailer Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mass Mailer</h1>
                <p className="text-sm text-gray-500">Email campaign management</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="h-4 w-4" />
              Back to Hub
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Hi, {displayName}
            </span>
          </div>
        </div>
      </header>

      {/* Main content area - full width, no sidebar */}
      <main className="w-full p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MassMailerLayout;
