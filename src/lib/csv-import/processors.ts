import { saveProject } from "@/lib/timesheet/project-service";
import { saveCustomer } from "@/lib/customer-service";
import { saveContract } from "@/lib/contract-service";
import { createUser } from "@/lib/user-service";
import { saveTimesheetEntry } from "@/lib/timesheet-service";
import { EntityType } from "./config";

export const processProjectRow = async (row: Record<string, string>, existingCustomers: any[]): Promise<void> => {
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

export const processCustomerRow = async (row: Record<string, string>): Promise<void> => {
  const customerData = {
    name: row.name,
    email: row.email || null,
    phone: row.phone || null,
    company: row.company || null
  };
  
  await saveCustomer(customerData);
};

export const processContractRow = async (row: Record<string, string>, existingCustomers: any[]): Promise<void> => {
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

export const processTeamMemberRow = async (row: Record<string, string>): Promise<void> => {
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

export const processTimesheetEntryRow = async (row: Record<string, string>, existingProjects: any[]): Promise<void> => {
  let projectId = null;
  
  if (row.project_name?.trim()) {
    const project = existingProjects.find(p => p.name.toLowerCase() === row.project_name.toLowerCase());
    if (!project) {
      throw new Error(`Project "${row.project_name}" not found`);
    }
    projectId = project.id;
  }
  
  if (!projectId) {
    throw new Error('Project is required for timesheet entry');
  }
  
  const entryData = {
    project_id: projectId,
    entry_date: row.entry_date,
    hours_logged: Number(row.hours_logged),
    notes: row.notes || null,
    jira_task_id: row.jira_task_id || null,
    start_time: row.start_time || null,
    end_time: row.end_time || null
  };
  
  await saveTimesheetEntry(entryData);
};

export const processRow = async (
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
    case 'timesheet-entries':
      await processTimesheetEntryRow(row, existingCustomers); // existingCustomers will be projects for timesheet entries
      break;
  }
};
