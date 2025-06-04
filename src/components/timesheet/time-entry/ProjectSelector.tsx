
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { Project } from "@/lib/timesheet-service";
import { TimeEntryFormValues } from "./schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProjectSelectorProps {
  control: Control<TimeEntryFormValues>;
  projects: Project[];
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ control, projects }) => {
  return (
    <FormField
      control={control}
      name="project_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-medium">Project*</FormLabel>
          {projects.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No projects available. You can only log time to projects you're assigned to. 
                Please contact your administrator to get assigned to projects.
              </AlertDescription>
            </Alert>
          ) : (
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
