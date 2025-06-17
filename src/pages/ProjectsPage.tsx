
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, BarChart3, Users, Search, Filter, RefreshCw, Building, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/timesheet/types";
import { fetchProjects, updateProjectStatus } from "@/lib/timesheet/project-service";
import ProjectList from "@/components/projects/ProjectList";
import AddEditProjectDialog from "@/components/projects/AddEditProjectDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import { Input } from "@/components/ui/input";
import ImportButton from "@/components/common/ImportButton";
import { isAdmin } from "@/utils/roles";

const ProjectsPage = () => {
  const { user } = useAuth();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showInternalOnly, setShowInternalOnly] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  // Check if user is admin for edit permissions
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        setHasCheckedAdmin(true);
        return;
      }

      try {
        const adminStatus = await isAdmin(user);
        setIsAdminUser(adminStatus);
        setHasCheckedAdmin(true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdminUser(false);
        setHasCheckedAdmin(true);
      }
    };

    checkAdminStatus();
  }, [user]);

  const { 
    data: projects = [], 
    isLoading, 
    refetch,
    error
  } = useQuery({
    queryKey: ["projects", searchTerm, showActiveOnly, showInternalOnly],
    queryFn: () => fetchProjects({ 
      searchTerm: searchTerm.trim() || undefined,
      activeOnly: showActiveOnly,
      internalOnly: showInternalOnly 
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
    if (!isAdminUser) {
      toast({
        title: "Access denied",
        description: "Only administrators can edit projects.",
        variant: "destructive",
      });
      return;
    }
    setEditingProject(project);
    setIsAddProjectOpen(true);
  };
  
  const handleDeleteClick = (project: Project) => {
    if (!isAdminUser) {
      toast({
        title: "Access denied",
        description: "Only administrators can delete projects.",
        variant: "destructive",
      });
      return;
    }
    setProjectToDelete(project);
    setIsDeleteProjectOpen(true);
  };

  const handleToggleStatus = async (project: Project) => {
    if (!isAdminUser) {
      toast({
        title: "Access denied",
        description: "Only administrators can modify project status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newStatus = !project.is_active;
      await updateProjectStatus(project.id, newStatus);
      
      toast({
        title: "Project Status Updated",
        description: `Project "${project.name}" has been ${newStatus ? 'activated' : 'deactivated'}.`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      });
    }
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
    const internalProjects = projects.filter(p => p.is_internal).length;
    const clientProjects = projects.filter(p => !p.is_internal).length;
    const totalBudgetHours = projects.reduce((sum, p) => sum + (p.budget_hours || 0), 0);
    const avgBudgetHours = totalProjects > 0 ? totalBudgetHours / totalProjects : 0;
    
    return {
      totalProjects,
      activeProjects,
      internalProjects,
      clientProjects,
      totalBudgetHours,
      avgBudgetHours: Math.round(avgBudgetHours)
    };
  };

  const stats = calculateProjectStats();

  return (
    <div className="container-responsive max-w-none">
      {/* Header with better responsive layout */}
      <div className="mb-fluid-md">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-fluid-sm">
          <div className="min-w-0 flex-1">
            <h1 className="text-fluid-2xl font-bold truncate">Projects</h1>
            <p className="text-fluid-sm text-gray-600 mt-1">
              {isAdminUser ? "Manage and monitor project budgets" : "View project information and budgets"}
            </p>
            {!isAdminUser && hasCheckedAdmin && (
              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                <Eye className="h-4 w-4" />
                <span>View-only mode: You can view projects but cannot edit them</span>
              </div>
            )}
          </div>
          
          {/* Action buttons with smart responsive behavior - only show for admins */}
          {isAdminUser && (
            <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:gap-3">
              <ImportButton
                entityType="projects"
                onImportComplete={refetch}
                variant="outline"
                className="flex-shrink-0"
              />
              
              <Button 
                onClick={() => refetch()}
                variant="outline"
                title="Refresh projects"
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              
              <Button 
                onClick={() => setIsAddProjectOpen(true)} 
                className="flex items-center gap-2 flex-shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Project</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          )}
          
          {/* Non-admin users get refresh button only */}
          {!isAdminUser && (
            <Button 
              onClick={() => refetch()}
              variant="outline"
              title="Refresh projects"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced search and filter controls with responsive stacking */}
      <div className="mb-fluid-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          {/* Search input takes full width on mobile, flex-1 on desktop */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Filter buttons stack on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-row lg:gap-3 flex-shrink-0">
            <Button 
              variant={showActiveOnly ? "default" : "outline"} 
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className="flex items-center gap-2 justify-center"
            >
              <Filter className="h-4 w-4" />
              <span className="whitespace-nowrap">{showActiveOnly ? "Active Only" : "All Status"}</span>
            </Button>

            <Button 
              variant={showInternalOnly ? "default" : "outline"} 
              onClick={() => setShowInternalOnly(!showInternalOnly)}
              className="flex items-center gap-2 justify-center"
            >
              <Building className="h-4 w-4" />
              <span className="whitespace-nowrap">{showInternalOnly ? "Internal Only" : "All Types"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced stats grid with ultra-responsive behavior */}
      {!isLoading && projects.length > 0 && (
        <div className="mb-fluid-md">
          <div className="
            grid gap-fluid-sm
            grid-cols-1 
            xs:grid-cols-2 
            md:grid-cols-2 
            lg:grid-cols-4 
            xl:grid-cols-4 
            2xl:grid-cols-4
            3xl:grid-cols-6 
            4xl:grid-cols-6
            container-query
          ">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="truncate">Total Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-blue-600">{stats.totalProjects}</div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-600" />
                  <span className="truncate">Internal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-purple-600">{stats.internalProjects}</div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Company projects
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="truncate">Client</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-green-600">{stats.clientProjects}</div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Customer projects
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="truncate">Total Budget</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-orange-600">{stats.totalBudgetHours}h</div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Across all projects
                </p>
              </CardContent>
            </Card>

            {/* Additional stats for ultra-wide screens */}
            <Card className="hover:shadow-md transition-shadow hidden 3xl:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span className="truncate">Avg Budget</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-indigo-600">{stats.avgBudgetHours}h</div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Per project
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow hidden 3xl:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-fluid-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pink-600" />
                  <span className="truncate">Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-fluid-xl font-bold text-pink-600">
                  {Math.round((stats.activeProjects / stats.totalProjects) * 100)}%
                </div>
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Active rate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Project list card with enhanced responsive content */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-fluid-lg">All Projects</CardTitle>
            <CardDescription className="text-fluid-sm">
              {isAdminUser ? "Manage your project budgets and timelines" : "View project budgets and timelines"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {projects.length > 0 && (
              <span className="text-fluid-xs text-muted-foreground whitespace-nowrap">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-fluid-sm lg:p-fluid-md">
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Clock className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : projects.length > 0 ? (
            <ProjectList 
              projects={projects} 
              onEdit={handleEditProject} 
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
              readOnly={!isAdminUser}
            />
          ) : (
            <div className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No projects found</p>
              {isAdminUser && (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Only show dialogs for admins */}
      {isAdminUser && (
        <>
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
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
