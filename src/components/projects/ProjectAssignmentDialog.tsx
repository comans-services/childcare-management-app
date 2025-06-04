
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

  // Initialize selected users when assignments load
  React.useEffect(() => {
    if (assignments.length > 0) {
      const userIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
      setSelectedUserIds(userIds);
    } else {
      setSelectedUserIds([]);
    }
  }, [assignments]);

  const assignUsersMutation = useMutation({
    mutationFn: async () => {
      if (!project) return;

      const currentUserIds = assignments.map((a: ProjectAssignment) => a.user_id);
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      // Add new users
      if (usersToAdd.length > 0) {
        await bulkAssignUsersToProject(project.id, usersToAdd);
      }

      // Remove users
      for (const userId of usersToRemove) {
        await removeUserFromProject(project.id, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project assignments updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update project assignments:", error);
      toast({
        title: "Error",
        description: "Failed to update project assignments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    assignUsersMutation.mutate();
  };

  const handleCancel = () => {
    // Reset to original assignments
    const originalUserIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
    setSelectedUserIds(originalUserIds);
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Project Assignments</DialogTitle>
          <DialogDescription>
            Assign users to <strong>{project.name}</strong>. Only assigned users can log time to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProjectAssigneeSelector
            selectedUserIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
            disabled={isLoading || assignUsersMutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={assignUsersMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={assignUsersMutation.isPending}
          >
            {assignUsersMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
