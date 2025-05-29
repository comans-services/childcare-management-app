
import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const MainLayout = () => {
  const { session } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Save intended path before redirecting to auth (but not if already on auth page)
  if (!session && location.pathname !== '/auth') {
    console.log(`Saving intended path before redirect: ${location.pathname}`);
    localStorage.setItem('intended_path', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  // If on auth page but authenticated, don't save the auth path
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
