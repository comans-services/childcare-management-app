import { supabase } from "@/integrations/supabase/client";

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseSubcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  subcategory_id?: string;
  amount: number;
  description?: string;
  expense_date: string;
  receipt_url?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  category?: ExpenseCategory;
  subcategory?: ExpenseSubcategory;
  user_name?: string;
  approved_by_name?: string;
}

export interface ExpenseAttachment {
  id: string;
  expense_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

// Fetch expense categories
export const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching expense categories:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchExpenseCategories:", error);
    throw error;
  }
};

// Fetch expense subcategories for a category
export const fetchExpenseSubcategories = async (categoryId: string): Promise<ExpenseSubcategory[]> => {
  try {
    const { data, error } = await supabase
      .from("expense_subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching expense subcategories:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchExpenseSubcategories:", error);
    throw error;
  }
};

// Fetch all subcategories
export const fetchAllExpenseSubcategories = async (): Promise<ExpenseSubcategory[]> => {
  try {
    const { data, error } = await supabase
      .from("expense_subcategories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching all expense subcategories:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAllExpenseSubcategories:", error);
    throw error;
  }
};

// Fetch user's expenses
export const fetchUserExpenses = async (userId?: string): Promise<Expense[]> => {
  try {
    let query = supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(*),
        subcategory:expense_subcategories(*),
        user_name:profiles!expenses_user_id_fkey(full_name),
        approved_by_name:profiles!expenses_approved_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchUserExpenses:", error);
    throw error;
  }
};

// Create new expense
export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .insert([{
        user_id: expense.user_id,
        category_id: expense.category_id,
        subcategory_id: expense.subcategory_id,
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.expense_date,
        receipt_url: expense.receipt_url,
        notes: expense.notes,
        status: expense.status || 'draft'
      }])
      .select(`
        *,
        category:expense_categories(*),
        subcategory:expense_subcategories(*)
      `)
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createExpense:", error);
    throw error;
  }
};

// Update expense
export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<Expense> => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        category_id: updates.category_id,
        subcategory_id: updates.subcategory_id,
        amount: updates.amount,
        description: updates.description,
        expense_date: updates.expense_date,
        receipt_url: updates.receipt_url,
        notes: updates.notes,
        status: updates.status,
        submitted_at: updates.submitted_at,
        approved_at: updates.approved_at,
        approved_by: updates.approved_by,
        rejection_reason: updates.rejection_reason
      })
      .eq("id", expenseId)
      .select(`
        *,
        category:expense_categories(*),
        subcategory:expense_subcategories(*)
      `)
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateExpense:", error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    throw error;
  }
};

// Submit expense for approval
export const submitExpense = async (expenseId: string): Promise<Expense> => {
  return updateExpense(expenseId, {
    status: 'submitted',
    submitted_at: new Date().toISOString()
  });
};

// Approve expense (admin only)
export const approveExpense = async (expenseId: string, approverId: string, notes?: string): Promise<Expense> => {
  return updateExpense(expenseId, {
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: approverId,
    notes: notes ? `${notes}\n\n[Previous notes: ${await getExpenseNotes(expenseId)}]` : undefined
  });
};

// Reject expense (admin only)
export const rejectExpense = async (expenseId: string, approverId: string, reason: string, notes?: string): Promise<Expense> => {
  return updateExpense(expenseId, {
    status: 'rejected',
    approved_by: approverId,
    rejection_reason: reason,
    notes: notes ? `${notes}\n\n[Previous notes: ${await getExpenseNotes(expenseId)}]` : undefined
  });
};

// Helper function to get existing notes
const getExpenseNotes = async (expenseId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("notes")
      .eq("id", expenseId)
      .single();
    
    if (error) return "";
    return data?.notes || "";
  } catch {
    return "";
  }
};

// Get expense statistics for admin dashboard
export const getExpenseStatistics = async (startDate?: string, endDate?: string) => {
  try {
    let query = supabase
      .from("expenses")
      .select(`
        id,
        amount,
        status,
        expense_date,
        user_id,
        category:expense_categories(name),
        user_name:profiles!expenses_user_id_fkey(full_name)
      `);

    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expense statistics:", error);
      throw error;
    }

    const stats = {
      totalAmount: data?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
      totalCount: data?.length || 0,
      byStatus: {
        draft: data?.filter(e => e.status === 'draft').length || 0,
        submitted: data?.filter(e => e.status === 'submitted').length || 0,
        approved: data?.filter(e => e.status === 'approved').length || 0,
        rejected: data?.filter(e => e.status === 'rejected').length || 0,
      },
      byCategory: data?.reduce((acc, expense) => {
        const category = expense.category?.[0]?.name || 'Unknown';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>) || {},
      byUser: data?.reduce((acc, expense) => {
        const user = expense.user_name?.[0]?.full_name || 'Unknown User';
        acc[user] = (acc[user] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>) || {},
      approvedAmount: data?.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0) || 0,
      pendingAmount: data?.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0) || 0,
    };

    return stats;
  } catch (error) {
    console.error("Error in getExpenseStatistics:", error);
    throw error;
  }
};

// Upload receipt file
export const uploadReceiptFile = async (file: File, expenseId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expenseId}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('expense-receipts')
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading receipt:", error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadReceiptFile:", error);
    throw error;
  }
};

// Fetch expense attachments
export const fetchExpenseAttachments = async (expenseId: string): Promise<ExpenseAttachment[]> => {
  try {
    const { data, error } = await supabase
      .from("expense_attachments")
      .select("*")
      .eq("expense_id", expenseId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching expense attachments:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchExpenseAttachments:", error);
    throw error;
  }
};