
import React, { useState, useEffect, useRef } from "react";
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
import { CalendarIcon, Loader2, File, UploadCloud, X, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contract, saveContract, fetchServices } from "@/lib/contract-service";
import CustomerSelector from "../customers/CustomerSelector";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // File upload related states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      
      // Reset file upload state
      setFile(null);
      setUploading(false);
      setUploadProgress(0);
      setUploadError(null);
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
      
      // Reset file upload state
      setFile(null);
      setUploading(false);
      setUploadProgress(0);
      setUploadError(null);
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
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadError(null);
    setUploadProgress(0);
  };
  
  // Reset file upload state
  const resetFileUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload file to Supabase storage
  const uploadFile = async (contract: Contract): Promise<void> => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(10);
    
    try {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${contract.id}-${Date.now()}.${fileExt}`;
      const filePath = `${contract.id}/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      setUploadProgress(60);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('contract_files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      setUploadProgress(80);

      // Update contract record with file information
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          file_id: uploadData?.id || null,
          file_name: file.name,
          file_url: urlData?.signedUrl || null,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setUploadProgress(100);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been attached to this contract.`,
      });
      
      // Reset file upload state after successful upload
      setTimeout(() => {
        resetFileUpload();
      }, 1000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setUploading(false);
    }
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
    onSuccess: async (savedContract) => {
      // If there's a file to upload, upload it after saving the contract
      if (file && savedContract) {
        await uploadFile(savedContract);
      }
      
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
  
  // Function to handle file browse click
  const handleFileBrowseClick = () => {
    fileInputRef.current?.click();
  };

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

            {/* File Upload Section */}
            <div>
              <FormLabel>Contract Document</FormLabel>
              <FormDescription className="mb-2">
                Upload a copy of the contract document (PDF, Word, Excel or image file)
              </FormDescription>
              
              {!file ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={handleFileBrowseClick}
                >
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                      Click to upload
                    </span>
                    <p className="text-xs mt-1">PDF, Word, Excel or image files (max. 10MB)</p>
                  </div>
                  <input 
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <File className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm font-medium truncate">{file.name}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={resetFileUpload}
                      disabled={uploading}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                  
                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}
              
              {existingContract?.file_name && !file && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3 text-sm flex items-center">
                  <Info className="h-4 w-4 text-blue-500 mr-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-700">
                      Current file: 
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium ml-1 inline-block max-w-[200px] truncate align-bottom">
                              {existingContract.file_name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{existingContract.file_name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Upload a new file to replace the current one
                    </p>
                  </div>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm flex items-center text-red-800">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
            </div>

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
                disabled={saveContractMutation.isPending || uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveContractMutation.isPending || uploading}
              >
                {(saveContractMutation.isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
