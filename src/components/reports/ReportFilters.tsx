import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateRangeFilter } from "./filters/DateRangeFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { FilterActions } from "./filters/FilterActions";
import { useReportGeneration } from "./filters/hooks/useReportGeneration";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setAuditData: React.Dispatch<React.SetStateAction<any[]>>;
  setScheduleData?: React.Dispatch<React.SetStateAction<any>>;
  setRoomData?: React.Dispatch<React.SetStateAction<any>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  setFilters,
  setReportData,
  setAuditData,
  setScheduleData,
  setRoomData,
  setIsLoading,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const { generateReport, isGeneratingReport } = useReportGeneration({
    filters,
    setReportData,
    setAuditData,
    setScheduleData,
    setRoomData,
    setIsLoading,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, employment_type, organization")
        .eq("is_active", true)
        .order("full_name");
      if (data) setUsers(data);
    };

    const fetchRooms = async () => {
      const { data } = await supabase
        .from("childcare_rooms")
        .select("id, name, room_number")
        .eq("is_active", true)
        .order("room_number");
      if (data) setRooms(data);
    };

    fetchUsers();
    fetchRooms();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div className="lg:col-span-3">
            <DateRangeFilter 
              filters={filters} 
              setFilters={setFilters} 
            />
          </div>

          {/* User Filter */}
          {filters.reportType !== "rooms" && (
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={filters.userIds?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    userIds: value === "all" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employment Type Filter */}
          {filters.reportType === "timesheet" && (
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={filters.employmentType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    employmentType: value === "all" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Room Filter */}
          {filters.reportType === "rooms" && (
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={filters.roomIds?.[0] || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    roomIds: value === "all" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number} - {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Type for Audit Logs */}
          {filters.reportType === "audit" && (
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={filters.actionType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    actionType: value === "all" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Display Options */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeEmployeeIds"
              checked={filters.includeEmployeeIds}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  includeEmployeeIds: checked as boolean,
                }))
              }
            />
            <Label htmlFor="includeEmployeeIds" className="font-normal cursor-pointer">
              Include Employee IDs
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeOrganization"
              checked={filters.includeOrganization}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  includeOrganization: checked as boolean,
                }))
              }
            />
            <Label htmlFor="includeOrganization" className="font-normal cursor-pointer">
              Include Organization
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTimeZone"
              checked={filters.includeTimeZone}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  includeTimeZone: checked as boolean,
                }))
              }
            />
            <Label htmlFor="includeTimeZone" className="font-normal cursor-pointer">
              Include Time Zone
            </Label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t">
          <FilterActions
            generateReport={generateReport}
            isGeneratingReport={isGeneratingReport}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
