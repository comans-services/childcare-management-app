
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Play, Pause, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveTimesheetEntry, Project, fetchUserProjects } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const TimerComponent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchUserProjects,
    enabled: !!user
  });

  const formattedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!selectedProject) {
      toast({
        title: "Project Required",
        description: "Please select a project before starting the timer.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const startTime = new Date();
    setTimerStartTime(startTime);
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  const stopTimer = async () => {
    if (!user || !selectedProject || !timerStartTime) return;
    
    pauseTimer();
    const hoursLogged = parseFloat((elapsedTime / 3600).toFixed(2));
    
    try {
      await saveTimesheetEntry({
        user_id: user.id,
        project_id: selectedProject,
        entry_date: formatDate(new Date()),
        hours_logged: hoursLogged,
        notes: `Timer Entry - please change. Duration: ${formattedTime()}`
      });
      
      toast({
        title: "Time Saved",
        description: `${formattedTime()} logged to the selected project.`
      });
      
      setElapsedTime(0);
      setTimerStartTime(null);
    } catch (error) {
      console.error("Error saving timer entry:", error);
      toast({
        title: "Error",
        description: "Failed to save time entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">Time Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <Select
              value={selectedProject || ""}
              onValueChange={setSelectedProject}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center justify-center">
              <div className="text-4xl font-mono font-bold">
                {formattedTime()}
              </div>
            </div>
            
            <div className="flex justify-center space-x-2">
              {!isRunning ? (
                <Button 
                  onClick={startTimer} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!selectedProject}
                >
                  <Play className="mr-2 h-4 w-4" /> Start Timer
                </Button>
              ) : (
                <Button onClick={pauseTimer} className="bg-amber-500 hover:bg-amber-600">
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
              )}
              
              <Button 
                onClick={stopTimer} 
                variant="destructive"
                disabled={elapsedTime === 0}
              >
                <StopCircle className="mr-2 h-4 w-4" /> Stop & Save
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerComponent;
