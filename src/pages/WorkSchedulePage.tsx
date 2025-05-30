
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import WorkScheduleWeekNavigation from "@/components/admin/WorkScheduleWeekNavigation";
import UnifiedUserScheduleCard from "@/components/admin/UnifiedUserScheduleCard";
import { Button } from "@/components/ui/button";
import { getCurrentWeekDates, getNextWeek, getPreviousWeek } from "@/lib/date-utils";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

const WorkSchedulePage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  
  // Week navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Update week dates when current date changes
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  useEffect(() => {
    // Filter users based on search term with null safety checks
    const filtered = users.filter(
      (user) =>
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .order("email");

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateAllLocalStorageData = async () => {
    setMigrating(true);
    let migratedCount = 0;
    let errorCount = 0;

    try {
      for (const userData of users) {
        try {
          // Check for localStorage data for this user
          const localStorageKey = `timesheet-working-days-${userData.id}`;
          const localData = localStorage.getItem(localStorageKey);
          
          if (localData && !isNaN(parseInt(localData))) {
            // Check if user already has database record
            const { data: existingSchedule } = await supabase
              .from("work_schedules")
              .select("id")
              .eq("user_id", userData.id)
              .maybeSingle();

            if (!existingSchedule) {
              const workingDays = parseInt(localData);
              
              const { error } = await supabase
                .from("work_schedules")
                .insert({
                  user_id: userData.id,
                  working_days: workingDays,
                  created_by: user?.id
                });

              if (error) {
                console.error(`Error migrating data for user ${userData.email}:`, error);
                errorCount++;
              } else {
                console.log(`Migrated ${workingDays} days for user ${userData.email}`);
                migratedCount++;
                // Clean up localStorage
                localStorage.removeItem(localStorageKey);
              }
            }
          }
        } catch (err) {
          console.error(`Error processing user ${userData.email}:`, err);
          errorCount++;
        }
      }

      toast({
        title: "Migration Complete",
        description: `Migrated ${migratedCount} user schedules. ${errorCount} errors.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error during migration:", error);
      toast({
        title: "Migration Failed",
        description: "Failed to migrate localStorage data.",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  // Week navigation functions
  const navigateToPreviousWeek = () => {
    setCurrentDate(prevDate => getPreviousWeek(prevDate));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(prevDate => getNextWeek(prevDate));
  };

  const navigateToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="p-8 text-center">
          <p className="text-gray-500">Please sign in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Work Schedule Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage working days and weekly targets for all team members. Set default schedules and week-specific overrides.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Work Schedules</CardTitle>
              <CardDescription>
                Set default working day schedules and customize weekly targets for each team member.
              </CardDescription>
            </div>
            <Button 
              onClick={migrateAllLocalStorageData}
              disabled={migrating}
              variant="outline"
              size="sm"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate Old Data"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <WorkScheduleWeekNavigation
            weekDates={weekDates}
            navigateToPreviousWeek={navigateToPreviousWeek}
            navigateToNextWeek={navigateToNextWeek}
            navigateToCurrentWeek={navigateToCurrentWeek}
            error={null}
            fetchData={fetchUsers}
          />
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UnifiedUserScheduleCard 
                  key={`${user.id}-${weekDates[0]?.getTime()}`} 
                  user={user} 
                  weekStartDate={weekDates[0] || new Date()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkSchedulePage;
