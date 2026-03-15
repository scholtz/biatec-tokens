/**
 * Remediation Workflow — typed interfaces and helper utilities.
 *
 * Provides the data model and orchestration logic for the remediation task
 * queue inside the enterprise approval cockpit. Designed for backend-readiness:
 * all interfaces can be hydrated from a future remediation/task API.
 *
 * Key concepts:
 *  - RemediationTask     — a concrete follow-up action derived from a blocker
 *  - OwnerDomain         — which team is responsible for the next step
 *  - RemediationUrgency  — how time-sensitive the item is
 *  - EvidenceFreshness   — whether evidence supporting a task is current
 *  - HandoffState        — which domain is waiting on which other domain
 */

import type { ApprovalStage, StageBlocker, ReviewerRole } from './approvalCockpit'
import { isEvidenceStale, formatStalenessLabel, isBlockingStatus } from './approvalCockpit'

// ---------------------------------------------------------------------------
// Owner domains
// ---------------------------------------------------------------------------

export type OwnerDomain =
  | 'compliance'
  | 'legal'
  | 'procurement'
  | 'executive'
  | 'shared_ops'
  | 'unassigned'

export const OWNER_DOMAIN_LABELS: Record<OwnerDomain, string> = {
  compliance: 'Compliance',
  legal: 'Legal',
  procurement: 'Procurement',
  executive: 'Executive',
  shared_ops: 'Shared Operations',
  unassigned: 'Unassigned',
}

export const OWNER_DOMAIN_DESCRIPTIONS: Record<OwnerDomain, string> = {
  compliance:
    'The compliance operator team is responsible for preparing evidence, refreshing KYC/AML packages, and confirming regulatory checklists.',
  legal:
    'The legal reviewer team is responsible for policy review, jurisdiction analysis, and regulatory acceptability sign-off.',
  procurement:
    'The procurement reviewer team is responsible for vendor assessment, operational dependency review, and evidence gap resolution.',
  executive:
    'The executive sponsor is responsible for final launch authorization and cross-functional escalation decisions.',
  shared_ops:
    'A shared operational prerequisite that requires coordination across multiple teams before any single domain can progress.',
  unassigned:
    'No owner has yet claimed responsibility for this item. Escalation may be required.',
}

/** Maps reviewer roles to owner domains for task derivation */
export const ROLE_TO_DOMAIN: Record<ReviewerRole, OwnerDomain> = {
  compliance_operator: 'compliance',
  legal_reviewer: 'legal',
  procurement_reviewer: 'procurement',
  executive_sponsor: 'executive',
}

// ---------------------------------------------------------------------------
// Remediation urgency
// ---------------------------------------------------------------------------

export type RemediationUrgency = 'critical' | 'high' | 'medium' | 'advisory'

export const REMEDIATION_URGENCY_LABELS: Record<RemediationUrgency, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  advisory: 'Advisory',
}

export const REMEDIATION_URGENCY_DESCRIPTIONS: Record<RemediationUrgency, string> = {
  critical: 'Must be resolved before the launch can proceed. Blocking all downstream review stages.',
  high: 'Should be resolved soon. Significant risk to timeline or regulatory posture if left unaddressed.',
  medium: 'Requires attention before final sign-off, but does not block intermediate review steps.',
  advisory:
    'Informational follow-up. Recommended for launch confidence but not mandatory to unblock the queue.',
}

// ---------------------------------------------------------------------------
// Evidence freshness
// ---------------------------------------------------------------------------

export type EvidenceFreshness = 'fresh' | 'stale' | 'missing'

export const EVIDENCE_FRESHNESS_LABELS: Record<EvidenceFreshness, string> = {
  fresh: 'Evidence current',
  stale: 'Evidence stale',
  missing: 'No evidence',
}

