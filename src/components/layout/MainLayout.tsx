
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const MainLayout = () => {
  const { session, loading } = useAuth();
  const { userRole } = useRBAC();
  const isMobile = useIsMobile();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <div className="hidden md:block w-44 border-r min-h-[calc(100vh-4rem)] bg-white">
          <Sidebar />
        </div>
        {isMobile && <Sidebar />}
        <main className="flex-1 p-4 sm:p-6 w-[110%]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
