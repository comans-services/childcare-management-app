
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReportsPage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-600">Generate and download time reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Reports</CardTitle>
          <CardDescription>Create custom reports for your team</CardDescription>
        </CardHeader>
        <CardContent>
          {/* This will be implemented next */}
          <div className="p-8 text-center">
            <p className="text-gray-500">Reports dashboard will be implemented in the next step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
