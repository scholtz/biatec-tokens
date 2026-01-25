import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComplianceService } from "../ComplianceService";
import type { TransferValidationRequest, TransferValidationResponse, AuditLogFilters, AuditLogResponse, ComplianceStatus } from "../../types/compliance";

// Mock the API client
vi.mock("../apiClient", () => {
  const mockApiClient = {
    get: vi.fn(),
    api: {
      v1WhitelistValidateTransferCreate: vi.fn(),
      v1EnterpriseAuditExportList: vi.fn(),
      v1EnterpriseAuditExportCsvList: vi.fn(),
      v1ComplianceMonitoringMetricsList: vi.fn(),
      v1ComplianceMonitoringAuditHealthList: vi.fn(),
      v1ComplianceMonitoringRetentionStatusList: vi.fn(),
      v1ComplianceDetail: vi.fn(),
    },
  };

  return {
    getApiClient: vi.fn(() => mockApiClient),
  };
});

describe("ComplianceService", () => {
  let service: ComplianceService;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ComplianceService();
    mockApiClient = (service as any).apiClient;
  });

  describe("validateTransfer", () => {
    it("should validate a transfer successfully", async () => {
      const request: TransferValidationRequest = {
        tokenId: "123",
        network: "VOI",
        sender: "A23456723456723456723456723456723456723456723456723456723A",
        receiver: "B23456723456723456723456723456723456723456723456723456723B",
        amount: "100",
      };

      const mockApiResponse = {
        isAllowed: true,
        denialReason: [],
        senderStatus: {
          status: "active",
          isWhitelisted: true,
        },
        receiverStatus: {
          status: "active",
          isWhitelisted: true,
        },
      };

      mockApiClient.api.v1WhitelistValidateTransferCreate.mockResolvedValue({ data: mockApiResponse });

      const result = await service.validateTransfer(request);

      expect(mockApiClient.api.v1WhitelistValidateTransferCreate).toHaveBeenCalledWith({
        assetId: 123,
        fromAddress: request.sender,
        toAddress: request.receiver,
        amount: 100,
      });
      expect(result.allowed).toBe(true);
    });

    it("should return denied validation when addresses are not whitelisted", async () => {
      const request: TransferValidationRequest = {
        tokenId: "123",
        network: "VOI",
        sender: "A23456723456723456723456723456723456723456723456723456723A",
        receiver: "B23456723456723456723456723456723456723456723456723456723B",
      };

      const mockApiResponse = {
        isAllowed: false,
        denialReason: ["Sender is not whitelisted", "Receiver is not whitelisted"],
        senderStatus: {
          status: "not_listed",
          isWhitelisted: false,
        },
        receiverStatus: {
          status: "not_listed",
          isWhitelisted: false,
        },
      };

      mockApiClient.api.v1WhitelistValidateTransferCreate.mockResolvedValue({ data: mockApiResponse });

      const result = await service.validateTransfer(request);

      expect(result.allowed).toBe(false);
      expect(result.reasons).toHaveLength(2);
    });

    it("should validate transfer without amount", async () => {
      const request: TransferValidationRequest = {
        tokenId: "123",
        network: "Aramid",
        sender: "A23456723456723456723456723456723456723456723456723456723A",
        receiver: "B23456723456723456723456723456723456723456723456723456723B",
      };

      const mockApiResponse = {
        isAllowed: true,
        denialReason: [],
        senderStatus: {
          status: "active",
          isWhitelisted: true,
        },
        receiverStatus: {
          status: "active",
          isWhitelisted: true,
        },
      };

      mockApiClient.api.v1WhitelistValidateTransferCreate.mockResolvedValue({ data: mockApiResponse });

      const result = await service.validateTransfer(request);

      expect(mockApiClient.api.v1WhitelistValidateTransferCreate).toHaveBeenCalledWith({
        assetId: 123,
        fromAddress: request.sender,
        toAddress: request.receiver,
        amount: undefined,
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("getAuditLog", () => {
    it("should fetch audit log without filters", async () => {
      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.api.v1EnterpriseAuditExportList.mockResolvedValue({ data: mockResponse });

      const result = await service.getAuditLog({});

      expect(mockApiClient.api.v1EnterpriseAuditExportList).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });

    it("should fetch audit log with tokenId filter", async () => {
      const filters: AuditLogFilters = {
        tokenId: "123",
      };

      const mockResponse: AuditLogResponse = {
        entries: [
          {
            id: "log1",
            timestamp: "2024-01-15T10:00:00Z",
            action: "whitelist_add" as any,
            tokenId: "123",
            network: "VOI",
            actor: "A23456723456723456723456723456723456723456723456723456723A",
            details: {},
            result: "success",
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.api.v1EnterpriseAuditExportList.mockResolvedValue({ data: mockResponse });

      const result = await service.getAuditLog(filters);

      expect(mockApiClient.api.v1EnterpriseAuditExportList).toHaveBeenCalledWith({
        assetId: 123,
      });
      expect(result.entries).toHaveLength(1);
    });

    it("should fetch audit log with multiple filters", async () => {
      const filters: AuditLogFilters = {
        tokenId: "123",
        network: "VOI",
        action: "transfer_validation" as any,
        result: "success",
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

      mockApiClient.api.v1EnterpriseAuditExportList.mockResolvedValue({ data: mockResponse });

      const result = await service.getAuditLog(filters);

      expect(mockApiClient.api.v1EnterpriseAuditExportList).toHaveBeenCalledWith({
        assetId: 123,
        network: "VOI",
        actionType: "transfer_validation",
        success: true,
        pageSize: 10,
        page: 1,
      });
      expect(result.limit).toBe(10);
    });

    it("should fetch audit log with date range filters", async () => {
      const filters: AuditLogFilters = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const mockResponse: AuditLogResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      mockApiClient.api.v1EnterpriseAuditExportList.mockResolvedValue({ data: mockResponse });

      await service.getAuditLog(filters);

      expect(mockApiClient.api.v1EnterpriseAuditExportList).toHaveBeenCalledWith({
        fromDate: "2024-01-01",
        toDate: "2024-01-31",
      });
    });
  });

  describe("getComplianceStatus", () => {
    it("should fetch compliance status for a token", async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: "123",
        network: "VOI",
        whitelistEnabled: true,
        whitelistCount: 50,
        lastAuditTimestamp: "2024-01-15T10:00:00Z",
        complianceScore: 85,
        issues: [],
      };

      mockApiClient.api.v1ComplianceDetail.mockResolvedValue({ data: mockStatus });

      const result = await service.getComplianceStatus("123");

      expect(mockApiClient.api.v1ComplianceDetail).toHaveBeenCalledWith(123, {});
      expect(result).toEqual(mockStatus);
      expect(result.whitelistCount).toBe(50);
    });

    it("should fetch compliance status with issues", async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: "123",
        network: "Aramid",
        whitelistEnabled: true,
        whitelistCount: 10,
        complianceScore: 60,
        issues: [
          {
            severity: "high",
            category: "kyc",
            message: "KYC verification pending for 5 addresses",
            timestamp: "2024-01-15T10:00:00Z",
          },
        ],
      };

      mockApiClient.api.v1ComplianceDetail.mockResolvedValue({ data: mockStatus });

      const result = await service.getComplianceStatus("123");

      expect(mockApiClient.api.v1ComplianceDetail).toHaveBeenCalledWith(123, {});
      expect(result.issues).toHaveLength(1);
      expect(result.issues![0].severity).toBe("high");
    });
  });

  describe("exportAuditLog", () => {
    it("should export audit log as CSV", async () => {
      const filters: AuditLogFilters = {
        tokenId: "123",
        network: "VOI",
      };

      const mockCsv = "timestamp,action,network,actor,result\n2024-01-15T10:00:00Z,whitelist_add,VOI,A234567...,success";
      const mockFile = { text: vi.fn().mockResolvedValue(mockCsv) };

      mockApiClient.api.v1EnterpriseAuditExportCsvList.mockResolvedValue({ data: mockFile });

      const result = await service.exportAuditLog(filters);

      expect(mockApiClient.api.v1EnterpriseAuditExportCsvList).toHaveBeenCalledWith({
        assetId: 123,
        network: "VOI",
      });
      expect(result).toBe(mockCsv);
    });

    it("should export audit log with date filters", async () => {
      const filters: AuditLogFilters = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const mockCsv = "timestamp,action,network,actor,result";
      const mockFile = { text: vi.fn().mockResolvedValue(mockCsv) };

      mockApiClient.api.v1EnterpriseAuditExportCsvList.mockResolvedValue({ data: mockFile });

      await service.exportAuditLog(filters);

      expect(mockApiClient.api.v1EnterpriseAuditExportCsvList).toHaveBeenCalledWith({
        fromDate: "2024-01-01",
        toDate: "2024-01-31",
      });
    });
  });

  describe("getMonitoringMetrics", () => {
    it("should get monitoring metrics successfully", async () => {
      const filters = {
        network: "VOI" as const,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const mockMetrics = {
        network: "VOI" as const,
        whitelistEnforcement: {
          totalAddresses: 100,
          activeAddresses: 95,
          pendingAddresses: 3,
          removedAddresses: 2,
          enforcementRate: 95.0,
          recentViolations: 1,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        auditHealth: {
          totalAuditEntries: 500,
          successfulActions: 490,
          failedActions: 10,
          criticalIssues: 0,
          warningIssues: 2,
          auditCoverage: 98.0,
          lastAuditTimestamp: "2024-01-31T23:00:00Z",
        },
        retentionStatus: {
          totalRecords: 1000,
          activeRecords: 900,
          archivedRecords: 100,
          retentionCompliance: 99.0,
          oldestRecord: "2022-01-01T00:00:00Z",
          retentionPolicyDays: 730,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        overallComplianceScore: 95,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      const mockApiResponse = {
        whitelistEnforcement: mockMetrics.whitelistEnforcement,
        auditHealth: mockMetrics.auditHealth,
        networkRetentionStatus: [mockMetrics.retentionStatus],
        overallHealthScore: mockMetrics.overallComplianceScore,
        calculatedAt: mockMetrics.lastUpdated,
      };

      mockApiClient.api.v1ComplianceMonitoringMetricsList.mockResolvedValue({ data: mockApiResponse });

      const result = await service.getMonitoringMetrics(filters);

      expect(mockApiClient.api.v1ComplianceMonitoringMetricsList).toHaveBeenCalledWith({
        network: "VOI",
        fromDate: "2024-01-01",
        toDate: "2024-01-31",
      });
      expect(result.network).toBe("VOI");
      expect(result.whitelistEnforcement).toEqual(mockMetrics.whitelistEnforcement);
      expect(result.auditHealth).toEqual(mockMetrics.auditHealth);
      expect(result.retentionStatus).toEqual(mockMetrics.retentionStatus);
      expect(result.overallComplianceScore).toBe(95);
      expect(result.lastUpdated).toBe("2024-01-31T23:59:59Z");
    });

    it("should get monitoring metrics with all networks filter", async () => {
      const filters = {
        network: "all" as const,
      };

      const mockMetrics = {
        network: "VOI" as const,
        whitelistEnforcement: {
          totalAddresses: 100,
          activeAddresses: 95,
          pendingAddresses: 3,
          removedAddresses: 2,
          enforcementRate: 95.0,
          recentViolations: 1,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        auditHealth: {
          totalAuditEntries: 500,
          successfulActions: 490,
          failedActions: 10,
          criticalIssues: 0,
          warningIssues: 2,
          auditCoverage: 98.0,
          lastAuditTimestamp: "2024-01-31T23:00:00Z",
        },
        retentionStatus: {
          totalRecords: 1000,
          activeRecords: 900,
          archivedRecords: 100,
          retentionCompliance: 99.0,
          oldestRecord: "2022-01-01T00:00:00Z",
          retentionPolicyDays: 730,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        overallComplianceScore: 95,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      const mockApiResponse = {
        whitelistEnforcement: mockMetrics.whitelistEnforcement,
        auditHealth: mockMetrics.auditHealth,
        networkRetentionStatus: [mockMetrics.retentionStatus],
        overallHealthScore: mockMetrics.overallComplianceScore,
        calculatedAt: mockMetrics.lastUpdated,
      };

      mockApiClient.api.v1ComplianceMonitoringMetricsList.mockResolvedValue({ data: mockApiResponse });

      const result = await service.getMonitoringMetrics(filters);

      // Should not include 'all' in the query params
      expect(mockApiClient.api.v1ComplianceMonitoringMetricsList).toHaveBeenCalledWith({});
      expect(result.network).toBe("all");
    });

    it("should get monitoring metrics with asset ID filter", async () => {
      const filters = {
        assetId: "123",
      };

      const mockMetrics = {
        network: "VOI" as const,
        assetId: "123",
        whitelistEnforcement: {
          totalAddresses: 50,
          activeAddresses: 48,
          pendingAddresses: 1,
          removedAddresses: 1,
          enforcementRate: 96.0,
          recentViolations: 0,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        auditHealth: {
          totalAuditEntries: 200,
          successfulActions: 198,
          failedActions: 2,
          criticalIssues: 0,
          warningIssues: 1,
          auditCoverage: 99.0,
          lastAuditTimestamp: "2024-01-31T23:00:00Z",
        },
        retentionStatus: {
          totalRecords: 500,
          activeRecords: 450,
          archivedRecords: 50,
          retentionCompliance: 100.0,
          oldestRecord: "2023-01-01T00:00:00Z",
          retentionPolicyDays: 730,
          lastUpdated: "2024-01-31T23:59:59Z",
        },
        overallComplianceScore: 98,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      const mockApiResponse = {
        whitelistEnforcement: mockMetrics.whitelistEnforcement,
        auditHealth: mockMetrics.auditHealth,
        networkRetentionStatus: [mockMetrics.retentionStatus],
        overallHealthScore: mockMetrics.overallComplianceScore,
        calculatedAt: mockMetrics.lastUpdated,
      };

      mockApiClient.api.v1ComplianceMonitoringMetricsList.mockResolvedValue({ data: mockApiResponse });

      const result = await service.getMonitoringMetrics(filters);

      expect(mockApiClient.api.v1ComplianceMonitoringMetricsList).toHaveBeenCalledWith({
        assetId: 123,
      });
      expect(result.assetId).toBe("123");
    });
  });

  describe("getWhitelistEnforcement", () => {
    it("should get whitelist enforcement metrics", async () => {
      const filters = {
        network: "Aramid" as const,
      };

      const mockMetrics = {
        totalAddresses: 150,
        activeAddresses: 140,
        pendingAddresses: 8,
        removedAddresses: 2,
        enforcementRate: 93.3,
        recentViolations: 2,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      const mockFullMetrics = {
        whitelistEnforcement: mockMetrics,
        auditHealth: {},
        retentionStatus: {},
        overallComplianceScore: 95,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      mockApiClient.api.v1ComplianceMonitoringMetricsList.mockResolvedValue({ data: mockFullMetrics });

      const result = await service.getWhitelistEnforcement(filters);

      expect(mockApiClient.api.v1ComplianceMonitoringMetricsList).toHaveBeenCalledWith({
        network: "Aramid",
      });
      expect(result).toEqual(mockMetrics);
      expect(result.enforcementRate).toBe(93.3);
    });
  });

  describe("getAuditHealth", () => {
    it("should get audit health metrics", async () => {
      const filters = {
        network: "VOI" as const,
        startDate: "2024-01-01",
      };

      const mockMetrics = {
        totalAuditEntries: 750,
        successfulActions: 720,
        failedActions: 30,
        criticalIssues: 1,
        warningIssues: 5,
        auditCoverage: 96.0,
        lastAuditTimestamp: "2024-01-31T22:00:00Z",
      };

      const mockFullMetrics = {
        auditHealth: mockMetrics,
      };

      mockApiClient.api.v1ComplianceMonitoringAuditHealthList.mockResolvedValue({ data: mockFullMetrics });

      const result = await service.getAuditHealth(filters);

      expect(mockApiClient.api.v1ComplianceMonitoringAuditHealthList).toHaveBeenCalledWith({
        network: "VOI",
      });
      expect(result).toEqual(mockMetrics);
      expect(result.criticalIssues).toBe(1);
    });
  });

  describe("getRetentionStatus", () => {
    it("should get retention status metrics", async () => {
      const filters = {
        network: "VOI" as const,
      };

      const mockMetrics = {
        totalRecords: 2000,
        activeRecords: 1800,
        archivedRecords: 200,
        retentionCompliance: 100.0,
        oldestRecord: "2021-01-01T00:00:00Z",
        retentionPolicyDays: 730,
        lastUpdated: "2024-01-31T23:59:59Z",
      };

      const mockResponse = {
        networks: [mockMetrics],
        overallRetentionScore: 95.5,
      };

      mockApiClient.api.v1ComplianceMonitoringRetentionStatusList.mockResolvedValue({ data: mockResponse });

      const result = await service.getRetentionStatus(filters);

      expect(mockApiClient.api.v1ComplianceMonitoringRetentionStatusList).toHaveBeenCalledWith({
        network: "VOI",
      });
      expect(result).toEqual({
        networks: [mockMetrics],
        overallRetentionScore: 95.5,
      });
      expect(result.networks[0].retentionCompliance).toBe(100.0);
    });
  });

  describe("exportMonitoringData", () => {
    it("should export monitoring data as CSV", async () => {
      const filters = {
        network: "VOI" as const,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const mockCsv = "metric,value,timestamp\noverall_score,95,2024-01-31T23:59:59Z";

      mockApiClient.get.mockResolvedValue(mockCsv);

      const result = await service.exportMonitoringData(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith("/v1/compliance/monitoring/export?network=VOI&startDate=2024-01-01&endDate=2024-01-31&format=csv");
      expect(result).toBe(mockCsv);
    });

    it("should export monitoring data with all filters", async () => {
      const filters = {
        network: "Aramid" as const,
        assetId: "asset456",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const mockCsv = "metric,value,timestamp\noverall_score,92,2024-01-31T23:59:59Z";

      mockApiClient.get.mockResolvedValue(mockCsv);

      const result = await service.exportMonitoringData(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith("/v1/compliance/monitoring/export?network=Aramid&assetId=asset456&startDate=2024-01-01&endDate=2024-01-31&format=csv");
      expect(result).toBe(mockCsv);
    });
  });
});
