/**
 * Whitelist and Jurisdiction Management Types
 * For MICA-compliant RWA token compliance workflows
 */

/**
 * Whitelist entry status
 */
export type WhitelistEntryStatus = 'pending' | 'approved' | 'rejected' | 'under_review' | 'expired';

/**
 * Entity type for whitelist entries
 */
export type EntityType = 'individual' | 'institutional' | 'corporate' | 'trust' | 'other';

/**
 * Risk level assessment
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * KYC verification status
 */
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';

/**
 * Accreditation status for investors
 */
export type AccreditationStatus = 'not_required' | 'pending' | 'verified' | 'rejected' | 'expired';

/**
 * Whitelist entry for approved investors
 */
export interface WhitelistEntry {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  organizationId?: string;
  organizationName?: string;
  entityType: EntityType;
  status: WhitelistEntryStatus;
  jurisdictionCode: string;
  jurisdictionName: string;
  riskLevel: RiskLevel;
  kycStatus: KycStatus;
  accreditationStatus: AccreditationStatus;
  documentationComplete: boolean;
  documentsUploaded: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  auditTrail: AuditEvent[];
}

/**
 * Audit event for whitelist entry
 */
export interface AuditEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: string;
  actorName?: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  reasonCode?: string;
}

/**
 * Audit action types
 */
export type AuditAction = 
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'under_review'
  | 'info_requested'
  | 'documentation_uploaded'
  | 'kyc_verified'
  | 'kyc_rejected'
  | 'accreditation_verified'
  | 'accreditation_rejected'
  | 'jurisdiction_changed'
  | 'risk_level_updated'
  | 'expired'
  | 'notes_added';

/**
 * Jurisdiction rule for token compliance
 */
export interface JurisdictionRule {
  id: string;
  countryCode: string;
  countryName: string;
  regionCode?: string;
  regionName?: string;
  status: 'allowed' | 'restricted' | 'blocked' | 'pending_review';
  restrictionReason?: string;
  kycRequired: boolean;
  accreditationRequired: boolean;
  additionalRequirements?: string[];
  effectiveDate: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tokenPrograms: string[];
}

/**
 * Jurisdiction conflict detected
 */
export interface JurisdictionConflict {
  entryId: string;
  entryName: string;
  jurisdictionCode: string;
  conflictType: 'restricted' | 'blocked' | 'missing_rule';
  severity: 'warning' | 'error';
  message: string;
  affectedTokenPrograms: string[];
}

/**
 * Whitelist filters
 */
export interface WhitelistFilters {
  status?: WhitelistEntryStatus[];
  entityType?: EntityType[];
  jurisdictionCode?: string[];
  riskLevel?: RiskLevel[];
  kycStatus?: KycStatus[];
  accreditationStatus?: AccreditationStatus[];
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status' | 'riskLevel';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

/**
 * Whitelist summary metrics
 */
export interface WhitelistSummary {
  totalEntries: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  underReviewCount: number;
  expiredCount: number;
  jurisdictionsCovered: number;
  highRiskCount: number;
  lastUpdated: string;
}

/**
 * Jurisdiction coverage summary
 */
export interface JurisdictionCoverage {
  totalJurisdictions: number;
  allowedJurisdictions: number;
  restrictedJurisdictions: number;
  blockedJurisdictions: number;
  pendingReviewJurisdictions: number;
  jurisdictionsList: Array<{
    code: string;
    name: string;
    status: 'allowed' | 'restricted' | 'blocked' | 'pending_review';
    entryCount: number;
  }>;
}

/**
 * CSV import validation result
 */
export interface CsvValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: CsvValidationError[];
  preview: WhitelistEntryPreview[];
}

/**
 * CSV validation error
 */
export interface CsvValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Whitelist entry preview for CSV import
 */
export interface WhitelistEntryPreview {
  row: number;
  name: string;
  email: string;
  walletAddress?: string;
  organizationName?: string;
  entityType: EntityType;
  jurisdictionCode: string;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Bulk import request
 */
export interface BulkImportRequest {
  entries: Omit<WhitelistEntry, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>[];
  skipDuplicates: boolean;
  autoApprove: boolean;
}

/**
 * Bulk import response
 */
export interface BulkImportResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: Array<{
    row: number;
    entry: any;
    error: string;
  }>;
  createdIds: string[];
}

/**
 * Whitelist entry create request
 */
export interface CreateWhitelistEntryRequest {
  name: string;
  email: string;
  walletAddress?: string;
  organizationId?: string;
  organizationName?: string;
  entityType: EntityType;
  jurisdictionCode: string;
  riskLevel?: RiskLevel;
  notes?: string;
}

/**
 * Whitelist entry update request
 */
export interface UpdateWhitelistEntryRequest {
  name?: string;
  email?: string;
  walletAddress?: string;
  organizationName?: string;
  entityType?: EntityType;
  jurisdictionCode?: string;
  riskLevel?: RiskLevel;
  notes?: string;
}

/**
 * Whitelist entry approval request
 */
export interface ApproveWhitelistEntryRequest {
  id: string;
  notes?: string;
  expiresAt?: string;
}

/**
 * Whitelist entry rejection request
 */
export interface RejectWhitelistEntryRequest {
  id: string;
  reason: string;
  notes?: string;
}

/**
 * Request more information
 */
export interface RequestMoreInfoRequest {
  id: string;
  requestedInfo: string[];
  notes?: string;
}
