/**
 * complianceCaseNormalizer.ts
 *
 * Maps raw backend compliance case API responses to the operator-facing
 * language and data shapes used by the InvestorComplianceOnboardingWorkspace
 * and EnterpriseApprovalCockpit.
 *
 * Principles:
 * - Fail-closed: unknown or missing data is treated as NOT ready.
 * - No wallet assumptions. All output uses governance/compliance language.
 * - Produces OnboardingStage[] compatible with the existing workspace helpers
 *   so the view layer requires minimal change.
 * - Keeps normalization logic separate from API transport and UI rendering.
 */

import type {
  BackendComplianceCaseListItem,
  BackendComplianceCaseDetail,
  BackendCohortReadiness,
  BackendCaseStatus,
  BackendRiskLevel,
  BackendEvidenceStatus,
  BackendJurisdictionOutcome,
  BackendScreeningOutcome,
  BackendEvidenceItem,
} from '../lib/api/complianceCaseManagement'

import type {
  OnboardingStage,
  OnboardingBlocker,
  OnboardingStageStatus,
  OnboardingBlockerSeverity,
} from './investorComplianceOnboarding'

// ---------------------------------------------------------------------------
// Status label maps (backend → operator language)
// ---------------------------------------------------------------------------

/** Human-readable labels for backend case status codes. */
export const CASE_STATUS_LABELS: Record<BackendCaseStatus, string> = {
  PENDING: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  AWAITING_DOCUMENTS: 'Awaiting Documents',
  ESCALATED: 'Escalated',
  APPROVED: 'Approved',
  CONDITIONALLY_APPROVED: 'Conditionally Approved',
  REJECTED: 'Rejected',
  STALE: 'Stale — Refresh Required',
  ARCHIVED: 'Archived',
  UNKNOWN: 'Status Unknown',
}

/** Human-readable labels for backend risk level codes. */
export const RISK_LEVEL_LABELS: Record<BackendRiskLevel, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
  UNKNOWN: 'Risk Not Assessed',
}

/** Human-readable labels for backend evidence status codes. */
export const EVIDENCE_STATUS_LABELS: Record<BackendEvidenceStatus, string> = {
  PRESENT: 'Document Verified',
  MISSING: 'Document Missing',
  STALE: 'Document Expired or Stale',
  PENDING_UPLOAD: 'Awaiting Upload',
  REJECTED: 'Document Rejected',
  UNKNOWN: 'Status Unknown',
}

/** Human-readable labels for jurisdiction outcomes. */
export const JURISDICTION_OUTCOME_LABELS: Record<BackendJurisdictionOutcome, string> = {
  PERMITTED: 'Permitted',
  RESTRICTED: 'Restricted',
  PROHIBITED: 'Prohibited',
  UNDER_REVIEW: 'Under Review',
  UNKNOWN: 'Not Assessed',
}

/** Human-readable labels for screening outcomes. */
export const SCREENING_OUTCOME_LABELS: Record<BackendScreeningOutcome, string> = {
  CLEAR: 'Clear',
  FLAGGED: 'Flagged for Review',
  WATCHLIST_HIT: 'Watchlist Match',
  SANCTIONS_HIT: 'Sanctions Match',
  PENDING: 'Screening Pending',
  UNKNOWN: 'Not Screened',
}

// ---------------------------------------------------------------------------
// Status mapping helpers
// ---------------------------------------------------------------------------

/**
 * Map a backend case status code to the frontend OnboardingStageStatus.
 * Fail-closed: unknown/unexpected values map to 'blocked'.
 */
export function mapCaseStatusToStageStatus(status: BackendCaseStatus): OnboardingStageStatus {
  switch (status) {
    case 'APPROVED':
      return 'complete'
    case 'CONDITIONALLY_APPROVED':
      return 'pending_review'
    case 'UNDER_REVIEW':
      return 'in_progress'
    case 'AWAITING_DOCUMENTS':
    case 'ESCALATED':
      return 'blocked'
    case 'PENDING':
      return 'not_started'
    case 'STALE':
      return 'stale'
    case 'REJECTED':
    case 'ARCHIVED':
    case 'UNKNOWN':
    default:
      return 'blocked'
  }
}

