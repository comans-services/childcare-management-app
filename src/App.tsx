
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { NavigationProvider } from "@/contexts/NavigationContext";

import MainLayout from "@/components/layout/MainLayout";
import HubLayout from "@/components/layout/HubLayout";
import ChildcareMonitorLayout from "@/components/layout/ChildcareMonitorLayout";
import MassMailerLayout from "@/components/layout/MassMailerLayout";
import AdminRoute from "@/routes/AdminRoute";
import AuthPage from "@/pages/AuthPage";
import ManagementHubPage from "@/pages/ManagementHubPage";
import TimesheetPage from "@/pages/TimesheetPage";
import ReportsPage from "@/pages/ReportsPage";
import TeamPage from "@/pages/TeamPage";
import WorkSchedulePage from "@/pages/WorkSchedulePage";
import HolidayManagementPage from "@/pages/HolidayManagementPage";
import PayrollSettingsPage from "@/pages/PayrollSettingsPage";
import SettingsPage from "@/pages/SettingsPage";
import MassMailerPage from "@/pages/MassMailerPage";
import ChildcareMonitorIndex from "@/pages/childcare-monitor/ChildcareMonitorIndex";
import RoomMonitor from "@/pages/childcare-monitor/RoomMonitor";
import DeviceSetup from "@/pages/childcare-monitor/DeviceSetup";
import DeviceManagement from "@/pages/childcare-monitor/DeviceManagement";
import NotFound from "@/pages/NotFound";

// Optimized QueryClient configuration for mobile performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus (saves mobile data)
      refetchOnWindowFocus: false,
      // Do refetch when network reconnects
      refetchOnReconnect: true,
      // Retry failed requests once
      retry: 1,
      // Use offline-first strategy on slow connections
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations twice
      retry: 2,
      // Mutations require network connection
      networkMode: 'online',
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DeviceProvider>
        <NavigationProvider>
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

              {/* Admin-only routes protected by AdminRoute */}
              <Route element={<AdminRoute />}>
                <Route path="reports" element={<ReportsPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="work-schedule" element={<WorkSchedulePage />} />
                <Route path="holidays" element={<HolidayManagementPage />} />
                <Route path="payroll-settings" element={<PayrollSettingsPage />} />
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
        </NavigationProvider>
      </DeviceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
