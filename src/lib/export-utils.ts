
import { TimesheetEntry, Project } from "./timesheet-service";
import { User } from "./user-service";
import { formatDateDisplay } from "./date-utils";
import { ReportFiltersType, ReportColumnConfigType } from "@/pages/ReportsPage";

// Data validation functions
export const validateExportData = (
  reportData: TimesheetEntry[], 
  projects: Project[], 
  users: User[]
): { isValid: boolean; error?: string } => {
  if (!reportData || reportData.length === 0) {
    return { isValid: false, error: "No timesheet data available to export. Please generate a report first." };
  }
  
  if (!projects || projects.length === 0) {
    return { isValid: false, error: "Project data is missing. Please refresh the page and try again." };
  }
  
  if (!users || users.length === 0) {
    return { isValid: false, error: "User data is missing. Please refresh the page and try again." };
  }
  
  return { isValid: true };
};

// Helper functions for data formatting
const formatReportData = (
  reportData: TimesheetEntry[], 
  projects: Project[],
  users: User[],
  columnConfig: ReportColumnConfigType
) => {
  const projectMap = new Map<string, Project>();
  projects.forEach(project => projectMap.set(project.id, project));
  
  const userMap = new Map<string, User>();
  users.forEach(user => userMap.set(user.id, user));

  return reportData.map(entry => {
    const project = projectMap.get(entry.project_id);
    const employee = userMap.get(entry.user_id);
    
    const baseData: any = {
      Date: formatDateDisplay(new Date(entry.entry_date)),
      Employee: employee?.full_name || entry.user?.full_name || 'Unknown Employee',
    };

    // Add employee details if configured
    if (columnConfig.includeEmployeeDetails) {
      baseData['User ID'] = entry.user_id;
      baseData['Employee Card ID'] = employee?.employee_card_id || entry.user?.employee_card_id || '';
    }

    // Add project name
    baseData.Project = project?.name || entry.project?.name || 'Unknown Project';

    // Add project details if configured
    if (columnConfig.includeProjectDetails) {
      baseData['Project Description'] = project?.description || entry.project?.description || '';
    }

    // Add hours
    baseData.Hours = entry.hours_logged;

    // Add Jira task ID if configured
    if (columnConfig.includeJiraTaskId) {
      baseData['Jira Task ID'] = entry.jira_task_id || '';
    }

    // Add notes
    baseData.Notes = entry.notes || '';

    return baseData;
  });
};

// Improved CSV Export with validation
export const exportToCSV = (
  reportData: TimesheetEntry[], 
  projects: Project[],
  users: User[],
  columnConfig: ReportColumnConfigType,
  filename: string
) => {
  console.log("Starting CSV export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users, columnConfig);

  // Convert data to CSV format
  const headers = Object.keys(formattedData[0] || {}).join(',');
  const rows = formattedData.map(row => 
    Object.values(row)
      .map(value => `"${String(value).replace(/"/g, '""')}"`) // Escape quotes
      .join(',')
  );
  const csvContent = `${headers}\n${rows.join('\n')}`;

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log("CSV export completed successfully");
};

// Improved Excel Export with proper data validation
export const exportToExcel = (
  reportData: TimesheetEntry[], 
  projects: Project[],
  users: User[],
  columnConfig: ReportColumnConfigType,
  filename: string
) => {
  console.log("Starting Excel export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users, columnConfig);
  
  // Calculate total hours
  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  
  // Add total row
  const totalRow: any = {};
  const firstRowKeys = Object.keys(formattedData[0] || {});
  firstRowKeys.forEach((key, index) => {
    if (index === 0) {
      totalRow[key] = 'TOTAL';
    } else if (key === 'Hours') {
      totalRow[key] = totalHours;
    } else {
      totalRow[key] = '';
    }
  });
  formattedData.push(totalRow);
  
  // Create Excel-compatible CSV content with BOM for proper UTF-8 encoding
  const BOM = '\uFEFF';
  const headers = Object.keys(formattedData[0] || {}).join('\t'); // Use tabs for better Excel compatibility
  const rows = formattedData.map(row => 
    Object.values(row)
      .map(value => String(value).replace(/\t/g, ' ')) // Replace tabs with spaces
      .join('\t')
  );
  const excelContent = BOM + `${headers}\n${rows.join('\n')}`;

  // Create and download as Excel file
  const blob = new Blob([excelContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xlsx`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log("Excel export completed successfully");
};

// PDF Export with improved error handling
export const exportToPDF = (
  reportData: TimesheetEntry[], 
  projects: Project[],
  users: User[],
  filters: ReportFiltersType,
  columnConfig: ReportColumnConfigType,
  filename: string
) => {
  console.log("Starting PDF export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users, columnConfig);
  
  // Calculate total hours
  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  
  // Create a printable HTML page
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to export PDF. Check your browser settings and try again.');
  }
  
  // Get headers for table
  const headers = Object.keys(formattedData[0] || {});
  
  // Style and content for the printable page
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .report-header { margin-bottom: 20px; }
        .filters { margin-bottom: 20px; color: #666; font-size: 0.9em; }
        .total-row { font-weight: bold; background-color: #f2f2f2; }
        .truncate { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>Timesheet Report</h1>
        <div class="filters">
          <p>
            Date Range: ${formatDateDisplay(filters.startDate)} to ${formatDateDisplay(filters.endDate)} 
            ${filters.projectId ? `| Project: ${projects.find(p => p.id === filters.projectId)?.name || 'Unknown'}` : ''}
            ${filters.userId ? `| Employee: ${users.find(u => u.id === filters.userId)?.full_name || 'Unknown'}` : ''}
          </p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${formattedData.map(row => `
            <tr>
              ${headers.map(header => `<td class="truncate">${row[header]}</td>`).join('')}
            </tr>
          `).join('')}
          <tr class="total-row">
            ${headers.map((header, index) => {
              if (index === 0) return '<td>Total</td>';
              if (header === 'Hours') return `<td>${totalHours.toFixed(1)}</td>`;
              return '<td></td>';
            }).join('')}
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `);
  
  // Wait for content to load then print
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
  
  console.log("PDF export completed successfully");
};
