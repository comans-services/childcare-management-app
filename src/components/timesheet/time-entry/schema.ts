import * as z from "zod";

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
});

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;
