
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SecurityTestRunner from "@/components/dev/SecurityTestRunner";
import { Shield, Bug, TestTube } from "lucide-react";

const DevTestsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Development Tests
        </h1>
        <p className="text-gray-600 mt-2">
          Security and functionality tests for the timesheet application
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-blue-500" />
              <CardTitle>Available Tests</CardTitle>
            </div>
            <CardDescription>
              Run these tests to verify security and functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium">Row Level Security Test</h4>
                  <p className="text-sm text-gray-600">
                    Verifies that users can only see their own timesheet entries
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-50">
                <Bug className="h-5 w-5 text-orange-500" />
                <div>
                  <h4 className="font-medium">Performance Tests</h4>
                  <p className="text-sm text-gray-600">
                    Coming soon - Database query performance validation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SecurityTestRunner />
      </div>
    </div>
  );
};

export default DevTestsPage;
