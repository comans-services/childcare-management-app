
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { fetchUserContracts } from "@/lib/contract-service";
import { TimeEntryFormValues } from "./schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ContractSelectorProps {
  control: Control<TimeEntryFormValues>;
}

export const ContractSelector: React.FC<ContractSelectorProps> = ({ control }) => {
  // Fetch contracts that the user is assigned to
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["user-contracts"],
    queryFn: () => fetchUserContracts(),
  });

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
