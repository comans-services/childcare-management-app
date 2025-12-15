import * as z from "zod";

export const LEAVE_TYPES = [
  "Annual Leave",
  "Leave Loading",
  "Sick Leave",
  "Carer's Leave",
  "ADO",
  "Leave Without Pay",
  "Higher Duty",
  "Paid Parental Leave",
  "Time and a Half",
  "Double Time and a Half",
  "Long Service Leave",
] as const;

export const LEAVE_TYPE_ABBREVIATIONS: Record<string, string> = {
  "Annual Leave": "AL",
  "Leave Loading": "LL",
  "Sick Leave": "SL",
  "Carer's Leave": "CL",
  "ADO": "ADO",
  "Leave Without Pay": "LWP",
  "Higher Duty": "HD",
  "Paid Parental Leave": "PPL",
  "Time and a Half": "T1.5",
  "Double Time and a Half": "T2.5",
  "Long Service Leave": "LSL",
};

export const timeEntryFormSchema = z.object({
  hours_logged: z.coerce.number()
    .min(0.01, { message: "Hours must be greater than 0" })
    .max(24, { message: "Hours cannot exceed 24" }),
  start_time: z.string().min(1, { message: "Start time is required" }),
  end_time: z.string().min(1, { message: "End time is required" }),
  break_minutes: z.coerce.number()
    .min(0, { message: "Break cannot be negative" })
    .max(120, { message: "Break cannot exceed 2 hours" }),
  tea_break_minutes: z.coerce.number()
    .refine((val) => [0, 15, 30].includes(val), { message: "Tea break must be 0, 15, or 30 minutes" }),
  leave_type: z.string().nullable().optional(),
});

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;
