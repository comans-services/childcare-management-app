import React, { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contract, saveContract, fetchServices } from "@/lib/contract-service";
import CustomerSelector from "../customers/CustomerSelector";
import { Badge } from "@/components/ui/badge";

interface AddEditContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingContract: Contract | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Contract name is required"),
  description: z.string().optional(),
  customer_id: z.string().nullable().optional(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum(['active', 'expired', 'pending_renewal', 'renewed']).default('active'),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const AddEditContractDialog: React.FC<AddEditContractDialogProps> = ({
  isOpen,
  onClose,
  existingContract,
}) => {
  const queryClient = useQueryClient();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Fetch available services
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    enabled: isOpen,
  });
  
  // Initialize the form with default values or existing contract values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      customer_id: null,
      start_date: new Date(),
      end_date: addDays(new Date(), 365), // Default to 1 year
      status: 'active',
      is_active: true,
    },
  });

  // When the dialog opens or existingContract changes, set form values
  useEffect(() => {
    if (existingContract && isOpen) {
      form.reset({
        name: existingContract.name,
        description: existingContract.description || "",
        customer_id: existingContract.customer_id || null,
        start_date: existingContract.start_date ? new Date(existingContract.start_date) : new Date(),
        end_date: existingContract.end_date ? new Date(existingContract.end_date) : addDays(new Date(), 365),
        status: existingContract.status || 'active',
        is_active: existingContract.is_active !== false,
      });
      
      // Set selected services if the contract has any
      if (existingContract.services && existingContract.services.length > 0) {
        setSelectedServiceIds(existingContract.services.map(service => service.id));
      } else {
        setSelectedServiceIds([]);
      }
    } else if (isOpen) {
      // Reset form for a new contract
      form.reset({
        name: "",
        description: "",
        customer_id: null,
        start_date: new Date(),
        end_date: addDays(new Date(), 365),
        status: 'active',
        is_active: true,
      });
      setSelectedServiceIds([]);
    }
  }, [existingContract, isOpen, form]);

  // Handle service checkbox toggle
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Save contract mutation
  const saveContractMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const contractData = {
        ...data,
        name: data.name,
        status: data.status,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        id: existingContract?.id,
      };
      
      return saveContract(contractData, selectedServiceIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: existingContract ? "Contract updated" : "Contract created",
        description: existingContract
          ? "Your contract has been updated successfully."
          : "Your new contract has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving contract:", error);
      toast({
        title: "Error",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (values.end_date < values.start_date) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    saveContractMutation.mutate(values);
  };

  // Access the mutation's isPending state
  const isSaving = saveContractMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingContract ? "Edit Contract" : "Create New Contract"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contract name" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter contract description"
                      {...field}
                      value={field.value || ""}
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
                      onSelectCustomer={field.onChange}
                      preventClose={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Renewal notice will be shown 3 months before this date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                      <SelectItem value="renewed">Renewed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Status will automatically update based on the end date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Services</FormLabel>
              <div className="mt-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                {isServicesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map(service => (
                      <div key={service.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`service-${service.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {service.name}
                          </label>
                          {service.description && (
                            <p className="text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No services available
                  </p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedServiceIds.length > 0 && services.length > 0 && (
                  <div className="text-sm text-muted-foreground">Selected:</div>
                )}
                {services
                  .filter(service => selectedServiceIds.includes(service.id))
                  .map(service => (
                    <Badge key={service.id} variant="secondary" className="text-xs">
                      {service.name}
                    </Badge>
                  ))
                }
              </div>
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Contract</FormLabel>
                    <FormDescription>
                      Mark this contract as active and make it available for time entries.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingContract ? "Update Contract" : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditContractDialog;
