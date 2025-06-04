
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
} from "@/lib/project/assignment-service";
import { ProjectAssignment } from "@/lib/project/assignment-types";
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

  // Initialize selected users when assignments load - FIX: Add dependency array to prevent infinite loop
  React.useEffect(() => {
    if (assignments.length > 0 && isOpen) {
      const userIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
      console.log("ProjectAssignmentDialog: Initializing selectedUserIds with:", userIds);
      setSelectedUserIds(userIds);
    } else if (assignments.length === 0 && isOpen) {
      console.log("ProjectAssignmentDialog: No assignments found, clearing selectedUserIds");
      setSelectedUserIds([]);
    }
  }, [assignments, isOpen]); // FIX: Added isOpen to dependencies to prevent infinite updates

  const handleSelectionChange = (newUserIds: string[]) => {
    console.log("ProjectAssignmentDialog: Selection changed from", selectedUserIds, "to", newUserIds);
    setSelectedUserIds(newUserIds);
  };

  const assignUsersMutation = useMutation({
    mutationFn: async () => {
      if (!project) return;

      console.log("ProjectAssignmentDialog: Starting assignment mutation for project", project.id);
      console.log("ProjectAssignmentDialog: Current assignments:", assignments.map(a => a.user_id));
      console.log("ProjectAssignmentDialog: Selected user IDs:", selectedUserIds);

      const currentUserIds = assignments.map((a: ProjectAssignment) => a.user_id);
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      console.log("ProjectAssignmentDialog: Users to add:", usersToAdd);
      console.log("ProjectAssignmentDialog: Users to remove:", usersToRemove);

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
      toast({
        title: "Success",
        description: "Project assignments updated successfully.",
      });
      
      console.log("ProjectAssignmentDialog: Assignment mutation successful, invalidating caches");
      
      // Invalidate the per-project cache so the dialog shows fresh data
      queryClient.invalidateQueries({ queryKey: ["project-assignments", project?.id] });
      
      // existing invalidations
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (error) => {
      console.error("ProjectAssignmentDialog: Failed to update project assignments:", error);
      toast({
        title: "Error",
        description: "Failed to update project assignments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    console.log("ProjectAssignmentDialog: Save button clicked");
    assignUsersMutation.mutate();
  };

  const handleCancel = () => {
    // Reset to original assignments
    const originalUserIds = assignments.map((assignment: ProjectAssignment) => assignment.user_id);
    console.log("ProjectAssignmentDialog: Cancel clicked, resetting to original assignments:", originalUserIds);
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
            onSelectionChange={handleSelectionChange}
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
