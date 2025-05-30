export interface ParsedCSVData {
  headers: string[];
  data: Record<string, string>[];
  errors: string[];
}

export const parseCSV = (csvText: string): ParsedCSVData => {
  const lines = csvText.trim().split('\n');
  const errors: string[] = [];
  
  if (lines.length === 0) {
    return { headers: [], data: [], errors: ['CSV file is empty'] };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  if (headers.length === 0) {
    return { headers: [], data: [], errors: ['No headers found in CSV'] };
  }

  // Parse data rows
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return { headers, data, errors };
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
};

export const generateCSVTemplate = (entityType: 'projects' | 'customers' | 'contracts' | 'team-members' | 'timesheet-entries'): string => {
  const templates = {
    projects: 'name,description,budget_hours,start_date,end_date,customer_name\n"Sample Project","Project description",120,2024-01-15,2024-06-15,"Sample Customer"',
    customers: 'name,email,phone,company\n"John Doe","john@example.com","+1234567890","Acme Corp"',
    contracts: 'name,description,start_date,end_date,status,customer_name\n"Annual Support","24/7 support service",2024-01-01,2024-12-31,"active","Sample Customer"',
    'team-members': 'full_name,email,employee_card_id,employment_type,role,organization,time_zone,password\n"Jane Smith","jane@company.com","EMP001","full-time","employee","Engineering","America/New_York","TempPass123"',
    'timesheet-entries': 'project_name,entry_date,hours_logged,notes,jira_task_id,start_time,end_time\n"Sample Project",2024-01-15,8,"Daily development work","PROJ-123","09:00","17:00"'
  };
  
  return templates[entityType];
};
