/**
 * Evidence pack types, status labels, and grade constants.
 * Shared by ComplianceEvidencePackView.vue and its tests.
 */

export type EvidenceStatus = 'ready' | 'warning' | 'failed' | 'pending' | 'unavailable'

export interface EvidenceSection {
  id: string
  title: string
  status: EvidenceStatus
  releaseGrade: boolean
  summary: string
  details: string[]
  timestamp: string | null
  actionLabel: string | null
  actionPath: string | null
}

export const STATUS_LABELS: Record<EvidenceStatus, string> = {
  ready: 'Ready for Release Review',
  warning: 'Review Needed',
  failed: 'Missing Required Evidence',
  pending: 'Evidence Pending',
  unavailable: 'Source Unavailable',
}

export const STATUS_DESCRIPTIONS: Record<EvidenceStatus, string> = {
  ready: 'All required evidence is present and meets release-grade criteria.',
  warning: 'Evidence exists but requires operator review before release sign-off.',
  failed: 'Required evidence is missing or does not meet release-grade criteria.',
  pending: 'Evidence is being collected or awaiting a CI/backend run to complete.',
  unavailable: 'The evidence source is not reachable. Check configuration or run status.',
}

/** Release-grade evidence can appear in a procurement or audit package. */
export const RELEASE_GRADE_LABEL = 'Release-Grade Evidence'
/** Developer feedback is not equivalent to release sign-off. */
export const PERMISSIVE_GRADE_LABEL = 'Developer Feedback — Not Release Sign-off'

// ---------------------------------------------------------------------------
// Compliance Reporting Workspace types
// ---------------------------------------------------------------------------

export interface JurisdictionSummary {
  configured: boolean
  jurisdictions: string[]
  restrictedCount: number
  permittedCount: number
  staleSince: string | null
}

export interface KYCAMLSummary {
  status: EvidenceStatus
  kycRequired: boolean
  amlRequired: boolean
  providerConfigured: boolean
  pendingReviewCount: number
  staleSince: string | null
}

export interface WhitelistSummary {
  status: EvidenceStatus
  whitelistRequired: boolean
  approvedInvestorCount: number
  pendingInvestorCount: number
  activeWhitelistId: string | null
  staleSince: string | null
}

export interface InvestorEligibilitySummary {
  status: EvidenceStatus
  accreditedRequired: boolean
  retailPermitted: boolean
  eligibilityCategories: string[]
  staleSince: string | null
}

export interface ComplianceReportBundle {
  generatedAt: string
  launchName: string | null
  overallStatus: EvidenceStatus
  readinessScore: number
  jurisdiction: JurisdictionSummary
  kycAml: KYCAMLSummary
  whitelist: WhitelistSummary
  investorEligibility: InvestorEligibilitySummary
  evidenceSections: EvidenceSection[]
  exportVersion: '1.0'
}

export const OVERALL_STATUS_LABEL: Record<EvidenceStatus, string> = {
  ready: 'Compliance Review Ready — No Critical Blockers',
  warning: 'Review Required Before Release Sign-off',
  failed: 'Critical Blockers Must Be Resolved',
  pending: 'Evidence Collection In Progress',
  unavailable: 'Evidence Sources Unavailable',
}
