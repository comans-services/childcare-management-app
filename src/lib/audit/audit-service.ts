
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  user_name?: string; // Will be auto-populated by trigger
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

/**
 * Log an audit event with human-readable description
 */
export const logAuditEvent = async (entry: Omit<AuditLogEntry, 'id' | 'created_at' | 'user_name'>): Promise<void> => {
  try {
    console.log("=== LOGGING AUDIT EVENT ===", entry);
    
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: entry.user_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        entity_name: entry.entity_name || null,
        description: entry.description,
        details: entry.details || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error logging audit event:", error);
      // Don't throw here - audit logging should not break the main flow
    } else {
      console.log("Audit event logged successfully");
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
    // Don't throw here - audit logging should not break the main flow
  }
};

/**
 * User Management Actions
 */
export const logUserCreated = async (userId: string, createdUserId: string, userName: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'user_created',
    entity_type: 'user',
    entity_id: createdUserId,
    entity_name: userName,
    description: `Created user account for ${userName}`,
    details: { created_user_id: createdUserId }
  });
};

export const logUserUpdated = async (userId: string, updatedUserId: string, userName: string, changes: Record<string, any>): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'user_updated',
    entity_type: 'user',
    entity_id: updatedUserId,
    entity_name: userName,
    description: `Updated profile for ${userName}`,
    details: { changes, updated_user_id: updatedUserId }
  });
};

export const logRoleChanged = async (userId: string, targetUserId: string, targetUserName: string, oldRole: string, newRole: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'role_changed',
    entity_type: 'user',
    entity_id: targetUserId,
    entity_name: targetUserName,
    description: `Changed ${targetUserName}'s role from ${oldRole} to ${newRole}`,
    details: { old_role: oldRole, new_role: newRole, target_user_id: targetUserId }
  });
};

/**
 * Project Management Actions
 */
export const logProjectCreated = async (userId: string, projectId: string, projectName: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'project_created',
    entity_type: 'project',
    entity_id: projectId,
    entity_name: projectName,
    description: `Created project "${projectName}"`,
    details: { project_id: projectId }
  });
};

export const logProjectUpdated = async (userId: string, projectId: string, projectName: string, changes: Record<string, any>): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'project_updated',
    entity_type: 'project',
    entity_id: projectId,
    entity_name: projectName,
    description: `Updated project "${projectName}"`,
    details: { changes, project_id: projectId }
  });
};

export const logProjectDeleted = async (userId: string, projectId: string, projectName: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'project_deleted',
    entity_type: 'project',
    entity_id: projectId,
    entity_name: projectName,
    description: `Deleted project "${projectName}"`,
    details: { project_id: projectId }
  });
};

/**
 * Assignment Actions
 */
export const logUserAssignedToProject = async (
  assignedById: string, 
  assignedUserId: string, 
  assignedUserName: string, 
  projectId: string, 
  projectName: string
): Promise<void> => {
  await logAuditEvent({
    user_id: assignedById,
    action: 'user_assigned_to_project',
    entity_type: 'project_assignment',
    entity_id: `${assignedUserId}-${projectId}`,
    entity_name: `${assignedUserName} → ${projectName}`,
    description: `Assigned ${assignedUserName} to project "${projectName}"`,
    details: { 
      assigned_user_id: assignedUserId,
      assigned_user_name: assignedUserName,
      project_id: projectId,
      project_name: projectName
    }
  });
};

export const logUserRemovedFromProject = async (
  removedById: string, 
  removedUserId: string, 
  removedUserName: string, 
  projectId: string, 
  projectName: string
): Promise<void> => {
  await logAuditEvent({
    user_id: removedById,
    action: 'user_removed_from_project',
    entity_type: 'project_assignment',
    entity_id: `${removedUserId}-${projectId}`,
    entity_name: `${removedUserName} → ${projectName}`,
    description: `Removed ${removedUserName} from project "${projectName}"`,
    details: { 
      removed_user_id: removedUserId,
      removed_user_name: removedUserName,
      project_id: projectId,
      project_name: projectName
    }
  });
};

export const logUserAssignedToContract = async (
  assignedById: string, 
  assignedUserId: string, 
  assignedUserName: string, 
  contractId: string, 
  contractName: string
): Promise<void> => {
  await logAuditEvent({
    user_id: assignedById,
    action: 'user_assigned_to_contract',
    entity_type: 'contract_assignment',
    entity_id: `${assignedUserId}-${contractId}`,
    entity_name: `${assignedUserName} → ${contractName}`,
    description: `Assigned ${assignedUserName} to contract "${contractName}"`,
    details: { 
      assigned_user_id: assignedUserId,
      assigned_user_name: assignedUserName,
      contract_id: contractId,
      contract_name: contractName
    }
  });
};

