
import * as z from "zod";

export const timeEntryFormSchema = z.object({
  project_id: z.string().min(1, { message: "Please select a project" }),
  hours_logged: z.coerce.number().min(0.01, { message: "Hours must be greater than 0" }).max(24, { message: "Hours cannot exceed 24" }),
  notes: z.string().optional(),
  jira_task_id: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;
