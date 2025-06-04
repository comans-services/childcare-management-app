
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Project } from "@/lib/timesheet/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchProjectAssignments } from "@/lib/project/assignment-service";
import ProjectCard from "./ProjectCard";
import ProjectAssignmentDialog from "./ProjectAssignmentDialog";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onEdit, 
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showOverBudget, setShowOverBudget] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["project-assignments"],
    queryFn: () => fetchProjectAssignments()
  });

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {} as Record<string, any>);
  }, [customers]);

  const assignmentsMap = useMemo(() => {
    return allAssignments.reduce((acc, assignment) => {
      if (!acc[assignment.project_id]) {
        acc[assignment.project_id] = [];
      }
      if (assignment.user) {
        acc[assignment.project_id].push(assignment.user);
      }
      return acc;
    }, {} as Record<string, Array<{ id: string; full_name?: string; email?: string }>>);
  }, [allAssignments]);

  const isOverBudget = (used: number = 0, budget: number): boolean => {
    return used > budget;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !project.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (!showInactive && !project.is_active) {
        return false;
      }
      
      if (showOverBudget && !isOverBudget(project.hours_used, project.budget_hours)) {
        return false;
      }
      
      return true;
    });
  }, [projects, searchTerm, showInactive, showOverBudget]);

  const handleManageAssignments = (project: Project) => {
    setSelectedProject(project);
    setIsAssignmentDialogOpen(true);
  };

  const handleCloseAssignmentDialog = () => {
    setIsAssignmentDialogOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={showInactive}
              onCheckedChange={setShowInactive}
            >
              Show Inactive Projects
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showOverBudget}
              onCheckedChange={setShowOverBudget}
            >
              Only Over Budget Projects
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={handleManageAssignments}
              assignedUsers={assignmentsMap[project.id] || []}
              customer={project.customer_id ? customerMap[project.customer_id] : undefined}
            />
          ))}
        </div>
      )}

      <ProjectAssignmentDialog
        isOpen={isAssignmentDialogOpen}
        onClose={handleCloseAssignmentDialog}
        project={selectedProject}
      />
    </div>
  );
};

export default ProjectList;
