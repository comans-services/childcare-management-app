// Stub component
import React from "react";

interface AuditLogsTableProps {
  data?: any[];
  auditData?: any[];
  users?: any[];
  isLoading?: boolean;
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = () => {
  return <div>Audit Logs Table</div>;
};

export default AuditLogsTable;
