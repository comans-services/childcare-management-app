
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsPage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          {/* This will be implemented next */}
          <div className="p-8 text-center">
            <p className="text-gray-500">Settings dashboard will be implemented in the next step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