/**
 * Map a backend risk level to an OnboardingBlockerSeverity.
 * Fail-closed: UNKNOWN maps to 'high'.
 */
export function mapRiskLevelToBlockerSeverity(level: BackendRiskLevel): OnboardingBlockerSeverity {
  switch (level) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'informational'
    case 'UNKNOWN':
    default:
      return 'high' // fail-closed: unknown risk → high
  }
}

/**
 * Returns true when a backend case status indicates the case is blocking
 * launch advancement.
 */
export function isCaseStatusBlocking(status: BackendCaseStatus): boolean {
  return (
    status === 'AWAITING_DOCUMENTS' ||
    status === 'ESCALATED' ||
    status === 'REJECTED' ||
    status === 'STALE' ||
    status === 'UNKNOWN'
  )
}

/**
 * Returns true when a screening outcome indicates a compliance concern.
 */
export function isScreeningOutcomeConcerning(outcome: BackendScreeningOutcome): boolean {
  return outcome === 'FLAGGED' || outcome === 'WATCHLIST_HIT' || outcome === 'SANCTIONS_HIT'
}

/**
 * Returns true when a jurisdiction outcome blocks investor eligibility.
 */
export function isJurisdictionOutcomeBlocking(outcome: BackendJurisdictionOutcome): boolean {
  return outcome === 'RESTRICTED' || outcome === 'PROHIBITED'
}

/**
 * Returns true when an evidence status indicates the document is not usable.
 * Fail-closed: UNKNOWN is treated as not acceptable.
 */
export function isEvidenceStatusDeficient(status: BackendEvidenceStatus): boolean {
  return (
    status === 'MISSING' ||
    status === 'STALE' ||
    status === 'REJECTED' ||
    status === 'UNKNOWN'
  )
}

// ---------------------------------------------------------------------------
// Evidence freshness
// ---------------------------------------------------------------------------

/**
 * Determines whether an evidence item is stale based on its lastVerifiedAt
 * timestamp and an optional staleness window.
 *
 * Default staleness window: 30 days.
 */
export function isEvidenceFreshnessFailing(
  item: BackendEvidenceItem,
  stalenessWindowDays = 30,
): boolean {
  if (item.status === 'MISSING' || item.status === 'REJECTED' || item.status === 'UNKNOWN') {
    return true
  }
  if (item.status === 'STALE') return true
  if (!item.lastVerifiedAt) return true // no verification date → fail-closed

  const lastVerified = Date.parse(item.lastVerifiedAt)
  if (isNaN(lastVerified)) return true

  const ageMs = Date.now() - lastVerified
  const windowMs = stalenessWindowDays * 24 * 60 * 60 * 1000
  return ageMs > windowMs
}

/**
 * Checks whether a document has expired based on its expiresAt field.
 */
export function isEvidenceExpired(item: BackendEvidenceItem): boolean {
  if (!item.expiresAt) return false
  const expiry = Date.parse(item.expiresAt)
  if (isNaN(expiry)) return false
  return Date.now() > expiry
}

// ---------------------------------------------------------------------------
// Normalised case summary (used by case list views)
// ---------------------------------------------------------------------------

