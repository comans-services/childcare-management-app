
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TeamPage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-gray-600">Manage and view team members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>View and manage your team</CardDescription>
        </CardHeader>
        <CardContent>
          {/* This will be implemented next */}
          <div className="p-8 text-center">
            <p className="text-gray-500">Team dashboard will be implemented in the next step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;
