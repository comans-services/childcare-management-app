import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  LeaveType,
  LeaveBalance,
  fetchLeaveTypes,
  fetchUserLeaveBalances,
  createLeaveApplication,
  calculateBusinessDays,
  uploadLeaveAttachment
} from "@/lib/leave-service";
import { useAuth } from "@/context/AuthContext";
import DocumentUploadComponent from "./DocumentUploadComponent";

const formSchema = z.object({
  leave_type_id: z.string().min(1, "Please select a leave type"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  reason: z.string().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

const LeaveApplicationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [businessDays, setBusinessDays] = useState<number>(0);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesData, balancesData] = await Promise.all([
          fetchLeaveTypes(),
          fetchUserLeaveBalances(user?.id)
        ]);
        setLeaveTypes(typesData);
        setLeaveBalances(balancesData);
      } catch (error) {
        console.error("Error loading leave data:", error);
        toast({
          title: "Error",
          description: "Failed to load leave data. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, toast]);

  // Calculate business days when dates change
  useEffect(() => {
    const startDate = form.watch("start_date");
    const endDate = form.watch("end_date");

    if (startDate && endDate) {
      calculateBusinessDays(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      ).then(setBusinessDays).catch(console.error);
    }
  }, [form.watch("start_date"), form.watch("end_date")]);

  // Update selected leave type when form value changes
  useEffect(() => {
    const leaveTypeId = form.watch("leave_type_id");
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    setSelectedLeaveType(leaveType || null);
  }, [form.watch("leave_type_id"), leaveTypes]);

  const getLeaveBalance = (leaveTypeId: string) => {
    return leaveBalances.find(balance => balance.leave_type_id === leaveTypeId);
  };

  const validateLeaveBalance = (leaveTypeId: string, requestedDays: number) => {
    const balance = getLeaveBalance(leaveTypeId);
    if (!balance) return { valid: true, message: "" };
    
    if (requestedDays > balance.remaining_days) {
      return {
        valid: false,
        message: `Insufficient leave balance. You have ${balance.remaining_days} days remaining.`
      };
    }
    
    return { valid: true, message: "" };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Validate leave balance for leave types that have balances
      const balance = getLeaveBalance(values.leave_type_id);
      if (balance) {
        const validation = validateLeaveBalance(values.leave_type_id, businessDays);
        if (!validation.valid) {
          toast({
            title: "Insufficient Leave Balance",
            description: validation.message,
            variant: "destructive",
          });
          return;
        }
      }

      const application = await createLeaveApplication({
        leave_type_id: values.leave_type_id,
        start_date: format(values.start_date, "yyyy-MM-dd"),
        end_date: format(values.end_date, "yyyy-MM-dd"),
        reason: values.reason
      });

      setApplicationId(application.id);
      
      toast({
        title: "Leave Application Submitted",
        description: `Your leave application for ${businessDays} business days has been submitted for approval.`,
      });

      // Reset form
      form.reset();
      setBusinessDays(0);
      setSelectedLeaveType(null);
      
      // Refresh balances
      const balancesData = await fetchUserLeaveBalances(user.id);
      setLeaveBalances(balancesData);

    } catch (error) {
      console.error("Error submitting leave application:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      
      // Parse specific error types for better user feedback
      let errorMessage = "Failed to submit leave application. Please try again.";
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        
        // Handle specific Supabase errors
        if (errorObj.message) {
          if (errorObj.message.includes('user_id')) {
            errorMessage = "Authentication error. Please log out and log back in.";
          } else if (errorObj.message.includes('business_days_count')) {
            errorMessage = "Error calculating business days. Please check your selected dates.";
          } else if (errorObj.message.includes('violates row-level security')) {
            errorMessage = "Permission denied. Please contact your administrator.";
          } else if (errorObj.message.includes('constraint')) {
            errorMessage = "Data validation error. Please check all required fields.";
          } else {
            errorMessage = `Error: ${errorObj.message}`;
          }
        }
        
        // Handle network errors
        if (errorObj.code === 'PGRST301' || errorObj.code === 'PGRST116') {
          errorMessage = "Database connection error. Please try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBalance = selectedLeaveType ? getLeaveBalance(selectedLeaveType.id) : null;
  const balanceValidation = selectedLeaveType && businessDays > 0 
    ? validateLeaveBalance(selectedLeaveType.id, businessDays)
    : { valid: true, message: "" };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="leave_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex flex-col">
                            <span>{type.name}</span>
                            {type.description && (
                              <span className="text-sm text-muted-foreground">
                                {type.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentBalance && (
              <Card className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Available Balance</h4>
                  <div className="text-2xl font-bold text-primary">
                    {currentBalance.remaining_days} days
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentBalance.used_days} of {currentBalance.total_days} days used
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick start date</span>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
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
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick end date</span>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {businessDays > 0 && (
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium">Business Days Requested</h4>
                  <div className="text-2xl font-bold">{businessDays} days</div>
                </div>
                {!balanceValidation.valid && (
                  <Alert variant="destructive" className="flex-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{balanceValidation.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          )}

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Reason {selectedLeaveType?.requires_attachment && "(Required for this leave type)"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide details about your leave request..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide any additional details about your leave request
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedLeaveType?.requires_attachment && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This leave type requires supporting documentation. You can upload files after submitting your application.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || !balanceValidation.valid}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Leave Application"}
          </Button>
        </form>
      </Form>

      {applicationId && selectedLeaveType?.requires_attachment && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Supporting Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploadComponent applicationId={applicationId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveApplicationForm;