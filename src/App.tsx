
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import MainLayout from "@/components/layout/MainLayout";
import HubLayout from "@/components/layout/HubLayout";
import ChildcareMonitorLayout from "@/components/layout/ChildcareMonitorLayout";
import MassMailerLayout from "@/components/layout/MassMailerLayout";
import AdminRoute from "@/routes/AdminRoute";
import FullTimeRoute from "@/routes/FullTimeRoute";
import AuthPage from "@/pages/AuthPage";
import ManagementHubPage from "@/pages/ManagementHubPage";
import TimesheetPage from "@/pages/TimesheetPage";
import ReportsPage from "@/pages/ReportsPage";
import TeamPage from "@/pages/TeamPage";
import WorkSchedulePage from "@/pages/WorkSchedulePage";
import HolidayManagementPage from "@/pages/HolidayManagementPage";
import PayrollSettingsPage from "@/pages/PayrollSettingsPage";
import LeaveApplicationPage from "@/pages/LeaveApplicationPage";
import LeaveManagementPage from "@/pages/LeaveManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import MassMailerPage from "@/pages/MassMailerPage";
import ChildcareMonitorIndex from "@/pages/childcare-monitor/ChildcareMonitorIndex";
import RoomMonitor from "@/pages/childcare-monitor/RoomMonitor";
import DeviceSetup from "@/pages/childcare-monitor/DeviceSetup";
import DeviceManagement from "@/pages/childcare-monitor/DeviceManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            {/* Management Hub - Landing page for all apps */}
            <Route path="/" element={<HubLayout />}>
              <Route index element={<ManagementHubPage />} />
            </Route>

            {/* Timesheet App Routes */}
            <Route path="/timesheet" element={<MainLayout />}>
              <Route index element={<TimesheetPage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Full-time employee routes */}
              <Route element={<FullTimeRoute />}>
                <Route path="leave-application" element={<LeaveApplicationPage />} />
              </Route>

            {/* Admin-only routes protected by AdminRoute */}
            <Route element={<AdminRoute />}>
              <Route path="reports" element={<ReportsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="work-schedule" element={<WorkSchedulePage />} />
              <Route path="holidays" element={<HolidayManagementPage />} />
              <Route path="payroll-settings" element={<PayrollSettingsPage />} />
              <Route path="leave-management" element={<LeaveManagementPage />} />
            </Route>
          </Route>

          {/* Mass Mailer App Routes - Standalone */}
          <Route path="/mass-mailer" element={<MassMailerLayout />}>
            <Route element={<AdminRoute />}>
              <Route index element={<MassMailerPage />} />
            </Route>
          </Route>

          {/* Childcare Monitor App Routes - Standalone */}
          {/* Device setup route - no auth required */}
          <Route path="/childcare-monitor/setup" element={<DeviceSetup />} />
          
          <Route path="/childcare-monitor" element={<ChildcareMonitorLayout />}>
            <Route index element={<ChildcareMonitorIndex />} />
            <Route path="room/:roomId" element={<RoomMonitor />} />
            <Route element={<AdminRoute />}>
              <Route path="devices" element={<DeviceManagement />} />
            </Route>
          </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
