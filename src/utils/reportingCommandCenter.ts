/**
 * reportingCommandCenter.ts
 *
 * Typed helpers for the enterprise Reporting Command Center:
 * report template metadata, scheduled run types, evidence freshness
 * classification, cadence labels, run-status mapping, and CTA availability rules.
 *
 * Designed to be backend-ready — all types and helpers can be hydrated from
 * API responses once backend scheduling/delivery endpoints are available.
 * When a backend feature is unavailable, the relevant field is explicitly
 * `null` or `'unavailable'` so the UI can expose truthful states.
 */

// ---------------------------------------------------------------------------
// Report template audience
// ---------------------------------------------------------------------------

/** Enterprise audience for a saved report template. */
export type ReportAudience =
  | 'internal_compliance'
  | 'executive'
  | 'auditor'
  | 'regulator'

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  internal_compliance: 'Internal Compliance Committee',
  executive: 'Executive Leadership',
  auditor: 'External Auditor',
  regulator: 'Regulatory Authority',
}

export const REPORT_AUDIENCE_DESCRIPTIONS: Record<ReportAudience, string> = {
  internal_compliance:
    'Periodic review for the compliance committee — KYC/AML posture, jurisdiction coverage, evidence freshness, and open blockers.',
  executive:
    'High-signal summary for board or executive sponsors — launch readiness grade, critical risks, and sign-off status.',
  auditor:
    'Structured evidence package for external auditors — artifact inventory, approval history, and configuration proof.',
  regulator:
    'Regulator-facing evidence bundle — jurisdiction decisions, investor eligibility controls, and compliance certifications.',
}

// ---------------------------------------------------------------------------
// Report cadence
// ---------------------------------------------------------------------------

/** Recurrence schedule for a report template. */
export type ReportCadence =
  | 'monthly'
  | 'quarterly'
  | 'event_driven'
  | 'manual'

export const REPORT_CADENCE_LABELS: Record<ReportCadence, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  event_driven: 'Event-Driven',
  manual: 'Manual (One-Off)',
}

export const REPORT_CADENCE_DESCRIPTIONS: Record<ReportCadence, string> = {
  monthly: 'Generates automatically on the first business day of each month.',
  quarterly: 'Generates on the first business day of each calendar quarter.',
  event_driven: 'Triggered by a defined compliance event such as a new investor approval or jurisdiction change.',
  manual: 'Generated only on explicit operator request — no automatic scheduling.',
}

// ---------------------------------------------------------------------------
// Run status
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of a single report run.
 * The UI must render each status distinctly and never conflate blocked/degraded
 * states with ready or delivered ones.
 */
export type ReportRunStatus =
  | 'draft'
  | 'awaiting_review'
  | 'awaiting_approval'
  | 'scheduled'
  | 'blocked'
  | 'exported'
  | 'delivered'
  | 'degraded'

export const REPORT_RUN_STATUS_LABELS: Record<ReportRunStatus, string> = {
  draft: 'Draft',
  awaiting_review: 'Awaiting Review',
  awaiting_approval: 'Awaiting Approval',
  scheduled: 'Scheduled',
  blocked: 'Blocked',
  exported: 'Exported',
  delivered: 'Delivered',
  degraded: 'Degraded Data',
}

export const REPORT_RUN_STATUS_DESCRIPTIONS: Record<ReportRunStatus, string> = {
  draft: 'Report is being configured — not yet submitted for review.',
  awaiting_review: 'Report has been generated and is waiting for a reviewer to sign off.',
  awaiting_approval: 'Reviewed and awaiting final approver sign-off.',
  scheduled: 'Scheduled for automatic generation on the next cadence date.',
  blocked: 'Cannot proceed — one or more evidence dependencies are stale, missing, or unresolved.',
  exported: 'Report package has been exported and is ready for distribution.',
  delivered: 'Report has been delivered to the designated audience.',
  degraded: 'Report was generated but one or more evidence sources returned incomplete data.',
}

// ---------------------------------------------------------------------------
// Evidence freshness
// ---------------------------------------------------------------------------

/**
 * Freshness state of evidence linked to a report run or template.
 * Fail-closed: any state other than `fresh` must prevent a run from appearing
 * fully ready.
 */
