
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { Customer, fetchCustomers } from "@/lib/customer-service";
import AddEditCustomerDialog from "./AddEditCustomerDialog";

interface CustomerSelectorProps {
  selectedCustomerId: string | null | undefined;
  onSelectCustomer: (customerId: string | null) => void;
  disabled?: boolean;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomerId,
  onSelectCustomer,
  disabled = false
}) => {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Log the selected customer ID whenever it changes
  useEffect(() => {
    console.log('CustomerSelector - selectedCustomerId:', selectedCustomerId);
  }, [selectedCustomerId]);

  // Fetch customers
  const {
    data: customers = [],
    isLoading,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={selectedCustomerId || "none"}
            onValueChange={(value) => {
              const customerId = value === "none" ? null : value;
              console.log('CustomerSelector - onValueChange:', customerId);
              onSelectCustomer(customerId);
            }}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.company ? ` (${customer.company})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setIsAddCustomerOpen(true)}
          disabled={disabled}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AddEditCustomerDialog
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        existingCustomer={null}
      />
    </div>
  );
};

export default CustomerSelector;