export const EVIDENCE_FRESHNESS_EXPLANATIONS: Record<EvidenceFreshness, string> = {
  fresh:
    'Supporting evidence was updated within the acceptable window. No refresh is needed at this time.',
  stale:
    'Supporting evidence is older than the acceptable freshness window (30 days). This evidence should be refreshed before it can be relied upon for launch sign-off. Proceeding with stale evidence increases regulatory and audit risk.',
  missing:
    'No supporting evidence has been submitted or linked for this item. Evidence must be provided before this item can be reviewed.',
}

// ---------------------------------------------------------------------------
// Handoff state
// ---------------------------------------------------------------------------

export type HandoffState =
  | 'no_handoff'
  | 'waiting_on_compliance'
  | 'waiting_on_legal'
  | 'waiting_on_procurement'
  | 'waiting_on_executive'
  | 'waiting_on_shared_ops'
  | 'waiting_on_multiple'

export const HANDOFF_STATE_LABELS: Record<HandoffState, string> = {
  no_handoff: 'No upstream dependency',
  waiting_on_compliance: 'Waiting on Compliance',
  waiting_on_legal: 'Waiting on Legal',
  waiting_on_procurement: 'Waiting on Procurement',
  waiting_on_executive: 'Waiting on Executive',
  waiting_on_shared_ops: 'Waiting on Shared Operations',
  waiting_on_multiple: 'Waiting on multiple teams',
}

// ---------------------------------------------------------------------------
// Remediation task
// ---------------------------------------------------------------------------

export interface RemediationTask {
  /** Unique task identifier */
  id: string
  /** Stage this task belongs to */
  stageId: string
  /** Plain-language action title */
  title: string
  /** Full description of the follow-up action */
  description: string
  /** One-sentence action summary for overview views */
  actionSummary: string
  /** Why resolving this task matters for launch readiness */
  impactStatement: string
  /** Which team or role owns the next action */
  ownerDomain: OwnerDomain
  /** How urgent this task is */
  urgency: RemediationUrgency
  /** Whether resolving this task is required before launch */
  isLaunchBlocking: boolean
  /** Whether this is a hard blocker (vs. a conditional or follow-up) */
  isHardBlocker: boolean
  /** Current freshness state of the supporting evidence */
  evidenceFreshness: EvidenceFreshness
  /** ISO timestamp of last evidence update (null if missing) */
  lastEvidenceAt: string | null
  /** Human-friendly staleness label (e.g. "45 days ago") */
  stalenessLabel: string | null
  /** Task IDs that must be completed before this task can start */
  dependsOn: string[]
  /** Which team this task is currently waiting on (if upstream blocked) */
  handoffState: HandoffState
  /** Plain-language description of the handoff context */
  handoffNote: string | null
  /** Path to the relevant evidence or fix surface (nullable) */
  remediationPath: string | null
  /** Optional deeper explanation for stale evidence (shown in expanded detail) */
  stalenessExplanation: string | null
}

// ---------------------------------------------------------------------------
// Grouped remediation state
// ---------------------------------------------------------------------------

export interface StageRemediationGroup {
  stageId: string
  stageLabel: string
  ownerDomain: OwnerDomain
  isStageBlocking: boolean
  blockingTasks: RemediationTask[]
  advisoryTasks: RemediationTask[]
  handoffState: HandoffState
  handoffSummary: string | null
}

export interface RemediationWorkflowState {
  /** All derived tasks across all stages, flat */
  allTasks: RemediationTask[]
  /** Tasks grouped by stage for display */
  stageGroups: StageRemediationGroup[]
  /** Total launch-blocking task count */
  launchBlockingCount: number
  /** Count of tasks with stale evidence */
  staleEvidenceCount: number
  /** Count of tasks with no owner assigned */
  unassignedCount: number
  /** Whether any stage is waiting on another stage's output */
  hasHandoffDependencies: boolean
  /** Highest urgency level across all blocking tasks */
  topUrgency: RemediationUrgency | null
}

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

/**
 * Maps a blocker's isLaunchBlocking + severity to a RemediationUrgency.
 */
