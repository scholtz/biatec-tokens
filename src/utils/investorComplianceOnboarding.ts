/**
 * investorComplianceOnboarding.ts
 *
 * Typed helpers for the investor compliance onboarding and review operations
 * workspace. Covers staged readiness modelling, blocker summarisation, intake
 * status, KYC/AML review placeholders, jurisdiction restrictions, and evidence
 * handoff affordances.
 *
 * Designed to be backend-ready: all types and helpers can be hydrated from API
 * responses once live KYC/AML providers are integrated. Until then,
 * deterministic mock fixtures power local dev and automated CI tests.
 *
 * Architecture notes
 * ------------------
 * - No wallet assumptions. All language is enterprise/compliance-oriented.
 * - Uses existing BlockerSeverity / EvidenceFreshness conventions from
 *   approvalCockpit.ts and remediationWorkflow.ts so types compose cleanly.
 * - Fail-closed by default: helpers treat absent data as NOT ready.
 */

// ---------------------------------------------------------------------------
// Stage enumeration
// ---------------------------------------------------------------------------

/**
 * Ordered stages in the investor compliance onboarding lifecycle.
 * Operators progress through these stages before handing off to the
 * downstream approval cockpit.
 */
export type OnboardingStageId =
  | 'intake'
  | 'documentation_review'
  | 'identity_kyc_review'
  | 'aml_risk_review'
  | 'jurisdiction_review'
  | 'evidence_preparation'
  | 'approval_handoff'

export const ONBOARDING_STAGE_ORDER: OnboardingStageId[] = [
  'intake',
  'documentation_review',
  'identity_kyc_review',
  'aml_risk_review',
  'jurisdiction_review',
  'evidence_preparation',
  'approval_handoff',
]

export const ONBOARDING_STAGE_LABELS: Record<OnboardingStageId, string> = {
  intake: 'Intake',
  documentation_review: 'Documentation Review',
  identity_kyc_review: 'Identity & KYC Review',
  aml_risk_review: 'AML / Risk Review',
  jurisdiction_review: 'Jurisdiction Review',
  evidence_preparation: 'Evidence Preparation',
  approval_handoff: 'Approval Handoff',
}

export const ONBOARDING_STAGE_DESCRIPTIONS: Record<OnboardingStageId, string> = {
  intake:
    'Collect issuer and investor profiles, confirm contact details, and validate that all required entities are registered in the system.',
  documentation_review:
    'Verify completeness and validity of submitted identity documents, corporate records, and supporting attestations.',
  identity_kyc_review:
    'Perform Know Your Customer (KYC) verification for all investors and issuer representatives. Flag any unresolved identity discrepancies.',
  aml_risk_review:
    'Screen investors and issuers against sanctions lists and AML risk models. Assign risk ratings and document screening outcomes.',
  jurisdiction_review:
    'Confirm that all investor jurisdictions are permitted under the token policy. Identify and resolve any restricted or contradicted jurisdiction entries.',
  evidence_preparation:
    'Compile the evidence package from completed review stages and verify that all required documents, decisions, and sign-offs are present.',
  approval_handoff:
    'Transfer the completed evidence package to the release sign-off cockpit. Confirm all upstream stages are closed before handoff.',
}

// ---------------------------------------------------------------------------
// Stage readiness status
// ---------------------------------------------------------------------------

export type OnboardingStageStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'stale'
  | 'blocked'
  | 'complete'

export const ONBOARDING_STAGE_STATUS_LABELS: Record<OnboardingStageStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  stale: 'Stale — Refresh Required',
  blocked: 'Blocked',
  complete: 'Complete',
}

/** Returns true when the status prevents downstream stages from proceeding. */
export function isOnboardingStageBlocking(status: OnboardingStageStatus): boolean {
  return status === 'blocked' || status === 'stale'
}

/** Returns true when the stage is considered done from a workflow standpoint. */
export function isOnboardingStageComplete(status: OnboardingStageStatus): boolean {
  return status === 'complete'
}

// ---------------------------------------------------------------------------
// Blocker severity (mirrors approvalCockpit.ts for cross-workspace consistency)
// ---------------------------------------------------------------------------

export type OnboardingBlockerSeverity = 'critical' | 'high' | 'medium' | 'informational'

export const ONBOARDING_BLOCKER_SEVERITY_LABELS: Record<OnboardingBlockerSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  informational: 'Informational',
}

// ---------------------------------------------------------------------------
// Intake entity types
// ---------------------------------------------------------------------------

