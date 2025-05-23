
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { TimeEntryFormValues } from "./schema";

interface TimeInputProps {
  control: Control<TimeEntryFormValues>;
}

export const TimeInput: React.FC<TimeInputProps> = ({ control }) => {
  return (
    <div className="space-y-5">
      <div>
        <FormField
          control={control}
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
            control={control}
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
            control={control}
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
  );
};
