
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchProjectAssignments, bulkAssignUsersToProject } from "@/lib/timesheet-service";
import ProjectAssigneeSelector from "./ProjectAssigneeSelector";

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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch current project assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["project-assignments", projectId],
    queryFn: () => fetchProjectAssignments(projectId),
    enabled: open && !!projectId,
  });

  // Initialize selected users when assignments load
  useEffect(() => {
    if (assignments.length > 0) {
      const assignedUserIds = assignments.map(a => a.user_id);
      setSelectedUserIds(assignedUserIds);
    }
  }, [assignments]);

  // Save assignment mutation
  const saveAssignmentMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const currentAssignedIds = assignments.map(a => a.user_id);
      const newUserIds = userIds.filter(id => !currentAssignedIds.includes(id));
      
      if (newUserIds.length > 0) {
        await bulkAssignUsersToProject(projectId, newUserIds);
      }
      
      // Handle removed users by calling the remove function for each
      const removedUserIds = currentAssignedIds.filter(id => !userIds.includes(id));
      if (removedUserIds.length > 0) {
        // Import the remove function
        const { removeUserFromProject } = await import("@/lib/timesheet-service");
        for (const userId of removedUserIds) {
          await removeUserFromProject(projectId, userId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments", projectId] });
      toast({
        title: "Assignments updated",
        description: "Project assignments have been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to update assignments:", error);
      toast({
        title: "Error",
        description: "Failed to update project assignments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveAssignmentMutation.mutate(selectedUserIds);
  };

  const handleCancel = () => {
    // Reset to original assignments
    if (assignments.length > 0) {
      const assignedUserIds = assignments.map(a => a.user_id);
      setSelectedUserIds(assignedUserIds);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Users to {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Users</label>
            <div className="mt-2">
              <ProjectAssigneeSelector
                selectedUserIds={selectedUserIds}
                onSelectionChange={setSelectedUserIds}
                disabled={assignmentsLoading || saveAssignmentMutation.isPending}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saveAssignmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveAssignmentMutation.isPending}
          >
            {saveAssignmentMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
