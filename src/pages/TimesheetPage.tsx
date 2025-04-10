
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

  const handleDeleteAllEntries = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
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
    <div className="container mx-auto px-2 md:px-4">
      <div className="mb-4 md:mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">My Timesheet</h1>
          <p className="text-gray-600 text-sm md:text-base">Track and manage your working hours</p>
        </div>
        
        {user && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Reset All Entries
          </Button>
        )}
      </div>

      {/* Show timer prominently on mobile devices */}
      {isMobile && user && (
        <TimerComponent />
      )}

      <Card className="mb-4 md:mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg md:text-xl">Weekly Overview</CardTitle>
          <CardDescription className="text-sm">Your time entries for the current week</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {user ? (
            <WeeklyView key={refreshKey} />
          ) : (
            <div className="p-4 md:p-8 text-center">
              <p className="text-gray-500">Please sign in to view your timesheet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show timer below weekly view on desktop */}
      {!isMobile && user && (
        <TimerComponent />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Entries</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your timesheet entries. 
              This cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllEntries}
              className="bg-destructive text-destructive-foreground"
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
