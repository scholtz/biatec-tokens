import { describe, it, expect, beforeEach, vi } from 'vitest';
import { attestationService, AttestationService } from '../AttestationService';
import type {
  AttestationExportRequest,
  AttestationPackage,
} from '../../types/compliance';

describe('AttestationService', () => {
  let service: AttestationService;

  beforeEach(() => {
    service = new AttestationService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('generateAttestation', () => {
    it('should generate attestation package with required fields', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.tokenId).toBe('token123');
      expect(result.network).toBe('VOI');
      expect(result.issuerCredentials.name).toBe('Test Company');
      expect(result.signature).toBeDefined();
      expect(result.signature.algorithm).toBe('SHA-256');
    });

    it('should include compliance status when requested', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: true,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.complianceStatus).toBeDefined();
      expect(result.complianceStatus?.tokenId).toBe('token123');
      expect(result.complianceStatus?.network).toBe('VOI');
    });

    it('should include whitelist policy when requested', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: true,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.whitelistPolicy).toBeDefined();
      expect(result.whitelistPolicy?.enabled).toBe(true);
      expect(result.whitelistPolicy?.kycRequired).toBe(true);
    });

    it('should generate unique attestation IDs', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result1 = await service.generateAttestation(request);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamp
      const result2 = await service.generateAttestation(request);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should generate valid SHA-256 hash', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.signature.hash).toBeDefined();
      expect(result.signature.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex characters
    });

    it('should set MICA_AUDIT as default purpose', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.attestationMetadata.purpose).toBe('MICA_AUDIT');
    });

    it('should include audit period', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.attestationMetadata.auditPeriod).toBeDefined();
      expect(result.attestationMetadata.auditPeriod?.startDate).toBeDefined();
      expect(result.attestationMetadata.auditPeriod?.endDate).toBeDefined();
    });
  });

  describe('downloadAsPDF', () => {
    it('should generate PDF blob', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsPDF(attestation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should include all attestation fields in PDF content', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          registrationNumber: '12345',
          jurisdiction: 'EU',
          regulatoryLicense: 'LIC123',
          contactEmail: 'test@example.com',
          walletAddress: 'A'.repeat(58),
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsPDF(attestation);
      const text = await blob.text();

      expect(text).toContain('WALLET COMPLIANCE ATTESTATION');
      expect(text).toContain('Test Company');
      expect(text).toContain('token123');
      expect(text).toContain('VOI');
      expect(text).toContain('EU');
      expect(text).toContain('SHA-256');
    });

    it('should include compliance status in PDF when present', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        complianceStatus: {
          tokenId: 'token123',
          network: 'VOI',
          whitelistEnabled: true,
          whitelistCount: 42,
          complianceScore: 95,
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsPDF(attestation);
      const text = await blob.text();

      expect(text).toContain('COMPLIANCE STATUS');
      expect(text).toContain('42');
      expect(text).toContain('95');
    });

    it('should include whitelist policy in PDF when present', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        whitelistPolicy: {
          enabled: true,
          whitelistedCount: 50,
          kycRequired: true,
          jurisdictionRestrictions: ['US', 'CN'],
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsPDF(attestation);
      const text = await blob.text();

      expect(text).toContain('WHITELIST POLICY');
      expect(text).toContain('50');
      expect(text).toContain('US, CN');
    });
  });

  describe('downloadAsJSON', () => {
    it('should generate JSON blob', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsJSON(attestation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should generate valid JSON', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsJSON(attestation);
      const text = await blob.text();
      const parsed = JSON.parse(text);

      expect(parsed.id).toBe('attestation-123');
      expect(parsed.tokenId).toBe('token123');
      expect(parsed.network).toBe('VOI');
    });
  });

  describe('getAttestationHistory', () => {
    it('should return empty array when no history exists', async () => {
      const history = await service.getAttestationHistory();
      expect(history).toEqual([]);
    });

    it('should return stored history from localStorage', async () => {
      const mockHistory = [
        {
          id: 'attestation-1',
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI' as const,
          format: 'pdf' as const,
          status: 'success' as const,
        },
      ];
      localStorage.setItem('attestation-history', JSON.stringify(mockHistory));

      const history = await service.getAttestationHistory();

      expect(history).toHaveLength(1);
      expect(history[0].tokenId).toBe('token123');
    });

    it('should filter history by token ID', async () => {
      const mockHistory = [
        {
          id: 'attestation-1',
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI' as const,
          format: 'pdf' as const,
          status: 'success' as const,
        },
        {
          id: 'attestation-2',
          timestamp: '2026-01-23T11:00:00Z',
          tokenId: 'token456',
          network: 'VOI' as const,
          format: 'json' as const,
          status: 'success' as const,
        },
      ];
      localStorage.setItem('attestation-history', JSON.stringify(mockHistory));

      const history = await service.getAttestationHistory('token123');

      expect(history).toHaveLength(1);
      expect(history[0].tokenId).toBe('token123');
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('attestation-history', 'invalid-json');

      const history = await service.getAttestationHistory();

      expect(history).toEqual([]);
    });
  });

  describe('saveToHistory', () => {
    it('should save attestation to history', async () => {
      const item = {
        id: 'attestation-1',
        timestamp: '2026-01-23T10:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'pdf' as const,
        status: 'success' as const,
      };

      await service.saveToHistory(item);

      const stored = localStorage.getItem('attestation-history');
      expect(stored).toBeTruthy();
      
      const history = JSON.parse(stored!);
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('attestation-1');
    });

    it('should prepend new items to history', async () => {
      const item1 = {
        id: 'attestation-1',
        timestamp: '2026-01-23T10:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'pdf' as const,
        status: 'success' as const,
      };
      const item2 = {
        id: 'attestation-2',
        timestamp: '2026-01-23T11:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'json' as const,
        status: 'success' as const,
      };

      await service.saveToHistory(item1);
      await service.saveToHistory(item2);

      const history = await service.getAttestationHistory();
      expect(history[0].id).toBe('attestation-2'); // Most recent first
      expect(history[1].id).toBe('attestation-1');
    });

    it('should limit history to 20 items', async () => {
      // Add 25 items
      for (let i = 0; i < 25; i++) {
        await service.saveToHistory({
          id: `attestation-${i}`,
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI' as const,
          format: 'pdf' as const,
          status: 'success' as const,
        });
      }

      const history = await service.getAttestationHistory();
      expect(history.length).toBe(20);
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const item = {
        id: 'attestation-1',
        timestamp: '2026-01-23T10:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'pdf' as const,
        status: 'success' as const,
      };

      // Should not throw
      await expect(service.saveToHistory(item)).resolves.toBeUndefined();

      setItemSpy.mockRestore();
    });
  });

  describe('Module exports', () => {
    it('should export default attestationService instance', () => {
      expect(attestationService).toBeInstanceOf(AttestationService);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing issuer credentials gracefully', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: '',
          jurisdiction: '',
          walletAddress: '',
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      // Should still generate attestation with empty fields
      expect(result).toBeDefined();
      expect(result.issuerCredentials.name).toBe('');
    });

    it('should generate different hashes for different content', async () => {
      const request1: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Company A',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const request2: AttestationExportRequest = {
        ...request1,
        issuerCredentials: {
          name: 'Company B',
          jurisdiction: 'US',
          walletAddress: 'B'.repeat(58),
        },
      };

      const result1 = await service.generateAttestation(request1);
      const result2 = await service.generateAttestation(request2);

      expect(result1.signature.hash).not.toBe(result2.signature.hash);
    });

    it('should handle Aramid network in attestation generation', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token456',
        network: 'Aramid',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: true,
        includeComplianceStatus: true,
        format: 'both',
      };

      const result = await service.generateAttestation(request);

      expect(result.network).toBe('Aramid');
      expect(result.tokenId).toBe('token456');
    });

    it('should include optional fields when both flags are true', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: true,
        includeComplianceStatus: true,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.complianceStatus).toBeDefined();
      expect(result.whitelistPolicy).toBeDefined();
      expect(result.complianceStatus?.whitelistEnabled).toBe(true);
      expect(result.whitelistPolicy?.enabled).toBe(true);
    });

    it('should handle localStorage getItem returning null', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const history = await service.getAttestationHistory();

      expect(history).toEqual([]);
      getItemSpy.mockRestore();
    });

    it('should handle corrupted JSON in localStorage', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json {');

      const history = await service.getAttestationHistory();

      expect(history).toEqual([]);
      getItemSpy.mockRestore();
    });

    it('should handle PDF generation with all optional fields', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          registrationNumber: '12345',
          jurisdiction: 'EU',
          regulatoryLicense: 'LIC123',
          contactEmail: 'test@example.com',
          walletAddress: 'A'.repeat(58),
        },
        complianceStatus: {
          tokenId: 'token123',
          network: 'VOI',
          whitelistEnabled: true,
          whitelistCount: 42,
          complianceScore: 95,
          lastAuditTimestamp: '2026-01-23T11:00:00Z',
        },
        whitelistPolicy: {
          enabled: true,
          whitelistedCount: 50,
          kycRequired: true,
          jurisdictionRestrictions: ['US', 'CN', 'RU'],
        },
        attestationMetadata: {
          purpose: 'MICA_AUDIT',
          validUntil: '2027-01-23T12:00:00Z',
          auditPeriod: {
            startDate: '2025-12-23T12:00:00Z',
            endDate: '2026-01-23T12:00:00Z',
          },
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsPDF(attestation);
      const text = await blob.text();

      expect(text).toContain('Test Company');
      expect(text).toContain('12345');
      expect(text).toContain('LIC123');
      expect(text).toContain('test@example.com');
      expect(text).toContain('95');
      expect(text).toContain('US, CN, RU');
      expect(text).toContain('2027');
    });

    it('should generate audit period with correct date range', async () => {
      const request: AttestationExportRequest = {
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        includeWhitelistPolicy: false,
        includeComplianceStatus: false,
        format: 'json',
      };

      const result = await service.generateAttestation(request);

      expect(result.attestationMetadata.auditPeriod).toBeDefined();
      
      const startDate = new Date(result.attestationMetadata.auditPeriod!.startDate);
      const endDate = new Date(result.attestationMetadata.auditPeriod!.endDate);
      const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Should be approximately 30 days
      expect(diffInDays).toBeGreaterThan(29);
      expect(diffInDays).toBeLessThan(31);
    });

    it('should handle filtering history by non-existent tokenId', async () => {
      const mockHistory = [
        {
          id: 'attestation-1',
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI' as const,
          format: 'pdf' as const,
          status: 'success' as const,
        },
        {
          id: 'attestation-2',
          timestamp: '2026-01-23T11:00:00Z',
          tokenId: 'token456',
          network: 'VOI' as const,
          format: 'json' as const,
          status: 'success' as const,
        },
      ];
      localStorage.setItem('attestation-history', JSON.stringify(mockHistory));

      const history = await service.getAttestationHistory('token999');

      expect(history).toHaveLength(0);
    });

    it('should handle JSON export with nested metadata', async () => {
      const attestation: AttestationPackage = {
        id: 'attestation-123',
        version: '1.0.0',
        generatedAt: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: {
          name: 'Test Company',
          jurisdiction: 'EU',
          walletAddress: 'A'.repeat(58),
        },
        attestationMetadata: {
          purpose: 'REGULATORY_SUBMISSION',
          validUntil: '2027-01-23T12:00:00Z',
        },
        signature: {
          algorithm: 'SHA-256',
          hash: 'abc123',
          timestamp: '2026-01-23T12:00:00Z',
          signedBy: 'A'.repeat(58),
          version: '1.0.0',
        },
      };

      const blob = await service.downloadAsJSON(attestation);
      const text = await blob.text();
      const parsed = JSON.parse(text);

      expect(parsed.attestationMetadata.purpose).toBe('REGULATORY_SUBMISSION');
      expect(parsed.attestationMetadata.validUntil).toBe('2027-01-23T12:00:00Z');
    });

    it('should prepend items to history in correct order', async () => {
      const item1 = {
        id: 'attestation-1',
        timestamp: '2026-01-23T10:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'pdf' as const,
        status: 'success' as const,
      };

      const item2 = {
        id: 'attestation-2',
        timestamp: '2026-01-23T11:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'json' as const,
        status: 'success' as const,
      };

      const item3 = {
        id: 'attestation-3',
        timestamp: '2026-01-23T12:00:00Z',
        tokenId: 'token123',
        network: 'VOI' as const,
        format: 'both' as const,
        status: 'success' as const,
      };

      await service.saveToHistory(item1);
      await service.saveToHistory(item2);
      await service.saveToHistory(item3);

      const history = await service.getAttestationHistory();

      // Most recent should be first
      expect(history[0].id).toBe('attestation-3');
      expect(history[1].id).toBe('attestation-2');
      expect(history[2].id).toBe('attestation-1');
    });
  });
});
