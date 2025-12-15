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

// Add holiday checking function
export const isPublicHoliday = (date: Date): boolean => {
  // This is a client-side helper that will be enhanced in later phases
  // For now, it returns false as we'll use the server-side validation
  // In Phase 2, we'll add proper client-side holiday detection
  return false;
};

// Helper to format date for holiday API calls
export const formatDateForHolidayAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Check if a date is after Tuesday cutoff (Wednesday, Thursday, or Friday)
// For payroll purposes: leave taken Wed-Fri should be processed next pay period
export const isAfterTuesdayCutoff = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  // Wednesday = 3, Thursday = 4, Friday = 5
  return dayOfWeek >= 3 && dayOfWeek <= 5;
};
