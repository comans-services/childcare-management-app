
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { ProjectWithAssignees, fetchProjectAssignments, bulkAssignUsersToProject, removeUserFromProject } from "@/lib/timesheet-service";
import ProjectAssigneeSelector from "./ProjectAssigneeSelector";

interface ProjectAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectWithAssignees | null;
}

const ProjectAssignmentDialog: React.FC<ProjectAssignmentDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch current assignments for the project
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["project-assignments", project?.id],
    queryFn: () => project ? fetchProjectAssignments(project.id) : Promise.resolve([]),
    enabled: !!project?.id && isOpen,
  });

  // Extract currently assigned user IDs
  const currentlyAssignedUserIds = assignments.map(assignment => assignment.user_id);

  useEffect(() => {
    if (isOpen && assignments.length > 0) {
      setSelectedUserIds(currentlyAssignedUserIds);
    } else if (isOpen) {
      setSelectedUserIds([]);
    }
  }, [isOpen, assignments]);

  const assignmentMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!project) throw new Error("No project selected");

      // Find users to add and remove
      const usersToAdd = userIds.filter(id => !currentlyAssignedUserIds.includes(id));
      const usersToRemove = currentlyAssignedUserIds.filter(id => !userIds.includes(id));

      // Add new users
      if (usersToAdd.length > 0) {
        await bulkAssignUsersToProject(project.id, usersToAdd);
      }

      // Remove users
      for (const userId of usersToRemove) {
        await removeUserFromProject(project.id, userId);
      }

      return userIds;
    },
    onSuccess: (userIds) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      toast({
        title: "Project assignments updated",
        description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} assigned to project`,
      });
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update project assignments:", error);
      toast({
        title: "Assignment failed",
        description: "Could not update project assignments",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    assignmentMutation.mutate(selectedUserIds);
  };

  const handleCancel = () => {
    setSelectedUserIds(currentlyAssignedUserIds);
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Manage Project Assignments</DialogTitle>
              <DialogDescription className="mt-1">
                Assign users to "{project.name}" project. Only assigned users can log time to this project.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">
              {currentlyAssignedUserIds.length} user{currentlyAssignedUserIds.length !== 1 ? 's' : ''} assigned
            </div>
            
            <ProjectAssigneeSelector
              selectedUserIds={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
              disabled={isLoading || assignmentMutation.isPending}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={assignmentMutation.isPending}
            >
              {assignmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
