
import React from "react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TimesheetEntry, Project, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: Date;
  projects: Project[];
  existingEntry?: TimesheetEntry;
  onSave: (entry?: TimesheetEntry) => void;
}

const formSchema = z.object({
  project_id: z.string().min(1, { message: "Please select a project" }),
  hours_logged: z.coerce.number().min(0.01, { message: "Hours must be greater than 0" }).max(24, { message: "Hours cannot exceed 24" }),
  notes: z.string().optional(),
  jira_task_id: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  userId,
  date,
  projects,
  existingEntry,
  onSave
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: existingEntry?.project_id || "",
      hours_logged: existingEntry?.hours_logged || 1,
      notes: existingEntry?.notes || "",
      jira_task_id: existingEntry?.jira_task_id || "",
      start_time: existingEntry?.start_time || "",
      end_time: existingEntry?.end_time || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const entryData: TimesheetEntry = {
        id: existingEntry?.id,
        user_id: userId,
        project_id: values.project_id,
        entry_date: formatDate(date),
        hours_logged: values.hours_logged,
        notes: values.notes || "",
        jira_task_id: values.jira_task_id || "",
        start_time: values.start_time || null,
        end_time: values.end_time || null,
      };

      // Preserve project and user data from existing entry if available
      if (existingEntry?.project) {
        entryData.project = existingEntry.project;
      }
      
      if (existingEntry?.user) {
        entryData.user = existingEntry.user;
      }
      
      const savedEntry = await saveTimesheetEntry(entryData);
      
      toast({
        title: existingEntry ? "Entry updated" : "Entry created",
        description: existingEntry 
          ? "Your timesheet entry has been updated." 
          : "Your timesheet entry has been created.",
      });
      
      onSave(savedEntry);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving timesheet entry:", error);
      toast({
        title: "Error",
        description: "Failed to save your timesheet entry.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">{existingEntry ? "Edit time entry" : "Add time"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-4">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{format(date, "EEE, MMM d, yyyy")}</span>
            </div>
            
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Project*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
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
            
            <div className="space-y-5">
              <div>
                <FormField
                  control={form.control}
                  name="hours_logged"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Time span*</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.25" 
                            {...field} 
                            className="w-20" 
                          />
                        </FormControl>
                        <span>hours</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Start time (optional)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-1/2">
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">End time (optional)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="jira_task_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Task ID (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., JIRA-123" />
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
                  <FormLabel className="font-medium">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add any additional details here"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
