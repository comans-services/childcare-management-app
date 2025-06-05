
import React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { deleteInternalProject, InternalProject } from "@/lib/internal-project-service";

interface DeleteInternalProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: InternalProject | null;
  onSuccess: () => void;
}

const DeleteInternalProjectDialog: React.FC<DeleteInternalProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      await deleteInternalProject(project.id);
      toast({
        title: "Success",
        description: "Internal project deleted successfully",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete internal project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Internal Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{project?.name}"? This action cannot be undone and will also remove all user assignments for this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteInternalProjectDialog;
