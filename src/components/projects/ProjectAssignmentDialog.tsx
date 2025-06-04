
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/lib/timesheet/types";
import { 
  fetchProjectAssignments, 
  bulkAssignUsersToProject,
  removeUserFromProject 
} from "@/lib/timesheet/assignment-service";
import { ProjectAssignment } from "@/lib/timesheet/assignment-types";
import ProjectAssigneeSelector from "./ProjectAssigneeSelector";

interface ProjectAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectAssignmentDialog: React.FC<ProjectAssignmentDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["project-assignments", project?.id],
    queryFn: () => project ? fetchProjectAssignments(project.id) : Promise.resolve([]),
    enabled: !!project && isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!project) return;

      const currentUserIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      // Add new users
      if (usersToAdd.length > 0) {
        await bulkAssignUsersToProject(project.id, usersToAdd);
      }

      // Remove users that are no longer selected
      for (const userId of usersToRemove) {
        await removeUserFromProject(project.id, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Users assigned",
        description: "Project assignments have been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Failed to update project assignments:", error);
      
      // Handle specific database errors
      let errorMessage = "Failed to update project assignments. Please try again.";
      if (error?.message?.includes("duplicate key")) {
        errorMessage = "One or more users are already assigned to this project.";
      } else if (error?.message?.includes("foreign key")) {
        errorMessage = "Invalid user or project reference. Please refresh and try again.";
      }
      
      toast({
        title: "Assignment failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    if (isOpen && assignments.length > 0) {
      const currentUserIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
      setSelectedUserIds(currentUserIds);
    } else if (isOpen && assignments.length === 0) {
      setSelectedUserIds([]);
    }
  }, [isOpen, assignments]);

  const handleAssign = () => {
    assignMutation.mutate();
  };

  const handleClose = () => {
    // Reset to original assignments
    if (assignments.length > 0) {
      const originalUserIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
      setSelectedUserIds(originalUserIds);
    } else {
      setSelectedUserIds([]);
    }
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Users to Project</DialogTitle>
          <DialogDescription>
            Select users to assign to <strong>{project.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProjectAssigneeSelector
            selectedUserIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
            disabled={isLoading || assignMutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
