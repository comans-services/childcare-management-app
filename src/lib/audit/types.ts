
export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_name: string | null;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface AuditFilters {
  startDate: Date;
  endDate: Date;
  userId?: string;
  actionType?: string;
}

export interface ReportGenerationDetails {
  reportType: 'timesheet' | 'audit';
  filters: any;
  resultCount: number;
}
