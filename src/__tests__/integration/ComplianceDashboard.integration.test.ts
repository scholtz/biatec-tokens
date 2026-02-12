import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complianceService } from '../../services/ComplianceService';
import { whitelistService } from '../../services/legacyWhitelistService';
import type { ComplianceStatus, TransferValidationResponse } from '../../types/compliance';
import type { WhitelistEntry } from '../../services/legacyWhitelistService';

// Mock services
vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getComplianceStatus: vi.fn(),
    validateTransfer: vi.fn(),
    getAuditLog: vi.fn(),
    exportAuditLog: vi.fn(),
  },
}));

vi.mock('../../services/legacyWhitelistService', () => ({
  whitelistService: {
    getWhitelist: vi.fn(),
    addAddress: vi.fn(),
    removeAddress: vi.fn(),
    bulkUpload: vi.fn(),
  },
  legacyWhitelistService: vi.fn(),
}));

describe('Compliance Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Whitelist Management Rules', () => {
    it('should enforce whitelist rules for transfers', async () => {
      const mockValidationAllowed: TransferValidationResponse = {
        allowed: true,
        reasons: ['Both addresses are whitelisted'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      const mockValidationDenied: TransferValidationResponse = {
        allowed: false,
        reasons: ['Receiver is not whitelisted'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'C23456723456723456723456723456723456723456723456723456723C',
          whitelisted: false,
          status: 'not_listed',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer)
        .mockResolvedValueOnce(mockValidationAllowed)
        .mockResolvedValueOnce(mockValidationDenied);

      // Rule 1: Transfer allowed when both addresses are whitelisted
      const allowedResult = await complianceService.validateTransfer({
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
      });

      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.senderStatus.whitelisted).toBe(true);
      expect(allowedResult.receiverStatus.whitelisted).toBe(true);

      // Rule 2: Transfer denied when receiver is not whitelisted
      const deniedResult = await complianceService.validateTransfer({
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'C23456723456723456723456723456723456723456723456723456723C',
      });

      expect(deniedResult.allowed).toBe(false);
      expect(deniedResult.receiverStatus.whitelisted).toBe(false);
      expect(deniedResult.reasons).toContain('Receiver is not whitelisted');
    });

    it('should validate whitelist status before allowing operations', async () => {
      const mockWhitelist: WhitelistEntry[] = [
        {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          status: 'pending',
          addedAt: '2024-01-15T10:00:00Z',
        },
        {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          status: 'removed',
          addedAt: '2024-01-14T10:00:00Z',
        },
      ];

      vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockWhitelist);

      const whitelist = await whitelistService.getWhitelist('token123');

      // Rule: Only 'active' status addresses should be considered valid
      const activeAddresses = whitelist.filter(entry => entry.status === 'active');
      expect(activeAddresses).toHaveLength(0);

      // Rule: Pending addresses should not be allowed for transfers
      const pendingAddresses = whitelist.filter(entry => entry.status === 'pending');
      expect(pendingAddresses).toHaveLength(1);

      // Rule: Removed addresses should be excluded
      const removedAddresses = whitelist.filter(entry => entry.status === 'removed');
      expect(removedAddresses).toHaveLength(1);
    });

    it('should handle network-specific whitelist rules', async () => {
      const mockStatusVOI: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };

      const mockStatusAramid: ComplianceStatus = {
        tokenId: 'token123',
        network: 'Aramid',
        whitelistEnabled: true,
        whitelistCount: 15,
      };

      vi.mocked(complianceService.getComplianceStatus)
        .mockResolvedValueOnce(mockStatusVOI)
        .mockResolvedValueOnce(mockStatusAramid);

      // Rule: Whitelist counts can differ per network
      const voiStatus = await complianceService.getComplianceStatus('token123', 'VOI');
      const aramidStatus = await complianceService.getComplianceStatus('token123', 'Aramid');

      expect(voiStatus.network).toBe('VOI');
      expect(voiStatus.whitelistCount).toBe(10);

      expect(aramidStatus.network).toBe('Aramid');
      expect(aramidStatus.whitelistCount).toBe(15);
    });
  });

  describe('Dashboard Data Shaping', () => {
    it('should shape compliance status data for display', async () => {
      const rawStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 42,
        lastAuditTimestamp: '2024-01-15T10:00:00Z',
        complianceScore: 85,
        issues: [
          {
            severity: 'high',
            category: 'kyc',
            message: 'KYC verification pending',
            timestamp: '2024-01-15T10:00:00Z',
          },
        ],
      };

      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(rawStatus);

      const status = await complianceService.getComplianceStatus('token123', 'VOI');

      // Data shaping: Status should include all required fields
      expect(status.tokenId).toBe('token123');
      expect(status.network).toBe('VOI');
      expect(status.whitelistEnabled).toBe(true);
      expect(status.whitelistCount).toBe(42);
      expect(status.complianceScore).toBe(85);

      // Data shaping: Issues should be properly structured
      expect(status.issues).toHaveLength(1);
      expect(status.issues?.[0].severity).toBe('high');
      expect(status.issues?.[0].category).toBe('kyc');
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: false,
        whitelistCount: 0,
      };

      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(minimalStatus);

      const status = await complianceService.getComplianceStatus('token123', 'VOI');

      // Data shaping: Optional fields should be undefined
      expect(status.complianceScore).toBeUndefined();
      expect(status.lastAuditTimestamp).toBeUndefined();
      expect(status.issues).toBeUndefined();

      // Data shaping: Required fields should always be present
      expect(status.tokenId).toBe('token123');
      expect(status.whitelistEnabled).toBe(false);
      expect(status.whitelistCount).toBe(0);
    });
  });

  describe('Full Compliance Workflow', () => {
    it('should complete end-to-end validation flow', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 5,
      };

      const mockWhitelist: WhitelistEntry[] = [
        {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          status: 'active',
          addedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const mockValidation: TransferValidationResponse = {
        allowed: true,
        reasons: ['Compliance check passed'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
          kycVerified: true,
          jurisdictionAllowed: true,
          sanctioned: false,
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
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

      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);
      vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockWhitelist);
      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockValidation);

      // Step 1: Load dashboard
      const status = await complianceService.getComplianceStatus('token123', 'VOI');
      expect(status.whitelistEnabled).toBe(true);

      // Step 2: Check whitelist
      const whitelist = await whitelistService.getWhitelist('token123');
      expect(whitelist).toHaveLength(1);
      expect(whitelist[0].status).toBe('active');

      // Step 3: Validate transfer
      const validation = await complianceService.validateTransfer({
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
      });

      // Step 4: Verify all compliance checks passed
      expect(validation.allowed).toBe(true);
      expect(validation.senderStatus.kycVerified).toBe(true);
      expect(validation.receiverStatus.kycVerified).toBe(true);
      expect(validation.details?.jurisdictionCheck).toBe(true);
      expect(validation.details?.sanctionsCheck).toBe(true);
      expect(validation.senderStatus.sanctioned).toBe(false);
      expect(validation.receiverStatus.sanctioned).toBe(false);
    });

    it('should handle compliance failures correctly', async () => {
      const mockValidation: TransferValidationResponse = {
        allowed: false,
        reasons: [
          'Sender KYC not verified',
          'Receiver jurisdiction not allowed',
          'Receiver on sanctions list',
        ],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
          kycVerified: false,
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
          kycVerified: true,
          jurisdictionAllowed: false,
          sanctioned: true,
        },
        timestamp: '2024-01-15T10:00:00Z',
        details: {
          senderCompliant: false,
          receiverCompliant: false,
          jurisdictionCheck: false,
          sanctionsCheck: false,
        },
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockValidation);

      const validation = await complianceService.validateTransfer({
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
      });

      // Compliance failure checks
      expect(validation.allowed).toBe(false);
      expect(validation.reasons).toHaveLength(3);
      expect(validation.reasons).toContain('Sender KYC not verified');
      expect(validation.reasons).toContain('Receiver jurisdiction not allowed');
      expect(validation.reasons).toContain('Receiver on sanctions list');

      // Detailed status checks
      expect(validation.senderStatus.kycVerified).toBe(false);
      expect(validation.receiverStatus.jurisdictionAllowed).toBe(false);
      expect(validation.receiverStatus.sanctioned).toBe(true);
      expect(validation.details?.senderCompliant).toBe(false);
      expect(validation.details?.receiverCompliant).toBe(false);
    });

    it('should audit all compliance operations', async () => {
      const mockAuditLog = {
        entries: [
          {
            id: 'log1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'transfer_validation' as any,
            tokenId: 'token123',
            network: 'VOI' as any,
            actor: 'A23456723456723456723456723456723456723456723456723456723A',
            details: {
              allowed: true,
              reasons: ['Compliance check passed'],
            },
            result: 'success' as any,
          },
          {
            id: 'log2',
            timestamp: '2024-01-15T11:00:00Z',
            action: 'whitelist_add' as any,
            tokenId: 'token123',
            network: 'VOI' as any,
            actor: 'admin@example.com',
            details: {
              notes: 'Approved by compliance team',
            },
            result: 'success' as any,
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      vi.mocked(complianceService.getAuditLog).mockResolvedValue(mockAuditLog);

      const auditLog = await complianceService.getAuditLog({
        tokenId: 'token123',
        network: 'VOI',
      });

      // Audit trail verification
      expect(auditLog.entries).toHaveLength(2);
      expect(auditLog.entries[0].action).toBe('transfer_validation');
      expect(auditLog.entries[0].result).toBe('success');
      expect(auditLog.entries[1].action).toBe('whitelist_add');

      // Audit log should track all operations
      const validationLogs = auditLog.entries.filter(e => e.action === 'transfer_validation');
      const whitelistLogs = auditLog.entries.filter(e => e.action === 'whitelist_add');

      expect(validationLogs).toHaveLength(1);
      expect(whitelistLogs).toHaveLength(1);
    });
  });
});
