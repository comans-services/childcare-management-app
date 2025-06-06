
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
    <div className="space-y-4 lg:space-y-5">
      <div>
        <FormField
          control={control}
          name="hours_logged"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-fluid-md lg:text-fluid-lg font-medium">
                Time span*
              </FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.25" 
                    {...field} 
                    className="w-20 lg:w-24 text-fluid-base" 
                  />
                </FormControl>
                <span className="text-fluid-sm lg:text-fluid-base text-gray-600">hours</span>
              </div>
              <FormMessage className="text-fluid-xs lg:text-fluid-sm" />
            </FormItem>
          )}
        />
      </div>

      {/* Enhanced responsive time inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        <FormField
          control={control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-fluid-sm lg:text-fluid-md font-medium">
                <span className="hidden sm:inline">Start time</span>
                <span className="sm:hidden">Start</span>
                <span className="text-gray-500 ml-1">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input 
                  type="time" 
                  {...field} 
                  className="text-fluid-sm lg:text-fluid-base" 
                />
              </FormControl>
              <FormMessage className="text-fluid-xs" />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-fluid-sm lg:text-fluid-md font-medium">
                <span className="hidden sm:inline">End time</span>
                <span className="sm:hidden">End</span>
                <span className="text-gray-500 ml-1">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input 
                  type="time" 
                  {...field} 
                  className="text-fluid-sm lg:text-fluid-base" 
                />
              </FormControl>
              <FormMessage className="text-fluid-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
