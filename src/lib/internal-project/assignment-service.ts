
import { supabase } from '@/integrations/supabase/client';

export interface InternalProjectAssignmentWithDetails {
  id: string;
  internal_project_id: string;
  user_id: string;
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
  user_full_name?: string;
  user_email?: string;
  assigned_by_name?: string;
}

export const fetchInternalProjectAssignments = async (projectId: string): Promise<InternalProjectAssignmentWithDetails[]> => {
  const { data, error } = await supabase
    .from('internal_project_assignments')
    .select(`
      *,
      profiles!internal_project_assignments_user_id_fkey(full_name, email),
      assigned_by_profile:profiles!internal_project_assignments_assigned_by_fkey(full_name)
    `)
    .eq('internal_project_id', projectId);

  if (error) {
    console.error('Error fetching internal project assignments:', error);
    throw error;
  }

  return data?.map(assignment => ({
    id: assignment.id,
    internal_project_id: assignment.internal_project_id,
    user_id: assignment.user_id,
    assigned_by: assignment.assigned_by,
    assigned_at: assignment.assigned_at,
    created_at: assignment.created_at,
    user_full_name: assignment.profiles?.full_name,
    user_email: assignment.profiles?.email,
    assigned_by_name: assignment.assigned_by_profile?.full_name
  })) || [];
};

export const assignUsersToInternalProject = async (projectId: string, userIds: string[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const assignments = userIds.map(userId => ({
    internal_project_id: projectId,
    user_id: userId,
    assigned_by: user?.id
  }));

  const { error } = await supabase
    .from('internal_project_assignments')
    .insert(assignments);

  if (error) {
    console.error('Error assigning users to internal project:', error);
    throw error;
  }
};

export const removeUserFromInternalProject = async (projectId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('internal_project_assignments')
    .delete()
    .eq('internal_project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing user from internal project:', error);
    throw error;
  }
};

export const fetchAssignedUsersForInternalProject = async (projectId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('internal_project_assignments')
    .select('user_id')
    .eq('internal_project_id', projectId);

  if (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }

  return data?.map(assignment => assignment.user_id) || [];
};