export function blockerToUrgency(
  isLaunchBlocking: boolean,
  severity: StageBlocker['severity'],
): RemediationUrgency {
  if (!isLaunchBlocking) return 'advisory'
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'informational':
      return 'advisory'
  }
}

/**
 * Derives the evidence freshness status from a staleSince timestamp.
 */
export function deriveFreshness(staleSince: string | null, now: number = Date.now()): EvidenceFreshness {
  if (staleSince === null) return 'missing'
  if (isEvidenceStale(staleSince, now)) return 'stale'
  return 'fresh'
}

/**
 * Derives the handoff state for a stage given its upstream dependencies.
 * If the stage is waiting because another stage with a different domain is blocked,
 * it surfaces the handoff.
 */
export function deriveHandoffState(
  stageRole: ReviewerRole,
  allStages: ApprovalStage[],
): HandoffState {
  const myDomain = ROLE_TO_DOMAIN[stageRole]

  // Find any stage earlier in the list that is currently blocking
  const blockingUpstream = allStages.filter(
    (s) => isBlockingStatus(s.status) && ROLE_TO_DOMAIN[s.role] !== myDomain,
  )

  if (blockingUpstream.length === 0) return 'no_handoff'

  const domains = [...new Set(blockingUpstream.map((s) => ROLE_TO_DOMAIN[s.role]))]
  if (domains.length > 1) return 'waiting_on_multiple'

  const domain = domains[0]
  switch (domain) {
    case 'compliance':
      return 'waiting_on_compliance'
    case 'legal':
      return 'waiting_on_legal'
    case 'procurement':
      return 'waiting_on_procurement'
    case 'executive':
      return 'waiting_on_executive'
    case 'shared_ops':
      return 'waiting_on_shared_ops'
    default:
      return 'no_handoff'
  }
}

/**
 * Builds a plain-language handoff note for display in the UI.
 */
export function buildHandoffNote(handoffState: HandoffState, stageLabel: string): string | null {
  switch (handoffState) {
    case 'no_handoff':
      return null
    case 'waiting_on_compliance':
      return `${stageLabel} is waiting for the Compliance team to resolve outstanding evidence issues before this stage can proceed.`
    case 'waiting_on_legal':
      return `${stageLabel} is waiting for the Legal team to complete their review before this stage can advance.`
    case 'waiting_on_procurement':
      return `${stageLabel} is waiting for the Procurement team to confirm vendor and operational readiness.`
    case 'waiting_on_executive':
      return `${stageLabel} is awaiting Executive sign-off before this stage can be finalized.`
    case 'waiting_on_shared_ops':
      return `${stageLabel} is waiting on a shared operational prerequisite that must be resolved by multiple teams.`
    case 'waiting_on_multiple':
      return `${stageLabel} is currently waiting on multiple upstream teams. All upstream blockers must be resolved before this stage can progress.`
  }
}

/**
 * Builds the staleness explanation for a task.
 */
export function buildStalenessExplanation(
  freshness: EvidenceFreshness,
  label: string | null,
): string | null {
  if (freshness === 'fresh') return null
  if (freshness === 'missing')
    return EVIDENCE_FRESHNESS_EXPLANATIONS.missing
  return `Evidence was last updated ${label ?? 'some time ago'}. ${EVIDENCE_FRESHNESS_EXPLANATIONS.stale}`
}

// ---------------------------------------------------------------------------
// Task derivation
// ---------------------------------------------------------------------------

/**
 * Derives a list of RemediationTask objects from a single ApprovalStage.
 * One task is created per blocker, plus a catch-all task for stages with
 * no evidence or no reviewer assignment.
 */
