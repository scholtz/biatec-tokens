/**
 * Compliance-related type definitions for RWA tokens
 * Supports MICA-aligned compliance workflows
 */

/**
 * Network types supported by the platform
 */
export type Network = 'VOI' | 'Aramid';

/**
 * Transfer validation request
 */
export interface TransferValidationRequest {
  tokenId: string;
  network: Network;
  sender: string;
  receiver: string;
  amount?: string;
}

/**
 * Transfer validation response
 */
export interface TransferValidationResponse {
  allowed: boolean;
  reasons: string[];
  senderStatus: WhitelistStatus;
  receiverStatus: WhitelistStatus;
  timestamp: string;
  details?: {
    senderCompliant: boolean;
    receiverCompliant: boolean;
    jurisdictionCheck?: boolean;
    sanctionsCheck?: boolean;
    additionalInfo?: string;
  };
}

/**
 * Whitelist status for an address
 */
export interface WhitelistStatus {
  address: string;
  whitelisted: boolean;
  status: 'active' | 'pending' | 'removed' | 'not_listed' | 'expired' | 'denied';
  kycVerified?: boolean;
  jurisdictionAllowed?: boolean;
  sanctioned?: boolean;
  notes?: string;
  expirationDate?: string; // ISO 8601 date for expired status
  denialReason?: string; // Reason for denied status
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  tokenId: string;
  network: Network;
  actor: string;
  target?: string;
  details: Record<string, any>;
  result: 'success' | 'failure';
  reason?: string;
}

/**
 * Audit actions tracked in the system
 */
export enum AuditAction {
  WHITELIST_ADD = 'whitelist_add',
  WHITELIST_REMOVE = 'whitelist_remove',
  WHITELIST_BULK_UPLOAD = 'whitelist_bulk_upload',
  TRANSFER_VALIDATION = 'transfer_validation',
  TRANSFER_EXECUTED = 'transfer_executed',
  TRANSFER_BLOCKED = 'transfer_blocked',
  COMPLIANCE_REVIEW = 'compliance_review',
  KYC_VERIFICATION = 'kyc_verification',
}

/**
 * Audit log filter options
 */
export interface AuditLogFilters {
  tokenId?: string;
  network?: Network;
  action?: AuditAction;
  actor?: string;
  startDate?: string;
  endDate?: string;
  result?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

/**
 * Paginated audit log response
 */
export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Compliance status for a token
 */
export interface ComplianceStatus {
  tokenId: string;
  network: Network;
  whitelistEnabled: boolean;
  whitelistCount: number;
  lastAuditTimestamp?: string;
  complianceScore?: number;
  issues?: ComplianceIssue[];
}

/**
 * Compliance issue detected in the system
 */
export interface ComplianceIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'kyc' | 'jurisdiction' | 'sanctions' | 'other';
  message: string;
  affectedAddresses?: string[];
  timestamp: string;
}

/**
 * Token supply metrics for MICA compliance reporting
 */
export interface TokenSupplyMetrics {
  totalSupply: string;
  circulatingSupply: string;
  reserveSupply?: string;
  burnedSupply?: string;
  lastUpdated: string;
}

/**
 * Holder distribution metrics for MICA compliance reporting
 */
export interface HolderDistributionMetrics {
  totalHolders: number;
  top10Concentration: number; // Percentage held by top 10 holders
  top50Concentration: number; // Percentage held by top 50 holders
  averageHolding: string;
  medianHolding: string;
  lastUpdated: string;
}

/**
 * Transfer activity for RWA tokens
 */
export interface TransferActivity {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed' | 'blocked';
  transactionId?: string;
  reason?: string;
}

/**
 * RWA transfer activity metrics for MICA compliance
 */
export interface RwaTransferActivityMetrics {
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  recentTransfers: TransferActivity[];
  totalVolume24h: string;
  averageTransferSize: string;
  lastUpdated: string;
}

/**
 * Comprehensive MICA compliance metrics
 */
export interface MicaComplianceMetrics {
  tokenId: string;
  network: Network;
  tokenSupply: TokenSupplyMetrics;
  holderDistribution: HolderDistributionMetrics;
  whitelistStatus: {
    enabled: boolean;
    totalWhitelisted: number;
    pendingApprovals: number;
    recentlyAdded: number;
  };
  transferActivity: RwaTransferActivityMetrics;
  lastUpdated: string;
}

/**
 * Wallet attestation types for compliance verification
 */
