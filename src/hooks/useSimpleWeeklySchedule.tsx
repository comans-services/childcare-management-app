
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { 
  upsertWeeklySchedule, 
  deleteWeeklySchedule, 
  fetchWeeklySchedules,
  WeeklyScheduleRow 
} from "@/lib/simple-work-schedule-service";

export const useSimpleWeeklySchedule = (userId: string, weekStartDate: Date) => {
  const { user } = useAuth();
  const { workingDays } = useWorkSchedule(userId);
  const queryClient = useQueryClient();
  const weekStart = formatDate(weekStartDate);

  // Query for weekly schedule override
  const { data: weeklySchedules = {}, isLoading } = useQuery({
    queryKey: ['weeklySchedules', userId, weekStart],
    queryFn: () => fetchWeeklySchedules([userId], weekStart, weekStart),
    enabled: !!userId
  });

  const weeklyOverride = weeklySchedules[userId]?.[0];
  const hasOverride = !!weeklyOverride;
  const effectiveDays = hasOverride ? weeklyOverride.days_per_week : workingDays;
  const effectiveHours = effectiveDays * 8;

  // Mutation for updating weekly schedule
  const updateMutation = useMutation({
    mutationFn: ({ days }: { days: number }) => upsertWeeklySchedule(userId, weekStart, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({
        title: "Schedule Updated",
        description: `Weekly schedule updated to ${effectiveDays} days.`,
      });
    },
    onError: (error) => {
      console.error("Error updating weekly schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update weekly schedule. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting weekly schedule (revert to default)
  const deleteMutation = useMutation({
    mutationFn: () => deleteWeeklySchedule(userId, weekStart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({
        title: "Reverted to Default",
        description: `Schedule reverted to default ${workingDays} days.`,
      });
    },
    onError: (error) => {
      console.error("Error deleting weekly schedule:", error);
      toast({
        title: "Error",
        description: "Failed to revert schedule. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateWeeklyDays = (days: number) => {
    updateMutation.mutate({ days });
  };

  const revertToDefault = () => {
    deleteMutation.mutate();
  };

  return {
    effectiveDays,
    effectiveHours,
    hasOverride,
    isLoading,
    updateWeeklyDays,
    revertToDefault,
    isUpdating: updateMutation.isPending,
    isReverting: deleteMutation.isPending,
  };
};
