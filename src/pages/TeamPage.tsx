
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamList from "@/components/team/TeamList";
import { useAuth } from "@/context/AuthContext";
import { useRBAC } from "@/hooks/use-rbac";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield } from "lucide-react";
import AddEditUserDialog from "@/components/team/AddEditUserDialog";
import { createUser } from "@/lib/user-service";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const TeamPage = () => {
  const { user } = useAuth();
  const { canAccessTeamManagement, canManageUserRoles, userRole } = useRBAC();
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    console.log("Current user:", user);
    console.log("User role:", userRole);
    console.log("Can access team management:", canAccessTeamManagement);
  }, [user, userRole, canAccessTeamManagement]);

  // Redirect staff users who shouldn't be here
  if (!canAccessTeamManagement) {
    return (
      <div className="container mx-auto px-4">
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access team management. This feature is restricted to administrators only.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
        
        // Force refetch users after creating a new user
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.refetchQueries({ queryKey: ["users"] });
        }, 500);
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
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-600">
            Manage team members and their roles 
            <span className="inline-flex items-center ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              Admin Only
            </span>
          </p>
        </div>
        {canManageUserRoles && (
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
            Manage your team members and their system access roles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TeamList />
        </CardContent>
      </Card>

      {canManageUserRoles && (
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
