import { getApiClient } from './BiatecTokensApiClient';
import type {
  TransferValidationRequest,
  TransferValidationResponse,
  AuditLogFilters,
  AuditLogResponse,
  ComplianceStatus,
  MicaComplianceMetrics,
} from '../types/compliance';

/**
 * Service for compliance operations including transfer validation and audit logs
 * Supports MICA-aligned workflows for RWA tokens
 */
export class ComplianceService {
  private apiClient = getApiClient();

  /**
   * Validate a transfer between sender and receiver
   * Calls /api/v1/whitelist/validate-transfer
   * 
   * @param request - Transfer validation request with sender, receiver, and amount
   * @returns Validation response with allow/deny decision and reasons
   */
  async validateTransfer(
    request: TransferValidationRequest
  ): Promise<TransferValidationResponse> {
    return this.apiClient.post<TransferValidationResponse>(
      '/v1/whitelist/validate-transfer',
      request
    );
  }

  /**
   * Get audit log entries for a token
   * 
   * @param filters - Filters for audit log query
   * @returns Paginated audit log entries
   */
  async getAuditLog(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const params = new URLSearchParams();
    
    if (filters.tokenId) params.append('tokenId', filters.tokenId);
    if (filters.network) params.append('network', filters.network);
    if (filters.action) params.append('action', filters.action);
    if (filters.actor) params.append('actor', filters.actor);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.result) params.append('result', filters.result);
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiClient.get<AuditLogResponse>(`/v1/audit-log${query}`);
  }

  /**
   * Get compliance status for a token
   * 
   * @param tokenId - The token identifier
   * @param network - The network (VOI or Aramid)
   * @returns Compliance status including whitelist count and issues
   */
  async getComplianceStatus(
    tokenId: string,
    network: string
  ): Promise<ComplianceStatus> {
    return this.apiClient.get<ComplianceStatus>(
      `/v1/compliance/status/${tokenId}?network=${network}`
    );
  }

  /**
   * Export audit log to CSV format
   * 
   * @param filters - Filters for audit log query
   * @returns CSV content as string
   */
  async exportAuditLog(filters: AuditLogFilters): Promise<string> {
    const params = new URLSearchParams();
    
    if (filters.tokenId) params.append('tokenId', filters.tokenId);
    if (filters.network) params.append('network', filters.network);
    if (filters.action) params.append('action', filters.action);
    if (filters.actor) params.append('actor', filters.actor);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.result) params.append('result', filters.result);

    params.append('format', 'csv');

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiClient.get<string>(`/v1/audit-log/export${query}`);
  }

  /**
   * Get MICA compliance metrics for a token
   * Includes token supply, holder distribution, whitelist status, and transfer activity
   * 
   * @param tokenId - The token identifier
   * @param network - The network (VOI or Aramid)
   * @returns MICA compliance metrics for dashboard display
   */
  async getMicaComplianceMetrics(
    tokenId: string,
    network: string
  ): Promise<MicaComplianceMetrics> {
    return this.apiClient.get<MicaComplianceMetrics>(
      `/v1/compliance/mica-metrics/${tokenId}?network=${network}`
    );
  }
}

/**
 * Default instance of the compliance service
 */
export const complianceService = new ComplianceService();
