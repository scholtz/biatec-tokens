/**
 * liveComplianceIntegration.ts
 *
 * Integration layer that bridges the ComplianceCaseManagementClient API with
 * the operator-facing WorkItem[] model used by the compliance operations cockpit,
 * case drill-down, and escalation views.
 *
 * Design principles
 * -----------------
 * - Fail-closed: any API error, network failure, or missing token results in a
 *   degraded state, never a falsely-ready state.
 * - Data-provenance: every result carries a `source` field ('live' | 'mock')
 *   so the UI can communicate whether data is backend-backed or fixture-derived.
 * - Auth-aware: relies on a bearer token from the email/password login flow.
 *   Returns a degraded result when the token is absent or invalid.
 * - No wallet assumptions. All types use enterprise compliance terminology.
 */

import {
  createComplianceCaseClient,
  type BackendComplianceCaseListItem,
  type BackendCaseStatus,
  type BackendRiskLevel,
} from '../lib/api/complianceCaseManagement'
import {
  normaliseCaseDetail,
} from './complianceCaseNormalizer'
import type {
  WorkItem,
  CockpitWorkflowStage,
  WorkItemStatus,
  OwnershipState,
} from './complianceOperationsCockpit'
import { MOCK_WORK_ITEMS_DEGRADED } from './complianceOperationsCockpit'
import type {
  CaseDrillDownState,
  EvidenceGroup,
  EvidenceItem,
  EvidenceCategory,
  TimelineEvent,
  ApprovalRecord,
  EscalationOption,
} from './caseDrillDown'
import {
  buildEscalationOptions,
  deriveNextAction,
  deriveBlockerSummary,
  sortTimelineEvents,
  EVIDENCE_CATEGORY_LABELS,
  EVIDENCE_CATEGORY_DESCRIPTIONS,
  deriveGroupOverallStatus,
} from './caseDrillDown'
import type { NormalisedCaseDetail } from './complianceCaseNormalizer'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Identifies whether the returned data came from the live backend or local fixtures. */
export type DataSource = 'live' | 'mock'

export interface LiveIntegrationResult<T> {
  /** The payload data. */
  data: T
  /** Whether the result is based on live backend data or deterministic fixtures. */
  source: DataSource
  /** True when the backend was unavailable, partially failed, or returned unexpected data. */
  isDegraded: boolean
  /** Human-readable reason for degradation, null when healthy. */
  degradedReason: string | null
  /** ISO timestamp when this result was fetched. */
  fetchedAt: string
}

// ---------------------------------------------------------------------------
// Backend status → WorkItem field mappings
// ---------------------------------------------------------------------------

const STATUS_TO_WORK_STATUS: Record<BackendCaseStatus, WorkItemStatus> = {
  PENDING: 'open',
  UNDER_REVIEW: 'in_progress',
  AWAITING_DOCUMENTS: 'pending_review',
  ESCALATED: 'escalated',
  APPROVED: 'complete',
  CONDITIONALLY_APPROVED: 'pending_review',
  REJECTED: 'blocked',
  STALE: 'pending_review',
  ARCHIVED: 'complete',
  UNKNOWN: 'blocked',
}

const STATUS_TO_STAGE: Partial<Record<BackendCaseStatus, CockpitWorkflowStage>> = {
  PENDING: 'onboarding',
  UNDER_REVIEW: 'document_review',
  AWAITING_DOCUMENTS: 'document_review',
  ESCALATED: 'remediation',
  APPROVED: 'approval',
  CONDITIONALLY_APPROVED: 'approval',
  REJECTED: 'remediation',
  STALE: 'document_review',
  ARCHIVED: 'reporting',
  UNKNOWN: 'onboarding',
}

const RISK_TO_STAGE: Record<BackendRiskLevel, CockpitWorkflowStage> = {
  LOW: 'document_review',
  MEDIUM: 'kyc_aml',
  HIGH: 'kyc_aml',
  CRITICAL: 'remediation',
  UNKNOWN: 'onboarding',
}

