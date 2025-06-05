
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createInternalProject, updateInternalProject, InternalProject } from "@/lib/internal-project-service";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditInternalProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: InternalProject | null;
  onSuccess: () => void;
}

const AddEditInternalProjectDialog: React.FC<AddEditInternalProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}) => {
  const { toast } = useToast();
  const isEdit = !!project;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      is_active: project?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (open && project) {
      form.reset({
        name: project.name,
        description: project.description || "",
        is_active: project.is_active,
      });
    } else if (open && !project) {
      form.reset({
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [open, project, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && project) {
        await updateInternalProject(project.id, data);
        toast({
          title: "Success",
          description: "Internal project updated successfully",
        });
      } else {
        await createInternalProject(data);
        toast({
          title: "Success",
          description: "Internal project created successfully",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} internal project`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Internal Project" : "Create Internal Project"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the internal project details below."
              : "Fill in the details to create a new internal project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
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
                      placeholder="Enter project description (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this project for user assignments
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? (isEdit ? "Updating..." : "Creating...")
                  : (isEdit ? "Update Project" : "Create Project")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditInternalProjectDialog;
