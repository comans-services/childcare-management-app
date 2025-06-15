import React, { useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from "@/components/ui/command";
import { Main } from "@/components/ui/main"
import { toast } from "@/hooks/use-toast";
import {
  deleteAllTimesheetEntries
} from "@/lib/timesheet-service";
import WeeklyView from "@/components/timesheet/weekly-view/WeeklyView";

const TimesheetPage: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const formattedWeekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  const deleteAllEntries = async () => {
    if (!user?.id) return;
    
    try {
      await deleteAllTimesheetEntries(user.id); // Pass the required user ID
      toast({
        title: "Success",
        description: "All timesheet entries have been deleted.",
      });
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Error deleting entries:", error);
      toast({
        title: "Error",
        description: "Failed to delete timesheet entries.",
        variant: "destructive",
      });
    }
  };

  return (
    <Main>
      <div className="container mx-auto py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Timesheet</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-[240px] justify-start text-left font-normal"
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedWeekRange}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  weekStartsOn={1}
                  selected={date}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={() => setDate(addDays(date, -7))}>Previous Week</Button>
            <Button onClick={() => setDate(addDays(date, 7))}>Next Week</Button>
            <Button variant="destructive" onClick={() => setIsDeleteAllOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </Button>
          </div>
        </div>

        <WeeklyView weekDates={[
          startOfWeek(date, { weekStartsOn: 1 }),
          addDays(startOfWeek(date, { weekStartsOn: 1 }), 1),
          addDays(startOfWeek(date, { weekStartsOn: 1 }), 2),
          addDays(startOfWeek(date, { weekStartsOn: 1 }), 3),
          addDays(startOfWeek(date, { weekStartsOn: 1 }), 4),
          addDays(startOfWeek(date, { weekStartsOn: 1 }), 5),
          endOfWeek(date, { weekStartsOn: 1 })
        ]} />
      </div>

      {/* Delete All Confirmation Dialog */}
      {isDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Delete All Entries?</h2>
            <p className="mb-4">Are you sure you want to delete all timesheet entries? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsDeleteAllOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteAllEntries}>Delete All</Button>
            </div>
          </div>
        </div>
      )}
    </Main>
  );
};

export default TimesheetPage;