const REVIEWER_TO_OWNERSHIP = (reviewer: string | null, status: BackendCaseStatus): OwnershipState => {
  if (status === 'ESCALATED') return 'escalated'
  if (!reviewer) return 'unassigned'
  return 'assigned_to_team'
}

// ---------------------------------------------------------------------------
// Backend case → WorkItem
// ---------------------------------------------------------------------------

/**
 * Convert a BackendComplianceCaseListItem to the WorkItem shape used by the
 * operations cockpit and drill-down views.
 *
 * Fail-closed: unknown or missing fields default to the most conservative state.
 */
export function backendCaseToWorkItem(raw: BackendComplianceCaseListItem, now: number = Date.now()): WorkItem {
  const status: WorkItemStatus = STATUS_TO_WORK_STATUS[raw.status] ?? 'blocked'
  const stage: CockpitWorkflowStage = STATUS_TO_STAGE[raw.status] ?? RISK_TO_STAGE[raw.riskLevel] ?? 'intake_triage'
  const ownership: OwnershipState = REVIEWER_TO_OWNERSHIP(raw.assignedReviewer, raw.status)

  // Derive a reasonable SLA due date (default: 72h from last activity or creation)
  const baseDate = raw.lastActivityAt ?? raw.createdAt
  const baseDateMs = baseDate ? new Date(baseDate).getTime() : now
  const dueAt = isNaN(baseDateMs) ? null : new Date(baseDateMs + 72 * 60 * 60 * 1000).toISOString()

  const title = raw.entityName
    ? `${raw.entityName} — ${raw.entityType ?? 'Entity'} Review`
    : `Case ${raw.referenceNumber}`

  return {
    id: raw.id,
    title,
    stage,
    status,
    ownership,
    lastActionAt: raw.lastActivityAt ?? raw.createdAt,
    dueAt,
    workspacePath: `/compliance/operations`,
    note: raw.hasLaunchBlockers
      ? `${raw.openTaskCount} open task${raw.openTaskCount !== 1 ? 's' : ''} · launch-blocking`
      : raw.openTaskCount > 0
        ? `${raw.openTaskCount} open task${raw.openTaskCount !== 1 ? 's' : ''}`
        : null,
    isLaunchBlocking: raw.hasLaunchBlockers,
  }
}

// ---------------------------------------------------------------------------
// Main integration functions
// ---------------------------------------------------------------------------

/**
 * Load the operator work queue from the live backend, converting backend case
 * list items to WorkItem[]. Falls back to mock data with an explicit degraded
 * flag when the backend is unavailable or the token is missing.
 *
 * @param bearerToken  JWT bearer token from email/password auth. Pass null to force mock mode.
 * @param filters      Optional filters forwarded to the API.
 */
export async function loadLiveOperatorWorkQueue(
  bearerToken: string | null | undefined,
  filters?: {
    status?: BackendCaseStatus
    riskLevel?: BackendRiskLevel
    hasLaunchBlockers?: boolean
    pageSize?: number
  },
): Promise<LiveIntegrationResult<WorkItem[]>> {
  const now = Date.now()
  const fetchedAt = new Date(now).toISOString()

  if (!bearerToken) {
    return {
      data: MOCK_WORK_ITEMS_DEGRADED,
      source: 'mock',
      isDegraded: true,
      degradedReason: 'No authentication token available. Showing demo work queue.',
      fetchedAt,
    }
  }

  const client = createComplianceCaseClient(bearerToken)
  if (!client) {
    return {
      data: MOCK_WORK_ITEMS_DEGRADED,
      source: 'mock',
      isDegraded: true,
      degradedReason: 'Could not create API client. Showing demo work queue.',
      fetchedAt,
    }
  }

  try {
    const result = await client.listCases({
      status: filters?.status,
      riskLevel: filters?.riskLevel,
      hasLaunchBlockers: filters?.hasLaunchBlockers,
      pageSize: filters?.pageSize ?? 50,
    })

    if (!result.ok) {
      return {
        data: MOCK_WORK_ITEMS_DEGRADED,
        source: 'mock',
        isDegraded: true,
        degradedReason: `Backend returned an error (${result.error.httpStatus}). Showing demo work queue.`,
        fetchedAt,
      }
    }

    const workItems = result.data.cases.map((c) => backendCaseToWorkItem(c, now))

    return {
      data: workItems,
      source: 'live',
      isDegraded: false,
      degradedReason: null,
      fetchedAt,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: MOCK_WORK_ITEMS_DEGRADED,
      source: 'mock',
      isDegraded: true,
      degradedReason: `Backend request failed: ${msg}. Showing demo work queue.`,
      fetchedAt,
    }
  }
}

