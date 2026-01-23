import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhitelistService, type WhitelistEntry } from '../WhitelistService';
import { BiatecTokensApiClient } from '../BiatecTokensApiClient';

// Mock the API client
vi.mock('../BiatecTokensApiClient', () => {
  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };
  
  return {
    BiatecTokensApiClient: vi.fn(() => mockApiClient),
    getApiClient: vi.fn(() => mockApiClient),
  };
});

describe('WhitelistService', () => {
  let service: WhitelistService;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhitelistService();
    mockApiClient = (service as any).apiClient;
  });

  describe('getWhitelist', () => {
    it('should fetch whitelist entries without filters', async () => {
      const mockEntries: WhitelistEntry[] = [
        {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          status: 'active',
          addedAt: '2024-01-15T10:00:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValue(mockEntries);

      const result = await service.getWhitelist('token123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/tokens/token123/whitelist');
      expect(result).toEqual(mockEntries);
    });

    it('should fetch whitelist entries with search filter', async () => {
      const mockEntries: WhitelistEntry[] = [];
      mockApiClient.get.mockResolvedValue(mockEntries);

      await service.getWhitelist('token123', { search: 'AAAA' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/tokens/token123/whitelist?search=AAAA');
    });

    it('should fetch whitelist entries with status filter', async () => {
      const mockEntries: WhitelistEntry[] = [];
      mockApiClient.get.mockResolvedValue(mockEntries);

      await service.getWhitelist('token123', { status: 'active' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/tokens/token123/whitelist?status=active');
    });

    it('should fetch whitelist entries with both filters', async () => {
      const mockEntries: WhitelistEntry[] = [];
      mockApiClient.get.mockResolvedValue(mockEntries);

      await service.getWhitelist('token123', { search: 'AAAA', status: 'active' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/tokens/token123/whitelist?search=AAAA&status=active');
    });
  });

  describe('addAddress', () => {
    it('should add an address without metadata', async () => {
      const mockEntry: WhitelistEntry = {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active',
        addedAt: '2024-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockEntry);

      const result = await service.addAddress(
        'token123',
        'A23456723456723456723456723456723456723456723456723456723A'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith('/tokens/token123/whitelist', {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
      });
      expect(result).toEqual(mockEntry);
    });

    it('should add an address with MICA compliance metadata', async () => {
      const mockEntry: WhitelistEntry = {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active',
        addedAt: '2024-01-15T10:00:00Z',
        reason: 'KYC Verification Passed',
        requester: 'John Doe',
        kycVerified: true,
        jurisdictionCode: 'US',
        complianceChecks: {
          sanctionsScreening: true,
          amlVerification: true,
          accreditedInvestor: false,
        },
        notes: 'Test address',
      };

      mockApiClient.post.mockResolvedValue(mockEntry);

      const result = await service.addAddress(
        'token123',
        'A23456723456723456723456723456723456723456723456723456723A',
        {
          reason: 'KYC Verification Passed',
          requester: 'John Doe',
          kycVerified: true,
          jurisdictionCode: 'US',
          complianceChecks: {
            sanctionsScreening: true,
            amlVerification: true,
            accreditedInvestor: false,
          },
          notes: 'Test address',
        }
      );

      expect(mockApiClient.post).toHaveBeenCalledWith('/tokens/token123/whitelist', {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        reason: 'KYC Verification Passed',
        requester: 'John Doe',
        kycVerified: true,
        jurisdictionCode: 'US',
        complianceChecks: {
          sanctionsScreening: true,
          amlVerification: true,
          accreditedInvestor: false,
        },
        notes: 'Test address',
      });
      expect(result).toEqual(mockEntry);
    });
  });

  describe('removeAddress', () => {
    it('should remove an address from the whitelist with reason', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await service.removeAddress(
        'token123',
        'A23456723456723456723456723456723456723456723456723456723A',
        'Compliance violation'
      );

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/tokens/token123/whitelist/A23456723456723456723456723456723456723456723456723456723A',
        { data: { reason: 'Compliance violation' } }
      );
    });

    it('should remove an address without reason', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await service.removeAddress(
        'token123',
        'A23456723456723456723456723456723456723456723456723456723A'
      );

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/tokens/token123/whitelist/A23456723456723456723456723456723456723456723456723456723A',
        { data: { reason: undefined } }
      );
    });
  });

  describe('bulkUpload', () => {
    it('should upload multiple addresses via CSV', async () => {
      const csvData = 'address\nA23456723456723456723456723456723456723456723456723456723A\nB23456723456723456723456723456723456723456723456723456723B';
      const mockResponse = {
        success: 2,
        failed: 0,
        results: [
          { valid: true, row: 2, address: 'A23456723456723456723456723456723456723456723456723456723A' },
          { valid: true, row: 3, address: 'B23456723456723456723456723456723456723456723456723456723B' },
        ],
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.bulkUpload('token123', csvData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tokens/token123/whitelist/bulk', {
        csvData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateCsv', () => {
    it('should validate valid Algorand addresses', async () => {
      // 58 character Algorand address
      const csvData = 'address\nA23456723456723456723456723456723456723456723456723456723A';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        valid: true,
        row: 2,
        address: 'A23456723456723456723456723456723456723456723456723456723A',
      });
    });

    it('should validate valid Ethereum addresses', async () => {
      const csvData = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        valid: true,
        row: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
      });
    });

    it('should reject invalid address formats', async () => {
      const csvData = 'address\ninvalid-address';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        valid: false,
        row: 2,
        address: 'invalid-address',
        error: 'Invalid address format',
      });
    });

    it('should reject empty addresses', async () => {
      const csvData = '\n\n';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(0);
    });

    it('should skip header row if present', async () => {
      const csvData = 'address\nA23456723456723456723456723456723456723456723456723456723A';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(1);
      expect(result[0].row).toBe(2); // Row 2, not 1
    });

    it('should handle CSV with multiple columns', async () => {
      const csvData = 'A23456723456723456723456723456723456723456723456723456723A,notes here';
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('A23456723456723456723456723456723456723456723456723456723A');
    });

    it('should validate multiple addresses', async () => {
      const csvData = `A23456723456723456723456723456723456723456723456723456723A
B23456723456723456723456723456723456723456723456723456723B
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2
invalid-address`;
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(4);
      expect(result[0].valid).toBe(true);
      expect(result[1].valid).toBe(true);
      expect(result[2].valid).toBe(true);
      expect(result[3].valid).toBe(false);
      expect(result[3].error).toBe('Invalid address format');
    });

    it('should handle empty lines correctly', async () => {
      const csvData = `A23456723456723456723456723456723456723456723456723456723A


B23456723456723456723456723456723456723456723456723456723B`;
      
      const result = await service.validateCsv(csvData);

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe('A23456723456723456723456723456723456723456723456723456723A');
      expect(result[1].address).toBe('B23456723456723456723456723456723456723456723456723456723B');
    });
  });

  describe('importFromCsv', () => {
    it('should import addresses with MICA metadata', async () => {
      const csvData = `address,reason,requester,kyc_verified,jurisdiction
A23456723456723456723456723456723456723456723456723456723A,KYC Passed,John Doe,true,US`;

      mockApiClient.post.mockResolvedValue({
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active',
        addedAt: '2024-01-01T00:00:00Z',
      });

      const result = await service.importFromCsv('token123', csvData);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockApiClient.post).toHaveBeenCalledWith('/tokens/token123/whitelist', {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        reason: 'KYC Passed',
        requester: 'John Doe',
        kycVerified: true,
        jurisdictionCode: 'US',
      });
    });

    it('should throw error if address column is missing', async () => {
      const csvData = `reason,requester
KYC Passed,John Doe`;

      await expect(service.importFromCsv('token123', csvData)).rejects.toThrow(
        'CSV must contain an "address" column'
      );
    });
  });

  describe('exportComplianceReport', () => {
    it('should generate local report when API is unavailable', async () => {
      const mockEntries: WhitelistEntry[] = [
        {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          status: 'active',
          addedAt: '2024-01-01T00:00:00Z',
          kycVerified: true,
          complianceChecks: {
            sanctionsScreening: true,
            amlVerification: true,
          },
        },
      ];

      mockApiClient.get
        .mockRejectedValueOnce(new Error('API unavailable'))
        .mockResolvedValueOnce(mockEntries);

      const result = await service.exportComplianceReport('token123', 'VOI', 'json');

      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('tokenId', 'token123');
      expect(result).toHaveProperty('network', 'VOI');
      if (typeof result !== 'string') {
        expect(result.summary.totalWhitelisted).toBe(1);
        expect(result.summary.kycVerifiedCount).toBe(1);
      }
    });
  });
});
