
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { User } from "@/lib/user-service"; 
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDisplay } from "@/lib/date-utils";

interface ReportChartsProps {
  reportData: TimesheetEntry[];
  projects: Project[];
  users: User[];
  isLoading: boolean;
}

const ReportCharts = ({ reportData, projects, users, isLoading }: ReportChartsProps) => {
  // Create maps for quick lookups
  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(project => map.set(project.id, project));
    return map;
  }, [projects]);
  
  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  // Process data for project distribution chart
  const projectDistribution = React.useMemo(() => {
    const projectHours: Record<string, number> = {};
    
    reportData.forEach((entry) => {
      const projectId = entry.project_id;
      projectHours[projectId] = (projectHours[projectId] || 0) + entry.hours_logged;
    });
    
    return Object.keys(projectHours).map((projectId) => {
      const project = projectMap.get(projectId);
      return {
        name: project?.name || "Unknown Project",
        value: projectHours[projectId],
      };
    }).sort((a, b) => b.value - a.value); // Sort by hours descending
  }, [reportData, projectMap]);

  // Process data for employee distribution chart
  const employeeDistribution = React.useMemo(() => {
    const employeeHours: Record<string, number> = {};
    
    reportData.forEach((entry) => {
      const userId = entry.user_id;
      employeeHours[userId] = (employeeHours[userId] || 0) + entry.hours_logged;
    });
    
    return Object.keys(employeeHours).map((userId) => {
      const employee = userMap.get(userId);
      return {
        name: employee?.full_name || "Unknown Employee",
        value: employeeHours[userId],
      };
    }).sort((a, b) => b.value - a.value); // Sort by hours descending
  }, [reportData, userMap]);

  // Process data for daily distribution chart
  const dailyDistribution = React.useMemo(() => {
    const dailyHours: Record<string, number> = {};
    
    reportData.forEach((entry) => {
      const date = new Date(entry.entry_date);
      const dateStr = formatDateDisplay(date);
      dailyHours[dateStr] = (dailyHours[dateStr] || 0) + entry.hours_logged;
    });
    
    return Object.keys(dailyHours).map((date) => ({
      date,
      hours: dailyHours[date],
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
  }, [reportData]);

  const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#06b6d4', '#22c55e', '#f59e0b', '#6366f1', '#10b981', '#6b7280'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array(3).fill(0).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reportData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available. Please adjust your filters and generate a report.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
          <CardDescription>Hours logged by project</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ projectDistribution: {} }}>
            <PieChart width={400} height={300}>
              <Pie
                data={projectDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {projectDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Distribution</CardTitle>
          <CardDescription>Hours logged by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ employeeDistribution: {} }}>
            <PieChart width={400} height={300}>
              <Pie
                data={employeeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {employeeDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[(index + 3) % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Daily Distribution</CardTitle>
          <CardDescription>Hours logged per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ dailyDistribution: {} }}>
            <BarChart
              data={dailyDistribution}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
              <Legend />
              <Bar dataKey="hours" name="Hours" fill="#8B5CF6" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCharts;
