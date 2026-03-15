/**
 * Enterprise Approval Cockpit — typed interfaces and helper utilities.
 *
 * Provides the data model and logic for the enterprise approval queue and
 * release sign-off cockpit feature. Designed to be backend-ready: all
 * interfaces can be hydrated from a future approval API without architectural
 * churn.
 *
 * Terminology aligned with the Biatec compliance workspace and risk report
 * builder for consistency (EvidenceStatus, readiness scores, blocker language).
 */

// ---------------------------------------------------------------------------
// Reviewer roles
// ---------------------------------------------------------------------------

export type ReviewerRole =
  | 'compliance_operator'
  | 'legal_reviewer'
  | 'procurement_reviewer'
  | 'executive_sponsor'

export const REVIEWER_ROLE_LABELS: Record<ReviewerRole, string> = {
  compliance_operator: 'Compliance Operator',
  legal_reviewer: 'Legal Reviewer',
  procurement_reviewer: 'Procurement Reviewer',
  executive_sponsor: 'Executive Sponsor',
}

export const REVIEWER_ROLE_DESCRIPTIONS: Record<ReviewerRole, string> = {
  compliance_operator:
    'Prepares the launch package, verifies compliance evidence, and confirms all mandatory checks have been completed.',
  legal_reviewer:
    'Reviews policy gaps, jurisdiction risks, transfer restrictions, and confirms regulatory acceptability.',
  procurement_reviewer:
    'Assesses release posture, operational dependencies, and unresolved evidence gaps that affect vendor confidence.',
  executive_sponsor:
    'Provides final sign-off and is responsible for authorizing the regulated token launch.',
}

// ---------------------------------------------------------------------------
// Approval stage status
// ---------------------------------------------------------------------------

export type ApprovalStageStatus =
  | 'not_started'
  | 'ready_for_review'
  | 'in_review'
  | 'needs_attention'
  | 'conditionally_approved'
  | 'approved'
  | 'blocked'

export const STAGE_STATUS_LABELS: Record<ApprovalStageStatus, string> = {
  not_started: 'Not Started',
  ready_for_review: 'Ready for Review',
  in_review: 'In Review',
  needs_attention: 'Needs Attention',
  conditionally_approved: 'Conditionally Approved',
  approved: 'Approved',
  blocked: 'Blocked',
}

export const STAGE_STATUS_DESCRIPTIONS: Record<ApprovalStageStatus, string> = {
  not_started: 'This review stage has not yet been initiated.',
  ready_for_review: 'Evidence is available and this stage is ready for reviewer sign-off.',
  in_review: 'A reviewer is actively evaluating this stage.',
  needs_attention: 'One or more items require operator or reviewer action before this stage can proceed.',
  conditionally_approved: 'Approved subject to resolution of the stated conditions. Follow-up required.',
  approved: 'This stage has been reviewed and approved. No further action is required.',
  blocked: 'A critical issue is preventing this stage from proceeding. Must be resolved before approval.',
}

/** True when the status represents a terminal blocking state. */
export function isBlockingStatus(status: ApprovalStageStatus): boolean {
  return status === 'blocked' || status === 'needs_attention'
}

/** True when the stage has been signed off (approved or conditionally). */
export function isSignedOff(status: ApprovalStageStatus): boolean {
  return status === 'approved' || status === 'conditionally_approved'
}

// ---------------------------------------------------------------------------
// Blocker severity
// ---------------------------------------------------------------------------

export type BlockerSeverity = 'critical' | 'high' | 'medium' | 'informational'

export const BLOCKER_SEVERITY_LABELS: Record<BlockerSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  informational: 'Informational',
}

export interface StageBlocker {
  id: string
  severity: BlockerSeverity
  /** Plain-language headline */
  title: string
  /** Why this is a problem */
  reason: string
  /** What must happen to resolve it */
  action: string
  /** Optional link to relevant evidence/setup page */
  evidencePath: string | null
  /** Whether this blocker prevents launch (vs. a follow-up item) */
  isLaunchBlocking: boolean
  /** ISO timestamp if the evidence that surfaced this blocker is stale */
  staleSince: string | null
}

// ---------------------------------------------------------------------------
// Approval stage
// ---------------------------------------------------------------------------

