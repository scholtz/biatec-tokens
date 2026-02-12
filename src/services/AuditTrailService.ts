/**
 * Audit Trail Service
 * Handles deployment audit logging and retrieval for compliance
 */

import type {
  AuditTrailEntry,
  AuditTrailResponse,
  AuditReportRequest,
  AuditReportResponse,
  AuditEventType,
  AuditEventSeverity,
  DeploymentAuditMetadata,
} from '../types/auditTrail';

export class AuditTrailError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AuditTrailError';
  }
}

export class AuditTrailService {
  private auditEntries: AuditTrailEntry[] = [];

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    severity: AuditEventSeverity,
    actor: { address: string; email?: string; name?: string },
    resource: {
      type: 'account' | 'token' | 'transaction';
      id: string;
      network?: string;
      standard?: string;
    },
    action: string,
    details?: {
      status?: string;
      transactionId?: string;
      errorCode?: string;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const entry: AuditTrailEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      actor,
      resource,
      action,
      details: details || {},
      ipAddress: await this.getClientIp(),
      userAgent: navigator.userAgent,
    };

    // Store in memory for MVP
    this.auditEntries.push(entry);

    // In production, this would call POST /api/audit/log
    if (import.meta.env.DEV) {
      console.log('[AuditTrail] Event logged:', entry);
    }
  }

  /**
   * Get audit trail for a deployment
   */
  async getDeploymentAuditTrail(
    deploymentId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditTrailResponse> {
    try {
      // For MVP, use mock implementation
      const response = await this.mockGetAuditTrail(deploymentId, page, pageSize);
      return response;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Generate audit report for download
   */
  async generateAuditReport(
    request: AuditReportRequest
  ): Promise<AuditReportResponse> {
    try {
      const auditTrail = await this.getDeploymentAuditTrail(request.deploymentId, 1, 1000);
      
      const summary = this.generateSummary(auditTrail.entries, request.deploymentId);

      const report: AuditReportResponse = {
        deploymentId: request.deploymentId,
        generatedAt: new Date().toISOString(),
        format: request.format || 'json',
        data: auditTrail.entries,
        summary,
      };

      return report;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Download audit report as file
   */
  async downloadAuditReport(
    deploymentId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<void> {
    const report = await this.generateAuditReport({
      deploymentId,
      format,
      includeMetadata: true,
    });

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'csv') {
      content = this.convertToCSV(report.data);
      mimeType = 'text/csv';
      filename = `audit-report-${deploymentId}-${Date.now()}.csv`;
    } else {
      content = JSON.stringify(report, null, 2);
      mimeType = 'application/json';
      filename = `audit-report-${deploymentId}-${Date.now()}.json`;
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get deployment audit metadata for status tracking
   */
  async getDeploymentMetadata(deploymentId: string): Promise<DeploymentAuditMetadata> {
    const auditTrail = await this.getDeploymentAuditTrail(deploymentId);
    
    const statusTransitions = auditTrail.entries
      .filter(e => e.eventType.includes('deployment'))
      .map(e => ({
        from: e.details.metadata?.previousStatus as string || 'unknown',
        to: e.details.status || 'unknown',
        timestamp: e.timestamp,
        transactionId: e.details.transactionId,
      }));

    const firstEntry = auditTrail.entries[0];
    
    return {
      deploymentId,
      tokenStandard: firstEntry?.resource.standard || 'unknown',
      network: firstEntry?.resource.network || 'unknown',
      initiatedBy: firstEntry?.actor.email || firstEntry?.actor.address || 'unknown',
      initiatedAt: firstEntry?.timestamp || new Date().toISOString(),
      statusTransitions,
    };
  }

  /**
   * Mock implementation for MVP
   * In production, this would call GET /api/audit/deployments/{id}
   */
  private async mockGetAuditTrail(
    deploymentId: string,
    page: number,
    pageSize: number
  ): Promise<AuditTrailResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Filter stored entries by deployment ID
    const deploymentEntries = this.auditEntries.filter(
      e => e.resource.id === deploymentId
    );

    // If no entries, generate sample entries for demo
    if (deploymentEntries.length === 0) {
      const sampleEntries = this.generateSampleAuditEntries(deploymentId);
      this.auditEntries.push(...sampleEntries);
      deploymentEntries.push(...sampleEntries);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedEntries = deploymentEntries.slice(start, end);

    // Return deep copies to ensure immutability
    return {
      entries: JSON.parse(JSON.stringify(paginatedEntries)),
      total: deploymentEntries.length,
      page,
      pageSize,
    };
  }

  /**
   * Generate sample audit entries for demo
   */
  private generateSampleAuditEntries(deploymentId: string): AuditTrailEntry[] {
    const savedUser = localStorage.getItem('algorand_user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    const actor = {
      address: user?.address || 'UNKNOWN',
      email: user?.email,
      name: user?.name,
    };

    const baseTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    return [
      {
        id: this.generateId(),
        timestamp: new Date(baseTime).toISOString(),
        eventType: 'deployment_initiated',
        severity: 'info',
        actor,
        resource: {
          type: 'token',
          id: deploymentId,
          network: 'algorand-testnet',
          standard: 'ARC3',
        },
        action: 'Initiated token deployment',
        details: {
          status: 'initiated',
          metadata: { requestId: deploymentId },
        },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      },
      {
        id: this.generateId(),
        timestamp: new Date(baseTime + 60000).toISOString(),
        eventType: 'deployment_submitted',
        severity: 'info',
        actor,
        resource: {
          type: 'transaction',
          id: `txn-${deploymentId}`,
          network: 'algorand-testnet',
          standard: 'ARC3',
        },
        action: 'Transaction submitted to blockchain',
        details: {
          status: 'submitted',
          transactionId: `TXN${Math.random().toString(36).substring(7).toUpperCase()}`,
        },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      },
      {
        id: this.generateId(),
        timestamp: new Date(baseTime + 120000).toISOString(),
        eventType: 'deployment_confirmed',
        severity: 'info',
        actor,
        resource: {
          type: 'transaction',
          id: `txn-${deploymentId}`,
          network: 'algorand-testnet',
          standard: 'ARC3',
        },
        action: 'Transaction confirmed on blockchain',
        details: {
          status: 'confirmed',
          transactionId: `TXN${Math.random().toString(36).substring(7).toUpperCase()}`,
        },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      },
    ];
  }

  /**
   * Generate summary from audit entries
   */
  private generateSummary(
    entries: AuditTrailEntry[],
    _deploymentId: string
  ): AuditReportResponse['summary'] {
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];

    return {
      totalEvents: entries.length,
      startTime: firstEntry?.timestamp || new Date().toISOString(),
      endTime: lastEntry?.timestamp || new Date().toISOString(),
      status: lastEntry?.details.status || 'unknown',
      actor: firstEntry?.actor.email || firstEntry?.actor.address || 'unknown',
      network: firstEntry?.resource.network || 'unknown',
      standard: firstEntry?.resource.standard || 'unknown',
    };
  }

  /**
   * Convert audit entries to CSV format
   */
  private convertToCSV(entries: AuditTrailEntry[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'Event Type',
      'Severity',
      'Actor',
      'Resource Type',
      'Resource ID',
      'Network',
      'Standard',
      'Action',
      'Status',
      'Transaction ID',
      'Error Code',
      'Error Message',
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.timestamp,
      entry.eventType,
      entry.severity,
      entry.actor.email || entry.actor.address,
      entry.resource.type,
      entry.resource.id,
      entry.resource.network || '',
      entry.resource.standard || '',
      entry.action,
      entry.details.status || '',
      entry.details.transactionId || '',
      entry.details.errorCode || '',
      entry.details.errorMessage || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get client IP (mock for MVP)
   */
  private async getClientIp(): Promise<string> {
    // In production, this would be obtained from the request or backend
    return '127.0.0.1';
  }

  /**
   * Map error to AuditTrailError
   */
  private mapError(error: unknown): AuditTrailError {
    if (error instanceof AuditTrailError) {
      return error;
    }

    if (error instanceof Error) {
      return new AuditTrailError(error.message, 'UNKNOWN_ERROR', 500);
    }

    return new AuditTrailError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
  }
}

// Export singleton instance
export const auditTrailService = new AuditTrailService();
