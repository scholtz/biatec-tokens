/**
 * complianceOperationsCockpit.ts
 *
 * Typed helpers and data models for the role-aware compliance operations cockpit.
 * Provides queue-health metrics, SLA urgency classification, ownership signals,
 * and cross-workspace handoff readiness derivation.
 *
 * Design principles
 * -----------------
 * - Fail-closed: absent data treated as degraded, not optimistic.
 * - Backend-ready: all interfaces can be hydrated from a compliance case API.
 * - No wallet assumptions. Language is enterprise/compliance-oriented.
 * - Reuses BlockerSeverity and related conventions from approvalCockpit.ts.
 */

// ---------------------------------------------------------------------------
// Operator roles
// ---------------------------------------------------------------------------

export type OperatorRole =
  | 'compliance_analyst'
  | 'operations_lead'
  | 'sign_off_approver'
  | 'team_lead'

export const OPERATOR_ROLE_LABELS: Record<OperatorRole, string> = {
  compliance_analyst: 'Compliance Analyst',
  operations_lead: 'Operations Lead',
  sign_off_approver: 'Sign-Off Approver',
  team_lead: 'Team Lead',
}

// ---------------------------------------------------------------------------
// Ownership states
// ---------------------------------------------------------------------------

export type OwnershipState =
  | 'assigned_to_me'
  | 'assigned_to_team'
  | 'unassigned'
  | 'blocked_by_external'
  | 'escalated'

export const OWNERSHIP_STATE_LABELS: Record<OwnershipState, string> = {
  assigned_to_me: 'Assigned to Me',
  assigned_to_team: 'Assigned to Team',
  unassigned: 'Unassigned',
  blocked_by_external: 'Blocked by External Input',
  escalated: 'Escalated',
}

export const OWNERSHIP_STATE_DESCRIPTIONS: Record<OwnershipState, string> = {
  assigned_to_me: 'This item is currently assigned to you and requires your action.',
  assigned_to_team: 'This item is assigned to your team but not yet claimed by a specific operator.',
  unassigned: 'No owner has been assigned. This item may require escalation.',
  blocked_by_external: 'Progress is waiting on input or action from a party outside the operations team.',
  escalated: 'This item has been escalated to senior leadership or an external authority.',
}

// ---------------------------------------------------------------------------
// SLA urgency bands
// ---------------------------------------------------------------------------

export type SlaUrgency = 'overdue' | 'due_soon' | 'on_track' | 'no_deadline'

export const SLA_URGENCY_LABELS: Record<SlaUrgency, string> = {
  overdue: 'Overdue',
  due_soon: 'Due Soon',
  on_track: 'On Track',
  no_deadline: 'No Deadline',
}

export const SLA_URGENCY_DESCRIPTIONS: Record<SlaUrgency, string> = {
  overdue: 'The SLA deadline has been breached. Immediate action required.',
  due_soon: 'The SLA deadline is approaching within 24 hours. Action is needed soon.',
  on_track: 'The item is within its SLA window and progressing normally.',
  no_deadline: 'No SLA deadline has been set for this item.',
}

/** Due-soon threshold in hours */
export const SLA_DUE_SOON_HOURS = 24

/**
 * Classify the SLA urgency of an item given its due timestamp and the current time.
 * Treats null (no deadline) as 'no_deadline'. Treats past dates as 'overdue'.
 */
export function classifySlaUrgency(duAt: string | null, now: number = Date.now()): SlaUrgency {
  if (!duAt) return 'no_deadline'
  const dueMs = new Date(duAt).getTime()
  if (isNaN(dueMs)) return 'no_deadline'
  if (dueMs <= now) return 'overdue'
  const hoursRemaining = (dueMs - now) / (1000 * 60 * 60)
  if (hoursRemaining <= SLA_DUE_SOON_HOURS) return 'due_soon'
  return 'on_track'
}

// ---------------------------------------------------------------------------
// Workflow stages
// ---------------------------------------------------------------------------

export type CockpitWorkflowStage =
  | 'onboarding'
  | 'document_review'
  | 'kyc_aml'
  | 'remediation'
  | 'approval'
  | 'reporting'

export const COCKPIT_STAGE_LABELS: Record<CockpitWorkflowStage, string> = {
  onboarding: 'Investor Onboarding',
  document_review: 'Document Review',
  kyc_aml: 'KYC / AML Review',
  remediation: 'Remediation',
  approval: 'Approval',
  reporting: 'Reporting',
}

