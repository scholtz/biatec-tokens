/**
 * caseDrillDown.ts
 *
 * Typed helpers and data models for the compliance case drill-down and
 * guided escalation workspace. Extends the operations cockpit by providing
 * evidence-linked detail views, decision history, and structured escalation
 * flows that help compliance analysts and approvers resolve cases confidently.
 *
 * Design principles
 * -----------------
 * - Fail-closed: absent or degraded data is explicitly surfaced, never silently optimistic.
 * - Enterprise language: no blockchain jargon. Written for compliance teams and auditors.
 * - Backend-ready: all interfaces can be hydrated from a compliance case management API.
 * - Reuses WorkItem, CockpitWorkflowStage, and related types from complianceOperationsCockpit.ts.
 */

import type { WorkItem } from './complianceOperationsCockpit'
import { COCKPIT_STAGE_LABELS } from './complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Case timeline
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | 'case_opened'
  | 'stage_changed'
  | 'evidence_submitted'
  | 'evidence_rejected'
  | 'note_added'
  | 'owner_changed'
  | 'escalated'
  | 'de_escalated'
  | 'sla_warning'
  | 'sla_breached'
  | 'approval_requested'
  | 'approved'
  | 'conditionally_approved'
  | 'returned_for_revision'

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  case_opened: 'Case Opened',
  stage_changed: 'Stage Changed',
  evidence_submitted: 'Evidence Submitted',
  evidence_rejected: 'Evidence Rejected',
  note_added: 'Note Added',
  owner_changed: 'Owner Changed',
  escalated: 'Escalated',
  de_escalated: 'De-escalated',
  sla_warning: 'SLA Warning',
  sla_breached: 'SLA Breached',
  approval_requested: 'Approval Requested',
  approved: 'Approved',
  conditionally_approved: 'Conditionally Approved',
  returned_for_revision: 'Returned for Revision',
}

/** Whether a timeline event type represents a negative signal (for visual cues) */
export function isNegativeTimelineEvent(type: TimelineEventType): boolean {
  return [
    'evidence_rejected',
    'escalated',
    'sla_warning',
    'sla_breached',
    'returned_for_revision',
  ].includes(type)
}

/** Whether a timeline event type represents a positive/completion signal */
export function isPositiveTimelineEvent(type: TimelineEventType): boolean {
  return ['evidence_submitted', 'de_escalated', 'approved', 'conditionally_approved'].includes(type)
}

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  /** ISO timestamp */
  timestamp: string
  /** Display name of the actor who triggered this event */
  actor: string
  /** Short summary line shown in the timeline list */
  summary: string
  /** Optional longer detail visible on expansion */
  detail: string | null
  /** Significant events are visually emphasized in the timeline */
  isSignificant: boolean
}

/**
 * Sort timeline events in chronological order (oldest first).
 */
export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime()
    const tb = new Date(b.timestamp).getTime()
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return ta - tb
  })
}

/**
 * Return the CSS class for the timeline event icon dot.
 */
export function timelineEventDotClass(type: TimelineEventType): string {
  if (isNegativeTimelineEvent(type)) return 'bg-red-500'
  if (isPositiveTimelineEvent(type)) return 'bg-green-500'
  if (type === 'stage_changed' || type === 'approval_requested') return 'bg-blue-500'
  return 'bg-gray-500'
}

// ---------------------------------------------------------------------------
// Evidence groups
// ---------------------------------------------------------------------------

export type EvidenceStatus = 'available' | 'missing' | 'stale' | 'degraded'

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  available: 'Available',
  missing: 'Missing',
  stale: 'Stale',
  degraded: 'Data Unavailable',
}

export const EVIDENCE_STATUS_DESCRIPTIONS: Record<EvidenceStatus, string> = {
  available: 'Evidence is present and current.',
  missing: 'Required evidence has not been submitted.',
  stale: 'Evidence was submitted but may be out of date.',
  degraded: 'Evidence status could not be determined. Treat as incomplete.',
}

export type EvidenceCategory =
  | 'identity_kyc'
  | 'aml_sanctions'
  | 'approval_history'
  | 'customer_communications'
  | 'export_regulator_package'

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  identity_kyc: 'Identity & KYC',
  aml_sanctions: 'AML & Sanctions Review',
  approval_history: 'Approval History',
  customer_communications: 'Customer Communications',
  export_regulator_package: 'Regulator Export Package',
}

