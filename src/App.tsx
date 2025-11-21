
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import MainLayout from "@/components/layout/MainLayout";
import HubLayout from "@/components/layout/HubLayout";
import AdminRoute from "@/routes/AdminRoute";
import FullTimeRoute from "@/routes/FullTimeRoute";
import AuthPage from "@/pages/AuthPage";
import ManagementHubPage from "@/pages/ManagementHubPage";
import Dashboard from "@/pages/Index";
import TimesheetPage from "@/pages/TimesheetPage";
import ReportsPage from "@/pages/ReportsPage";
import TeamPage from "@/pages/TeamPage";
import WorkSchedulePage from "@/pages/WorkSchedulePage";
import HolidayManagementPage from "@/pages/HolidayManagementPage";
import LeaveApplicationPage from "@/pages/LeaveApplicationPage";
import LeaveManagementPage from "@/pages/LeaveManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import MassMailerPage from "@/pages/MassMailerPage";
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
              <Route index element={<Dashboard />} />
              <Route path="entry" element={<TimesheetPage />} />
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
                <Route path="leave-management" element={<LeaveManagementPage />} />
                <Route path="mass-mailer" element={<MassMailerPage />} />
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