export function deriveTasksFromStage(
  stage: ApprovalStage,
  allStages: ApprovalStage[],
  now: number = Date.now(),
): RemediationTask[] {
  const tasks: RemediationTask[] = []
  const ownerDomain = ROLE_TO_DOMAIN[stage.role]
  const handoffState = deriveHandoffState(stage.role, allStages)
  const handoffNote = buildHandoffNote(handoffState, stage.label)

  for (const blocker of stage.blockers) {
    const urgency = blockerToUrgency(blocker.isLaunchBlocking, blocker.severity)
    const freshness = blocker.staleSince !== null ? deriveFreshness(blocker.staleSince, now) : 'missing'
    const stalenessLabel = formatStalenessLabel(blocker.staleSince, now)
    const stalenessExplanation = buildStalenessExplanation(freshness, stalenessLabel)

    tasks.push({
      id: `task-${stage.id}-${blocker.id}`,
      stageId: stage.id,
      title: blocker.title,
      description: blocker.reason,
      actionSummary: blocker.action,
      impactStatement: buildImpactStatement(blocker, stage),
      ownerDomain,
      urgency,
      isLaunchBlocking: blocker.isLaunchBlocking,
      isHardBlocker: blocker.severity === 'critical' || blocker.severity === 'high',
      evidenceFreshness: freshness,
      lastEvidenceAt: blocker.staleSince,
      stalenessLabel,
      dependsOn: [],
      handoffState,
      handoffNote,
      remediationPath: blocker.evidencePath,
      stalenessExplanation,
    })
  }

  return tasks
}

/**
 * Builds a plain-language impact statement for a blocker.
 */
export function buildImpactStatement(blocker: StageBlocker, stage: ApprovalStage): string {
  if (blocker.isLaunchBlocking) {
    return `This issue prevents the ${stage.label} stage from proceeding and blocks the overall launch until resolved.`
  }
  return `This follow-up does not block the current ${stage.label} stage but should be addressed before final launch sign-off.`
}

/**
 * Derives a StageRemediationGroup for a single stage.
 */
export function buildStageGroup(
  stage: ApprovalStage,
  tasks: RemediationTask[],
  allStages: ApprovalStage[],
): StageRemediationGroup {
  const stageTasks = tasks.filter((t) => t.stageId === stage.id)
  const blockingTasks = stageTasks.filter((t) => t.isLaunchBlocking)
  const advisoryTasks = stageTasks.filter((t) => !t.isLaunchBlocking)
  const handoffState = deriveHandoffState(stage.role, allStages)
  const handoffSummary = buildHandoffNote(handoffState, stage.label)

  return {
    stageId: stage.id,
    stageLabel: stage.label,
    ownerDomain: ROLE_TO_DOMAIN[stage.role],
    isStageBlocking: isBlockingStatus(stage.status),
    blockingTasks,
    advisoryTasks,
    handoffState,
    handoffSummary,
  }
}

/**
 * Derives the full RemediationWorkflowState from a list of ApprovalStages.
 */
export function deriveRemediationWorkflow(
  stages: ApprovalStage[],
  now: number = Date.now(),
): RemediationWorkflowState {
  const allTasks = stages.flatMap((s) => deriveTasksFromStage(s, stages, now))
  const stageGroups = stages.map((s) => buildStageGroup(s, allTasks, stages))

  const launchBlockingCount = allTasks.filter((t) => t.isLaunchBlocking).length
  const staleEvidenceCount = allTasks.filter((t) => t.evidenceFreshness === 'stale').length
  const unassignedCount = allTasks.filter((t) => t.ownerDomain === 'unassigned').length
  const hasHandoffDependencies = stageGroups.some((g) => g.handoffState !== 'no_handoff')

  const urgencyOrder: RemediationUrgency[] = ['critical', 'high', 'medium', 'advisory']
  const blockingTaskUrgencies = allTasks
    .filter((t) => t.isLaunchBlocking)
    .map((t) => t.urgency)
  const topUrgency = urgencyOrder.find((u) => blockingTaskUrgencies.includes(u)) ?? null

  return {
    allTasks,
    stageGroups,
    launchBlockingCount,
    staleEvidenceCount,
    unassignedCount,
    hasHandoffDependencies,
    topUrgency,
  }
}