export const EVIDENCE_CATEGORY_DESCRIPTIONS: Record<EvidenceCategory, string> = {
  identity_kyc: 'Government-issued identity documents, proof of address, and KYC verification records.',
  aml_sanctions: 'Anti-money laundering screening results, sanctions list checks, and remediation notes.',
  approval_history: 'Reviewer decisions, sign-off records, conditional approvals, and rejection notes.',
  customer_communications: 'Correspondence with the investor, document request history, and follow-up records.',
  export_regulator_package: 'Completed regulator-facing export, audit trail, and compliance attestations.',
}

export interface EvidenceItem {
  id: string
  label: string
  status: EvidenceStatus
  /** ISO timestamp of last update (null if never submitted) */
  lastUpdatedAt: string | null
  /** Optional contextual note shown alongside the item */
  note: string | null
}

export interface EvidenceGroup {
  category: EvidenceCategory
  label: string
  description: string
  items: EvidenceItem[]
  /** Derived overall status: worst status among items; 'degraded' if any degraded */
  overallStatus: EvidenceStatus
}

/**
 * Compute the overall status for an evidence group as the worst-case status
 * among all items. Priority: degraded > missing > stale > available.
 */
export function deriveGroupOverallStatus(items: EvidenceItem[]): EvidenceStatus {
  if (items.length === 0) return 'degraded'
  if (items.some((i) => i.status === 'degraded')) return 'degraded'
  if (items.some((i) => i.status === 'missing')) return 'missing'
  if (items.some((i) => i.status === 'stale')) return 'stale'
  return 'available'
}

/**
 * Return the CSS badge class for an evidence status.
 */
export function evidenceStatusBadgeClass(status: EvidenceStatus): string {
  switch (status) {
    case 'available':
      return 'bg-green-900 text-green-200'
    case 'missing':
      return 'bg-red-900 text-red-200'
    case 'stale':
      return 'bg-yellow-900 text-yellow-200'
    case 'degraded':
      return 'bg-gray-700 text-gray-300'
  }
}

/**
 * Return a summary label for the overall readiness of all evidence groups.
 * Used in the detail header to give a quick readiness signal.
 */
export function deriveEvidenceReadinessLabel(groups: EvidenceGroup[]): string {
  if (groups.length === 0) return 'Evidence unavailable'
  if (groups.some((g) => g.overallStatus === 'degraded')) return 'Evidence data unavailable'
  if (groups.some((g) => g.overallStatus === 'missing')) return 'Evidence incomplete'
  if (groups.some((g) => g.overallStatus === 'stale')) return 'Evidence may be stale'
  return 'Evidence complete'
}

// ---------------------------------------------------------------------------
// Approval / decision history
// ---------------------------------------------------------------------------

export type ApprovalDecision =
  | 'approved'
  | 'conditionally_approved'
  | 'returned'
  | 'pending'
  | 'escalated'

export const APPROVAL_DECISION_LABELS: Record<ApprovalDecision, string> = {
  approved: 'Approved',
  conditionally_approved: 'Conditionally Approved',
  returned: 'Returned for Revision',
  pending: 'Pending Review',
  escalated: 'Escalated',
}

export const APPROVAL_DECISION_DESCRIPTIONS: Record<ApprovalDecision, string> = {
  approved: 'The reviewer confirmed this case meets all compliance requirements.',
  conditionally_approved:
    'Approval granted with conditions. Conditions must be resolved before proceeding.',
  returned: 'The reviewer returned this case for additional documentation or corrections.',
  pending: 'Awaiting review decision. No action has been taken yet.',
  escalated: 'Forwarded to senior reviewer or external authority.',
}

export interface ApprovalRecord {
  id: string
  /** Name of the approver or reviewer */
  actor: string
  /** Role/title of the actor */
  role: string
  decision: ApprovalDecision
  /** ISO timestamp */
  timestamp: string
  /** Optional decision note or condition */
  note: string | null
}

/**
 * Return the CSS badge class for an approval decision.
 */
export function approvalDecisionBadgeClass(decision: ApprovalDecision): string {
  switch (decision) {
    case 'approved':
      return 'bg-green-900 text-green-200'
    case 'conditionally_approved':
      return 'bg-teal-900 text-teal-200'
    case 'returned':
      return 'bg-red-900 text-red-200'
    case 'pending':
      return 'bg-gray-700 text-gray-300'
    case 'escalated':
      return 'bg-yellow-900 text-yellow-200'
  }
}

