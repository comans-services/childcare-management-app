import { PayrollSettings } from "@/components/admin/PayrollSettings";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const PayrollSettingsPage = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (!user || userRole !== "admin") {
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
