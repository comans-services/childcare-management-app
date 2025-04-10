
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/lib/timesheet-service";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CustomerSelector from "@/components/customers/CustomerSelector";

interface AddEditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingProject: Project | null;
}

type FormValues = {
  name: string;
  description: string;
  budget_hours: number;
  start_date: string;
  end_date: string;
  customer_id: string;
};

const AddEditProjectDialog: React.FC<AddEditProjectDialogProps> = ({ 
  isOpen, 
  onClose,
  existingProject 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!existingProject;

  const form = useForm<FormValues>({
    defaultValues: {
      name: existingProject?.name || "",
      description: existingProject?.description || "",
      budget_hours: existingProject?.budget_hours || 0,
      start_date: existingProject?.start_date || "",
      end_date: existingProject?.end_date || "",
      customer_id: existingProject?.customer_id || "",
    }
  });

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: existingProject?.name || "",
        description: existingProject?.description || "",
        budget_hours: existingProject?.budget_hours || 0,
        start_date: existingProject?.start_date || "",
        end_date: existingProject?.end_date || "",
        customer_id: existingProject?.customer_id || "",
      });
    }
  }, [form, isOpen, existingProject]);

  // Create or update project mutation
  const mutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const projectData = {
        name: formData.name,
        description: formData.description,
        budget_hours: formData.budget_hours,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        customer_id: formData.customer_id || null,
        updated_at: new Date().toISOString(),
      };

      // If editing, update existing project
      if (isEditing && existingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", existingProject.id);
        
        if (error) throw error;
        return existingProject.id;
      } 
      // Otherwise create a new project
      else {
        const newProject = {
          ...projectData,
          created_by: user.id,
          is_active: true,
        };

        console.log("Creating new project:", newProject);
        
        const { data, error } = await supabase
          .from("projects")
          .insert(newProject)
          .select();
        
        if (error) {
          console.error("Project creation error:", error);
          throw error;
        }
        
        if (!data || data.length === 0) throw new Error("No data returned after project creation");
        
        return data[0].id;
      }
    },
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: isEditing ? "Project updated" : "Project created",
        description: isEditing 
          ? "The project has been updated successfully." 
          : "New project has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} project. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Project" : "Add New Project"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter project name" 
                      required 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Project description" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <CustomerSelector
                      selectedCustomerId={field.value}
                      onSelectCustomer={(customerId) => field.onChange(customerId)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Assign this project to a customer or create a new one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="budget_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.5"
                      required 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Allocated time budget for this project (in hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditProjectDialog;
