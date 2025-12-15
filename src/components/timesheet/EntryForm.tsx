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
import { timeEntryFormSchema, TimeEntryFormValues } from "./time-entry/schema";

interface EntryFormProps {
  userId: string;
  date: Date;
  existingEntry?: TimesheetEntry;
  onSave: (savedEntry?: TimesheetEntry) => void;
  onCancel: () => void;
}

const BREAK_OPTIONS = [
  { value: "0", label: "No break" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
];

const EntryForm: React.FC<EntryFormProps> = ({
  userId,
  date,
  existingEntry,
  onSave,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      hours_logged: existingEntry?.hours_logged || 7.5,
      start_time: existingEntry?.start_time || "09:00",
      end_time: existingEntry?.end_time || "17:00",
      break_minutes: existingEntry?.break_minutes ?? 30,
    },
  });

  useEffect(() => {
    if (existingEntry) {
      form.reset({
        hours_logged: existingEntry.hours_logged,
        start_time: existingEntry.start_time || "09:00",
        end_time: existingEntry.end_time || "17:00",
        break_minutes: existingEntry.break_minutes ?? 30,
      });
    } else {
      form.reset({
        hours_logged: 7.5,
        start_time: "09:00",
        end_time: "17:00",
        break_minutes: 30,
      });
    }
  }, [existingEntry, form]);

  // Auto-calculate hours when time range or break changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_time' || name === 'end_time' || name === 'break_minutes') {
        const startTime = value.start_time;
        const endTime = value.end_time;
        const breakMinutes = value.break_minutes ?? 30;
        
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
            const breakHours = breakMinutes / 60;
            const netHours = Math.max(0, Math.round((rawHours - breakHours) * 4) / 4);
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
    try {
      setIsSubmitting(true);

      const entry: TimesheetEntry = {
        id: existingEntry?.id,
        user_id: userId,
        entry_date: formatDate(date),
        hours_logged: values.hours_logged,
        start_time: values.start_time,
        end_time: values.end_time,
        break_minutes: values.break_minutes,
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
            name="break_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break (Lunch)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select break duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BREAK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                <FormLabel>Hours (after break)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                ? "Update Shift"
                : "Add Shift"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EntryForm;
