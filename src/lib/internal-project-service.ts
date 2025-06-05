
import { supabase } from '@/integrations/supabase/client';

export interface InternalProject {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InternalProjectAssignment {
  id: string;
  internal_project_id: string;
  user_id: string;
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
}

export const fetchInternalProjects = async (): Promise<InternalProject[]> => {
  const { data, error } = await supabase
    .from('internal_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching internal projects:', error);
    throw error;
  }

  return data || [];
};

export const createInternalProject = async (project: Omit<InternalProject, 'id' | 'created_at' | 'updated_at'>): Promise<InternalProject> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('internal_projects')
    .insert({
      ...project,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating internal project:', error);
    throw error;
  }

  return data;
};

export const updateInternalProject = async (id: string, updates: Partial<InternalProject>): Promise<InternalProject> => {
  const { data, error } = await supabase
    .from('internal_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating internal project:', error);
    throw error;
  }

  return data;
};

export const deleteInternalProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('internal_projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting internal project:', error);
    throw error;
  }
};

export const fetchInternalProjectStats = async () => {
  const { data: allProjects } = await supabase
    .from('internal_projects')
    .select('id, is_active');

  const { data: assignments } = await supabase
    .from('internal_project_assignments')
    .select('user_id')
    .distinct();

  const total = allProjects?.length || 0;
  const active = allProjects?.filter(p => p.is_active).length || 0;
  const assignedUsers = assignments?.length || 0;

  return { total, active, assignedUsers };
};
