
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamList from "@/components/team/TeamList";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddEditUserDialog from "@/components/team/AddEditUserDialog";
import { createUser } from "@/lib/user-service";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const TeamPage = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdminOrManager = userRole === "admin" || userRole === "manager";
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    console.log("Current user:", user);
    console.log("User role:", userRole);
  }, [user, userRole]);

  const handleAddUser = () => {
    console.log("Opening add user dialog");
    setIsAddUserOpen(true);
  };

  const handleCreateUser = (userData: any) => {
    console.log("Creating user:", userData);
    setIsCreatingUser(true);
    
    createUser(userData)
      .then((createdUser) => {
        toast({
          title: "User created",
          description: `New team member ${createdUser.full_name || createdUser.email} has been added successfully`,
        });
        setIsAddUserOpen(false);
        queryClient.invalidateQueries({ queryKey: ["users"] });
      })
      .catch((error) => {
        toast({
          title: "Error creating user",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsCreatingUser(false);
      });
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-gray-600">Manage and view team members</p>
        </div>
        {isAdminOrManager && (
          <Button 
            onClick={handleAddUser}
            size="lg" 
            className="bg-primary hover:bg-primary/90"
            disabled={isCreatingUser}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isCreatingUser ? "Adding..." : "Add Team Member"}
          </Button>
        )}
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-muted/50">
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {isAdminOrManager 
              ? "Manage your team members and their roles" 
              : "View team members"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TeamList />
        </CardContent>
      </Card>

      {isAdminOrManager && (
        <AddEditUserDialog
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          onSave={handleCreateUser}
          isNewUser={true}
        />
      )}
    </div>
  );
};

export default TeamPage;