// ---------------------------------------------------------------------------
// Prioritization helpers
// ---------------------------------------------------------------------------

const URGENCY_ORDER: Record<RemediationUrgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  advisory: 3,
}

/**
 * Sorts tasks: blocking first, then by urgency, then by freshness (stale first).
 */
export function prioritizeTasks(tasks: RemediationTask[]): RemediationTask[] {
  return [...tasks].sort((a, b) => {
    // Launch-blocking first
    if (a.isLaunchBlocking !== b.isLaunchBlocking) {
      return a.isLaunchBlocking ? -1 : 1
    }
    // By urgency
    const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    // Stale evidence before fresh
    if (a.evidenceFreshness !== b.evidenceFreshness) {
      if (a.evidenceFreshness === 'stale') return -1
      if (b.evidenceFreshness === 'stale') return 1
    }
    return 0
  })
}

// ---------------------------------------------------------------------------
// Summary / escalation helpers
// ---------------------------------------------------------------------------

/**
 * Returns a plain-language escalation message when evidence is stale on a
 * launch-blocking task.
 */
export function getEscalationMessage(task: RemediationTask): string | null {
  if (task.evidenceFreshness !== 'stale') return null
  if (!task.isLaunchBlocking) {
    return `The evidence supporting "${task.title}" is outdated (${task.stalenessLabel ?? 'stale'}). While not currently launch-blocking, refreshing this evidence is recommended before final sign-off.`
  }
  return `The evidence supporting "${task.title}" is outdated (${task.stalenessLabel ?? 'stale'}) and this item blocks the launch. Refreshing this evidence is required before the ${task.stageId} stage can be approved.`
}

/**
 * Returns a concise handoff summary suitable for the cockpit overview.
 * Returns null when there are no active handoffs.
 */
export function getWorkflowHandoffSummary(state: RemediationWorkflowState): string | null {
  const waiting = state.stageGroups.filter((g) => g.handoffState !== 'no_handoff')
  if (waiting.length === 0) return null

  const labels = waiting.map((g) => HANDOFF_STATE_LABELS[g.handoffState])
  const unique = [...new Set(labels)]
  return `${waiting.length} stage${waiting.length === 1 ? '' : 's'} ${waiting.length === 1 ? 'is' : 'are'} currently blocked by upstream handoffs: ${unique.join(', ')}.`
}

/**
 * Returns urgency badge CSS classes (solid backgrounds for WCAG contrast).
 */
export function urgencyBadgeClass(urgency: RemediationUrgency): string {
  switch (urgency) {
    case 'critical':
      return 'bg-red-800 text-red-200'
    case 'high':
      return 'bg-orange-800 text-orange-200'
    case 'medium':
      return 'bg-yellow-800 text-yellow-200'
    case 'advisory':
      return 'bg-gray-700 text-gray-300'
  }
}

/**
 * Returns border + background classes for a task card based on urgency.
 */
export function taskCardClass(urgency: RemediationUrgency, isLaunchBlocking: boolean): string {
  if (!isLaunchBlocking) return 'border-gray-700 bg-gray-800'
  switch (urgency) {
    case 'critical':
      return 'border-red-800 bg-red-950'
    case 'high':
      return 'border-orange-800 bg-orange-950'
    case 'medium':
      return 'border-yellow-800 bg-yellow-950'
    case 'advisory':
      return 'border-gray-700 bg-gray-800'
  }
}

/**
 * Returns CSS classes for evidence freshness indicator.
 */
export function freshnessBadgeClass(freshness: EvidenceFreshness): string {
  switch (freshness) {
    case 'fresh':
      return 'bg-green-800 text-green-200'
    case 'stale':
      return 'bg-orange-800 text-orange-200'
    case 'missing':
      return 'bg-gray-700 text-gray-300'
  }
}
