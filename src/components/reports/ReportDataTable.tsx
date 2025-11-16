// Stub component
import React from "react";

interface ReportDataTableProps {
  data?: any[];
  filters?: any;
  reportData?: any[];
  projects?: any[];
  contracts?: any[];
  users?: any[];
  isLoading?: boolean;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = () => {
  return <div>Report Data Table</div>;
};

export default ReportDataTable;