// ---------------------------------------------------------------------------
// Guided escalation
// ---------------------------------------------------------------------------

export type EscalationReason =
  | 'missing_investor_documentation'
  | 'sanctions_review_required'
  | 'approval_review_required'
  | 'sla_risk'
  | 'jurisdiction_concern'
  | 'other'

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  missing_investor_documentation: 'Missing Investor Documentation',
  sanctions_review_required: 'Sanctions Review Required',
  approval_review_required: 'Approval Review Required',
  sla_risk: 'SLA Risk — Deadline at Risk',
  jurisdiction_concern: 'Jurisdiction or Regulatory Concern',
  other: 'Other Reason',
}

export const ESCALATION_REASON_DESCRIPTIONS: Record<EscalationReason, string> = {
  missing_investor_documentation:
    'Required identity, KYC, or supporting documents have not been submitted or are incomplete.',
  sanctions_review_required:
    'The investor appears on a sanctions watchlist or requires enhanced due diligence.',
  approval_review_required:
    'The approval package requires senior reviewer attention before sign-off can proceed.',
  sla_risk:
    'The SLA deadline is at risk due to delays, blockers, or missing responses.',
  jurisdiction_concern:
    "The investor's jurisdiction raises a regulatory or legal compliance concern.",
  other: 'Other operational or compliance reason not covered by the options above.',
}

export interface EscalationOption {
  reason: EscalationReason
  label: string
  description: string
  /** Suggested destination role or team for the handoff */
  suggestedDestination: string
  /** Shown as a pre-selected option for common cases */
  isDefault: boolean
}

/**
 * Build the list of available escalation options, with defaults appropriate
 * for the given work item's current status and stage.
 */
export function buildEscalationOptions(item: WorkItem): EscalationOption[] {
  const options: EscalationOption[] = [
    {
      reason: 'missing_investor_documentation',
      label: ESCALATION_REASON_LABELS.missing_investor_documentation,
      description: ESCALATION_REASON_DESCRIPTIONS.missing_investor_documentation,
      suggestedDestination: 'Compliance Analyst (Document Review)',
      isDefault: item.stage === 'document_review' || item.stage === 'onboarding',
    },
    {
      reason: 'sanctions_review_required',
      label: ESCALATION_REASON_LABELS.sanctions_review_required,
      description: ESCALATION_REASON_DESCRIPTIONS.sanctions_review_required,
      suggestedDestination: 'AML Officer',
      isDefault: item.stage === 'kyc_aml',
    },
    {
      reason: 'approval_review_required',
      label: ESCALATION_REASON_LABELS.approval_review_required,
      description: ESCALATION_REASON_DESCRIPTIONS.approval_review_required,
      suggestedDestination: 'Senior Approver',
      isDefault: item.stage === 'approval' || item.stage === 'remediation',
    },
    {
      reason: 'sla_risk',
      label: ESCALATION_REASON_LABELS.sla_risk,
      description: ESCALATION_REASON_DESCRIPTIONS.sla_risk,
      suggestedDestination: 'Operations Lead',
      isDefault:
        item.status === 'overdue' ||
        (item.dueAt !== null && new Date(item.dueAt).getTime() - Date.now() < 24 * 60 * 60 * 1000),
    },
    {
      reason: 'jurisdiction_concern',
      label: ESCALATION_REASON_LABELS.jurisdiction_concern,
      description: ESCALATION_REASON_DESCRIPTIONS.jurisdiction_concern,
      suggestedDestination: 'Legal / Compliance Lead',
      isDefault: false,
    },
    {
      reason: 'other',
      label: ESCALATION_REASON_LABELS.other,
      description: ESCALATION_REASON_DESCRIPTIONS.other,
      suggestedDestination: 'Operations Lead',
      isDefault: false,
    },
  ]
  return options
}

/**
 * Return the default escalation reason for a work item based on its status and stage.
 * Falls back to 'sla_risk' for overdue items, otherwise first non-other option.
 */
export function getDefaultEscalationReason(item: WorkItem): EscalationReason {
  if (item.status === 'overdue') return 'sla_risk'
  const options = buildEscalationOptions(item)
  const defaultOpt = options.find((o) => o.isDefault)
  return defaultOpt ? defaultOpt.reason : 'other'
}