export type EvidenceFreshnessState =
  | 'fresh'
  | 'stale'
  | 'missing'
  | 'unresolved_blocker'
  | 'unavailable'

export const EVIDENCE_FRESHNESS_LABELS: Record<EvidenceFreshnessState, string> = {
  fresh: 'Up to Date',
  stale: 'Stale Evidence',
  missing: 'Missing Evidence',
  unresolved_blocker: 'Unresolved Blocker',
  unavailable: 'Evidence Unavailable',
}

export const EVIDENCE_FRESHNESS_DESCRIPTIONS: Record<EvidenceFreshnessState, string> = {
  fresh: 'All linked evidence is current and within the acceptable freshness window.',
  stale: 'One or more evidence artifacts have not been refreshed within the required window.',
  missing: 'One or more required evidence items are absent and must be provided before this report can proceed.',
  unresolved_blocker: 'A compliance blocker is actively preventing this report from reaching a clean state.',
  unavailable: 'Evidence data could not be retrieved — the report cannot validate completeness.',
}

/** Returns true for states that block a run from proceeding. */
export function isEvidenceBlocking(state: EvidenceFreshnessState): boolean {
  return state === 'stale' || state === 'missing' || state === 'unresolved_blocker' || state === 'unavailable'
}

// ---------------------------------------------------------------------------
// Delivery destination
// ---------------------------------------------------------------------------

/** Where a report is delivered after approval. */
export type DeliveryDestination =
  | 'internal_portal'
  | 'email'
  | 'sftp_export'
  | 'unavailable'

export const DELIVERY_DESTINATION_LABELS: Record<DeliveryDestination, string> = {
  internal_portal: 'Internal Portal',
  email: 'Email Distribution',
  sftp_export: 'SFTP Export',
  unavailable: 'Delivery Not Configured',
}

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/** A saved report template that can be instantiated into report runs. */
export interface ReportTemplate {
  /** Unique template identifier */
  id: string
  /** Display name (plain language, non-technical) */
  name: string
  /** Short description of audience and data scope */
  description: string
  /** Primary audience this template is designed for */
  audience: ReportAudience
  /** Recurrence schedule */
  cadence: ReportCadence
  /** ISO date/time of next scheduled run, or null if manual/event-driven */
  nextRunAt: string | null
  /** ISO date/time of last completed run, or null if never run */
  lastRunAt: string | null
  /** Overall freshness state based on linked evidence domains */
  evidenceFreshness: EvidenceFreshnessState
  /** Evidence domain slugs included in this template */
  includedDomains: string[]
  /** Whether approver sign-off is required before export */
  requiresApproval: boolean
  /** Delivery destination after approval */
  deliveryDestination: DeliveryDestination
  /** Whether this template is active/enabled */
  isActive: boolean
}

/** A single execution of a report template — a report run. */
export interface ReportRun {
  /** Unique run identifier */
  id: string
  /** Template this run was generated from */
  templateId: string
  /** Template display name (denormalized for display) */
  templateName: string
  /** Audience for this run */
  audience: ReportAudience
  /** Current lifecycle status */
  status: ReportRunStatus
  /** Evidence freshness at run time */
  evidenceFreshness: EvidenceFreshnessState
  /** ISO date/time run was initiated */
  initiatedAt: string
  /** ISO date/time run was completed (exported/delivered), or null */
  completedAt: string | null
  /** Name of reviewer assigned to this run, or null */
  reviewerName: string | null
  /** Name of approver assigned to this run, or null */
  approverName: string | null
  /**
   * Human-readable summary of what changed since the prior run.
   * null if this is the first run or if a diff is not available.
   */
  changeSummary: ChangeSummary | null
  /** Blockers preventing this run from proceeding, if any */
  blockers: ReportBlocker[]
  /**
   * Link to the relevant remediation surface for the primary blocker.
   * null if no blocker or remediation path is known.
   */
  remediationPath: string | null
}

/**
 * Summary of what changed between the previous and current report run.
 * Displayed to operators to explain new approvals, resolved blockers,
 * and remaining risks.
 */
