
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import MobileDayColumn from "../day-column/MobileDayColumn";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface MobileWeekGridProps {
  weekDates: Date[];
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  onAddEntry: (date: Date) => void;
  onEditEntry: (date: Date, entry: TimesheetEntry) => void;
  viewMode: "today" | "week";
}

const MobileWeekGrid: React.FC<MobileWeekGridProps> = ({
  weekDates,
  userId,
  entries,
  projects,
  onEntryChange,
  onAddEntry,
  onEditEntry,
  viewMode,
}) => {
  // Use the weekDates directly - the parent component already filters correctly
  // In day mode, weekDates will contain only the selected date
  // In week mode, weekDates will contain the visible days (filtered by parent)
  const displayDates = weekDates;

  if (viewMode === "today") {
    // Single day view for day mode
    return (
      <div className="w-full animate-in fade-in-50">
        {displayDates.map((date) => (
          <MobileDayColumn
            key={date.toISOString()}
            date={date}
            userId={userId}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onAddEntry={() => onAddEntry(date)}
            onEditEntry={(entry) => onEditEntry(date, entry)}
          />
        ))}
      </div>
    );
  }

  // Carousel view for week mode
  return (
    <div className="w-full animate-in fade-in-50">
      <Carousel className="w-full">
        <CarouselContent className="ml-0 pl-4">
          {displayDates.map((date) => (
            <CarouselItem 
              key={date.toISOString()} 
              className="pl-0 pr-4 basis-full min-w-0"
            >
              <MobileDayColumn
                date={date}
                userId={userId}
                entries={entries}
                projects={projects}
                onEntryChange={onEntryChange}
                onAddEntry={() => onAddEntry(date)}
                onEditEntry={(entry) => onEditEntry(date, entry)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Controls */}
        <div className="flex justify-center items-center mt-6 space-x-4">
          <CarouselPrevious className="relative static translate-y-0 translate-x-0 h-12 w-12 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" />
          
          {/* Day Indicator - dynamic based on visible days */}
          <div className="flex space-x-1">
            {displayDates.map((date, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300"
              />
            ))}
          </div>
          
          <CarouselNext className="relative static translate-y-0 translate-x-0 h-12 w-12 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" />
        </div>
      </Carousel>
    </div>
  );
};

export default MobileWeekGrid;
