import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyView from "@/components/timesheet/WeeklyView";
import TimerComponent from "@/components/timesheet/TimerComponent";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { deleteAllTimesheetEntries } from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { getWeekStart } from "@/lib/date-utils";

const TimesheetPage = () => {
  const { user, userRole } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get current week's schedule
  const weekStartDate = getWeekStart(new Date());
  const {
    effectiveDays,
    effectiveHours
  } = useSimpleWeeklySchedule(user?.id || "", weekStartDate);

  // Redirect if no user is authenticated
  if (!user) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-8 text-center">
          <p className="text-gray-500">Please sign in to view your timesheet</p>
        </div>
      </div>
    );
  }

  const handleDeleteAllEntries = async () => {
    setIsDeleting(true);
    try {
      // RLS will ensure only current user's entries are deleted
      const deletedCount = await deleteAllTimesheetEntries();
      toast({
        title: "Entries deleted",
        description: `Successfully deleted ${deletedCount} timesheet entries.`,
      });
      // Force refresh of the WeeklyView component
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting entries:", error);
      toast({
        title: "Error",
        description: "Failed to delete timesheet entries.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section with improved mobile spacing */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            My Timesheet
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2">
            Track and manage your working hours
            <span className="hidden sm:inline"> - {effectiveDays} days</span>
          </p>
        </div>
        
        <Button 
          variant="destructive" 
          size={isMobile ? "default" : "sm"}
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md flex-shrink-0"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Reset All Entries</span>
          <span className="hidden sm:inline">Reset All</span>
        </Button>
      </div>

      {/* Mobile timer with proper spacing */}
      {isMobile && (
        <div className="mb-6">
          <TimerComponent />
        </div>
      )}

      {/* Weekly overview card with consistent padding */}
      <Card className="mb-6 lg:mb-8 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Weekly Overview
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your time entries for the current week
            <span className="hidden lg:inline"> - {effectiveDays} days expected per week</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {/* WeeklyView now handles user filtering internally via RLS */}
          <WeeklyView key={refreshKey} />
        </CardContent>
      </Card>

      {/* Desktop timer with consistent spacing */}
      {!isMobile && (
        <div className="hidden md:block">
          <TimerComponent />
        </div>
      )}

      {/* Delete confirmation dialog with responsive sizing */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl border-red-200 shadow-lg w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg lg:text-xl">
              Delete All Entries
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm lg:text-base leading-relaxed">
              This action will permanently delete all your timesheet entries. 
              This cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogCancel 
              disabled={isDeleting} 
              className="hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllEntries}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete All Entries"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimesheetPage;
