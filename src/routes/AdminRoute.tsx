
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { toast } from "@/hooks/use-toast";

const AdminRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || loading) {
        setIsAdminUser(null);
        setHasCheckedAdmin(false);
        return;
      }

      console.log(`[AdminRoute] Checking admin status for user: ${user.id}`);
      
      try {
        const adminStatus = await isAdmin(user);
        console.log(`[AdminRoute] Admin status result: ${adminStatus}`);
        
        setIsAdminUser(adminStatus);
        setHasCheckedAdmin(true);

        // Show access denied toast and redirect if not admin
        if (!adminStatus && location.pathname !== "/timesheet") {
          console.log(`[AdminRoute] User is not admin, will redirect from: ${location.pathname}`);
          toast({
            title: "Access denied",
            description: "Admin role required",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("[AdminRoute] Error checking admin status:", error);
        setIsAdminUser(false);
        setHasCheckedAdmin(true);
        
        toast({
          title: "Error checking permissions",
          description: "Please try again or contact support",
          variant: "destructive",
        });
      }
    };

    checkAdminStatus();
  }, [user, loading, location.pathname]);

  // Show loading state while checking authentication and admin status
  if (loading || !hasCheckedAdmin) {
    return null;
  }

  // Redirect non-admin users to timesheet
  if (!isAdminUser) {
    return <Navigate to="/timesheet" replace />;
  }

  // Render admin-only content
  return <Outlet />;
};

export default AdminRoute;
