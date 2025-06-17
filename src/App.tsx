
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import MainLayout from "@/components/layout/MainLayout";
import AdminRoute from "@/routes/AdminRoute";
import ManagerRoute from "@/routes/ManagerRoute";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Index";
import TimesheetPage from "@/pages/TimesheetPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ContractsPage from "@/pages/ContractsPage";
import CustomersPage from "@/pages/CustomersPage";
import ReportsPage from "@/pages/ReportsPage";
import TeamPage from "@/pages/TeamPage";
import WorkSchedulePage from "@/pages/WorkSchedulePage";
import SettingsPage from "@/pages/SettingsPage";
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
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="timesheet" element={<TimesheetPage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Manager-level routes (manager + admin access) */}
              <Route element={<ManagerRoute />}>
                <Route path="contracts" element={<ContractsPage />} />
              </Route>
              
              {/* Admin-only routes protected by AdminRoute */}
              <Route element={<AdminRoute />}>
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="work-schedule" element={<WorkSchedulePage />} />
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
