import { getApiClient } from "./apiClient";
import type {
  TransferValidationRequest,
  TransferValidationResponse,
  AuditLogFilters,
  AuditLogResponse,
  ComplianceStatus,
  MicaComplianceMetrics,
  ComplianceMonitoringFilters,
  ComplianceMonitoringMetrics,
  WhitelistEnforcementMetrics,
  AuditHealthMetrics,
} from "../types/compliance";

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
  async validateTransfer(request: TransferValidationRequest): Promise<TransferValidationResponse> {
    const apiRequest = {
      assetId: parseInt(request.tokenId, 10),
      fromAddress: request.sender,
      toAddress: request.receiver,
      amount: request.amount ? parseInt(request.amount, 10) : undefined,
    };
    const response = await this.apiClient.api.v1WhitelistValidateTransferCreate(apiRequest);
    const data = response.data;
    return {
      allowed: data.isAllowed || false,
      reasons: Array.isArray(data.denialReason) ? data.denialReason : data.denialReason ? [data.denialReason] : [],
      senderStatus: (data.senderStatus?.status as any) || "unknown",
      receiverStatus: (data.receiverStatus?.status as any) || "unknown",
      timestamp: new Date().toISOString(),
      details: {
        senderCompliant: data.senderStatus?.isWhitelisted || false,
        receiverCompliant: data.receiverStatus?.isWhitelisted || false,
      },
    };
  }

  /**
   * Get audit log entries for a token
   *
   * @param filters - Filters for audit log query
   * @returns Paginated audit log entries
   */
  async getAuditLog(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const query: any = {};

    if (filters.tokenId) query.assetId = parseInt(filters.tokenId, 10);
    if (filters.network) query.network = filters.network;
    if (filters.action) query.actionType = filters.action;
    if (filters.actor) query.performedBy = filters.actor;
    if (filters.startDate) query.fromDate = filters.startDate;
    if (filters.endDate) query.toDate = filters.endDate;
    if (filters.result) query.success = filters.result === "success";
    if (filters.limit) query.pageSize = filters.limit;
    if (filters.offset !== undefined) {
      // Calculate page from offset and limit
      if (filters.limit) {
        query.page = Math.floor(filters.offset / filters.limit) + 1;
      }
    }

    const response = await this.apiClient.api.v1EnterpriseAuditExportList(query);
    return response.data as AuditLogResponse;
  }

  /**
   * Get compliance status for a token
   *
   * @param tokenId - The token identifier
   * @param network - The network (VOI or Aramid)
   * @returns Compliance status including whitelist count and issues
   */
  async getComplianceStatus(tokenId: string, network?: string): Promise<ComplianceStatus> {
    const query: any = {};
    if (network) query.network = network;
    const response = await this.apiClient.api.v1ComplianceDetail(parseInt(tokenId, 10), query);
    return response.data as ComplianceStatus;
  }

  /**
   * Export audit log to CSV format
   *
   * @param filters - Filters for audit log query
   * @returns CSV content as string
   */
  async exportAuditLog(filters: AuditLogFilters): Promise<string> {
    const query: any = {};

    if (filters.tokenId) query.assetId = parseInt(filters.tokenId);
    if (filters.network) query.network = filters.network;
    if (filters.action) query.actionType = filters.action;
    if (filters.actor) query.performedBy = filters.actor;
    if (filters.startDate) query.fromDate = filters.startDate;
    if (filters.endDate) query.toDate = filters.endDate;
    if (filters.result !== undefined) query.success = filters.result === "success";

    const response = await this.apiClient.api.v1EnterpriseAuditExportCsvList(query);
    // The response.data is a File/Blob, convert to text
    return await response.data.text();
  }

  /**
   * Get MICA compliance metrics for a token
   * Includes token supply, holder distribution, whitelist status, and transfer activity
   *
   * @param tokenId - The token identifier
   * @param network - The network (VOI or Aramid)
   * @returns MICA compliance metrics for dashboard display
   */
  async getMicaComplianceMetrics(tokenId: string, network: string): Promise<MicaComplianceMetrics> {
    return (this.apiClient as any).get(`/v1/compliance/mica-metrics/${tokenId}?network=${network}`);
  }

  /**
   * Get compliance monitoring metrics for enterprise observability
   *
   * @param filters - Filters for network, asset, and date range
   * @returns Comprehensive monitoring metrics including whitelist, audit, and retention
   */
  async getMonitoringMetrics(filters: ComplianceMonitoringFilters): Promise<ComplianceMonitoringMetrics> {
    const query: any = {};

    if (filters.network && filters.network !== "all") query.network = filters.network;
    if (filters.assetId) query.assetId = parseInt(filters.assetId);
    if (filters.startDate) query.fromDate = filters.startDate;
    if (filters.endDate) query.toDate = filters.endDate;

    const response = await this.apiClient.api.v1ComplianceMonitoringMetricsList(query);
    const data = response.data;
    return {
      network: (filters.network || "all") as any,
      assetId: filters.assetId,
      whitelistEnforcement: data.whitelistEnforcement as any,
      auditHealth: data.auditHealth as any,
      retentionStatus: data.networkRetentionStatus?.[0] as any,
      overallComplianceScore: data.overallHealthScore || 0,
      lastUpdated: data.calculatedAt || new Date().toISOString(),
    };
  }

  /**
   * Get whitelist enforcement metrics
   *
   * @param filters - Filters for network, asset, and date range
   * @returns Whitelist enforcement metrics
   */
  async getWhitelistEnforcement(filters: ComplianceMonitoringFilters): Promise<WhitelistEnforcementMetrics> {
    const query: any = {};

    if (filters.network && filters.network !== "all") query.network = filters.network;
    if (filters.assetId) query.assetId = parseInt(filters.assetId);
    if (filters.startDate) query.fromDate = filters.startDate;
    if (filters.endDate) query.toDate = filters.endDate;

    const response = await this.apiClient.api.v1ComplianceMonitoringMetricsList(query);
    return response.data.whitelistEnforcement as any;
  }

  /**
   * Get audit health metrics
   *
   * @param filters - Filters for network, asset, and date range
   * @returns Audit health metrics
   */
  async getAuditHealth(filters: ComplianceMonitoringFilters): Promise<AuditHealthMetrics> {
    const query: any = {};

    if (filters.network && filters.network !== "all") query.network = filters.network;

    const response = await this.apiClient.api.v1ComplianceMonitoringAuditHealthList(query);
    return response.data.auditHealth as any;
  }

  /**
   * Get retention status metrics
   *
   * @param filters - Filters for network, asset, and date range
   * @returns Retention status metrics
   */
  async getRetentionStatus(filters: ComplianceMonitoringFilters): Promise<{ networks: any[]; overallRetentionScore: number }> {
    const query: any = {};

    if (filters.network && filters.network !== "all") query.network = filters.network;

    const response = await this.apiClient.api.v1ComplianceMonitoringRetentionStatusList(query);
    return {
      networks: response.data.networks || [],
      overallRetentionScore: response.data.overallRetentionScore || 0,
    };
  }

  /**
   * Export compliance monitoring data to CSV format for regulators
   *
   * @param filters - Filters for network, asset, and date range
   * @returns CSV content as string
   */
  async exportMonitoringData(filters: ComplianceMonitoringFilters): Promise<string> {
    const params = new URLSearchParams();

    if (filters.network && filters.network !== "all") {
      params.append("network", filters.network);
    }
    if (filters.assetId) params.append("assetId", filters.assetId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    params.append("format", "csv");

    const query = params.toString() ? `?${params.toString()}` : "";
    return (this.apiClient as any).get(`/v1/compliance/monitoring/export${query}`);
  }
}

/**
 * Default instance of the compliance service
 */
export const complianceService = new ComplianceService();