// ---------------------------------------------------------------------------
// Case drill-down state
// ---------------------------------------------------------------------------

export interface CaseDrillDownState {
  item: WorkItem
  timeline: TimelineEvent[]
  evidenceGroups: EvidenceGroup[]
  approvalHistory: ApprovalRecord[]
  escalationOptions: EscalationOption[]
  /** Plain-language summary of what the current role needs to do next */
  nextAction: string
  /** Whether all evidence groups are 'available' (no missing/stale/degraded) */
  isReadyForApproval: boolean
  /** True if any evidence or data is in degraded state */
  isDegraded: boolean
  /** Human-readable list of active blockers preventing progression */
  blockerSummary: string[]
}

/**
 * Derive a complete drill-down state for a work item using mock data.
 * In production this would hydrate from a compliance case management API.
 */
export function deriveCaseDrillDown(item: WorkItem, now: number = Date.now()): CaseDrillDownState {
  const timeline = buildMockTimeline(item, now)
  const evidenceGroups = buildMockEvidenceGroups(item)
  const approvalHistory = buildMockApprovalHistory(item)
  const escalationOptions = buildEscalationOptions(item)

  const isReadyForApproval =
    evidenceGroups.every((g) => g.overallStatus === 'available') &&
    item.status !== 'blocked' &&
    item.status !== 'overdue' &&
    item.status !== 'escalated'

  const isDegraded = evidenceGroups.some((g) => g.overallStatus === 'degraded')

  const blockerSummary = deriveBlockerSummary(item, evidenceGroups)

  const nextAction = deriveNextAction(item, evidenceGroups)

  return {
    item,
    timeline,
    evidenceGroups,
    approvalHistory,
    escalationOptions,
    nextAction,
    isReadyForApproval,
    isDegraded,
    blockerSummary,
  }
}

/**
 * Derive a human-readable list of blockers for the case.
 */
export function deriveBlockerSummary(item: WorkItem, groups: EvidenceGroup[]): string[] {
  const blockers: string[] = []

  if (item.status === 'overdue') {
    blockers.push('SLA deadline has been breached. Immediate action required.')
  }

  groups.forEach((g) => {
    const missingItems = g.items.filter((i) => i.status === 'missing')
    const staleItems = g.items.filter((i) => i.status === 'stale')
    const degradedItems = g.items.filter((i) => i.status === 'degraded')

    missingItems.forEach((i) => {
      blockers.push(`Missing: ${i.label} (${g.label})`)
    })
    staleItems.forEach((i) => {
      blockers.push(`Stale: ${i.label} may be out of date (${g.label})`)
    })
    degradedItems.forEach((i) => {
      blockers.push(`Data unavailable: ${i.label} (${g.label})`)
    })
  })

  if (item.status === 'blocked' && item.note) {
    blockers.push(item.note)
  }

  return blockers
}

/**
 * Derive the next-action guidance string for a case based on its current state.
 */
export function deriveNextAction(item: WorkItem, groups: EvidenceGroup[]): string {
  if (item.status === 'overdue') {
    return 'This case is overdue. Escalate to the operations lead and resolve all outstanding blockers immediately.'
  }
  if (item.status === 'escalated') {
    return 'This case has been escalated. Monitor for senior reviewer response and follow up if no action within 24 hours.'
  }
  if (groups.some((g) => g.overallStatus === 'degraded')) {
    return 'Evidence data is unavailable for this case. Contact your platform administrator and treat this case as incomplete.'
  }
  if (groups.some((g) => g.overallStatus === 'missing')) {
    return 'Required evidence is missing. Request the outstanding documents from the investor and re-submit for review.'
  }
  if (groups.some((g) => g.overallStatus === 'stale')) {
    return 'Some evidence may be out of date. Verify with the investor and refresh stale documents before proceeding.'
  }
  if (item.status === 'approval_ready') {
    return 'All evidence is complete. Review the approval checklist and proceed to sign-off.'
  }
  if (item.status === 'pending_review') {
    return 'Review the submitted evidence and either approve, request revisions, or escalate.'
  }
  if (item.status === 'blocked') {
    return item.note
      ? `Resolve blocker: "${item.note}" to proceed.`
      : 'Identify and resolve the current blocker before this case can continue.'
  }
  if (item.status === 'in_progress') {
    const stageLabel = COCKPIT_STAGE_LABELS[item.stage]
    return `Continue processing this case in the ${stageLabel} stage.`
  }
  return 'Review this case and take the appropriate next action.'
}

