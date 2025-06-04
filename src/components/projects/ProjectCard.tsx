
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Building2, Calendar, Users, Clock } from "lucide-react";
import { Project } from "@/lib/timesheet/types";
import { formatDateDisplay } from "@/lib/date-utils";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onAssign: (project: Project) => void;
  assignedUsers?: Array<{ id: string; full_name?: string; email?: string }>;
  customer?: { name: string; company?: string };
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onAssign,
  assignedUsers = [],
  customer
}) => {
  const hoursUsed = project.hours_used || 0;
  const budgetPercentage = project.budget_hours > 0 
    ? Math.min((hoursUsed / project.budget_hours) * 100, 100) 
    : 0;
  const isOverBudget = hoursUsed > project.budget_hours;

  return (
    <Card className={`h-full flex flex-col ${!project.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight">
            {project.name}
          </CardTitle>
          <Badge 
            variant={project.is_active ? "default" : "secondary"}
            className={project.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
          >
            {project.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        {project.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Customer */}
        {customer && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {customer.name}
              {customer.company && (
                <span className="text-muted-foreground ml-1">({customer.company})</span>
              )}
            </span>
          </div>
        )}

        {/* Timeline */}
        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {project.start_date && project.end_date ? (
                `${formatDateDisplay(new Date(project.start_date))} - ${formatDateDisplay(new Date(project.end_date))}`
              ) : project.start_date ? (
                `From ${formatDateDisplay(new Date(project.start_date))}`
              ) : project.end_date ? (
                `Until ${formatDateDisplay(new Date(project.end_date))}`
              ) : null}
            </span>
          </div>
        )}

        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Budget Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {hoursUsed.toFixed(1)}/{project.budget_hours}h
              </span>
              {isOverBudget && (
                <Badge variant="destructive" className="text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
          </div>
          <Progress 
            value={budgetPercentage}
            className={isOverBudget ? 'bg-red-100' : 'bg-green-50'}
            indicatorClassName={isOverBudget ? 'bg-red-500' : 'bg-green-500'}
          />
        </div>

        {/* Assigned Users */}
        {assignedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Assigned Users</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {assignedUsers.slice(0, 3).map((user) => (
                <Badge key={user.id} variant="outline" className="text-xs">
                  {user.full_name || user.email || 'Unknown User'}
                </Badge>
              ))}
              {assignedUsers.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{assignedUsers.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex justify-between items-center w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssign(project)}
            className="flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            Assign
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(project)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
