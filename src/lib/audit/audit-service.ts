
// Main audit service - re-exports all audit functionality
export type { AuditLogEntry, AuditFilters, ReportGenerationDetails } from "./types";

export { fetchAuditLogs } from "./fetch-service";
export { getAuditActionTypes } from "./action-types-service";
export { logReportGeneration } from "./report-logging-service";
export { logAuditEvent } from "./legacy-service";
