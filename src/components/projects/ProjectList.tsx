
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Play, Pause, Building2, Users } from "lucide-react";
import { Project } from "@/lib/timesheet/types";
import { formatDateDisplay } from "@/lib/date-utils";
import ProjectBudgetDisplay from "./ProjectBudgetDisplay";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleStatus: (project: Project) => void;
}

const ProjectList = ({ projects, onEdit, onDelete, onToggleStatus }: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No projects found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                <CardDescription className="mt-1">
                  {project.description || "No description provided"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {project.is_internal && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Internal
                  </Badge>
                )}
                {!project.is_active && (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ProjectBudgetDisplay project={project} />
            
            {(project.start_date || project.end_date) && (
              <div className="text-sm text-muted-foreground">
                {project.start_date && (
                  <div>Start: {formatDateDisplay(new Date(project.start_date))}</div>
                )}
                {project.end_date && (
                  <div>End: {formatDateDisplay(new Date(project.end_date))}</div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(project)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(project)}
                  className={project.is_active ? "text-amber-600" : "text-green-600"}
                >
                  {project.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(project)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;