/** Operator-facing summary of a compliance case (normalised from backend). */
export interface NormalisedCaseSummary {
  id: string
  referenceNumber: string
  entityName: string
  entityType: string
  /** Operator-readable status label. */
  statusLabel: string
  /** Raw status for programmatic checks. */
  rawStatus: BackendCaseStatus
  /** Operator-readable risk label. */
  riskLabel: string
  /** Raw risk level for badge styling. */
  rawRiskLevel: BackendRiskLevel
  /** KYC outcome label. */
  kycOutcomeLabel: string
  kycApproved: boolean
  /** AML outcome label. */
  amlOutcomeLabel: string
  amlClear: boolean
  /** Assigned reviewer display name. */
  assignedReviewer: string
  /** Human-friendly last activity date. */
  lastActivityLabel: string
  /** Whether this case is blocking launch advancement. */
  isLaunchBlocking: boolean
  /** Count of open remediation tasks. */
  openTaskCount: number
  /** Whether any evidence is stale or missing. */
  hasStaleEvidence: boolean
}

/**
 * Normalise a backend case list item into operator-readable form.
 */
export function normaliseCaseSummary(raw: BackendComplianceCaseListItem): NormalisedCaseSummary {
  const kycApproved = raw.kycOutcome === 'APPROVED'
  const amlClear =
    raw.amlOutcome === 'CLEAR' || raw.amlOutcome === 'PENDING' // pending = not yet screened

  return {
    id: raw.id,
    referenceNumber: raw.referenceNumber,
    entityName: raw.entityName,
    entityType: raw.entityType,
    statusLabel: CASE_STATUS_LABELS[raw.status] ?? 'Status Unknown',
    rawStatus: raw.status,
    riskLabel: RISK_LEVEL_LABELS[raw.riskLevel] ?? 'Risk Not Assessed',
    rawRiskLevel: raw.riskLevel,
    kycOutcomeLabel: raw.kycOutcome === 'APPROVED' ? 'KYC Verified' :
      raw.kycOutcome === 'PENDING' ? 'KYC Pending' :
        raw.kycOutcome === 'FAILED' ? 'KYC Failed' :
          raw.kycOutcome === 'NOT_STARTED' ? 'KYC Not Started' : 'KYC Unknown',
    kycApproved,
    amlOutcomeLabel: SCREENING_OUTCOME_LABELS[raw.amlOutcome] ?? 'Not Screened',
    amlClear,
    assignedReviewer: raw.assignedReviewer ?? 'Unassigned',
    lastActivityLabel: formatActivityDate(raw.lastActivityAt),
    isLaunchBlocking: raw.hasLaunchBlockers,
    openTaskCount: raw.openTaskCount,
    hasStaleEvidence: raw.hasStaleEvidence,
  }
}

// ---------------------------------------------------------------------------
// Normalised case detail
// ---------------------------------------------------------------------------

export interface NormalisedEvidenceItem {
  id: string
  documentType: string
  statusLabel: string
  isDeficient: boolean
  isExpired: boolean
  isFreshnessFailing: boolean
  lastVerifiedLabel: string
  reviewedBy: string
  reviewerNotes: string
  documentUrl: string | null
}

export interface NormalisedJurisdictionEntry {
  jurisdictionCode: string
  jurisdictionName: string
  outcomeLabel: string
  isBlocking: boolean
  restrictionReason: string
}

export interface NormalisedRemediationTask {
  id: string
  title: string
  description: string
  isBlocking: boolean
  isOverdue: boolean
  dueDateLabel: string
  assignedTo: string
  statusLabel: string
}

export interface NormalisedCaseDetail {
  summary: NormalisedCaseSummary
  kycVerificationMethod: string
  kycVerifiedAt: string
  kycVerifiedBy: string
  kycDiscrepancyNotes: string
  amlScreeningProvider: string
  amlScreenedAt: string
  amlFlagReason: string
  amlResolvedAt: string
  amlEscalationNotes: string
  evidenceItems: NormalisedEvidenceItem[]
  jurisdictionEntries: NormalisedJurisdictionEntry[]
  remediationTasks: NormalisedRemediationTask[]
  riskNotes: string
  lastReviewedAt: string
  internalNotes: string
  /** True if any evidence items are stale or expired. */
  hasStaleEvidence: boolean
  /** True if any jurisdictions are blocked or prohibited. */
  hasJurisdictionConflicts: boolean
  /** True if any AML flags are unresolved. */
  hasUnresolvedAMLFlags: boolean
  /** True if all required evidence is present and fresh. */
  evidencePackComplete: boolean
}

