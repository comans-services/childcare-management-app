
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamList from "@/components/team/TeamList";
import { useAuth } from "@/context/AuthContext";

const TeamPage = () => {
  const { userRole } = useAuth();
  const isAdminOrManager = userRole === "admin" || userRole === "manager";

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-gray-600">Manage and view team members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {isAdminOrManager 
              ? "Manage your team members and their roles" 
              : "View team members"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamList />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;