export enum AttestationType {
  KYC_AML = 'kyc_aml',
  ACCREDITED_INVESTOR = 'accredited_investor',
  JURISDICTION = 'jurisdiction',
  ISSUER_VERIFICATION = 'issuer_verification',
  OTHER = 'other',
}

/**
 * Wallet attestation for compliance checks
 */
export interface WalletAttestation {
  id: string;
  type: AttestationType;
  proofHash?: string;
  documentUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  expiresAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Token attestation metadata for audit trail
 */
export interface TokenAttestationMetadata {
  enabled: boolean;
  attestations: WalletAttestation[];
  createdAt: string;
  updatedAt: string;
  complianceSummary?: {
    kycCompliant: boolean;
    accreditedInvestor: boolean;
    jurisdictionApproved: boolean;
    overallStatus: 'compliant' | 'partial' | 'non_compliant';
  };
}

/**
 * Attestation package signature metadata
 */
export interface AttestationSignatureMetadata {
  algorithm: string; // e.g., 'SHA-256'
  hash: string; // Hash of the attestation content
  timestamp: string; // ISO 8601 timestamp
  signedBy: string; // Wallet address or identifier
  version: string; // Attestation format version
}

/**
 * Issuer credentials for attestation
 */
export interface IssuerCredentials {
  name: string;
  registrationNumber?: string;
  jurisdiction: string;
  regulatoryLicense?: string;
  contactEmail?: string;
  walletAddress: string;
}

/**
 * Attestation export request
 */
export interface AttestationExportRequest {
  tokenId: string;
  network: Network;
  issuerCredentials: IssuerCredentials;
  includeWhitelistPolicy: boolean;
  includeComplianceStatus: boolean;
  format: 'pdf' | 'json' | 'both';
}

/**
 * Attestation package for MICA audit compliance
 */
export interface AttestationPackage {
  id: string;
  version: string; // Format version
  generatedAt: string; // ISO 8601 timestamp
  tokenId: string;
  network: Network;
  issuerCredentials: IssuerCredentials;
  complianceStatus?: ComplianceStatus;
  whitelistPolicy?: {
    enabled: boolean;
    whitelistedCount: number;
    kycRequired: boolean;
    jurisdictionRestrictions: string[];
  };
  attestationMetadata: {
    purpose: 'MICA_AUDIT' | 'REGULATORY_SUBMISSION' | 'INTERNAL_AUDIT';
    validUntil?: string;
    auditPeriod?: {
      startDate: string;
      endDate: string;
    };
  };
  signature: AttestationSignatureMetadata;
}

/**
 * Attestation download history item
 */
export interface AttestationHistoryItem {
  id: string;
  timestamp: string;
  tokenId: string;
  network: Network;
  format: 'pdf' | 'json' | 'both';
  fileSize?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * Compliance monitoring dashboard types
 * For enterprise-grade compliance observability
 */

/**
 * Whitelist enforcement metrics for MICA compliance monitoring
 */
export interface WhitelistEnforcementMetrics {
  totalAddresses: number;
  activeAddresses: number;
  pendingAddresses: number;
  removedAddresses: number;
  enforcementRate: number; // Percentage
  recentViolations: number;
  lastUpdated: string;
}

/**
 * Audit health metrics for compliance monitoring
 */
export interface AuditHealthMetrics {
  totalAuditEntries: number;
  successfulActions: number;
  failedActions: number;
  criticalIssues: number;
  warningIssues: number;
  auditCoverage: number; // Percentage
  lastAuditTimestamp: string;
}

/**
 * Data retention status for compliance monitoring
 */
export interface RetentionStatusMetrics {
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  retentionCompliance: number; // Percentage
  oldestRecord: string;
  retentionPolicyDays: number;
  lastUpdated: string;
}

/**
 * Overall compliance monitoring metrics
 */
export interface ComplianceMonitoringMetrics {
  network: Network;
  assetId?: string;
  whitelistEnforcement: WhitelistEnforcementMetrics;
  auditHealth: AuditHealthMetrics;
  retentionStatus: RetentionStatusMetrics;
  overallComplianceScore: number;
  lastUpdated: string;
}

/**
 * Filters for compliance monitoring dashboard
 */
export interface ComplianceMonitoringFilters {
  network?: Network | 'all';
  assetId?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
}

/**
 * Compliance monitoring chart data point
 */
export interface ComplianceChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

/**
 * Compliance monitoring trend data
 */
export interface ComplianceMonitoringTrend {
  metric: 'whitelist' | 'audit' | 'retention';
  dataPoints: ComplianceChartDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * MICA compliance dashboard widget types
 * For enterprise-ready compliance visibility
 */

/**
 * Whitelist coverage metrics widget data
 */
export interface WhitelistCoverageMetrics {
  totalAddresses: number;
  activeAddresses: number;
  pendingAddresses: number;
  coveragePercentage: number;
  recentlyAdded: number;
  recentlyRemoved: number;
  lastUpdated: string;
}

/**
 * Issuer status for MICA compliance
 */
export interface IssuerStatus {
  issuerAddress: string;
  isVerified: boolean;
  status: 'verified' | 'pending' | 'incomplete' | 'rejected';
  legalName?: string;
  registrationNumber?: string;
  jurisdiction?: string;
  regulatoryLicense?: string;
  verifiedAt?: string;
  missingFields?: string[];
  lastUpdated: string;
}

/**
 * RWA risk flag severity levels
 */
export type RiskFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * RWA risk flag for compliance monitoring
 */
export interface RwaRiskFlag {
  id: string;
  severity: RiskFlagSeverity;
  category: 'compliance' | 'legal' | 'technical' | 'operational';
  title: string;
  description: string;
  affectedAssets?: string[];
  detectedAt: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

/**
 * RWA risk flags widget data
 */
export interface RwaRiskFlagsMetrics {
  totalFlags: number;
  criticalFlags: number;
  highFlags: number;
  mediumFlags: number;
  lowFlags: number;
  recentFlags: RwaRiskFlag[];
  lastUpdated: string;
}

/**
 * Network health status
 */
export interface NetworkHealthStatus {
  network: Network;
  isHealthy: boolean;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number; // milliseconds
  lastChecked: string;
  issues?: string[];
}

/**
 * Network health widget data
 */
export interface NetworkHealthMetrics {
  networks: NetworkHealthStatus[];
  overallHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdated: string;
}

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'free' | 'professional' | 'enterprise';

/**
 * Feature gating status
 */
export interface FeatureGatingStatus {
  feature: string;
  enabled: boolean;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  description?: string;
}

/**
 * Subscription tier gating widget data
 */
export interface SubscriptionTierGatingMetrics {
  currentTier: SubscriptionTier;
  features: FeatureGatingStatus[];
  upgradableFeatures: number;
  lastUpdated: string;
}

/**
 * KYC provider status
 */
export interface KycProviderStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSyncTime: string;
  jurisdiction: string[];
  coverage: number; // Percentage of addresses covered
  checksPerformed: number;
  failedChecks: number;
  isStale: boolean; // True if last sync > 24 hours
  errorMessage?: string;
}

/**
 * KYC provider integration metrics for dashboard widget
 */
export interface KycProviderMetrics {
  providers: KycProviderStatus[];
  totalCoverage: number; // Overall coverage percentage
  activeProviders: number;
  staleProviders: number;
  failedProviders: number;
  integrationComplete: number; // Percentage of integration completion
  lastUpdated: string;
}

/**
 * MICA Article compliance status
 */
export interface MicaArticleStatus {
  articleNumber: string;
  articleTitle: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  lastChecked: string;
  notes?: string;
}

/**
 * MICA Readiness Panel data
 */
export interface MicaReadinessData {
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  articles: MicaArticleStatus[];
  lastUpdated: string;
  nextReviewDate?: string;
}

/**
 * Compliance Report metadata
 */
export interface ComplianceReport {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  status: 'available' | 'generating' | 'failed';
  format: 'pdf' | 'json' | 'csv';
  size?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

/**
 * Compliance Alert for future monitoring
 */
export interface ComplianceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'whitelist' | 'kyc' | 'audit' | 'regulatory' | 'system';
  title: string;
  description: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  actionRequired?: string;
}

/**
 * KYC + AML Orchestration Types
 * For production-ready compliance workflow and token issuance gating
 */

/**
 * User compliance status lifecycle states
 */
export type UserComplianceStatus = 
  | 'not_started'           // User hasn't begun compliance process
  | 'pending_documents'     // Awaiting document upload
  | 'pending_review'        // Documents submitted, under review
  | 'approved'              // Compliance approved, can issue tokens
  | 'rejected'              // Compliance rejected, remediation needed
  | 'escalated'             // Case escalated to manual review
  | 'blocked_by_aml'        // AML screening failed, blocked
  | 'expired';              // Compliance approval expired, re-verification needed

/**
 * KYC document types required for verification
 */
export type KYCDocumentType = 
  | 'government_id'         // Passport, driver's license, national ID
  | 'proof_of_address'      // Utility bill, bank statement
  | 'business_registration' // For business entities
  | 'tax_id'                // Tax identification document
  | 'beneficial_ownership'  // UBO declaration
  | 'bank_verification';    // Bank account verification

/**
 * KYC document upload status
 */
export type KYCDocumentStatus = 
  | 'not_uploaded'
  | 'uploaded'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

/**
 * KYC document item in checklist
 */
export interface KYCDocument {
  type: KYCDocumentType;
  label: string;
  description: string;
  required: boolean;
  status: KYCDocumentStatus;
  uploadedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
  documentUrl?: string;
}

/**
 * AML screening verdict categories
 */
export type AMLScreeningVerdict = 
  | 'not_started'           // Screening not yet initiated
  | 'in_progress'           // Screening in progress
  | 'clear'                 // No matches found, cleared
  | 'potential_match'       // Possible match, needs review
  | 'confirmed_match'       // Confirmed sanctions list match, blocked
  | 'error'                 // Screening service error
  | 'manual_review';        // Requires manual compliance review

/**
 * AML screening details
 */
export interface AMLScreeningResult {
  verdict: AMLScreeningVerdict;
  screenedAt?: string;
  provider?: string;          // e.g., 'ComplyAdvantage', 'Dow Jones'
  matchDetails?: {
    listName: string;         // e.g., 'OFAC SDN', 'EU Sanctions'
    matchScore: number;       // 0-100 confidence score
    matchedFields: string[];  // Which fields matched
  }[];
  processingError?: string;   // If verdict is 'error'
  notes?: string;
}

/**
 * Compliance event types for audit timeline
 */
export type ComplianceEventType = 
  | 'compliance_started'
  | 'document_uploaded'
  | 'document_rejected'
  | 'kyc_review_started'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'aml_screening_started'
  | 'aml_screening_completed'
  | 'aml_match_detected'
  | 'case_escalated'
  | 'compliance_approved'
  | 'compliance_rejected'
  | 'compliance_expired'
  | 'issuance_attempted'
  | 'issuance_blocked'
  | 'remediation_requested';

/**
 * Compliance event for audit timeline
 */
export interface ComplianceEvent {
  id: string;
  type: ComplianceEventType;
  timestamp: string;
  actor: 'user' | 'system' | 'admin' | 'provider';
  actorId?: string;           // User email, admin ID, or provider name
  description: string;        // Human-readable event description
  metadata?: Record<string, any>;
  visible: boolean;           // Whether visible to user (vs internal only)
}

/**
 * Remediation action types
 */
export type RemediationActionType = 
  | 'upload_document'
  | 'resubmit_document'
  | 'contact_support'
  | 'provide_additional_info'
  | 'wait_for_review'
  | 'acknowledge_block';

/**
 * Remediation action for rejected/blocked states
 */
export interface RemediationAction {
  type: RemediationActionType;
  title: string;
  description: string;
  actionUrl?: string;         // Link to action (e.g., upload form)
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;           // If action is time-sensitive
}

/**
 * Complete user compliance state
 */
export interface UserComplianceState {
  userId: string;
  email: string;
  status: UserComplianceStatus;
  kycDocuments: KYCDocument[];
  amlScreening: AMLScreeningResult;
  events: ComplianceEvent[];
  remediationActions: RemediationAction[];
  canIssueTokens: boolean;    // Computed eligibility for token issuance
  blockedReasons?: string[];  // Reasons why issuance is blocked
  approvedAt?: string;
  expiresAt?: string;         // When compliance approval expires
  lastUpdated: string;
}

/**
 * Issuance eligibility check result
 */
export interface IssuanceEligibility {
  eligible: boolean;
  status: UserComplianceStatus;
  reasons: string[];          // Why user is/isn't eligible
  nextActions: RemediationAction[];
  canRetry: boolean;          // Whether user can retry failed steps
}

/**
 * Admin compliance list filters
 */
export interface AdminComplianceFilters {
  status?: UserComplianceStatus[];
  search?: string;            // Search by email or user ID
  dateFrom?: string;
  dateTo?: string;
  needsReview?: boolean;      // Filter for pending/escalated
  riskLevel?: 'low' | 'medium' | 'high';
  limit?: number;
  offset?: number;
}

/**
 * Admin compliance list item (summary view)
 */
export interface AdminComplianceListItem {
  userId: string;
  email: string;
  status: UserComplianceStatus;
  submittedAt?: string;
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high';
  pendingActions: number;
  amlVerdict: AMLScreeningVerdict;
  assignedTo?: string;        // Compliance officer assigned
}

/**
 * Admin compliance list response
 */
export interface AdminComplianceListResponse {
  items: AdminComplianceListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