/**
 * Normalise a backend case detail record into operator-readable form.
 */
export function normaliseCaseDetail(raw: BackendComplianceCaseDetail): NormalisedCaseDetail {
  const summary = normaliseCaseSummary(raw)

  const evidenceItems: NormalisedEvidenceItem[] = raw.evidenceItems.map((item) => ({
    id: item.id,
    documentType: item.documentType,
    statusLabel: EVIDENCE_STATUS_LABELS[item.status] ?? 'Unknown',
    isDeficient: isEvidenceStatusDeficient(item.status),
    isExpired: isEvidenceExpired(item),
    isFreshnessFailing: isEvidenceFreshnessFailing(item),
    lastVerifiedLabel: item.lastVerifiedAt ? formatActivityDate(item.lastVerifiedAt) : 'Not verified',
    reviewedBy: item.reviewedBy ?? 'Not assigned',
    reviewerNotes: item.reviewerNotes ?? '',
    documentUrl: item.documentUrl,
  }))

  const jurisdictionEntries: NormalisedJurisdictionEntry[] = raw.jurisdictionEntries.map((j) => ({
    jurisdictionCode: j.jurisdictionCode,
    jurisdictionName: j.jurisdictionName,
    outcomeLabel: JURISDICTION_OUTCOME_LABELS[j.outcome] ?? 'Not Assessed',
    isBlocking: isJurisdictionOutcomeBlocking(j.outcome),
    restrictionReason: j.restrictionReason ?? '',
  }))

  const remediationTasks: NormalisedRemediationTask[] = raw.remediationTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    isBlocking: t.isBlocking,
    isOverdue: t.status === 'OVERDUE',
    dueDateLabel: t.dueAt ? formatActivityDate(t.dueAt) : 'No due date',
    assignedTo: t.assignedTo ?? 'Unassigned',
    statusLabel:
      t.status === 'OPEN' ? 'Open' :
        t.status === 'IN_PROGRESS' ? 'In Progress' :
          t.status === 'RESOLVED' ? 'Resolved' : 'Overdue',
  }))

  const hasStaleEvidence = evidenceItems.some(
    (e) => e.isDeficient || e.isExpired || e.isFreshnessFailing,
  )
  const hasJurisdictionConflicts = jurisdictionEntries.some((j) => j.isBlocking)
  const hasUnresolvedAMLFlags =
    isScreeningOutcomeConcerning(raw.amlOutcome) &&
    !raw.amlDetail.resolvedAt

  const evidencePackComplete =
    evidenceItems.length > 0 &&
    !hasStaleEvidence &&
    raw.evidenceItems.every((e) => e.status === 'PRESENT')

  return {
    summary,
    kycVerificationMethod: raw.kycDetail.verificationMethod ?? 'Not specified',
    kycVerifiedAt: raw.kycDetail.verifiedAt ? formatActivityDate(raw.kycDetail.verifiedAt) : 'Not verified',
    kycVerifiedBy: raw.kycDetail.verifiedBy ?? 'Not assigned',
    kycDiscrepancyNotes: raw.kycDetail.discrepancyNotes ?? '',
    amlScreeningProvider: raw.amlDetail.screeningProvider ?? 'Not specified',
    amlScreenedAt: raw.amlDetail.screenedAt ? formatActivityDate(raw.amlDetail.screenedAt) : 'Not screened',
    amlFlagReason: raw.amlDetail.flagReason ?? '',
    amlResolvedAt: raw.amlDetail.resolvedAt ? formatActivityDate(raw.amlDetail.resolvedAt) : '',
    amlEscalationNotes: raw.amlDetail.escalationNotes ?? '',
    evidenceItems,
    jurisdictionEntries,
    remediationTasks,
    riskNotes: raw.riskNotes ?? '',
    lastReviewedAt: raw.lastReviewedAt ? formatActivityDate(raw.lastReviewedAt) : 'Not reviewed',
    internalNotes: raw.internalNotes ?? '',
    hasStaleEvidence,
    hasJurisdictionConflicts,
    hasUnresolvedAMLFlags,
    evidencePackComplete,
  }
}

