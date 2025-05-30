
import { EntityType } from "./config";

export const getRowIdentifier = (row: Record<string, string>, entityType: EntityType): string => {
  switch (entityType) {
    case 'projects':
    case 'customers':
    case 'contracts':
      return row.name || 'Unnamed';
    case 'team-members':
      return row.email || row.full_name || 'Unknown';
    case 'timesheet-entries':
      return `${row.project_name || 'Unknown Project'} - ${row.entry_date || 'No Date'}`;
    default:
      return 'Processing...';
  }
};
