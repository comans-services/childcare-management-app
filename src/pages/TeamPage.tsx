
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import TeamList from "@/components/team/TeamList";
import TimesheetLockManager from "@/components/admin/TimesheetLockManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TeamPage = () => {
  const { user, userRole } = useAuth();
  const isUserAdmin = userRole === "admin";

  if (!user) {
    return <div>Please sign in to view this page.</div>;
  }

  if (!isUserAdmin) {
    return <div>Access denied. Admin role required.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-gray-600">Manage team members and timesheet settings</p>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="locks">Timesheet Locks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <TeamList />
        </TabsContent>
        
        <TabsContent value="locks" className="mt-6">
          <TimesheetLockManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPage;
