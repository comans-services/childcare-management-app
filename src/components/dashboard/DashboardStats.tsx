
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from "recharts";
import { CheckCircle2, Clock, ClipboardCheck, Calendar, TimerIcon, Settings } from "lucide-react";

interface DashboardStatsProps {
  hasEntries: boolean;
  expectedHoursToDate: number;
  hoursLoggedToDate: number;
  weekProgress: number;
  completeWeek: boolean;
  allDaysHaveEntries: boolean;
  isTodayComplete: boolean;
  workingDays: number;
  weeklyTarget: number;
}

const getColorByPercentage = (percentage: number): string => {
  if (percentage <= 25) {
    return "#ea384c"; // Red for 25% or lower
  } else if (percentage < 100) {
    return "#FFBB28"; // Yellow for between 25% and 100%
  } else {
    return "#00C49F"; // Green for 100%
  }
};

const DashboardStats: React.FC<DashboardStatsProps> = ({
  hasEntries,
  expectedHoursToDate,
  hoursLoggedToDate,
  weekProgress,
  completeWeek,
  allDaysHaveEntries,
  isTodayComplete,
  workingDays,
  weeklyTarget,
}) => {
  const statsData = [
    {
      name: "Week Progress",
      value: Math.round(weekProgress),
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      description: `${Math.round(weekProgress)}% Complete`,
      color: getColorByPercentage(Math.round(weekProgress))
    },
    {
      name: "Status",
      value: Math.round(completeWeek ? 100 : weekProgress),
      icon: <Calendar className="h-5 w-5 text-amber-500" />,
      description: completeWeek && allDaysHaveEntries ? "Complete" : isTodayComplete ? "In Progress" : "Pending",
      color: getColorByPercentage(completeWeek ? 100 : Math.round(weekProgress))
    }
  ];

  const radialData = statsData.map((item) => ({
    name: item.name,
    value: item.value,
    fill: item.color
  }));

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TimerIcon className="h-5 w-5 text-blue-500" />
          Timesheet Status
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            <Settings className="h-4 w-4" />
            {workingDays} day schedule
          </div>
        </CardTitle>
        <CardDescription>Your weekly timesheet statistics based on your {workingDays}-day work schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Has entries
                  </TableCell>
                  <TableCell className={hasEntries ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                    {hasEntries ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Expected hours
                  </TableCell>
                  <TableCell>{expectedHoursToDate} hours</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-purple-500" />
                    Hours logged
                  </TableCell>
                  <TableCell>{hoursLoggedToDate} hours</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-500" />
                    Weekly target
                  </TableCell>
                  <TableCell>{weeklyTarget} hours ({workingDays} days)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Week completion
                  </TableCell>
                  <TableCell className={completeWeek && allDaysHaveEntries ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                    {weekProgress.toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    All working days have entries
                  </TableCell>
                  <TableCell className={allDaysHaveEntries ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                    {allDaysHaveEntries ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="90%" 
                data={radialData} 
                startAngle={90} 
                endAngle={-270}
                barSize={15}
              >
                <RadialBar
                  background={{fill: "#f5f5f5"}}
                  dataKey="value"
                  cornerRadius={15}
                  label={{
                    position: 'insideStart',
                    fill: '#fff',
                    formatter: (value) => `${value}%`,
                  }}
                />
                <Legend 
                  iconSize={10}
                  layout="vertical" 
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: '10px'
                  }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Completion']}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStats;