export const COCKPIT_STAGE_PATHS: Record<CockpitWorkflowStage, string> = {
  onboarding: '/compliance/onboarding',
  document_review: '/compliance/onboarding',
  kyc_aml: '/compliance/onboarding',
  remediation: '/compliance/approval',
  approval: '/compliance/approval',
  reporting: '/compliance/reporting',
}

// ---------------------------------------------------------------------------
// Work item
// ---------------------------------------------------------------------------

export type WorkItemStatus =
  | 'open'
  | 'in_progress'
  | 'pending_review'
  | 'blocked'
  | 'approval_ready'
  | 'overdue'
  | 'escalated'
  | 'complete'

export const WORK_ITEM_STATUS_LABELS: Record<WorkItemStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  blocked: 'Blocked',
  approval_ready: 'Approval Ready',
  overdue: 'Overdue',
  escalated: 'Escalated',
  complete: 'Complete',
}

export interface WorkItem {
  id: string
  /** Plain-language title visible in the task list */
  title: string
  /** The stage this work item belongs to */
  stage: CockpitWorkflowStage
  /** Current workflow status */
  status: WorkItemStatus
  /** Current ownership state */
  ownership: OwnershipState
  /** ISO timestamp when the item was last acted upon */
  lastActionAt: string | null
  /** ISO timestamp for SLA deadline */
  dueAt: string | null
  /** Optional link to the specific workspace handling this item */
  workspacePath: string
  /** Optional note or description */
  note: string | null
  /** Whether this item is considered launch-blocking */
  isLaunchBlocking: boolean
}

// ---------------------------------------------------------------------------
// Queue health
// ---------------------------------------------------------------------------

export interface QueueHealthMetrics {
  /** Total active work items (not complete) */
  total: number
  /** Items with overdue SLA */
  overdue: number
  /** Items due soon (within 24h) */
  dueSoon: number
  /** Items with blocked status */
  blocked: number
  /** Items ready for approval handoff */
  approvalReady: number
  /** Items with no owner assigned */
  unassigned: number
  /** Items assigned to current operator */
  assignedToMe: number
  /** Items pending escalation review */
  escalated: number
}

/**
 * Derive queue health metrics from a list of work items.
 * Considers only active (non-complete) items unless countAll is true.
 */
export function deriveQueueHealth(
  items: WorkItem[],
  now: number = Date.now(),
): QueueHealthMetrics {
  const active = items.filter((i) => i.status !== 'complete')
  return {
    total: active.length,
    overdue: active.filter(
      (i) => i.status === 'overdue' || classifySlaUrgency(i.dueAt, now) === 'overdue',
    ).length,
    dueSoon: active.filter(
      (i) =>
        i.status !== 'overdue' &&
        classifySlaUrgency(i.dueAt, now) === 'due_soon',
    ).length,
    blocked: active.filter((i) => i.status === 'blocked').length,
    approvalReady: active.filter((i) => i.status === 'approval_ready').length,
    unassigned: active.filter((i) => i.ownership === 'unassigned').length,
    assignedToMe: active.filter((i) => i.ownership === 'assigned_to_me').length,
    escalated: active.filter((i) => i.status === 'escalated' || i.ownership === 'escalated').length,
  }
}

// ---------------------------------------------------------------------------
// Bottleneck analysis
// ---------------------------------------------------------------------------

export interface StageBottleneck {
  stage: CockpitWorkflowStage
  label: string
  /** Count of blocked or overdue items in this stage */
  blockedCount: number
  /** Count of items approaching deadline in this stage */
  dueSoonCount: number
  /** Count of unassigned items in this stage */
  unassignedCount: number
  /** Whether this stage has items that are launch-blocking */
  hasLaunchBlockers: boolean
  /** Path to the workspace for this stage */
  workspacePath: string
}

/**
 * Derive bottleneck analysis grouped by stage, ordered by severity.
 * A stage is considered a bottleneck if it has blocked, overdue, or unassigned items.
 */
