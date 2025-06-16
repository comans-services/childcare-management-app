
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns";

export const formatDate = (date: Date): string => {
  // Ensure consistent date format YYYY-MM-DD without timezone effects
  return format(date, "yyyy-MM-dd");
};

export const formatDateDisplay = (date: Date): string => {
  return format(date, "MMM d, yyyy");
};

export const formatDateShort = (date: Date): string => {
  return format(date, "EEE, MMM d");
};

export const getCurrentWeekDates = (currentDate: Date = new Date()): Date[] => {
  // Modified to always use Monday as the start of the week and Sunday as the end
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday
  const end = addDays(start, 6); // End on Sunday (6 days after Monday)
  
  return eachDayOfInterval({ start, end });
};

export const getWeekDates = (weekStartDate: Date): Date[] => {
  const end = addDays(weekStartDate, 6); // End on Sunday (6 days after Monday)
  return eachDayOfInterval({ start: weekStartDate, end });
};

export const getNextWeek = (currentDate: Date): Date => {
  return addDays(currentDate, 7);
};

export const getPreviousWeek = (currentDate: Date): Date => {
  return addDays(currentDate, -7);
};

export const getNextDay = (currentDate: Date): Date => {
  return addDays(currentDate, 1);
};

export const getPreviousDay = (currentDate: Date): Date => {
  return addDays(currentDate, -1);
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

// Check if a date falls on weekend (Saturday or Sunday)
export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
};

// Helper function to format time (for timer display)
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

// Get time difference in hours between two dates
export const getHoursDifference = (start: Date, end: Date): number => {
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  // Round to 2 decimal places
  return Math.round(diffHours * 100) / 100;
};

export const getWeekStart = (date: Date): Date => {
  // Get ISO week Monday (week starts on Monday)
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return monday;
};
