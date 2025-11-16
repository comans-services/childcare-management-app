import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";

export const fetchUserProjects = async (): Promise<Project[]> => {
  console.log("Note: Projects table does not exist. Returning empty array.");
  return [];
};

export const fetchProjects = async (): Promise<Project[]> => {
  console.log("Note: Projects table does not exist. Returning empty array.");
  return [];
};

export const saveProject = async (project: Partial<Project>): Promise<Project | null> => {
  console.log("Note: Projects table does not exist. Cannot save project.");
  return null;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  console.log("Note: Projects table does not exist. Cannot update project.");
};

export const getProjectHoursUsed = async (projectId: string): Promise<number> => {
  console.log("Note: Projects table does not exist. Returning 0 hours.");
  return 0;
};

export const updateProjectStatus = async (projectId: string, isActive: boolean): Promise<void> => {
  console.log("Note: Projects table does not exist. Cannot update project status.");
};