export function deriveStageBottlenecks(
  items: WorkItem[],
  now: number = Date.now(),
): StageBottleneck[] {
  const stages: CockpitWorkflowStage[] = [
    'onboarding',
    'document_review',
    'kyc_aml',
    'remediation',
    'approval',
    'reporting',
  ]

  return stages
    .map((stage) => {
      const stageItems = items.filter((i) => i.stage === stage && i.status !== 'complete')
      return {
        stage,
        label: COCKPIT_STAGE_LABELS[stage],
        blockedCount: stageItems.filter(
          (i) =>
            i.status === 'blocked' ||
            i.status === 'overdue' ||
            classifySlaUrgency(i.dueAt, now) === 'overdue',
        ).length,
        dueSoonCount: stageItems.filter(
          (i) => classifySlaUrgency(i.dueAt, now) === 'due_soon',
        ).length,
        unassignedCount: stageItems.filter((i) => i.ownership === 'unassigned').length,
        hasLaunchBlockers: stageItems.some((i) => i.isLaunchBlocking),
        workspacePath: COCKPIT_STAGE_PATHS[stage],
      } satisfies StageBottleneck
    })
    .filter((b) => b.blockedCount > 0 || b.dueSoonCount > 0 || b.unassignedCount > 0)
    .sort((a, b) => {
      // Sort by: blocked first, then due-soon, then unassigned
      const scoreA = a.blockedCount * 3 + a.dueSoonCount * 2 + a.unassignedCount
      const scoreB = b.blockedCount * 3 + b.dueSoonCount * 2 + b.unassignedCount
      return scoreB - scoreA
    })
}

// ---------------------------------------------------------------------------
// Handoff readiness
// ---------------------------------------------------------------------------

export type HandoffReadiness = 'ready' | 'has_warnings' | 'not_ready' | 'unknown'

export const HANDOFF_READINESS_LABELS: Record<HandoffReadiness, string> = {
  ready: 'Ready for Handoff',
  has_warnings: 'Ready with Warnings',
  not_ready: 'Not Ready — Blockers Present',
  unknown: 'Readiness Unknown',
}

export interface DownstreamHandoff {
  id: string
  /** Label shown in the handoff card */
  label: string
  /** Short description of what the handoff involves */
  description: string
  /** Destination workspace path */
  path: string
  /** Whether the destination workspace is ready to receive handoff */
  readiness: HandoffReadiness
  /** Count of issues preventing handoff */
  blockerCount: number
  /** Count of warnings (non-blocking issues) */
  warningCount: number
}

/**
 * Derive the readiness posture for a downstream handoff workspace.
 * Considers blocked and overdue items in the relevant stage(s).
 */
export function deriveHandoffReadiness(
  stage: CockpitWorkflowStage,
  items: WorkItem[],
  now: number = Date.now(),
): HandoffReadiness {
  const relevant = items.filter((i) => i.stage === stage && i.status !== 'complete')
  if (relevant.length === 0) return 'unknown'

  const blockers = relevant.filter(
    (i) =>
      i.status === 'blocked' ||
      (i.status === 'overdue' && i.isLaunchBlocking) ||
      classifySlaUrgency(i.dueAt, now) === 'overdue',
  )
  if (blockers.length > 0) return 'not_ready'

  const warnings = relevant.filter(
    (i) =>
      i.status === 'escalated' ||
      classifySlaUrgency(i.dueAt, now) === 'due_soon',
  )
  if (warnings.length > 0) return 'has_warnings'

  return 'ready'
}

// ---------------------------------------------------------------------------
// Cockpit overall posture
// ---------------------------------------------------------------------------

export type CockpitPosture = 'clear' | 'attention_required' | 'critical' | 'degraded'

export const COCKPIT_POSTURE_LABELS: Record<CockpitPosture, string> = {
  clear: 'Queue Clear',
  attention_required: 'Attention Required',
  critical: 'Critical Issues',
  degraded: 'System Degraded',
}

export const COCKPIT_POSTURE_DESCRIPTIONS: Record<CockpitPosture, string> = {
  clear: 'All queues are clear. No overdue or blocked items require immediate attention.',
  attention_required:
    'Some items are approaching deadlines or require assignment. Review the worklist.',
  critical:
    'One or more launch-blocking items are overdue or blocked. Immediate action is required.',
  degraded:
    'The operations cockpit is operating with incomplete data. Some metrics may be unavailable.',
}

/**
 * Derive the overall cockpit posture from queue health metrics.
 */
