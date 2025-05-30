
import { TimesheetEntry, Project } from "./timesheet-service";
import { User } from "./user-service";
import { formatDateDisplay } from "./date-utils";
import { ReportFiltersType } from "@/pages/ReportsPage";

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
  users: User[]
) => {
  const projectMap = new Map<string, Project>();
  projects.forEach(project => projectMap.set(project.id, project));
  
  const userMap = new Map<string, User>();
  users.forEach(user => userMap.set(user.id, user));

  return reportData.map(entry => {
    const project = projectMap.get(entry.project_id);
    const employee = userMap.get(entry.user_id);
    
    return {
      Date: formatDateDisplay(new Date(entry.entry_date)),
      Employee: employee?.full_name || 'Unknown Employee',
      Project: project?.name || 'Unknown Project',
      Hours: entry.hours_logged,
      'Jira Task ID': entry.jira_task_id || '',
      Notes: entry.notes || ''
    };
  });
};

// Improved CSV Export with validation
export const exportToCSV = (
  reportData: TimesheetEntry[], 
  projects: Project[],
  users: User[],
  filename: string
) => {
  console.log("Starting CSV export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users);

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
  filename: string
) => {
  console.log("Starting Excel export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users);
  
  // Calculate total hours
  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  
  // Add total row
  formattedData.push({
    Date: 'TOTAL',
    Employee: '',
    Project: '',
    Hours: totalHours,
    'Jira Task ID': '',
    Notes: ''
  });
  
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
  filename: string
) => {
  console.log("Starting PDF export...");
  
  // Validate data before export
  const validation = validateExportData(reportData, projects, users);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formattedData = formatReportData(reportData, projects, users);
  
  // Calculate total hours
  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  
  // Create a printable HTML page
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to export PDF. Check your browser settings and try again.');
  }
  
  // Style and content for the printable page
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .report-header { margin-bottom: 20px; }
        .filters { margin-bottom: 20px; color: #666; font-size: 0.9em; }
        .total-row { font-weight: bold; background-color: #f2f2f2; }
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
            <th>Date</th>
            <th>Employee</th>
            <th>Project</th>
            <th>Hours</th>
            <th>Jira Task ID</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${formattedData.map(row => `
            <tr>
              <td>${row.Date}</td>
              <td>${row.Employee}</td>
              <td>${row.Project}</td>
              <td>${row.Hours}</td>
              <td>${row['Jira Task ID']}</td>
              <td>${row.Notes}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>Total</td>
            <td></td>
            <td></td>
            <td>${totalHours.toFixed(1)}</td>
            <td></td>
            <td></td>
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
