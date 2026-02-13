/**
 * Whitelist and Jurisdiction Management Service
 * Provides API integration for compliance whitelist workflows
 */

import type {
  WhitelistEntry,
  WhitelistFilters,
  WhitelistSummary,
  JurisdictionRule,
  JurisdictionCoverage,
  JurisdictionConflict,
  CsvValidationResult,
  BulkImportRequest,
  BulkImportResponse,
  CreateWhitelistEntryRequest,
  UpdateWhitelistEntryRequest,
  ApproveWhitelistEntryRequest,
  RejectWhitelistEntryRequest,
  RequestMoreInfoRequest,
} from "../types/whitelist";

/**
 * Paginated response wrapper
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Mock whitelist service for development
 * TODO: Replace with actual API calls when backend endpoints are available
 */
export class WhitelistService {
  // private baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  private mockData: WhitelistEntry[] = [];
  private mockJurisdictions: JurisdictionRule[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data for development
   */
  private initializeMockData() {
    this.mockData = [
      {
        id: "1",
        name: "John Smith",
        email: "john.smith@example.com",
        walletAddress: "0x1234567890123456789012345678901234567890",
        organizationId: "ORG001",
        organizationName: "Acme Corp",
        entityType: "institutional",
        status: "approved",
        jurisdictionCode: "US",
        jurisdictionName: "United States",
        riskLevel: "low",
        kycStatus: "verified",
        accreditationStatus: "verified",
        documentationComplete: true,
        documentsUploaded: ["kyc-doc-1.pdf", "accreditation-cert.pdf"],
        notes: "Institutional investor, fully compliant",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        reviewedBy: "compliance@biatec.io",
        reviewedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        auditTrail: [
          {
            id: "audit-1",
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            action: "created",
            actor: "admin@biatec.io",
            actorName: "Admin User",
            details: "Entry created",
          },
          {
            id: "audit-2",
            timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            action: "approved",
            actor: "compliance@biatec.io",
            actorName: "Compliance Officer",
            details: "Approved after KYC verification",
          },
        ],
      },
      {
        id: "2",
        name: "Maria Garcia",
        email: "maria.garcia@example.com",
        entityType: "individual",
        status: "pending",
        jurisdictionCode: "ES",
        jurisdictionName: "Spain",
        riskLevel: "low",
        kycStatus: "pending",
        accreditationStatus: "not_required",
        documentationComplete: false,
        documentsUploaded: [],
        notes: "Awaiting KYC verification",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        auditTrail: [
          {
            id: "audit-3",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            action: "created",
            actor: "admin@biatec.io",
            actorName: "Admin User",
            details: "Entry created",
          },
        ],
      },
      {
        id: "3",
        name: "BlockChain Investments Ltd",
        email: "contact@blockchain-inv.com",
        walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        organizationId: "ORG002",
        organizationName: "BlockChain Investments Ltd",
        entityType: "corporate",
        status: "rejected",
        jurisdictionCode: "CN",
        jurisdictionName: "China",
        riskLevel: "high",
        kycStatus: "rejected",
        accreditationStatus: "rejected",
        documentationComplete: false,
        documentsUploaded: [],
        notes: "Rejected due to jurisdiction restrictions",
        rejectionReason: "Jurisdiction blocked for token issuance",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        reviewedBy: "compliance@biatec.io",
        reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        auditTrail: [
          {
            id: "audit-4",
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            action: "created",
            actor: "admin@biatec.io",
            actorName: "Admin User",
            details: "Entry created",
          },
          {
            id: "audit-5",
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            action: "rejected",
            actor: "compliance@biatec.io",
            actorName: "Compliance Officer",
            details: "Rejected due to jurisdiction restrictions",
            reasonCode: "JURISDICTION_BLOCKED",
          },
        ],
      },
    ];

    this.mockJurisdictions = [
      {
        id: "jur-1",
        countryCode: "US",
        countryName: "United States",
        status: "allowed",
        kycRequired: true,
        accreditationRequired: true,
        additionalRequirements: ["SEC accredited investor status"],
        effectiveDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Full compliance with SEC regulations required",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        tokenPrograms: ["TOKEN-001", "TOKEN-002"],
      },
      {
        id: "jur-2",
        countryCode: "ES",
        countryName: "Spain",
        status: "allowed",
        kycRequired: true,
        accreditationRequired: false,
        effectiveDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "EU MICA compliance",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        tokenPrograms: ["TOKEN-001"],
      },
      {
        id: "jur-3",
        countryCode: "CN",
        countryName: "China",
        status: "blocked",
        restrictionReason: "Token issuance prohibited by local regulations",
        kycRequired: false,
        accreditationRequired: false,
        effectiveDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Blocked due to regulatory restrictions",
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin@biatec.io",
        tokenPrograms: [],
      },
    ];
  }

  /**
   * Simulate API delay
   */
  private async simulateDelay(ms = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get whitelist entries with filtering and pagination
   */
  async getWhitelistEntries(filters?: WhitelistFilters): Promise<PaginatedResponse<WhitelistEntry>> {
    await this.simulateDelay();

    let filtered = [...this.mockData];

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter((entry) => filters.status!.includes(entry.status));
    }
    if (filters?.entityType && filters.entityType.length > 0) {
      filtered = filtered.filter((entry) => filters.entityType!.includes(entry.entityType));
    }
    if (filters?.jurisdictionCode && filters.jurisdictionCode.length > 0) {
      filtered = filtered.filter((entry) => filters.jurisdictionCode!.includes(entry.jurisdictionCode));
    }
    if (filters?.riskLevel && filters.riskLevel.length > 0) {
      filtered = filtered.filter((entry) => filters.riskLevel!.includes(entry.riskLevel));
    }
    if (filters?.kycStatus && filters.kycStatus.length > 0) {
      filtered = filtered.filter((entry) => filters.kycStatus!.includes(entry.kycStatus));
    }
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => entry.name.toLowerCase().includes(query) || entry.email.toLowerCase().includes(query) || entry.organizationName?.toLowerCase().includes(query));
    }