// ---------------------------------------------------------------------------
// Live case drill-down integration
// ---------------------------------------------------------------------------

/**
 * Build the drill-down state from a live backend case detail response.
 * Returns a CaseDrillDownState populated from normalised backend data.
 *
 * Fail-closed: if the backend is unavailable, returns null (caller should
 * fall back to mock derivation).
 */
export async function loadLiveCaseDrillDown(
  caseId: string,
  workItem: WorkItem,
  bearerToken: string | null | undefined,
): Promise<LiveIntegrationResult<CaseDrillDownState | null>> {
  const fetchedAt = new Date().toISOString()

  if (!bearerToken) {
    return {
      data: null,
      source: 'mock',
      isDegraded: true,
      degradedReason: 'No authentication token. Case evidence cannot be loaded from backend.',
      fetchedAt,
    }
  }

  const client = createComplianceCaseClient(bearerToken)
  if (!client) {
    return {
      data: null,
      source: 'mock',
      isDegraded: true,
      degradedReason: 'API client unavailable. Case evidence cannot be loaded.',
      fetchedAt,
    }
  }

  try {
    const result = await client.getCase(caseId)
    if (!result.ok) {
      return {
        data: null,
        source: 'mock',
        isDegraded: true,
        degradedReason: `Backend case detail request failed (${result.error.httpStatus}).`,
        fetchedAt,
      }
    }

    const normalised = normaliseCaseDetail(result.data)
    const drillDownState = buildDrillDownFromNormalisedDetail(workItem, normalised)

    return {
      data: drillDownState,
      source: 'live',
      isDegraded: normalised.hasStaleEvidence || normalised.hasUnresolvedAMLFlags,
      degradedReason:
        normalised.hasStaleEvidence && normalised.hasUnresolvedAMLFlags
          ? 'Evidence is stale and AML flags are unresolved.'
          : normalised.hasStaleEvidence
            ? 'Some evidence is stale or missing. Review before approving.'
            : normalised.hasUnresolvedAMLFlags
              ? 'Unresolved AML flags detected. Escalation may be required.'
              : null,
      fetchedAt,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: null,
      source: 'mock',
      isDegraded: true,
      degradedReason: `Case detail request failed: ${msg}.`,
      fetchedAt,
    }
  }
}

// ---------------------------------------------------------------------------
// Build drill-down state from normalised backend detail
// ---------------------------------------------------------------------------

/**
 * Convert a NormalisedCaseDetail (from the backend normalizer) into the
 * CaseDrillDownState shape used by CaseDrillDownPanel.vue.
 *
 * This function bridges the normalizer output to the caseDrillDown utility
 * types so the panel can render backend-backed data using exactly the same
 * template logic as fixture-derived state.
 */
export function buildDrillDownFromNormalisedDetail(
  workItem: WorkItem,
  detail: NormalisedCaseDetail,
): CaseDrillDownState {
  const now = Date.now()

  // Convert normalised evidence items to EvidenceGroup[]
  const evidenceGroups: EvidenceGroup[] = buildEvidenceGroupsFromDetail(detail)

  // Build timeline from normalised remediation and detail
  const timeline: TimelineEvent[] = buildTimelineFromDetail(detail, now)

  // Build approval history from detail
  const approvalHistory: ApprovalRecord[] = buildApprovalHistoryFromDetail(detail)

  const blockerSummary = deriveBlockerSummary(workItem, evidenceGroups)
  const nextAction = deriveNextAction(workItem, evidenceGroups)
  const escalationOptions: EscalationOption[] = buildEscalationOptions(workItem)

  const isDegraded = detail.hasStaleEvidence || detail.hasUnresolvedAMLFlags
  const isReadyForApproval =
    !isDegraded &&
    evidenceGroups.every((g) => g.overallStatus === 'available')

  return {
    item: workItem,
    timeline,
    evidenceGroups,
    approvalHistory,
    blockerSummary,
    nextAction,
    escalationOptions,
    isDegraded,
    isReadyForApproval,
  }
}

