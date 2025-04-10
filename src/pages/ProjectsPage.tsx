
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectsPage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-gray-600">Manage and monitor project budgets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Manage your team's projects</CardDescription>
        </CardHeader>
        <CardContent>
          {/* This will be implemented next */}
          <div className="p-8 text-center">
            <p className="text-gray-500">Projects dashboard will be implemented in the next step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsPage;
