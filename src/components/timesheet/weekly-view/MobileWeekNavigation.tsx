
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, CalendarDays } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";

interface MobileWeekNavigationProps {
  weekDates: Date[];
  currentDate: Date;
  navigateToPrevious: () => void;
  navigateToNext: () => void;
  navigateToCurrentWeek: () => void;
  error: string | null;
  fetchData: () => void;
  viewMode: "today" | "week";
  toggleViewMode: () => void;
}

const MobileWeekNavigation: React.FC<MobileWeekNavigationProps> = ({
  weekDates,
  currentDate,
  navigateToPrevious,
  navigateToNext,
  navigateToCurrentWeek,
  error,
  fetchData,
  viewMode,
  toggleViewMode,
}) => {
  const isWeekMode = viewMode === "week";
  const navigationLabel = isWeekMode ? "Previous" : "Previous";
  const nextLabel = isWeekMode ? "Next" : "Next";
  
  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        {/* Date Display */}
        <div className="text-center mb-4">
          <div className="text-lg font-semibold text-primary">
            {weekDates.length > 0 && (
              viewMode === "today" 
                ? formatDateDisplay(currentDate) 
                : `${formatDateDisplay(weekDates[0])} - ${formatDateDisplay(weekDates[weekDates.length - 1])}`
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={navigateToPrevious}
            className="flex-1 h-12 shadow-sm hover:shadow-md transition-all duration-200 min-w-0"
            aria-label={`Previous ${isWeekMode ? 'week' : 'day'}`}
          >
            <ChevronLeft className="h-5 w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{navigationLabel}</span>
          </Button>
          
          <Button
            variant={viewMode === "today" ? "default" : "outline"}
            size="lg"
            onClick={toggleViewMode}
            className="flex-1 h-12 shadow-sm hover:shadow-md transition-all duration-200 min-w-0"
            aria-label="Toggle view mode"
          >
            {viewMode === "today" ? (
              <>
                <Calendar className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Today</span>
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Week</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={navigateToNext}
            className="flex-1 h-12 shadow-sm hover:shadow-md transition-all duration-200 min-w-0"
            aria-label={`Next ${isWeekMode ? 'week' : 'day'}`}
          >
            <span className="truncate">{nextLabel}</span>
            <ChevronRight className="h-5 w-5 ml-1 sm:ml-2 flex-shrink-0" />
          </Button>
        </div>

        {/* Error Retry */}
        {error && (
          <div className="mt-4">
            <Button 
              onClick={fetchData} 
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-primary"
              aria-label="Retry loading data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileWeekNavigation;