/** A registered entity that has been submitted for onboarding review. */
export interface IntakeEntity {
  /** Unique identifier for this entity in the onboarding system */
  id: string
  /** Entity display name (issuer company or investor name) */
  displayName: string
  /** Whether this is the issuer entity or an investor entity */
  role: 'issuer' | 'investor'
  /** Registered country / jurisdiction of the entity */
  jurisdiction: string
  /** ISO timestamp when the intake submission was received */
  submittedAt: string
  /** Whether all required intake fields have been filled */
  isComplete: boolean
  /** Optional note on what is missing or incorrect */
  note: string | null
}

// ---------------------------------------------------------------------------
// Document completeness
// ---------------------------------------------------------------------------

export type DocumentStatus = 'present' | 'missing' | 'expired' | 'pending_review'

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  present: 'Present',
  missing: 'Missing',
  expired: 'Expired',
  pending_review: 'Pending Review',
}

export interface DocumentItem {
  id: string
  label: string
  description: string
  status: DocumentStatus
  /** ISO timestamp when the document was last verified; null if never. */
  verifiedAt: string | null
  /** Whether absence of this document is launch-blocking */
  isRequired: boolean
}

/** Returns true when a document item requires attention (not fully verified). */
export function isDocumentActionRequired(doc: DocumentItem): boolean {
  return doc.status !== 'present'
}

// ---------------------------------------------------------------------------
// KYC review record
// ---------------------------------------------------------------------------

export type KYCReviewStatus =
  | 'not_submitted'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'requires_more_info'

export const KYC_REVIEW_STATUS_LABELS: Record<KYCReviewStatus, string> = {
  not_submitted: 'Not Submitted',
  pending: 'Pending',
  in_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_more_info: 'Requires Additional Information',
}

export interface KYCReviewRecord {
  entityId: string
  entityName: string
  status: KYCReviewStatus
  /** ISO timestamp of last status change; null if not yet actioned. */
  lastActionAt: string | null
  /** Plain-language note from the reviewer or system. */
  reviewNote: string | null
  /** Whether an outstanding issue is launch-blocking. */
  isLaunchBlocking: boolean
}

/** True when the KYC review is in a terminal passed state. */
export function isKYCApproved(record: KYCReviewRecord): boolean {
  return record.status === 'approved'
}

// ---------------------------------------------------------------------------
// AML / risk screening
// ---------------------------------------------------------------------------

export type AMLScreeningStatus =
  | 'not_run'
  | 'running'
  | 'clear'
  | 'flagged'
  | 'inconclusive'

export const AML_SCREENING_STATUS_LABELS: Record<AMLScreeningStatus, string> = {
  not_run: 'Screening Not Run',
  running: 'Screening In Progress',
  clear: 'Clear',
  flagged: 'Flagged — Requires Review',
  inconclusive: 'Inconclusive — Manual Review Required',
}

export type AMLRiskRating = 'low' | 'medium' | 'high' | 'unrated'

export const AML_RISK_RATING_LABELS: Record<AMLRiskRating, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  unrated: 'Not Yet Rated',
}

export interface AMLScreeningRecord {
  entityId: string
  entityName: string
  screeningStatus: AMLScreeningStatus
  riskRating: AMLRiskRating
  /** ISO timestamp of the most recent screening run; null if never run. */
  screenedAt: string | null
  /** Plain-language note on the screening outcome or flag reason. */
  note: string | null
  /** Whether an outstanding issue is launch-blocking. */
  isLaunchBlocking: boolean
}

/** True when the AML screening has produced a clean, reviewable result. */
export function isAMLClear(record: AMLScreeningRecord): boolean {
  return record.screeningStatus === 'clear'
}

// ---------------------------------------------------------------------------
// Jurisdiction review
// ---------------------------------------------------------------------------

export type JurisdictionDecision = 'permitted' | 'restricted' | 'pending' | 'contradicted'

export const JURISDICTION_DECISION_LABELS: Record<JurisdictionDecision, string> = {
  permitted: 'Permitted',
  restricted: 'Restricted',
  pending: 'Pending Decision',
  contradicted: 'Contradiction — Requires Resolution',
}

export interface JurisdictionEntry {
  jurisdictionCode: string
  jurisdictionName: string
  decision: JurisdictionDecision
  /** Whether the restriction is launch-blocking. */
  isLaunchBlocking: boolean
  /** Plain-language reason for the decision. */
  reason: string | null
}

/** True when a jurisdiction entry blocks the launch. */
export function isJurisdictionBlocking(entry: JurisdictionEntry): boolean {
  return (
    entry.isLaunchBlocking &&
    (entry.decision === 'restricted' || entry.decision === 'contradicted')
  )
}

