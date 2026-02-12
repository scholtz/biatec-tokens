import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWhitelistStore } from './whitelist';
import { whitelistService } from '../services/whitelistService';
import type { CreateWhitelistEntryRequest, ApproveWhitelistEntryRequest, RejectWhitelistEntryRequest } from '../types/whitelist';

// Mock the whitelist service
vi.mock('../services/whitelistService', () => ({
  whitelistService: {
    getWhitelistEntries: vi.fn(),
    getWhitelistSummary: vi.fn(),
    getWhitelistEntry: vi.fn(),
    createWhitelistEntry: vi.fn(),
    updateWhitelistEntry: vi.fn(),
    approveWhitelistEntry: vi.fn(),
    rejectWhitelistEntry: vi.fn(),
    requestMoreInfo: vi.fn(),
    validateCsv: vi.fn(),
    bulkImport: vi.fn(),
    getJurisdictionRules: vi.fn(),
    getJurisdictionCoverage: vi.fn(),
    createJurisdictionRule: vi.fn(),
    updateJurisdictionRule: vi.fn(),
    deleteJurisdictionRule: vi.fn(),
    checkJurisdictionConflicts: vi.fn(),
  },
}));

describe('useWhitelistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchWhitelistEntries', () => {
    it('should fetch and store whitelist entries', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            entityType: 'individual' as const,
            status: 'approved' as const,
            jurisdictionCode: 'US',
            jurisdictionName: 'United States',
            riskLevel: 'low' as const,
            kycStatus: 'verified' as const,
            accreditationStatus: 'not_required' as const,
            documentationComplete: true,
            documentsUploaded: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin',
            auditTrail: [],
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };

      vi.mocked(whitelistService.getWhitelistEntries).mockResolvedValue(mockResponse);

      const store = useWhitelistStore();
      await store.fetchWhitelistEntries();

      expect(whitelistService.getWhitelistEntries).toHaveBeenCalled();
      expect(store.entries).toEqual(mockResponse.data);
      expect(store.pagination.total).toBe(1);
      expect(store.isLoading).toBe(false);
    });

    it('should handle errors when fetching entries', async () => {
      vi.mocked(whitelistService.getWhitelistEntries).mockRejectedValue(new Error('Network error'));

      const store = useWhitelistStore();
      await store.fetchWhitelistEntries();

      expect(store.error).toBe('Network error');
      expect(store.entries).toEqual([]);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('fetchWhitelistSummary', () => {
    it('should fetch and store whitelist summary', async () => {
      const mockSummary = {
        totalEntries: 10,
        approvedCount: 5,
        pendingCount: 3,
        rejectedCount: 2,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 3,
        highRiskCount: 1,
        lastUpdated: new Date().toISOString(),
      };

      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue(mockSummary);

      const store = useWhitelistStore();
      await store.fetchWhitelistSummary();

      expect(whitelistService.getWhitelistSummary).toHaveBeenCalled();
      expect(store.summary).toEqual(mockSummary);
      expect(store.isLoadingSummary).toBe(false);
    });
  });

  describe('createWhitelistEntry', () => {
    it('should create a new whitelist entry', async () => {
      const request: CreateWhitelistEntryRequest = {
        name: 'New User',
        email: 'new@example.com',
        entityType: 'individual',
        jurisdictionCode: 'US',
      };

      const mockCreatedEntry = {
        id: '2',
        ...request,
        status: 'pending' as const,
        jurisdictionName: 'United States',
        riskLevel: 'low' as const,
        kycStatus: 'not_started' as const,
        accreditationStatus: 'not_required' as const,
        documentationComplete: false,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        auditTrail: [],
      };

      vi.mocked(whitelistService.createWhitelistEntry).mockResolvedValue(mockCreatedEntry);
      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue({
        totalEntries: 1,
        approvedCount: 0,
        pendingCount: 1,
        rejectedCount: 0,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 1,
        highRiskCount: 0,
        lastUpdated: new Date().toISOString(),
      });

      const store = useWhitelistStore();
      const result = await store.createWhitelistEntry(request);

      expect(whitelistService.createWhitelistEntry).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockCreatedEntry);
      expect(store.entries).toHaveLength(1);
      expect(store.entries[0]).toEqual(mockCreatedEntry);
    });
  });

  describe('approveWhitelistEntry', () => {
    it('should approve a whitelist entry', async () => {
      const mockEntry = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        entityType: 'individual' as const,
        status: 'pending' as const,
        jurisdictionCode: 'US',
        jurisdictionName: 'United States',
        riskLevel: 'low' as const,
        kycStatus: 'verified' as const,
        accreditationStatus: 'not_required' as const,
        documentationComplete: true,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        auditTrail: [],
      };

      const mockApprovedEntry = {
        ...mockEntry,
        status: 'approved' as const,
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString(),
      };

      vi.mocked(whitelistService.approveWhitelistEntry).mockResolvedValue(mockApprovedEntry);
      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue({
        totalEntries: 1,
        approvedCount: 1,
        pendingCount: 0,
        rejectedCount: 0,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 1,
        highRiskCount: 0,
        lastUpdated: new Date().toISOString(),
      });

      const store = useWhitelistStore();
      store.entries = [mockEntry];

      const request: ApproveWhitelistEntryRequest = {
        id: '1',
        notes: 'Approved after verification',
      };

      const result = await store.approveWhitelistEntry(request);

      expect(whitelistService.approveWhitelistEntry).toHaveBeenCalledWith(request);
      expect(result).toBe(true);
      expect(store.entries[0].status).toBe('approved');
    });
  });

  describe('rejectWhitelistEntry', () => {
    it('should reject a whitelist entry', async () => {
      const mockEntry = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        entityType: 'individual' as const,
        status: 'pending' as const,
        jurisdictionCode: 'US',
        jurisdictionName: 'United States',
        riskLevel: 'low' as const,
        kycStatus: 'pending' as const,
        accreditationStatus: 'not_required' as const,
        documentationComplete: false,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        auditTrail: [],
      };

      const mockRejectedEntry = {
        ...mockEntry,
        status: 'rejected' as const,
        rejectionReason: 'Incomplete documentation',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString(),
      };

      vi.mocked(whitelistService.rejectWhitelistEntry).mockResolvedValue(mockRejectedEntry);
      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue({
        totalEntries: 1,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 1,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 1,
        highRiskCount: 0,
        lastUpdated: new Date().toISOString(),
      });

      const store = useWhitelistStore();
      store.entries = [mockEntry];

      const request: RejectWhitelistEntryRequest = {
        id: '1',
        reason: 'Incomplete documentation',
      };

      const result = await store.rejectWhitelistEntry(request);

      expect(whitelistService.rejectWhitelistEntry).toHaveBeenCalledWith(request);
      expect(result).toBe(true);
      expect(store.entries[0].status).toBe('rejected');
    });
  });

  describe('setFilters', () => {
    it('should update filters', () => {
      const store = useWhitelistStore();
      
      store.setFilters({
        status: ['approved'],
        searchQuery: 'test',
      });

      expect(store.filters.status).toEqual(['approved']);
      expect(store.filters.searchQuery).toBe('test');
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to default values', () => {
      const store = useWhitelistStore();
      
      store.setFilters({
        status: ['approved'],
        searchQuery: 'test',
        page: 5,
      });

      store.resetFilters();

      expect(store.filters).toEqual({
        page: 1,
        perPage: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });

  describe('computed properties', () => {
    it('should compute hasEntries correctly', () => {
      const store = useWhitelistStore();
      
      expect(store.hasEntries).toBe(false);

      store.entries = [{
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        entityType: 'individual',
        status: 'approved',
        jurisdictionCode: 'US',
        jurisdictionName: 'United States',
        riskLevel: 'low',
        kycStatus: 'verified',
        accreditationStatus: 'not_required',
        documentationComplete: true,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        auditTrail: [],
      }];

      expect(store.hasEntries).toBe(true);
    });

    it('should compute criticalConflicts correctly', () => {
      const store = useWhitelistStore();
      
      store.conflicts = [
        {
          entryId: '1',
          entryName: 'Test User',
          jurisdictionCode: 'CN',
          conflictType: 'blocked',
          severity: 'error',
          message: 'Blocked jurisdiction',
          affectedTokenPrograms: [],
        },
        {
          entryId: '2',
          entryName: 'Another User',
          jurisdictionCode: 'RU',
          conflictType: 'restricted',
          severity: 'warning',
          message: 'Restricted jurisdiction',
          affectedTokenPrograms: [],
        },
      ];

      expect(store.criticalConflicts).toHaveLength(1);
      expect(store.criticalConflicts[0].severity).toBe('error');
    });
  });
});
