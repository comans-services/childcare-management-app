
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, ParsedCSVData } from "./csv-parser";
import { validateProjectRow, validateCustomerRow, validateContractRow, validateTeamMemberRow, ValidationError } from "./csv-validation";
import { saveProject } from "@/lib/timesheet/project-service";
import { saveCustomer, fetchCustomers } from "./customer-service";
import { saveContract } from "./contract-service";
import { createUser } from "./user-service";

export type EntityType = 'projects' | 'customers' | 'contracts' | 'team-members';

export interface ImportResult {
  success: number;
  errors: number;
  validationErrors: ValidationError[];
  processingErrors: string[];
}

export interface ImportProgress {
  processed: number;
  total: number;
  current: string;
}

export const importCSV = async (
  file: File,
  entityType: EntityType,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> => {
  const csvText = await file.text();
  const parsed = parseCSV(csvText);
  
  if (parsed.errors.length > 0) {
    return {
      success: 0,
      errors: parsed.errors.length,
      validationErrors: [],
      processingErrors: parsed.errors
    };
  }

  // Validate required headers
  const requiredHeaders = getRequiredHeaders(entityType);
  const missingHeaders = requiredHeaders.filter(header => !parsed.headers.includes(header));
  
  if (missingHeaders.length > 0) {
    return {
      success: 0,
      errors: 1,
      validationErrors: [],
      processingErrors: [`Missing required headers: ${missingHeaders.join(', ')}`]
    };
  }

  // Validate all rows first
  const validationErrors: ValidationError[] = [];
  const validator = getValidator(entityType);
  
  parsed.data.forEach((row, index) => {
    const rowErrors = validator(row, index + 2); // +2 because of 0-index and header row
    validationErrors.push(...rowErrors);
  });

  if (validationErrors.length > 0) {
    return {
      success: 0,
      errors: validationErrors.length,
      validationErrors,
      processingErrors: []
    };
  }

  // Get existing customers if needed for reference resolution
  let existingCustomers: any[] = [];
  if (entityType === 'projects' || entityType === 'contracts') {
    existingCustomers = await fetchCustomers();
  }

  // Process rows in batches
  const batchSize = 50;
  let successCount = 0;
  const processingErrors: string[] = [];
  
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const rowIndex = i + j + 1;
      
      onProgress?.({
        processed: i + j,
        total: parsed.data.length,
        current: getRowIdentifier(row, entityType)
      });
      
      try {
        await processRow(row, entityType, existingCustomers, rowIndex);
        successCount++;
      } catch (error) {
        processingErrors.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  return {
    success: successCount,
    errors: processingErrors.length,
    validationErrors: [],
    processingErrors
  };
};

const getRequiredHeaders = (entityType: EntityType): string[] => {
  const headers = {
    projects: ['name', 'budget_hours'],
    customers: ['name'],
    contracts: ['name', 'start_date', 'end_date', 'status'],
    'team-members': ['email', 'password']
  };
  
  return headers[entityType];
};

const getValidator = (entityType: EntityType) => {
  const validators = {
    projects: validateProjectRow,
    customers: validateCustomerRow,
    contracts: validateContractRow,
    'team-members': validateTeamMemberRow
  };
  
  return validators[entityType];
};

const getRowIdentifier = (row: Record<string, string>, entityType: EntityType): string => {
  switch (entityType) {
    case 'projects':
    case 'customers':
    case 'contracts':
      return row.name || 'Unnamed';
    case 'team-members':
      return row.email || row.full_name || 'Unknown';
    default:
      return 'Processing...';
  }
};

const processRow = async (
  row: Record<string, string>,
  entityType: EntityType,
  existingCustomers: any[],
  rowIndex: number
): Promise<void> => {
  switch (entityType) {
    case 'projects':
      await processProjectRow(row, existingCustomers);
      break;
    case 'customers':
      await processCustomerRow(row);
      break;
    case 'contracts':
      await processContractRow(row, existingCustomers);
      break;
    case 'team-members':
      await processTeamMemberRow(row);
      break;
  }
};

const processProjectRow = async (row: Record<string, string>, existingCustomers: any[]): Promise<void> => {
  let customerId = null;
  
  if (row.customer_name?.trim()) {
    const customer = existingCustomers.find(c => c.name.toLowerCase() === row.customer_name.toLowerCase());
    if (customer) {
      customerId = customer.id;
    }
  }
  
  const projectData = {
    name: row.name,
    description: row.description || null,
    budget_hours: Number(row.budget_hours),
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    customer_id: customerId,
    is_active: true
  };
  
  await saveProject(projectData);
};

const processCustomerRow = async (row: Record<string, string>): Promise<void> => {
  const customerData = {
    name: row.name,
    email: row.email || null,
    phone: row.phone || null,
    company: row.company || null
  };
  
  await saveCustomer(customerData);
};

const processContractRow = async (row: Record<string, string>, existingCustomers: any[]): Promise<void> => {
  let customerId = null;
  
  if (row.customer_name?.trim()) {
    const customer = existingCustomers.find(c => c.name.toLowerCase() === row.customer_name.toLowerCase());
    if (customer) {
      customerId = customer.id;
    }
  }
  
  const contractData = {
    name: row.name,
    description: row.description || null,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status as 'active' | 'expired' | 'pending_renewal' | 'renewed',
    customer_id: customerId,
    is_active: true
  };
  
  await saveContract(contractData, []);
};

const processTeamMemberRow = async (row: Record<string, string>): Promise<void> => {
  const userData = {
    full_name: row.full_name || null,
    email: row.email,
    password: row.password,
    employee_card_id: row.employee_card_id || null,
    employment_type: (row.employment_type as 'full-time' | 'part-time') || 'full-time',
    role: row.role || 'employee',
    organization: row.organization || null,
    time_zone: row.time_zone || null
  };
  
  await createUser(userData);
};