// ---------------------------------------------------------------------------
// Cohort readiness → OnboardingStage[]
// ---------------------------------------------------------------------------

/**
 * Convert a backend cohort readiness response into the OnboardingStage[] shape
 * expected by deriveOnboardingWorkspaceState(). This allows the workspace view
 * to use exactly the same rendering logic regardless of whether data comes from
 * the live API or the deterministic fixtures.
 *
 * Stage mapping:
 *   intake              → derived from completedCases / totalCases
 *   documentation_review → derived from completedCases and hasStaleEvidence
 *   identity_kyc_review  → derived from cohort blockers tagged 'kyc'
 *   aml_risk_review      → derived from cohort blockers tagged 'aml'
 *   jurisdiction_review  → derived from cohort blockers tagged 'jurisdiction'
 *   evidence_preparation → derived from readinessScore and stale counts
 *   approval_handoff     → 'complete' only when overallStatus === 'READY'
 */
export function normaliseCohortReadinessToStages(
  cohort: BackendCohortReadiness,
): import('./investorComplianceOnboarding').OnboardingStage[] {
  const {
    overallStatus,
    totalCases,
    completedCases,
    blockedCases,
    pendingCases,
    staleCases,
    readinessScore,
    cohortBlockers,
    computedAt,
  } = cohort

  const now = new Date(computedAt).toISOString()

  // Helper: find cohort-level blockers relevant to a keyword
  const blockersFor = (keyword: string): OnboardingBlocker[] =>
    cohortBlockers
      .filter((b) => {
        const combined = `${b.title} ${b.reason}`.toLowerCase()
        return combined.includes(keyword)
      })
      .map((b) => ({
        id: b.id,
        stageId: 'aml_risk_review' as const,
        severity: (b.severity === 'CRITICAL' ? 'critical' :
          b.severity === 'HIGH' ? 'high' : 'medium') as OnboardingBlockerSeverity,
        title: b.title,
        reason: b.reason,
        recommendedAction:
          'Review the affected cases in the compliance case management console and resolve the outstanding issues before proceeding.',
        remediationPath: b.remediationPath ?? '/compliance/onboarding',
        staleSince: null,
        isLaunchBlocking: true,
      }))

  // ── Intake ────────────────────────────────────────────────────────────────
  const intakeComplete = totalCases > 0
  const intakeStatus: OnboardingStageStatus = intakeComplete ? 'complete' : 'not_started'

  // ── Documentation Review ──────────────────────────────────────────────────
  const docStatus: OnboardingStageStatus =
    staleCases > 0 ? 'stale' :
      blockedCases > 0 ? 'in_progress' :
        completedCases === totalCases && totalCases > 0 ? 'complete' :
          pendingCases > 0 ? 'in_progress' : 'not_started'

  const docBlockers: OnboardingBlocker[] = staleCases > 0 ? [{
    id: 'doc-stale',
    stageId: 'documentation_review',
    severity: 'high',
    title: `${staleCases} case${staleCases > 1 ? 's' : ''} with stale documentation`,
    reason: 'Evidence records are past the 30-day freshness window and must be refreshed.',
    recommendedAction: 'Review and re-verify the documentation for cases marked as stale.',
    remediationPath: '/compliance/evidence',
    staleSince: null,
    isLaunchBlocking: true,
  }] : []

  // ── KYC Review ───────────────────────────────────────────────────────────
  const kycBlockers = blockersFor('kyc')
  const kycStatus: OnboardingStageStatus =
    kycBlockers.some((b) => b.isLaunchBlocking) ? 'blocked' :
      kycBlockers.length > 0 ? 'in_progress' : (docStatus === 'complete' ? 'complete' : 'not_started')

  // ── AML Review ───────────────────────────────────────────────────────────
  const amlBlockers = blockersFor('aml').concat(blockersFor('sanction')).concat(blockersFor('watchlist'))
  const uniqueAmlBlockerIds = new Set<string>()
  const deduplicatedAmlBlockers = amlBlockers.filter((b) => {
    if (uniqueAmlBlockerIds.has(b.id)) return false
    uniqueAmlBlockerIds.add(b.id)
    return true
  })
  const amlStatus: OnboardingStageStatus =
    deduplicatedAmlBlockers.some((b) => b.isLaunchBlocking) ? 'blocked' :
      deduplicatedAmlBlockers.length > 0 ? 'in_progress' :
        kycStatus === 'complete' ? 'complete' : 'not_started'

  // ── Jurisdiction Review ───────────────────────────────────────────────────
  const jurisdictionBlockers = blockersFor('jurisdiction')
  const jurisdictionStatus: OnboardingStageStatus =
    jurisdictionBlockers.some((b) => b.isLaunchBlocking) ? 'blocked' :
      jurisdictionBlockers.length > 0 ? 'in_progress' :
        amlStatus === 'complete' ? 'complete' : 'not_started'

  // ── Evidence Preparation ─────────────────────────────────────────────────
  const evidenceBlockers: OnboardingBlocker[] = []
  const evidenceStatus: OnboardingStageStatus =
    overallStatus === 'STALE' ? 'stale' :
      jurisdictionStatus !== 'complete' ? 'not_started' :
        readinessScore >= 80 ? 'in_progress' : 'not_started'

  // ── Approval Handoff ──────────────────────────────────────────────────────
  const approvalStatus: OnboardingStageStatus = overallStatus === 'READY' ? 'complete' :
    overallStatus === 'PARTIALLY_READY' ? 'pending_review' : 'not_started'

  return [
    {
      id: 'intake',
      label: 'Intake',
      description: 'Collect issuer and investor profiles and validate entity registrations.',
      status: intakeStatus,
      summary: intakeComplete
        ? `${totalCases} investor case${totalCases !== 1 ? 's' : ''} registered in this cohort.`
        : 'No investor cases have been registered yet.',
      blockers: [],
      lastActionAt: now,
      evidenceLinks: [],
    },
    {
      id: 'documentation_review',
      label: 'Documentation Review',
      description: 'Verify completeness and validity of submitted identity documents and corporate records.',
      status: docStatus,
      summary: staleCases > 0
        ? `${staleCases} case${staleCases > 1 ? 's have' : ' has'} stale or expired documentation.`
        : `${completedCases} of ${totalCases} cases have verified documentation.`,
      blockers: docBlockers,
      lastActionAt: now,
      evidenceLinks: [{ label: 'Review Evidence Pack', path: '/compliance/evidence' }],
    },
    {
      id: 'identity_kyc_review',
      label: 'Identity & KYC Review',
      description: 'Perform KYC verification for all investors and resolve any identity discrepancies.',
      status: kycStatus,
      summary: kycBlockers.length > 0
        ? `${kycBlockers.length} KYC issue${kycBlockers.length > 1 ? 's require' : ' requires'} attention.`
        : (kycStatus === 'complete' ? 'All KYC checks are complete.' : 'KYC review is pending.'),
      blockers: kycBlockers.map((b) => ({ ...b, stageId: 'identity_kyc_review' as const })),
      lastActionAt: now,
      evidenceLinks: [],
    },
    {
      id: 'aml_risk_review',
      label: 'AML / Risk Review',
      description: 'Screen investors against sanctions lists and AML risk models.',
      status: amlStatus,
      summary: deduplicatedAmlBlockers.length > 0
        ? `${deduplicatedAmlBlockers.length} AML or screening issue${deduplicatedAmlBlockers.length > 1 ? 's require' : ' requires'} attention.`
        : (amlStatus === 'complete' ? 'AML screening is complete. No issues found.' : 'AML review is pending.'),
      blockers: deduplicatedAmlBlockers.map((b) => ({ ...b, stageId: 'aml_risk_review' as const })),
      lastActionAt: now,
      evidenceLinks: [],
    },
    {
      id: 'jurisdiction_review',
      label: 'Jurisdiction Review',
      description: 'Confirm all investor jurisdictions are permitted under the token policy.',
      status: jurisdictionStatus,
      summary: jurisdictionBlockers.length > 0
        ? `${jurisdictionBlockers.length} jurisdiction restriction${jurisdictionBlockers.length > 1 ? 's are' : ' is'} unresolved.`
        : (jurisdictionStatus === 'complete' ? 'All jurisdiction checks passed.' : 'Jurisdiction review is pending.'),
      blockers: jurisdictionBlockers.map((b) => ({ ...b, stageId: 'jurisdiction_review' as const })),
      lastActionAt: now,
      evidenceLinks: [],
    },
    {
      id: 'evidence_preparation',
      label: 'Evidence Preparation',
      description: 'Compile the evidence package from completed review stages.',
      status: evidenceStatus,
      summary: evidenceStatus === 'stale'
        ? 'Evidence package contains stale items and must be refreshed.'
        : evidenceStatus === 'in_progress'
          ? `Readiness score: ${readinessScore}%. Continue resolving outstanding items.`
          : 'Waiting for upstream stages to complete.',
      blockers: evidenceBlockers,
      lastActionAt: now,
      evidenceLinks: [{ label: 'View Evidence Pack', path: '/compliance/evidence' }],
    },
    {
      id: 'approval_handoff',
      label: 'Approval Handoff',
      description: 'Transfer the completed evidence package to the release sign-off cockpit.',
      status: approvalStatus,
      summary: approvalStatus === 'complete'
        ? 'The cohort is ready for approval handoff.'
        : approvalStatus === 'pending_review'
          ? 'Cohort is partially ready. Resolve outstanding items before handoff.'
          : 'Waiting for evidence package to be completed.',
      blockers: [],
      lastActionAt: now,
      evidenceLinks: approvalStatus === 'complete'
        ? [{ label: 'Go to Approval Cockpit', path: '/compliance/approval' }]
        : [],
    },
  ]
}

