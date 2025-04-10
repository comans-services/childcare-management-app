
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Project } from "@/lib/timesheet-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateDisplay } from "@/lib/date-utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  // Helper function to calculate percentage of budget used
  const calculateBudgetPercentage = (used: number = 0, budget: number): number => {
    if (budget === 0) return 0;
    return Math.min((used / budget) * 100, 100);
  };

  // Helper function to determine if project is over budget
  const isOverBudget = (used: number = 0, budget: number): boolean => {
    return used > budget;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="hidden md:table-cell">Timeline</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const hoursUsed = project.hours_used || 0;
            const overBudget = isOverBudget(hoursUsed, project.budget_hours);
            const budgetPercentage = calculateBudgetPercentage(hoursUsed, project.budget_hours);
            
            return (
              <TableRow 
                key={project.id}
                className={!project.is_active ? "opacity-60" : ""}
              >
                <TableCell className="font-medium">
                  {project.name}
                  {!project.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {project.description || "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {project.start_date && project.end_date ? (
                    <>
                      {formatDateDisplay(new Date(project.start_date))} - {formatDateDisplay(new Date(project.end_date))}
                    </>
                  ) : project.start_date ? (
                    <>From {formatDateDisplay(new Date(project.start_date))}</>
                  ) : project.end_date ? (
                    <>Until {formatDateDisplay(new Date(project.end_date))}</>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {hoursUsed.toFixed(1)}/{project.budget_hours} hrs
                      </span>
                      {overBudget && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Over Budget
                        </Badge>
                      )}
                    </div>
                    <Progress 
                      value={budgetPercentage}
                      className={`h-2 ${overBudget ? 'bg-red-100' : 'bg-green-50'}`}
                      indicatorClassName={overBudget ? 'bg-red-500' : 'bg-green-500'}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {/* Desktop Actions */}
                  <div className="hidden md:flex md:justify-end md:space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onEdit(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => onDelete(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile dropdown menu */}
                  <div className="md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(project)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectList;
