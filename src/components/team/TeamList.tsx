import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers, User, deleteUser, updateUser, deactivateUser, reactivateUser } from "@/lib/user-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Edit,
  Trash2,
  Clock,
  Mail,
  Building2,
  CreditCard,
  User as UserIcon,
  Globe,
  UserX,
  UserCheck,
  EyeOff,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import AddEditUserDialog from "./AddEditUserDialog";
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

const TeamList: React.FC = () => {
  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

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
      refetch();
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  }, [userToDelete, refetch]);

  const handleDeactivateUser = useCallback(async () => {
    if (!userToDeactivate) return;
    setIsDeactivating(true);
    try {
      await deactivateUser(userToDeactivate.id);
      toast({ title: "User deactivated", description: `${userToDeactivate.full_name || userToDeactivate.email} has been deactivated.` });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to deactivate user.", variant: "destructive" });
    } finally {
      setIsDeactivating(false);
      setUserToDeactivate(null);
    }
  }, [userToDeactivate, refetch]);

  const handleReactivateUser = useCallback(async (user: User) => {
    try {
      await reactivateUser(user.id, user.email || "");
      toast({ title: "User reactivated", description: `${user.full_name || user.email} has been reactivated. A password reset email has been sent.` });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reactivate user.", variant: "destructive" });
    }
  }, [refetch]);

  const handleManageTimesheet = useCallback((userId: string) => {
    navigate(`/timesheet?userId=${userId}`);
  }, [navigate]);

  const handleUserSaved = useCallback(async (userData: User) => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await updateUser(userData);
      toast({
        title: "User updated",
        description: `${userData.full_name || userData.email} has been updated successfully.`,
      });
      refetch();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Error updating user",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [editingUser, refetch]);

  const getInitials = (user: User) => {
    if (user.full_name) {
      return user.full_name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      default: return "secondary";
    }
  };

  if (isLoading) return <div className="p-4">Loading team members...</div>;

  const activeUsers = users.filter((u) => u.is_active !== false);
  const inactiveUsers = users.filter((u) => u.is_active === false);
  const visibleUsers = showInactive ? users : activeUsers;

  return (
    <>
      {/* Show/Hide Inactive Banner */}
      {inactiveUsers.length > 0 && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg mb-4 border ${showInactive ? "bg-amber-50 border-amber-300" : "bg-gray-100 border-gray-300"}`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {showInactive ? (
              <EyeOff className="h-4 w-4 text-amber-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
            <span className={showInactive ? "text-amber-700" : "text-gray-600"}>
              {showInactive
                ? `Showing ${inactiveUsers.length} inactive member${inactiveUsers.length > 1 ? "s" : ""}`
                : `${inactiveUsers.length} inactive member${inactiveUsers.length > 1 ? "s" : ""} hidden`}
            </span>
          </div>
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive((v) => !v)}
            className={showInactive ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            {showInactive ? "Hide Inactive" : "Show Inactive"}
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleUsers.map((user) => (
          <Card key={user.id} className={`hover:shadow-lg transition-shadow duration-200 ${user.is_active === false ? "opacity-60 border-dashed border-amber-300 bg-amber-50/30" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`font-semibold ${user.is_active === false ? "bg-gray-200 text-gray-500" : "bg-primary/10 text-primary"}`}>
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {user.full_name || "Unnamed User"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={getRoleBadgeVariant(user.role || "employee")}>
                      {(user.role || "employee").charAt(0).toUpperCase() + (user.role || "employee").slice(1)}
                    </Badge>
                    {user.employment_type && (
                      <Badge variant="outline" className="text-xs">
                        {user.employment_type.replace("-", " ")}
                      </Badge>
                    )}
                    {user.is_active === false && (
                      <Badge className="text-xs bg-amber-200 text-amber-800 border-amber-400">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {user.organization && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{user.organization}</span>
                </div>
              )}
              {user.employee_id && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>ID: {user.employee_id}</span>
                </div>
              )}
              {user.employee_card_id && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Card: {user.employee_card_id}</span>
                </div>
              )}
              {user.time_zone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{user.time_zone}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2 flex-wrap">
                {user.is_active !== false ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleManageTimesheet(user.id)} className="flex-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Timesheet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserToDeactivate(user)}
                      className="hover:bg-amber-100 hover:text-amber-700 hover:border-amber-400"
                      title="Deactivate user"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserToDelete(user)}
                      className="hover:bg-red-100 hover:text-red-700 hover:border-red-400"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleReactivateUser(user)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Reactivate &amp; Send Password Email
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <AddEditUserDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingUser(null); }}
        onSave={handleUserSaved}
        user={editingUser}
        isNewUser={false}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {userToDeactivate?.full_name || userToDeactivate?.email}?
              They will no longer be able to log in, but their data will be preserved. You can reactivate them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateUser} disabled={isDeactivating} className="bg-amber-600 text-white hover:bg-amber-700">
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {userToDelete?.full_name || userToDelete?.email}?
              This cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamList;
