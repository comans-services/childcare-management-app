
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
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, Project, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay, formatDate } from "@/lib/date-utils";

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
  // Track hours separately to allow empty value in input
  const [hoursInputValue, setHoursInputValue] = useState(
    existingEntry?.hours_logged?.toString() || ""
  );

  // Use defaultProject if available (for editing) or the first active project
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
  }>({
    defaultValues: {
      project_id: getDefaultProjectId(),
      hours_logged: existingEntry?.hours_logged || 0,
      notes: existingEntry?.notes || "",
      jira_task_id: existingEntry?.jira_task_id || "",
    },
  });

  useEffect(() => {
    if (existingEntry) {
      form.reset({
        project_id: existingEntry.project_id,
        hours_logged: existingEntry.hours_logged,
        notes: existingEntry.notes || "",
        jira_task_id: existingEntry.jira_task_id || "",
      });
      setHoursInputValue(existingEntry.hours_logged?.toString() || "");
    } else {
      // For new entries, set the default project
      form.reset({
        project_id: getDefaultProjectId(),
        hours_logged: 0,
        notes: "",
        jira_task_id: "",
      });
      setHoursInputValue("");
    }
  }, [existingEntry, projects, form]);

  const onSubmit = async (values: {
    project_id: string;
    hours_logged: number;
    notes: string;
    jira_task_id: string;
  }) => {
    if (!values.project_id) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive",
      });
      return;
    }

    // Validate hours input
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
      
      // Use consistent date formatting with formatDate utility
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
      };

      console.log("Saving entry:", entry);
      const savedEntry = await saveTimesheetEntry(entry);
      
      toast({
        title: existingEntry ? "Entry updated" : "Entry created",
        description: `Time entry ${existingEntry ? "updated" : "created"} successfully.`,
      });
      
      // Find project details to include with saved entry
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
                      <SelectTrigger className="w-full transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
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
                    disabled={isSubmitting || projects.length === 0}
                    value={hoursInputValue}
                    className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => {
                      // Allow empty string or valid numbers (including decimals)
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setHoursInputValue(value);
                        
                        // Update form value only with valid numbers
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

          <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="transition-all duration-200 hover:bg-gray-100 hover:scale-[1.02]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || projects.length === 0}
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              {isSubmitting
                ? "Saving..."
                : existingEntry
                ? "Update Entry"
                : "Save Entry"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EntryForm;
