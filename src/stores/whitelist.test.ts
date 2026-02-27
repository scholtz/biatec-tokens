import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWhitelistStore } from "./whitelist";
import { whitelistService } from "../services/whitelistService";
import type { CreateWhitelistEntryRequest, ApproveWhitelistEntryRequest, RejectWhitelistEntryRequest } from "../types/whitelist";

// Mock the whitelist service
vi.mock("../services/whitelistService", () => ({
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

describe("useWhitelistStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("fetchWhitelistEntries", () => {
    it("should fetch and store whitelist entries", async () => {
      const mockResponse = {
        data: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            entityType: "individual" as const,
            status: "approved" as const,
            jurisdictionCode: "US",
            jurisdictionName: "United States",
            riskLevel: "low" as const,
            kycStatus: "verified" as const,
            accreditationStatus: "not_required" as const,
            documentationComplete: true,
            documentsUploaded: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin",
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

    it("should handle errors when fetching entries", async () => {
      vi.mocked(whitelistService.getWhitelistEntries).mockRejectedValue(new Error("Network error"));

      const store = useWhitelistStore();
      await store.fetchWhitelistEntries();

      expect(store.error).toBe("Network error");
      expect(store.entries).toEqual([]);
      expect(store.isLoading).toBe(false);
    });
  });

  describe("fetchWhitelistSummary", () => {
    it("should fetch and store whitelist summary", async () => {
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

  describe("createWhitelistEntry", () => {
    it("should create a new whitelist entry", async () => {
      const request: CreateWhitelistEntryRequest = {
        name: "New User",
        email: "new@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
      };

      const mockCreatedEntry = {
        id: "2",
        ...request,
        status: "pending" as const,
        jurisdictionName: "United States",
        riskLevel: "low" as const,
        kycStatus: "not_started" as const,
        accreditationStatus: "not_required" as const,
        documentationComplete: false,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
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

  describe("approveWhitelistEntry", () => {
    it("should approve a whitelist entry", async () => {
      const mockEntry = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        entityType: "individual" as const,
        status: "pending" as const,
        jurisdictionCode: "US",
        jurisdictionName: "United States",
        riskLevel: "low" as const,
        kycStatus: "verified" as const,
        accreditationStatus: "not_required" as const,
        documentationComplete: true,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
        auditTrail: [],
      };

      const mockApprovedEntry = {
        ...mockEntry,
        status: "approved" as const,
        reviewedBy: "admin",
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
        id: "1",
        notes: "Approved after verification",
      };

      const result = await store.approveWhitelistEntry(request);

      expect(whitelistService.approveWhitelistEntry).toHaveBeenCalledWith(request);
      expect(result).toBe(true);
      expect(store.entries[0].status).toBe("approved");
    });
  });

  describe("rejectWhitelistEntry", () => {
    it("should reject a whitelist entry", async () => {
      const mockEntry = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        entityType: "individual" as const,
        status: "pending" as const,
        jurisdictionCode: "US",
        jurisdictionName: "United States",
        riskLevel: "low" as const,
        kycStatus: "pending" as const,
        accreditationStatus: "not_required" as const,
        documentationComplete: false,
        documentsUploaded: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
        auditTrail: [],
      };

      const mockRejectedEntry = {
        ...mockEntry,
        status: "rejected" as const,
        rejectionReason: "Incomplete documentation",
        reviewedBy: "admin",
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
        id: "1",
        reason: "Incomplete documentation",
      };

      const result = await store.rejectWhitelistEntry(request);

      expect(whitelistService.rejectWhitelistEntry).toHaveBeenCalledWith(request);
      expect(result).toBe(true);
      expect(store.entries[0].status).toBe("rejected");
    });
  });

  describe("setFilters", () => {
    it("should update filters", () => {
      const store = useWhitelistStore();

      store.setFilters({
        status: ["approved"],
        searchQuery: "test",
      });

      expect(store.filters.status).toEqual(["approved"]);
      expect(store.filters.searchQuery).toBe("test");
    });
  });

  describe("resetFilters", () => {
    it("should reset filters to default values", () => {
      const store = useWhitelistStore();

      store.setFilters({
        status: ["approved"],
        searchQuery: "test",
        page: 5,
      });

      store.resetFilters();

      expect(store.filters).toEqual({
        page: 1,
        perPage: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });
  });

  describe("computed properties", () => {
    it("should compute hasEntries correctly", () => {
      const store = useWhitelistStore();

      expect(store.hasEntries).toBe(false);

      store.entries = [
        {
          id: "1",
          name: "Test",
          email: "test@example.com",
          entityType: "individual",
          status: "approved",
          jurisdictionCode: "US",
          jurisdictionName: "United States",
          riskLevel: "low",
          kycStatus: "verified",
          accreditationStatus: "not_required",
          documentationComplete: true,
          documentsUploaded: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "admin",
          auditTrail: [],
        },
      ];

      expect(store.hasEntries).toBe(true);
    });

    it("should compute criticalConflicts correctly", () => {
      const store = useWhitelistStore();

      store.conflicts = [
        {
          entryId: "1",
          entryName: "Test User",
          jurisdictionCode: "CN",
          conflictType: "blocked",
          severity: "error",
          message: "Blocked jurisdiction",
          affectedTokenPrograms: [],
        },
        {
          entryId: "2",
          entryName: "Another User",
          jurisdictionCode: "RU",
          conflictType: "restricted",
          severity: "warning",
          message: "Restricted jurisdiction",
          affectedTokenPrograms: [],
        },
      ];

      expect(store.criticalConflicts).toHaveLength(1);
      expect(store.criticalConflicts[0].severity).toBe("error");
    });
  });

  describe("Edge Cases - MICA Compliance", () => {
    describe("Duplicate Address Validation", () => {
      it("should handle duplicate email addresses with error", async () => {
        const existingEntry = {
          id: "1",
          name: "Existing User",
          email: "duplicate@example.com",
          entityType: "individual" as const,
          status: "approved" as const,
          jurisdictionCode: "US",
          jurisdictionName: "United States",
          riskLevel: "low" as const,
          kycStatus: "verified" as const,
          accreditationStatus: "not_required" as const,
          documentationComplete: true,
          documentsUploaded: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "admin",
          auditTrail: [],
        };

        const duplicateRequest: CreateWhitelistEntryRequest = {
          name: "Duplicate User",
          email: "duplicate@example.com",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Duplicate email address already exists in whitelist"));

        const store = useWhitelistStore();
        store.entries = [existingEntry];

        const result = await store.createWhitelistEntry(duplicateRequest);

        expect(result).toBeNull();
        expect(store.entries).toHaveLength(1);
        expect(store.error).toContain("Duplicate email");
      });

      it("should handle case-insensitive duplicate detection", async () => {
        const request: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "TEST@EXAMPLE.COM",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Email already exists (case-insensitive match)"));

        const store = useWhitelistStore();

        const result = await store.createWhitelistEntry(request);
        expect(result).toBeNull();
        expect(store.error).toContain("Email already exists");
      });
    });

    describe("Invalid Jurisdiction Handling", () => {
      it("should reject entries with invalid jurisdiction codes", async () => {
        const invalidRequest: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "test@example.com",
          entityType: "individual",
          jurisdictionCode: "INVALID",
        };

        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Invalid jurisdiction code: INVALID"));

        const store = useWhitelistStore();

        const result = await store.createWhitelistEntry(invalidRequest);
        expect(result).toBeNull();
        expect(store.error).toContain("Invalid jurisdiction");
      });

      it("should handle blocked jurisdictions with clear error messages", async () => {
        const blockedRequest: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "test@example.com",
          entityType: "individual",
          jurisdictionCode: "CN",
        };

        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Jurisdiction CN is blocked for token issuance under MICA regulations"));

        const store = useWhitelistStore();

        const result = await store.createWhitelistEntry(blockedRequest);
        expect(result).toBeNull();
        expect(store.error).toContain("blocked");
      });
    });

    describe("Empty Whitelist Submission", () => {
      it("should handle submission with no entries gracefully", async () => {
        vi.mocked(whitelistService.bulkImport).mockRejectedValue(new Error("Cannot import empty whitelist - at least one entry required"));

        const store = useWhitelistStore();
        const emptyRequest = { entries: [], validateOnly: false };

        const result = await store.bulkImport(emptyRequest);
        expect(result).toBeNull();
        expect(store.error).toContain("empty whitelist");
      });

      it("should validate minimum requirements before submission", async () => {
        const invalidEntry = {
          name: "",
          email: "",
          entityType: "individual",
          jurisdictionCode: "",
        };

        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Required fields missing: name, email, jurisdictionCode"));

        const store = useWhitelistStore();

        const result = await store.createWhitelistEntry(invalidEntry as any);
        expect(result).toBeNull();
        expect(store.error).toContain("Required fields missing");
      });
    });

    describe("Backend Rejection Scenarios", () => {
      it("should handle network errors with retry capability", async () => {
        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Network error: Unable to reach compliance server"));

        const store = useWhitelistStore();
        const request: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "test@example.com",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        const result = await store.createWhitelistEntry(request);
        expect(result).toBeNull();
        expect(store.error).toContain("Network error");
        expect(store.isLoading).toBe(false);
      });

      it("should handle backend validation failures", async () => {
        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Backend validation failed: KYC verification incomplete"));

        const store = useWhitelistStore();
        const request: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "test@example.com",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        const result = await store.createWhitelistEntry(request);
        expect(result).toBeNull();
        expect(store.error).toContain("Backend validation failed");
      });

      it("should handle permission denied errors", async () => {
        vi.mocked(whitelistService.approveWhitelistEntry).mockRejectedValue(new Error("Permission denied: User does not have approval authority"));

        const store = useWhitelistStore();
        const request: ApproveWhitelistEntryRequest = {
          id: "1",
          notes: "Approved",
        };

        const result = await store.approveWhitelistEntry(request);

        expect(result).toBe(false);
        expect(store.error).toContain("Permission denied");
      });

      it("should handle concurrent modification errors", async () => {
        vi.mocked(whitelistService.updateWhitelistEntry).mockRejectedValue(new Error("Conflict: Entry was modified by another user"));

        const store = useWhitelistStore();

        const result = await store.updateWhitelistEntry("1", { name: "Updated" });
        expect(result).toBeNull();
        expect(store.error).toContain("modified by another user");
      });
    });

    describe("Revoked Entries", () => {
      it("should handle revocation of approved entries", async () => {
        const approvedEntry = {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          entityType: "individual" as const,
          status: "approved" as const,
          jurisdictionCode: "US",
          jurisdictionName: "United States",
          riskLevel: "low" as const,
          kycStatus: "verified" as const,
          accreditationStatus: "verified" as const,
          documentationComplete: true,
          documentsUploaded: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "admin",
          auditTrail: [],
        };

        const revokedEntry = {
          ...approvedEntry,
          status: "rejected" as const,
          rejectionReason: "Revoked due to compliance violation",
        };

        vi.mocked(whitelistService.rejectWhitelistEntry).mockResolvedValue(revokedEntry);
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
        store.entries = [approvedEntry];

        const result = await store.rejectWhitelistEntry({
          id: "1",
          reason: "Revoked due to compliance violation",
        });

        expect(result).toBe(true);
        expect(store.entries[0].status).toBe("rejected");
        expect(store.entries[0].rejectionReason).toContain("compliance violation");
      });
    });

    describe("Invalid Identifiers", () => {
      it("should reject entries with invalid email format", async () => {
        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Invalid email format"));

        const store = useWhitelistStore();
        const request: CreateWhitelistEntryRequest = {
          name: "Test User",
          email: "not-an-email",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        const result = await store.createWhitelistEntry(request);
        expect(result).toBeNull();
        expect(store.error).toContain("Invalid email format");
      });

      it("should reject entries with special characters in names", async () => {
        vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue(new Error("Name contains invalid characters"));

        const store = useWhitelistStore();
        const request: CreateWhitelistEntryRequest = {
          name: "Test<script>alert(1)</script>",
          email: "test@example.com",
          entityType: "individual",
          jurisdictionCode: "US",
        };

        const result = await store.createWhitelistEntry(request);
        expect(result).toBeNull();
        expect(store.error).toContain("invalid characters");
      });
    });
  });

  describe("fetchWhitelistEntry", () => {
    it("should fetch a single whitelist entry", async () => {
      const mockEntry = {
        id: "test-entry-1",
        address: "BL5G4DPK6V4N36NYAKE2TBURZQGKDDVVMKLNOSOAGGPK5FU6CJ2ZE4W5YY",
        entityName: "Test Entity",
        entityType: "individual" as const,
        jurisdictionCode: "US",
        riskLevel: "low" as const,
        kycStatus: "verified" as const,
        status: "approved" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(whitelistService.getWhitelistEntry).mockResolvedValue(mockEntry);

      const store = useWhitelistStore();
      const result = await store.fetchWhitelistEntry("test-entry-1");

      expect(whitelistService.getWhitelistEntry).toHaveBeenCalledWith("test-entry-1");
      expect(store.selectedEntry).toEqual(mockEntry);
      expect(result).toEqual(mockEntry);
    });

    it("should handle null result when entry not found", async () => {
      vi.mocked(whitelistService.getWhitelistEntry).mockResolvedValue(null);

      const store = useWhitelistStore();
      const result = await store.fetchWhitelistEntry("non-existent-id");

      expect(whitelistService.getWhitelistEntry).toHaveBeenCalledWith("non-existent-id");
      expect(store.selectedEntry).toBeNull();
      expect(result).toBeNull();
    });

    it("should handle errors when fetching entry", async () => {
      vi.mocked(whitelistService.getWhitelistEntry).mockRejectedValue(new Error("Network error"));

      const store = useWhitelistStore();
      const result = await store.fetchWhitelistEntry("test-id");

      expect(whitelistService.getWhitelistEntry).toHaveBeenCalledWith("test-id");
      expect(store.error).toContain("Network error");
      expect(result).toBeNull();
    });
  });

  describe("updateWhitelistEntry", () => {
    it("should update a whitelist entry", async () => {
      const mockUpdatedEntry = {
        id: "test-entry-1",
        address: "BL5G4DPK6V4N36NYAKE2TBURZQGKDDVVMKLNOSOAGGPK5FU6CJ2ZE4W5YY",
        entityName: "Updated Entity",
        entityType: "individual" as const,
        jurisdictionCode: "US",
        riskLevel: "medium" as const,
        kycStatus: "verified" as const,
        status: "approved" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(whitelistService.updateWhitelistEntry).mockResolvedValue(mockUpdatedEntry);

      const store = useWhitelistStore();
      const updateRequest = {
        entityName: "Updated Entity",
        riskLevel: "medium" as const,
      };

      const result = await store.updateWhitelistEntry("test-entry-1", updateRequest);

      expect(whitelistService.updateWhitelistEntry).toHaveBeenCalledWith("test-entry-1", updateRequest);
      expect(result).toEqual(mockUpdatedEntry);
    });

    it("should handle null result when entry not found", async () => {
      vi.mocked(whitelistService.updateWhitelistEntry).mockResolvedValue(null);

      const store = useWhitelistStore();
      const updateRequest = {
        entityName: "Updated Name",
      };

      const result = await store.updateWhitelistEntry("non-existent-id", updateRequest);

      expect(whitelistService.updateWhitelistEntry).toHaveBeenCalledWith("non-existent-id", updateRequest);
      expect(result).toBeNull();
    });

    it("should handle errors when updating entry", async () => {
      vi.mocked(whitelistService.updateWhitelistEntry).mockRejectedValue(new Error("Update failed"));

      const store = useWhitelistStore();
      const updateRequest = {
        entityName: "Updated Name",
      };

      const result = await store.updateWhitelistEntry("test-id", updateRequest);

      expect(whitelistService.updateWhitelistEntry).toHaveBeenCalledWith("test-id", updateRequest);
      expect(store.error).toContain("Update failed");
      expect(result).toBeNull();
    });
  });

  describe("requestMoreInfo", () => {
    it("should request more information for an entry", async () => {
      const mockUpdatedEntry = {
        id: "test-entry-1",
        address: "BL5G4DPK6V4N36NYAKE2TBURZQGKDDVVMKLNOSOAGGPK5FU6CJ2ZE4W5YY",
        entityName: "Test Entity",
        entityType: "individual" as const,
        jurisdictionCode: "US",
        riskLevel: "low" as const,
        kycStatus: "verified" as const,
        status: "more_info_requested" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(whitelistService.requestMoreInfo).mockResolvedValue(mockUpdatedEntry);

      const store = useWhitelistStore();
      const request = {
        id: "test-entry-1",
        requestedBy: "admin",
        message: "Please provide additional documentation",
        requiredFields: ["taxId", "proofOfAddress"],
      };

      const result = await store.requestMoreInfo(request);

      expect(whitelistService.requestMoreInfo).toHaveBeenCalledWith(request);
      expect(result).toBe(true);
    });

    it("should handle errors when requesting more info", async () => {
      vi.mocked(whitelistService.requestMoreInfo).mockRejectedValue(new Error("Request failed"));

      const store = useWhitelistStore();
      const request = {
        id: "test-id",
        requestedBy: "admin",
        message: "Please provide documentation",
      };

      const result = await store.requestMoreInfo(request);

      expect(whitelistService.requestMoreInfo).toHaveBeenCalledWith(request);
      expect(store.error).toContain("Request failed");
      expect(result).toBe(false);
    });
  });

  describe("validateCsv", () => {
    it("should validate CSV file", async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        totalRows: 10,
        validRows: 10,
      };

      vi.mocked(whitelistService.validateCsv).mockResolvedValue(mockValidationResult);

      const store = useWhitelistStore();
      const file = new File(["test,csv,content"], "test.csv", { type: "text/csv" });

      const result = await store.validateCsv(file);

      expect(whitelistService.validateCsv).toHaveBeenCalledWith(file);
      expect(result).toEqual(mockValidationResult);
    });

    it("should handle null result when validation fails", async () => {
      vi.mocked(whitelistService.validateCsv).mockResolvedValue(null);

      const store = useWhitelistStore();
      const file = new File(["invalid,csv"], "test.csv", { type: "text/csv" });

      const result = await store.validateCsv(file);

      expect(whitelistService.validateCsv).toHaveBeenCalledWith(file);
      expect(result).toBeNull();
    });

    it("should handle errors during CSV validation", async () => {
      vi.mocked(whitelistService.validateCsv).mockRejectedValue(new Error("Validation error"));

      const store = useWhitelistStore();
      const file = new File(["test"], "test.csv", { type: "text/csv" });

      const result = await store.validateCsv(file);

      expect(whitelistService.validateCsv).toHaveBeenCalledWith(file);
      expect(store.error).toContain("Validation error");
      expect(result).toBeNull();
    });
  });

  describe("bulkImport", () => {
    it("should perform bulk import", async () => {
      const mockImportResult = {
        success: true,
        totalEntries: 5,
        successfulEntries: 5,
        errors: [],
        createdEntries: [],
      };

      vi.mocked(whitelistService.bulkImport).mockResolvedValue(mockImportResult);

      const store = useWhitelistStore();
      const request = {
        entries: [
          {
            address: "BULK1",
            entityName: "Bulk Entity 1",
            entityType: "individual" as const,
            jurisdictionCode: "US",
            riskLevel: "low" as const,
            kycStatus: "verified" as const,
          },
        ],
        approvedBy: "admin",
      };

      const result = await store.bulkImport(request);

      expect(whitelistService.bulkImport).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockImportResult);
    });

    it("should handle null result when bulk import fails", async () => {
      vi.mocked(whitelistService.bulkImport).mockResolvedValue(null);

      const store = useWhitelistStore();
      const request = {
        entries: [],
        approvedBy: "admin",
      };

      const result = await store.bulkImport(request);

      expect(whitelistService.bulkImport).toHaveBeenCalledWith(request);
      expect(result).toBeNull();
    });

    it("should handle errors during bulk import", async () => {
      vi.mocked(whitelistService.bulkImport).mockRejectedValue(new Error("Import failed"));

      const store = useWhitelistStore();
      const request = {
        entries: [
          {
            address: "TEST",
            entityName: "Test Entity",
            entityType: "individual" as const,
            jurisdictionCode: "US",
            riskLevel: "low" as const,
            kycStatus: "verified" as const,
          },
        ],
        approvedBy: "admin",
      };

      const result = await store.bulkImport(request);

      expect(whitelistService.bulkImport).toHaveBeenCalledWith(request);
      expect(store.error).toContain("Import failed");
      expect(result).toBeNull();
    });
  });

  describe("fetchJurisdictionRules", () => {
    it("should fetch jurisdiction rules", async () => {
      const mockRules = [
        {
          id: "rule-1",
          jurisdictionCode: "US",
          name: "United States",
          description: "US jurisdiction rules",
          riskLevel: "low" as const,
          requiresKyc: true,
          restricted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(whitelistService.getJurisdictionRules).mockResolvedValue(mockRules);

      const store = useWhitelistStore();
      await store.fetchJurisdictionRules();

      expect(whitelistService.getJurisdictionRules).toHaveBeenCalled();
      expect(store.jurisdictionRules).toEqual(mockRules);
      expect(store.isLoadingJurisdictions).toBe(false);
    });

    it("should handle errors when fetching jurisdiction rules", async () => {
      vi.mocked(whitelistService.getJurisdictionRules).mockRejectedValue(new Error("Fetch failed"));

      const store = useWhitelistStore();
      await store.fetchJurisdictionRules();

      expect(whitelistService.getJurisdictionRules).toHaveBeenCalled();
      expect(store.error).toContain("Fetch failed");
      expect(store.isLoadingJurisdictions).toBe(false);
    });
  });

  describe("fetchJurisdictionCoverage", () => {
    it("should fetch jurisdiction coverage", async () => {
      const mockCoverage = {
        coverage: [{ jurisdictionCode: "US", coveredAddresses: 100, totalAddresses: 100, percentage: 100 }],
        totalJurisdictions: 1,
        coveredJurisdictions: 1,
        coveragePercentage: 100,
      };

      vi.mocked(whitelistService.getJurisdictionCoverage).mockResolvedValue(mockCoverage);

      const store = useWhitelistStore();
      await store.fetchJurisdictionCoverage();

      expect(whitelistService.getJurisdictionCoverage).toHaveBeenCalled();
      expect(store.jurisdictionCoverage).toEqual(mockCoverage);
    });

    it("should handle errors when fetching jurisdiction coverage", async () => {
      vi.mocked(whitelistService.getJurisdictionCoverage).mockRejectedValue(new Error("Coverage fetch failed"));

      const store = useWhitelistStore();
      await store.fetchJurisdictionCoverage();

      expect(whitelistService.getJurisdictionCoverage).toHaveBeenCalled();
      expect(store.error).toContain("Coverage fetch failed");
    });
  });

  describe("createJurisdictionRule", () => {
    it("should create a jurisdiction rule", async () => {
      const mockRule = {
        id: "new-rule-1",
        jurisdictionCode: "CA",
        name: "Canada",
        description: "Canadian jurisdiction",
        riskLevel: "low" as const,
        requiresKyc: true,
        restricted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(whitelistService.createJurisdictionRule).mockResolvedValue(mockRule);

      const store = useWhitelistStore();
      const ruleData = {
        jurisdictionCode: "CA",
        name: "Canada",
        description: "Canadian jurisdiction",
        riskLevel: "low" as const,
        requiresKyc: true,
        restricted: false,
      };

      const result = await store.createJurisdictionRule(ruleData);

      expect(whitelistService.createJurisdictionRule).toHaveBeenCalledWith(ruleData);
      expect(result).toEqual(mockRule);
    });

    it("should handle errors when creating jurisdiction rule", async () => {
      vi.mocked(whitelistService.createJurisdictionRule).mockRejectedValue(new Error("Creation failed"));

      const store = useWhitelistStore();
      const ruleData = {
        jurisdictionCode: "XX",
        name: "Invalid",
        description: "Invalid jurisdiction",
        riskLevel: "high" as const,
        requiresKyc: false,
        restricted: true,
      };

      const result = await store.createJurisdictionRule(ruleData);

      expect(whitelistService.createJurisdictionRule).toHaveBeenCalledWith(ruleData);
      expect(store.error).toContain("Creation failed");
      expect(result).toBeNull();
    });
  });

  describe("updateJurisdictionRule", () => {
    it("should update a jurisdiction rule", async () => {
      const mockUpdatedRule = {
        id: "rule-1",
        jurisdictionCode: "US",
        name: "United States Updated",
        description: "Updated US rules",
        riskLevel: "medium" as const,
        requiresKyc: false,
        restricted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(whitelistService.updateJurisdictionRule).mockResolvedValue(mockUpdatedRule);

      const store = useWhitelistStore();
      const updateData = {
        name: "United States Updated",
        requiresKyc: false,
      };

      const result = await store.updateJurisdictionRule("rule-1", updateData);

      expect(whitelistService.updateJurisdictionRule).toHaveBeenCalledWith("rule-1", updateData);
      expect(result).toEqual(mockUpdatedRule);
    });

    it("should handle errors when updating jurisdiction rule", async () => {
      vi.mocked(whitelistService.updateJurisdictionRule).mockRejectedValue(new Error("Update failed"));

      const store = useWhitelistStore();
      const updateData = {
        name: "Updated Name",
      };

      const result = await store.updateJurisdictionRule("non-existent-rule", updateData);

      expect(whitelistService.updateJurisdictionRule).toHaveBeenCalledWith("non-existent-rule", updateData);
      expect(store.error).toContain("Update failed");
      expect(result).toBeNull();
    });
  });

  describe("deleteJurisdictionRule", () => {
    it("should delete a jurisdiction rule", async () => {
      vi.mocked(whitelistService.deleteJurisdictionRule).mockResolvedValue(undefined);

      const store = useWhitelistStore();
      const result = await store.deleteJurisdictionRule("rule-1");

      expect(whitelistService.deleteJurisdictionRule).toHaveBeenCalledWith("rule-1");
      expect(result).toBe(true);
    });

    it("should handle errors when deleting jurisdiction rule", async () => {
      vi.mocked(whitelistService.deleteJurisdictionRule).mockRejectedValue(new Error("Deletion failed"));

      const store = useWhitelistStore();
      const result = await store.deleteJurisdictionRule("rule-1");

      expect(whitelistService.deleteJurisdictionRule).toHaveBeenCalledWith("rule-1");
      expect(store.error).toContain("Deletion failed");
      expect(result).toBe(false);
    });
  });

  describe("checkJurisdictionConflicts", () => {
    it("should check jurisdiction conflicts", async () => {
      const mockConflicts = [
        {
          id: "conflict-1",
          type: "jurisdiction_restriction" as const,
          severity: "high" as const,
          description: "High-risk jurisdiction detected",
          affectedEntries: ["entry-1", "entry-2"],
        },
      ];

      vi.mocked(whitelistService.checkJurisdictionConflicts).mockResolvedValue(mockConflicts);

      const store = useWhitelistStore();
      await store.checkJurisdictionConflicts();

      expect(whitelistService.checkJurisdictionConflicts).toHaveBeenCalledWith(undefined);
      expect(store.conflicts).toEqual(mockConflicts);
    });

    it("should check conflicts for specific token program", async () => {
      const mockConflicts = [
        {
          id: "conflict-2",
          type: "token_program_restriction" as const,
          severity: "medium" as const,
          description: "Token program restriction",
          affectedEntries: ["entry-3"],
        },
      ];

      vi.mocked(whitelistService.checkJurisdictionConflicts).mockResolvedValue(mockConflicts);

      const store = useWhitelistStore();
      const tokenProgramId = "test-program-id";
      await store.checkJurisdictionConflicts(tokenProgramId);

      expect(whitelistService.checkJurisdictionConflicts).toHaveBeenCalledWith(tokenProgramId);
      expect(store.conflicts).toEqual(mockConflicts);
    });

    it("should handle errors when checking conflicts", async () => {
      vi.mocked(whitelistService.checkJurisdictionConflicts).mockRejectedValue(new Error("Conflict check failed"));

      const store = useWhitelistStore();
      await store.checkJurisdictionConflicts();

      expect(whitelistService.checkJurisdictionConflicts).toHaveBeenCalledWith(undefined);
      expect(store.error).toContain("Conflict check failed");
    });
  });

  describe("selectEntry and clearError", () => {
    it("should set selected entry", () => {
      const store = useWhitelistStore();
      const mockEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;
      store.selectEntry(mockEntry);
      expect(store.selectedEntry).toEqual(mockEntry);
    });

    it("should clear selected entry when null passed", () => {
      const store = useWhitelistStore();
      const mockEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;
      store.selectEntry(mockEntry);
      store.selectEntry(null);
      expect(store.selectedEntry).toBeNull();
    });

    it("should clear error with clearError()", () => {
      const store = useWhitelistStore();
      store.error = "some error";
      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe("updateWhitelistEntry - selectedEntry branch", () => {
    it("should update selectedEntry when it matches the updated entry", async () => {
      const mockEntry = { id: "e1", address: "ADDR1", status: "approved" } as any;
      vi.mocked(whitelistService.updateWhitelistEntry).mockResolvedValue(mockEntry);

      const store = useWhitelistStore();
      store.selectedEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;

      await store.updateWhitelistEntry("e1", { notes: "test" } as any);

      expect(store.selectedEntry).toEqual(mockEntry);
    });
  });

  describe("approveWhitelistEntry - selectedEntry branch", () => {
    it("should update selectedEntry when approve targets selected entry", async () => {
      const updatedEntry = { id: "e1", address: "ADDR1", status: "approved" } as any;
      vi.mocked(whitelistService.approveWhitelistEntry).mockResolvedValue(updatedEntry);
      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue({ total: 1 } as any);

      const store = useWhitelistStore();
      store.selectedEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;

      await store.approveWhitelistEntry({ id: "e1", approvedBy: "admin" } as any);

      expect(store.selectedEntry).toEqual(updatedEntry);
    });
  });

  describe("rejectWhitelistEntry - selectedEntry branch", () => {
    it("should update selectedEntry when reject targets selected entry", async () => {
      const updatedEntry = { id: "e1", address: "ADDR1", status: "rejected" } as any;
      vi.mocked(whitelistService.rejectWhitelistEntry).mockResolvedValue(updatedEntry);
      vi.mocked(whitelistService.getWhitelistSummary).mockResolvedValue({ total: 1 } as any);

      const store = useWhitelistStore();
      store.selectedEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;

      await store.rejectWhitelistEntry({ id: "e1", rejectedBy: "admin", reason: "invalid" } as any);

      expect(store.selectedEntry).toEqual(updatedEntry);
    });
  });

  describe("requestMoreInfo - selectedEntry branch", () => {
    it("should update selectedEntry when requestMoreInfo targets selected entry", async () => {
      const updatedEntry = { id: "e1", address: "ADDR1", status: "more_info_requested" } as any;
      vi.mocked(whitelistService.requestMoreInfo).mockResolvedValue(updatedEntry);

      const store = useWhitelistStore();
      store.selectedEntry = { id: "e1", address: "ADDR1", status: "pending" } as any;

      await store.requestMoreInfo({ id: "e1", requestedBy: "admin", message: "Need docs" } as any);

      expect(store.selectedEntry).toEqual(updatedEntry);
    });
  });

  describe("fetchWhitelistSummary - non-Error catch", () => {
    it("should set generic error when non-Error thrown in fetchWhitelistSummary", async () => {
      vi.mocked(whitelistService.getWhitelistSummary).mockRejectedValue("string error");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useWhitelistStore();
      await store.fetchWhitelistSummary();

      expect(store.error).toBe("Failed to load summary");
      consoleSpy.mockRestore();
    });
  });

  describe("updateWhitelistEntry - entries array update branch", () => {
    it("should update entries array when entry already exists in store", async () => {
      const existingEntry = {
        id: "existing-1",
        address: "ADDR_EXISTING",
        entityName: "Old Name",
        entityType: "individual" as const,
        jurisdictionCode: "US",
        riskLevel: "low" as const,
        kycStatus: "verified" as const,
        status: "approved" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedEntry = { ...existingEntry, entityName: "New Name" };

      vi.mocked(whitelistService.updateWhitelistEntry).mockResolvedValue(updatedEntry);

      const store = useWhitelistStore();
      // Directly set entries to test the update-in-array branch
      store.entries = [existingEntry] as any;

      const result = await store.updateWhitelistEntry("existing-1", { entityName: "New Name" });

      expect(result).toEqual(updatedEntry);
      // The entry should be updated in the entries array
      const found = store.entries.find((e) => e.id === "existing-1");
      expect(found?.entityName).toBe("New Name");
    });
  });

  describe("requestMoreInfo - entry found in list", () => {
    it("should update entry in entries array when entry is found", async () => {
      const store = useWhitelistStore();
      const existing = { id: "rmi-1", entityName: "Acme Corp", status: "pending" } as any;
      const updated = { ...existing, status: "more_info_requested" } as any;
      store.entries = [existing];
      vi.mocked(whitelistService.requestMoreInfo).mockResolvedValue(updated);
      const result = await store.requestMoreInfo({ id: "rmi-1", message: "Need more docs" } as any);
      expect(result).toBe(true);
      expect(store.entries[0].status).toBe("more_info_requested");
    });

    it("should handle non-Error throw in requestMoreInfo", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.requestMoreInfo).mockRejectedValue("string error");
      const result = await store.requestMoreInfo({ id: "rmi-2", message: "test" } as any);
      expect(result).toBe(false);
      expect(store.error).toBe("Failed to request info");
    });
  });

  describe("non-Error catch paths", () => {
    it("fetchWhitelistEntries sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.getWhitelistEntries).mockRejectedValue("string error");
      await store.fetchWhitelistEntries();
      expect(store.error).toBe("Failed to load whitelist entries");
    });

    it("fetchWhitelistSummary sets error.message on Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.getWhitelistSummary).mockRejectedValue(new Error("Custom summary error"));
      await store.fetchWhitelistSummary();
      expect(store.error).toBe("Custom summary error");
    });

    it("fetchWhitelistEntry sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.getWhitelistEntry).mockRejectedValue("string error");
      const result = await store.fetchWhitelistEntry("id-1");
      expect(result).toBe(null);
      expect(store.error).toBe("Failed to load entry");
    });

    it("createWhitelistEntry sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.createWhitelistEntry).mockRejectedValue("string error");
      const result = await store.createWhitelistEntry({ entityName: "Test" } as any);
      expect(result).toBe(null);
      expect(store.error).toBe("Failed to create entry");
    });

    it("approveWhitelistEntry sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.approveWhitelistEntry).mockRejectedValue("string error");
      const result = await store.approveWhitelistEntry({ id: "id-1" } as any);
      expect(result).toBe(false);
      expect(store.error).toBe("Failed to approve entry");
    });

    it("rejectWhitelistEntry sets error.message on Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.rejectWhitelistEntry).mockRejectedValue(new Error("Reject error"));
      const result = await store.rejectWhitelistEntry({ id: "id-1", reason: "test" } as any);
      expect(result).toBe(false);
      expect(store.error).toBe("Reject error");
    });

    it("rejectWhitelistEntry sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.rejectWhitelistEntry).mockRejectedValue("string error");
      const result = await store.rejectWhitelistEntry({ id: "id-1", reason: "test" } as any);
      expect(result).toBe(false);
      expect(store.error).toBe("Failed to reject entry");
    });

    it("fetchJurisdictionRules sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.getJurisdictionRules).mockRejectedValue("string error");
      await store.fetchJurisdictionRules();
      expect(store.error).toBe("Failed to load jurisdiction rules");
    });

    it("updateJurisdictionRule sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.updateJurisdictionRule).mockRejectedValue("string error");
      const result = await store.updateJurisdictionRule("rule-1", { name: "Test" });
      expect(result).toBe(null);
      expect(store.error).toBe("Failed to update jurisdiction rule");
    });

    it("deleteJurisdictionRule sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.deleteJurisdictionRule).mockRejectedValue("string error");
      const result = await store.deleteJurisdictionRule("rule-1");
      expect(result).toBe(false);
      expect(store.error).toBe("Failed to delete jurisdiction rule");
    });

    it("checkJurisdictionConflicts sets fallback error on non-Error throw", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.checkJurisdictionConflicts).mockRejectedValue("string error");
      await store.checkJurisdictionConflicts();
      expect(store.error).toBe("Failed to check conflicts");
    });

    it("updateJurisdictionRule with Error throw sets error message", async () => {
      const store = useWhitelistStore();
      vi.mocked(whitelistService.updateJurisdictionRule).mockRejectedValue(new Error("Rule error"));
      const result = await store.updateJurisdictionRule("rule-1", {});
      expect(result).toBe(null);
      expect(store.error).toBe("Rule error");
    });
  });
});
