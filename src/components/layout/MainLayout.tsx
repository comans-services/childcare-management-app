
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const MainLayout = () => {
  const { session } = useAuth();
  const isMobile = useIsMobile();

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
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
