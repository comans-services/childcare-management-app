
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, CalendarDays } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import UserSelector from "../UserSelector";

interface WeekNavigationProps {
  weekDates: Date[];
  navigateToPreviousWeek: () => void;
  navigateToNextWeek: () => void;
  navigateToCurrentWeek: () => void;
  error: string | null;
  fetchData: () => void;
  viewMode: "today" | "week";
  toggleViewMode: () => void;
  selectedUserId?: string | null;
  onUserSelect?: (userId: string | null) => void;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  weekDates,
  navigateToPreviousWeek,
  navigateToNextWeek,
  navigateToCurrentWeek,
  error,
  fetchData,
  viewMode,
  toggleViewMode,
  selectedUserId,
  onUserSelect,
}) => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  return (
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
                onClick={toggleViewMode}
                className="shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-1"
                aria-label="Toggle view mode"
              >
                {viewMode === "today" ? (
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                )}
                <span>{viewMode === "today" ? "Today" : "Week"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch to {viewMode === "today" ? "week" : "today"} view</p>
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
      
      <div className="flex items-center gap-4">
        {/* User Selector - only visible for admins */}
        {isAdmin && onUserSelect && (
          <UserSelector 
            selectedUserId={selectedUserId || null}
            onUserSelect={onUserSelect}
          />
        )}
        
        {/* Date Display */}
        <div className="font-medium text-sm md:text-base">
          {weekDates.length > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary whitespace-nowrap">
              {viewMode === "today" 
                ? formatDateDisplay(new Date()) 
                : `${formatDateDisplay(weekDates[0])} - ${formatDateDisplay(weekDates[weekDates.length - 1])}`
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekNavigation;
