/**
 * complianceReportingWorkspace.ts
 *
 * Typed helpers for the enterprise compliance reporting workspace:
 * audience-aware report presets, export-package readiness derivation,
 * approval-history summary types, and audience-specific text report builders.
 *
 * Designed to be backend-ready — all types and helpers can be hydrated from
 * API responses once a backend export service is available.
 */

import type { ComplianceReportBundle } from './complianceEvidencePack'

// ---------------------------------------------------------------------------
// Audience presets
// ---------------------------------------------------------------------------

/** Enterprise stakeholder audience for a compliance report. */
export type AudiencePreset = 'all' | 'compliance' | 'procurement' | 'executive'

export const AUDIENCE_PRESET_LABELS: Record<AudiencePreset, string> = {
  all: 'Full Report',
  compliance: 'Compliance Review',
  procurement: 'Procurement Review',
  executive: 'Executive Sign-off',
}

export const AUDIENCE_PRESET_DESCRIPTIONS: Record<AudiencePreset, string> = {
  all: 'Complete compliance evidence package — all sections, all details.',
  compliance:
    'Focused on regulatory obligations, KYC/AML posture, jurisdiction coverage, and evidence freshness. Suitable for compliance officer review.',
  procurement:
    'Highlights controls in place, policy decisions, and outstanding obligations. Designed for procurement and vendor-risk teams.',
  executive:
    'High-level readiness summary, critical blockers, and sign-off status. Suitable for executive or board review.',
}

/** Sections a given audience cares most about, in display priority order. */
export const AUDIENCE_SECTION_PRIORITIES: Record<AudiencePreset, string[]> = {
  all: ['overall', 'jurisdiction', 'kyc_aml', 'whitelist', 'investor_eligibility', 'evidence', 'approval_history', 'evidence_manifest', 'contradictions', 'export'],
  compliance: ['overall', 'kyc_aml', 'jurisdiction', 'investor_eligibility', 'whitelist', 'evidence', 'approval_history', 'evidence_manifest', 'contradictions', 'export'],
  procurement: ['overall', 'whitelist', 'jurisdiction', 'kyc_aml', 'investor_eligibility', 'evidence', 'evidence_manifest', 'contradictions', 'export'],
  executive: ['overall', 'approval_history', 'evidence', 'evidence_manifest', 'contradictions', 'export'],
}

// ---------------------------------------------------------------------------
// Approval history types (backend-ready)
// ---------------------------------------------------------------------------

export type ApprovalOutcome = 'approved' | 'conditionally_approved' | 'blocked' | 'pending' | 'not_started'

export const APPROVAL_OUTCOME_LABELS: Record<ApprovalOutcome, string> = {
  approved: 'Approved',
  conditionally_approved: 'Conditionally Approved',
  blocked: 'Blocked',
  pending: 'Under Review',
  not_started: 'Not Started',
}

export interface ApprovalHistoryEntry {
  /** Unique stage identifier */
  id: string
  /** Display name for the stage */
  label: string
  /** Reviewer role domain */
  reviewerRole: string
  /** Outcome of the review stage */
  outcome: ApprovalOutcome
  /** ISO timestamp when this stage was last actioned */
  actionedAt: string | null
  /** Optional conditions attached to a conditional approval */
  conditions: string | null
  /** Summary explanation of the outcome */
  summary: string
  /** Whether this stage is launch-blocking in its current state */
  isLaunchBlocking: boolean
}

export interface ApprovalHistorySummary {
  /** Total number of approval stages */
  totalStages: number
  /** Number of fully approved stages */
  approvedCount: number
  /** Number of stages with conditions attached */
  conditionalCount: number
  /** Number of currently blocked stages */
  blockedCount: number
  /** Number of stages not yet started or under review */
  pendingCount: number
  /** Whether all launch-critical stages are signed off */
  allLaunchCriticalSigned: boolean
  /** Entries in chronological order */
  entries: ApprovalHistoryEntry[]
  /** ISO timestamp of most recent action */
  lastActionAt: string | null
}