export interface ChangeSummary {
  /** Number of previously blocked items now resolved */
  resolvedBlockerCount: number
  /** Number of new approvals since the last report */
  newApprovalCount: number
  /** Number of evidence items refreshed since the last report */
  refreshedEvidenceCount: number
  /** Number of remaining open risks */
  remainingRiskCount: number
  /** Plain-language highlights for display */
  highlights: string[]
}

/** A blocker preventing a report run from proceeding. */
export interface ReportBlocker {
  /** Short identifier for the blocker domain */
  domain: string
  /** Plain-language description */
  description: string
  /** Severity of this blocker */
  severity: 'critical' | 'high' | 'medium'
  /** Link to remediation workspace */
  remediationPath: string
}

/** Aggregated workspace state used by the command center summary cards. */
export interface CommandCenterSummary {
  /** Number of report runs currently scheduled */
  scheduledRunCount: number
  /** Number of report runs currently blocked */
  blockedRunCount: number
  /** Number of templates with stale evidence */
  staleEvidenceCount: number
  /** Number of runs awaiting reviewer or approver action */
  awaitingActionCount: number
}

// ---------------------------------------------------------------------------
// Derive helpers
// ---------------------------------------------------------------------------

/**
 * Derives the command-center summary counts from a list of templates and runs.
 * Fail-closed: any blocked or stale state increments the relevant counter.
 */
export function deriveCommandCenterSummary(
  templates: ReportTemplate[],
  runs: ReportRun[],
): CommandCenterSummary {
  const scheduledRunCount = runs.filter((r) => r.status === 'scheduled').length
  const blockedRunCount = runs.filter((r) => r.status === 'blocked').length
  const staleEvidenceCount = templates.filter(
    (t) => t.evidenceFreshness === 'stale' || t.evidenceFreshness === 'missing' || t.evidenceFreshness === 'unresolved_blocker',
  ).length
  const awaitingActionCount = runs.filter(
    (r) => r.status === 'awaiting_review' || r.status === 'awaiting_approval',
  ).length
  return { scheduledRunCount, blockedRunCount, staleEvidenceCount, awaitingActionCount }
}

/**
 * Returns whether a report run has an available CTA action.
 * Blocked and degraded runs do not expose primary action buttons.
 */
export function getRunCta(run: ReportRun): 'review' | 'approve' | 'export' | 'view_blockers' | 'view' | null {
  switch (run.status) {
    case 'awaiting_review':
      return 'review'
    case 'awaiting_approval':
      return 'approve'
    case 'exported':
    case 'delivered':
      return 'view'
    case 'blocked':
    case 'degraded':
      return 'view_blockers'
    default:
      return null
  }
}

/**
 * Maps a run status to a CSS badge class for visual differentiation.
 * Non-color indicators are also present (text labels) so status is never
 * conveyed by color alone (WCAG SC 1.4.1).
 */
export function runStatusBadgeClass(status: ReportRunStatus): string {
  switch (status) {
    case 'delivered':
    case 'exported':
      return 'bg-green-900 text-green-200 border border-green-700'
    case 'awaiting_review':
    case 'awaiting_approval':
      return 'bg-yellow-900 text-yellow-200 border border-yellow-700'
    case 'scheduled':
      return 'bg-blue-900 text-blue-200 border border-blue-700'
    case 'blocked':
      return 'bg-red-900 text-red-200 border border-red-700'
    case 'degraded':
      return 'bg-orange-900 text-orange-200 border border-orange-700'
    case 'draft':
    default:
      return 'bg-gray-800 text-gray-300 border border-gray-600'
  }
}

/**
 * Maps evidence freshness to a CSS badge class.
 */
export function freshnessIndicatorClass(state: EvidenceFreshnessState): string {
  switch (state) {
    case 'fresh':
      return 'bg-green-900 text-green-200 border border-green-700'
    case 'stale':
      return 'bg-yellow-900 text-yellow-200 border border-yellow-700'
    case 'missing':
    case 'unresolved_blocker':
      return 'bg-red-900 text-red-200 border border-red-700'
    case 'unavailable':
    default:
      return 'bg-gray-800 text-gray-300 border border-gray-600'
  }
}

/**
 * Maps evidence freshness to a card border class (non-color indicator via
 * border-l styling so WCAG SC 1.4.1 is satisfied by shape).
 */
