
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Clock, Loader2, Calendar, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import UserWorkScheduleCard from "@/components/admin/UserWorkScheduleCard";
import WeeklyWorkScheduleView from "@/components/admin/WeeklyWorkScheduleView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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
          Manage working days and weekly targets for all team members
        </p>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Work Schedules</CardTitle>
                  <CardDescription>
                    Set the number of working days per week for each team member. Changes are automatically synced to their timesheets.
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
                    <UserWorkScheduleCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="space-y-6">
            {!selectedUser ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select User for Weekly Schedule</CardTitle>
                  <CardDescription>
                    Choose a user to manage their detailed weekly work schedule with specific hours per day.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                        <Card 
                          key={user.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedUser(user)}
                        >
                          <CardContent className="p-4">
                            <div className="font-medium">{user.full_name || user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Click to manage weekly schedule
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="mb-4"
                >
                  ← Back to User Selection
                </Button>
                <WeeklyWorkScheduleView user={selectedUser} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkSchedulePage;
