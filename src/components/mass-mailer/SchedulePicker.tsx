import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SchedulePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export const SchedulePicker = ({ value, onChange }: SchedulePickerProps) => {
  const [selectedTime, setSelectedTime] = useState("09:00");

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = selectedTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onChange(date);
    } else {
      onChange(undefined);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (value) {
      const newDate = new Date(value);
      const [hours, minutes] = time.split(':');
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onChange(newDate);
    }
  };

  // Generate time slots every 30 minutes
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      timeSlots.push(`${h}:${m}`);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-lg font-medium mb-2 block">Select Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-14 text-base justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              {value ? format(value, "EEEE, MMMM d, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="text-lg font-medium mb-2 block">Select Time</label>
        <Select value={selectedTime} onValueChange={handleTimeChange}>
          <SelectTrigger className="h-14 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time} className="text-base">
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value && (
        <div className="p-4 bg-muted rounded-md">
          <p className="text-base">
            <span className="font-semibold">Will send on:</span>{" "}
            {format(value, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      )}
    </div>
  );
};
