
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamList from "@/components/team/TeamList";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddEditUserDialog from "@/components/team/AddEditUserDialog";
import { createUser } from "@/lib/user-service";

const TeamPage = () => {
  const { userRole } = useAuth();
  const isAdminOrManager = userRole === "admin" || userRole === "manager";
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-gray-600">Manage and view team members</p>
        </div>
        {isAdminOrManager && (
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        )}
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

      {isAdminOrManager && (
        <AddEditUserDialog
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          onSave={createUser}
          isNewUser={true}
        />
      )}
    </div>
  );
};

export default TeamPage;
