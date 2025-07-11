import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEmploymentType } from "@/hooks/useEmploymentType";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const FullTimeRoute = () => {
  const { loading } = useAuth();
  const { isFullTime, employmentType } = useEmploymentType();

  // Show loading state while checking authentication and employment type
  if (loading || employmentType === null) {
    return null;
  }

  // Show access denied message for non-full-time employees
  if (!isFullTime) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              This feature is only available to full-time employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Leave applications are only available for full-time employees. 
                If you believe this is an error, please contact your administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render full-time employee content
  return <Outlet />;
};

export default FullTimeRoute;