// ---------------------------------------------------------------------------
// Export package readiness
// ---------------------------------------------------------------------------

export type ExportReadinessStatus = 'ready_for_external' | 'ready_for_internal' | 'incomplete' | 'blocked'

export const EXPORT_READINESS_LABELS: Record<ExportReadinessStatus, string> = {
  ready_for_external: 'Ready for External Review',
  ready_for_internal: 'Ready for Internal Sign-off',
  incomplete: 'Evidence Package Incomplete',
  blocked: 'Export Blocked — Critical Issues Present',
}

export const EXPORT_READINESS_DESCRIPTIONS: Record<ExportReadinessStatus, string> = {
  ready_for_external:
    'All required compliance evidence is present, fresh, and approved. This package can be shared with external reviewers, regulators, or procurement teams.',
  ready_for_internal:
    'Evidence is sufficient for internal sign-off review. Some items may need follow-up before sharing externally.',
  incomplete:
    'One or more required evidence items are missing or pending. Complete the Compliance Setup before exporting.',
  blocked:
    'Critical compliance blockers are present. The export package cannot be used for sign-off until these are resolved.',
}

export interface ExportChecklistItem {
  id: string
  label: string
  description: string
  /** Whether this item is present in the report bundle */
  isPresent: boolean
  /**
   * Whether this item is in an actively failed/broken state (as opposed to simply
   * not yet configured). Used to distinguish blockers (active failures that need
   * remediation) from missing items (setup work not yet done).
   */
  isBlocked: boolean
  /** Whether this item is required for an external sign-off package */
  isRequiredForExternal: boolean
  /** Whether this item has a stale evidence flag */
  isStale: boolean
  /** Plain-language explanation of what to do if missing */
  remediationHint: string | null
}

export interface ExportPackageReadiness {
  status: ExportReadinessStatus
  headline: string
  rationale: string
  checklist: ExportChecklistItem[]
  /**
   * Number of checklist items that are required for external submission AND are
   * in an actively failed/broken state (e.g. KYC provider configured but failing).
   * These must be resolved before the package can be used at all.
   */
  blockerCount: number
  /**
   * Number of checklist items that are required for external submission AND have
   * not yet been configured (setup work not yet done). These gate completeness
   * but are not the same as active failures.
   */
  missingCount: number
  staleCount: number
  computedAt: string
}

// ---------------------------------------------------------------------------
// Readiness derivation helpers
// ---------------------------------------------------------------------------

/**
 * Derive an approval history summary from approval cockpit stage data.
 * Accepts the same `ApprovalStage[]` shape used by the approval cockpit so
 * the reporting workspace can be wired to the same backend data source.
 */
export function deriveApprovalHistorySummary(
  stages: Array<{
    id: string
    label: string
    role: string
    status: string
    lastActionAt: string | null
    conditions: string | null
    summary: string
    blockers: Array<{ isLaunchBlocking: boolean }>
  }>,
): ApprovalHistorySummary {
  const entries: ApprovalHistoryEntry[] = stages.map((s) => {
    const outcome = mapStageStatusToOutcome(s.status)
    const isLaunchBlocking =
      outcome === 'blocked' && s.blockers.some((b) => b.isLaunchBlocking)
    return {
      id: s.id,
      label: s.label,
      reviewerRole: s.role,
      outcome,
      actionedAt: s.lastActionAt,
      conditions: s.conditions,
      summary: s.summary,
      isLaunchBlocking,
    }
  })

  const approvedCount = entries.filter(
    (e) => e.outcome === 'approved' || e.outcome === 'conditionally_approved',
  ).length
  const conditionalCount = entries.filter((e) => e.outcome === 'conditionally_approved').length
  const blockedCount = entries.filter((e) => e.outcome === 'blocked').length
  const pendingCount = entries.filter(
    (e) => e.outcome === 'pending' || e.outcome === 'not_started',
  ).length
  const allLaunchCriticalSigned = entries.every(
    (e) => e.outcome === 'approved' || e.outcome === 'conditionally_approved',
  )

  const actionTimestamps = entries
    .map((e) => e.actionedAt)
    .filter((t): t is string => t !== null)
    .sort()
  const lastActionAt =
    actionTimestamps.length > 0 ? actionTimestamps[actionTimestamps.length - 1] : null

  return {
    totalStages: entries.length,
    approvedCount,
    conditionalCount,
    blockedCount,
    pendingCount,
    allLaunchCriticalSigned,
    entries,
    lastActionAt,
  }
}

