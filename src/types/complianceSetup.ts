/**
 * Compliance Setup Workspace Type Definitions
 * 
 * Defines types for the guided compliance setup flow that helps users
 * configure jurisdiction policies, whitelist requirements, KYC/AML readiness,
 * and attestations for token issuance compliance.
 */

/**
 * Step status values
 */
export type SetupStepStatus = 
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'needs_review'

/**
 * Blocker severity levels
 */
export type BlockerSeverity = 'critical' | 'high' | 'medium' | 'low'

/**
 * Risk level for readiness assessment
 */
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'

/**
 * Individual step in the compliance setup flow
 */
export interface ComplianceSetupStep {
  id: string
  title: string
  description: string
  status: SetupStepStatus
  isRequired: boolean
  isComplete: boolean
  isValid: boolean
  lastModified?: Date
  validation?: StepValidation
  dependencies?: string[] // IDs of steps that must be completed first
}

/**
 * Step validation result
 */
export interface StepValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  canProceed: boolean
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  severity: BlockerSeverity
  remediationHint: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string
  message: string
  recommendation: string
}

/**
 * Jurisdiction and Policy Configuration
 */
export interface JurisdictionPolicy {
  // Issuer jurisdiction
  issuerCountry: string
  issuerRegion?: string
  issuerJurisdictionType: 'eu' | 'us' | 'asia_pacific' | 'middle_east' | 'other'
  
  // Distribution geography
  distributionScope: 'global' | 'regional' | 'country_specific'
  allowedCountries?: string[] // ISO country codes
  blockedCountries?: string[] // ISO country codes
  
  // Investor constraints
  investorTypes: InvestorType[]
  requiresAccreditation: boolean
  minimumInvestmentAmount?: number
  maximumInvestmentAmount?: number
  
  // Regulatory framework
  regulatoryFramework: 'mica' | 'sec' | 'mifid' | 'other' | 'none'
  requiresMICACompliance: boolean
  requiresSECCompliance: boolean
  
  // Policy summary (generated)
  policySummaryText?: string
}

/**
 * Investor type categories
 */
export type InvestorType = 
  | 'retail'
  | 'accredited'
  | 'institutional'
  | 'qualified_purchaser'
  | 'professional'

/**
 * Whitelist and Investor Eligibility Configuration
 */
export interface WhitelistEligibility {
  // Whitelist requirement
  whitelistRequired: boolean
  whitelistId?: string
  whitelistName?: string
  
  // Access restrictions
  restrictionType: 'none' | 'kyc_required' | 'whitelist_only' | 'custom'
  requiresKYC: boolean
  requiresAML: boolean
  requiresAccreditationProof: boolean
  
  // Investor categories
  allowedInvestorTypes: InvestorType[]
  
  // Transfer restrictions
  transferRestrictions: TransferRestriction[]
  
  // Lock-up periods
  hasLockupPeriod: boolean
  lockupDurationDays?: number
  
  // Secondary trading
  allowSecondaryTrading: boolean
  secondaryTradingRestrictions?: string
}

/**
 * Transfer restriction types
 */
export type TransferRestriction = 
  | 'no_restrictions'
  | 'issuer_approval_required'
  | 'whitelist_only'
  | 'time_locked'
  | 'amount_limited'

/**
 * KYC/AML Readiness Configuration
 */
export interface KYCAMLReadiness {
  // Provider configuration
  kycProviderConfigured: boolean
  kycProviderName?: string
  kycProviderStatus: 'not_configured' | 'configured' | 'connected' | 'ready'
  
  amlProviderConfigured: boolean
  amlProviderName?: string
  amlProviderStatus: 'not_configured' | 'configured' | 'connected' | 'ready'
  
  // Document requirements
  requiredDocuments: KYCDocumentRequirement[]
  completedDocuments: string[] // Document type IDs that are complete
  
  // Identity verification
  identityVerificationFlow: 'manual' | 'automated' | 'hybrid'
  identityVerificationStatus: 'not_started' | 'in_progress' | 'completed'
  
  // Sanctions screening
  sanctionsScreeningEnabled: boolean
  sanctionsScreeningProvider?: string
  
  // Compliance checks
  pepsCheckEnabled: boolean
  adverseMediaCheckEnabled: boolean
  
