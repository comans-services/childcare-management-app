import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay, formatDate, getHoursDifference } from "@/lib/date-utils";
import { timeEntryFormSchema, TimeEntryFormValues, LEAVE_TYPES } from "./time-entry/schema";
import { fetchUserById } from "@/lib/user-service";
import { useAuth } from "@/context/AuthContext";

interface EntryFormProps {
  userId: string;
  date: Date;
  existingEntry?: TimesheetEntry;
  onSave: (savedEntry?: TimesheetEntry) => void;
  onCancel: () => void;
}

const FULL_TIME_HOURS = 7.6;

const EntryForm: React.FC<EntryFormProps> = ({
  userId,
  date,
  existingEntry,
  onSave,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { employmentType } = useAuth();
  const isFullTime = employmentType === "full-time";

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      hours_logged: existingEntry?.hours_logged ?? (isFullTime ? FULL_TIME_HOURS : 8),
      start_time: existingEntry?.start_time || "09:00",
      end_time: existingEntry?.end_time || "17:00",
      lunch_break_taken: (existingEntry as any)?.lunch_break_taken ?? false,
      leave_type: existingEntry?.leave_type || null,
      notes: (existingEntry as any)?.notes ?? null,
    },
  });

  useEffect(() => {
    const loadDefaults = async () => {
      if (existingEntry) {
        form.reset({
          hours_logged: existingEntry.hours_logged,
          start_time: existingEntry.start_time || "09:00",
          end_time: existingEntry.end_time || "17:00",
          lunch_break_taken: (existingEntry as any)?.lunch_break_taken ?? false,
          leave_type: existingEntry.leave_type || null,
        });
      } else {
        // Fetch user's default times for new entries
        const userProfile = await fetchUserById(userId);
        const defaultStart = userProfile?.default_start_time?.slice(0, 5) || "09:00";
        const defaultEnd = userProfile?.default_end_time?.slice(0, 5) || "17:00";

        form.reset({
          hours_logged: isFullTime ? FULL_TIME_HOURS : 8,
          start_time: defaultStart,
          end_time: defaultEnd,
          lunch_break_taken: false,
          leave_type: null,
          notes: null,
        });
      }
    };
    loadDefaults();
  }, [existingEntry, form, userId]);

  // Auto-calculate hours when time range changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_time' || name === 'end_time') {
        const startTime = value.start_time;
        const endTime = value.end_time;

        if (startTime && endTime) {
          try {
            const today = new Date();
            const start = new Date(today);
            const end = new Date(today);

            const [startHours, startMinutes] = startTime.split(":").map(Number);
            const [endHours, endMinutes] = endTime.split(":").map(Number);

            start.setHours(startHours, startMinutes, 0);
            end.setHours(endHours, endMinutes, 0);

            if (end < start) {
              end.setDate(end.getDate() + 1);
            }

            const rawHours = getHoursDifference(start, end);
            const netHours = Math.max(0, Math.round(rawHours * 4) / 4);
            form.setValue('hours_logged', netHours);
          } catch (error) {
            console.error("Error calculating hours:", error);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: TimeEntryFormValues) => {
    // Full-time validation: regular shifts require a lunch break
    if (isFullTime && !values.leave_type && !values.lunch_break_taken) {
      toast({
        title: "Lunch break required",
        description: "Full-time shifts must include a lunch break. Please tick 'Lunch break taken'.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const entry: TimesheetEntry = {
        id: existingEntry?.id,
        user_id: userId,
        entry_date: formatDate(date),
        hours_logged: values.hours_logged,
        start_time: values.start_time,
        end_time: values.end_time,
        break_minutes: 0,
        tea_break_minutes: 0,
        lunch_break_taken: values.lunch_break_taken ?? false,
        leave_type: values.leave_type || null,
        notes: values.notes || null,
      };

      console.log("Submitting entry:", entry);

      const savedEntry = await saveTimesheetEntry(entry);

      toast({
        title: existingEntry ? "Shift updated" : "Shift added",
        description: `${values.hours_logged} hours logged for ${formatDateDisplay(date)}`,
      });

      onSave(savedEntry);
    } catch (error: any) {
      console.error("Error saving shift:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save shift. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {formatDateDisplay(date)}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="leave_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None - Regular Hours</SelectItem>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="lunch_break_taken"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      id="lunch-break"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label htmlFor="lunch-break" className="text-sm font-medium cursor-pointer">
                    Lunch break taken
                    {isFullTime && !form.watch("leave_type") && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </Label>
                </div>
                {isFullTime && !form.watch("leave_type") && !field.value && (
                  <p className="text-xs text-red-500 mt-1">Required for full-time regular shifts.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any comments about this shift…"
                    className="resize-none"
                    rows={2}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Advisory: warn if hours differ from 7.6 for full-time regular shifts */}
          {isFullTime && !form.watch("leave_type") &&
            Math.abs(form.watch("hours_logged") - FULL_TIME_HOURS) > 0.01 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800">
              Full-time standard shift is <strong>7.6 hours</strong>. Current entry is{" "}
              <strong>{form.watch("hours_logged")} hours</strong>.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
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
                ? "Update"
                : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EntryForm;
