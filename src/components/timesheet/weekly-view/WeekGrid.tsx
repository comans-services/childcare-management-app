
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import DayColumn from "../DayColumn";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface WeekGridProps {
  weekDates: Date[];
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  onDragEnd: (result: DropResult) => void;
  onAddEntry: (date: Date) => void;
  onEditEntry: (date: Date, entry: TimesheetEntry) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({
  weekDates,
  userId,
  entries,
  projects,
  onEntryChange,
  onDragEnd,
  onAddEntry,
  onEditEntry,
}) => {
  const isMobile = useIsMobile();

  const renderDesktopView = () => (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 w-full overflow-hidden animate-in fade-in-50">
      {weekDates.map((date, index) => (
        <div key={date.toISOString()} className="w-full min-w-0 max-w-full">
          <DayColumn
            date={date}
            userId={userId}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            droppableId={index.toString()}
            onAddEntry={() => onAddEntry(date)}
            onEditEntry={(entry) => onEditEntry(date, entry)}
          />
        </div>
      ))}
    </div>
  );

  const renderMobileView = () => (
    <Carousel className="w-full max-w-full animate-in fade-in-50">
      <CarouselContent>
        {weekDates.map((date, index) => (
          <CarouselItem key={date.toISOString()} className="basis-full min-w-0">
            <DayColumn
              date={date}
              userId={userId}
              entries={entries}
              projects={projects}
              onEntryChange={onEntryChange}
              droppableId={index.toString()}
              onAddEntry={() => onAddEntry(date)}
              onEditEntry={(entry) => onEditEntry(date, entry)}
            />
          </CarouselItem>
        ))}
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