export interface ApprovalStage {
  id: string
  /** Display label for this stage */
  label: string
  /** Reviewer role responsible for this stage */
  role: ReviewerRole
  /** Current sign-off status */
  status: ApprovalStageStatus
  /** One-sentence summary visible without expanding */
  summary: string
  /** Ordered list of blockers surfaced for this stage */
  blockers: StageBlocker[]
  /** Concise description of what the reviewer is evaluating */
  reviewScope: string
  /** ISO timestamp of the last action taken on this stage (null = never) */
  lastActionAt: string | null
  /** ISO timestamp deadline or due date (null = no deadline) */
  dueAt: string | null
  /** Links to existing compliance evidence or reporting pages */
  evidenceLinks: Array<{ label: string; path: string }>
  /** Free-text notes or conditions for conditional approval */
  conditions: string | null
}

// ---------------------------------------------------------------------------
// Release recommendation
// ---------------------------------------------------------------------------

export type ReleasePosture = 'ready' | 'conditionally_ready' | 'not_ready'

export const RELEASE_POSTURE_LABELS: Record<ReleasePosture, string> = {
  ready: 'Ready for Launch',
  conditionally_ready: 'Conditionally Ready',
  not_ready: 'Not Ready — Blockers Must Be Resolved',
}

export const RELEASE_POSTURE_DESCRIPTIONS: Record<ReleasePosture, string> = {
  ready:
    'All required review stages have been approved. The launch is cleared to proceed subject to any final operator checks.',
  conditionally_ready:
    'One or more stages have been conditionally approved. Outstanding conditions must be documented and resolved before final launch.',
  not_ready:
    'One or more stages are blocked or have critical items that must be resolved before the launch can proceed.',
}

export interface ReleaseRecommendation {
  posture: ReleasePosture
  /** One-sentence headline recommendation */
  headline: string
  /** Supporting explanation for the posture */
  rationale: string
  /** Number of critical blockers across all stages */
  criticalBlockerCount: number
  /** Number of stages currently blocked */
  blockedStageCount: number
  /** Number of stages approved or conditionally approved */
  approvedStageCount: number
  /** ISO timestamp when this recommendation was computed */
  computedAt: string
}

// ---------------------------------------------------------------------------
// Approval cockpit state (full model)
// ---------------------------------------------------------------------------

export interface ApprovalCockpitState {
  launchName: string | null
  stages: ApprovalStage[]
  recommendation: ReleaseRecommendation
  /** ISO timestamp of the most recent state rehydration */
  refreshedAt: string
}

// ---------------------------------------------------------------------------
// Helper: stale evidence detection
// ---------------------------------------------------------------------------

/** Maximum age (ms) before evidence is considered stale — 30 days */
const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Returns true if the given ISO timestamp is older than STALE_THRESHOLD_MS
 * relative to `now` (defaults to Date.now()).
 */
export function isEvidenceStale(
  isoTimestamp: string | null,
  now: number = Date.now(),
): boolean {
  if (!isoTimestamp) return false
  const ts = Date.parse(isoTimestamp)
  if (isNaN(ts)) return false
  return now - ts > STALE_THRESHOLD_MS
}

/**
 * Returns a human-friendly staleness label.
 *   - null     → not stale or no timestamp
 *   - string   → e.g., "45 days ago"
 */
