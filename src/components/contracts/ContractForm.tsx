
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Contract, saveContract } from "@/lib/contract-service";
import { Customer, fetchCustomers } from "@/lib/customer-service";
import { useQuery } from "@tanstack/react-query";
import { FileUpload } from "@/components/ui/file-upload";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ContractFormProps {
  contract?: Contract;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: contract?.name || "",
    description: contract?.description || "",
    customer_id: contract?.customer_id || "",
    start_date: contract?.start_date || "",
    end_date: contract?.end_date || "",
    status: contract?.status || "active" as const,
    file: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  console.log("ContractForm rendered with:", { contract, formData });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const validateForm = () => {
    console.log("Validating form data:", formData);
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Contract name is required";
    }
    if (!formData.customer_id) {
      newErrors.customer_id = "Customer is required";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = "End date must be after start date";
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const contractMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log("Starting contract save mutation with data:", data);
      
      if (!validateForm()) {
        console.error("Form validation failed");
        throw new Error("Please fix form validation errors");
      }

      setIsUploading(true);

      try {
        const contractData: ContractInput = {
          id: contract?.id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          customer_id: data.customer_id,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
          file: data.file,
        };

        console.log("Prepared contract data for save:", contractData);
        const result = await saveContract(contractData);
        console.log("Contract save result:", result);
        
        return result;
      } catch (error) {
        console.error("Error in contract mutation:", error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      console.log("Contract saved successfully:", data);
      toast({
        title: "Success",
        description: contract ? "Contract updated successfully" : "Contract created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Contract save error:", error);
      
      let errorMessage = "Failed to save contract";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    
    if (!validateForm()) {
      console.log("Form validation failed, not submitting");
      return;
    }

    console.log("Form validation passed, starting mutation");
    contractMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    console.log(`Field ${field} changed to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (file: File | null) => {
    console.log("File upload:", file);
    setFormData(prev => ({ ...prev, file }));
  };

  const isLoading = contractMutation.isPending || isUploading;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{contract ? "Edit Contract" : "Create New Contract"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Contract Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter contract name"
              className={errors.name ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter contract description"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => handleInputChange("customer_id", value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.customer_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && <p className="text-red-500 text-sm">{errors.customer_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground",
                      errors.start_date && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(new Date(formData.start_date), "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => handleInputChange("start_date", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date}</p>}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground",
                      errors.end_date && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(new Date(formData.end_date), "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => handleInputChange("end_date", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && <p className="text-red-500 text-sm">{errors.end_date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'pending_renewal' | 'expired' | 'renewed') => handleInputChange("status", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contract File</Label>
            <FileUpload
              onFileUpload={handleFileUpload}
              accept=".pdf,.doc,.docx"
              disabled={isLoading}
            />
            {contract?.file_name && (
              <p className="text-sm text-gray-500">
                Current file: {contract.file_name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : contract ? "Update Contract" : "Create Contract"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContractForm;
