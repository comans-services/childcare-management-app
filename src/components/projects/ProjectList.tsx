import React, { useState, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Building,
  BarChart3,
  Power,
  PowerOff,
  Home
} from "lucide-react";
import { Project } from "@/lib/timesheet/types";
import { formatDate } from "@/lib/date-utils";
import ProjectAssignmentDialog from "./ProjectAssignmentDialog";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleStatus: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onEdit, 
  onDelete,
  onToggleStatus
}) => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const lastRightClickTime = useRef<number>(0);
  const lastRightClickedProject = useRef<string | null>(null);

  const handleManageAssignments = (project: Project) => {
    setSelectedProject(project);
    setAssignmentDialogOpen(true);
  };

  const handleDoubleRightClick = (project: Project, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent context menu
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastRightClickTime.current;
    
    // Check if this is a double right-click (within 500ms and same project)
    if (timeDiff < 500 && lastRightClickedProject.current === project.id) {
      onEdit(project);
      lastRightClickTime.current = 0; // Reset to prevent triple clicks
      lastRightClickedProject.current = null;
    } else {
      lastRightClickTime.current = currentTime;
      lastRightClickedProject.current = project.id;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle className="h-4 w-4" />
      : <Clock className="h-4 w-4" />;
  };

  const isOverBudget = (used: number = 0, budget: number): boolean => {
    return used > budget;
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No projects found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onContextMenu={(e) => handleDoubleRightClick(project, e)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(project.is_active)} flex items-center gap-1`}
                  >
                    {getStatusIcon(project.is_active)}
                    {project.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {project.is_internal && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1"
                    >
                      <Home className="h-3 w-3" />
                      Internal
                    </Badge>
                  )}
                </div>
              </div>
              {project.description && (
                <CardDescription className="text-sm">{project.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>
                  {project.hours_used || 0}h / {project.budget_hours}h
                  {isOverBudget(project.hours_used, project.budget_hours) && (
                    <AlertTriangle className="h-4 w-4 ml-1 text-orange-500 inline" />
                  )}
                </span>
              </div>

              {(project.start_date || project.end_date) && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {project.start_date && formatDate(new Date(project.start_date))}
                    {project.start_date && project.end_date && ' - '}
                    {project.end_date && formatDate(new Date(project.end_date))}
                  </span>
                </div>
              )}

              {project.customer_id && !project.is_internal && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span>Customer ID: {project.customer_id}</span>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-3 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(project)}
                className={`flex items-center gap-1 ${
                  project.is_active 
                    ? 'text-orange-600 hover:text-orange-700' 
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                {project.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleManageAssignments(project)}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(project)}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(project)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ProjectAssignmentDialog
        project={selectedProject}
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
      />
    </>
  );
};

export default ProjectList;
