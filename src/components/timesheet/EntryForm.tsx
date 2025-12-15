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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay, formatDate, getHoursDifference } from "@/lib/date-utils";
import { timeEntryFormSchema, TimeEntryFormValues } from "./time-entry/schema";
import { fetchUserById } from "@/lib/user-service";

interface EntryFormProps {
  userId: string;
  date: Date;
  existingEntry?: TimesheetEntry;
  onSave: (savedEntry?: TimesheetEntry) => void;
  onCancel: () => void;
}

const MANDATORY_BREAK_MINUTES = 30;

const EntryForm: React.FC<EntryFormProps> = ({
  userId,
  date,
  existingEntry,
  onSave,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeTeaBreak, setIncludeTeaBreak] = useState(
    existingEntry?.tea_break_minutes ? existingEntry.tea_break_minutes > 0 : false
  );

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      hours_logged: existingEntry?.hours_logged || 7.5,
      start_time: existingEntry?.start_time || "09:00",
      end_time: existingEntry?.end_time || "17:00",
      break_minutes: MANDATORY_BREAK_MINUTES,
      tea_break_minutes: existingEntry?.tea_break_minutes || 0,
    },
  });

  useEffect(() => {
    const loadDefaults = async () => {
      if (existingEntry) {
        setIncludeTeaBreak(existingEntry.tea_break_minutes > 0);
        form.reset({
          hours_logged: existingEntry.hours_logged,
          start_time: existingEntry.start_time || "09:00",
          end_time: existingEntry.end_time || "17:00",
          break_minutes: MANDATORY_BREAK_MINUTES,
          tea_break_minutes: existingEntry.tea_break_minutes || 0,
        });
      } else {
        // Fetch user's default times for new entries
        const userProfile = await fetchUserById(userId);
        const defaultStart = userProfile?.default_start_time?.slice(0, 5) || "09:00";
        const defaultEnd = userProfile?.default_end_time?.slice(0, 5) || "17:00";
        
        setIncludeTeaBreak(false);
        form.reset({
          hours_logged: 7.5,
          start_time: defaultStart,
          end_time: defaultEnd,
          break_minutes: MANDATORY_BREAK_MINUTES,
          tea_break_minutes: 0,
        });
      }
    };
    loadDefaults();
  }, [existingEntry, form, userId]);

  // Auto-calculate hours when time range or tea break changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_time' || name === 'end_time' || name === 'tea_break_minutes') {
        const startTime = value.start_time;
        const endTime = value.end_time;
        const teaBreakMinutes = value.tea_break_minutes ?? 0;
        
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
            const totalBreakMinutes = MANDATORY_BREAK_MINUTES + teaBreakMinutes;
            const breakHours = totalBreakMinutes / 60;
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
        tea_break_minutes: values.tea_break_minutes,
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
            name="tea_break_minutes"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-tea-break"
                    checked={includeTeaBreak}
                    onCheckedChange={(checked) => {
                      setIncludeTeaBreak(!!checked);
                      if (!checked) {
                        field.onChange(0);
                      } else {
                        field.onChange(15); // Default to 15 min when enabled
                      }
                    }}
                  />
                  <Label htmlFor="include-tea-break" className="text-sm font-medium cursor-pointer">
                    Include Tea Break
                  </Label>
                </div>
                
                {includeTeaBreak && (
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                      className="flex gap-4 pl-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="15" id="tea-15" />
                        <Label htmlFor="tea-15" className="cursor-pointer">15 minutes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30" id="tea-30" />
                        <Label htmlFor="tea-30" className="cursor-pointer">30 minutes</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                )}
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
                    min="0.25"
                    max="24"
                    readOnly
                    className="bg-muted cursor-not-allowed"
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
