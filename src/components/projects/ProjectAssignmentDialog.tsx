
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, UserPlus, Search, Users, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchProjectAssignments, removeUserFromProject, bulkAssignUsersToProject } from "@/lib/timesheet-service";
import { useQuery as useUserQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateDisplay } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  full_name?: string;
  email?: string;
}

interface ProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const ProjectAssignmentDialog: React.FC<ProjectAssignmentDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectName,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch current project assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["project-assignments", projectId],
    queryFn: () => fetchProjectAssignments(projectId),
    enabled: open && !!projectId,
  });

  // Fetch all users for assignment
  const { data: allUsers = [], isLoading: usersLoading } = useUserQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      
      if (error) throw error;
      return data as User[];
    },
    enabled: open,
  });

  // Filter available users (not already assigned)
  const assignedUserIds = assignments.map(a => a.user_id);
  const availableUsers = allUsers.filter(user => !assignedUserIds.includes(user.id));

  // Filter assignments by search
  const filteredAssignments = assignments.filter(assignment => {
    const userName = assignment.user?.full_name || assignment.user?.email || "";
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => 
      removeUserFromProject(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments", projectId] });
      toast({
        title: "User removed",
        description: "User has been removed from the project",
      });
    },
    onError: (error) => {
      console.error("Failed to remove user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from project",
        variant: "destructive",
      });
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: ({ userIds }: { userIds: string[] }) => 
      bulkAssignUsersToProject(projectId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments", projectId] });
      setSelectedUserId("");
      toast({
        title: "User assigned",
        description: "User has been assigned to the project",
      });
    },
    onError: (error) => {
      console.error("Failed to assign user:", error);
      toast({
        title: "Error",
        description: "Failed to assign user to project",
        variant: "destructive",
      });
    },
  });

  const handleRemoveUser = (userId: string) => {
    removeUserMutation.mutate({ userId });
  };

  const handleAddUser = () => {
    if (selectedUserId) {
      addUserMutation.mutate({ userIds: [selectedUserId] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Assignments - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new assignment section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Assign New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={usersLoading || availableUsers.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue 
                      placeholder={
                        usersLoading 
                          ? "Loading users..." 
                          : availableUsers.length === 0 
                            ? "All users are already assigned" 
                            : "Select a user to assign"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddUser}
                  disabled={!selectedUserId || addUserMutation.isPending}
                >
                  {addUserMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current assignments section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Assignments ({assignments.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assigned users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="text-center py-4">Loading assignments...</div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {assignments.length === 0 ? "No users assigned to this project" : "No users match your search"}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {assignment.user?.full_name || assignment.user?.email || "Unknown User"}
                        </div>
                        {assignment.user?.email && assignment.user?.full_name && (
                          <div className="text-sm text-muted-foreground">
                            {assignment.user.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Assigned {formatDateDisplay(new Date(assignment.assigned_at))}
                          </Badge>
                          {assignment.assigned_by && (
                            <Badge variant="secondary" className="text-xs">
                              by {assignment.assigned_by === assignment.user_id ? "Self" : "Admin"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(assignment.user_id)}
                        disabled={removeUserMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
