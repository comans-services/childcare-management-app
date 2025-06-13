
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { fetchUserContracts } from "@/lib/contract/user-contract-service";
import { TimeEntryFormValues } from "./schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ContractSelectorProps {
  control: Control<TimeEntryFormValues>;
}

export const ContractSelector: React.FC<ContractSelectorProps> = ({ control }) => {
  // Fetch contracts that the user is assigned to
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ["user-contracts"],
    queryFn: () => {
      console.log("=== CONTRACT SELECTOR QUERY EXECUTING ===");
      return fetchUserContracts();
    },
  });

  console.log("=== CONTRACT SELECTOR RENDER ===");
  console.log("Contracts data:", contracts);
  console.log("Is loading:", isLoading);
  console.log("Error:", error);

  return (
    <FormField
      control={control}
      name="contract_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-medium">Contract*</FormLabel>
          {contracts.length === 0 && !isLoading ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No contracts available. You can only log time to contracts you're assigned to. 
                Please contact your administrator to get assigned to contracts.
                {error && <div className="mt-2 text-sm text-red-600">Debug: {error.message}</div>}
              </AlertDescription>
            </Alert>
          ) : (
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading contracts..." : "Select a contract"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
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