export function templateCardBorderClass(state: EvidenceFreshnessState): string {
  switch (state) {
    case 'fresh':
      return 'border-l-4 border-l-green-500'
    case 'stale':
      return 'border-l-4 border-l-yellow-500'
    case 'missing':
    case 'unresolved_blocker':
      return 'border-l-4 border-l-red-500'
    case 'unavailable':
    default:
      return 'border-l-4 border-l-gray-600'
  }
}

/**
 * Returns a plain-language cadence label combining cadence and next-run info.
 */
export function buildCadenceLabel(cadence: ReportCadence, nextRunAt: string | null): string {
  const cadenceLabel = REPORT_CADENCE_LABELS[cadence]
  if (!nextRunAt) return cadenceLabel
  const date = new Date(nextRunAt)
  if (isNaN(date.getTime())) return cadenceLabel
  const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  return `${cadenceLabel} — Next run: ${formatted}`
}

// ---------------------------------------------------------------------------
// Test-ID constants
// ---------------------------------------------------------------------------

/** Stable data-testid attribute values for E2E and unit tests. */
export const REPORTING_CENTER_TEST_IDS = {
  PAGE_ROOT: 'reporting-command-center',
  PAGE_HEADING: 'reporting-center-heading',
  SKIP_LINK: 'reporting-center-skip-link',

  // Summary cards
  SUMMARY_SCHEDULED: 'summary-card-scheduled',
  SUMMARY_BLOCKED: 'summary-card-blocked',
  SUMMARY_STALE: 'summary-card-stale',
  SUMMARY_AWAITING: 'summary-card-awaiting',

  // Templates section
  TEMPLATES_SECTION: 'report-templates-section',
  TEMPLATE_CARD: 'report-template-card',
  TEMPLATE_AUDIENCE_BADGE: 'template-audience-badge',
  TEMPLATE_FRESHNESS_BADGE: 'template-freshness-badge',
  TEMPLATE_CADENCE_CHIP: 'template-cadence-chip',
  TEMPLATE_RUN_CTA: 'template-run-cta',

  // In-flight runs section
  RUNS_SECTION: 'report-runs-section',
  RUN_ROW: 'report-run-row',
  RUN_STATUS_BADGE: 'run-status-badge',
  RUN_CHANGE_SUMMARY: 'run-change-summary',
  RUN_CTA_BUTTON: 'run-cta-button',
  RUN_BLOCKER_LINK: 'run-blocker-link',

  // Create run / configure panel
  CREATE_RUN_BUTTON: 'create-report-run-button',
  CONFIGURE_PANEL: 'report-configure-panel',
  PANEL_AUDIENCE_SELECT: 'configure-audience-select',
  PANEL_CADENCE_SELECT: 'configure-cadence-select',
  PANEL_CLOSE: 'configure-panel-close',

  // Status states
  LOADING_STATE: 'reporting-center-loading',
  EMPTY_STATE: 'reporting-center-empty',
  DEGRADED_BANNER: 'reporting-center-degraded',
  UNAUTHORIZED_STATE: 'reporting-center-unauthorized',
} as const

// ---------------------------------------------------------------------------
// Deterministic fixtures (representative enterprise conditions)
// ---------------------------------------------------------------------------

