/**
 * Type definitions for the Guided Token Launch onboarding flow
 * 
 * This flow is designed for non-crypto-native users with email/password authentication.
 * No wallet connector references should appear anywhere in this flow.
 */

/**
 * Organization profile information
 */
export interface OrganizationProfile {
  organizationName: string
  organizationType: 'company' | 'foundation' | 'dao' | 'individual' | 'other'
  registrationNumber?: string
  jurisdiction: string
  website?: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  role: 'compliance_officer' | 'cfo_finance' | 'cto_tech' | 'product_manager' | 'business_owner' | 'legal_counsel' | 'other'
}

/**
 * Token intent and use case
 */
export interface TokenIntent {
  tokenPurpose: string // Brief description of token purpose
  utilityType: 'loyalty_rewards' | 'access_rights' | 'governance' | 'payment' | 'asset_backed' | 'collectible' | 'other'
  targetAudience: 'b2b' | 'b2c' | 'internal' | 'community'
  expectedHolders: 'under_100' | '100_1000' | '1000_10000' | 'over_10000'
  geographicScope: 'local' | 'national' | 'regional' | 'global'
}

/**
 * Compliance readiness checklist
 */
export interface ComplianceReadiness {
  requiresMICA: boolean
  requiresKYC: boolean
  requiresAML: boolean
  hasLegalReview: boolean
  hasRiskAssessment: boolean
  restrictedJurisdictions: string[] // ISO 3166-1 alpha-2 codes
  complianceNotes?: string
  whitelistRequired: boolean
  selectedWhitelistId?: string
}

/**
 * Token economics configuration
 */
export interface TokenEconomics {
  totalSupply: string | number
  decimals: number
  initialDistribution: {
    team: number // percentage
    investors: number
    community: number
    reserve: number
  }
  vestingSchedule?: {
    enabled: boolean
    teamVestingMonths?: number
    investorVestingMonths?: number
    cliffMonths?: number
  }
  burnMechanism: boolean
  mintingAllowed: boolean
}

/**
 * Token template selection
 */
export interface TokenTemplate {
  id: string
  name: string
  description: string
  standard: 'ASA' | 'ARC3' | 'ARC19' | 'ARC69' | 'ARC200' | 'ARC72' | 'ERC20' | 'ERC721'
  network: 'algorand_mainnet' | 'algorand_testnet' | 'voi' | 'aramid' | 'ethereum_mainnet' | 'ethereum_sepolia' | 'arbitrum' | 'base'
  useCase: string
  complianceLevel: 'basic' | 'standard' | 'advanced' | 'mica_compliant'
  recommendedFor: string[]
  features: string[]
}

/**
 * Validation result for a field or step
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Readiness score breakdown
 */
export interface ReadinessScore {
  overallScore: number // 0-100
  requiredStepsComplete: number
  totalRequiredSteps: number
  optionalStepsComplete: number
  totalOptionalSteps: number
  blockers: string[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Wizard step status
 */
export interface StepStatus {
  id: string
  title: string
  isComplete: boolean
  isValid: boolean
  isOptional: boolean
  validation?: ValidationResult
  lastModified?: Date
}

/**
 * Complete guided launch form data
 */
export interface GuidedLaunchForm {
  // Step data
  organizationProfile?: OrganizationProfile
  tokenIntent?: TokenIntent
  complianceReadiness?: ComplianceReadiness
  selectedTemplate?: TokenTemplate
  tokenEconomics?: TokenEconomics
  
  // Metadata
  draftId?: string
  createdAt: Date
  lastModified: Date
  currentStep: number
  completedSteps: string[]
  
  // Status
  isSubmitted: boolean
  submissionId?: string
  submissionStatus?: 'pending' | 'success' | 'failed'
  submissionError?: string
}

/**
 * Launch submission payload for backend
 */
export interface LaunchSubmission {
  organizationProfile: OrganizationProfile
  tokenIntent: TokenIntent
  complianceReadiness: ComplianceReadiness
  tokenTemplate: TokenTemplate
  tokenEconomics: TokenEconomics
  metadata: {
    userEmail: string
    submittedAt: Date
    draftId?: string
  }
}

/**
 * Launch submission response from backend
 */
export interface LaunchSubmissionResponse {
  success: boolean
  submissionId: string
  tokenId?: string
  deploymentStatus: 'queued' | 'processing' | 'completed' | 'failed'
  message: string
  nextSteps?: string[]
  estimatedCompletionTime?: string
}

/**
 * Telemetry event types for activation tracking
 */
export enum LaunchEventType {
  FLOW_STARTED = 'guided_launch.flow_started',
  STEP_STARTED = 'guided_launch.step_started',
  STEP_COMPLETED = 'guided_launch.step_completed',
  STEP_VALIDATION_FAILED = 'guided_launch.step_validation_failed',
  DRAFT_SAVED = 'guided_launch.draft_saved',
  DRAFT_RESUMED = 'guided_launch.draft_resumed',
  LAUNCH_SUBMITTED = 'guided_launch.launch_submitted',
  LAUNCH_SUCCESS = 'guided_launch.launch_success',
  LAUNCH_FAILED = 'guided_launch.launch_failed',
  FLOW_ABANDONED = 'guided_launch.flow_abandoned',
}

/**
 * Telemetry event payload
 */
export interface LaunchTelemetryEvent {
  type: LaunchEventType
  userId: string
  sessionId: string
  timestamp: Date
  data: Record<string, any>
}
