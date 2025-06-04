import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Filter, SortAsc, SortDesc, Search, Check, X, Loader2, Building2, Calendar, RotateCcw, Users } from "lucide-react";
import { ProjectWithAssignees, updateProjectStatus } from "@/lib/timesheet-service";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { Customer, fetchCustomers } from "@/lib/customer-service";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface ProjectListProps {
  projects: ProjectWithAssignees[];
  onEdit: (project: ProjectWithAssignees) => void;
  onDelete: (project: ProjectWithAssignees) => void;
  onAssign: (project: ProjectWithAssignees) => void;
}

type SortField = 'name' | 'budget_hours' | 'hours_used' | 'start_date';
type SortDirection = 'asc' | 'desc';

type EditableField = 'name' | 'description' | 'customer_id' | 'dates';

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onEdit, 
  onDelete,
  onAssign
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showOverBudget, setShowOverBudget] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const queryClient = useQueryClient();

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [openStatusPopover, setOpenStatusPopover] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{projectId: string, field: EditableField} | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingStartDate, setEditingStartDate] = useState<string>("");
  const [editingEndDate, setEditingEndDate] = useState<string>("");
  
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers
  });

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {} as Record<string, Customer>);
  }, [customers]);

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

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ projectIds, isActive }: { projectIds: string[]; isActive: boolean }) => {
      const promises = projectIds.map(id => updateProjectStatus(id, isActive));
      await Promise.all(promises);
      return projectIds;
    },
    onMutate: () => {
      setBulkUpdating(true);
    },
    onSuccess: (projectIds, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projects updated",
        description: `${projectIds.length} project${projectIds.length > 1 ? 's' : ''} ${isActive ? 'reactivated' : 'deactivated'}`,
      });
      setBulkUpdating(false);
      setSelectedProjects([]);
    },
    onError: (error) => {
      console.error("Failed to bulk update status:", error);
      toast({
        title: "Bulk update failed",
        description: "Could not update project statuses",
        variant: "destructive",
      });
      setBulkUpdating(false);
    }
  });

  const fieldUpdateMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { projectId: string; field: string | Record<string, any>; value?: any }) => {
      const updateData = typeof field === 'string' ? { [field]: value } : field;
      const { error } = await supabase
        .from("projects")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project updated",
        description: "Project details updated successfully",
      });
      setEditingField(null);
    },
    onError: (error) => {
      console.error("Failed to update project field:", error);
      toast({
        title: "Update failed",
        description: "Could not update project details",
        variant: "destructive",
      });
    }
  });

  const toggleProjectStatus = (project: ProjectWithAssignees, newStatus: boolean) => {
    if (updatingStatusId === project.id) return;
    
    statusMutation.mutate({
      projectId: project.id,
      isActive: newStatus
    });
  };

  const handleBulkReactivate = () => {
    const inactiveSelectedProjects = selectedProjects.filter(id => {
      const project = projects.find(p => p.id === id);
      return project && !project.is_active;
    });
    
    if (inactiveSelectedProjects.length === 0) {
      toast({
        title: "No inactive projects selected",
        description: "Please select inactive projects to reactivate",
        variant: "destructive",
      });
      return;
    }

    bulkStatusMutation.mutate({
      projectIds: inactiveSelectedProjects,
      isActive: true
    });
  };

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const inactiveProjectIds = filteredProjects.filter(p => !p.is_active).map(p => p.id);
      setSelectedProjects(inactiveProjectIds);
    } else {
      setSelectedProjects([]);
    }
  };

  const startEditing = (projectId: string, field: EditableField, project: ProjectWithAssignees) => {
    setEditingField({ projectId, field });
    
    if (field === 'name') {
      setEditingName(project.name);
    } else if (field === 'description') {
      setEditingDescription(project.description || '');
    } else if (field === 'customer_id') {
      setEditingCustomerId(project.customer_id || null);
    } else if (field === 'dates') {
      setEditingStartDate(project.start_date || '');
      setEditingEndDate(project.end_date || '');
    }
  };

  const saveFieldEdit = (projectId: string, field: EditableField) => {
    if (field === 'name') {
      fieldUpdateMutation.mutate({ projectId, field: 'name', value: editingName });
    } else if (field === 'description') {
      fieldUpdateMutation.mutate({ projectId, field: 'description', value: editingDescription });
    } else if (field === 'customer_id') {
      fieldUpdateMutation.mutate({ projectId, field: 'customer_id', value: editingCustomerId });
    } else if (field === 'dates') {
      fieldUpdateMutation.mutate({ 
        projectId, 
        field: {
          start_date: editingStartDate || null,
          end_date: editingEndDate || null
        }
      });
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingField && !((event.target as HTMLElement).closest('[data-editing="true"]'))) {
        cancelEditing();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingField]);

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

  useEffect(() => {
    if (editingField?.field === 'customer_id' && !editingField) {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  }, [editingField, queryClient]);

  const inactiveProjectsCount = filteredProjects.filter(p => !p.is_active).length;
  const selectedInactiveCount = selectedProjects.filter(id => {
    const project = projects.find(p => p.id === id);
    return project && !project.is_active;
  }).length;

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

      {/* Bulk Actions Section */}
      {showInactive && inactiveProjectsCount > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedProjects.length === inactiveProjectsCount && inactiveProjectsCount > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                {selectedProjects.length > 0 
                  ? `${selectedInactiveCount} inactive project${selectedInactiveCount !== 1 ? 's' : ''} selected`
                  : `Select all ${inactiveProjectsCount} inactive project${inactiveProjectsCount !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            
            {selectedInactiveCount > 0 && (
              <Button
                onClick={handleBulkReactivate}
                disabled={bulkUpdating}
                className="flex items-center gap-2"
              >
                {bulkUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reactivate Selected ({selectedInactiveCount})
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-2">
        Showing {filteredProjects.length} of {projects.length} projects
        {showInactive && inactiveProjectsCount > 0 && (
          <span className="ml-2 text-orange-600">
            • {inactiveProjectsCount} inactive project{inactiveProjectsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showInactive && inactiveProjectsCount > 0 && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedProjects.length === inactiveProjectsCount && inactiveProjectsCount > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </TableHead>
              )}
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                Name {getSortIndicator('name')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Customer</TableHead>
              <TableHead className="hidden md:table-cell">Timeline</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned Users</TableHead>
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
                <TableCell colSpan={showInactive && inactiveProjectsCount > 0 ? 9 : 8} className="h-24 text-center">
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
                const customer = project.customer_id ? customerMap[project.customer_id] : undefined;
                const isEditingThisProjectName = editingField?.projectId === project.id && editingField?.field === 'name';
                const isEditingThisProjectDescription = editingField?.projectId === project.id && editingField?.field === 'description';
                const isEditingThisProjectCustomer = editingField?.projectId === project.id && editingField?.field === 'customer_id';
                const isEditingThisProjectDates = editingField?.projectId === project.id && editingField?.field === 'dates';
                const isSelected = selectedProjects.includes(project.id);
                const assignees = project.assignees || [];
                
                return (
                  <TableRow 
                    key={project.id}
                    className={!project.is_active ? "opacity-60" : ""}
                  >
                    {showInactive && inactiveProjectsCount > 0 && (
                      <TableCell>
                        {!project.is_active && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleProjectSelection(project.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {isEditingThisProjectName ? (
                        <div className="flex gap-2" data-editing="true">
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)}
                            className="min-w-[200px]"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            onClick={() => saveFieldEdit(project.id, 'name')}
                            disabled={!editingName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="hover:bg-gray-50 p-1 rounded cursor-pointer"
                          onClick={() => startEditing(project.id, 'name', project)}
                        >
                          {project.name}
                          {!project.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {isEditingThisProjectDescription ? (
                        <div className="flex flex-col gap-2" data-editing="true">
                          <Textarea 
                            value={editingDescription} 
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="min-w-[200px] min-h-[80px]"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <Button 
                              size="sm" 
                              onClick={() => saveFieldEdit(project.id, 'description')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="hover:bg-gray-50 p-1 rounded cursor-pointer truncate"
                          onClick={() => startEditing(project.id, 'description', project)}
                        >
                          {project.description || <span className="text-muted-foreground text-sm italic">Click to add description</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {isEditingThisProjectCustomer ? (
                        <div className="flex flex-col gap-2" data-editing="true">
                          <CustomerSelector
                            selectedCustomerId={editingCustomerId}
                            onSelectCustomer={setEditingCustomerId}
                            containerClassName="m-0"
                            preventClose={true}
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <Button 
                              size="sm" 
                              onClick={() => saveFieldEdit(project.id, 'customer_id')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="hover:bg-gray-50 p-1 rounded cursor-pointer"
                          onClick={() => startEditing(project.id, 'customer_id', project)}
                        >
                          {customer ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{customer.name}</span>
                              {customer.company && (
                                <span className="text-xs text-muted-foreground">
                                  ({customer.company})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Click to assign customer</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {isEditingThisProjectDates ? (
                        <div className="flex flex-col gap-2" data-editing="true">
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Start date:</label>
                              <Input 
                                type="date" 
                                value={editingStartDate} 
                                onChange={(e) => setEditingStartDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">End date:</label>
                              <Input 
                                type="date" 
                                value={editingEndDate} 
                                onChange={(e) => setEditingEndDate(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-1">
                            <Button 
                              size="sm" 
                              onClick={() => saveFieldEdit(project.id, 'dates')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="hover:bg-gray-50 p-1 rounded cursor-pointer"
                          onClick={() => startEditing(project.id, 'dates', project)}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {project.start_date && project.end_date ? (
                              <>
                                {formatDateDisplay(new Date(project.start_date))} - {formatDateDisplay(new Date(project.end_date))}
                              </>
                            ) : project.start_date ? (
                              <>From {formatDateDisplay(new Date(project.start_date))}</>
                            ) : project.end_date ? (
                              <>Until {formatDateDisplay(new Date(project.end_date))}</>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Click to set dates</span>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {assignees.length > 0 ? (
                          assignees.slice(0, 3).map((assignee) => (
                            <Badge key={assignee.id} variant="secondary" className="text-xs">
                              {assignee.full_name || assignee.email || 'Unknown'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No users assigned</span>
                        )}
                        {assignees.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignees.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {isUpdating ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          {project.is_active ? (
                            <Badge 
                              variant="outline" 
                              className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Active
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Inactive
                            </Badge>
                          )}
                          
                          {/* Quick Status Toggle Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProjectStatus(project, !project.is_active)}
                            disabled={isUpdating}
                            className="h-6 px-2 text-xs"
                          >
                            {project.is_active ? "Deactivate" : "Reactivate"}
                          </Button>
                        </div>
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
                          className={overBudget ? 'bg-red-100' : 'bg-green-50'}
                          indicatorClassName={overBudget ? 'bg-red-500' : 'bg-green-500'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="hidden md:flex md:justify-end md:space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onAssign(project)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Assign users to project"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {!project.is_active && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleProjectStatus(project, true)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Reactivate project"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
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
                            <DropdownMenuItem 
                              onClick={() => onAssign(project)}
                              className="text-blue-600"
                            >
                              <Users className="h-4 w-4 mr-2" /> Assign Users
                            </DropdownMenuItem>
                            {!project.is_active && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => toggleProjectStatus(project, true)}
                                  disabled={isUpdating}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
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
                              onClick={() => toggleProjectStatus(project, !project.is_active)}
                              disabled={isUpdating}
                            >
                              {project.is_active ? (
                                <>
                                  <X className="h-4 w-4 mr-2" /> 
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" /> 
                                  Reactivate
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
