
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek } from "date-fns";
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
  Legend
} from "recharts";
import { AlertCircle, Clock, CalendarClock, Send } from "lucide-react";
import { fetchTimesheetEntries, fetchUserProjects } from "@/lib/timesheet-service";
import { fetchCustomers } from "@/lib/customer-service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

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

  // Get the current week's date range
  const today = new Date();
  const startDate = startOfWeek(today);
  const endDate = endOfWeek(today);

  // Check if user is authenticated
  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  // Fetch user's timesheet entries
  const { data: timesheetEntries = [] } = useQuery({
    queryKey: ["timesheet", session?.user?.id, startDate, endDate],
    queryFn: () => session?.user?.id 
      ? fetchTimesheetEntries(session.user.id, startDate, endDate) 
      : Promise.resolve([]),
    enabled: !!session?.user?.id
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchUserProjects(),
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  // Calculate total hours logged
  const totalHours = timesheetEntries.reduce((sum, entry) => sum + entry.hours_logged, 0);

  // Prepare data for projects chart
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

  // Prepare data for customers chart
  const customerHours = {};
  
  timesheetEntries.forEach(entry => {
    // Find the project of this entry
    const project = projects.find(p => p.id === entry.project_id);
    if (!project) return;
    
    // Find customer of the project
    const customerId = project.customer_id;
    if (!customerId) return;
    
    // Find customer name
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
  
  const customersChartData = Object.values(customerHours);

  // Calculate remaining time until Friday COB
  const fridayCOB = new Date();
  fridayCOB.setDate(fridayCOB.getDate() + (5 - fridayCOB.getDay())); // Next Friday
  fridayCOB.setHours(17, 0, 0, 0); // 5 PM
  
  const currentTime = new Date();
  const timeUntilDeadline = fridayCOB - currentTime;
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
  
  // Calculate progress for the week (work hours completed vs. total expected work hours)
  const expectedWeeklyHours = 40; // Assuming 40-hour work week
  const weekProgress = Math.min(100, (totalHours / expectedWeeklyHours) * 100);

  // Handle HR issue submission
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
      // Send email to HR using Supabase Edge Function
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your timesheet dashboard</p>
      </div>
      
      {/* Weekly Timesheet Reminder */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            Weekly Timesheet Reminder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-amber-700 mb-2">
            All timesheet entries for this week must be completed by Friday 5:00 PM.
            Data will be processed over the weekend.
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{deadlineMessage}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>This Week's Progress</span>
              <span>{Math.round(weekProgress)}% Complete</span>
            </div>
            <Progress value={weekProgress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button onClick={() => navigate("/timesheet")} variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-100">
            <CalendarClock className="mr-2 h-4 w-4" />
            Enter Timesheet
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Hours */}
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
        
        {/* Customer Hours */}
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
      
      {/* Company News Section */}
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
      
      {/* Help & Support */}
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
      
      {/* HR Contact Dialog */}
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
