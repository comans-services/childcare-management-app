
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/lib/user-service";

interface AddEditUserDialogProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: any) => void;
  isNewUser?: boolean;
}

const userSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(1, "Full name is required"),
  role: z.enum(["employee", "admin"]),
  employment_type: z.enum(["full-time", "part-time", "casual"]),
  employee_id: z.string().optional().nullable(),
});

const newUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Please confirm password"),
  role: z.enum(["employee", "admin"]),
  employment_type: z.enum(["full-time", "part-time", "casual"]),
  employee_id: z.string().optional().nullable(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const AddEditUserDialog = ({
  user,
  isOpen,
  onClose,
  onSave,
  isNewUser = false,
}: AddEditUserDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = isNewUser ? newUserSchema : userSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isNewUser ? {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      role: "employee" as const,
      employment_type: "full-time" as const,
      employee_id: "",
    } : {
      id: user?.id || "",
      full_name: user?.full_name || "",
      role: (user?.role as "employee" | "admin") || "employee",
      employment_type: (user?.employment_type as "full-time" | "part-time" | "casual") || "full-time",
      employee_id: user?.employee_id || "",
    }
  });

  React.useEffect(() => {
    if (isNewUser) {
      form.reset({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "employee",
        employment_type: "full-time",
        employee_id: "",
      });
    } else if (user) {
      form.reset({
        id: user.id,
        full_name: user.full_name || "",
        role: (user.role as "employee" | "admin") || "employee",
        employment_type: (user.employment_type as "full-time" | "part-time" | "casual") || "full-time",
        employee_id: user.employee_id || "",
      });
    }
  }, [user, isNewUser, form]);

  const onSubmit = (values: any) => {
    if (isNewUser) {
      const { confirm_password, ...rest } = values;
      onSave(rest);
    } else {
      onSave(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewUser ? "Add Team Member" : "Edit Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isNewUser
              ? "Create a new team member account with the details below."
              : "Update the team member account details below."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isNewUser && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {isNewUser && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirm ? "text" : "password"}
                            placeholder="Re-enter password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="EMP001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isNewUser ? "Create Team Member" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditUserDialog;
