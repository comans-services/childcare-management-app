
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimesheetEntry, Project, saveTimesheetEntry, Contract } from "@/lib/timesheet-service";
import { fetchContracts, saveContractTimeEntry, ContractTimeEntry } from "@/lib/contract-service";
import { formatDate } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

// Import the components we've created
import { timeEntryFormSchema, TimeEntryFormValues } from "./time-entry/schema";
import { EntryTypeSelector } from "./time-entry/EntryTypeSelector";
import { ProjectSelector } from "./time-entry/ProjectSelector";
import { ContractSelector } from "./time-entry/ContractSelector";
import { TimeInput } from "./time-entry/TimeInput";
import { TaskDetails } from "./time-entry/TaskDetails";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: Date;
  projects: Project[];
  existingEntry?: TimesheetEntry | ContractTimeEntry;
  onSave: (entry?: TimesheetEntry | ContractTimeEntry) => void;
}

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  userId,
  date,
  projects,
  existingEntry,
  onSave
}) => {
  const [entryType, setEntryType] = useState<"project" | "contract">("project");

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => fetchContracts({ isActive: true }),
    enabled: open,
  });

  // Determine if existing entry is a contract entry
  const isContractEntry = existingEntry && 'contract_id' in existingEntry;

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      entry_type: isContractEntry ? "contract" : "project",
      project_id: !isContractEntry && existingEntry ? existingEntry.project_id : "",
      contract_id: isContractEntry ? (existingEntry as ContractTimeEntry).contract_id : "",
      hours_logged: existingEntry?.hours_logged || 1,
      notes: existingEntry?.notes || "",
      jira_task_id: existingEntry?.jira_task_id || "",
      start_time: existingEntry?.start_time || "",
      end_time: existingEntry?.end_time || "",
    },
  });

  // Watch entry type changes
  const watchedEntryType = form.watch("entry_type");

  useEffect(() => {
    setEntryType(watchedEntryType || "project");
  }, [watchedEntryType]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        entry_type: isContractEntry ? "contract" : "project",
        project_id: !isContractEntry && existingEntry ? existingEntry.project_id : "",
        contract_id: isContractEntry ? (existingEntry as ContractTimeEntry).contract_id : "",
        hours_logged: existingEntry?.hours_logged || 1,
        notes: existingEntry?.notes || "",
        jira_task_id: existingEntry?.jira_task_id || "",
        start_time: existingEntry?.start_time || "",
        end_time: existingEntry?.end_time || "",
      });
    }
  }, [open, existingEntry, isContractEntry, form]);

  const handleSubmit = async (values: TimeEntryFormValues) => {
    try {
      if (values.entry_type === "project") {
        // Handle project entry
        const entryData: TimesheetEntry = {
          id: !isContractEntry && existingEntry ? existingEntry.id : undefined,
          project_id: values.project_id!,
          entry_date: formatDate(date),
          hours_logged: values.hours_logged,
          notes: values.notes || "",
          jira_task_id: values.jira_task_id || "",
          start_time: values.start_time || null,
          end_time: values.end_time || null,
        };

        // Preserve project and user data from existing entry if available
        if (!isContractEntry && existingEntry?.project) {
          entryData.project = existingEntry.project;
        }
        
        if (!isContractEntry && existingEntry?.user) {
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
      } else {
        // Handle contract entry
        const entryData: ContractTimeEntry = {
          id: isContractEntry ? existingEntry.id : undefined,
          contract_id: values.contract_id!,
          user_id: userId,
          entry_date: formatDate(date),
          hours_logged: values.hours_logged,
          notes: values.notes || "",
          jira_task_id: values.jira_task_id || "",
          start_time: values.start_time || "",
          end_time: values.end_time || "",
        };

        const savedEntry = await saveContractTimeEntry(entryData);
        
        toast({
          title: existingEntry ? "Entry updated" : "Entry created",
          description: existingEntry 
            ? "Your contract entry has been updated." 
            : "Your contract entry has been created.",
        });
        
        onSave(savedEntry);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save your entry.",
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
            
            <EntryTypeSelector control={form.control} />
            
            {entryType === "project" ? (
              <ProjectSelector control={form.control} projects={projects} />
            ) : (
              <ContractSelector control={form.control} contracts={contracts} />
            )}
            
            <TimeInput control={form.control} />

            <TaskDetails control={form.control} />

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
