import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MatrixExportFilters {
  startDate: Date;
  endDate: Date;
  employmentType?: string;
  userIds?: string[];
}

interface EmployeeData {
  id: string;
  full_name: string;
  employment_type: string;
  employee_id: string | null;
}

interface DayData {
  hours?: number;
  isHoliday?: boolean;
  isWeekend?: boolean;
}

interface MatrixData {
  title: string;
  period: string;
  employees: EmployeeData[];
  dates: Date[];
  matrix: Record<string, Record<string, DayData>>; // date -> employeeId -> data
  employeeTotals: Record<string, number>;
  dateTotals: Record<string, number>;
  grandTotal: number;
}

// Fetch all required data for the matrix
export const fetchMatrixData = async (
  filters: MatrixExportFilters
): Promise<MatrixData> => {
  const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
  const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
  
  // 1. Fetch employees based on filters
  let employeesQuery = supabase
    .from('profiles')
    .select('id, full_name, employment_type, employee_id')
    .eq('is_active', true)
    .order('full_name');

  if (filters.userIds && filters.userIds.length > 0) {
    employeesQuery = employeesQuery.in('id', filters.userIds);
  }

  const { data: employeesData, error: empError } = await employeesQuery;
  if (empError) throw empError;

  // Filter by employment type
  let employees = (employeesData || []) as EmployeeData[];
  if (filters.employmentType === 'permanent') {
    employees = employees.filter(e => 
      e.employment_type === 'full-time' || e.employment_type === 'part-time'
    );
  } else if (filters.employmentType === 'casual') {
    employees = employees.filter(e => e.employment_type === 'casual');
  }

  // 2. Fetch timesheet entries
  const { data: timesheetData, error: tsError } = await supabase
    .from('timesheet_entries')
    .select('user_id, entry_date, hours_logged')
    .gte('entry_date', startDateStr)
    .lte('entry_date', endDateStr)
    .in('user_id', employees.map(e => e.id));
  
  if (tsError) throw tsError;

  // 3. Fetch public holidays
  const { data: holidays, error: holError } = await supabase
    .from('public_holidays')
    .select('date, name')
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  if (holError) throw holError;

  const holidayDates = new Set((holidays || []).map(h => h.date));

  // Build the matrix
  const dates = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
  const matrix: Record<string, Record<string, DayData>> = {};
  const employeeTotals: Record<string, number> = {};
  const dateTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize
  employees.forEach(emp => {
    employeeTotals[emp.id] = 0;
  });
  dates.forEach(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    matrix[dateKey] = {};
    dateTotals[dateKey] = 0;
  });

  // Fill timesheet hours
  (timesheetData || []).forEach((entry: any) => {
    const dateKey = entry.entry_date;
    if (matrix[dateKey]) {
      if (!matrix[dateKey][entry.user_id]) {
        matrix[dateKey][entry.user_id] = {};
      }
      const hours = Number(entry.hours_logged) || 0;
      matrix[dateKey][entry.user_id].hours = 
        (matrix[dateKey][entry.user_id].hours || 0) + hours;
      employeeTotals[entry.user_id] = (employeeTotals[entry.user_id] || 0) + hours;
      dateTotals[dateKey] = (dateTotals[dateKey] || 0) + hours;
      grandTotal += hours;
    }
  });

  // Mark holidays and weekends
  dates.forEach(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const isHoliday = holidayDates.has(dateKey);
    const weekend = isWeekend(date);

    employees.forEach(emp => {
      if (!matrix[dateKey][emp.id]) {
        matrix[dateKey][emp.id] = {};
      }
      if (isHoliday && !matrix[dateKey][emp.id].hours) {
        matrix[dateKey][emp.id].isHoliday = true;
      }
      if (weekend) {
        matrix[dateKey][emp.id].isWeekend = true;
      }
    });
  });

  // Determine title based on employment type
  let title = 'All Staff Timesheet';
  if (filters.employmentType === 'permanent') {
    title = 'Permanent Staff Timesheet';
  } else if (filters.employmentType === 'casual') {
    title = 'Casual Staff Timesheet';
  }

  return {
    title,
    period: `${format(filters.startDate, 'dd/MM/yyyy')} - ${format(filters.endDate, 'dd/MM/yyyy')}`,
    employees,
    dates,
    matrix,
    employeeTotals,
    dateTotals,
    grandTotal,
  };
};