// ---------------------------------------------------------------------------
// Launch-readiness summary for adjacent surfaces
// ---------------------------------------------------------------------------

/** Operator-readable launch readiness summary (for approval cockpit etc). */
export interface CohortReadinessSummary {
  cohortId: string
  cohortName: string
  /** Operator-readable overall status. */
  statusLabel: string
  /** Raw status for programmatic checks. */
  rawStatus: BackendCohortReadiness['overallStatus']
  /** 0–100 readiness score. */
  readinessScore: number
  /** Total number of cases. */
  totalCases: number
  /** Cases that are blocked. */
  blockedCases: number
  /** Cases with stale evidence. */
  staleCases: number
  /** Cases pending review. */
  pendingCases: number
  /** Human-readable headline. */
  headline: string
  /** Whether the cohort is safe to hand off to approval. */
  isReadyForHandoff: boolean
  /** Whether any cohort-level launch blockers exist. */
  hasLaunchBlockers: boolean
  /** Top-level blocker titles. */
  blockerTitles: string[]
  /** When the readiness was computed. */
  computedAtLabel: string
}

/**
 * Convert a backend cohort readiness record into an operator-readable summary
 * for display in the approval cockpit or adjacent surfaces.
 */
export function normaliseCohortReadinessSummary(
  cohort: BackendCohortReadiness,
): CohortReadinessSummary {
  const STATUS_LABELS: Record<BackendCohortReadiness['overallStatus'], string> = {
    READY: 'Ready for Handoff',
    BLOCKED: 'Blocked — Action Required',
    PARTIALLY_READY: 'Partially Ready',
    STALE: 'Stale — Evidence Refresh Required',
    NOT_STARTED: 'Not Started',
    UNKNOWN: 'Status Unknown — Verification Required',
  }

  const isReadyForHandoff = cohort.overallStatus === 'READY'
  const hasLaunchBlockers = cohort.cohortBlockers.length > 0

  let headline: string
  if (isReadyForHandoff) {
    headline = `All ${cohort.completedCases} cases are approved and the evidence package is complete.`
  } else if (cohort.overallStatus === 'BLOCKED') {
    headline = `${cohort.blockedCases} case${cohort.blockedCases !== 1 ? 's are' : ' is'} blocked. Resolve all open issues before handoff.`
  } else if (cohort.overallStatus === 'STALE') {
    headline = `Evidence has expired for ${cohort.staleCases} case${cohort.staleCases !== 1 ? 's' : ''}. Refresh required before handoff.`
  } else if (cohort.overallStatus === 'PARTIALLY_READY') {
    headline = `${cohort.completedCases} of ${cohort.totalCases} cases are complete. ${cohort.pendingCases} pending review.`
  } else {
    headline = 'Cohort readiness has not been assessed yet.'
  }

  return {
    cohortId: cohort.cohortId,
    cohortName: cohort.cohortName,
    statusLabel: STATUS_LABELS[cohort.overallStatus] ?? 'Unknown',
    rawStatus: cohort.overallStatus,
    readinessScore: cohort.readinessScore,
    totalCases: cohort.totalCases,
    blockedCases: cohort.blockedCases,
    staleCases: cohort.staleCases,
    pendingCases: cohort.pendingCases,
    headline,
    isReadyForHandoff,
    hasLaunchBlockers,
    blockerTitles: cohort.cohortBlockers.map((b) => b.title).slice(0, 5),
    computedAtLabel: formatActivityDate(cohort.computedAt),
  }
}

