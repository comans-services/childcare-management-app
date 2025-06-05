
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Users, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InternalProject, updateInternalProject } from "@/lib/internal-project-service";
import { useToast } from "@/hooks/use-toast";

interface InternalProjectListProps {
  projects: InternalProject[];
  isLoading: boolean;
  onEdit: (project: InternalProject) => void;
  onDelete: (project: InternalProject) => void;
  onAssignUsers: (project: InternalProject) => void;
  onRefetch: () => void;
}

const InternalProjectList: React.FC<InternalProjectListProps> = ({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onAssignUsers,
  onRefetch,
}) => {
  const { toast } = useToast();

  const handleToggleStatus = async (project: InternalProject) => {
    try {
      await updateInternalProject(project.id, { is_active: !project.is_active });
      toast({
        title: "Success",
        description: `Internal project ${project.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      onRefetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update internal project status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">No internal projects found</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Create your first internal project to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAssignUsers(project)}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(project)}>
                    {project.is_active ? (
                      <ToggleLeft className="mr-2 h-4 w-4" />
                    ) : (
                      <ToggleRight className="mr-2 h-4 w-4" />
                    )}
                    {project.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(project)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={project.is_active ? "default" : "secondary"}>
                {project.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-3 border-t">
            <div className="flex justify-between items-center w-full">
              <div className="text-xs text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignUsers(project)}
              >
                <Users className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default InternalProjectList;