export function deriveCockpitPosture(
  metrics: QueueHealthMetrics,
  isDataAvailable: boolean,
): CockpitPosture {
  if (!isDataAvailable) return 'degraded'
  if (metrics.overdue > 0 || metrics.blocked > 0) return 'critical'
  if (metrics.dueSoon > 0 || metrics.unassigned > 0 || metrics.escalated > 0)
    return 'attention_required'
  return 'clear'
}

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

/** Returns Tailwind CSS classes for the posture banner */
export function cockpitPostureBannerClass(posture: CockpitPosture): string {
  switch (posture) {
    case 'clear':
      return 'bg-green-900 border-green-700'
    case 'attention_required':
      return 'bg-yellow-900 border-yellow-700'
    case 'critical':
      return 'bg-red-900 border-red-700'
    case 'degraded':
      return 'bg-gray-800 border-gray-600'
  }
}

/** Returns Tailwind CSS classes for the posture icon background */
export function cockpitPostureIconClass(posture: CockpitPosture): string {
  switch (posture) {
    case 'clear':
      return 'bg-green-600'
    case 'attention_required':
      return 'bg-yellow-600'
    case 'critical':
      return 'bg-red-600'
    case 'degraded':
      return 'bg-gray-600'
  }
}

/** Returns Tailwind CSS classes for a work item status badge */
export function workItemStatusBadgeClass(status: WorkItemStatus): string {
  switch (status) {
    case 'open':
      return 'bg-gray-700 text-gray-200'
    case 'in_progress':
      return 'bg-blue-800 text-blue-100'
    case 'pending_review':
      return 'bg-indigo-800 text-indigo-100'
    case 'blocked':
      return 'bg-red-800 text-red-100'
    case 'approval_ready':
      return 'bg-green-800 text-green-100'
    case 'overdue':
      return 'bg-orange-800 text-orange-100'
    case 'escalated':
      return 'bg-purple-800 text-purple-100'
    case 'complete':
      return 'bg-gray-700 text-gray-400'
  }
}

/** Returns Tailwind CSS classes for an ownership badge */
export function ownershipBadgeClass(ownership: OwnershipState): string {
  switch (ownership) {
    case 'assigned_to_me':
      return 'bg-blue-800 text-blue-100'
    case 'assigned_to_team':
      return 'bg-teal-800 text-teal-100'
    case 'unassigned':
      return 'bg-gray-700 text-gray-300'
    case 'blocked_by_external':
      return 'bg-orange-800 text-orange-100'
    case 'escalated':
      return 'bg-purple-800 text-purple-100'
  }
}

/** Returns Tailwind CSS classes for an SLA urgency badge */
export function slaUrgencyBadgeClass(urgency: SlaUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'bg-red-800 text-red-100'
    case 'due_soon':
      return 'bg-yellow-800 text-yellow-100'
    case 'on_track':
      return 'bg-green-800 text-green-100'
    case 'no_deadline':
      return 'bg-gray-700 text-gray-400'
  }
}

/** Returns Tailwind CSS classes for a handoff readiness badge */
export function handoffReadinessBadgeClass(readiness: HandoffReadiness): string {
  switch (readiness) {
    case 'ready':
      return 'bg-green-800 text-green-100'
    case 'has_warnings':
      return 'bg-yellow-800 text-yellow-100'
    case 'not_ready':
      return 'bg-red-800 text-red-100'
    case 'unknown':
      return 'bg-gray-700 text-gray-400'
  }
}

// ---------------------------------------------------------------------------
// Item aging analysis (manager analytics: average aging buckets)
// ---------------------------------------------------------------------------

/**
 * Aging bucket: how long since the item was last acted upon.
 * Used for analytics-lite summaries to surface stale work to operations leads.
 */
export type AgingBucket = 'fresh' | 'aging' | 'stale' | 'critical'

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  fresh: 'Fresh (< 24 h)',
  aging: 'Aging (1–3 days)',
  stale: 'Stale (3–7 days)',
  critical: 'Critical (> 7 days)',
}

export const AGING_BUCKET_DESCRIPTIONS: Record<AgingBucket, string> = {
  fresh: 'Items acted on within the last 24 hours. No immediate concern.',
  aging: 'Items not progressed for 1–3 days. Monitor for SLA drift.',
  stale: 'Items inactive for 3–7 days. Consider reassignment or escalation.',
  critical: 'Items with no recorded action for more than 7 days. Immediate attention required.',
}