// ---------------------------------------------------------------------------
// Mock / fixture data builders
// ---------------------------------------------------------------------------

const MOCK_ACTORS = ['A. Chen', 'M. Okonkwo', 'S. Patel', 'System', 'K. Novak']

function buildMockTimeline(item: WorkItem, now: number): TimelineEvent[] {
  const baseTime = new Date(item.lastActionAt ?? new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())
  const events: TimelineEvent[] = [
    {
      id: `${item.id}-evt-001`,
      type: 'case_opened',
      timestamp: new Date(baseTime.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      actor: MOCK_ACTORS[2],
      summary: 'Case opened for investor compliance review',
      detail: 'Initial intake completed. Investor onboarding workflow initiated.',
      isSignificant: true,
    },
    {
      id: `${item.id}-evt-002`,
      type: 'stage_changed',
      timestamp: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      actor: MOCK_ACTORS[0],
      summary: `Stage advanced to ${COCKPIT_STAGE_LABELS[item.stage]}`,
      detail: null,
      isSignificant: false,
    },
    {
      id: `${item.id}-evt-003`,
      type: 'evidence_submitted',
      timestamp: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actor: MOCK_ACTORS[1],
      summary: 'KYC identity documents submitted',
      detail: 'Passport and proof of address uploaded by investor.',
      isSignificant: false,
    },
  ]

  // Add stage-specific events
  if (item.stage === 'kyc_aml') {
    events.push({
      id: `${item.id}-evt-004`,
      type: 'note_added',
      timestamp: new Date(baseTime.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: MOCK_ACTORS[3],
      summary: 'AML screening initiated',
      detail: 'Automated sanctions screening submitted to provider.',
      isSignificant: false,
    })
  }

  if (item.status === 'overdue' || item.status === 'escalated') {
    events.push({
      id: `${item.id}-evt-005`,
      type: item.status === 'escalated' ? 'escalated' : 'sla_breached',
      timestamp: baseTime.toISOString(),
      actor: MOCK_ACTORS[4],
      summary:
        item.status === 'escalated'
          ? 'Case escalated to senior reviewer'
          : 'SLA deadline breached — case is overdue',
      detail:
        item.status === 'escalated'
          ? 'Forwarded to senior compliance officer for urgent review.'
          : 'SLA deadline has passed. Operations lead notified.',
      isSignificant: true,
    })
  }

  if (item.status === 'blocked') {
    events.push({
      id: `${item.id}-evt-006`,
      type: 'note_added',
      timestamp: baseTime.toISOString(),
      actor: MOCK_ACTORS[0],
      summary: 'Case blocked — awaiting external response',
      detail: item.note ?? 'Blocked pending external input.',
      isSignificant: true,
    })
  }

  return sortTimelineEvents(events)
}

function buildMockEvidenceGroups(item: WorkItem): EvidenceGroup[] {
  const isBlocked = item.status === 'blocked' || item.status === 'overdue'
  const isKycStage = item.stage === 'kyc_aml' || item.stage === 'document_review' || item.stage === 'onboarding'
  const isAmlStage = item.stage === 'kyc_aml' || item.stage === 'remediation'
  const isApprovalStage = item.stage === 'approval' || item.stage === 'reporting'

  const kycItems: EvidenceItem[] = [
    {
      id: `${item.id}-kyc-001`,
      label: 'Government-issued photo ID',
      status: isBlocked && isKycStage ? 'missing' : 'available',
      lastUpdatedAt: isBlocked ? null : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      note: isBlocked && isKycStage ? 'Document requested but not yet received.' : null,
    },
    {
      id: `${item.id}-kyc-002`,
      label: 'Proof of address',
      status: isBlocked && isKycStage ? 'missing' : isAmlStage ? 'stale' : 'available',
      lastUpdatedAt: isBlocked ? null : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      note:
        isAmlStage
          ? 'Submitted 30 days ago. Verify currency with investor.'
          : null,
    },
    {
      id: `${item.id}-kyc-003`,
      label: 'KYC verification record',
      status: isBlocked ? 'missing' : 'available',
      lastUpdatedAt: isBlocked ? null : new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      note: null,
    },
  ]

  const amlItems: EvidenceItem[] = [
    {
      id: `${item.id}-aml-001`,
      label: 'Sanctions screening result',
      status:
        item.status === 'overdue' || (isAmlStage && isBlocked)
          ? 'degraded'
          : isAmlStage
            ? 'available'
            : 'available',
      lastUpdatedAt:
        item.status === 'overdue' ? null : new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      note:
        item.status === 'overdue'
          ? 'Screening result unavailable — provider timeout.'
          : null,
    },
    {
      id: `${item.id}-aml-002`,
      label: 'AML risk assessment',
      status: isAmlStage && isBlocked ? 'missing' : 'available',
      lastUpdatedAt: isBlocked ? null : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      note: null,
    },
    {
      id: `${item.id}-aml-003`,
      label: 'Adverse media check',
      status: isAmlStage ? 'available' : 'available',
      lastUpdatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      note: null,
    },
  ]

  const approvalItems: EvidenceItem[] = [
    {
      id: `${item.id}-appr-001`,
      label: 'Compliance review sign-off',
      status:
        isApprovalStage
          ? item.status === 'approval_ready'
            ? 'available'
            : 'pending' in EVIDENCE_STATUS_LABELS
              ? 'missing'
              : 'missing'
          : 'missing',
      lastUpdatedAt:
        item.status === 'approval_ready'
          ? new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          : null,
      note:
        item.status !== 'approval_ready' && isApprovalStage
          ? 'Pending sign-off from compliance reviewer.'
          : null,
    },
    {
      id: `${item.id}-appr-002`,
      label: 'Approval committee decision',
      status: item.status === 'approval_ready' ? 'available' : 'missing',
      lastUpdatedAt:
        item.status === 'approval_ready'
          ? new Date(Date.now() - 30 * 60 * 1000).toISOString()
          : null,
      note: null,
    },
  ]

  const commItems: EvidenceItem[] = [
    {
      id: `${item.id}-comm-001`,
      label: 'Document request correspondence',
      status: 'available',
      lastUpdatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      note: null,
    },
    {
      id: `${item.id}-comm-002`,
      label: 'Investor acknowledgement receipt',
      status: isBlocked && item.ownership === 'blocked_by_external' ? 'missing' : 'available',
      lastUpdatedAt: isBlocked ? null : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      note:
        isBlocked && item.ownership === 'blocked_by_external'
          ? 'Awaiting investor response.'
          : null,
    },
  ]

  const exportItems: EvidenceItem[] = [
    {
      id: `${item.id}-exp-001`,
      label: 'Compliance attestation',
      status: isApprovalStage && item.status === 'approval_ready' ? 'available' : 'missing',
      lastUpdatedAt:
        item.status === 'approval_ready'
          ? new Date(Date.now() - 30 * 60 * 1000).toISOString()
          : null,
      note: item.stage !== 'approval' && item.stage !== 'reporting' ? 'Not yet generated.' : null,
    },
    {
      id: `${item.id}-exp-002`,
      label: 'Audit trail export',
      status: item.status === 'complete' ? 'available' : 'missing',
      lastUpdatedAt: item.status === 'complete' ? new Date().toISOString() : null,
      note: item.status !== 'complete' ? 'Available after case completion.' : null,
    },
  ]

  const groups: EvidenceGroup[] = [
    {
      category: 'identity_kyc',
      label: EVIDENCE_CATEGORY_LABELS.identity_kyc,
      description: EVIDENCE_CATEGORY_DESCRIPTIONS.identity_kyc,
      items: kycItems,
      overallStatus: deriveGroupOverallStatus(kycItems),
    },
    {
      category: 'aml_sanctions',
      label: EVIDENCE_CATEGORY_LABELS.aml_sanctions,
      description: EVIDENCE_CATEGORY_DESCRIPTIONS.aml_sanctions,
      items: amlItems,
      overallStatus: deriveGroupOverallStatus(amlItems),
    },
    {
      category: 'approval_history',
      label: EVIDENCE_CATEGORY_LABELS.approval_history,
      description: EVIDENCE_CATEGORY_DESCRIPTIONS.approval_history,
      items: approvalItems,
      overallStatus: deriveGroupOverallStatus(approvalItems),
    },
    {
      category: 'customer_communications',
      label: EVIDENCE_CATEGORY_LABELS.customer_communications,
      description: EVIDENCE_CATEGORY_DESCRIPTIONS.customer_communications,
      items: commItems,
      overallStatus: deriveGroupOverallStatus(commItems),
    },
    {
      category: 'export_regulator_package',
      label: EVIDENCE_CATEGORY_LABELS.export_regulator_package,
      description: EVIDENCE_CATEGORY_DESCRIPTIONS.export_regulator_package,
      items: exportItems,
      overallStatus: deriveGroupOverallStatus(exportItems),
    },
  ]

  return groups
}

function buildMockApprovalHistory(item: WorkItem): ApprovalRecord[] {
  const history: ApprovalRecord[] = []

  // For items past onboarding, add a compliance analyst review record
  if (item.stage !== 'onboarding') {
    history.push({
      id: `${item.id}-appr-hist-001`,
      actor: 'A. Chen',
      role: 'Compliance Analyst',
      decision: 'approved',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      note: 'Initial KYC and documentation review passed.',
    })
  }

  if (item.stage === 'remediation' || item.stage === 'approval') {
    history.push({
      id: `${item.id}-appr-hist-002`,
      actor: 'M. Okonkwo',
      role: 'AML Officer',
      decision: item.status === 'blocked' ? 'returned' : 'conditionally_approved',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      note:
        item.status === 'blocked'
          ? 'Returning for proof of address refresh. Document is more than 30 days old.'
          : 'AML screening passed. Conditions: proof of address must be refreshed within 7 days.',
    })
  }

  if (item.status === 'approval_ready') {
    history.push({
      id: `${item.id}-appr-hist-003`,
      actor: 'K. Novak',
      role: 'Senior Compliance Approver',
      decision: 'pending',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      note: 'Approval package under final review.',
    })
  }

  if (item.status === 'escalated' || item.ownership === 'escalated') {
    history.push({
      id: `${item.id}-appr-hist-004`,
      actor: 'S. Patel',
      role: 'Operations Lead',
      decision: 'escalated',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      note: 'Escalated due to SLA risk and unresolved external dependency.',
    })
  }

  return history.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

// ---------------------------------------------------------------------------
// Test IDs
// ---------------------------------------------------------------------------

export const DRILL_DOWN_TEST_IDS = {
  PANEL: 'case-drill-down-panel',
  PANEL_CLOSE_BTN: 'drill-down-close-btn',
  CASE_HEADLINE: 'drill-down-case-headline',
  CASE_STAGE_BADGE: 'drill-down-stage-badge',
  CASE_SLA_BADGE: 'drill-down-sla-badge',
  CASE_OWNERSHIP_BADGE: 'drill-down-ownership-badge',
  CASE_STATUS_BADGE: 'drill-down-status-badge',
  NEXT_ACTION_BOX: 'drill-down-next-action',
  BLOCKER_LIST: 'drill-down-blocker-list',
  BLOCKER_ITEM: 'drill-down-blocker-item',
  DEGRADED_NOTICE: 'drill-down-degraded-notice',
  TIMELINE_SECTION: 'drill-down-timeline',
  TIMELINE_EMPTY: 'drill-down-timeline-empty',
  TIMELINE_EVENT: 'drill-down-timeline-event',
  EVIDENCE_SECTION: 'drill-down-evidence-section',
  EVIDENCE_GROUP: 'drill-down-evidence-group',
  EVIDENCE_GROUP_TOGGLE: 'drill-down-evidence-group-toggle',
  EVIDENCE_ITEM: 'drill-down-evidence-item',
  APPROVAL_HISTORY_SECTION: 'drill-down-approval-history',
  APPROVAL_HISTORY_EMPTY: 'drill-down-approval-history-empty',
  APPROVAL_RECORD: 'drill-down-approval-record',
  ESCALATE_BTN: 'drill-down-escalate-btn',
  OPEN_WORKSPACE_LINK: 'drill-down-open-workspace',
} as const

export const ESCALATION_MODAL_TEST_IDS = {
  MODAL: 'escalation-modal',
  CLOSE_BTN: 'escalation-modal-close',
  REASON_SELECT: 'escalation-reason-select',
  REASON_OPTION: 'escalation-reason-option',
  DESTINATION_DISPLAY: 'escalation-destination',
  REASON_DESCRIPTION: 'escalation-reason-description',
  NOTE_INPUT: 'escalation-note-input',
  SUBMIT_BTN: 'escalation-submit-btn',
  CANCEL_BTN: 'escalation-cancel-btn',
  CONFIRMATION_BANNER: 'escalation-confirmation',
} as const
