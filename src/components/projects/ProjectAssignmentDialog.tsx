
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
import { fetchProjectAssignments, bulkAssignUsersToProject } from "@/lib/timesheet/assignment-service";
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
    mutationFn: ({ projectId, userIds }: { projectId: string; userIds: string[] }) =>
      bulkAssignUsersToProject(projectId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Users assigned",
        description: "Users have been successfully assigned to the project.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Failed to assign users:", error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign users to the project. Please try again.",
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    if (isOpen && assignments.length > 0) {
      const currentUserIds = assignments.map(assignment => assignment.user_id);
      setSelectedUserIds(currentUserIds);
    }
  }, [isOpen, assignments]);

  const handleAssign = () => {
    if (!project) return;

    const currentUserIds = assignments.map(assignment => assignment.user_id);
    const newUserIds = selectedUserIds.filter(id => !currentUserIds.includes(id));

    if (newUserIds.length === 0) {
      toast({
        title: "No new assignments",
        description: "No new users selected for assignment.",
      });
      return;
    }

    assignMutation.mutate({
      projectId: project.id,
      userIds: newUserIds,
    });
  };

  const handleClose = () => {
    setSelectedUserIds([]);
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
            disabled={assignMutation.isPending || selectedUserIds.length === 0}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssignmentDialog;
