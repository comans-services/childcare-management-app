import { useState, useEffect } from "react";
import { PayrollSettings } from "@/components/admin/PayrollSettings";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PayrollSettingsPage = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(data?.role === "admin");
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/timesheet" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payroll Settings</h1>
        <p className="text-muted-foreground">
          Configure payroll periods and manage pay schedules
        </p>
      </div>
      <PayrollSettings />
    </div>
  );
};

export default PayrollSettingsPage;
