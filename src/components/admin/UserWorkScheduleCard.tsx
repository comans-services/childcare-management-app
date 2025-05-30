
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WorkScheduleSelector from "@/components/timesheet/weekly-view/WorkScheduleSelector";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";

interface UserWorkScheduleCardProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
}

const UserWorkScheduleCard: React.FC<UserWorkScheduleCardProps> = ({ user }) => {
  const { workingDays, updateWorkingDays } = useWorkSchedule(user.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {user.full_name || user.email}
          </CardTitle>
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role || "employee"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardHeader>
      <CardContent>
        <WorkScheduleSelector
          workingDays={workingDays}
          onWorkingDaysChange={updateWorkingDays}
        />
        <div className="mt-3 text-sm text-muted-foreground">
          Weekly target: {workingDays * 8} hours
        </div>
      </CardContent>
    </Card>
  );
};

export default UserWorkScheduleCard;
