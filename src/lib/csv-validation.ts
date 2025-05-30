
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const validateProjectRow = (row: Record<string, string>, rowIndex: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!row.name?.trim()) {
    errors.push({ row: rowIndex, field: 'name', message: 'Project name is required' });
  }
  
  if (!row.budget_hours?.trim()) {
    errors.push({ row: rowIndex, field: 'budget_hours', message: 'Budget hours is required' });
  } else if (isNaN(Number(row.budget_hours)) || Number(row.budget_hours) <= 0) {
    errors.push({ row: rowIndex, field: 'budget_hours', message: 'Budget hours must be a positive number' });
  }
  
  if (row.start_date?.trim() && !isValidDate(row.start_date)) {
    errors.push({ row: rowIndex, field: 'start_date', message: 'Start date must be in YYYY-MM-DD format' });
  }
  
  if (row.end_date?.trim() && !isValidDate(row.end_date)) {
    errors.push({ row: rowIndex, field: 'end_date', message: 'End date must be in YYYY-MM-DD format' });
  }
  
  if (row.start_date?.trim() && row.end_date?.trim() && 
      isValidDate(row.start_date) && isValidDate(row.end_date) &&
      new Date(row.start_date) >= new Date(row.end_date)) {
    errors.push({ row: rowIndex, field: 'end_date', message: 'End date must be after start date' });
  }
  
  return errors;
};

export const validateCustomerRow = (row: Record<string, string>, rowIndex: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!row.name?.trim()) {
    errors.push({ row: rowIndex, field: 'name', message: 'Customer name is required' });
  }
  
  if (row.email?.trim() && !isValidEmail(row.email)) {
    errors.push({ row: rowIndex, field: 'email', message: 'Invalid email format' });
  }
  
  return errors;
};

export const validateContractRow = (row: Record<string, string>, rowIndex: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!row.name?.trim()) {
    errors.push({ row: rowIndex, field: 'name', message: 'Contract name is required' });
  }
  
  if (!row.start_date?.trim()) {
    errors.push({ row: rowIndex, field: 'start_date', message: 'Start date is required' });
  } else if (!isValidDate(row.start_date)) {
    errors.push({ row: rowIndex, field: 'start_date', message: 'Start date must be in YYYY-MM-DD format' });
  }
  
  if (!row.end_date?.trim()) {
    errors.push({ row: rowIndex, field: 'end_date', message: 'End date is required' });
  } else if (!isValidDate(row.end_date)) {
    errors.push({ row: rowIndex, field: 'end_date', message: 'End date must be in YYYY-MM-DD format' });
  }
  
  if (!row.status?.trim()) {
    errors.push({ row: rowIndex, field: 'status', message: 'Status is required' });
  } else if (!['active', 'expired', 'pending_renewal', 'renewed'].includes(row.status)) {
    errors.push({ row: rowIndex, field: 'status', message: 'Status must be: active, expired, pending_renewal, or renewed' });
  }
  
  if (row.start_date?.trim() && row.end_date?.trim() && 
      isValidDate(row.start_date) && isValidDate(row.end_date) &&
      new Date(row.start_date) >= new Date(row.end_date)) {
    errors.push({ row: rowIndex, field: 'end_date', message: 'End date must be after start date' });
  }
  
  return errors;
};

export const validateTeamMemberRow = (row: Record<string, string>, rowIndex: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!row.email?.trim()) {
    errors.push({ row: rowIndex, field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(row.email)) {
    errors.push({ row: rowIndex, field: 'email', message: 'Invalid email format' });
  }
  
  if (!row.password?.trim()) {
    errors.push({ row: rowIndex, field: 'password', message: 'Password is required' });
  } else if (row.password.length < 6) {
    errors.push({ row: rowIndex, field: 'password', message: 'Password must be at least 6 characters' });
  }
  
  if (row.employment_type?.trim() && !['full-time', 'part-time'].includes(row.employment_type)) {
    errors.push({ row: rowIndex, field: 'employment_type', message: 'Employment type must be: full-time or part-time' });
  }
  
  if (row.role?.trim() && !['admin', 'employee'].includes(row.role)) {
    errors.push({ row: rowIndex, field: 'role', message: 'Role must be: admin or employee' });
  }
  
  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
};

const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
