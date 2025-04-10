
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project, fetchUserProjects } from "@/lib/timesheet-service";
import { useAuth } from "@/context/AuthContext";
import AddEditProjectDialog from "@/components/projects/AddEditProjectDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import ProjectList from "@/components/projects/ProjectList";

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

  // Calculate project statistics
  const calculateProjectStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.is_active).length;
    
    const totalBudgetHours = projects.reduce((sum, project) => sum + project.budget_hours, 0);
    const totalHoursUsed = projects.reduce((sum, project) => sum + (project.hours_used || 0), 0);
    
    const overBudgetProjects = projects.filter(p => (p.hours_used || 0) > p.budget_hours).length;
    
    return {
      totalProjects,
      activeProjects,
      totalBudgetHours,
      totalHoursUsed,
      overBudgetProjects
    };
  };

  const stats = calculateProjectStats();

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

      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalHoursUsed.toFixed(1)} / {stats.totalBudgetHours} hrs
              </div>
              <p className="text-sm text-muted-foreground">
                Total hours across all projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeProjects} / {stats.totalProjects}
              </div>
              <p className="text-sm text-muted-foreground">
                Projects currently active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-500">Over Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.overBudgetProjects}
              </div>
              <p className="text-sm text-muted-foreground">
                Projects exceeding budget
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
