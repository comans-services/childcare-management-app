
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { TimeEntryFormValues } from "./schema";

interface TaskDetailsProps {
  control: Control<TimeEntryFormValues>;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ control }) => {
  return (
    <>
      <FormField
        control={control}
        name="jira_task_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Task ID</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., JIRA-123" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Notes</FormLabel>
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
    </>
  );
};
