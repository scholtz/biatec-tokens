/**
 * Evidence pack types, status labels, and grade constants.
 * Shared by ComplianceEvidencePackView.vue and its tests.
 */

export type EvidenceStatus = 'ready' | 'warning' | 'failed' | 'pending' | 'unavailable'

export interface EvidenceSection {
  id: string
  /** Display name for this evidence section (preferred). Legacy: title */
  label?: string
  /** Legacy display name — use label if available */
  title?: string
  status: EvidenceStatus
  /** Letter grade like 'A', 'B', 'C' (preferred). Legacy: releaseGrade (boolean) */
  grade?: string
  /** Legacy boolean grade flag — use grade if available */
  releaseGrade?: boolean
  /** Short summary detail string (preferred). Legacy: summary */
  detail?: string
  /** Legacy summary field */
  summary?: string
  /** Legacy multi-item details list */
  details?: string[]
  /** ISO timestamp of last refresh (preferred). Legacy: timestamp */
  freshnessTimestamp?: string | null
  /** Legacy timestamp field */
  timestamp?: string | null
  actionLabel?: string | null
  actionPath?: string | null
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

/** Entry in a jurisdiction list, with status annotation. */
export interface JurisdictionEntry {
  code: string
  name: string
  status: 'permitted' | 'restricted' | 'unknown'
}

export interface JurisdictionSummary {
  configured: boolean
  /** Permitted/restricted jurisdiction list. Accepts both string[] and JurisdictionEntry[] */
  jurisdictions: string[] | JurisdictionEntry[]
  restrictedCount: number
  permittedCount: number
  /** ISO timestamp of last data refresh (preferred) */
  freshnessTimestamp?: string | null
  /** Legacy field: when the data became stale (set only when stale) */
  staleSince?: string | null
}

export interface KYCAMLSummary {
  status: EvidenceStatus
  kycRequired: boolean
  amlRequired?: boolean
  providerConfigured: boolean
  pendingReviewCount: number
  completedReviewCount?: number
  /** ISO timestamp of last data refresh (preferred) */
  freshnessTimestamp?: string | null
  /** Legacy field: when the data became stale */
  staleSince?: string | null
}

export interface WhitelistSummary {
  status: EvidenceStatus
  whitelistRequired: boolean
  approvedInvestorCount: number
  pendingInvestorCount: number
  activeWhitelistId: string | null
  /** ISO timestamp of last data refresh (preferred) */
  freshnessTimestamp?: string | null
  /** Legacy field: when the data became stale */
  staleSince?: string | null
}

export interface InvestorEligibilitySummary {
  status: EvidenceStatus
  accreditedRequired: boolean
  retailPermitted: boolean
  eligibilityCategories: string[]
  /** ISO timestamp of last data refresh (preferred) */
  freshnessTimestamp?: string | null
  /** Legacy field: when the data became stale */
  staleSince?: string | null
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
