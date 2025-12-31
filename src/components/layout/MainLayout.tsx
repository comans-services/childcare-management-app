
import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/navigation/BottomNav";

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
        {/* Dynamic sidebar with responsive behavior - default to expanded */}
        <div className="
          hidden md:block
          w-12 lg:w-56 xl:w-60 2xl:w-64 3xl:w-68 4xl:w-72
          border-r min-h-[calc(100vh-4rem)] bg-white
          transition-all duration-300 ease-in-out
          shrink-0
        ">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {isMobile && <Sidebar />}

        {/* Main content area with improved responsive width utilization */}
        {/* Add bottom padding on mobile to account for bottom nav */}
        <main className="
          flex-1 min-w-0 w-full
          p-fluid-sm sm:p-fluid-md lg:p-6 xl:p-4 2xl:p-6 3xl:p-8 4xl:p-10
          pb-20 md:pb-fluid-sm
          overflow-x-hidden
          max-w-full
        ">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation - only on mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default MainLayout;
