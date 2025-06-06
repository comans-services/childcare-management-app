
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
    <div className="min-h-screen bg-slate-50 w-full">
      <Header />
      <div className="flex w-full">
        {/* Dynamic sidebar with responsive behavior */}
        <div className="
          hidden md:block 
          w-12 lg:w-44 xl:w-48 2xl:w-52 3xl:w-56 4xl:w-60
          border-r min-h-[calc(100vh-4rem)] bg-white 
          transition-all duration-300 ease-in-out
          shrink-0
        ">
          <Sidebar />
        </div>
        
        {/* Mobile sidebar overlay */}
        {isMobile && <Sidebar />}
        
        {/* Main content area with proper responsive padding */}
        <main className="
          flex-1 min-w-0 
          p-fluid-sm sm:p-fluid-md lg:p-fluid-lg xl:p-fluid-xl 2xl:p-8 3xl:p-10 4xl:p-12
          overflow-x-hidden
          container-query
        ">
          <div className="max-w-full mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
