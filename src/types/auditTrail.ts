/**
 * Types for deployment audit trail and compliance logging
 */

export type AuditEventType =
  | 'account_created'
  | 'account_provisioned'
  | 'deployment_initiated'
  | 'deployment_submitted'
  | 'deployment_confirmed'
  | 'deployment_completed'
  | 'deployment_failed'
  | 'deployment_retried';

export type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditEventSeverity;
  actor: {
    address: string;
    email?: string;
    name?: string;
  };
  resource: {
    type: 'account' | 'token' | 'transaction';
    id: string;
    network?: string;
    standard?: string;
  };
  action: string;
  details: {
    status?: string;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditTrailResponse {
  entries: AuditTrailEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditReportRequest {
  deploymentId: string;
  format?: 'json' | 'csv' | 'pdf';
  includeMetadata?: boolean;
}

export interface AuditReportResponse {
  deploymentId: string;
  generatedAt: string;
  format: string;
  data: AuditTrailEntry[];
  summary: {
    totalEvents: number;
    startTime: string;
    endTime: string;
    status: string;
    actor: string;
    network: string;
    standard: string;
  };
}

export interface DeploymentAuditMetadata {
  deploymentId: string;
  tokenStandard: string;
  network: string;
  initiatedBy: string;
  initiatedAt: string;
  statusTransitions: Array<{
    from: string;
    to: string;
    timestamp: string;
    transactionId?: string;
  }>;
}
