
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, Project, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay, formatDate, getHoursDifference } from "@/lib/date-utils";
import { Clock } from "lucide-react";

interface EntryFormProps {
  userId: string;
  date: Date;
  projects: Project[];
  existingEntry?: TimesheetEntry;
  onSave: (savedEntry?: TimesheetEntry) => void;
  onCancel: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({
  userId,
  date,
  projects,
  existingEntry,
  onSave,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoursInputValue, setHoursInputValue] = useState(
    existingEntry?.hours_logged?.toString() || ""
  );
  const [useTimeRange, setUseTimeRange] = useState(
    !!(existingEntry?.start_time && existingEntry?.end_time)
  );

  const getDefaultProjectId = () => {
    if (existingEntry?.project_id) return existingEntry.project_id;
    
    const activeProjects = projects.filter(p => p.is_active !== false);
    return activeProjects.length > 0 ? activeProjects[0].id : "";
  };

  const form = useForm<{
    project_id: string;
    hours_logged: number;
    notes: string;
    jira_task_id: string;
    start_time: string;
    end_time: string;
  }>({
    defaultValues: {
      project_id: getDefaultProjectId(),
      hours_logged: existingEntry?.hours_logged || 0,
      notes: existingEntry?.notes || "",
      jira_task_id: existingEntry?.jira_task_id || "",
      start_time: existingEntry?.start_time || "09:00",
      end_time: existingEntry?.end_time || "17:00",
    },
  });

  useEffect(() => {
    if (existingEntry) {
      form.reset({
        project_id: existingEntry.project_id,
        hours_logged: existingEntry.hours_logged,
        notes: existingEntry.notes || "",
        jira_task_id: existingEntry.jira_task_id || "",
        start_time: existingEntry.start_time || "09:00",
        end_time: existingEntry.end_time || "17:00",
      });
      setHoursInputValue(existingEntry.hours_logged?.toString() || "");
      setUseTimeRange(!!(existingEntry.start_time && existingEntry.end_time));
    } else {
      form.reset({
        project_id: getDefaultProjectId(),
        hours_logged: 0,
        notes: "",
        jira_task_id: "",
        start_time: "09:00",
        end_time: "17:00",
      });
      setHoursInputValue("");
      setUseTimeRange(false);
    }
  }, [existingEntry, projects, form]);

  // Calculate hours from time range
  const calculateHoursFromTimeRange = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    try {
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);
      
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
      
      // If end time is before start time, assume it's the next day
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      // Calculate hours difference and round to 2 decimal places
      return getHoursDifference(start, end);
    } catch (error) {
      console.error("Error calculating hours:", error);
      return 0;
    }
  };

  // Handle time changes
  useEffect(() => {
    if (useTimeRange) {
      const startTime = form.getValues("start_time");
      const endTime = form.getValues("end_time");
      if (startTime && endTime) {
        const calculatedHours = calculateHoursFromTimeRange(startTime, endTime);
        setHoursInputValue(calculatedHours.toFixed(2));
        form.setValue("hours_logged", calculatedHours);
      }
    }
  }, [useTimeRange, form]);

  const onSubmit = async (values: {
    project_id: string;
    hours_logged: number;
    notes: string;
    jira_task_id: string;
    start_time: string;
    end_time: string;
  }) => {
    if (!values.project_id) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive",
      });
      return;
    }

    const hours = hoursInputValue === "" ? 0 : parseFloat(hoursInputValue);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast({
        title: "Invalid Hours",
        description: "Please enter a valid number of hours between 0 and 24.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formattedDate = formatDate(date);
      console.log(`Saving entry for date: ${formattedDate} (Original date: ${date.toISOString()})`);
      
      const entry: TimesheetEntry = {
        id: existingEntry?.id,
        user_id: userId,
        project_id: values.project_id,
        entry_date: formattedDate,
        hours_logged: hours,
        notes: values.notes,
        jira_task_id: values.jira_task_id,
        start_time: useTimeRange ? values.start_time : undefined,
        end_time: useTimeRange ? values.end_time : undefined,
      };

      console.log("Saving entry:", entry);
      const savedEntry = await saveTimesheetEntry(entry);
      
      toast({
        title: existingEntry ? "Entry updated" : "Entry created",
        description: `Time entry ${existingEntry ? "updated" : "created"} successfully.`,
      });
      
      const matchingProject = projects.find(p => p.id === values.project_id);
      if (matchingProject) {
        savedEntry.project = matchingProject;
      }
      
      onSave(savedEntry);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: `Failed to ${existingEntry ? "update" : "create"} time entry. Please try again.`,
        variant: "destructive",
      });
      onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="entry-form-container overflow-y-auto p-2 md:p-4 max-h-[70vh] animate-in fade-in-50 duration-200">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="font-medium text-lg">{formatDateDisplay(date)}</div>
          
          {projects.length === 0 ? (
            <div className="text-amber-600 p-2 border rounded bg-amber-50">
              No projects available. Please create a project first.
            </div>
          ) : (
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20 whitespace-normal break-words">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id}
                          className="whitespace-normal break-words"
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="flex items-center space-x-2 mb-2">
            <Switch
              checked={useTimeRange}
              onCheckedChange={(checked) => setUseTimeRange(checked)}
              disabled={isSubmitting || projects.length === 0}
              id="use-time-range"
            />
            <FormLabel htmlFor="use-time-range" className="cursor-pointer text-sm m-0">
              Use time range
            </FormLabel>
          </div>

          {useTimeRange ? (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium mb-1 block">Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20 h-9 text-sm"
                        disabled={isSubmitting || projects.length === 0}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const endTime = form.getValues("end_time");
                          if (endTime) {
                            const calculatedHours = calculateHoursFromTimeRange(e.target.value, endTime);
                            setHoursInputValue(calculatedHours.toFixed(2));
                            form.setValue("hours_logged", calculatedHours);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium mb-1 block">End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20 h-9 text-sm"
                        disabled={isSubmitting || projects.length === 0}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const startTime = form.getValues("start_time");
                          if (startTime) {
                            const calculatedHours = calculateHoursFromTimeRange(startTime, e.target.value);
                            setHoursInputValue(calculatedHours.toFixed(2));
                            form.setValue("hours_logged", calculatedHours);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="hours_logged"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0.00"
                    disabled={isSubmitting || projects.length === 0 || useTimeRange}
                    value={hoursInputValue}
                    className={`transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20 ${useTimeRange ? 'bg-gray-100' : ''}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setHoursInputValue(value);
                        
                        if (value === "") {
                          field.onChange(0);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                          }
                        }
                      }
                    }}
                  />
                </FormControl>
                {useTimeRange && (
                  <FormDescription className="text-xs text-muted-foreground">
                    Hours automatically calculated from time range
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jira_task_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JIRA Task ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. PROJ-123" 
                    disabled={isSubmitting || projects.length === 0} 
                    className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add details about your work..."
                    className="min-h-[100px] transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isSubmitting || projects.length === 0}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col justify-end space-y-2 pt-4 sticky bottom-0 bg-background pb-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || projects.length === 0}
              className="transition-all duration-200 hover:scale-[1.02]"
              size="sm"
            >
              {isSubmitting
                ? "Saving..."
                : existingEntry
                ? "Update Entry"
                : "Save Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="transition-all duration-200 hover:bg-gray-100 hover:scale-[1.02]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EntryForm;
