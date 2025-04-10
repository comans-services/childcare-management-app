import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, isToday, isFriday, getDay, parseISO, isSameDay } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import { AlertCircle, Clock, CalendarClock, Send, ClipboardCheck, Calendar, CheckCircle2, TimerIcon } from "lucide-react";
import { fetchTimesheetEntries, fetchUserProjects } from "@/lib/timesheet-service";
import { fetchCustomers } from "@/lib/customer-service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#8884D8", "#82CA9D", "#FFBDD3", "#FF6B6B", 
  "#6A7FDB", "#9ACEEB"
];

const Dashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isHRDialogOpen, setIsHRDialogOpen] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const today = new Date();
  const startDate = startOfWeek(today);
  const endDate = endOfWeek(today);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const { data: timesheetEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["timesheet", session?.user?.id, startDate, endDate],
    queryFn: () => session?.user?.id 
      ? fetchTimesheetEntries(session.user.id, startDate, endDate) 
      : Promise.resolve([]),
    enabled: !!session?.user?.id
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchUserProjects(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  const totalHours = timesheetEntries.reduce((sum, entry) => sum + entry.hours_logged, 0);
  
  const getDailyEntries = () => {
    const dailyEntries = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const formattedDay = format(day, "yyyy-MM-dd");
      
      const entriesForDay = timesheetEntries.filter(entry => {
        const entryDate = typeof entry.entry_date === 'string' 
          ? entry.entry_date 
          : format(entry.entry_date, "yyyy-MM-dd");
          
        return entryDate === formattedDay;
      });
      
      dailyEntries.push({
        date: day,
        entries: entriesForDay,
        hours: entriesForDay.reduce((sum, entry) => sum + entry.hours_logged, 0)
      });
    }
    
    return dailyEntries;
  };
  
  const dailyEntries = getDailyEntries();
  
  const projectHours = timesheetEntries.reduce((acc, entry) => {
    const projectId = entry.project_id;
    const projectName = entry.project?.name || "Unknown Project";
    
    if (!acc[projectId]) {
      acc[projectId] = {
        name: projectName,
        hours: 0
      };
    }
    
    acc[projectId].hours += entry.hours_logged;
    return acc;
  }, {});
  
  const projectsChartData = Object.values(projectHours);

  const customerHours = {};
  
  if (timesheetEntries.length > 0) {
    timesheetEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      if (!project) return;
      
      const customerId = project.customer_id;
      if (!customerId) return;
      
      const customer = customers.find(c => c.id === customerId);
      const customerName = customer ? customer.name : "Unknown Customer";
      
      if (!customerHours[customerId]) {
        customerHours[customerId] = {
          name: customerName,
          hours: 0
        };
      }
      
      customerHours[customerId].hours += entry.hours_logged;
    });
  }
  
  const customersChartData = Object.values(customerHours);

  const fridayCOB = new Date();
  fridayCOB.setDate(fridayCOB.getDate() + (5 - fridayCOB.getDay()));
  fridayCOB.setHours(17, 0, 0, 0);

  const currentTime = new Date();
  const timeUntilDeadline = fridayCOB.getTime() - currentTime.getTime();
  const daysUntil = Math.floor(timeUntilDeadline / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor((timeUntilDeadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let deadlineMessage = "";
  if (daysUntil > 0) {
    deadlineMessage = `${daysUntil} days and ${hoursUntil} hours remaining`;
  } else if (hoursUntil > 0) {
    deadlineMessage = `${hoursUntil} hours remaining`;
  } else {
    deadlineMessage = "Deadline passed";
  }
  
  const calculateExpectedHours = () => {
    if (timesheetEntries.length === 0) {
      return 0;
    }
    
    const today = new Date();
    const dayOfWeek = getDay(today);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 40;
    }
    
    const workDaysElapsed = Math.min(dayOfWeek, 5);
    return workDaysElapsed * 8;
  };
  
  const expectedHoursToDate = calculateExpectedHours();
  
  const calculateHoursLoggedToDate = () => {
    if (timesheetEntries.length === 0) {
      return 0;
    }
    
    const today = new Date();
    const todayFormatted = format(today, "yyyy-MM-dd");
    
    return dailyEntries
      .filter(day => {
        const dayFormatted = format(day.date, "yyyy-MM-dd");
        return dayFormatted <= todayFormatted;
      })
      .reduce((sum, day) => sum + day.hours, 0);
  };
  
  const hoursLoggedToDate = calculateHoursLoggedToDate();
  
  const weekProgress = (timesheetEntries.length === 0) 
    ? 0
    : (expectedHoursToDate > 0 
      ? Math.min(100, (hoursLoggedToDate / expectedHoursToDate) * 100) 
      : 0);

  const calculateHoursRemaining = () => {
    const today = new Date();
    const dayOfWeek = getDay(today);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 40 - hoursLoggedToDate;
    }
    
    return Math.max(0, expectedHoursToDate - hoursLoggedToDate);
  };
  
  const hoursRemaining = calculateHoursRemaining();
  const caughtUp = hoursLoggedToDate >= expectedHoursToDate;

  const hasEntries = timesheetEntries.length > 0;
  const completeWeek = weekProgress >= 100;
  const isFridayToday = isFriday(today);

  const checkDailyEntries = () => {
    const workdays = [1, 2, 3, 4, 5];
    const today = new Date();
    const dayOfWeek = getDay(today);
    
    const daysToCheck = workdays.filter(day => day <= Math.min(dayOfWeek, 5));
    
    return daysToCheck.every(day => {
      const entriesForDay = dailyEntries.find(entry => getDay(entry.date) === day);
      return entriesForDay && entriesForDay.hours > 0;
    });
  };
  
  const allDaysHaveEntries = checkDailyEntries();
  const isTodayComplete = dailyEntries
    .filter(day => isSameDay(day.date, today))
    .some(day => day.hours > 0);
    
  const isLate = isFridayToday && !isTodayComplete && hasEntries;
  
  const getTimesheetCardStyle = () => {
    if (!hasEntries) {
      return {
        background: "bg-yellow-50",
        border: "border-yellow-200",
        title: "text-yellow-800",
        text: "text-yellow-700",
        button: "text-yellow-600 border-yellow-300 hover:bg-yellow-100"
      };
    } else if (completeWeek && allDaysHaveEntries) {
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

  const handleHRIssueSubmit = async () => {
    if (!issueDescription.trim()) {
      toast({
        title: "Error",
        description: "Please describe the issue before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-hr-email', {
        body: {
          userEmail: session?.user?.email,
          userName: session?.user?.email?.split('@')[0] || "User",
          issueDescription,
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Issue Submitted",
        description: "Your issue has been sent to Human Resources",
        duration: 5000
      });
      
      setIsHRDialogOpen(false);
      setIssueDescription("");
    } catch (err) {
      console.error("Error sending email:", err);
      toast({
        title: "Error",
        description: "Failed to send issue to HR. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const statsData = [
    {
      name: "Week Progress",
      value: Math.round(weekProgress),
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      description: `${Math.round(weekProgress)}% Complete`,
      color: "#10b981"
    },
    {
      name: "Hours Logged",
      value: hoursLoggedToDate,
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      description: `${hoursLoggedToDate} of ${expectedHoursToDate}`,
      color: "#3b82f6"
    },
    {
      name: "Entries",
      value: timesheetEntries.length,
      icon: <ClipboardCheck className="h-5 w-5 text-purple-500" />,
      description: `${timesheetEntries.length} Total`,
      color: "#8b5cf6"
    },
    {
      name: "Status",
      value: completeWeek ? 100 : Math.round(weekProgress),
      icon: <Calendar className="h-5 w-5 text-amber-500" />,
      description: completeWeek && allDaysHaveEntries ? "Complete" : isTodayComplete ? "In Progress" : "Pending",
      color: completeWeek && allDaysHaveEntries ? "#10b981" : isTodayComplete ? "#f59e0b" : "#ef4444"
    }
  ];

  const radialData = statsData.map((item) => ({
    name: item.name,
    value: item.value > 0 ? Math.max(item.value, 5) : 0,
    fill: item.color
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your timesheet dashboard</p>
      </div>
      
      <Card className={`${cardStyle.background} ${cardStyle.border}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center gap-2 ${cardStyle.title}`}>
            <AlertCircle className="h-5 w-5" />
            Weekly Timesheet Reminder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`mb-2 ${cardStyle.text}`}>
            {!hasEntries 
              ? "You haven't entered any timesheet data for this week yet."
              : completeWeek && allDaysHaveEntries
                ? "Great job! You've completed your timesheet entries for this week."
                : !allDaysHaveEntries
                  ? "Please ensure you have at least one entry for each workday (Monday to Friday)."
                  : "All timesheet entries for this week must be completed by Friday 5:00 PM. Data will be processed over the weekend."
            }
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${cardStyle.text}`} />
            <span className={cardStyle.text}>
              {hasEntries && !completeWeek 
                ? caughtUp
                  ? "Congratulations! You have caught up to your expected hours."
                  : `${hoursRemaining.toFixed(1)} hours remaining to be caught up for the week`
                : deadlineMessage}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className={cardStyle.text}>This Week's Progress</span>
              <span className={cardStyle.text}>
                {hasEntries ? `${Math.round(weekProgress)}% Complete` : "No entries yet"}
              </span>
            </div>
            <Progress 
              value={weekProgress} 
              className="h-2"
              indicatorClassName={
                !hasEntries ? "bg-yellow-500" : 
                completeWeek && allDaysHaveEntries ? "bg-green-500" : 
                isLate ? "bg-red-500" : 
                "bg-amber-500"
              }
            />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            onClick={() => navigate("/timesheet")} 
            variant="outline" 
            className={cardStyle.button}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            {hasEntries && completeWeek && allDaysHaveEntries ? "View Timesheet" : "Enter Timesheet"}
          </Button>
        </CardFooter>
      </Card>
      
      {isLate && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            It's Friday and you haven't entered any timesheet data yet. Please submit your hours before 5:00 PM today.
          </AlertDescription>
        </Alert>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TimerIcon className="h-5 w-5 text-blue-500" />
              Timesheet Status
            </CardTitle>
            <CardDescription>Your weekly timesheet statistics at a glance</CardDescription>
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
                        All days have entries
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
                    innerRadius="20%" 
                    outerRadius="90%" 
                    data={radialData} 
                    startAngle={90} 
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
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
                    />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hours by Project</CardTitle>
            <CardDescription>Distribution of your hours across projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsChartData.length > 0 ? (
              <ChartContainer className="aspect-video h-80" config={{}}>
                <BarChart data={projectsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="hours" fill="#8884d8" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                No timesheet data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Hours by Customer</CardTitle>
            <CardDescription>Distribution of your hours across customers</CardDescription>
          </CardHeader>
          <CardContent>
            {customersChartData.length > 0 ? (
              <ChartContainer className="aspect-video h-80" config={{}}>
                <PieChart>
                  <Pie 
                    data={customersChartData} 
                    dataKey="hours" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    label
                  >
                    {customersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Company News & Announcements</CardTitle>
          <CardDescription>Stay up-to-date with the latest company information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-gray-500 border border-dashed rounded-md">
            No company announcements available at this time.
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact HR with any issues regarding timesheets or project assignments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => setIsHRDialogOpen(true)} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            Contact Human Resources
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={isHRDialogOpen} onOpenChange={setIsHRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Human Resources</DialogTitle>
            <DialogDescription>
              Describe your issue with timesheets or project assignments.
              This will be sent to Belinda Comeau in HR.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Please describe your issue in detail..."
              className="min-h-[150px]"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsHRDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleHRIssueSubmit}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? "Sending..." : "Send Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
