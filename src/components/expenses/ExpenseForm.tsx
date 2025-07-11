import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Expense, 
  ExpenseCategory, 
  ExpenseSubcategory,
  fetchExpenseCategories, 
  fetchExpenseSubcategories,
  createExpense,
  updateExpense,
  uploadReceiptFile
} from "@/lib/expense-service";
import { Upload, X, FileText } from "lucide-react";

const expenseSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  subcategory_id: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Date is required"),
  notes: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState(expense?.category_id || "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category_id: expense?.category_id || "",
      subcategory_id: expense?.subcategory_id || "",
      amount: expense?.amount || 0,
      description: expense?.description || "",
      expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
      notes: expense?.notes || ""
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: fetchExpenseCategories
  });

  // Fetch subcategories for selected category
  const { data: subcategories = [] } = useQuery({
    queryKey: ["expense-subcategories", selectedCategoryId],
    queryFn: () => fetchExpenseSubcategories(selectedCategoryId),
    enabled: !!selectedCategoryId
  });

  useEffect(() => {
    if (expense?.category_id) {
      setSelectedCategoryId(expense.category_id);
    }
  }, [expense]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    form.setValue("category_id", value);
    form.setValue("subcategory_id", ""); // Reset subcategory when category changes
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Receipt file must be smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPEG, PNG, GIF, and PDF files are allowed",
          variant: "destructive"
        });
        return;
      }

      setReceiptFile(file);
    }
  };

  const removeFile = () => {
    setReceiptFile(null);
    const fileInput = document.getElementById('receipt-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create expenses",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = expense?.receipt_url;

      // Upload receipt file if provided
      if (receiptFile) {
        const tempExpenseId = expense?.id || `temp-${Date.now()}`;
        receiptUrl = await uploadReceiptFile(receiptFile, tempExpenseId);
      }

      const expenseData: Partial<Expense> = {
        ...data,
        user_id: user.id,
        receipt_url: receiptUrl
      };

      if (expense?.id) {
        await updateExpense(expense.id, expenseData);
        toast({
          title: "Expense updated",
          description: "Your expense has been updated successfully"
        });
      } else {
        await createExpense(expenseData);
        toast({
          title: "Expense created",
          description: "Your expense has been created successfully"
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{expense ? "Edit Expense" : "Create New Expense"}</CardTitle>
        <CardDescription>
          {expense ? "Update your expense details" : "Add a new expense entry"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={handleCategoryChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expense_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the expense" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes or details"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt-file">Receipt Attachment</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="receipt-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('receipt-file')?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Receipt</span>
                </Button>
                
                {receiptFile && (
                  <div className="flex items-center space-x-2 bg-muted px-3 py-1 rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{receiptFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {expense?.receipt_url && !receiptFile && (
                  <div className="flex items-center space-x-2 bg-muted px-3 py-1 rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Current receipt attached</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a receipt (JPEG, PNG, GIF, PDF). Max size: 5MB
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : expense ? "Update Expense" : "Create Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;