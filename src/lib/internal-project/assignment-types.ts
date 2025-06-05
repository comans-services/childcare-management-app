
export interface InternalProjectAssignment {
  id: string;
  internal_project_id: string;
  user_id: string;
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
}

export interface InternalProjectAssignmentWithDetails extends InternalProjectAssignment {
  user_full_name?: string;
  user_email?: string;
  assigned_by_name?: string;
}

export interface AssignmentFormData {
  selectedUserIds: string[];
}
