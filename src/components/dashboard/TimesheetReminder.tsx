import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock, CalendarClock, Settings } from "lucide-react";
interface TimesheetReminderProps {
  hasEntries: boolean;
  completeWeek: boolean;
  allDaysHaveEntries: boolean;
  isLate: boolean;
  weekProgress: number;
  daysRemaining: number;
  caughtUp: boolean;
  deadlineMessage: string;
  workingDays: number;
  weeklyTarget: number;
}
const TimesheetReminder: React.FC<TimesheetReminderProps> = ({
  hasEntries,
  completeWeek,
  allDaysHaveEntries,
  isLate,
  weekProgress,
  daysRemaining,
  caughtUp,
  deadlineMessage,
  workingDays,
  weeklyTarget
}) => {
  const navigate = useNavigate();
  const getTimesheetCardStyle = () => {
    if (!hasEntries) {
      return {
        background: "bg-yellow-50",
        border: "border-yellow-200",
        title: "text-yellow-800",
        text: "text-yellow-700",
        button: "text-yellow-600 border-yellow-300 hover:bg-yellow-100"
      };
    } else if ((completeWeek || weekProgress >= 100) && allDaysHaveEntries) {
      return {
        background: "bg-green-50",
        border: "border-green-200",
        title: "text-green-800",
        text: "text-green-700",
        button: "text-green-600 border-green-300 hover:bg-green-100"
      };
    } else if (isLate) {
      return {
        background: "bg-red-50",
        border: "border-red-200",
        title: "text-red-800",
        text: "text-red-700",
        button: "text-red-600 border-red-300 hover:bg-red-100"
      };
    } else {
      return {
        background: "bg-amber-50",
        border: "border-amber-200",
        title: "text-amber-800",
        text: "text-amber-700",
        button: "text-amber-600 border-amber-300 hover:bg-amber-100"
      };
    }
  };
  const cardStyle = getTimesheetCardStyle();
  return <Card className={`${cardStyle.background} ${cardStyle.border}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center gap-2 ${cardStyle.title}`}>
          <AlertCircle className="h-5 w-5" />
          Weekly Timesheet Reminder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`mb-2 ${cardStyle.text}`}>
          {!hasEntries ? `You haven't entered any timesheet data for this week yet. Your current schedule is ${workingDays} working days.` : completeWeek && allDaysHaveEntries ? `Great job! You've completed your timesheet entries for this week (${workingDays} days).` : !allDaysHaveEntries ? `Please ensure you have at least one entry for each of your ${workingDays} working days.` : "All timesheet entries for this week must be completed by Friday 5:00 PM. Data will be processed over the weekend."}
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className={cardStyle.text}>This Week's Progress</span>
            <span className={cardStyle.text}>
              {hasEntries ? `${Math.round(weekProgress)}% Complete (${workingDays} days target)` : "No entries yet"}
            </span>
          </div>
          <Progress value={weekProgress} className="h-2" indicatorClassName={!hasEntries ? "bg-yellow-500" : completeWeek && allDaysHaveEntries ? "bg-green-500" : isLate ? "bg-red-500" : "bg-amber-500"} />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button onClick={() => navigate("/timesheet")} variant="outline" className={cardStyle.button}>
          <CalendarClock className="mr-2 h-4 w-4" />
          {hasEntries && completeWeek && allDaysHaveEntries ? "View Timesheet" : "Enter Timesheet"}
        </Button>
      </CardFooter>
    </Card>;
};
export default TimesheetReminder;