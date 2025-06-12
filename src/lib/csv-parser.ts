
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

export const generateCSVTemplate = (entityType: 'projects' | 'customers' | 'contracts' | 'team-members'): string => {
  const templates = {
    projects: 'name,description,budget_hours,customer_name,is_internal,is_active\n"Website Development","Client website project",120,"Acme Corp",false,true\n"Internal Tool Development","Internal productivity tools",200,"",true,true',
    customers: 'name,email,phone,company\n"John Doe","john@example.com","+1234567890","Acme Corp"',
    contracts: 'name,description,start_date,end_date,status,customer_name\n"Annual Support","24/7 support service",01/01/2024,31/12/2024,"active","Sample Customer"',
    'team-members': 'full_name,email,password,role,organization,time_zone,employment_type,employee_id,employee_card_id\n"Jane Smith","jane@company.com","TempPass123","employee","Engineering","America/New_York","full-time","EMP001","CARD001"\n"John Doe","john@company.com","TempPass456","admin","Management","America/Los_Angeles","full-time","EMP002","CARD002"'
  };
  
  return templates[entityType];
};
