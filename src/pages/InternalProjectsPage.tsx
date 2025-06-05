
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchInternalProjects, fetchInternalProjectStats, InternalProject } from "@/lib/internal-project-service";
import InternalProjectList from "@/components/internal-projects/InternalProjectList";
import AddEditInternalProjectDialog from "@/components/internal-projects/AddEditInternalProjectDialog";
import DeleteInternalProjectDialog from "@/components/internal-projects/DeleteInternalProjectDialog";
import InternalProjectAssignmentDialog from "@/components/internal-projects/InternalProjectAssignmentDialog";
import ImportButton from "@/components/common/ImportButton";

const InternalProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedProject, setSelectedProject] = useState<InternalProject | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['internal-projects'],
    queryFn: fetchInternalProjects,
  });

  const { data: stats } = useQuery({
    queryKey: ['internal-project-stats'],
    queryFn: fetchInternalProjectStats,
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showActiveOnly ? project.is_active : true;
    return matchesSearch && matchesActiveFilter;
  });

  const handleEdit = (project: InternalProject) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (project: InternalProject) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleAssignUsers = (project: InternalProject) => {
    setSelectedProject(project);
    setIsAssignmentDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedProject(null);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setIsAssignmentDialogOpen(false);
    refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Internal Projects</h1>
          <p className="text-muted-foreground">Manage internal company projects and assignments</p>
        </div>
        <div className="flex gap-2">
          <ImportButton entityType="internal-projects" onImportComplete={refetch} />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Internal Project
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Internal Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.assignedUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search internal projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search internal projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
              <Label htmlFor="active-only">Active projects only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <InternalProjectList
        projects={filteredProjects}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignUsers={handleAssignUsers}
        onRefetch={refetch}
      />

      {/* Dialogs */}
      <AddEditInternalProjectDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleDialogClose}
      />

      <AddEditInternalProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={selectedProject}
        onSuccess={handleDialogClose}
      />

      <DeleteInternalProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        project={selectedProject}
        onSuccess={handleDialogClose}
      />

      <InternalProjectAssignmentDialog
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
        project={selectedProject}
        onSuccess={handleDialogClose}
      />
    </div>
  );
};

export default InternalProjectsPage;
