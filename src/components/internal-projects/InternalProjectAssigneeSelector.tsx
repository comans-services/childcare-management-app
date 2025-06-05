
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { assignUsersToInternalProject } from "@/lib/internal-project/assignment-service";

const formSchema = z.object({
  selectedUserIds: z.array(z.string()).min(1, "Please select at least one user"),
});

type FormData = z.infer<typeof formSchema>;

interface InternalProjectAssigneeSelectorProps {
  projectId: string;
  assignedUserIds: string[];
  availableUsers: Array<{ id: string; full_name?: string; email?: string }>;
  onAssignmentComplete: () => void;
  onCancel: () => void;
}

const InternalProjectAssigneeSelector: React.FC<InternalProjectAssigneeSelectorProps> = ({
  projectId,
  assignedUserIds,
  availableUsers,
  onAssignmentComplete,
  onCancel,
}) => {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedUserIds: [],
    },
  });

  const assignUsersMutation = useMutation({
    mutationFn: (userIds: string[]) => assignUsersToInternalProject(projectId, userIds),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Users assigned to internal project successfully",
      });
      onAssignmentComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign users to internal project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    assignUsersMutation.mutate(data.selectedUserIds);
  };

  // Filter out already assigned users
  const unassignedUsers = availableUsers.filter(
    user => !assignedUserIds.includes(user.id)
  );

  if (unassignedUsers.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-center text-muted-foreground">
          All users are already assigned to this internal project
        </p>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-medium mb-4">Select Users to Assign</h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="selectedUserIds"
            render={() => (
              <FormItem>
                <FormLabel>Available Users</FormLabel>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {unassignedUsers.map((user) => (
                    <FormField
                      key={user.id}
                      control={form.control}
                      name="selectedUserIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={user.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, user.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== user.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              <div>
                                <div className="font-medium">
                                  {user.full_name || user.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignUsersMutation.isPending}>
              {assignUsersMutation.isPending ? "Assigning..." : "Assign Users"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InternalProjectAssigneeSelector;
