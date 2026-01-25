import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComplianceService } from '../ComplianceService';
import type {
  TransferValidationRequest,
  TransferValidationResponse,
  AuditLogFilters,
  AuditLogResponse,
  ComplianceStatus,
} from '../../types/compliance';

// Mock the API client
vi.mock('../BiatecTokensApiClient', () => {
  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
  };
  
  return {
    BiatecTokensApiClient: vi.fn(() => mockApiClient),
    getApiClient: vi.fn(() => mockApiClient),
  };
});

describe('ComplianceService', () => {
  let service: ComplianceService;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ComplianceService();
    mockApiClient = (service as any).apiClient;
  });

  describe('validateTransfer', () => {
    it('should validate a transfer successfully', async () => {
      const request: TransferValidationRequest = {
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
        amount: '100',
      };

      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: ['Both addresses are whitelisted'],
        senderStatus: {
          address: request.sender,
          whitelisted: true,
          status: 'active',
          kycVerified: true,
          jurisdictionAllowed: true,
          sanctioned: false,
        },
        receiverStatus: {
          address: request.receiver,
          whitelisted: true,
          status: 'active',
          kycVerified: true,
          jurisdictionAllowed: true,
          sanctioned: false,
        },
        timestamp: '2024-01-15T10:00:00Z',
        details: {
          senderCompliant: true,
          receiverCompliant: true,
          jurisdictionCheck: true,
          sanctionsCheck: true,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.validateTransfer(request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/whitelist/validate-transfer',
        request
      );
      expect(result).toEqual(mockResponse);
      expect(result.allowed).toBe(true);
    });

    it('should return denied validation when addresses are not whitelisted', async () => {
      const request: TransferValidationRequest = {
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
      };

      const mockResponse: TransferValidationResponse = {
        allowed: false,
        reasons: ['Sender is not whitelisted', 'Receiver is not whitelisted'],
        senderStatus: {
          address: request.sender,
          whitelisted: false,
          status: 'not_listed',
        },
        receiverStatus: {
          address: request.receiver,
          whitelisted: false,
          status: 'not_listed',
        },
        timestamp: '2024-01-15T10:00:00Z',
        details: {
          senderCompliant: false,
          receiverCompliant: false,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.validateTransfer(request);

      expect(result.allowed).toBe(false);
      expect(result.reasons).toHaveLength(2);
    });

    it('should validate transfer without amount', async () => {
      const request: TransferValidationRequest = {
        tokenId: 'token123',
        network: 'Aramid',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
      };

      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: [],
        senderStatus: {
          address: request.sender,
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: request.receiver,
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.validateTransfer(request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/whitelist/validate-transfer',
        request
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log without filters', async () => {
      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await service.getAuditLog({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/audit-log');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch audit log with tokenId filter', async () => {
      const filters: AuditLogFilters = {
        tokenId: 'token123',
      };

      const mockResponse: AuditLogResponse = {
        entries: [
          {
            id: 'log1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'whitelist_add' as any,
            tokenId: 'token123',
            network: 'VOI',
            actor: 'A23456723456723456723456723456723456723456723456723456723A',
            details: {},
            result: 'success',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await service.getAuditLog(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/audit-log?tokenId=token123'
      );
      expect(result.entries).toHaveLength(1);
    });

    it('should fetch audit log with multiple filters', async () => {
      const filters: AuditLogFilters = {
        tokenId: 'token123',
        network: 'VOI',
        action: 'transfer_validation' as any,
        result: 'success',
        limit: 10,
        offset: 0,
      };

      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await service.getAuditLog(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/audit-log?tokenId=token123&network=VOI&action=transfer_validation&result=success&limit=10&offset=0'
      );
      expect(result.limit).toBe(10);
    });

    it('should fetch audit log with date range filters', async () => {
      const filters: AuditLogFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await service.getAuditLog(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/audit-log?startDate=2024-01-01&endDate=2024-01-31'
      );
    });
  });

  describe('getComplianceStatus', () => {
    it('should fetch compliance status for a token', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 50,
        lastAuditTimestamp: '2024-01-15T10:00:00Z',
        complianceScore: 85,
        issues: [],
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await service.getComplianceStatus('token123', 'VOI');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/status/token123?network=VOI'
      );
      expect(result).toEqual(mockStatus);
      expect(result.whitelistCount).toBe(50);
    });

    it('should fetch compliance status with issues', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'Aramid',
        whitelistEnabled: true,
        whitelistCount: 10,
        complianceScore: 60,
        issues: [
          {
            severity: 'high',
            category: 'kyc',
            message: 'KYC verification pending for 5 addresses',
            timestamp: '2024-01-15T10:00:00Z',
          },
        ],
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await service.getComplianceStatus('token123', 'Aramid');

      expect(result.issues).toHaveLength(1);
      expect(result.issues![0].severity).toBe('high');
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log as CSV', async () => {
      const filters: AuditLogFilters = {
        tokenId: 'token123',
        network: 'VOI',
      };

      const mockCsv = 'timestamp,action,network,actor,result\n2024-01-15T10:00:00Z,whitelist_add,VOI,A234567...,success';

      mockApiClient.get.mockResolvedValue(mockCsv);

      const result = await service.exportAuditLog(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/audit-log/export?tokenId=token123&network=VOI&format=csv'
      );
      expect(result).toBe(mockCsv);
    });

    it('should export audit log with date filters', async () => {
      const filters: AuditLogFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockCsv = 'timestamp,action,network,actor,result';

      mockApiClient.get.mockResolvedValue(mockCsv);

      await service.exportAuditLog(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/audit-log/export?startDate=2024-01-01&endDate=2024-01-31&format=csv'
      );
    });
  });

  describe('getMonitoringMetrics', () => {
    it('should get monitoring metrics successfully', async () => {
      const filters = {
        network: 'VOI' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockMetrics = {
        network: 'VOI' as const,
        whitelistEnforcement: {
          totalAddresses: 100,
          activeAddresses: 95,
          pendingAddresses: 3,
          removedAddresses: 2,
          enforcementRate: 95.0,
          recentViolations: 1,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        auditHealth: {
          totalAuditEntries: 500,
          successfulActions: 490,
          failedActions: 10,
          criticalIssues: 0,
          warningIssues: 2,
          auditCoverage: 98.0,
          lastAuditTimestamp: '2024-01-31T23:00:00Z',
        },
        retentionStatus: {
          totalRecords: 1000,
          activeRecords: 900,
          archivedRecords: 100,
          retentionCompliance: 99.0,
          oldestRecord: '2022-01-01T00:00:00Z',
          retentionPolicyDays: 730,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        overallComplianceScore: 95,
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await service.getMonitoringMetrics(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/metrics?network=VOI&startDate=2024-01-01&endDate=2024-01-31'
      );
      expect(result).toEqual(mockMetrics);
      expect(result.overallComplianceScore).toBe(95);
    });

    it('should get monitoring metrics with all networks filter', async () => {
      const filters = {
        network: 'all' as const,
      };

      const mockMetrics = {
        network: 'VOI' as const,
        whitelistEnforcement: {
          totalAddresses: 100,
          activeAddresses: 95,
          pendingAddresses: 3,
          removedAddresses: 2,
          enforcementRate: 95.0,
          recentViolations: 1,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        auditHealth: {
          totalAuditEntries: 500,
          successfulActions: 490,
          failedActions: 10,
          criticalIssues: 0,
          warningIssues: 2,
          auditCoverage: 98.0,
          lastAuditTimestamp: '2024-01-31T23:00:00Z',
        },
        retentionStatus: {
          totalRecords: 1000,
          activeRecords: 900,
          archivedRecords: 100,
          retentionCompliance: 99.0,
          oldestRecord: '2022-01-01T00:00:00Z',
          retentionPolicyDays: 730,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        overallComplianceScore: 95,
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      await service.getMonitoringMetrics(filters);

      // Should not include 'all' in the query params
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/metrics'
      );
    });

    it('should get monitoring metrics with asset ID filter', async () => {
      const filters = {
        assetId: 'asset123',
      };

      const mockMetrics = {
        network: 'VOI' as const,
        assetId: 'asset123',
        whitelistEnforcement: {
          totalAddresses: 50,
          activeAddresses: 48,
          pendingAddresses: 1,
          removedAddresses: 1,
          enforcementRate: 96.0,
          recentViolations: 0,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        auditHealth: {
          totalAuditEntries: 200,
          successfulActions: 198,
          failedActions: 2,
          criticalIssues: 0,
          warningIssues: 1,
          auditCoverage: 99.0,
          lastAuditTimestamp: '2024-01-31T23:00:00Z',
        },
        retentionStatus: {
          totalRecords: 500,
          activeRecords: 450,
          archivedRecords: 50,
          retentionCompliance: 100.0,
          oldestRecord: '2023-01-01T00:00:00Z',
          retentionPolicyDays: 730,
          lastUpdated: '2024-01-31T23:59:59Z',
        },
        overallComplianceScore: 98,
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await service.getMonitoringMetrics(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/metrics?assetId=asset123'
      );
      expect(result.assetId).toBe('asset123');
    });
  });

  describe('getWhitelistEnforcement', () => {
    it('should get whitelist enforcement metrics', async () => {
      const filters = {
        network: 'Aramid' as const,
      };

      const mockMetrics = {
        totalAddresses: 150,
        activeAddresses: 140,
        pendingAddresses: 8,
        removedAddresses: 2,
        enforcementRate: 93.3,
        recentViolations: 2,
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await service.getWhitelistEnforcement(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/whitelist?network=Aramid'
      );
      expect(result).toEqual(mockMetrics);
      expect(result.enforcementRate).toBe(93.3);
    });
  });

  describe('getAuditHealth', () => {
    it('should get audit health metrics', async () => {
      const filters = {
        network: 'VOI' as const,
        startDate: '2024-01-01',
      };

      const mockMetrics = {
        totalAuditEntries: 750,
        successfulActions: 720,
        failedActions: 30,
        criticalIssues: 1,
        warningIssues: 5,
        auditCoverage: 96.0,
        lastAuditTimestamp: '2024-01-31T22:00:00Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await service.getAuditHealth(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/audit-health?network=VOI&startDate=2024-01-01'
      );
      expect(result).toEqual(mockMetrics);
      expect(result.criticalIssues).toBe(1);
    });
  });

  describe('getRetentionStatus', () => {
    it('should get retention status metrics', async () => {
      const filters = {
        network: 'VOI' as const,
      };

      const mockMetrics = {
        totalRecords: 2000,
        activeRecords: 1800,
        archivedRecords: 200,
        retentionCompliance: 100.0,
        oldestRecord: '2021-01-01T00:00:00Z',
        retentionPolicyDays: 730,
        lastUpdated: '2024-01-31T23:59:59Z',
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await service.getRetentionStatus(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/retention?network=VOI'
      );
      expect(result).toEqual(mockMetrics);
      expect(result.retentionCompliance).toBe(100.0);
    });
  });

  describe('exportMonitoringData', () => {
    it('should export monitoring data as CSV', async () => {
      const filters = {
        network: 'VOI' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockCsv = 'metric,value,timestamp\noverall_score,95,2024-01-31T23:59:59Z';

      mockApiClient.get.mockResolvedValue(mockCsv);

      const result = await service.exportMonitoringData(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/export?network=VOI&startDate=2024-01-01&endDate=2024-01-31&format=csv'
      );
      expect(result).toBe(mockCsv);
    });

    it('should export monitoring data with all filters', async () => {
      const filters = {
        network: 'Aramid' as const,
        assetId: 'asset456',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockCsv = 'metric,value,timestamp\noverall_score,92,2024-01-31T23:59:59Z';

      mockApiClient.get.mockResolvedValue(mockCsv);

      const result = await service.exportMonitoringData(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/compliance/monitoring/export?network=Aramid&assetId=asset456&startDate=2024-01-01&endDate=2024-01-31&format=csv'
      );
      expect(result).toBe(mockCsv);
    });
  });
});
