import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";

const HubLayout = () => {
  const { session } = useAuth();
  const location = useLocation();

  // Redirect to auth if not authenticated
  if (!session) {
    console.log(`No session found, saving intended path: ${location.pathname}`);
    localStorage.setItem('intended_path', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen w-full">
      <Header />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default HubLayout;
