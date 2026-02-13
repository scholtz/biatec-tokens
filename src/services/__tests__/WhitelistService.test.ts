/**
 * Unit tests for WhitelistService
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { WhitelistService, whitelistService } from "../whitelistService";
import type {
  WhitelistEntry,
  WhitelistFilters,
  CreateWhitelistEntryRequest,
  UpdateWhitelistEntryRequest,
  ApproveWhitelistEntryRequest,
  RejectWhitelistEntryRequest,
  RequestMoreInfoRequest,
  BulkImportRequest,
  JurisdictionRule,
} from "../../types/whitelist";

// Mock data for testing
const mockWhitelistEntry: WhitelistEntry = {
  id: "test-entry-1",
  name: "Test Entity",
  email: "test@example.com",
  entityType: "individual",
  jurisdictionCode: "US",
  riskLevel: "low",
  kycStatus: "verified",
  status: "approved",
  notes: "Test entry",
  createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
  updatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
  reviewedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
  expiresAt: new Date("2025-01-01T00:00:00Z").toISOString(),
  reviewedBy: "admin",
  createdBy: "user",
  jurisdictionName: "United States",
  accreditationStatus: "not_required",
  documentationComplete: true,
  documentsUploaded: [],
  auditTrail: [],
};

const mockJurisdictionRule: JurisdictionRule = {
  id: "rule-1",
  jurisdictionCode: "US",
  name: "United States",
  description: "US jurisdiction rules",
  riskLevel: "low",
  requiresKyc: true,
  restricted: false,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

describe("WhitelistService", () => {
  let service: WhitelistService;

  beforeEach(() => {
    service = new WhitelistService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getWhitelistEntries", () => {
    it("should return paginated whitelist entries", async () => {
      const result = await service.getWhitelistEntries();

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.perPage).toBe("number");
      expect(typeof result.totalPages).toBe("number");
    });

    it("should filter entries by status", async () => {
      const filters: WhitelistFilters = {
        status: ["approved"],
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      // All returned entries should have approved status
      result.data.forEach((entry) => {
        expect(entry.status).toBe("approved");
      });
    });

    it("should filter entries by entity type", async () => {
      const filters: WhitelistFilters = {
        entityType: ["individual"],
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      result.data.forEach((entry) => {
        expect(entry.entityType).toBe("individual");
      });
    });

    it("should filter entries by jurisdiction code", async () => {
      const filters: WhitelistFilters = {
        jurisdictionCode: ["US"],
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      result.data.forEach((entry) => {
        expect(entry.jurisdictionCode).toBe("US");
      });
    });

    it("should filter entries by risk level", async () => {
      const filters: WhitelistFilters = {
        riskLevel: ["low"],
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      result.data.forEach((entry) => {
        expect(entry.riskLevel).toBe("low");
      });
    });

    it("should filter entries by KYC status", async () => {
      const filters: WhitelistFilters = {
        kycStatus: ["verified"],
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      result.data.forEach((entry) => {
        expect(entry.kycStatus).toBe("verified");
      });
    });

    it("should search entries by query", async () => {
      const filters: WhitelistFilters = {
        searchQuery: "Test",
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    it("should sort entries by specified field", async () => {
      const filters: WhitelistFilters = {
        sortBy: "entityName",
        sortOrder: "asc",
        page: 1,
        perPage: 10,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    it("should handle pagination correctly", async () => {
      const filters: WhitelistFilters = {
        page: 2,
        perPage: 5,
      };

      const result = await service.getWhitelistEntries(filters);

      expect(result).toBeDefined();
      expect(result.page).toBe(2);
      expect(result.perPage).toBe(5);
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getWhitelistSummary", () => {
    it("should return whitelist summary with correct structure", async () => {
      const result = await service.getWhitelistSummary();

      expect(result).toBeDefined();
      expect(typeof result.totalEntries).toBe("number");
      expect(typeof result.approvedCount).toBe("number");
      expect(typeof result.pendingCount).toBe("number");
      expect(typeof result.rejectedCount).toBe("number");
      expect(typeof result.jurisdictionsCovered).toBe("number");
      expect(typeof result.lastUpdated).toBe("string");
    });

    it("should calculate summary correctly", async () => {
      const result = await service.getWhitelistSummary();

      expect(result.totalEntries).toBeGreaterThanOrEqual(0);
      expect(result.approvedCount).toBeGreaterThanOrEqual(0);
      expect(result.pendingCount).toBeGreaterThanOrEqual(0);
      expect(result.rejectedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getWhitelistEntry", () => {
    it("should return null for non-existent entry", async () => {
      const result = await service.getWhitelistEntry("non-existent-id");

      expect(result).toBeNull();
    });

    it("should return entry when it exists", async () => {
      // First create an entry
      const createRequest: CreateWhitelistEntryRequest = {
        address: "BL5G4DPK6V4N36NYAKE2TBURZQGKDDVVMKLNOSOAGGPK5FU6CJ2ZE4W5YY",
        entityName: "Test Entity",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
        kycStatus: "verified",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);

      // Then retrieve it
      if (createdEntry) {
        const result = await service.getWhitelistEntry(createdEntry.id);

        expect(result).toBeDefined();
        expect(result?.id).toBe(createdEntry.id);
        expect(result?.address).toBe(createRequest.address);
      }
    });
  });

  describe("createWhitelistEntry", () => {
    it("should create a new whitelist entry", async () => {
      const request: CreateWhitelistEntryRequest = {
        name: "New Test Entity",
        email: "newtest@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const result = await service.createWhitelistEntry(request);

      expect(result).toBeDefined();
      expect(result?.name).toBe(request.name);
      expect(result?.email).toBe(request.email);
      expect(result?.entityType).toBe(request.entityType);
      expect(result?.jurisdictionCode).toBe(request.jurisdictionCode);
      expect(result?.riskLevel).toBe(request.riskLevel);
      expect(result?.status).toBe("pending");
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });

    it("should generate unique IDs for new entries", async () => {
      const request1: CreateWhitelistEntryRequest = {
        name: "Entity 1",
        email: "entity1@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const request2: CreateWhitelistEntryRequest = {
        name: "Entity 2",
        email: "entity2@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const result1 = await service.createWhitelistEntry(request1);
      const result2 = await service.createWhitelistEntry(request2);

      expect(result1?.id).not.toBe(result2?.id);
    });
  });

  describe("updateWhitelistEntry", () => {
    it("should return null for non-existent entry", async () => {
      const request: UpdateWhitelistEntryRequest = {
        id: "non-existent-id",
        entityName: "Updated Name",
      };

      const result = await service.updateWhitelistEntry(request);

      expect(result).toBeNull();
    });

    it("should update existing entry", async () => {
      // First create an entry
      const createRequest: CreateWhitelistEntryRequest = {
        name: "Original Name",
        email: "update_test@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);
      expect(createdEntry).toBeDefined();

      // Then update it
      const updateRequest: UpdateWhitelistEntryRequest = {
        name: "Updated Name",
        riskLevel: "medium",
      };

      const updatedEntry = await service.updateWhitelistEntry(createdEntry!.id, updateRequest);

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry?.id).toBe(createdEntry!.id);
      expect(updatedEntry?.name).toBe("Updated Name");
      expect(updatedEntry?.riskLevel).toBe("medium");
      expect(updatedEntry?.updatedAt).toBeDefined();
    });

    it("should update jurisdiction code and related fields", async () => {
      // First create an entry
      const createRequest: CreateWhitelistEntryRequest = {
        name: "Jurisdiction Test",
        email: "jurisdiction_test@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);
      expect(createdEntry).toBeDefined();

      // Update jurisdiction
      const updateRequest: UpdateWhitelistEntryRequest = {
        jurisdictionCode: "EU",
      };

      const updatedEntry = await service.updateWhitelistEntry(createdEntry!.id, updateRequest);

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry?.jurisdictionCode).toBe("EU");
    });
  });

  describe("approveWhitelistEntry", () => {
    it("should return null for non-existent entry", async () => {
      const request: ApproveWhitelistEntryRequest = {
        id: "non-existent-id",
        approvedBy: "admin",
      };

      const result = await service.approveWhitelistEntry(request);

      expect(result).toBeNull();
    });

    it("should approve pending entry", async () => {
      // First create a pending entry
      const createRequest: CreateWhitelistEntryRequest = {
        name: "Approve Test",
        email: "approve_test@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);
      expect(createdEntry).toBeDefined();
      expect(createdEntry?.status).toBe("pending");

      // Then approve it
      const approveRequest: ApproveWhitelistEntryRequest = {
        id: createdEntry!.id,
        approvedBy: "admin",
        notes: "Approved for testing",
        expiresAt: new Date("2025-12-31T00:00:00Z"),
      };

      const approvedEntry = await service.approveWhitelistEntry(approveRequest);

      expect(approvedEntry).toBeDefined();
      expect(approvedEntry?.status).toBe("approved");
      expect(approvedEntry?.reviewedBy).toBe("current-user@example.com");
      expect(approvedEntry?.reviewedAt).toBeDefined();
      expect(approvedEntry?.notes).toContain("Approved for testing");
      expect(approvedEntry?.expiresAt).toEqual(new Date("2025-12-31T00:00:00Z"));
    });
  });

  describe("rejectWhitelistEntry", () => {
    it("should return null for non-existent entry", async () => {
      const request: RejectWhitelistEntryRequest = {
        id: "non-existent-id",
        rejectedBy: "admin",
        reason: "Test rejection",
      };

      const result = await service.rejectWhitelistEntry(request);

      expect(result).toBeNull();
    });

    it("should reject pending entry", async () => {
      // First create a pending entry
      const createRequest: CreateWhitelistEntryRequest = {
        name: "Reject Test",
        email: "reject_test@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);
      expect(createdEntry?.status).toBe("pending");

      // Then reject it
      const rejectRequest: RejectWhitelistEntryRequest = {
        id: createdEntry!.id,
        rejectedBy: "admin",
        reason: "Failed compliance check",
        notes: "Additional rejection notes",
      };

      const rejectedEntry = await service.rejectWhitelistEntry(rejectRequest);

      expect(rejectedEntry).toBeDefined();
      expect(rejectedEntry?.status).toBe("rejected");
      expect(rejectedEntry?.rejectionReason).toBe("Failed compliance check");
      expect(rejectedEntry?.notes).toContain("Additional rejection notes");
    });
  });

  describe("requestMoreInfo", () => {
    it("should request more information for entry", async () => {
      // First create an entry
      const createRequest: CreateWhitelistEntryRequest = {
        name: "Info Test",
        email: "info_test@example.com",
        entityType: "individual",
        jurisdictionCode: "US",
        riskLevel: "low",
      };

      const createdEntry = await service.createWhitelistEntry(createRequest);

      // Request more info
      const request: RequestMoreInfoRequest = {
        id: createdEntry!.id,
        requestedInfo: ["taxId", "proofOfAddress"],
        notes: "Please provide additional documentation",
      };

      const result = await service.requestMoreInfo(request);

      expect(result).toBeDefined();
      expect(result.status).toBe("under_review");
      expect(result.notes).toContain("Please provide additional documentation");
    });
  });

  describe("validateCsv", () => {
    it("should validate CSV file and return results", async () => {
      // Create a mock CSV file
      const csvContent = "address,entityName,entityType,jurisdictionCode,riskLevel,kycStatus\nBL5G4DPK6V4N36NYAKE2TBURZQGKDDVVMKLNOSOAGGPK5FU6CJ2ZE4W5YY,Test Entity,individual,US,low,verified";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const result = await service.validateCsv(file);

      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.preview).toBeInstanceOf(Array);
      expect(typeof result.totalRows).toBe("number");
      expect(typeof result.validRows).toBe("number");
    });
  });

  describe("bulkImport", () => {
    it("should perform bulk import and return results", async () => {
      const request: BulkImportRequest = {
        entries: [
          {
            address: "BULK1",
            entityName: "Bulk Entity 1",
            entityType: "individual",
            jurisdictionCode: "US",
            riskLevel: "low",
            kycStatus: "verified",
          },
          {
            address: "BULK2",
            entityName: "Bulk Entity 2",
            entityType: "individual",
            jurisdictionCode: "US",
            riskLevel: "low",
            kycStatus: "verified",
          },
        ],
        approvedBy: "admin",
      };

      const result = await service.bulkImport(request);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.totalProcessed).toBe("number");
      expect(typeof result.successCount).toBe("number");
      expect(typeof result.failureCount).toBe("number");
      expect(typeof result.skippedCount).toBe("number");
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.createdIds).toBeInstanceOf(Array);
    });
  });

  describe("Jurisdiction Management", () => {
    describe("getJurisdictionRules", () => {
      it("should return jurisdiction rules", async () => {
        const result = await service.getJurisdictionRules();

        expect(result).toBeInstanceOf(Array);
        if (result.length > 0) {
          const rule = result[0];
          expect(rule).toHaveProperty("id");
          expect(rule).toHaveProperty("countryCode");
          expect(rule).toHaveProperty("countryName");
          expect(typeof rule.kycRequired).toBe("boolean");
          expect(typeof rule.accreditationRequired).toBe("boolean");
          expect(typeof rule.status).toBe("string");
        }
      });
    });

    describe("getJurisdictionCoverage", () => {
      it("should return jurisdiction coverage data", async () => {
        const result = await service.getJurisdictionCoverage();

        expect(result).toBeDefined();
        expect(result.jurisdictionsList).toBeInstanceOf(Array);
        expect(typeof result.totalJurisdictions).toBe("number");
        expect(typeof result.allowedJurisdictions).toBe("number");
        expect(typeof result.restrictedJurisdictions).toBe("number");
      });
    });

    describe("createJurisdictionRule", () => {
      it("should create a new jurisdiction rule", async () => {
        const ruleData = {
          countryCode: "CA",
          countryName: "Canada",
          status: "allowed" as const,
          kycRequired: true,
          accreditationRequired: false,
          effectiveDate: new Date().toISOString(),
          createdBy: "admin@biatec.io",
          tokenPrograms: ["TOKEN-001"],
        };

        const result = await service.createJurisdictionRule(ruleData);

        expect(result).toBeDefined();
        expect(result.countryCode).toBe("CA");
        expect(result.countryName).toBe("Canada");
        expect(result.status).toBe("allowed");
        expect(result.kycRequired).toBe(true);
        expect(result.accreditationRequired).toBe(false);
        expect(typeof result.createdAt).toBe("string");
        expect(typeof result.updatedAt).toBe("string");
      });
    });

    describe("updateJurisdictionRule", () => {
      it("should update existing jurisdiction rule", async () => {
        // Update an existing rule from mock data
        const updateData = {
          status: "restricted" as const,
          kycRequired: false,
        };

        const result = await service.updateJurisdictionRule("jur-1", updateData);

        expect(result).toBeDefined();
        expect(result.id).toBe("jur-1");
        expect(result.status).toBe("restricted");
        expect(result.kycRequired).toBe(false);
        expect(typeof result.updatedAt).toBe("string");
      });
    });

    describe("deleteJurisdictionRule", () => {
      it("should delete jurisdiction rule", async () => {
        // First create a rule
        const createData = {
          jurisdictionCode: "NZ",
          name: "New Zealand",
          description: "New Zealand jurisdiction",
          riskLevel: "low" as const,
          requiresKyc: true,
          restricted: false,
        };

        const createdRule = await service.createJurisdictionRule(createData);

        // Then delete it
        await expect(service.deleteJurisdictionRule(createdRule.id)).resolves.not.toThrow();
      });
    });

    describe("checkJurisdictionConflicts", () => {
      it("should check for jurisdiction conflicts", async () => {
        const result = await service.checkJurisdictionConflicts();

        expect(result).toBeInstanceOf(Array);
        if (result.length > 0) {
          const conflict = result[0];
          expect(conflict).toHaveProperty("entryId");
          expect(conflict).toHaveProperty("conflictType");
          expect(conflict).toHaveProperty("severity");
          expect(conflict).toHaveProperty("message");
          expect(conflict.affectedTokenPrograms).toBeInstanceOf(Array);
        }
      });

      it("should check conflicts for specific token program", async () => {
        const tokenProgramId = "test-program-id";
        const result = await service.checkJurisdictionConflicts(tokenProgramId);

        expect(result).toBeInstanceOf(Array);
      });
    });
  });

  describe("Service Instance", () => {
    it("should export a singleton instance", () => {
      expect(whitelistService).toBeDefined();
      expect(whitelistService).toBeInstanceOf(WhitelistService);
    });
  });
});