export const MOCK_TEMPLATES_HEALTHY: ReportTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Quarterly Compliance Review',
    description: 'Periodic compliance committee review covering KYC/AML, jurisdiction, and evidence freshness.',
    audience: 'internal_compliance',
    cadence: 'quarterly',
    nextRunAt: '2026-04-01T09:00:00Z',
    lastRunAt: '2026-01-02T09:15:00Z',
    evidenceFreshness: 'fresh',
    includedDomains: ['kyc_aml', 'jurisdiction', 'whitelist', 'evidence_manifest'],
    requiresApproval: true,
    deliveryDestination: 'internal_portal',
    isActive: true,
  },
  {
    id: 'tpl-002',
    name: 'Board Readiness Update',
    description: 'High-signal executive summary — launch readiness grade, critical risks, and sign-off status.',
    audience: 'executive',
    cadence: 'monthly',
    nextRunAt: '2026-04-07T08:00:00Z',
    lastRunAt: '2026-03-03T08:05:00Z',
    evidenceFreshness: 'fresh',
    includedDomains: ['overall', 'approval_history', 'evidence'],
    requiresApproval: false,
    deliveryDestination: 'email',
    isActive: true,
  },
  {
    id: 'tpl-003',
    name: 'Regulator Evidence Package',
    description: 'Structured evidence bundle for regulatory submissions — jurisdiction decisions, investor controls, and certifications.',
    audience: 'regulator',
    cadence: 'event_driven',
    nextRunAt: null,
    lastRunAt: '2026-02-15T14:30:00Z',
    evidenceFreshness: 'fresh',
    includedDomains: ['jurisdiction', 'kyc_aml', 'whitelist', 'investor_eligibility', 'approval_history'],
    requiresApproval: true,
    deliveryDestination: 'sftp_export',
    isActive: true,
  },
  {
    id: 'tpl-004',
    name: 'Auditor Evidence Bundle',
    description: 'Artifact inventory, approval history, and configuration proof for external audit review.',
    audience: 'auditor',
    cadence: 'manual',
    nextRunAt: null,
    lastRunAt: null,
    evidenceFreshness: 'fresh',
    includedDomains: ['evidence_manifest', 'approval_history', 'kyc_aml', 'jurisdiction'],
    requiresApproval: true,
    deliveryDestination: 'sftp_export',
    isActive: true,
  },
]

export const MOCK_TEMPLATES_BLOCKED: ReportTemplate[] = [
  {
    ...MOCK_TEMPLATES_HEALTHY[0],
    evidenceFreshness: 'stale',
  },
  {
    ...MOCK_TEMPLATES_HEALTHY[1],
    evidenceFreshness: 'fresh',
  },
  {
    ...MOCK_TEMPLATES_HEALTHY[2],
    evidenceFreshness: 'missing',
  },
  {
    ...MOCK_TEMPLATES_HEALTHY[3],
    evidenceFreshness: 'unresolved_blocker',
  },
]

export const MOCK_RUNS_ACTIVE: ReportRun[] = [
  {
    id: 'run-001',
    templateId: 'tpl-001',
    templateName: 'Quarterly Compliance Review',
    audience: 'internal_compliance',
    status: 'awaiting_approval',
    evidenceFreshness: 'fresh',
    initiatedAt: '2026-03-15T10:00:00Z',
    completedAt: null,
    reviewerName: 'Sarah Chen',
    approverName: 'James Whitfield',
    changeSummary: {
      resolvedBlockerCount: 2,
      newApprovalCount: 3,
      refreshedEvidenceCount: 5,
      remainingRiskCount: 1,
      highlights: [
        '2 previously blocked KYC items resolved',
        '3 new approvals since January quarterly report',
        'Germany jurisdiction restriction updated',
        '1 open risk: FATF grey-list monitoring required',
      ],
    },
    blockers: [],
    remediationPath: null,
  },
  {
    id: 'run-002',
    templateId: 'tpl-003',
    templateName: 'Regulator Evidence Package',
    audience: 'regulator',
    status: 'blocked',
    evidenceFreshness: 'unresolved_blocker',
    initiatedAt: '2026-03-14T09:30:00Z',
    completedAt: null,
    reviewerName: null,
    approverName: null,
    changeSummary: null,
    blockers: [
      {
        domain: 'kyc_aml',
        description: 'KYC/AML provider configuration incomplete — required credentials missing',
        severity: 'critical',
        remediationPath: '/compliance/setup',
      },
    ],
    remediationPath: '/compliance/setup',
  },
  {
    id: 'run-003',
    templateId: 'tpl-002',
    templateName: 'Board Readiness Update',
    audience: 'executive',
    status: 'delivered',
    evidenceFreshness: 'fresh',
    initiatedAt: '2026-03-03T08:05:00Z',
    completedAt: '2026-03-03T08:20:00Z',
    reviewerName: 'Sarah Chen',
    approverName: null,
    changeSummary: {
      resolvedBlockerCount: 1,
      newApprovalCount: 1,
      refreshedEvidenceCount: 3,
      remainingRiskCount: 0,
      highlights: [
        '1 launch blocker resolved since February',
        'Compliance score improved from 82 to 94',
        'All protected sign-off stages complete',
      ],
    },
    blockers: [],
    remediationPath: null,
  },
]
