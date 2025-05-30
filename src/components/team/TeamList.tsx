
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, User, updateUser } from "@/lib/user-service";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import AddEditUserDialog from "./AddEditUserDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, RefreshCw } from "lucide-react";

const TeamList = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ["users", refreshTrigger],
    queryFn: fetchUsers,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User updated",
        description: "The user has been successfully updated.",
      });
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    console.log("Editing user:", user);
    setEditingUser(user);
  };

  const handleUserUpdate = (user: User) => {
    console.log("Updating user:", user);
    updateUserMutation.mutate(user);
  };

  const handleRefresh = () => {
    console.log("Refreshing team list...");
    setRefreshTrigger(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ["users"] });
    refetch();
  };

  const handleForceRefresh = async () => {
    console.log("Force refreshing team data...");
    setRefreshTrigger(prev => prev + 1);
    queryClient.removeQueries({ queryKey: ["users"] });
    await refetch();
    toast({
      title: "Refreshed",
      description: "Team member data has been refreshed",
    });
  };

  React.useEffect(() => {
    console.log("Current user email:", user?.email);
    console.log("Team members loaded:", users?.length);
    console.log("Team members data:", users);
  }, [user, users]);

  const isAdmin = userRole === "admin";

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading team members.</p>
        <p className="text-sm mt-2 text-red-400">{(error as Error).message}</p>
        <Button 
          onClick={handleRefresh} 
          className="mt-4"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Time Zone</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(null).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4 px-4">
        <Button 
          onClick={handleForceRefresh}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh List
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Employment</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Time Zone</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || "Not set"}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 font-mono">
                    {user.employee_id || "Not assigned"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role || "employee"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.employment_type === 'full-time' ? 'bg-blue-100 text-blue-800' : 
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {user.employment_type === 'full-time' ? 'Full-time' : 'Part-time'}
                  </span>
                </TableCell>
                <TableCell>{user.email || "No email available"}</TableCell>
                <TableCell>{user.organization || "N/A"}</TableCell>
                <TableCell>{user.time_zone || "N/A"}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8">
                No team members found. {!isAdmin && "Contact an administrator to add team members."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AddEditUserDialog
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUserUpdate}
        isNewUser={false}
      />
    </div>
  );
};

export default TeamList;