// ---------------------------------------------------------------------------
// Helper: build a single EvidenceItem conforming to the exact interface
// ---------------------------------------------------------------------------

function makeEvidenceItem(
  id: string,
  _category: EvidenceCategory,
  label: string,
  note: string | null,
  status: 'available' | 'missing' | 'stale' | 'degraded',
  lastUpdatedAt: string | null,
): EvidenceItem {
  return { id, label, note, status, lastUpdatedAt }
}

/**
 * Build evidence groups from a normalised case detail.
 * Maps the evidence items to the EvidenceGroup[] structure used by the panel.
 */
function buildEvidenceGroupsFromDetail(detail: NormalisedCaseDetail): EvidenceGroup[] {
  const groups: EvidenceGroup[] = []

  // KYC / Identity verification group
  const kycItems = detail.evidenceItems.filter(
    (e) =>
      e.documentType.toLowerCase().includes('kyc') ||
      e.documentType.toLowerCase().includes('identity') ||
      e.documentType.toLowerCase().includes('passport') ||
      e.documentType.toLowerCase().includes('id'),
  )

  const kycGroupItems: EvidenceItem[] = kycItems.length > 0
    ? kycItems.map((e) => makeEvidenceItem(
        e.id,
        'identity_kyc',
        e.documentType,
        e.reviewerNotes || null,
        (e.isDeficient || e.isExpired ? 'stale' : 'available') as EvidenceItem['status'],
        null,
      ))
    : [makeEvidenceItem(
        `kyc-placeholder-${detail.summary.id}`,
        'identity_kyc',
        'KYC Identity Verification',
        detail.summary.kycApproved ? 'Identity verified' : 'Identity verification pending',
        detail.summary.kycApproved ? 'available' : 'missing',
        null,
      )]

  groups.push({
    category: 'identity_kyc',
    label: EVIDENCE_CATEGORY_LABELS.identity_kyc,
    description: EVIDENCE_CATEGORY_DESCRIPTIONS.identity_kyc,
    items: kycGroupItems,
    overallStatus: deriveGroupOverallStatus(kycGroupItems),
  })

  // AML screening group
  const amlItems = detail.evidenceItems.filter(
    (e) =>
      e.documentType.toLowerCase().includes('aml') ||
      e.documentType.toLowerCase().includes('screening') ||
      e.documentType.toLowerCase().includes('watchlist') ||
      e.documentType.toLowerCase().includes('sanction'),
  )

  const amlGroupItems: EvidenceItem[] = amlItems.length > 0
    ? amlItems.map((e) => makeEvidenceItem(
        e.id,
        'aml_sanctions',
        e.documentType,
        e.reviewerNotes || null,
        e.isDeficient ? 'stale' : 'available',
        null,
      ))
    : [makeEvidenceItem(
        `aml-placeholder-${detail.summary.id}`,
        'aml_sanctions',
        'AML Screening Result',
        detail.summary.amlClear
          ? `${detail.amlScreeningProvider}: clear`
          : detail.amlFlagReason
            ? `Flag reason: ${detail.amlFlagReason}`
            : 'AML screening in progress',
        detail.summary.amlClear ? 'available' : 'stale',
        null,
      )]

  groups.push({
    category: 'aml_sanctions',
    label: EVIDENCE_CATEGORY_LABELS.aml_sanctions,
    description: EVIDENCE_CATEGORY_DESCRIPTIONS.aml_sanctions,
    items: amlGroupItems,
    overallStatus: deriveGroupOverallStatus(amlGroupItems),
  })

  // Jurisdiction review → approval_history group (closest mapping)
  const jurisdictionItems: EvidenceItem[] = detail.jurisdictionEntries.length > 0
    ? detail.jurisdictionEntries.map((j, idx) => makeEvidenceItem(
        `jurisdiction-${idx}-${detail.summary.id}`,
        'approval_history',
        `${j.jurisdictionName} — ${j.jurisdictionCode}`,
        j.isBlocking
          ? `Restriction: ${j.restrictionReason || 'Not permitted in this jurisdiction'}`
          : `Outcome: ${j.outcomeLabel}`,
        j.isBlocking ? 'stale' : 'available',
        null,
      ))
    : [makeEvidenceItem(
        `jurisdiction-placeholder-${detail.summary.id}`,
        'approval_history',
        'Jurisdiction Eligibility Check',
        'No jurisdiction entries on record',
        'missing',
        null,
      )]

  groups.push({
    category: 'approval_history',
    label: 'Jurisdiction & Approval Review',
    description: EVIDENCE_CATEGORY_DESCRIPTIONS.approval_history,
    items: jurisdictionItems,
    overallStatus: deriveGroupOverallStatus(jurisdictionItems),
  })

  // Regulator export package group (derived from evidencePackComplete)
  const exportItems: EvidenceItem[] = [
    makeEvidenceItem(
      `export-pack-${detail.summary.id}`,
      'export_regulator_package',
      'Audit trail export',
      detail.evidencePackComplete
        ? 'Complete evidence pack — ready for regulator export'
        : 'Evidence pack incomplete — requires remediation before export',
      detail.evidencePackComplete ? 'available' : 'missing',
      null,
    ),
  ]

  groups.push({
    category: 'export_regulator_package',
    label: EVIDENCE_CATEGORY_LABELS.export_regulator_package,
    description: EVIDENCE_CATEGORY_DESCRIPTIONS.export_regulator_package,
    items: exportItems,
    overallStatus: deriveGroupOverallStatus(exportItems),
  })

  return groups
}