  // Readiness status
  overallReadinessStatus: 'not_ready' | 'partially_ready' | 'ready'
  blockingIssues: string[]
}

/**
 * KYC document requirement
 */
export interface KYCDocumentRequirement {
  id: string
  type: 'government_id' | 'proof_of_address' | 'business_registration' | 'tax_id' | 'beneficial_ownership' | 'other'
  label: string
  description: string
  isRequired: boolean
  isCompleted: boolean
  fileUrl?: string
  uploadedAt?: Date
}

/**
 * Attestation and Evidence Configuration
 */
export interface AttestationEvidence {
  // Issuer attestations
  attestations: IssuerAttestation[]
  
  // Evidence references
  evidenceReferences: EvidenceReference[]
  
  // Compliance badge
  complianceBadgeEligible: boolean
  complianceBadgeLevel?: 'basic' | 'standard' | 'mica_compliant' | 'enterprise'
  complianceBadgeRationale?: string
  
  // Legal review
  hasLegalReview: boolean
  legalReviewDate?: Date
  legalReviewNotes?: string
  
  // Audit trail
  auditTrailReady: boolean
  auditTrailStartDate?: Date
}

/**
 * Issuer attestation
 */
export interface IssuerAttestation {
  id: string
  type: 'jurisdiction_declaration' | 'investor_suitability' | 'regulatory_compliance' | 'data_privacy' | 'other'
  statement: string
  isRequired: boolean
  isAttested: boolean
  attestedAt?: Date
  attestedBy?: string
}

/**
 * Evidence reference (documents, links, metadata)
 */
export interface EvidenceReference {
  id: string
  type: 'legal_opinion' | 'regulatory_filing' | 'audit_report' | 'policy_document' | 'external_link' | 'other'
  title: string
  description?: string
  referenceType: 'url' | 'document_id' | 'metadata'
  referenceValue: string
  uploadedAt: Date
  uploadedBy: string
}

/**
 * Readiness blocker
 */
export interface ReadinessBlocker {
  id: string
  severity: BlockerSeverity
  category: 'jurisdiction' | 'whitelist' | 'kyc_aml' | 'attestation' | 'evidence' | 'validation'
  title: string
  description: string
  remediationSteps: string[]
  relatedStepId?: string // ID of the step to fix this blocker
  canAutoResolve: boolean
}

/**
 * Overall readiness assessment
 */
export interface ReadinessAssessment {
  overallRisk: RiskLevel
  readinessScore: number // 0-100
  isReadyForDeploy: boolean
  
  blockers: ReadinessBlocker[]
  warnings: ValidationWarning[]
  recommendations: string[]
  
  // Status by category
  jurisdictionReady: boolean
  whitelistReady: boolean
  kycAMLReady: boolean
  attestationReady: boolean
  
  // Next actions
  nextActions: NextAction[]
  estimatedTimeToReady?: string
}

/**
 * Next action for user
 */
export interface NextAction {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  actionType: 'configure' | 'upload' | 'attest' | 'review' | 'contact_support'
  deepLink?: string // Link to the specific step/section
  estimatedMinutes?: number
}

/**
 * Complete compliance setup form state
 */
export interface ComplianceSetupForm {
  // Metadata
  setupId?: string
  tokenId?: string
  userId?: string
  createdAt: Date
  lastModified: Date
  
  // Steps
  steps: ComplianceSetupStep[]
  currentStepIndex: number
  
  // Step data
  jurisdictionPolicy?: JurisdictionPolicy
  whitelistEligibility?: WhitelistEligibility
  kycAMLReadiness?: KYCAMLReadiness
  attestationEvidence?: AttestationEvidence
  
  // Overall state
  isComplete: boolean
  isSubmitted: boolean
  submittedAt?: Date
  
  // Readiness
  readinessAssessment?: ReadinessAssessment
}

/**
 * Analytics event for compliance setup
 */
export interface ComplianceSetupEvent {
  eventType: 
    | 'setup_started'
    | 'step_started'
    | 'step_completed'
    | 'step_validation_failed'
    | 'blocker_encountered'
    | 'blocker_resolved'
    | 'setup_completed'
    | 'setup_abandoned'
  timestamp: Date
  userId: string
  setupId: string
  stepId?: string
  metadata?: Record<string, any>
}
