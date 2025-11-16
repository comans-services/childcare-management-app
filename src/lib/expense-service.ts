// Stub service - expenses table doesn't exist

export interface ExpenseStatistics {
  total: number;
  approved: number;
  pending: number;
}

export const getExpenseStatistics = async (): Promise<ExpenseStatistics> => {
  console.log("Note: Expenses table does not exist. Returning default stats.");
  return {
    total: 0,
    approved: 0,
    pending: 0
  };
};
