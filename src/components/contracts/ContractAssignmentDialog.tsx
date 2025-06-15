
import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Contract } from "@/lib/contract-service";
import {
  fetchContractAssignments,
  bulkAssignUsersToContract,
  removeUserFromContract,
} from "@/lib/contract/assignment-service";
import { ContractAssignment } from "@/lib/contract/assignment-types";
import ContractAssigneeSelector from "./ContractAssigneeSelector";

interface ContractAssignmentDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractAssignmentDialog: React.FC<ContractAssignmentDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetch current assignments for this contract
  const { data: assignments = [] } = useQuery({
    queryKey: ["contract-assignments", contract?.id],
    queryFn: () => contract ? fetchContractAssignments(contract.id) : Promise.resolve([]),
    enabled: !!contract && open,
  });

  // Initialize selected users when assignments load - fix infinite loop by adding proper conditions
  React.useEffect(() => {
    if (assignments.length > 0 && open && contract) {
      const userIds = assignments.map((assignment: ContractAssignment) => assignment.user_id);
      // Only update if the arrays are different to prevent infinite re-renders
      setSelectedUserIds(prevIds => {
        const prevIdsSet = new Set(prevIds);
        const newIdsSet = new Set(userIds);
        const areEqual = prevIdsSet.size === newIdsSet.size && 
          [...prevIdsSet].every(id => newIdsSet.has(id));
        
        if (!areEqual) {
          console.log("Updating selected user IDs:", userIds);
          return userIds;
        }
        return prevIds;
      });
    } else if (assignments.length === 0 && open && contract) {
      // Clear selections when no assignments and dialog is open
      setSelectedUserIds(prevIds => {
        if (prevIds.length > 0) {
          console.log("Clearing selected user IDs");
          return [];
        }
        return prevIds;
      });
    }
  }, [assignments.length, open, contract?.id]); // Only depend on length, open state, and contract ID

  const assignUsersMutation = useMutation({
    mutationFn: async () => {
      if (!contract) {
        console.error("No contract provided for assignment");
        return;
      }

      console.log("Starting contract assignment mutation for contract:", contract.id);
      console.log("Selected user IDs:", selectedUserIds);

      const currentUserIds = assignments.map((a: ContractAssignment) => a.user_id);
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      console.log("Users to add:", usersToAdd);
      console.log("Users to remove:", usersToRemove);

      // Add new users
      if (usersToAdd.length > 0) {
        console.log("Adding users to contract...");
        await bulkAssignUsersToContract(contract.id, usersToAdd);
      }

      // Remove users
      for (const userId of usersToRemove) {
        console.log("Removing user from contract:", userId);
        await removeUserFromContract(contract.id, userId);
      }

      console.log("Contract assignment mutation completed successfully");
    },
    onSuccess: () => {
      console.log("Contract assignments updated successfully");
      toast({
        title: "Success",
        description: "Contract assignments updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["contract-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating contract assignments:", error);
      toast({
        title: "Error",
        description: "Failed to update contract assignments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = useCallback(() => {
    console.log("Saving contract assignments...");
    assignUsersMutation.mutate();
  }, [assignUsersMutation]);

  const handleCancel = useCallback(() => {
    console.log("Cancelling contract assignment dialog");
    // Reset to original assignments
    const originalUserIds = assignments.map((assignment: ContractAssignment) => assignment.user_id);
    setSelectedUserIds(originalUserIds);
    onOpenChange(false);
  }, [assignments, onOpenChange]);

  const handleSelectionChange = useCallback((newSelectedUserIds: string[]) => {
    console.log("Selection changed:", newSelectedUserIds);
    setSelectedUserIds(newSelectedUserIds);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Contract Assignments</DialogTitle>
          <DialogDescription>
            Assign users to "{contract?.name}" contract. Only assigned users can log time to this contract.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-1">
              <ContractAssigneeSelector
                selectedUserIds={selectedUserIds}
                onSelectionChange={handleSelectionChange}
                disabled={assignUsersMutation.isPending}
              />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={assignUsersMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assignUsersMutation.isPending}>
            {assignUsersMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractAssignmentDialog;
