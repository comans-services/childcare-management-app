
import React, { useEffect, useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Customer, saveCustomer, checkCustomerNameExists } from "@/lib/customer-service";

interface AddEditCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomer: Customer | null;
}

type FormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

const AddEditCustomerDialog: React.FC<AddEditCustomerDialogProps> = ({ 
  isOpen, 
  onClose,
  existingCustomer 
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!existingCustomer;
  const [nameValidation, setNameValidation] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    message?: string;
  }>({ isChecking: false, isDuplicate: false });

  const form = useForm<FormValues>({
    defaultValues: {
      name: existingCustomer?.name || "",
      email: existingCustomer?.email || "",
      phone: existingCustomer?.phone || "",
      company: existingCustomer?.company || "",
    }
  });

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: existingCustomer?.name || "",
        email: existingCustomer?.email || "",
        phone: existingCustomer?.phone || "",
        company: existingCustomer?.company || "",
      });
      setNameValidation({ isChecking: false, isDuplicate: false });
    }
  }, [form, isOpen, existingCustomer]);

  // Real-time name validation
  const validateCustomerName = async (name: string) => {
    if (!name.trim() || name === existingCustomer?.name) {
      setNameValidation({ isChecking: false, isDuplicate: false });
      return;
    }

    setNameValidation({ isChecking: true, isDuplicate: false });

    try {
      const exists = await checkCustomerNameExists(name, existingCustomer?.id);
      if (exists) {
        setNameValidation({
          isChecking: false,
          isDuplicate: true,
          message: `A customer with the name "${name}" already exists.`
        });
      } else {
        setNameValidation({ isChecking: false, isDuplicate: false });
      }
    } catch (error) {
      console.error("Error validating customer name:", error);
      setNameValidation({ isChecking: false, isDuplicate: false });
    }
  };

  // Debounced name validation
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name' && value.name) {
        const timeoutId = setTimeout(() => {
          validateCustomerName(value.name || '');
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, existingCustomer]);

  // Create or update customer mutation
  const mutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      const customerData = {
        id: existingCustomer?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
      };

      return saveCustomer(customerData);
    },
    onSuccess: () => {
      // Invalidate customers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: isEditing ? "Customer updated" : "Customer created",
        description: isEditing 
          ? "The customer has been updated successfully." 
          : "New customer has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} customer. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Don't submit if there's a duplicate name
    if (nameValidation.isDuplicate) {
      toast({
        title: "Duplicate customer name",
        description: nameValidation.message,
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter customer name" 
                      required 
                      {...field}
                      className={nameValidation.isDuplicate ? "border-destructive" : ""}
                    />
                  </FormControl>
                  {nameValidation.isChecking && (
                    <p className="text-sm text-muted-foreground">Checking name availability...</p>
                  )}
                  {nameValidation.isDuplicate && (
                    <p className="text-sm text-destructive">{nameValidation.message}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Company name (optional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Email address (optional)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Phone number (optional)" 
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
              <Button 
                type="submit" 
                disabled={mutation.isPending || nameValidation.isDuplicate || nameValidation.isChecking}
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update Customer" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditCustomerDialog;
