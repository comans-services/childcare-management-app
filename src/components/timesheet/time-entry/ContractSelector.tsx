
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { Contract } from "@/lib/contract-service";
import { TimeEntryFormValues } from "./schema";

interface ContractSelectorProps {
  control: Control<TimeEntryFormValues>;
  contracts: Contract[];
}

export const ContractSelector: React.FC<ContractSelectorProps> = ({ control, contracts }) => {
  return (
    <FormField
      control={control}
      name="contract_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-medium">Contract*</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract" />
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
