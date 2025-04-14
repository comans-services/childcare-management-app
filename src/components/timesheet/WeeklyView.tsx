import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentWeekDates,
  getNextWeek,
  getPreviousWeek,
  formatDateDisplay,
  formatDate,
} from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react";
import {
  fetchUserProjects,
  fetchTimesheetEntries,
  Project,
  TimesheetEntry,
  saveTimesheetEntry,
} from "@/lib/timesheet-service";
import DayColumn from "./DayColumn";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WeeklyView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [weeklyTarget] = useState(40); // Default weekly target of 40 hours
  
  useEffect(() => {
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      // Fetch projects first
      const projectsData = await fetchUserProjects()
        .catch(err => {
          console.error("Projects error:", err);
          setError("Failed to load projects. Please try again.");
          return [] as Project[];
        });
      
      setProjects(projectsData);
      
      // Then fetch entries if we have valid dates
      if (weekDates.length > 0) {
        const entriesData = await fetchTimesheetEntries(
          user.id,
          weekDates[0],
          weekDates[weekDates.length - 1]
        ).catch(err => {
          console.error("Entries error:", err);
          setError("Failed to load timesheet entries. Please try again.");
          return [] as TimesheetEntry[];
        });
        
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      setError("Failed to load timesheet data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekDates.length > 0 && user) {
      fetchData();
    }
  }, [weekDates, user]);

  const navigateToPreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  const navigateToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  const totalWeekHours = entries.reduce((sum, entry) => {
    const hoursLogged = Number(entry.hours_logged) || 0;
    return sum + hoursLogged;
  }, 0);
  
  const weekProgress = Math.min((totalWeekHours / weeklyTarget) * 100, 100);
  
  const getProgressColor = () => {
    if (weekProgress < 30) return "bg-amber-500";
    if (weekProgress < 70) return "bg-blue-500";
    if (weekProgress < 100) return "bg-emerald-500";
    return "bg-violet-500"; // Over 100%
  };

  // Handle drag and drop between days
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // If dropped outside a droppable area or in the same position
    if (!destination) return;
    
    // Get the entry that was dragged
    const draggedEntry = entries.find(entry => entry.id === draggableId);
    if (!draggedEntry) return;
    
    // Get source and destination dates
    const sourceDate = weekDates[parseInt(source.droppableId)];
    const destDate = weekDates[parseInt(destination.droppableId)];
    
    // If moving within the same day, we don't need to update anything
    if (source.droppableId === destination.droppableId) return;
    
    try {
      // Create a copy of the entry with the updated date
      const updatedEntry: TimesheetEntry = {
        ...draggedEntry,
        entry_date: formatDate(destDate)
      };
      
      // Update the entry in the database
      const savedEntry = await saveTimesheetEntry(updatedEntry);
      
      // Update local state
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === savedEntry.id ? savedEntry : entry
        )
      );
      
      toast({
        title: "Entry moved",
        description: `Entry moved to ${formatDateDisplay(destDate)}`,
      });
    } catch (error) {
      console.error("Failed to update entry date:", error);
      toast({
        title: "Error",
        description: "Failed to move entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderDesktopView = () => (
    <div 
      className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full overflow-hidden animate-in fade-in-50" 
      style={{ transform: 'scale(1.2)' }} // Increase size by 20%
    >
      {weekDates.map((date, index) => (
        <div key={date.toISOString()} className="w-full min-w-0 max-w-full">
          <DayColumn
            date={date}
            userId={user?.id || ""}
            entries={entries}
            projects={projects}
            onEntryChange={fetchData}
            droppableId={index.toString()}
          />
        </div>
      ))}
    </div>
  );

  const renderMobileView = () => (
    <Carousel 
      className="w-full max-w-full animate-in fade-in-50" 
      style={{ transform: 'scale(1.2)' }} // Increase size by 20%
    >
      <CarouselContent>
        {weekDates.map((date, index) => (
          <CarouselItem key={date.toISOString()} className="basis-full min-w-0">
            <DayColumn
              date={date}
              userId={user?.id || ""}
              entries={entries}
              projects={projects}
              onEntryChange={fetchData}
              droppableId={index.toString()}
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
    <div className="space-y-4 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navigateToPreviousWeek}
                  className="shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View previous week</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToCurrentWeek}
                  className="shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-1"
                  aria-label="Current week"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Today</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to current week</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navigateToNextWeek}
                  className="shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View next week</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {error && (
            <Button 
              onClick={fetchData} 
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary animate-pulse"
              aria-label="Retry loading data"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span>Retry</span>
            </Button>
          )}
        </div>
        <div className="font-medium text-sm md:text-base">
          {weekDates.length > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary whitespace-nowrap">
              {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[weekDates.length - 1])}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 animate-pulse">
          <div className="text-center">
            <div className="text-lg">Loading timesheet data...</div>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center py-10">
          <div className="text-center animate-in fade-in-50">
            <div className="text-red-500">{error}</div>
            <Button 
              onClick={fetchData} 
              variant="outline"
              className="mt-4 hover:scale-105 transition-transform duration-200"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-full overflow-hidden">
          {projects.length === 0 ? (
            <div className="text-center py-8 animate-in fade-in-50">
              <p className="text-gray-500">No projects found. Please create a project first.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {isMobile ? renderMobileView() : renderDesktopView()}
            </DragDropContext>
          )}
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="mt-4 space-y-2 animate-in fade-in-50 duration-300">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Weekly Progress: {totalWeekHours.toFixed(2)}/{weeklyTarget} hours</span>
            <span className="text-sm font-medium">{weekProgress.toFixed(0)}%</span>
          </div>
          <Progress 
            value={weekProgress} 
            className="h-2" 
            indicatorClassName={getProgressColor()} 
          />
        </div>
      )}
    </div>
  );
};

export default WeeklyView;
