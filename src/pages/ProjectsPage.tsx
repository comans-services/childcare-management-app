
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, BarChart3, Users, Search, Filter, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/timesheet/types";
import { fetchProjects } from "@/lib/timesheet/project-service";
import ProjectList from "@/components/projects/ProjectList";
import AddEditProjectDialog from "@/components/projects/AddEditProjectDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import { Input } from "@/components/ui/input";
import ImportButton from "@/components/common/ImportButton";

const ProjectsPage = () => {
  const { user } = useAuth();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const { 
    data: projects = [], 
    isLoading, 
    refetch,
    error
  } = useQuery({
    queryKey: ["projects", searchTerm, showActiveOnly],
    queryFn: () => fetchProjects({ 
      searchTerm: searchTerm.trim() || undefined,
      activeOnly: showActiveOnly 
    }),
    enabled: !!user
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error fetching projects",
        description: "There was an issue loading your projects. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsAddProjectOpen(true);
  };
  
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteProjectOpen(true);
  };

  const closeAddEditDialog = () => {
    setIsAddProjectOpen(false);
    setEditingProject(null);
    refetch();
  };

  const closeDeleteDialog = () => {
    setIsDeleteProjectOpen(false);
    setProjectToDelete(null);
    refetch();
  };

  const calculateProjectStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.is_active).length;
    const totalBudgetHours = projects.reduce((sum, p) => sum + (p.budget_hours || 0), 0);
    const avgBudgetHours = totalProjects > 0 ? totalBudgetHours / totalProjects : 0;
    
    return {
      totalProjects,
      activeProjects,
      totalBudgetHours,
      avgBudgetHours: Math.round(avgBudgetHours)
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
        
        <div className="flex gap-2">
          <ImportButton
            entityType="projects"
            onImportComplete={refetch}
            variant="outline"
          />
          
          <Button 
            onClick={() => refetch()}
            variant="outline"
            title="Refresh projects"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => setIsAddProjectOpen(true)} 
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button 
          variant={showActiveOnly ? "default" : "outline"} 
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showActiveOnly ? "Active Only" : "All Projects"}
        </Button>
      </div>

      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-sm text-muted-foreground">
                {stats.activeProjects} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeProjects}</div>
              <p className="text-sm text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBudgetHours}h</div>
              <p className="text-sm text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Avg Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgBudgetHours}h</div>
              <p className="text-sm text-muted-foreground">
                Per project
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Manage your project budgets and timelines</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {projects.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
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
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No projects found</p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddProjectOpen(true)}
                >
                  Add Your First Project
                </Button>
                <div className="text-sm text-muted-foreground">
                  or <ImportButton entityType="projects" onImportComplete={refetch} variant="ghost" size="sm" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddEditProjectDialog 
        isOpen={isAddProjectOpen} 
        onClose={closeAddEditDialog} 
        existingProject={editingProject}
      />
      
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