/**
 * Build a timeline from normalised case detail data.
 * Uses remediation tasks, review dates, and AML info to construct events.
 */
function buildTimelineFromDetail(detail: NormalisedCaseDetail, now: number): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Case opened event
  events.push({
    id: `opened-${detail.summary.id}`,
    type: 'case_opened',
    timestamp: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
    actor: 'System',
    summary: `Case opened — ${detail.summary.entityName}`,
    detail: `Entity type: ${detail.summary.entityType}. Reference: ${detail.summary.referenceNumber}`,
    isSignificant: true,
  })

  // KYC verification event
  if (detail.kycVerifiedAt && detail.kycVerifiedAt !== 'Not verified') {
    events.push({
      id: `kyc-${detail.summary.id}`,
      type: detail.summary.kycApproved ? 'evidence_submitted' : 'evidence_rejected',
      timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      actor: detail.kycVerifiedBy ?? 'Compliance Team',
      summary: detail.summary.kycApproved ? 'KYC identity verification completed' : 'KYC verification issue',
      detail: detail.kycDiscrepancyNotes || null,
      isSignificant: true,
    })
  }

  // AML screening event
  if (detail.amlScreenedAt && detail.amlScreenedAt !== 'Not screened') {
    events.push({
      id: `aml-${detail.summary.id}`,
      type: detail.summary.amlClear ? 'evidence_submitted' : 'escalated',
      timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actor: detail.amlScreeningProvider ?? 'AML System',
      summary: detail.summary.amlClear
        ? 'AML screening cleared'
        : `AML flag raised: ${detail.amlFlagReason || 'watchlist hit'}`,
      detail: detail.amlEscalationNotes || null,
      isSignificant: !detail.summary.amlClear,
    })
  }

  // Remediation task events
  detail.remediationTasks.forEach((task, idx) => {
    events.push({
      id: `task-${idx}-${detail.summary.id}`,
      type: task.isOverdue ? 'sla_warning' : 'note_added',
      timestamp: new Date(now - (3 - idx) * 24 * 60 * 60 * 1000).toISOString(),
      actor: task.assignedTo ?? 'Operations Team',
      summary: `${task.isOverdue ? '[OVERDUE] ' : ''}${task.title}`,
      detail: task.description ?? null,
      isSignificant: task.isOverdue || task.isBlocking,
    })
  })

  // Internal notes as a note event
  if (detail.internalNotes) {
    events.push({
      id: `notes-${detail.summary.id}`,
      type: 'note_added',
      timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Reviewer',
      summary: 'Internal review note added',
      detail: detail.internalNotes,
      isSignificant: false,
    })
  }

  return sortTimelineEvents(events)
}

