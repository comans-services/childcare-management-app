
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
import { formatDateDisplay } from "@/lib/date-utils";

interface EntryFormProps {
  userId: string;
  date: Date;
  projects: Project[];
  existingEntry?: TimesheetEntry;
  onSave: () => void;
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

  const form = useForm<{
    project_id: string;
    hours_logged: number;
    notes: string;
    jira_task_id: string;
  }>({
    defaultValues: {
      project_id: existingEntry?.project_id || "",
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
    }
  }, [existingEntry, form]);

  const onSubmit = async (values: {
    project_id: string;
    hours_logged: number;
    notes: string;
    jira_task_id: string;
  }) => {
    try {
      setIsSubmitting(true);
      
      const entry: TimesheetEntry = {
        id: existingEntry?.id,
        user_id: userId,
        project_id: values.project_id,
        entry_date: date.toISOString().split("T")[0],
        hours_logged: Number(values.hours_logged),
        notes: values.notes,
        jira_task_id: values.jira_task_id,
      };

      await saveTimesheetEntry(entry);
      
      toast({
        title: existingEntry ? "Entry updated" : "Entry created",
        description: `Time entry ${existingEntry ? "updated" : "created"} successfully.`,
      });
      
      onSave();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: `Failed to ${existingEntry ? "update" : "create"} time entry.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="font-medium text-lg">{formatDateDisplay(date)}</div>
        
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
                  <SelectTrigger>
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

        <FormField
          control={form.control}
          name="hours_logged"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  placeholder="0.00"
                  disabled={isSubmitting}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                <Input placeholder="e.g. PROJ-123" disabled={isSubmitting} {...field} />
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
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : existingEntry
              ? "Update Entry"
              : "Save Entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EntryForm;
