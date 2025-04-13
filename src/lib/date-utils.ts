
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

export const getNextWeek = (currentDate: Date): Date => {
  return addDays(currentDate, 7);
};

export const getPreviousWeek = (currentDate: Date): Date => {
  return addDays(currentDate, -7);
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};
