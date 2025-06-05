
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InternalProject } from "@/lib/internal-project-service";
import {
  fetchInternalProjectAssignments,
  removeUserFromInternalProject,
} from "@/lib/internal-project/assignment-service";
import { fetchUsers } from "@/lib/user-service";
import InternalProjectAssigneeSelector from "./InternalProjectAssigneeSelector";

interface InternalProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: InternalProject | null;
  onSuccess: () => void;
}

const InternalProjectAssignmentDialog: React.FC<InternalProjectAssignmentDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAssigneeSelector, setShowAssigneeSelector] = React.useState(false);

  const { data: assignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ['internal-project-assignments', project?.id],
    queryFn: () => fetchInternalProjectAssignments(project!.id),
    enabled: !!project?.id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      removeUserFromInternalProject(projectId, userId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User removed from internal project successfully",
      });
      refetchAssignments();
      queryClient.invalidateQueries({ queryKey: ['internal-project-stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user from internal project",
        variant: "destructive",
      });
    },
  });

  const handleRemoveUser = (userId: string) => {
    if (!project) return;
    removeUserMutation.mutate({ projectId: project.id, userId });
  };

  const handleAssignmentComplete = () => {
    setShowAssigneeSelector(false);
    refetchAssignments();
    queryClient.invalidateQueries({ queryKey: ['internal-project-stats'] });
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Internal Project Assignments</DialogTitle>
          <DialogDescription>
            Assign or remove users from "{project.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              Assigned Users ({assignments.length})
            </h4>
            <Button
              onClick={() => setShowAssigneeSelector(true)}
              size="sm"
              className="gap-1"
            >
              <UserPlus className="h-4 w-4" />
              Assign Users
            </Button>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground text-center">
                  No users assigned to this internal project
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Click "Assign Users" to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {assignment.user_full_name || assignment.user_email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.user_email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      {assignment.assigned_by_name && ` by ${assignment.assigned_by_name}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(assignment.user_id)}
                    disabled={removeUserMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAssigneeSelector && (
          <InternalProjectAssigneeSelector
            projectId={project.id}
            assignedUserIds={assignments.map(a => a.user_id)}
            availableUsers={allUsers}
            onAssignmentComplete={handleAssignmentComplete}
            onCancel={() => setShowAssigneeSelector(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InternalProjectAssignmentDialog;