function mapStageStatusToOutcome(status: string): ApprovalOutcome {
  switch (status) {
    case 'approved':
      return 'approved'
    case 'conditionally_approved':
      return 'conditionally_approved'
    case 'blocked':
    case 'needs_attention':
      return 'blocked'
    case 'in_review':
    case 'ready_for_review':
      return 'pending'
    default:
      return 'not_started'
  }
}

/**
 * Returns true if an EvidenceStatus indicates the evidence section is present
 * and usable (either fully ready or in a warning state with caveats).
 * Used consistently across checklist item construction.
 */
function isStatusPresent(status: string): boolean {
  return status === 'ready' || status === 'warning'
}

// ---------------------------------------------------------------------------
// Export package readiness derivation
// ---------------------------------------------------------------------------

const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Returns true if a timestamp is older than STALE_THRESHOLD_MS.
 * Accepts an optional `now` parameter for deterministic testing.
 */
export function isTimestampStale(timestamp: string | null, now: number = Date.now()): boolean {
  if (!timestamp) return false
  return now - new Date(timestamp).getTime() > STALE_THRESHOLD_MS
}

/**
 * Derives the export package readiness state from a compliance report bundle.
 * Fail-closed: any missing or failed section downgrades the export status.
 */
export function deriveExportPackageReadiness(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null,
): ExportPackageReadiness {
  const now = new Date().toISOString()

  const checklist: ExportChecklistItem[] = [
    {
      id: 'jurisdiction',
      label: 'Jurisdiction Coverage',
      description: 'Operator has configured permitted and restricted jurisdictions.',
      isPresent: bundle.jurisdiction.configured,
      // Jurisdiction has no "failed" state — it is either configured or not yet set up
      isBlocked: false,
      isRequiredForExternal: true,
      isStale: isTimestampStale(bundle.jurisdiction.staleSince),
      remediationHint: bundle.jurisdiction.configured
        ? null
        : 'Configure jurisdiction coverage in Compliance Setup before exporting.',
    },
    {
      id: 'kyc_aml',
      label: 'KYC / AML Posture',
      description: 'KYC and AML requirements are defined and provider is configured.',
      isPresent: isStatusPresent(bundle.kycAml.status),
      // KYC is an active blocker when it has been configured but is in a failed state
      isBlocked: bundle.kycAml.status === 'failed',
      isRequiredForExternal: true,
      isStale: isTimestampStale(bundle.kycAml.staleSince),
      remediationHint:
        bundle.kycAml.status === 'failed'
          ? 'KYC is required but no provider is configured. Add a provider in Compliance Setup.'
          : bundle.kycAml.pendingReviewCount > 0
            ? `${bundle.kycAml.pendingReviewCount} KYC review(s) are pending. Complete them before exporting.`
            : bundle.kycAml.status === 'pending'
              ? 'KYC/AML configuration is in progress. Complete the setup before exporting.'
              : null,
    },
    {
      id: 'whitelist',
      label: 'Investor Whitelist',
      description: 'Whitelist posture is defined, and approved investors are present if required.',
      isPresent: isStatusPresent(bundle.whitelist.status),
      // Whitelist is an active blocker when required and has no approved investors
      isBlocked: bundle.whitelist.status === 'failed',
      isRequiredForExternal: true,
      isStale: isTimestampStale(bundle.whitelist.staleSince),
      remediationHint:
        bundle.whitelist.status === 'failed'
          ? 'Whitelist is required but has no approved investors. Add investors in Whitelist Policy.'
          : bundle.whitelist.whitelistRequired && bundle.whitelist.approvedInvestorCount === 0
            ? 'No investors have been approved yet. Approve at least one investor before exporting.'
            : bundle.whitelist.whitelistRequired && bundle.whitelist.pendingInvestorCount > 0
              ? `${bundle.whitelist.pendingInvestorCount} investor application(s) are pending review.`
              : null,
    },
    {
      id: 'investor_eligibility',
      label: 'Investor Eligibility Policy',
      description: 'Accreditation requirements and retail access permissions are configured.',
      // Consistent with kyc_aml and whitelist: only 'ready' or 'warning' counts as present
      isPresent: isStatusPresent(bundle.investorEligibility.status),
      // Eligibility is an active blocker when it has been configured but failed
      isBlocked: bundle.investorEligibility.status === 'failed',
      isRequiredForExternal: true,
      isStale: isTimestampStale(bundle.investorEligibility.staleSince),
      remediationHint:
        bundle.investorEligibility.status === 'failed'
          ? 'Investor eligibility configuration has failed. Review and correct the policy settings in Compliance Setup.'
          : bundle.investorEligibility.status === 'pending'
            ? 'Complete Compliance Setup to define investor eligibility policy.'
            : bundle.investorEligibility.status === 'unavailable'
              ? 'Investor eligibility data is unavailable. Check your Compliance Setup configuration.'
              : null,
    },
    {
      id: 'approval_history',
      label: 'Approval Stage History',
      description:
        'At least one approval stage has been reviewed and its outcome recorded.',
      isPresent: approvalSummary !== null && approvalSummary.totalStages > 0,
      // Approval history has no "active failure" state — it is either present or not started
      isBlocked: false,
      isRequiredForExternal: false,
      isStale: false,
      remediationHint:
        approvalSummary === null || approvalSummary.totalStages === 0
          ? 'Open the Approval Queue to start the review workflow.'
          : null,
    },
  ]

  // blockerCount: required items that are in an actively failed/broken state.
  // These represent real compliance failures that block any use of the package.
  const blockerCount = checklist.filter(
    (item) => item.isRequiredForExternal && item.isBlocked,
  ).length

  // missingCount: required items that have not yet been configured.
  // These are setup gaps — work that hasn't been done yet, not active failures.
  const missingCount = checklist.filter(
    (item) => item.isRequiredForExternal && !item.isPresent && !item.isBlocked,
  ).length

  const staleCount = checklist.filter((item) => item.isStale).length

  let status: ExportReadinessStatus
  let headline: string
  let rationale: string

  if (blockerCount > 0 || bundle.overallStatus === 'failed') {
    // Active compliance failures block any use of the export package
    status = 'blocked'
    headline = EXPORT_READINESS_LABELS.blocked
    rationale =
      'One or more critical compliance controls are in a failed state. The export package cannot be used for sign-off until these are resolved. Review the blockers above and complete the required setup.'
  } else if (missingCount > 0) {
    // Required evidence has not yet been configured
    status = 'incomplete'
    headline = EXPORT_READINESS_LABELS.incomplete
    rationale = `${missingCount} required evidence item${missingCount !== 1 ? 's are' : ' is'} missing. Complete the Compliance Setup workflow before generating an exportable package.`
  } else if (staleCount > 0) {
    // All items are present but some evidence needs refreshing
    status = 'ready_for_internal'
    headline = EXPORT_READINESS_LABELS.ready_for_internal
    rationale =
      'Some evidence items are stale and should be refreshed before external submission. The package can be used for internal review in the meantime.'
  } else if (bundle.overallStatus === 'ready' && approvalSummary && approvalSummary.allLaunchCriticalSigned) {
    // All evidence present, fresh, and approval workflow complete
    status = 'ready_for_external'
    headline = EXPORT_READINESS_LABELS.ready_for_external
    rationale =
      'All compliance controls are configured, evidence is present, and approval stages are signed off. This package is suitable for external review or regulator submission.'
  } else {
    // Evidence present and no active blockers — approval sign-off still pending
    status = 'ready_for_internal'
    headline = EXPORT_READINESS_LABELS.ready_for_internal
    rationale =
      'Compliance evidence is complete and controls are in place. Approval workflow sign-off is pending or evidence is in warning state. This package is suitable for internal review but not yet ready for external submission.'
  }

  return {
    status,
    headline,
    rationale,
    checklist,
    blockerCount,
    missingCount,
    staleCount,
    computedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Audience-specific text report builder
// ---------------------------------------------------------------------------

/**
 * Builds a plain-text compliance report tailored to the given audience.
 * Used for clipboard/text export with audience-focused content.
 */
export function buildAudienceReportText(
  bundle: ComplianceReportBundle,
  audience: AudiencePreset,
  approvalSummary: ApprovalHistorySummary | null,
  exportReadiness: ExportPackageReadiness,
): string {
  const line = '─'.repeat(60)
  const audienceLabel = AUDIENCE_PRESET_LABELS[audience]
  const generatedAt = bundle.generatedAt
    ? new Date(bundle.generatedAt).toUTCString()
    : 'Unknown date'
  const launchName = bundle.launchName ?? 'Unnamed Launch'

  const lines: string[] = [
    `BIATEC TOKENS — COMPLIANCE REPORT [${audienceLabel.toUpperCase()}]`,
    `Launch    : ${launchName}`,
    `Generated : ${generatedAt}`,
    line,
    '',
  ]

  // Always include overall status
  lines.push('OVERALL COMPLIANCE POSTURE')
  lines.push(line)
  lines.push(`Status          : ${(bundle.overallStatus ?? 'unknown').toUpperCase()}`)
  lines.push(`Readiness Score : ${bundle.readinessScore ?? 0}%`)
  lines.push(`Export Package  : ${exportReadiness.headline}`)
  lines.push(`Export Rationale: ${exportReadiness.rationale}`)
  lines.push('')

  const priorities = AUDIENCE_SECTION_PRIORITIES[audience] ?? AUDIENCE_SECTION_PRIORITIES.all

  if (priorities.includes('jurisdiction')) {
    lines.push('JURISDICTION COVERAGE')
    lines.push(line)
    lines.push(`Configured  : ${bundle.jurisdiction?.configured ? 'Yes' : 'No'}`)
    lines.push(`Permitted   : ${bundle.jurisdiction?.permittedCount ?? 0}`)
    lines.push(`Restricted  : ${bundle.jurisdiction?.restrictedCount ?? 0}`)
    const jurisdictions = bundle.jurisdiction?.jurisdictions ?? []
    if (jurisdictions.length > 0) {
      lines.push(`Jurisdictions: ${jurisdictions.join(', ')}`)
    }
    lines.push('')
  }

  if (priorities.includes('kyc_aml')) {
    lines.push('KYC / AML REVIEW STATUS')
    lines.push(line)
    lines.push(`Status             : ${(bundle.kycAml?.status ?? 'unknown').toUpperCase()}`)
    lines.push(`KYC Required       : ${bundle.kycAml?.kycRequired ? 'Yes' : 'No'}`)
    lines.push(`AML Required       : ${bundle.kycAml?.amlRequired ? 'Yes' : 'No'}`)
    lines.push(`Provider Configured: ${bundle.kycAml?.providerConfigured ? 'Yes' : 'No'}`)
    if ((bundle.kycAml?.pendingReviewCount ?? 0) > 0) {
      lines.push(`Pending Reviews    : ${bundle.kycAml.pendingReviewCount}`)
    }
    lines.push('')
  }

  if (priorities.includes('whitelist')) {
    lines.push('WHITELIST POSTURE')
    lines.push(line)
    lines.push(`Status             : ${(bundle.whitelist?.status ?? 'unknown').toUpperCase()}`)
    lines.push(`Whitelist Required : ${bundle.whitelist?.whitelistRequired ? 'Yes' : 'No'}`)
    lines.push(`Approved Investors : ${bundle.whitelist?.approvedInvestorCount ?? 0}`)
    lines.push(`Pending Investors  : ${bundle.whitelist?.pendingInvestorCount ?? 0}`)
    if (bundle.whitelist?.whitelistRequired && (bundle.whitelist?.approvedInvestorCount ?? 0) === 0) {
      lines.push('BLOCKER: Whitelist required but no approved investors.')
    }
    lines.push('')
  }

  if (priorities.includes('investor_eligibility')) {
    lines.push('INVESTOR ELIGIBILITY')
    lines.push(line)
    lines.push(`Status                : ${(bundle.investorEligibility?.status ?? 'unknown').toUpperCase()}`)
    lines.push(`Accredited Required   : ${bundle.investorEligibility?.accreditedRequired ? 'Yes' : 'No'}`)
    lines.push(`Retail Permitted      : ${bundle.investorEligibility?.retailPermitted ? 'Yes' : 'No'}`)
    const eligibilityCategories = bundle.investorEligibility?.eligibilityCategories ?? []
    if (eligibilityCategories.length > 0) {
      lines.push(`Eligibility Categories: ${eligibilityCategories.join(', ')}`)
    }
    lines.push('')
  }

  if (priorities.includes('approval_history') && approvalSummary) {
    lines.push('APPROVAL STAGE HISTORY')
    lines.push(line)
    lines.push(`Total Stages   : ${approvalSummary.totalStages}`)
    lines.push(`Approved       : ${approvalSummary.approvedCount}`)
    lines.push(`Conditional    : ${approvalSummary.conditionalCount}`)
    lines.push(`Blocked        : ${approvalSummary.blockedCount}`)
    lines.push(`Pending        : ${approvalSummary.pendingCount}`)
    lines.push(`All Signed-Off : ${approvalSummary.allLaunchCriticalSigned ? 'Yes' : 'No'}`)
    const entries = approvalSummary.entries ?? []
    if (entries.length > 0) {
      lines.push('')
      for (const entry of entries) {
        const outcomeLabel = APPROVAL_OUTCOME_LABELS[entry.outcome] ?? entry.outcome
        const ts = entry.actionedAt
          ? ` (${new Date(entry.actionedAt).toLocaleDateString()})`
          : ''
        lines.push(`  ${entry.label}: ${outcomeLabel}${ts}`)
        if (entry.conditions) lines.push(`    Conditions: ${entry.conditions}`)
      }
    }
    lines.push('')
  }

  lines.push(line)
  lines.push('Export Package Checklist:')
  for (const item of exportReadiness.checklist ?? []) {
    const itemStatus = item.isPresent
      ? '✓'
      : item.isBlocked
        ? '✗ BLOCKED'
        : item.isRequiredForExternal
          ? '✗ MISSING'
          : '○ Optional'
    const stale = item.isStale ? ' [STALE]' : ''
    lines.push(`  ${itemStatus}  ${item.label}${stale}`)
    if (!item.isPresent && item.remediationHint) {
      lines.push(`        → ${item.remediationHint}`)
    }
  }
  lines.push('')
  lines.push('This document was generated by Biatec Tokens Compliance Reporting Workspace.')
  lines.push('For full evidence details, open the Compliance Evidence Pack.')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// CSS / UI helpers
// ---------------------------------------------------------------------------

export function exportReadinessStatusClass(status: ExportReadinessStatus): string {
  const map: Record<ExportReadinessStatus, string> = {
    ready_for_external: 'bg-green-900/30 border-green-700/50 text-green-300',
    ready_for_internal: 'bg-blue-900/30 border-blue-700/50 text-blue-300',
    incomplete: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300',
    blocked: 'bg-red-900/30 border-red-700/50 text-red-300',
  }
  return map[status]
}

export function approvalOutcomeBadgeClass(outcome: ApprovalOutcome): string {
  const map: Record<ApprovalOutcome, string> = {
    approved: 'bg-green-800 text-green-200',
    conditionally_approved: 'bg-blue-800 text-blue-200',
    blocked: 'bg-red-800 text-red-200',
    pending: 'bg-yellow-800 text-yellow-200',
    not_started: 'bg-gray-700 text-gray-300',
  }
  return map[outcome]
}
