
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry } from "../types";
import { checkIfDateLocked } from "@/lib/timesheet-lock-service";

export const validateEntryData = (entry: TimesheetEntry): void => {
  if (!entry.entry_date) {
    throw new Error("Entry date is required");
  }

  if (!entry.hours_logged || entry.hours_logged <= 0) {
    throw new Error("Hours logged must be greater than 0");
  }

  if (entry.entry_type === 'project' && !entry.project_id) {
    throw new Error("Project is required for project entries");
  }

  if (entry.entry_type === 'contract' && !entry.contract_id) {
    throw new Error("Contract is required for contract entries");
  }
};

export const validateTimesheetLock = async (userId: string, entryDate: string): Promise<void> => {
  try {
    console.log(`Checking timesheet lock for user ${userId} on date ${entryDate}`);
    
    const isLocked = await checkIfDateLocked(userId, entryDate);
    
    if (isLocked) {
      console.log(`Timesheet is locked for user ${userId} on date ${entryDate}`);
      throw new Error("Timesheet entries are locked for this date. Please contact your administrator.");
    }
    
    console.log(`Timesheet is not locked for user ${userId} on date ${entryDate}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("locked")) {
      throw error;
    }
    console.error("Error checking timesheet lock:", error);
    // Don't block on lock check errors - fail open for better UX
  }
};

export const validateProjectBudgetForEntry = async (entry: TimesheetEntry): Promise<boolean> => {
  if (entry.entry_type !== 'project' || !entry.project_id) {
    return true;
  }

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("budget_hours, name")
      .eq("id", entry.project_id)
      .single();

    if (error || !project) {
      console.warn("Could not fetch project for budget validation");
      return true;
    }

    const budgetHours = Number(project.budget_hours) || 0;
    if (budgetHours <= 0) {
      return true;
    }

    // Get total hours used for this project
    const { data: entries, error: entriesError } = await supabase
      .from("timesheet_entries")
      .select("hours_logged")
      .eq("project_id", entry.project_id)
      .neq("id", entry.id || "");

    if (entriesError) {
      console.warn("Could not fetch existing entries for budget validation");
      return true;
    }

    const totalUsed = entries.reduce((sum, e) => sum + Number(e.hours_logged), 0);
    const newTotal = totalUsed + Number(entry.hours_logged);

    return newTotal <= budgetHours;
  } catch (error) {
    console.error("Error in budget validation:", error);
    return true;
  }
};