/** Hour thresholds for aging classification */
export const AGING_BUCKET_THRESHOLDS = {
  freshHours: 24,
  agingHours: 72,
  staleHours: 168, // 7 days
} as const

/**
 * Classify how long a work item has been inactive based on its `lastActionAt`
 * timestamp.  A null timestamp is treated as the most critical bucket.
 */
export function classifyItemAge(lastActionAt: string | null, now: number = Date.now()): AgingBucket {
  if (!lastActionAt) return 'critical'
  const ms = now - new Date(lastActionAt).getTime()
  if (isNaN(ms) || ms < 0) return 'fresh'
  const hours = ms / (1000 * 60 * 60)
  if (hours < AGING_BUCKET_THRESHOLDS.freshHours) return 'fresh'
  if (hours < AGING_BUCKET_THRESHOLDS.agingHours) return 'aging'
  if (hours < AGING_BUCKET_THRESHOLDS.staleHours) return 'stale'
  return 'critical'
}

/** Aggregated aging counts and derived averages for the operations cockpit */
export interface AgingBucketSummary {
  fresh: number
  aging: number
  stale: number
  critical: number
  /** Average number of days since last action across all active items (0 if no items) */
  averageDaysOpen: number
  /** Days since last action for the oldest active item (0 if no items) */
  oldestItemDays: number
}

/**
 * Derive aggregated aging bucket counts from a list of work items.
 * Only active (non-complete) items are included in the analysis.
 */
export function deriveAgingBuckets(
  items: WorkItem[],
  now: number = Date.now(),
): AgingBucketSummary {
  const active = items.filter((i) => i.status !== 'complete')
  const counts: Record<AgingBucket, number> = { fresh: 0, aging: 0, stale: 0, critical: 0 }
  let totalMs = 0
  let itemsWithDate = 0
  let maxMs = 0

  for (const item of active) {
    const bucket = classifyItemAge(item.lastActionAt, now)
    counts[bucket]++
    if (item.lastActionAt) {
      const ms = Math.max(0, now - new Date(item.lastActionAt).getTime())
      if (!isNaN(ms)) {
        totalMs += ms
        itemsWithDate++
        if (ms > maxMs) maxMs = ms
      }
    }
  }

  const msPerDay = 1000 * 60 * 60 * 24
  return {
    ...counts,
    averageDaysOpen: itemsWithDate > 0 ? totalMs / itemsWithDate / msPerDay : 0,
    oldestItemDays: maxMs > 0 ? maxMs / msPerDay : 0,
  }
}

/** Returns Tailwind CSS classes for an aging bucket badge */
export function agingBucketBadgeClass(bucket: AgingBucket): string {
  switch (bucket) {
    case 'fresh':
      return 'bg-green-800 text-green-100'
    case 'aging':
      return 'bg-yellow-800 text-yellow-100'
    case 'stale':
      return 'bg-orange-800 text-orange-100'
    case 'critical':
      return 'bg-red-800 text-red-100'
  }
}

/** Returns Tailwind CSS classes for the aging count cell background */
export function agingBucketCellClass(bucket: AgingBucket, count: number): string {
  if (count === 0) return 'bg-gray-700'
  switch (bucket) {
    case 'fresh':
      return 'bg-green-900'
    case 'aging':
      return 'bg-yellow-900'
    case 'stale':
      return 'bg-orange-900'
    case 'critical':
      return 'bg-red-900'
  }
}

// ---------------------------------------------------------------------------
// Mock fixture (deterministic, for CI/dev testing)
// ---------------------------------------------------------------------------

const NOW_ISO = '2026-03-16T10:00:00.000Z'
const OVERDUE_ISO = '2026-03-15T09:00:00.000Z' // yesterday
const DUE_SOON_ISO = '2026-03-16T20:00:00.000Z' // later today
const ON_TRACK_ISO = '2026-03-20T10:00:00.000Z' // in 4 days