/**
 * Build approval records from normalised case detail data.
 */
function buildApprovalHistoryFromDetail(detail: NormalisedCaseDetail): ApprovalRecord[] {
  const records: ApprovalRecord[] = []

  if (detail.kycVerifiedAt !== 'Not verified') {
    records.push({
      id: `kyc-approval-${detail.summary.id}`,
      actor: detail.kycVerifiedBy,
      role: 'KYC Compliance Officer',
      decision: detail.summary.kycApproved ? 'approved' : 'returned',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      note: detail.summary.kycApproved
        ? 'Identity documents verified and approved.'
        : `Identity verification issue: ${detail.kycDiscrepancyNotes || 'discrepancy noted'}`,
    })
  }

  if (detail.amlScreenedAt !== 'Not screened') {
    records.push({
      id: `aml-approval-${detail.summary.id}`,
      actor: detail.amlScreeningProvider ?? 'AML System',
      role: 'AML Screening System',
      decision: detail.summary.amlClear ? 'approved' : 'escalated',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      note: detail.summary.amlClear
        ? `AML screening clear via ${detail.amlScreeningProvider}.`
        : `AML flag: ${detail.amlFlagReason || 'potential match found'}`,
    })
  }

  return records
}

// ---------------------------------------------------------------------------
// Escalation submission
// ---------------------------------------------------------------------------

export interface EscalationSubmitPayload {
  caseId: string
  reason: string
  note: string
  destination: string
}

export interface EscalationSubmitResult {
  success: boolean
  source: DataSource
  errorMessage: string | null
}

/**
 * Submit a case escalation to the backend remediation endpoint.
 * Returns a fail-closed result: if submission fails, returns success=false with
 * a clear error message rather than a silent success.
 */
export async function submitLiveEscalation(
  payload: EscalationSubmitPayload,
  bearerToken: string | null | undefined,
): Promise<EscalationSubmitResult> {
  if (!bearerToken) {
    return {
      success: false,
      source: 'mock',
      errorMessage: 'No authentication token. Escalation cannot be submitted to the backend.',
    }
  }

  const client = createComplianceCaseClient(bearerToken)
  if (!client) {
    return {
      success: false,
      source: 'mock',
      errorMessage: 'API client unavailable. Escalation could not be submitted.',
    }
  }

  try {
    const taskId = `escalation-${Date.now()}`
    const result = await client.submitRemediationAction(
      payload.caseId,
      taskId,
      'ESCALATED',
      `Escalation reason: ${payload.reason}. Destination: ${payload.destination}. Note: ${payload.note}`,
    )

    if (!result.ok) {
      return {
        success: false,
        source: 'live',
        errorMessage: `Escalation submission failed (${result.error.httpStatus}). Please try again or contact your administrator.`,
      }
    }

    return {
      success: true,
      source: 'live',
      errorMessage: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      source: 'live',
      errorMessage: `Escalation submission error: ${msg}.`,
    }
  }
}

// ---------------------------------------------------------------------------
// Data-provenance label helpers
// ---------------------------------------------------------------------------

/** Return a short label string describing the data provenance. */
export function dataSourceLabel(source: DataSource, isDegraded: boolean): string {
  if (source === 'live' && !isDegraded) return 'Live backend data'
  if (source === 'live' && isDegraded) return 'Live data — partially degraded'
  return 'Demo data — backend unavailable'
}

/** Return CSS classes for the provenance indicator badge. */
export function dataSourceBadgeClass(source: DataSource, isDegraded: boolean): string {
  if (source === 'live' && !isDegraded) return 'bg-green-900/40 text-green-300 border border-green-700'
  if (source === 'live' && isDegraded) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
  return 'bg-gray-800 text-gray-400 border border-gray-600'
}