    // Apply sorting
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });
    }

    // Apply pagination
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = filtered.slice(start, end);

    return {
      data: paginated,
      total: filtered.length,
      page,
      perPage,
      totalPages: Math.ceil(filtered.length / perPage),
    };
  }

  /**
   * Get whitelist summary metrics
   */
  async getWhitelistSummary(): Promise<WhitelistSummary> {
    await this.simulateDelay(300);

    const statusCounts = this.mockData.reduce(
      (acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const jurisdictions = new Set(this.mockData.map((entry) => entry.jurisdictionCode));
    const highRiskCount = this.mockData.filter((entry) => entry.riskLevel === "high" || entry.riskLevel === "critical").length;

    return {
      totalEntries: this.mockData.length,
      approvedCount: statusCounts.approved || 0,
      pendingCount: statusCounts.pending || 0,
      rejectedCount: statusCounts.rejected || 0,
      underReviewCount: statusCounts.under_review || 0,
      expiredCount: statusCounts.expired || 0,
      jurisdictionsCovered: jurisdictions.size,
      highRiskCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get single whitelist entry by ID
   */
  async getWhitelistEntry(id: string): Promise<WhitelistEntry | null> {
    await this.simulateDelay(300);
    return this.mockData.find((entry) => entry.id === id) || null;
  }

  /**
   * Create new whitelist entry
   */
  async createWhitelistEntry(request: CreateWhitelistEntryRequest): Promise<WhitelistEntry> {
    await this.simulateDelay();

    const newEntry: WhitelistEntry = {
      id: `entry-${Date.now()}`,
      ...request,
      status: "pending",
      riskLevel: request.riskLevel || "low",
      kycStatus: "not_started",
      accreditationStatus: "not_required",
      documentationComplete: false,
      documentsUploaded: [],
      jurisdictionName: this.getJurisdictionName(request.jurisdictionCode),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user@example.com",
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "created",
          actor: "current-user@example.com",
          actorName: "Current User",
          details: "Entry created",
        },
      ],
    };

    this.mockData.push(newEntry);
    return newEntry;
  }

  /**
   * Update whitelist entry
   */
  async updateWhitelistEntry(id: string, request: UpdateWhitelistEntryRequest): Promise<WhitelistEntry | null> {
    await this.simulateDelay();

    const entry = this.mockData.find((e) => e.id === id);
    if (!entry) {
      return null;
    }

    Object.assign(entry, request);
    entry.updatedAt = new Date().toISOString();
    if (request.jurisdictionCode) {
      entry.jurisdictionName = this.getJurisdictionName(request.jurisdictionCode);
    }

    entry.auditTrail.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "updated",
      actor: "current-user@example.com",
      actorName: "Current User",
      details: "Entry updated",
    });

    return entry;
  }

  /**
   * Approve whitelist entry
   */
  async approveWhitelistEntry(request: ApproveWhitelistEntryRequest): Promise<WhitelistEntry | null> {
    await this.simulateDelay();

    const entry = this.mockData.find((e) => e.id === request.id);
    if (!entry) {
      return null;
    }

    entry.status = "approved";
    entry.reviewedBy = "current-user@example.com";
    entry.reviewedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    if (request.notes) {
      entry.notes = request.notes;
    }
    if (request.expiresAt) {
      entry.expiresAt = request.expiresAt;
    }

    entry.auditTrail.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "approved",
      actor: "current-user@example.com",
      actorName: "Current User",
      details: request.notes || "Entry approved",
    });

    return entry;
  }

  /**
   * Reject whitelist entry
   */
  async rejectWhitelistEntry(request: RejectWhitelistEntryRequest): Promise<WhitelistEntry | null> {
    await this.simulateDelay();

    const entry = this.mockData.find((e) => e.id === request.id);
    if (!entry) {
      return null;
    }

    entry.status = "rejected";
    entry.rejectionReason = request.reason;
    entry.reviewedBy = "current-user@example.com";
    entry.reviewedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    if (request.notes) {
      entry.notes = request.notes;
    }

    entry.auditTrail.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "rejected",
      actor: "current-user@example.com",
      actorName: "Current User",
      details: request.reason,
      reasonCode: "REJECTED_BY_REVIEWER",
    });

    return entry;
  }

  /**
   * Request more information
   */
  async requestMoreInfo(request: RequestMoreInfoRequest): Promise<WhitelistEntry> {
    await this.simulateDelay();

    const entry = this.mockData.find((e) => e.id === request.id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    entry.status = "under_review";
    entry.updatedAt = new Date().toISOString();
    if (request.notes) {
      entry.notes = request.notes;
    }

    entry.auditTrail.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "info_requested",
      actor: "current-user@example.com",
      actorName: "Current User",
      details: `Requested: ${request.requestedInfo.join(", ")}`,
    });

    return entry;
  }

  /**
   * Validate CSV file
   */
  async validateCsv(_file: File): Promise<CsvValidationResult> {
    await this.simulateDelay();

    // Mock validation - in real implementation, parse and validate CSV
    return {
      valid: true,
      totalRows: 5,
      validRows: 4,
      errorRows: 1,
      errors: [
        {
          row: 3,
          field: "email",
          value: "invalid-email",
          message: "Invalid email format",
          severity: "error",
        },
      ],
      preview: [
        {
          row: 1,
          name: "Test User 1",
          email: "test1@example.com",
          entityType: "individual",
          jurisdictionCode: "US",
          hasErrors: false,
          errors: [],
          warnings: [],
        },
        {
          row: 2,
          name: "Test User 2",
          email: "test2@example.com",
          entityType: "corporate",
          jurisdictionCode: "GB",
          hasErrors: false,
          errors: [],
          warnings: [],
        },
      ],
    };
  }

  /**
   * Bulk import whitelist entries
   */
  async bulkImport(request: BulkImportRequest): Promise<BulkImportResponse> {
    await this.simulateDelay(1000);

    const createdIds: string[] = [];
    const errors: Array<{ row: number; entry: any; error: string }> = [];
    let successCount = 0;
    let skippedCount = 0;

    request.entries.forEach((entry, index) => {
      try {
        // Check for duplicates
        const existing = this.mockData.find((e) => e.email === entry.email);
        if (existing) {
          if (request.skipDuplicates) {
            skippedCount++;
            return;
          } else {
            throw new Error("Duplicate email found");
          }
        }

        // Create entry
        const newEntry: WhitelistEntry = {
          id: `entry-${Date.now()}-${index}`,
          ...entry,
          status: request.autoApprove ? "approved" : "pending",
          kycStatus: entry.kycStatus || "not_started",
          accreditationStatus: entry.accreditationStatus || "not_required",
          documentationComplete: entry.documentationComplete || false,
          documentsUploaded: entry.documentsUploaded || [],
          jurisdictionName: this.getJurisdictionName(entry.jurisdictionCode),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "current-user@example.com",
          auditTrail: [
            {
              id: `audit-${Date.now()}-${index}`,
              timestamp: new Date().toISOString(),
              action: "created",
              actor: "current-user@example.com",
              actorName: "Current User",
              details: "Created via bulk import",
            },
          ],
        };

        this.mockData.push(newEntry);
        createdIds.push(newEntry.id);
        successCount++;
      } catch (error) {
        errors.push({
          row: index + 1,
          entry,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: request.entries.length,
      successCount,
      failureCount: errors.length,
      skippedCount,
      errors,
      createdIds,
    };
  }

  /**
   * Get jurisdiction rules
   */
  async getJurisdictionRules(): Promise<JurisdictionRule[]> {
    await this.simulateDelay(300);
    return [...this.mockJurisdictions];
  }

  /**
   * Get jurisdiction coverage
   */
  async getJurisdictionCoverage(): Promise<JurisdictionCoverage> {
    await this.simulateDelay(300);

    const statusCounts = this.mockJurisdictions.reduce(
      (acc, rule) => {
        acc[rule.status] = (acc[rule.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const jurisdictionsList = this.mockJurisdictions.map((rule) => ({
      code: rule.countryCode,
      name: rule.countryName,
      status: rule.status,
      entryCount: this.mockData.filter((e) => e.jurisdictionCode === rule.countryCode).length,
    }));

    return {
      totalJurisdictions: this.mockJurisdictions.length,
      allowedJurisdictions: statusCounts.allowed || 0,
      restrictedJurisdictions: statusCounts.restricted || 0,
      blockedJurisdictions: statusCounts.blocked || 0,
      pendingReviewJurisdictions: statusCounts.pending_review || 0,
      jurisdictionsList,
    };
  }

  /**
   * Create jurisdiction rule
   */
  async createJurisdictionRule(rule: Omit<JurisdictionRule, "id" | "createdAt" | "updatedAt">): Promise<JurisdictionRule> {
    await this.simulateDelay();

    const newRule: JurisdictionRule = {
      ...rule,
      id: `jur-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockJurisdictions.push(newRule);
    return newRule;
  }

  /**
   * Update jurisdiction rule
   */
  async updateJurisdictionRule(id: string, updates: Partial<JurisdictionRule>): Promise<JurisdictionRule> {
    await this.simulateDelay();

    const rule = this.mockJurisdictions.find((r) => r.id === id);
    if (!rule) {
      throw new Error("Jurisdiction rule not found");
    }

    Object.assign(rule, updates);
    rule.updatedAt = new Date().toISOString();

    return rule;
  }

  /**
   * Delete jurisdiction rule
   */
  async deleteJurisdictionRule(id: string): Promise<void> {
    await this.simulateDelay();

    const index = this.mockJurisdictions.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Jurisdiction rule not found");
    }

    this.mockJurisdictions.splice(index, 1);
  }

  /**
   * Check for jurisdiction conflicts
   */
  async checkJurisdictionConflicts(_tokenProgramId?: string): Promise<JurisdictionConflict[]> {
    await this.simulateDelay(300);

    const conflicts: JurisdictionConflict[] = [];

    this.mockData.forEach((entry) => {
      const rule = this.mockJurisdictions.find((r) => r.countryCode === entry.jurisdictionCode);

      if (!rule) {
        conflicts.push({
          entryId: entry.id,
          entryName: entry.name,
          jurisdictionCode: entry.jurisdictionCode,
          conflictType: "missing_rule",
          severity: "warning",
          message: "No jurisdiction rule defined for this country",
          affectedTokenPrograms: [],
        });
      } else if (rule.status === "blocked") {
        conflicts.push({
          entryId: entry.id,
          entryName: entry.name,
          jurisdictionCode: entry.jurisdictionCode,
          conflictType: "blocked",
          severity: "error",
          message: `Jurisdiction blocked: ${rule.restrictionReason || "Not allowed"}`,
          affectedTokenPrograms: [],
        });
      } else if (rule.status === "restricted") {
        conflicts.push({
          entryId: entry.id,
          entryName: entry.name,
          jurisdictionCode: entry.jurisdictionCode,
          conflictType: "restricted",
          severity: "warning",
          message: `Jurisdiction restricted: ${rule.restrictionReason || "Additional requirements needed"}`,
          affectedTokenPrograms: rule.tokenPrograms,
        });
      }
    });

    return conflicts;
  }

  /**
   * Helper: Get jurisdiction name from code
   */
  private getJurisdictionName(code: string): string {
    const jurisdictionNames: Record<string, string> = {
      US: "United States",
      GB: "United Kingdom",
      ES: "Spain",
      FR: "France",
      DE: "Germany",
      CN: "China",
      JP: "Japan",
      AU: "Australia",
      CA: "Canada",
    };
    return jurisdictionNames[code] || code;
  }
}

export const whitelistService = new WhitelistService();
