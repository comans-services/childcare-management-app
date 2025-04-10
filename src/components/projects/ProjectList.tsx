import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Filter, SortAsc, SortDesc, Search, Check, X, Loader2 } from "lucide-react";
import { Project, updateProjectStatus } from "@/lib/timesheet-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { formatDateDisplay } from "@/lib/date-utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

type SortField = 'name' | 'budget_hours' | 'hours_used' | 'start_date';
type SortDirection = 'asc' | 'desc';

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onEdit, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showOverBudget, setShowOverBudget] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [openStatusPopover, setOpenStatusPopover] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ projectId, isActive }: { projectId: string; isActive: boolean }) => 
      updateProjectStatus(projectId, isActive),
    onMutate: ({ projectId }) => {
      setUpdatingStatusId(projectId);
      setOpenStatusPopover(null);
    },
    onSuccess: (_, { projectId, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Status updated",
        description: `Project is now ${isActive ? "active" : "inactive"}`,
        variant: isActive ? "default" : "destructive",
      });
      setUpdatingStatusId(null);
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast({
        title: "Update failed",
        description: "Could not update project status",
        variant: "destructive",
      });
      setUpdatingStatusId(null);
    }
  });

  const toggleProjectStatus = (project: Project, newStatus: boolean) => {
    if (updatingStatusId === project.id) return;
    
    statusMutation.mutate({
      projectId: project.id,
      isActive: newStatus
    });
  };

  const calculateBudgetPercentage = (used: number = 0, budget: number): number => {
    if (budget === 0) return 0;
    return Math.min((used / budget) * 100, 100);
  };

  const isOverBudget = (used: number = 0, budget: number): boolean => {
    return used > budget;
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
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
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortField === 'budget_hours') {
          return sortDirection === 'asc' 
            ? a.budget_hours - b.budget_hours
            : b.budget_hours - a.budget_hours;
        } else if (sortField === 'hours_used') {
          const aHours = a.hours_used || 0;
          const bHours = b.hours_used || 0;
          return sortDirection === 'asc' 
            ? aHours - bHours
            : bHours - aHours;
        } else if (sortField === 'start_date') {
          if (!a.start_date) return sortDirection === 'asc' ? 1 : -1;
          if (!b.start_date) return sortDirection === 'asc' ? -1 : 1;
          return sortDirection === 'asc' 
            ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            : new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        }
        return 0;
      });
  }, [projects, searchTerm, showInactive, showOverBudget, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="inline h-4 w-4 ml-1" /> : <SortDesc className="inline h-4 w-4 ml-1" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort('name')}>
                Name {getSortIndicator('name')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('budget_hours')}>
                Budget Hours {getSortIndicator('budget_hours')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('hours_used')}>
                Hours Used {getSortIndicator('hours_used')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('start_date')}>
                Start Date {getSortIndicator('start_date')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortDirection('asc')}>
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortDirection('desc')}>
                Descending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                Name {getSortIndicator('name')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Timeline</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('hours_used')}
              >
                Budget {getSortIndicator('hours_used')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const hoursUsed = project.hours_used || 0;
                const overBudget = isOverBudget(hoursUsed, project.budget_hours);
                const budgetPercentage = calculateBudgetPercentage(hoursUsed, project.budget_hours);
                const isUpdating = updatingStatusId === project.id;
                const isStatusPopoverOpen = openStatusPopover === project.id;
                
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
                    <TableCell className="hidden sm:table-cell">
                      {isUpdating ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                        </Badge>
                      ) : (
                        <Popover 
                          open={isStatusPopoverOpen} 
                          onOpenChange={(open) => {
                            setOpenStatusPopover(open ? project.id : null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                              {project.is_active ? (
                                <Badge 
                                  variant="outline" 
                                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 cursor-pointer hover:bg-green-100"
                                >
                                  <Check className="h-3 w-3" /> Active
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1 cursor-pointer hover:bg-gray-100"
                                >
                                  <X className="h-3 w-3" /> Inactive
                                </Badge>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-3">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Change project status</h4>
                              <p className="text-xs text-muted-foreground">
                                Set the status of "{project.name}"
                              </p>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant={project.is_active ? "outline" : "default"}
                                  className="flex-1"
                                  onClick={() => toggleProjectStatus(project, false)}
                                  disabled={!project.is_active || isUpdating}
                                >
                                  <X className="h-3 w-3 mr-1" /> Inactive
                                </Button>
                                <Button
                                  size="sm"
                                  variant={project.is_active ? "default" : "outline"}
                                  className="flex-1"
                                  onClick={() => toggleProjectStatus(project, true)}
                                  disabled={project.is_active || isUpdating}
                                >
                                  <Check className="h-3 w-3 mr-1" /> Active
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setOpenStatusPopover(project.id)}
                              disabled={isUpdating}
                            >
                              {project.is_active ? (
                                <>
                                  <X className="h-4 w-4 mr-2" /> 
                                  Change Status
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" /> 
                                  Change Status
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectList;
