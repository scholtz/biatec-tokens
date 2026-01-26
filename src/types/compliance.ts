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
  status: 'active' | 'pending' | 'removed' | 'not_listed';
  kycVerified?: boolean;
  jurisdictionAllowed?: boolean;
  sanctioned?: boolean;
  notes?: string;
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
