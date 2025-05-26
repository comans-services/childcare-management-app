
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import CreateUserForm from "@/components/admin/CreateUserForm";
import TeamList from "@/components/team/TeamList";

const AdminPage = () => {
  const { userRole } = useAuth();

  // Only admins can access this page
  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CreateUserForm />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Current Team Members</CardTitle>
              <CardDescription>
                View and manage existing users
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TeamList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