export function formatStalenessLabel(
  isoTimestamp: string | null,
  now: number = Date.now(),
): string | null {
  if (!isoTimestamp) return null
  const ts = Date.parse(isoTimestamp)
  if (isNaN(ts)) return null
  const diffMs = now - ts
  if (diffMs <= 0) return null
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// ---------------------------------------------------------------------------
// Helper: derive stage status from compliance readiness data
// ---------------------------------------------------------------------------

/**
 * Derives the approval stage status for a given set of blockers and a
 * previously recorded status. Implements the closed-fail rule: if any
 * launch-blocking critical/high-severity blocker is present, the stage
 * must be 'blocked'. Informational blockers alone do not block the stage.
 */
export function deriveStageStatus(
  blockers: StageBlocker[],
  currentStatus: ApprovalStageStatus = 'not_started',
): ApprovalStageStatus {
  const launchBlockers = blockers.filter((b) => b.isLaunchBlocking)
  const criticalOrHigh = launchBlockers.filter(
    (b) => b.severity === 'critical' || b.severity === 'high',
  )

  if (criticalOrHigh.length > 0) return 'blocked'

  const mediumLaunch = launchBlockers.filter((b) => b.severity === 'medium')
  if (mediumLaunch.length > 0) return 'needs_attention'

  // Any remaining blockers — including informational / non-launch-blocking ones —
  // require a reviewer to take a fresh look, even if the stage was previously
  // signed off.  Preserving approval status silently would hide new concerns from
  // legal, procurement, and executive reviewers who rely on this cockpit to know
  // when a stage has changed since their last review.
  const anyBlockers = blockers.length > 0
  if (anyBlockers) return 'needs_attention'

  // No blockers at all — safe to preserve a signed-off state.
  if (isSignedOff(currentStatus)) return currentStatus

  if (currentStatus === 'not_started') return 'ready_for_review'

  return currentStatus
}

// ---------------------------------------------------------------------------
// Helper: compute release recommendation from stages
// ---------------------------------------------------------------------------

/**
 * Computes the overall release recommendation from the full stage list.
 * Uses a pessimistic / fail-closed approach aligned with MiCA-era compliance:
 *   - Any blocked stage → not_ready
 *   - Any conditional approval → conditionally_ready (unless also blocked)
 *   - All approved → ready
 */
export function computeReleaseRecommendation(
  stages: ApprovalStage[],
  now: number = Date.now(),
): ReleaseRecommendation {
  const blockedStages = stages.filter((s) => s.status === 'blocked')
  const needsAttention = stages.filter((s) => s.status === 'needs_attention')
  const conditionalStages = stages.filter((s) => s.status === 'conditionally_approved')
  const approvedStages = stages.filter((s) => isSignedOff(s.status))

  const criticalBlockerCount = stages
    .flatMap((s) => s.blockers)
    .filter((b) => b.isLaunchBlocking && (b.severity === 'critical' || b.severity === 'high'))
    .length

  let posture: ReleasePosture
  let headline: string
  let rationale: string

  if (blockedStages.length > 0 || criticalBlockerCount > 0) {
    posture = 'not_ready'
    const blockCount = blockedStages.length
    headline = `${blockCount} stage${blockCount !== 1 ? 's' : ''} blocked — launch cannot proceed`
    rationale = `Critical compliance or legal issues must be resolved before this launch can move forward. Review the blocked stage${blockCount !== 1 ? 's' : ''} for required actions.`
  } else if (needsAttention.length > 0) {
    posture = 'not_ready'
    headline = `${needsAttention.length} stage${needsAttention.length !== 1 ? 's' : ''} require attention before launch`
    rationale = `Medium-severity items are outstanding. Each stage must be reviewed and resolved before proceeding to sign-off.`
  } else if (conditionalStages.length > 0) {
    posture = 'conditionally_ready'
    headline = `Conditionally ready — ${conditionalStages.length} stage${conditionalStages.length !== 1 ? 's' : ''} approved with conditions`
    rationale = `Review all stated conditions before proceeding. All conditions must be documented and resolved prior to final launch authorization.`
  } else if (approvedStages.length === stages.length && stages.length > 0) {
    posture = 'ready'
    headline = 'All review stages approved — launch is cleared to proceed'
    rationale = `Every required sign-off stage has been approved. Final launch authorization may proceed subject to operator confirmation.`
  } else {
    posture = 'not_ready'
    headline = 'Review stages are incomplete — sign-off required'
    rationale = `Not all required review stages have been completed. Each stage must be reviewed and approved before the launch can be authorized.`
  }

  return {
    posture,
    headline,
    rationale,
    criticalBlockerCount,
    blockedStageCount: blockedStages.length,
    approvedStageCount: approvedStages.length,
    computedAt: new Date(now).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Default / mock state factory — used for frontend development and testing.
// Replace with API hydration when the backend approval API is available.
// ---------------------------------------------------------------------------

/**
 * Builds a representative default cockpit state for a regulated token launch.
 * Models a realistic mid-workflow scenario: compliance stage needs attention,
 * legal stage is blocked, procurement is ready for review, executive is not started.
 */
export function buildDefaultCockpitState(now: number = Date.now()): ApprovalCockpitState {
  const thirtyOneDaysAgo = new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString()
  const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()

  const stages: ApprovalStage[] = [
    // ── Stage 1: Compliance Review ──────────────────────────────────────────
    {
      id: 'compliance-review',
      label: 'Compliance Review',
      role: 'compliance_operator',
      status: 'needs_attention',
      summary:
        'KYC/AML configuration is incomplete and jurisdiction evidence is stale. Operator action required before legal review can begin.',
      reviewScope:
        'Verify KYC/AML provider configuration, jurisdiction policy completeness, whitelist readiness, and evidence freshness.',
      blockers: [
        {
          id: 'kyc-config-missing',
          severity: 'high',
          title: 'KYC/AML Provider Not Configured',
          reason:
            'No KYC or AML provider has been configured for this token. Regulated launches require investor identity verification.',
          action:
            'Navigate to Compliance Setup and configure a KYC/AML provider under the Investor Eligibility step.',
          evidencePath: '/compliance/setup',
          isLaunchBlocking: true,
          staleSince: null,
        },
        {
          id: 'jurisdiction-stale',
          severity: 'medium',
          title: 'Jurisdiction Evidence Is Stale',
          reason: `Jurisdiction policy was last updated more than 30 days ago. Evidence must be current for release sign-off.`,
          action:
            'Re-run the jurisdiction configuration or confirm the current policy is still accurate in Compliance Setup.',
          evidencePath: '/compliance/setup',
          isLaunchBlocking: false,
          staleSince: thirtyOneDaysAgo,
        },
      ],
      lastActionAt: twoDaysAgo,
      dueAt: null,
      evidenceLinks: [
        { label: 'Compliance Setup', path: '/compliance/setup' },
        { label: 'Evidence Pack', path: '/compliance/evidence' },
        { label: 'Compliance Launch Console', path: '/compliance/launch' },
      ],
      conditions: null,
    },

    // ── Stage 2: Legal Review ────────────────────────────────────────────────
    {
      id: 'legal-review',
      label: 'Legal Review',
      role: 'legal_reviewer',
      status: 'blocked',
      summary:
        'Whitelist policy is missing transfer restrictions required for the selected jurisdictions. Legal sign-off is blocked until resolved.',
      reviewScope:
        'Evaluate transfer restrictions, jurisdiction contradictions, policy completeness, and investor eligibility configuration.',
      blockers: [
        {
          id: 'transfer-restrictions-missing',
          severity: 'critical',
          title: 'Transfer Restriction Policy Not Configured',
          reason:
            'The selected jurisdictions require explicit transfer restriction rules. No whitelist policy with transfer controls has been set up.',
          action:
            'Open the Whitelist Policy Dashboard and configure transfer restrictions for the applicable jurisdictions before requesting legal review.',
          evidencePath: '/compliance/policy',
          isLaunchBlocking: true,
          staleSince: null,
        },
      ],
      lastActionAt: tenDaysAgo,
      dueAt: null,
      evidenceLinks: [
        { label: 'Whitelist Policy Dashboard', path: '/compliance/policy' },
        { label: 'Evidence Pack', path: '/compliance/evidence' },
        { label: 'Risk Report', path: '/compliance/risk-report' },
      ],
      conditions: null,
    },

    // ── Stage 3: Procurement Review ──────────────────────────────────────────
    {
      id: 'procurement-review',
      label: 'Procurement Review',
      role: 'procurement_reviewer',
      status: 'ready_for_review',
      summary:
        'Operational dependencies and evidence availability have been confirmed. Procurement reviewer can begin assessment.',
      reviewScope:
        'Confirm vendor dependencies, evidence completeness, operational risk posture, and any unresolved gaps that affect organizational confidence.',
      blockers: [],
      lastActionAt: null,
      dueAt: null,
      evidenceLinks: [
        { label: 'Compliance Reporting', path: '/compliance/reporting' },
        { label: 'Risk Report Builder', path: '/compliance/risk-report' },
        { label: 'Evidence Pack', path: '/compliance/evidence' },
      ],
      conditions: null,
    },

    // ── Stage 4: Executive Sign-Off ─────────────────────────────────────────
    {
      id: 'executive-sign-off',
      label: 'Executive Sign-Off',
      role: 'executive_sponsor',
      status: 'not_started',
      summary:
        'Awaiting completion of prior review stages. Executive sign-off will be available once compliance, legal, and procurement reviews are approved.',
      reviewScope:
        'Authorize the regulated token launch based on compliance posture, legal clearance, and procurement confirmation.',
      blockers: [],
      lastActionAt: null,
      dueAt: null,
      evidenceLinks: [
        { label: 'Compliance Launch Console', path: '/compliance/launch' },
        { label: 'Risk Report Builder', path: '/compliance/risk-report' },
      ],
      conditions: null,
    },
  ]

  // Derive each stage's status from its blockers
  const derivedStages = stages.map((stage) => ({
    ...stage,
    status: deriveStageStatus(stage.blockers, stage.status),
  }))

  const recommendation = computeReleaseRecommendation(derivedStages, now)

  return {
    launchName: 'Biatec Token Launch v1',
    stages: derivedStages,
    recommendation,
    refreshedAt: new Date(now).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Derived view helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first stage that is currently blocking the sequence, or null
 * if no stage is actively blocking.
 */
export function findBlockingStage(stages: ApprovalStage[]): ApprovalStage | null {
  return (
    stages.find((s) => s.status === 'blocked' || s.status === 'needs_attention') ?? null
  )
}

/**
 * Returns all launch-blocking items across all stages, sorted by severity
 * (critical → high → medium → informational).
 */
export function getTopBlockers(stages: ApprovalStage[]): StageBlocker[] {
  const severityOrder: BlockerSeverity[] = ['critical', 'high', 'medium', 'informational']
  const allBlockers = stages.flatMap((s) => s.blockers.filter((b) => b.isLaunchBlocking))
  return allBlockers.sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  )
}

/**
 * Determines the Tailwind CSS classes for a stage status badge/border.
 */
export function stageStatusColorClass(
  status: ApprovalStageStatus,
  variant: 'badge' | 'border' | 'text',
): string {
  const map: Record<ApprovalStageStatus, Record<'badge' | 'border' | 'text', string>> = {
    not_started: {
      badge: 'bg-gray-700 text-gray-300',
      border: 'border-gray-700',
      text: 'text-gray-400',
    },
    ready_for_review: {
      badge: 'bg-blue-800 text-blue-200',
      border: 'border-blue-700',
      text: 'text-blue-300',
    },
    in_review: {
      badge: 'bg-indigo-800 text-indigo-200',
      border: 'border-indigo-700',
      text: 'text-indigo-300',
    },
    needs_attention: {
      badge: 'bg-yellow-800 text-yellow-200',
      border: 'border-yellow-700',
      text: 'text-yellow-300',
    },
    conditionally_approved: {
      badge: 'bg-teal-800 text-teal-200',
      border: 'border-teal-700',
      text: 'text-teal-300',
    },
    approved: {
      badge: 'bg-green-800 text-green-200',
      border: 'border-green-700',
      text: 'text-green-300',
    },
    blocked: {
      badge: 'bg-red-800 text-red-200',
      border: 'border-red-700',
      text: 'text-red-400',
    },
  }
  return map[status][variant]
}

/**
 * Tailwind classes for the release posture recommendation banner.
 */
export function releasePostureBannerClass(posture: ReleasePosture): string {
  switch (posture) {
    case 'ready':
      return 'border-green-700 bg-green-950'
    case 'conditionally_ready':
      return 'border-teal-700 bg-teal-950'
    case 'not_ready':
      return 'border-red-700 bg-red-950'
  }
}

/**
 * Tailwind text color for the posture headline.
 */
export function releasePostureTextClass(posture: ReleasePosture): string {
  switch (posture) {
    case 'ready':
      return 'text-green-300'
    case 'conditionally_ready':
      return 'text-teal-300'
    case 'not_ready':
      return 'text-red-400'
  }
}

/**
 * Tailwind classes for blocker severity badge.
 */
export function blockerSeverityBadgeClass(severity: BlockerSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-800 text-red-200'
    case 'high':
      return 'bg-orange-800 text-orange-200'
    case 'medium':
      return 'bg-yellow-800 text-yellow-200'
    case 'informational':
      return 'bg-gray-700 text-gray-300'
  }
}
