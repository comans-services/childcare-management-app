
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project, fetchUserProjects } from "@/lib/timesheet-service";
import { useAuth } from "@/context/AuthContext";
import AddEditProjectDialog from "@/components/projects/AddEditProjectDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import ProjectList from "@/components/projects/ProjectList";
import { supabase } from "@/integrations/supabase/client";

const ProjectsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchUserProjects,
    enabled: !!user
  });

  // Handle project edit
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsAddProjectOpen(true);
  };
  
  // Handle project deletion click
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteProjectOpen(true);
  };

  // Close the add/edit project dialog and reset state
  const closeAddEditDialog = () => {
    setIsAddProjectOpen(false);
    setEditingProject(null);
  };

  // Close the delete project dialog and reset state
  const closeDeleteDialog = () => {
    setIsDeleteProjectOpen(false);
    setProjectToDelete(null);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-600">Manage and monitor project budgets</p>
        </div>
        
        <Button 
          onClick={() => setIsAddProjectOpen(true)} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Manage your team's projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Clock className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : projects.length > 0 ? (
            <ProjectList 
              projects={projects} 
              onEdit={handleEditProject} 
              onDelete={handleDeleteClick} 
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No projects found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddProjectOpen(true)}
              >
                Add Your First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Project add/edit dialog */}
      <AddEditProjectDialog 
        isOpen={isAddProjectOpen} 
        onClose={closeAddEditDialog} 
        existingProject={editingProject}
      />
      
      {/* Project delete confirmation dialog */}
      {projectToDelete && (
        <DeleteProjectDialog 
          isOpen={isDeleteProjectOpen}
          onClose={closeDeleteDialog}
          project={projectToDelete}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