// ---------------------------------------------------------------------------
// Degraded / unavailable state
// ---------------------------------------------------------------------------

/**
 * Returns an OnboardingStage[] representing a degraded backend scenario.
 * All stages are marked blocked so the UI stays fail-closed.
 *
 * @param reason  Human-readable reason for the degraded state.
 */
export function buildDegradedOnboardingStages(reason: string): import('./investorComplianceOnboarding').OnboardingStage[] {
  const STAGE_IDS = [
    'intake',
    'documentation_review',
    'identity_kyc_review',
    'aml_risk_review',
    'jurisdiction_review',
    'evidence_preparation',
    'approval_handoff',
  ] as const

  const STAGE_LABELS: Record<string, string> = {
    intake: 'Intake',
    documentation_review: 'Documentation Review',
    identity_kyc_review: 'Identity & KYC Review',
    aml_risk_review: 'AML / Risk Review',
    jurisdiction_review: 'Jurisdiction Review',
    evidence_preparation: 'Evidence Preparation',
    approval_handoff: 'Approval Handoff',
  }

  return STAGE_IDS.map((id) => ({
    id,
    label: STAGE_LABELS[id],
    description: '',
    status: 'blocked' as OnboardingStageStatus,
    summary: `Data is unavailable. ${reason}`,
    blockers: [
      {
        id: `degraded-${id}`,
        stageId: id as OnboardingStage['id'],
        severity: 'critical' as OnboardingBlockerSeverity,
        title: 'Compliance data unavailable',
        reason,
        recommendedAction:
          'Please wait for the compliance service to recover, then refresh this workspace. Do not proceed with launch activities while data cannot be verified.',
        remediationPath: null,
        staleSince: null,
        isLaunchBlocking: true,
      },
    ],
    lastActionAt: null,
    evidenceLinks: [],
  }))
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function formatActivityDate(isoDate: string | null): string {
  if (!isoDate) return 'No recent activity'
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return isoDate
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}