export const logUserRemovedFromContract = async (
  removedById: string, 
  removedUserId: string, 
  removedUserName: string, 
  contractId: string, 
  contractName: string
): Promise<void> => {
  await logAuditEvent({
    user_id: removedById,
    action: 'user_removed_from_contract',
    entity_type: 'contract_assignment',
    entity_id: `${removedUserId}-${contractId}`,
    entity_name: `${removedUserName} → ${contractName}`,
    description: `Removed ${removedUserName} from contract "${contractName}"`,
    details: { 
      removed_user_id: removedUserId,
      removed_user_name: removedUserName,
      contract_id: contractId,
      contract_name: contractName
    }
  });
};

/**
 * Timesheet Actions
 */
export const logTimesheetEntryCreated = async (
  userId: string, 
  entryId: string, 
  projectName: string, 
  hours: number, 
  date: string
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'timesheet_entry_created',
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    entity_name: `${hours}h on ${projectName}`,
    description: `Added ${hours} hours to "${projectName}" on ${date}`,
    details: { 
      entry_id: entryId,
      project_name: projectName,
      hours: hours,
      date: date
    }
  });
};

export const logTimesheetEntryUpdated = async (
  userId: string, 
  entryId: string, 
  projectName: string, 
  hours: number, 
  date: string,
  changes: Record<string, any>
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'timesheet_entry_updated',
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    entity_name: `${hours}h on ${projectName}`,
    description: `Updated timesheet entry: ${hours} hours to "${projectName}" on ${date}`,
    details: { 
      entry_id: entryId,
      project_name: projectName,
      hours: hours,
      date: date,
      changes: changes
    }
  });
};

export const logTimesheetEntryDeleted = async (
  userId: string, 
  entryId: string, 
  projectName: string, 
  hours: number, 
  date: string
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'timesheet_entry_deleted',
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    entity_name: `${hours}h on ${projectName}`,
    description: `Deleted timesheet entry: ${hours} hours from "${projectName}" on ${date}`,
    details: { 
      entry_id: entryId,
      project_name: projectName,
      hours: hours,
      date: date
    }
  });
};

export const logBudgetOverride = async (
  userId: string,
  projectId: string,
  projectName: string,
  entryId: string,
  details: {
    hoursAdded: number;
    totalBudget: number;
    hoursUsedBefore: number;
    hoursUsedAfter: number;
    excessHours: number;
  }
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'budget_override',
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    entity_name: `Budget Override - ${projectName}`,
    description: `Added ${details.hoursAdded} hours to "${projectName}" exceeding budget by ${details.excessHours} hours`,
    details: {
      project_id: projectId,
      project_name: projectName,
      ...details,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Contract Actions
 */
export const logContractCreated = async (userId: string, contractId: string, contractName: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'contract_created',
    entity_type: 'contract',
    entity_id: contractId,
    entity_name: contractName,
    description: `Created contract "${contractName}"`,
    details: { contract_id: contractId }
  });
};

export const logContractUpdated = async (userId: string, contractId: string, contractName: string, changes: Record<string, any>): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'contract_updated',
    entity_type: 'contract',
    entity_id: contractId,
    entity_name: contractName,
    description: `Updated contract "${contractName}"`,
    details: { changes, contract_id: contractId }
  });
};

export const logContractDeleted = async (userId: string, contractId: string, contractName: string): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'contract_deleted',
    entity_type: 'contract',
    entity_id: contractId,
    entity_name: contractName,
    description: `Deleted contract "${contractName}"`,
    details: { contract_id: contractId }
  });
};

/**
 * Administrative Actions
 */
export const logTimesheetLocked = async (
  userId: string, 
  lockedUserId: string, 
  lockedUserName: string, 
  lockDate: string, 
  reason: string
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'timesheet_locked',
    entity_type: 'work_schedule',
    entity_id: lockedUserId,
    entity_name: `${lockedUserName} timesheet`,
    description: `Locked ${lockedUserName}'s timesheet until ${lockDate} - Reason: ${reason}`,
    details: { 
      locked_user_id: lockedUserId,
      locked_user_name: lockedUserName,
      lock_date: lockDate,
      reason: reason
    }
  });
};

export const logTimesheetUnlocked = async (
  userId: string, 
  unlockedUserId: string, 
  unlockedUserName: string
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'timesheet_unlocked',
    entity_type: 'work_schedule',
    entity_id: unlockedUserId,
    entity_name: `${unlockedUserName} timesheet`,
    description: `Unlocked ${unlockedUserName}'s timesheet`,
    details: { 
      unlocked_user_id: unlockedUserId,
      unlocked_user_name: unlockedUserName
    }
  });
};

export const logWorkScheduleChanged = async (
  userId: string, 
  targetUserId: string, 
  targetUserName: string, 
  oldDays: number, 
  newDays: number
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'work_schedule_changed',
    entity_type: 'work_schedule',
    entity_id: targetUserId,
    entity_name: `${targetUserName} work schedule`,
    description: `Changed ${targetUserName}'s work schedule from ${oldDays} days to ${newDays} days per week`,
    details: { 
      target_user_id: targetUserId,
      target_user_name: targetUserName,
      old_days: oldDays,
      new_days: newDays
    }
  });
};

/**
 * Fetch audit logs (admin only due to RLS)
 */
export const fetchAuditLogs = async (filters?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAuditLogs:", error);
    throw error;
  }
};
