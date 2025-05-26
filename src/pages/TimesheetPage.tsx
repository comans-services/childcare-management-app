
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

const TimesheetPage = () => {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if no user is authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6 max-w-[110%] w-full">
        <div className="p-4 md:p-8 text-center">
          <p className="text-gray-500">Please sign in to view your timesheet</p>
        </div>
      </div>
    );
  }

  const handleDeleteAllEntries = async () => {
    setIsDeleting(true);
    try {
      // Only delete entries for the current authenticated user
      const deletedCount = await deleteAllTimesheetEntries(user.id);
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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-6 max-w-[110%] w-full">
      <div className="mb-6 md:mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">My Timesheet</h1>
          <p className="text-gray-600 text-sm md:text-base">Track and manage your working hours</p>
        </div>
        
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Reset All Entries
        </Button>
      </div>

      {/* Show timer prominently on mobile devices */}
      {isMobile && (
        <TimerComponent />
      )}

      <Card className="mb-6 md:mb-8 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg md:text-xl font-semibold">Weekly Overview</CardTitle>
          <CardDescription className="text-sm">Your time entries for the current week</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Pass only the current user's ID to WeeklyView - no external user targeting allowed */}
          <WeeklyView key={refreshKey} userId={user.id} />
        </CardContent>
      </Card>

      {/* Show timer below weekly view on desktop */}
      {!isMobile && (
        <TimerComponent />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl border-red-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Entries</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your timesheet entries. 
              This cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="hover:scale-105 transition-transform duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllEntries}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
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
