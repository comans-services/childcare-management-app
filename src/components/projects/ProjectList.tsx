
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
  Home,
  Eye
} from "lucide-react";
import { Project } from "@/lib/timesheet/types";
import { formatDate } from "@/lib/date-utils";
import ProjectAssignmentDialog from "./ProjectAssignmentDialog";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleStatus: (project: Project) => void;
  readOnly?: boolean;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onEdit, 
  onDelete,
  onToggleStatus,
  readOnly = false
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
    
    // Only allow editing if not read-only
    if (readOnly) return;
    
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
      {/* Enhanced dynamic grid with ultra-responsive behavior */}
      <div className="
        grid gap-fluid-sm
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        2xl:grid-cols-4
        3xl:grid-cols-5
        4xl:grid-cols-6
        container-query
        auto-fit-grid
      ">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="
              hover:shadow-lg transition-all duration-300 cursor-pointer 
              flex flex-col h-full
              min-w-0 max-w-full
              hover:-translate-y-1
              border-l-4 border-l-transparent hover:border-l-primary
            "
            onContextMenu={(e) => handleDoubleRightClick(project, e)}
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-fluid-lg font-semibold line-clamp-2 min-w-0 flex-1">
                  {project.name}
                </CardTitle>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(project.is_active)} flex items-center gap-1 text-xs whitespace-nowrap`}
                  >
                    {getStatusIcon(project.is_active)}
                    <span className="hidden sm:inline">{project.is_active ? 'Active' : 'Inactive'}</span>
                  </Badge>
                  {project.is_internal && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1 text-xs whitespace-nowrap"
                    >
                      <Home className="h-3 w-3" />
                      <span className="hidden sm:inline">Internal</span>
                    </Badge>
                  )}
                </div>
              </div>
              {project.description && (
                <CardDescription className="text-fluid-sm line-clamp-3 mt-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3 flex-1 min-h-0">
              {/* Budget progress with enhanced visual feedback */}
              <div className="flex items-center text-fluid-sm text-gray-600">
                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate">
                      {project.hours_used || 0}h / {project.budget_hours}h
                    </span>
                    {isOverBudget(project.hours_used, project.budget_hours) && (
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isOverBudget(project.hours_used, project.budget_hours) 
                          ? 'bg-orange-500' 
                          : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.min((project.hours_used || 0) / project.budget_hours * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Date range with responsive layout */}
              {(project.start_date || project.end_date) && (
                <div className="flex items-center text-fluid-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {project.start_date && formatDate(new Date(project.start_date))}
                    {project.start_date && project.end_date && ' - '}
                    {project.end_date && formatDate(new Date(project.end_date))}
                  </span>
                </div>
              )}

              {/* Customer info for non-internal projects */}
              {project.customer_id && !project.is_internal && (
                <div className="flex items-center text-fluid-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Customer: {project.customer_id}</span>
                </div>
              )}
            </CardContent>
            
            {/* Enhanced footer with smart button layout */}
            <CardFooter className="pt-3 flex-shrink-0">
              {/* Primary actions - conditional based on read-only mode */}
              <div className="flex flex-wrap gap-2 w-full">
                {!readOnly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleStatus(project)}
                      className={`
                        flex items-center gap-1 text-xs flex-shrink-0
                        ${project.is_active 
                          ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }
                      `}
                    >
                      {project.is_active ? (
                        <>
                          <PowerOff className="h-3 w-3" />
                          <span className="hidden lg:inline">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3" />
                          <span className="hidden lg:inline">Activate</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageAssignments(project)}
                      className="flex items-center gap-1 text-xs flex-shrink-0 hover:bg-blue-50"
                    >
                      <Users className="h-3 w-3" />
                      <span className="hidden lg:inline">Assign</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(project)}
                      className="flex items-center gap-1 text-xs flex-shrink-0 hover:bg-gray-50"
                    >
                      <Edit className="h-3 w-3" />
                      <span className="hidden lg:inline">Edit</span>
                    </Button>

                    {/* Secondary action with responsive visibility */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(project)}
                      className="
                        flex items-center gap-1 text-xs flex-shrink-0
                        text-red-600 hover:text-red-700 hover:bg-red-50
                        ml-auto
                      "
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden xl:inline">Delete</span>
                    </Button>
                  </>
                )}

                {/* Read-only actions for managers */}
                {readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageAssignments(project)}
                    className="flex items-center gap-1 text-xs flex-shrink-0 hover:bg-blue-50"
                  >
                    <Eye className="h-3 w-3" />
                    <span className="hidden lg:inline">View Assignments</span>
                    <span className="lg:hidden">View</span>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ProjectAssignmentDialog
        project={selectedProject}
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        readOnly={readOnly}
      />
    </>
  );
};

export default ProjectList;
