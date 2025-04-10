
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamList from "@/components/team/TeamList";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddEditUserDialog from "@/components/team/AddEditUserDialog";
import { createUser } from "@/lib/user-service";
import { toast } from "@/components/ui/use-toast";

const TeamPage = () => {
  const { userRole } = useAuth();
  const isAdminOrManager = userRole === "admin" || userRole === "manager";
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleAddUser = () => {
    console.log("Opening add user dialog");
    setIsAddUserOpen(true);
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
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
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
          onSave={(userData) => {
            console.log("Creating user:", userData);
            createUser(userData)
              .then(() => {
                toast({
                  title: "User created",
                  description: "New team member has been added successfully",
                });
                setIsAddUserOpen(false);
              })
              .catch((error) => {
                toast({
                  title: "Error creating user",
                  description: error.message,
                  variant: "destructive",
                });
              });
          }}
          isNewUser={true}
        />
      )}
    </div>
  );
};

export default TeamPage;