export const MOCK_WORK_ITEMS_HEALTHY: WorkItem[] = [
  {
    id: 'wi-001',
    title: 'KYC review — Investor A',
    stage: 'kyc_aml',
    status: 'pending_review',
    ownership: 'assigned_to_me',
    lastActionAt: '2026-03-15T14:00:00.000Z',
    dueAt: ON_TRACK_ISO,
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking: false,
  },
  {
    id: 'wi-002',
    title: 'Documentation check — Investor B',
    stage: 'document_review',
    status: 'in_progress',
    ownership: 'assigned_to_team',
    lastActionAt: '2026-03-15T11:00:00.000Z',
    dueAt: ON_TRACK_ISO,
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking: false,
  },
  {
    id: 'wi-003',
    title: 'Approval handoff ready — Series A',
    stage: 'approval',
    status: 'approval_ready',
    ownership: 'assigned_to_team',
    lastActionAt: '2026-03-15T16:00:00.000Z',
    dueAt: ON_TRACK_ISO,
    workspacePath: '/compliance/approval',
    note: 'All stages complete. Pending final sign-off.',
    isLaunchBlocking: false,
  },
]

export const MOCK_WORK_ITEMS_DEGRADED: WorkItem[] = [
  {
    id: 'wi-101',
    title: 'AML screening — Investor C (OVERDUE)',
    stage: 'kyc_aml',
    status: 'overdue',
    ownership: 'unassigned',
    lastActionAt: '2026-03-14T10:00:00.000Z',
    dueAt: OVERDUE_ISO,
    workspacePath: '/compliance/onboarding',
    note: 'Screening result unavailable — provider timeout.',
    isLaunchBlocking: true,
  },
  {
    id: 'wi-102',
    title: 'Jurisdiction review blocked — Restricted region',
    stage: 'onboarding',
    status: 'blocked',
    ownership: 'blocked_by_external',
    lastActionAt: '2026-03-13T08:00:00.000Z',
    dueAt: DUE_SOON_ISO,
    workspacePath: '/compliance/onboarding',
    note: 'Waiting on legal opinion from external counsel.',
    isLaunchBlocking: true,
  },
  {
    id: 'wi-103',
    title: 'Remediation — Missing proof of address',
    stage: 'remediation',
    status: 'blocked',
    ownership: 'assigned_to_me',
    lastActionAt: '2026-03-14T15:00:00.000Z',
    dueAt: DUE_SOON_ISO,
    workspacePath: '/compliance/approval',
    note: null,
    isLaunchBlocking: false,
  },
  {
    id: 'wi-104',
    title: 'Compliance report draft — Q1 2026',
    stage: 'reporting',
    status: 'in_progress',
    ownership: 'assigned_to_team',
    lastActionAt: '2026-03-15T09:00:00.000Z',
    dueAt: DUE_SOON_ISO,
    workspacePath: '/compliance/reporting',
    note: null,
    isLaunchBlocking: false,
  },
]

export const MOCK_COCKPIT_REFRESHED_AT = NOW_ISO

/** Downstream handoff summaries for the cockpit overview panel */
export function buildDefaultHandoffs(items: WorkItem[], now: number = Date.now()): DownstreamHandoff[] {
  return [
    {
      id: 'handoff-onboarding',
      label: 'Investor Onboarding',
      description:
        'Review incoming KYC, AML, and jurisdiction cases before handing off to the approval queue.',
      path: '/compliance/onboarding',
      readiness: deriveHandoffReadiness('onboarding', items, now),
      blockerCount: items.filter(
        (i) =>
          (i.stage === 'onboarding' || i.stage === 'kyc_aml' || i.stage === 'document_review') &&
          i.status === 'blocked',
      ).length,
      warningCount: items.filter(
        (i) =>
          (i.stage === 'onboarding' || i.stage === 'kyc_aml' || i.stage === 'document_review') &&
          classifySlaUrgency(i.dueAt, now) === 'due_soon' &&
          i.status !== 'complete',
      ).length,
    },
    {
      id: 'handoff-approval',
      label: 'Approval Queue',
      description:
        'Cases that have cleared compliance review and are staged for enterprise sign-off.',
      path: '/compliance/approval',
      readiness: deriveHandoffReadiness('approval', items, now),
      blockerCount: items.filter(
        (i) =>
          (i.stage === 'approval' || i.stage === 'remediation') &&
          i.status === 'blocked',
      ).length,
      warningCount: items.filter(
        (i) =>
          (i.stage === 'approval' || i.stage === 'remediation') &&
          classifySlaUrgency(i.dueAt, now) === 'due_soon' &&
          i.status !== 'complete',
      ).length,
    },
    {
      id: 'handoff-reporting',
      label: 'Compliance Reporting',
      description:
        'Compile export packages, audit trails, and regulator-ready evidence for the current issuance.',
      path: '/compliance/reporting',
      readiness: deriveHandoffReadiness('reporting', items, now),
      blockerCount: items.filter(
        (i) => i.stage === 'reporting' && i.status === 'blocked',
      ).length,
      warningCount: items.filter(
        (i) =>
          i.stage === 'reporting' &&
          classifySlaUrgency(i.dueAt, now) === 'due_soon' &&
          i.status !== 'complete',
      ).length,
    },
  ]
}

