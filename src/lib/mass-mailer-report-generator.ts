import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { CampaignMetrics, ContactGrowthData, EngagementStats } from "./mass-mailer-analytics-service";

export interface ReportData {
  title: string;
  dateRange: { start: Date; end: Date };
  metrics: CampaignMetrics | any;
  charts?: any[];
}

export const generatePDFReport = (data: ReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cover page
  doc.setFontSize(24);
  doc.text(data.title, pageWidth / 2, 30, { align: "center" });
  
  doc.setFontSize(14);
  const dateRangeText = `${format(data.dateRange.start, "MMM dd, yyyy")} - ${format(data.dateRange.end, "MMM dd, yyyy")}`;
  doc.text(dateRangeText, pageWidth / 2, 45, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "PPpp")}`, pageWidth / 2, 55, { align: "center" });
  
  // Executive Summary
  doc.setFontSize(18);
  doc.text("Executive Summary", 20, 80);
  
  let y = 95;
  doc.setFontSize(12);
  
  if (data.metrics.totalCampaigns !== undefined) {
    doc.text(`Total Campaigns Sent: ${data.metrics.totalCampaigns}`, 20, y);
    y += 10;
    doc.text(`Total Emails Delivered: ${data.metrics.totalDelivered?.toLocaleString()}`, 20, y);
    y += 10;
    doc.text(`Average Delivery Rate: ${data.metrics.averageDeliveryRate?.toFixed(1)}%`, 20, y);
    y += 10;
    doc.text(`Average Bounce Rate: ${data.metrics.averageBounceRate?.toFixed(1)}%`, 20, y);
  }
  
  // Add metrics table
  if (data.metrics) {
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Detailed Metrics", 20, 20);
    
    const tableData = Object.entries(data.metrics).map(([key, value]) => [
      key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()),
      typeof value === "number" ? value.toLocaleString() : String(value),
    ]);
    
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: tableData,
      headStyles: { fillColor: [59, 130, 246], fontSize: 12 },
      bodyStyles: { fontSize: 11 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }
  
  // Recommendations
  doc.addPage();
  doc.setFontSize(18);
  doc.text("Recommendations", 20, 20);
  
  doc.setFontSize(12);
  y = 35;
  
  if (data.metrics.averageDeliveryRate >= 95) {
    doc.text("✓ Excellent delivery rate! Keep using similar subject lines and send times.", 20, y);
  } else if (data.metrics.averageDeliveryRate >= 85) {
    doc.text("• Good delivery rate, but room for improvement.", 20, y);
    y += 10;
    doc.text("  Consider cleaning your contact list to remove invalid emails.", 20, y);
  } else {
    doc.text("⚠ Low delivery rate detected.", 20, y);
    y += 10;
    doc.text("  Action needed: Review your contact list for invalid email addresses.", 20, y);
  }
  
  y += 15;
  if (data.metrics.averageBounceRate > 5) {
    doc.text("⚠ High bounce rate detected.", 20, y);
    y += 10;
    doc.text("  Consider removing bounced email addresses from your list.", 20, y);
  }
  
  // Save the PDF
  const fileName = `${data.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};

export const generateExcelReport = (data: ReportData): void => {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ["Report Title", data.title],
    ["Date Range", `${format(data.dateRange.start, "MMM dd, yyyy")} - ${format(data.dateRange.end, "MMM dd, yyyy")}`],
    ["Generated", format(new Date(), "PPpp")],
    [""],
    ["Metric", "Value"],
    ...Object.entries(data.metrics).map(([key, value]) => [
      key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()),
      typeof value === "number" ? value : String(value),
    ]),
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  
  // Save the Excel file
  const fileName = `${data.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const generateTextReport = (data: ReportData): string => {
  let report = `${data.title}\n`;
  report += `${"=".repeat(data.title.length)}\n\n`;
  
  report += `Date Range: ${format(data.dateRange.start, "MMM dd, yyyy")} - ${format(data.dateRange.end, "MMM dd, yyyy")}\n`;
  report += `Generated: ${format(new Date(), "PPpp")}\n\n`;
  
  report += `SUMMARY\n`;
  report += `-------\n`;
  
  if (data.metrics.totalCampaigns !== undefined) {
    report += `Total Campaigns Sent: ${data.metrics.totalCampaigns}\n`;
    report += `Total Emails Delivered: ${data.metrics.totalDelivered?.toLocaleString()}\n`;
    report += `Average Delivery Rate: ${data.metrics.averageDeliveryRate?.toFixed(1)}%\n`;
    report += `Average Bounce Rate: ${data.metrics.averageBounceRate?.toFixed(1)}%\n`;
  }
  
  report += `\n\nDETAILED METRICS\n`;
  report += `----------------\n`;
  
  Object.entries(data.metrics).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
    report += `${label}: ${typeof value === "number" ? value.toLocaleString() : String(value)}\n`;
  });
  
  return report;
};

export const downloadTextReport = (data: ReportData): void => {
  const text = generateTextReport(data);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
