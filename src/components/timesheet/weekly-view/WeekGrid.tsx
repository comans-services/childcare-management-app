
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import DayColumn from "../DayColumn";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { isWeekend } from "@/lib/date-utils";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface WeekGridProps {
  weekDates: Date[];
  currentDate: Date;
  entries: TimesheetEntry[];
  projects: Project[];
  userId: string;
  onEntryChange: () => void;
  onDragEnd: (result: DropResult) => void;
  onAddEntry?: (date: Date) => void;
  onEditEntry?: (date: Date, entry: TimesheetEntry) => void;
  viewMode: "today" | "week";
}

const WeekGrid: React.FC<WeekGridProps> = ({
  weekDates,
  currentDate,
  entries,
  projects,
  userId,
  onEntryChange,
  onDragEnd,
  onAddEntry,
  onEditEntry,
  viewMode,
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { validateWeekendEntry } = useWeekendLock(userId);
  
  // Use the weekDates directly - the parent component already filters correctly
  // In day mode, weekDates will contain only the selected date
  // In week mode, weekDates will contain the visible days (filtered by parent)
  const displayDates = weekDates;

  // Calculate dynamic grid columns based on number of visible days
  const getGridColumns = () => {
    if (viewMode === "today") return "grid-cols-1";
    
    const dayCount = displayDates.length;
    if (dayCount === 5) return "grid-cols-1 md:grid-cols-5"; // Weekdays only
    if (dayCount === 6) return "grid-cols-1 md:grid-cols-6"; // 6 days
    return "grid-cols-1 md:grid-cols-7"; // Full week
  };

  const renderDesktopView = () => (
    <div className={`grid gap-2 w-full overflow-hidden animate-in fade-in-50 ${getGridColumns()}`}>
      {displayDates.map((date, index) => {
        const isWeekendDay = isWeekend(date);
        const weekendValidation = validateWeekendEntry(date);
        const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;
        
        return (
          <div 
            key={date.toISOString()} 
            className={`w-full min-w-0 max-w-full transition-all duration-200 ${
              isWeekendBlocked ? 'opacity-75 scale-[0.98]' : ''
            }`}
          >
            <DayColumn
              date={date}
              userId={userId}
              entries={entries}
              projects={projects}
              onEntryChange={onEntryChange}
              droppableId={index.toString()}
              onAddEntry={onAddEntry ? () => onAddEntry(date) : undefined}
              onEditEntry={onEditEntry ? (entry) => onEditEntry(date, entry) : undefined}
            />
          </div>
        );
      })}
    </div>
  );

  const renderMobileView = () => (
    <Carousel className="w-full max-w-full animate-in fade-in-50">
      <CarouselContent>
        {displayDates.map((date, index) => {
          const isWeekendDay = isWeekend(date);
          const weekendValidation = validateWeekendEntry(date);
          const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;
          
          return (
            <CarouselItem 
              key={date.toISOString()} 
              className={`basis-full min-w-0 transition-all duration-200 ${
                isWeekendBlocked ? 'opacity-75' : ''
              }`}
            >
              <DayColumn
                date={date}
                userId={userId}
                entries={entries}
                projects={projects}
                onEntryChange={onEntryChange}
                droppableId={index.toString()}
                onAddEntry={onAddEntry ? () => onAddEntry(date) : undefined}
                onEditEntry={onEditEntry ? (entry) => onEditEntry(date, entry) : undefined}
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <div className="flex justify-center mt-2">
        <CarouselPrevious className="relative static mr-2 translate-y-0 translate-x-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" />
        <CarouselNext className="relative static ml-2 translate-y-0 translate-x-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" />
      </div>
    </Carousel>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {isMobile ? renderMobileView() : renderDesktopView()}
    </DragDropContext>
  );
};

export default WeekGrid;