// ---------------------------------------------------------------------------
// Role-aware summaries (AC #5)
// ---------------------------------------------------------------------------

/**
 * Executive-facing role type that maps to the three named personas from the
 * product acceptance criteria.  Distinct from OperatorRole (queue assignment
 * labels) — these are the three audience personas the cockpit must serve.
 */
export type CockpitPersona = 'compliance_manager' | 'operations_lead' | 'executive_sponsor'

export const COCKPIT_PERSONA_LABELS: Record<CockpitPersona, string> = {
  compliance_manager: 'Compliance Manager',
  operations_lead: 'Operations Lead',
  executive_sponsor: 'Executive Sponsor',
}

export const COCKPIT_PERSONA_DESCRIPTIONS: Record<CockpitPersona, string> = {
  compliance_manager:
    'Queue health, overdue SLA breaches, and items requiring immediate review or escalation.',
  operations_lead:
    'Workload distribution, unassigned items, bottleneck concentration, and handoff readiness.',
  executive_sponsor:
    'Overall compliance posture, launch-blocking issues, and downstream readiness for program approval.',
}

/** A single stat shown in a role summary card */
export interface RoleSummaryMetric {
  label: string
  value: number
  /** css severity class suffix: 'red' | 'yellow' | 'green' | 'gray' */
  severity: 'red' | 'yellow' | 'green' | 'gray'
  /** Short action prompt shown to the persona */
  prompt: string | null
}

/** A role-aware summary card produced for a specific persona */
export interface RoleSummaryCard {
  persona: CockpitPersona
  label: string
  description: string
  metrics: RoleSummaryMetric[]
  /** True when the persona has at least one critical metric requiring attention */
  needsAttention: boolean
}

/**
 * Derive role-aware summary cards for the three cockpit personas.
 * Uses fail-closed logic: missing data is treated as degraded, not optimistic.
 */
