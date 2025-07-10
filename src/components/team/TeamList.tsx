import React, { useState, useCallback } from "react";
import { User } from "@/lib/user-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Pencil, 
  Trash2, 
  Mail, 
  Building, 
  Clock, 
  CreditCard, 
  IdCard,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddEditUserDialog from "./AddEditUserDialog";
import { deleteUser } from "@/lib/user-service";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamListProps {
  users: User[];
  onUserUpdated: () => void;
}

const TeamList: React.FC<TeamListProps> = ({ users, onUserUpdated }) => {
  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "User deleted",
        description: `${userToDelete.full_name || userToDelete.email} has been removed from the team.`,
      });
      onUserUpdated();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  }, [userToDelete, onUserUpdated]);

  const handleManageTimesheet = useCallback((userId: string) => {
    // Navigate to timesheet page with user selection
    navigate(`/timesheet?userId=${userId}`);
  }, [navigate]);

  const getInitials = (user: User) => {
    if (user.full_name) {
      return user.full_name
        .split(" ")
        .map(name => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const getEmploymentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "full-time":
        return "default";
      case "part-time":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {user.full_name || "No Name"}
                  </CardTitle>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant={getRoleBadgeVariant(user.role || "employee")}>
                      {(user.role || "employee").charAt(0).toUpperCase() + (user.role || "employee").slice(1)}
                    </Badge>
                    {user.employment_type && (
                      <Badge variant={getEmploymentTypeBadgeVariant(user.employment_type)}>
                        {user.employment_type === "full-time" ? "Full-time" : "Part-time"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact Information */}
              {user.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              
              {user.organization && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.organization}</span>
                </div>
              )}
              
              {user.time_zone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.time_zone}</span>
                </div>
              )}

              {/* Employee IDs */}
              {user.employee_id && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <IdCard className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">ID: {user.employee_id}</span>
                </div>
              )}
              
              {user.employee_card_id && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Card: {user.employee_card_id}</span>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageTimesheet(user.id)}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Timesheet
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserToDelete(user)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <AddEditUserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser}
        onUserSaved={() => {
          onUserUpdated();
          setEditingUser(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? 
              This action cannot be undone and will remove all associated data including timesheet entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamList;