// ---------------------------------------------------------------------------
// Onboarding-level blocker
// ---------------------------------------------------------------------------

export interface OnboardingBlocker {
  id: string
  stageId: OnboardingStageId
  severity: OnboardingBlockerSeverity
  /** Short plain-language headline */
  title: string
  /** Full explanation of why this is a problem */
  reason: string
  /** What the operator must do to resolve this */
  recommendedAction: string
  /** Route path to the surface where the operator can fix this */
  remediationPath: string | null
  /** ISO timestamp from which this evidence is considered stale; null if n/a */
  staleSince: string | null
  /** Whether resolving this blocker is required before the launch can proceed */
  isLaunchBlocking: boolean
}

/** Formats a staleness label such as "45 days ago" from an ISO timestamp. */
export function formatOnboardingStalenessLabel(staleSince: string | null): string | null {
  if (!staleSince) return null
  const msSince = Date.now() - new Date(staleSince).getTime()
  const days = Math.floor(msSince / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Earlier today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

/** Returns true when evidence associated with the blocker is stale (>30 days). */
export function isOnboardingEvidenceStale(staleSince: string | null): boolean {
  if (!staleSince) return false
  const msSince = Date.now() - new Date(staleSince).getTime()
  return msSince > 30 * 24 * 60 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Onboarding stage definition
// ---------------------------------------------------------------------------

export interface OnboardingStage {
  id: OnboardingStageId
  label: string
  description: string
  status: OnboardingStageStatus
  /** One-sentence plain-language summary visible without expanding the stage */
  summary: string
  /** List of blockers preventing this stage from completing */
  blockers: OnboardingBlocker[]
  /** ISO timestamp of the most recent action on this stage */
  lastActionAt: string | null
  /** Optional evidence links for drill-down */
  evidenceLinks: Array<{ label: string; path: string }>
  /** Optional: operator assigned to this stage */
  assignee?: string
  /** Optional: explicit priority override; derived from blockers if absent */
  priority?: 'critical' | 'high' | 'medium' | 'low'
}

// ---------------------------------------------------------------------------
// Overall workspace readiness
// ---------------------------------------------------------------------------

export type WorkspaceReadinessPosture =
  | 'ready_for_handoff'
  | 'partially_ready'
  | 'blocked'
  | 'stale'
  | 'not_started'

export const WORKSPACE_READINESS_POSTURE_LABELS: Record<WorkspaceReadinessPosture, string> = {
  ready_for_handoff: 'Ready for Approval Handoff',
  partially_ready: 'Partially Ready — Action Required',
  blocked: 'Blocked — Critical Items Unresolved',
  stale: 'Stale Evidence — Refresh Required',
  not_started: 'Not Started',
}

export const WORKSPACE_READINESS_POSTURE_DESCRIPTIONS: Record<WorkspaceReadinessPosture, string> = {
  ready_for_handoff:
    'All onboarding stages are complete. The compliance package can be handed off to the release sign-off cockpit.',
  partially_ready:
    'Some stages are complete but others require operator action before the package is ready for handoff.',
  blocked:
    'One or more critical blockers are preventing handoff. These must be resolved before proceeding.',
  stale:
    'Evidence from one or more stages is past the acceptable freshness window. A refresh is required before handoff.',
  not_started:
    'Onboarding has not yet started. Begin by completing the intake stage.',
}

/** Full workspace state aggregated from all stages. */
export interface OnboardingWorkspaceState {
  posture: WorkspaceReadinessPosture
  stages: OnboardingStage[]
  /** Total number of launch-blocking open blockers across all stages */
  totalLaunchBlockers: number
  /** Number of stages that are complete */
  completedStageCount: number
  /** Number of stages that are blocked */
  blockedStageCount: number
  /** Number of stages with stale evidence */
  staleStageCount: number
  /** Overall readiness percentage (0–100) */
  readinessScore: number
  /** Top-level headline for the overview banner */
  headline: string
  /** Top-level rationale shown below the headline */
  rationale: string
  /** ISO timestamp of the most recent refresh */
  lastRefreshedAt: string
}

// ---------------------------------------------------------------------------
// Readiness derivation logic
// ---------------------------------------------------------------------------

/**
 * Derives the overall workspace posture from the set of onboarding stages.
 * Fail-closed: absent or unreviewed stages are treated as NOT ready.
 */
export function deriveWorkspacePosture(stages: OnboardingStage[]): WorkspaceReadinessPosture {
  if (stages.length === 0) return 'not_started'

  const hasBlocked = stages.some((s) => s.status === 'blocked')
  if (hasBlocked) return 'blocked'

  const hasStale = stages.some((s) => s.status === 'stale')
  if (hasStale) return 'stale'

  const hasLaunchBlockingBlocker = stages.some((s) =>
    s.blockers.some((b) => b.isLaunchBlocking),
  )
  if (hasLaunchBlockingBlocker) return 'blocked'

  const allComplete = stages.every((s) => s.status === 'complete')
  if (allComplete) return 'ready_for_handoff'

  const noneStarted = stages.every((s) => s.status === 'not_started')
  if (noneStarted) return 'not_started'

  return 'partially_ready'
}

/**
 * Calculates a 0–100 readiness score based on stage completion.
 * Blocked and stale stages count as 0. In-progress stages count as 50%.
 * Fail-closed: missing evidence is never rounded up.
 */
export function deriveReadinessScore(stages: OnboardingStage[]): number {
  if (stages.length === 0) return 0
  let score = 0
  for (const stage of stages) {
    if (stage.status === 'complete') {
      score += 100
    } else if (stage.status === 'in_progress' || stage.status === 'pending_review') {
      score += 50
    }
    // blocked / stale / not_started → 0
  }
  return Math.round(score / stages.length)
}

/**
 * Produces a plain-language headline summarising the workspace readiness.
 */
export function buildReadinessHeadline(posture: WorkspaceReadinessPosture, blockerCount: number): string {
  switch (posture) {
    case 'ready_for_handoff':
      return 'Compliance package is ready for approval handoff.'
    case 'blocked':
      return blockerCount === 1
        ? '1 critical issue must be resolved before handoff.'
        : `${blockerCount} critical issues must be resolved before handoff.`
    case 'stale':
      return 'Stale evidence detected. Refresh required before handoff is permitted.'
    case 'partially_ready':
      return 'Onboarding in progress. Some stages require further action.'
    case 'not_started':
      return 'Onboarding has not started. Begin with the intake stage.'
  }
}

/**
 * Produces a plain-language rationale shown beneath the headline banner.
 */
export function buildReadinessRationale(
  posture: WorkspaceReadinessPosture,
  completedCount: number,
  totalCount: number,
): string {
  switch (posture) {
    case 'ready_for_handoff':
      return `All ${totalCount} stages are complete. The package meets the readiness threshold for handoff to the release sign-off cockpit.`
    case 'blocked':
      return `${completedCount} of ${totalCount} stages are complete. Resolve all critical blockers before proceeding to the approval queue.`
    case 'stale':
      return `${completedCount} of ${totalCount} stages are complete but stale evidence prevents handoff. Refresh the affected evidence and re-verify.`
    case 'partially_ready':
      return `${completedCount} of ${totalCount} stages are complete. Continue through the remaining stages to unlock handoff.`
    case 'not_started':
      return 'No onboarding data has been submitted. Start the intake process to begin compliance review.'
  }
}

/**
 * Derives the full workspace state from a list of onboarding stages.
 * This is the primary entry point used by the workspace view.
 */
export function deriveOnboardingWorkspaceState(stages: OnboardingStage[]): OnboardingWorkspaceState {
  const posture = deriveWorkspacePosture(stages)
  const completedStageCount = stages.filter((s) => s.status === 'complete').length
  const blockedStageCount = stages.filter((s) => s.status === 'blocked').length
  const staleStageCount = stages.filter((s) => s.status === 'stale').length
  const totalLaunchBlockers = stages.reduce(
    (sum, s) => sum + s.blockers.filter((b) => b.isLaunchBlocking).length,
    0,
  )
  const readinessScore = deriveReadinessScore(stages)
  const headline = buildReadinessHeadline(posture, totalLaunchBlockers)
  const rationale = buildReadinessRationale(posture, completedStageCount, stages.length)

  return {
    posture,
    stages,
    totalLaunchBlockers,
    completedStageCount,
    blockedStageCount,
    staleStageCount,
    readinessScore,
    headline,
    rationale,
    lastRefreshedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Top blockers helper
// ---------------------------------------------------------------------------

/**
 * Returns the top N blockers across all stages, sorted by severity then
 * launch-blocking precedence. Used for the workspace overview panel.
 */
export function getTopOnboardingBlockers(stages: OnboardingStage[], limit = 5): OnboardingBlocker[] {
  const severityOrder: Record<OnboardingBlockerSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    informational: 3,
  }
  const allBlockers = stages.flatMap((s) => s.blockers)
  return allBlockers
    .sort((a, b) => {
      // launch-blocking first, then by severity
      if (a.isLaunchBlocking !== b.isLaunchBlocking) {
        return a.isLaunchBlocking ? -1 : 1
      }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// CSS class helpers (consistent with existing workspace patterns)
// ---------------------------------------------------------------------------

/** Returns Tailwind classes for the workspace readiness posture banner. */
export function postureCardClass(posture: WorkspaceReadinessPosture): string {
  switch (posture) {
    case 'ready_for_handoff':
      return 'bg-green-950 border-green-700'
    case 'blocked':
      return 'bg-red-950 border-red-700'
    case 'stale':
      return 'bg-yellow-950 border-yellow-700'
    case 'partially_ready':
      return 'bg-blue-950 border-blue-700'
    case 'not_started':
      return 'bg-gray-800 border-gray-700'
  }
}

export function postureTextClass(posture: WorkspaceReadinessPosture): string {
  switch (posture) {
    case 'ready_for_handoff':
      return 'text-green-300'
    case 'blocked':
      return 'text-red-300'
    case 'stale':
      return 'text-yellow-300'
    case 'partially_ready':
      return 'text-blue-300'
    case 'not_started':
      return 'text-gray-300'
  }
}

export function postureBadgeClass(posture: WorkspaceReadinessPosture): string {
  switch (posture) {
    case 'ready_for_handoff':
      return 'bg-green-800 text-green-200'
    case 'blocked':
      return 'bg-red-800 text-red-200'
    case 'stale':
      return 'bg-yellow-800 text-yellow-200'
    case 'partially_ready':
      return 'bg-blue-800 text-blue-200'
    case 'not_started':
      return 'bg-gray-700 text-gray-300'
  }
}

/** Returns Tailwind classes for a stage status badge. */
export function stageStatusBadgeClass(status: OnboardingStageStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-800 text-green-200'
    case 'in_progress':
      return 'bg-blue-800 text-blue-200'
    case 'pending_review':
      return 'bg-indigo-800 text-indigo-200'
    case 'blocked':
      return 'bg-red-800 text-red-200'
    case 'stale':
      return 'bg-yellow-800 text-yellow-200'
    case 'not_started':
      return 'bg-gray-700 text-gray-400'
  }
}

/** Returns Tailwind classes for a blocker severity badge. */
export function blockerSeverityBadgeClass(severity: OnboardingBlockerSeverity): string {
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

// ---------------------------------------------------------------------------
// Queue management types and helpers
// ---------------------------------------------------------------------------

/**
 * Filter options for the compliance case queue.
 * All fields are optional; omitted fields apply no filter on that dimension.
 */
export interface CaseQueueFilter {
  /** Filter to only stages with one of these statuses */
  status?: string[]
  /** Filter to stages at or above this priority level */
  priority?: 'critical' | 'high' | 'medium' | 'low'
  /** Filter to stages assigned to this operator */
  assignee?: string
  /** If true, show only stages with stale evidence */
  overdueOnly?: boolean
  /** If true, show only stages with at least one critical blocker */
  escalatedOnly?: boolean
}

/** Key to sort the case queue by */
export type CaseSortKey = 'priority' | 'lastUpdated' | 'waitingDays' | 'stage'

/** Aggregated health counts for the queue summary bar */
export interface QueueHealthSummary {
  /** Total number of stages in the queue */
  total: number
  /** Stages with status 'pending_review' */
  pendingReview: number
  /** Stages with at least one critical blocker */
  escalated: number
  /** Stages with status 'stale' (evidence overdue) */
  overdue: number
  /** Stages with status 'complete' */
  readyForApproval: number
  /** Stages with status 'in_progress' */
  awaitingDocuments: number
  /** Stages that are degraded (blocked by data unavailability, not business blockers) */
  degradedCount: number
}

/**
 * Derives a queue health summary from a list of onboarding stages.
 * Used to populate the summary bar at the top of the workspace.
 */
export function deriveQueueHealth(cases: OnboardingStage[]): QueueHealthSummary {
  let pendingReview = 0
  let escalated = 0
  let overdue = 0
  let readyForApproval = 0
  let awaitingDocuments = 0
  let degradedCount = 0

  for (const stage of cases) {
    if (stage.status === 'pending_review') pendingReview++
    if (stage.status === 'stale') overdue++
    if (stage.status === 'complete') readyForApproval++
    if (stage.status === 'in_progress') awaitingDocuments++
    if (stage.blockers.some((b) => b.severity === 'critical')) escalated++
    // A stage is considered degraded when its only blocker references a data-load error
    if (
      stage.status === 'blocked' &&
      stage.blockers.length > 0 &&
      stage.blockers.every((b) => b.id.startsWith('degraded-'))
    ) {
      degradedCount++
    }
  }

  return {
    total: cases.length,
    pendingReview,
    escalated,
    overdue,
    readyForApproval,
    awaitingDocuments,
    degradedCount,
  }
}

/** Derives the effective priority for a stage (explicit override > highest blocker severity). */
function deriveEffectivePriority(stage: OnboardingStage): 'critical' | 'high' | 'medium' | 'low' {
  if (stage.priority) return stage.priority
  if (stage.blockers.length === 0) return 'low'
  const severityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low']
  for (const sev of severityOrder) {
    if (stage.blockers.some((b) => b.severity === sev)) return sev
  }
  return 'low'
}

const PRIORITY_RANK: Record<'critical' | 'high' | 'medium' | 'low', number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Applies a CaseQueueFilter to a list of stages and returns the matching subset.
 */
export function applyQueueFilter(
  cases: OnboardingStage[],
  filter: CaseQueueFilter,
): OnboardingStage[] {
  return cases.filter((stage) => {
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(stage.status)) return false
    }
    if (filter.priority) {
      const effective = deriveEffectivePriority(stage)
      if (PRIORITY_RANK[effective] > PRIORITY_RANK[filter.priority]) return false
    }
    if (filter.assignee) {
      if (stage.assignee !== filter.assignee) return false
    }
    if (filter.overdueOnly) {
      if (stage.status !== 'stale') return false
    }
    if (filter.escalatedOnly) {
      if (!stage.blockers.some((b) => b.severity === 'critical')) return false
    }
    return true
  })
}

/**
 * Returns a new array of stages sorted by the given sort key.
 * Does not mutate the input array.
 */
export function sortCases(cases: OnboardingStage[], sortKey: CaseSortKey): OnboardingStage[] {
  const copy = [...cases]
  switch (sortKey) {
    case 'priority':
      return copy.sort(
        (a, b) => PRIORITY_RANK[deriveEffectivePriority(a)] - PRIORITY_RANK[deriveEffectivePriority(b)],
      )
    case 'lastUpdated':
      return copy.sort((a, b) => {
        const aTime = a.lastActionAt ? new Date(a.lastActionAt).getTime() : 0
        const bTime = b.lastActionAt ? new Date(b.lastActionAt).getTime() : 0
        return bTime - aTime // most recent first
      })
    case 'waitingDays': {
      const now = Date.now()
      return copy.sort((a, b) => {
        const aWait = a.lastActionAt ? now - new Date(a.lastActionAt).getTime() : Infinity
        const bWait = b.lastActionAt ? now - new Date(b.lastActionAt).getTime() : Infinity
        return bWait - aWait // longest wait first
      })
    }
    case 'stage':
      return copy.sort(
        (a, b) =>
          ONBOARDING_STAGE_ORDER.indexOf(a.id as OnboardingStageId) -
          ONBOARDING_STAGE_ORDER.indexOf(b.id as OnboardingStageId),
      )
    default:
      return copy
  }
}

/**
 * Derives the plain-language next action an operator should take for a stage.
 * Returns a concise instruction string suitable for display in the stage card header.
 *
 * @param stage - The onboarding stage to evaluate
 * @returns A plain-language string describing the recommended next action
 */
export function deriveCaseNextAction(stage: OnboardingStage): string {
  switch (stage.status) {
    case 'complete':
      return 'No action required — stage is complete.'
    case 'not_started':
      return 'Begin this stage by initiating the required review process.'
    case 'in_progress': {
      if (stage.blockers.length > 0) {
        const top = stage.blockers.find((b) => b.isLaunchBlocking) ?? stage.blockers[0]
        return `Resolve blocker: ${top.title}`
      }
      return 'Continue progressing this stage and update the status when complete.'
    }
    case 'pending_review':
      return 'A compliance reviewer must sign off on this stage before it can proceed.'
    case 'blocked': {
      if (stage.blockers.length > 0) {
        const critical = stage.blockers.find((b) => b.severity === 'critical')
        const top = critical ?? stage.blockers[0]
        return `Resolve critical blocker: ${top.title}`
      }
      return 'Investigate and resolve the underlying issue blocking this stage.'
    }
    case 'stale':
      return 'Refresh the evidence package — current evidence is outside the 30-day validity window.'
    default:
      return 'Review the stage status and take appropriate corrective action.'
  }
}

/**
 * Interprets an API error value and returns a structured degraded-state descriptor.
 * Fail-closed: any non-null error is treated as degraded.
 */
export function deriveDegradedState(apiError: unknown): {
  isDegraded: boolean
  message: string
  actionableHint: string
} {
  if (apiError === null || apiError === undefined) {
    return {
      isDegraded: false,
      message: '',
      actionableHint: '',
    }
  }

  let message = 'Compliance data is currently unavailable.'
  if (apiError instanceof Error) {
    message = apiError.message
  } else if (typeof apiError === 'string' && apiError.length > 0) {
    message = apiError
  }

  return {
    isDegraded: true,
    message,
    actionableHint:
      'Launch readiness cannot be confirmed. Do not proceed with launch activities until this workspace shows live, verified data. Retry in a few minutes or contact the compliance team.',
  }
}

// ---------------------------------------------------------------------------
// Deterministic mock fixtures
// ---------------------------------------------------------------------------
// These fixtures cover the key states needed for unit and E2E tests:
//   - FIXTURE_READY:          all stages complete
//   - FIXTURE_BLOCKED:        KYC and AML stages blocked with critical issues
//   - FIXTURE_PARTIAL:        intake done, documentation and later stages open
//   - FIXTURE_STALE_EVIDENCE: stages complete but evidence past freshness window
//
// None of these fixtures silently flip a fail-closed state to a passing state.
// ---------------------------------------------------------------------------

const STALE_DATE = '2025-10-01T00:00:00Z' // >30 days ago
const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

export const MOCK_ONBOARDING_STAGES_READY: OnboardingStage[] = ONBOARDING_STAGE_ORDER.map((id) => ({
  id,
  label: ONBOARDING_STAGE_LABELS[id],
  description: ONBOARDING_STAGE_DESCRIPTIONS[id],
  status: 'complete' as OnboardingStageStatus,
  summary: `${ONBOARDING_STAGE_LABELS[id]} is complete. No outstanding actions.`,
  blockers: [],
  lastActionAt: RECENT_DATE,
  evidenceLinks: [{ label: 'View Evidence', path: '/compliance/evidence' }],
}))

export const MOCK_ONBOARDING_STAGES_BLOCKED: OnboardingStage[] = [
  {
    id: 'intake',
    label: ONBOARDING_STAGE_LABELS.intake,
    description: ONBOARDING_STAGE_DESCRIPTIONS.intake,
    status: 'complete',
    summary: 'All intake submissions are complete and validated.',
    blockers: [],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'documentation_review',
    label: ONBOARDING_STAGE_LABELS.documentation_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.documentation_review,
    status: 'complete',
    summary: 'Required documents submitted and verified.',
    blockers: [],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'identity_kyc_review',
    label: ONBOARDING_STAGE_LABELS.identity_kyc_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.identity_kyc_review,
    status: 'blocked',
    summary: 'KYC review for two investors is incomplete.',
    blockers: [
      {
        id: 'blk-kyc-001',
        stageId: 'identity_kyc_review',
        severity: 'critical',
        title: 'KYC documentation missing for investor ACME Holdings',
        reason:
          'ACME Holdings has not submitted identity verification documents. KYC cannot be completed without a government-issued ID and proof of address.',
        recommendedAction:
          'Contact ACME Holdings to submit the required KYC documentation through the onboarding portal.',
        remediationPath: '/compliance/setup',
        staleSince: null,
        isLaunchBlocking: true,
      },
      {
        id: 'blk-kyc-002',
        stageId: 'identity_kyc_review',
        severity: 'high',
        title: 'Identity discrepancy on investor Novex Capital',
        reason:
          'The submitted ID document does not match the registered entity name. Manual resolution is required.',
        recommendedAction:
          'Request updated identification from Novex Capital and re-run KYC verification.',
        remediationPath: '/compliance/setup',
        staleSince: null,
        isLaunchBlocking: true,
      },
    ],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'aml_risk_review',
    label: ONBOARDING_STAGE_LABELS.aml_risk_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.aml_risk_review,
    status: 'blocked',
    summary: 'AML screening has flagged one entity.',
    blockers: [
      {
        id: 'blk-aml-001',
        stageId: 'aml_risk_review',
        severity: 'critical',
        title: 'AML screening flagged Meridian Fund Ltd',
        reason:
          'Meridian Fund Ltd appeared on a sanctions watchlist during routine AML screening. The flag requires manual compliance officer review before proceeding.',
        recommendedAction:
          'Review the AML screening report and escalate to the compliance team for a manual decision. Document the outcome before clearing this blocker.',
        remediationPath: '/compliance/reporting',
        staleSince: null,
        isLaunchBlocking: true,
      },
    ],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'jurisdiction_review',
    label: ONBOARDING_STAGE_LABELS.jurisdiction_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.jurisdiction_review,
    status: 'not_started',
    summary: 'Jurisdiction review has not yet started.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'evidence_preparation',
    label: ONBOARDING_STAGE_LABELS.evidence_preparation,
    description: ONBOARDING_STAGE_DESCRIPTIONS.evidence_preparation,
    status: 'not_started',
    summary: 'Waiting for upstream stages to complete.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'approval_handoff',
    label: ONBOARDING_STAGE_LABELS.approval_handoff,
    description: ONBOARDING_STAGE_DESCRIPTIONS.approval_handoff,
    status: 'not_started',
    summary: 'Waiting for evidence package to be completed.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
]

export const MOCK_ONBOARDING_STAGES_PARTIAL: OnboardingStage[] = [
  {
    id: 'intake',
    label: ONBOARDING_STAGE_LABELS.intake,
    description: ONBOARDING_STAGE_DESCRIPTIONS.intake,
    status: 'complete',
    summary: 'Intake complete. All entities registered.',
    blockers: [],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'documentation_review',
    label: ONBOARDING_STAGE_LABELS.documentation_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.documentation_review,
    status: 'in_progress',
    summary: '3 of 5 documents verified. 2 items pending operator review.',
    blockers: [
      {
        id: 'blk-doc-001',
        stageId: 'documentation_review',
        severity: 'medium',
        title: 'Certificate of incorporation not yet reviewed',
        reason:
          'The certificate of incorporation for the issuer was submitted but has not been reviewed by a compliance officer.',
        recommendedAction: 'Assign the document to a reviewer and confirm validity within 5 business days.',
        remediationPath: '/compliance/setup',
        staleSince: null,
        isLaunchBlocking: false,
      },
    ],
    lastActionAt: RECENT_DATE,
    evidenceLinks: [],
  },
  {
    id: 'identity_kyc_review',
    label: ONBOARDING_STAGE_LABELS.identity_kyc_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.identity_kyc_review,
    status: 'not_started',
    summary: 'KYC review will begin once documentation is complete.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'aml_risk_review',
    label: ONBOARDING_STAGE_LABELS.aml_risk_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.aml_risk_review,
    status: 'not_started',
    summary: 'AML review will begin after KYC is cleared.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'jurisdiction_review',
    label: ONBOARDING_STAGE_LABELS.jurisdiction_review,
    description: ONBOARDING_STAGE_DESCRIPTIONS.jurisdiction_review,
    status: 'not_started',
    summary: 'Jurisdiction review has not started.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'evidence_preparation',
    label: ONBOARDING_STAGE_LABELS.evidence_preparation,
    description: ONBOARDING_STAGE_DESCRIPTIONS.evidence_preparation,
    status: 'not_started',
    summary: 'Waiting for upstream stages to complete.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
  {
    id: 'approval_handoff',
    label: ONBOARDING_STAGE_LABELS.approval_handoff,
    description: ONBOARDING_STAGE_DESCRIPTIONS.approval_handoff,
    status: 'not_started',
    summary: 'Handoff will be available once all stages are complete.',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
  },
]

export const MOCK_ONBOARDING_STAGES_STALE: OnboardingStage[] = ONBOARDING_STAGE_ORDER.map((id) => ({
  id,
  label: ONBOARDING_STAGE_LABELS[id],
  description: ONBOARDING_STAGE_DESCRIPTIONS[id],
  status: 'stale' as OnboardingStageStatus,
  summary: `${ONBOARDING_STAGE_LABELS[id]} evidence is past the 30-day freshness window.`,
  blockers: [
    {
      id: `blk-stale-${id}`,
      stageId: id,
      severity: 'high' as OnboardingBlockerSeverity,
      title: `Stale evidence in ${ONBOARDING_STAGE_LABELS[id]}`,
      reason: 'Evidence was last verified more than 30 days ago and must be refreshed before handoff.',
      recommendedAction: 'Refresh the evidence package and re-verify all items in this stage.',
      remediationPath: '/compliance/evidence',
      staleSince: STALE_DATE,
      isLaunchBlocking: true,
    },
  ],
  lastActionAt: STALE_DATE,
  evidenceLinks: [{ label: 'Refresh Evidence', path: '/compliance/evidence' }],
}))