export function deriveRoleSummaries(
  items: WorkItem[],
  health: QueueHealthMetrics,
  now: number = Date.now(),
): RoleSummaryCard[] {
  const active = items.filter((i) => i.status !== 'complete')
  const isItemOverdue = (i: WorkItem) =>
    i.status === 'overdue' || classifySlaUrgency(i.dueAt, now) === 'overdue'
  const overdueCount = active.filter(isItemOverdue).length
  const dueSoonCount = active.filter(
    (i) => classifySlaUrgency(i.dueAt, now) === 'due_soon',
  ).length
  const launchBlockingCount = active.filter((i) => i.isLaunchBlocking).length
  const unassignedCount = active.filter((i) => i.ownership === 'unassigned').length
  const escalatedCount = active.filter(
    (i) => i.ownership === 'escalated' || i.status === 'escalated',
  ).length
  const approvalReadyCount = active.filter((i) => i.status === 'approval_ready').length

  // ── Compliance Manager ──
  const complianceCard: RoleSummaryCard = {
    persona: 'compliance_manager',
    label: COCKPIT_PERSONA_LABELS.compliance_manager,
    description: COCKPIT_PERSONA_DESCRIPTIONS.compliance_manager,
    needsAttention: overdueCount > 0 || health.blocked > 0,
    metrics: [
      {
        label: 'Overdue',
        value: overdueCount,
        severity: overdueCount > 0 ? 'red' : 'green',
        prompt: overdueCount > 0 ? 'Review and escalate overdue items now' : null,
      },
      {
        label: 'Due Soon',
        value: dueSoonCount,
        severity: dueSoonCount > 0 ? 'yellow' : 'green',
        prompt: dueSoonCount > 0 ? 'Action needed within 24 hours' : null,
      },
      {
        label: 'Escalated',
        value: escalatedCount,
        severity: escalatedCount > 0 ? 'yellow' : 'gray',
        prompt: escalatedCount > 0 ? 'Monitor escalated cases' : null,
      },
    ],
  }

  // ── Operations Lead ──
  const operationsCard: RoleSummaryCard = {
    persona: 'operations_lead',
    label: COCKPIT_PERSONA_LABELS.operations_lead,
    description: COCKPIT_PERSONA_DESCRIPTIONS.operations_lead,
    needsAttention: unassignedCount > 0 || health.blocked > 0,
    metrics: [
      {
        label: 'Unassigned',
        value: unassignedCount,
        severity: unassignedCount > 0 ? 'yellow' : 'green',
        prompt: unassignedCount > 0 ? 'Assign ownership to prevent SLA drift' : null,
      },
      {
        label: 'Blocked',
        value: health.blocked,
        severity: health.blocked > 0 ? 'red' : 'green',
        prompt: health.blocked > 0 ? 'Unblock items to restore flow' : null,
      },
      {
        label: 'Approval Ready',
        value: approvalReadyCount,
        severity: approvalReadyCount > 0 ? 'green' : 'gray',
        prompt: approvalReadyCount > 0 ? 'Forward to approval queue' : null,
      },
    ],
  }

  // ── Executive Sponsor ──
  const executiveCard: RoleSummaryCard = {
    persona: 'executive_sponsor',
    label: COCKPIT_PERSONA_LABELS.executive_sponsor,
    description: COCKPIT_PERSONA_DESCRIPTIONS.executive_sponsor,
    needsAttention: launchBlockingCount > 0,
    metrics: [
      {
        label: 'Launch Blocking',
        value: launchBlockingCount,
        severity: launchBlockingCount > 0 ? 'red' : 'green',
        prompt: launchBlockingCount > 0 ? 'Resolve blockers before proceeding to launch' : null,
      },
      {
        label: 'Total Active',
        value: health.total,
        severity: health.total > 0 ? 'gray' : 'green',
        prompt: null,
      },
      {
        label: 'Overdue',
        value: overdueCount,
        severity: overdueCount > 0 ? 'red' : 'green',
        prompt: overdueCount > 0 ? 'SLA breaches require senior attention' : null,
      },
    ],
  }

  return [complianceCard, operationsCard, executiveCard]
}

// ---------------------------------------------------------------------------
// Data-testid constants
// ---------------------------------------------------------------------------

export const COCKPIT_TEST_IDS = {
  ROOT: 'compliance-operations-cockpit',
  HEADING: 'cockpit-ops-heading',
  POSTURE_BANNER: 'cockpit-posture-banner',
  POSTURE_LABEL: 'cockpit-posture-label',
  QUEUE_HEALTH_PANEL: 'queue-health-panel',
  HEALTH_TOTAL: 'health-total',
  HEALTH_OVERDUE: 'health-overdue',
  HEALTH_BLOCKED: 'health-blocked',
  HEALTH_APPROVAL_READY: 'health-approval-ready',
  HEALTH_UNASSIGNED: 'health-unassigned',
  HEALTH_ASSIGNED_TO_ME: 'health-assigned-to-me',
  WORKLIST_PANEL: 'worklist-panel',
  WORKLIST_EMPTY: 'worklist-empty',
  WORK_ITEM_ROW: 'work-item-row',
  BOTTLENECK_PANEL: 'bottleneck-panel',
  BOTTLENECK_EMPTY: 'bottleneck-empty',
  HANDOFF_PANEL: 'handoff-panel',
  HANDOFF_CARD: 'handoff-card',
  DEGRADED_ALERT: 'degraded-alert',
  REFRESH_BTN: 'cockpit-refresh-btn',
  REFRESHED_AT: 'cockpit-refreshed-at',
  FILTER_SELECT: 'worklist-filter-select',
  LOADING_STATE: 'cockpit-loading-state',
  ROLE_SUMMARY_PANEL: 'role-summary-panel',
  ROLE_SUMMARY_CARD: 'role-summary-card',
  AGING_PANEL: 'aging-analysis-panel',
  AGING_FRESH: 'aging-fresh',
  AGING_AGING: 'aging-aging',
  AGING_STALE: 'aging-stale',
  AGING_CRITICAL: 'aging-critical',
  AGING_AVERAGE: 'aging-average-days',
} as const