// Generate CSV in matrix format
export const generateMatrixCSV = (data: MatrixData): string => {
  const { title, period, employees, dates, matrix, employeeTotals, dateTotals, grandTotal } = data;
  
  const lines: string[] = [];
  
  // Title and period
  lines.push(`"${title}"`);
  lines.push(`"Period: ${period}"`);
  lines.push(''); // Empty line
  
  // Header row: Date + employee names (with ID) + Daily Total
  const headerRow = ['Date', ...employees.map(e => 
    e.employee_id && e.employee_id.trim() 
      ? `${e.full_name} (#${e.employee_id.trim()})` 
      : e.full_name
  ), 'Daily Total'];
  lines.push(headerRow.map(h => `"${h}"`).join(','));
  
  // Data rows
  dates.forEach(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateDisplay = format(date, 'EEE dd/MM');
    const dayData = matrix[dateKey];
    
    const row: string[] = [dateDisplay];
    
    employees.forEach(emp => {
      const cellData = dayData[emp.id] || {};
      let cellValue = '';
      
      if (cellData.hours && cellData.hours > 0) {
        cellValue = cellData.hours.toFixed(1);
      } else if (cellData.isHoliday) {
        cellValue = 'PH';
      } else if (cellData.isWeekend) {
        cellValue = '-';
      }
      
      row.push(cellValue);
    });
    
    // Daily total (exclude weekends from display but still calculate)
    const dailyTotal = dateTotals[dateKey] || 0;
    row.push(dailyTotal > 0 ? dailyTotal.toFixed(1) : '');
    
    lines.push(row.map(v => `"${v}"`).join(','));
  });
  
  // Totals row
  const totalsRow = ['Total Hours'];
  employees.forEach(emp => {
    const total = employeeTotals[emp.id] || 0;
    totalsRow.push(total.toFixed(1));
  });
  totalsRow.push(grandTotal.toFixed(1));
  lines.push(totalsRow.map(v => `"${v}"`).join(','));
  
  // Empty line and legend
  lines.push('');
  lines.push(`"Legend: PH = Public Holiday"`);
  
  return lines.join('\n');
};

// Generate PDF in matrix format
export const generateMatrixPDF = (data: MatrixData): jsPDF => {
  const { title, period, employees, dates, matrix, employeeTotals, dateTotals, grandTotal } = data;
  
  // Use landscape for more columns
  const doc = new jsPDF({
    orientation: employees.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);
  
  // Period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${period}`, 14, 22);
  
  // Prepare table data
  const tableHeaders = ['Date', ...employees.map(e => 
    e.employee_id && e.employee_id.trim() 
      ? `${e.full_name}\n#${e.employee_id.trim()}` 
      : e.full_name
  ), 'Total'];
  
  const tableBody: any[][] = [];
  
  dates.forEach(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateDisplay = format(date, 'EEE dd/MM');
    const dayData = matrix[dateKey];
    
    const row: any[] = [dateDisplay];
    
    employees.forEach(emp => {
      const cellData = dayData[emp.id] || {};
      let cellValue = '';
      
      if (cellData.hours && cellData.hours > 0) {
        cellValue = cellData.hours.toFixed(1);
      } else if (cellData.isHoliday) {
        cellValue = 'PH';
      } else if (cellData.isWeekend) {
        cellValue = '-';
      }
      
      row.push(cellValue);
    });
    
    const dailyTotal = dateTotals[dateKey] || 0;
    row.push(dailyTotal > 0 ? dailyTotal.toFixed(1) : '');
    
    tableBody.push(row);
  });
  
  // Totals row
  const totalsRow: any[] = [{ content: 'Total Hours', styles: { fontStyle: 'bold' } }];
  employees.forEach(emp => {
    const total = employeeTotals[emp.id] || 0;
    totalsRow.push({ content: total.toFixed(1), styles: { fontStyle: 'bold' } });
  });
  totalsRow.push({ content: grandTotal.toFixed(1), styles: { fontStyle: 'bold' } });
  tableBody.push(totalsRow);
  
  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 25 }, // Date column
    },
    didParseCell: (data) => {
      // Style PH differently
      const cellText = String(data.cell.raw || '');
      if (cellText === 'PH') {
        data.cell.styles.fontStyle = 'italic';
        data.cell.styles.textColor = [100, 100, 100];
      }
      if (cellText === '-') {
        data.cell.styles.textColor = [180, 180, 180];
      }
    },
  });
  
  // Add legend at bottom
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Legend: PH = Public Holiday', 14, finalY + 8);
  
  return doc;
};

// Download CSV
export const downloadMatrixCSV = (data: MatrixData, filename: string) => {
  const csvContent = generateMatrixCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download PDF
export const downloadMatrixPDF = (data: MatrixData, filename: string) => {
  const doc = generateMatrixPDF(data);
  doc.save(filename);
};
