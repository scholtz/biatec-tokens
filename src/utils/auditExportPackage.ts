/**
 * auditExportPackage.ts
 *
 * Typed helpers for assembling regulator-ready audit export packages from
 * compliance workspace data. Provides evidence manifest construction,
 * chronological evidence timeline building, contradiction detection, and
 * audience-specific audit package assembly.
 *
 * Designed to be backend-ready — all types can be hydrated from future API
 * responses without architectural changes. Backend contract gaps are called
 * out inline with TODO comments so the dependency is explicit.
 */

import type { ComplianceReportBundle } from './complianceEvidencePack'
import type {
  AudiencePreset,
  ApprovalHistorySummary,
  ExportPackageReadiness,
  ExportReadinessStatus,
} from './complianceReportingWorkspace'
import { AUDIENCE_PRESET_LABELS, isTimestampStale } from './complianceReportingWorkspace'

// ---------------------------------------------------------------------------
// Evidence manifest types
// ---------------------------------------------------------------------------

/**
 * The type of underlying compliance evidence source.
 * Backend-ready: each source type maps to a distinct backend data provider
 * once the compliance evidence API is available.
 */
export type EvidenceSourceType =
  | 'jurisdiction'
  | 'kyc_aml'
  | 'whitelist'
  | 'investor_eligibility'
  | 'approval_stage'
  | 'evidence_section'

/**
 * Authority level of a given evidence entry.
 * - 'authoritative': comes directly from a verified backend source
 * - 'derived': computed from operator-configured data (e.g. localStorage)
 * - 'pending': evidence is in progress and not yet reliable
 * - 'blocked': evidence source reports a failure state
 */
export type EvidenceAuthorityLevel = 'authoritative' | 'derived' | 'pending' | 'blocked'

export const EVIDENCE_AUTHORITY_LABELS: Record<EvidenceAuthorityLevel, string> = {
  authoritative: 'Backend-Verified',
  derived: 'Operator-Configured',
  pending: 'Evidence Pending',
  blocked: 'Evidence Blocked',
}

export const EVIDENCE_AUTHORITY_DESCRIPTIONS: Record<EvidenceAuthorityLevel, string> = {
  authoritative:
    'This evidence has been verified by the backend compliance service and is suitable for external review.',
  derived:
    'This evidence is derived from operator-configured data. It reflects operator intent but has not been independently verified by a backend service.',
  pending:
    'Evidence collection for this item is in progress. Do not include this item in a regulator-ready package.',
  blocked:
    'This evidence source is reporting a failure or is unavailable. It must be resolved before the package can be used for sign-off.',
}

/** A single entry in the evidence manifest for an audit export package. */
export interface EvidenceManifestEntry {
  /** Unique stable identifier for this manifest item */
  id: string
  /** Human-readable label for the evidence source */
  label: string
  /** Category of evidence source */
  sourceType: EvidenceSourceType
  /** How authoritative the evidence is */
  authorityLevel: EvidenceAuthorityLevel
  /** Whether this entry is included in the assembled package */
  isIncluded: boolean
  /** If excluded, the plain-language reason */
  exclusionReason: string | null
  /** ISO timestamp when this evidence was last verified/updated */
  lastVerifiedAt: string | null
  /** True if lastVerifiedAt is older than the stale threshold */
  isStale: boolean
  /** One-line summary of the evidence state */
  summaryText: string
  /**
   * TODO (backend contract): Once backend evidence API is available,
   * add a `backendVerificationId` field (string | null) that links this
   * manifest entry to the backend evidence record.
   */
}

// ---------------------------------------------------------------------------
// Evidence timeline types
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | 'configuration'
  | 'kyc_review'
  | 'approval'
  | 'remediation'
  | 'export'

/** A single event in the chronological compliance evidence timeline. */
export interface EvidenceTimelineEvent {
  /** Stable unique identifier */
  id: string
  /** ISO timestamp of the event */
  timestamp: string
  /** Category of event */
  eventType: TimelineEventType
  /** Display label */
  label: string
  /** Contextual detail */
  detail: string
  /** True if this event is required for a launch-blocking compliance decision */
  isLaunchCritical: boolean
}

// ---------------------------------------------------------------------------
// Contradiction types
// ---------------------------------------------------------------------------

export type ContradictionSeverity = 'critical' | 'high' | 'medium'

export const CONTRADICTION_SEVERITY_LABELS: Record<ContradictionSeverity, string> = {
  critical: 'Critical Contradiction',
  high: 'High — Review Required',
  medium: 'Medium — Advisory',
}

/**
 * A detected inconsistency or conflict in the compliance evidence set.
 * Contradictions do NOT block export by themselves, but they must be
 * surfaced clearly so operators can make informed decisions.
 */
export interface ContradictionFlag {
  /** Stable unique identifier */
  id: string
  /** How critical the inconsistency is */
  severity: ContradictionSeverity
  /** Short title */
  title: string
  /** Plain-language description of the conflict */
  description: string
  /** IDs of sections/items affected */
  affectedSections: string[]
  /** What the operator should do to resolve it */
  remediationHint: string
  /** ISO timestamp when this contradiction was detected */
  detectedAt: string
}

// ---------------------------------------------------------------------------
// Audit export package
// ---------------------------------------------------------------------------

/**
 * The fully assembled audit export package summary.
 * Includes manifest, timeline, contradictions, and readiness gating state.
 */
export interface AuditExportPackage {
  /**
   * Client-generated unique ID for this package assembly.
   * TODO (backend contract): Replace with backend-issued packageId once
   * the audit export API is available.
   */
  packageId: string
  /** Name of the token launch this package describes */
  launchName: string | null
  /** Target audience for this package */
  audience: AudiencePreset
  /** Human-readable label for the audience */
  audienceLabel: string
  /** ISO timestamp when the package was assembled */
  assembledAt: string
  /** All evidence items considered (included and excluded) */
  evidenceManifest: EvidenceManifestEntry[]
  /** Chronological list of compliance events */
  timeline: EvidenceTimelineEvent[]
  /** Detected inconsistencies in the evidence set */
  contradictions: ContradictionFlag[]
  /** Total items in the manifest */
  totalEvidenceItems: number
  /** Items included in the export */
  includedItemCount: number
  /** Items excluded (missing, blocked, or not applicable) */
  excludedItemCount: number
  /** Number of contradictions detected */
  contradictionCount: number
  /** Whether the package meets the bar for regulator submission */
  isRegulatorReady: boolean
  /**
   * Plain-language explanation of the readiness gate decision.
   * Explains why the package is or is not ready.
   */
  readinessGateText: string
  /** The export readiness status that drove the assembly decision */
  exportReadinessStatus: ExportReadinessStatus
}

// ---------------------------------------------------------------------------
// Evidence manifest construction
// ---------------------------------------------------------------------------

/**
 * Build the evidence manifest from a compliance report bundle and optional
 * approval summary. Each manifest entry records provenance, authority level,
 * inclusion status, and staleness for the given evidence source.
 */
export function buildEvidenceManifest(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null,
): EvidenceManifestEntry[] {
  const manifest: EvidenceManifestEntry[] = []

  // --- Jurisdiction ---
  const jurisStale = isTimestampStale(bundle.jurisdiction.staleSince)
  manifest.push({
    id: 'manifest-jurisdiction',
    label: 'Jurisdiction Coverage',
    sourceType: 'jurisdiction',
    authorityLevel: bundle.jurisdiction.configured ? 'derived' : 'pending',
    isIncluded: bundle.jurisdiction.configured,
    exclusionReason: bundle.jurisdiction.configured
      ? null
      : 'Jurisdiction coverage has not been configured. Complete Compliance Setup to include this item.',
    lastVerifiedAt: bundle.jurisdiction.staleSince,
    isStale: jurisStale,
    summaryText: bundle.jurisdiction.configured
      ? `${bundle.jurisdiction.permittedCount} permitted, ${bundle.jurisdiction.restrictedCount} restricted`
      : 'No jurisdiction data available',
  })

  // --- KYC / AML ---
  const kycStale = isTimestampStale(bundle.kycAml.staleSince)
  manifest.push({
    id: 'manifest-kyc-aml',
    label: 'KYC / AML Posture',
    sourceType: 'kyc_aml',
    authorityLevel: bundle.kycAml.status === 'failed' ? 'blocked' : bundle.kycAml.status === 'pending' ? 'pending' : 'derived',
    isIncluded: bundle.kycAml.status === 'ready' || bundle.kycAml.status === 'warning',
    exclusionReason:
      bundle.kycAml.status === 'failed'
        ? 'KYC/AML is in a failed state. Resolve the provider configuration issue before including this item.'
        : bundle.kycAml.status === 'pending'
          ? 'KYC/AML setup has not been completed.'
          : null,
    lastVerifiedAt: bundle.kycAml.staleSince,
    isStale: kycStale,
    summaryText:
      bundle.kycAml.status === 'ready'
        ? `KYC ${bundle.kycAml.kycRequired ? 'required' : 'not required'}, AML ${bundle.kycAml.amlRequired ? 'required' : 'not required'}, provider ${bundle.kycAml.providerConfigured ? 'configured' : 'not configured'}`
        : bundle.kycAml.pendingReviewCount > 0
          ? `${bundle.kycAml.pendingReviewCount} review(s) pending`
          : `Status: ${bundle.kycAml.status}`,
  })

  // --- Whitelist ---
  const whitelistStale = isTimestampStale(bundle.whitelist.staleSince)
  manifest.push({
    id: 'manifest-whitelist',
    label: 'Investor Whitelist',
    sourceType: 'whitelist',
    authorityLevel: bundle.whitelist.status === 'failed' ? 'blocked' : bundle.whitelist.status === 'pending' ? 'pending' : 'derived',
    isIncluded: bundle.whitelist.status === 'ready' || bundle.whitelist.status === 'warning',
    exclusionReason:
      bundle.whitelist.status === 'failed'
        ? 'Whitelist is required but has no approved investors. Approve at least one investor before exporting.'
        : bundle.whitelist.status === 'pending'
          ? 'Whitelist configuration has not been completed.'
          : null,
    lastVerifiedAt: bundle.whitelist.staleSince,
    isStale: whitelistStale,
    summaryText:
      bundle.whitelist.whitelistRequired
        ? `${bundle.whitelist.approvedInvestorCount} approved, ${bundle.whitelist.pendingInvestorCount} pending`
        : 'Whitelist not required',
  })

  // --- Investor Eligibility ---
  const eligStale = isTimestampStale(bundle.investorEligibility.staleSince)
  manifest.push({
    id: 'manifest-investor-eligibility',
    label: 'Investor Eligibility Policy',
    sourceType: 'investor_eligibility',
    authorityLevel: bundle.investorEligibility.status === 'failed' ? 'blocked' : bundle.investorEligibility.status === 'pending' ? 'pending' : 'derived',
    isIncluded: bundle.investorEligibility.status === 'ready' || bundle.investorEligibility.status === 'warning',
    exclusionReason:
      bundle.investorEligibility.status === 'failed'
        ? 'Investor eligibility policy is in a failed state. Correct the settings in Compliance Setup.'
        : bundle.investorEligibility.status === 'pending' || bundle.investorEligibility.status === 'unavailable'
          ? 'Investor eligibility policy has not been fully configured.'
          : null,
    lastVerifiedAt: bundle.investorEligibility.staleSince,
    isStale: eligStale,
    summaryText:
      bundle.investorEligibility.status === 'ready' || bundle.investorEligibility.status === 'warning'
        ? `Accredited: ${bundle.investorEligibility.accreditedRequired ? 'required' : 'not required'}, Retail: ${bundle.investorEligibility.retailPermitted ? 'permitted' : 'not permitted'}`
        : `Status: ${bundle.investorEligibility.status}`,
  })

  // --- Approval History ---
  if (approvalSummary && approvalSummary.totalStages > 0) {
    manifest.push({
      id: 'manifest-approval-history',
      label: 'Approval Stage History',
      sourceType: 'approval_stage',
      authorityLevel: approvalSummary.allLaunchCriticalSigned ? 'derived' : 'pending',
      isIncluded: true,
      exclusionReason: null,
      lastVerifiedAt: approvalSummary.lastActionAt,
      isStale: isTimestampStale(approvalSummary.lastActionAt),
      summaryText: `${approvalSummary.approvedCount}/${approvalSummary.totalStages} stages approved${approvalSummary.blockedCount > 0 ? `, ${approvalSummary.blockedCount} blocked` : ''}`,
    })
  } else {
    manifest.push({
      id: 'manifest-approval-history',
      label: 'Approval Stage History',
      sourceType: 'approval_stage',
      authorityLevel: 'pending',
      isIncluded: false,
      exclusionReason: 'No approval stages have been started. Open the Approval Queue to begin the review workflow.',
      lastVerifiedAt: null,
      isStale: false,
      summaryText: 'No approval stages recorded',
    })
  }

  // --- Evidence sections from the bundle ---
  for (const section of bundle.evidenceSections) {
    const included = section.status === 'ready' || section.status === 'warning'
    manifest.push({
      id: `manifest-evidence-${section.id}`,
      label: section.title,
      sourceType: 'evidence_section',
      authorityLevel:
        section.status === 'failed' ? 'blocked'
        : section.status === 'pending' ? 'pending'
        : section.releaseGrade ? 'authoritative'
        : 'derived',
      isIncluded: included,
      exclusionReason: included
        ? null
        : `Evidence section "${section.title}" is not in a ready or warning state (status: ${section.status}).`,
      lastVerifiedAt: section.timestamp,
      isStale: isTimestampStale(section.timestamp),
      summaryText: section.summary,
    })
  }

  return manifest
}

// ---------------------------------------------------------------------------
// Evidence timeline construction
// ---------------------------------------------------------------------------

/**
 * Build a chronological evidence timeline from compliance bundle data.
 * Events are ordered by timestamp descending (most recent first).
 */
export function buildEvidenceTimeline(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null,
): EvidenceTimelineEvent[] {
  const events: EvidenceTimelineEvent[] = []

  // Jurisdiction configuration event
  if (bundle.jurisdiction.configured && bundle.jurisdiction.staleSince) {
    events.push({
      id: 'timeline-jurisdiction-configured',
      timestamp: bundle.jurisdiction.staleSince,
      eventType: 'configuration',
      label: 'Jurisdiction Coverage Configured',
      detail: `${bundle.jurisdiction.permittedCount} permitted, ${bundle.jurisdiction.restrictedCount} restricted`,
      isLaunchCritical: true,
    })
  }

  // KYC/AML configuration event
  if (bundle.kycAml.staleSince) {
    events.push({
      id: 'timeline-kyc-aml',
      timestamp: bundle.kycAml.staleSince,
      eventType: bundle.kycAml.status === 'warning' ? 'kyc_review' : 'configuration',
      label: bundle.kycAml.pendingReviewCount > 0 ? 'KYC Reviews Pending' : 'KYC / AML Posture Updated',
      detail:
        bundle.kycAml.pendingReviewCount > 0
          ? `${bundle.kycAml.pendingReviewCount} investor KYC review(s) are awaiting decision`
          : `KYC ${bundle.kycAml.kycRequired ? 'required' : 'not required'}, AML ${bundle.kycAml.amlRequired ? 'required' : 'not required'}`,
      isLaunchCritical: bundle.kycAml.kycRequired,
    })
  }

  // Whitelist configuration event
  if (bundle.whitelist.staleSince) {
    events.push({
      id: 'timeline-whitelist',
      timestamp: bundle.whitelist.staleSince,
      eventType: 'configuration',
      label: 'Investor Whitelist Updated',
      detail:
        bundle.whitelist.whitelistRequired
          ? `${bundle.whitelist.approvedInvestorCount} approved investors, ${bundle.whitelist.pendingInvestorCount} pending`
          : 'Whitelist not required for this launch',
      isLaunchCritical: bundle.whitelist.whitelistRequired,
    })
  }

  // Investor eligibility event
  if (bundle.investorEligibility.staleSince) {
    events.push({
      id: 'timeline-investor-eligibility',
      timestamp: bundle.investorEligibility.staleSince,
      eventType: 'configuration',
      label: 'Investor Eligibility Policy Set',
      detail: `Accredited: ${bundle.investorEligibility.accreditedRequired ? 'required' : 'not required'}, Retail: ${bundle.investorEligibility.retailPermitted ? 'permitted' : 'not permitted'}`,
      isLaunchCritical: bundle.investorEligibility.accreditedRequired,
    })
  }

  // Approval history events
  if (approvalSummary) {
    for (const entry of approvalSummary.entries) {
      if (entry.actionedAt) {
        events.push({
          id: `timeline-approval-${entry.id}`,
          timestamp: entry.actionedAt,
          eventType: 'approval',
          label: `${entry.label} — ${entry.outcome === 'approved' ? 'Approved' : entry.outcome === 'conditionally_approved' ? 'Conditionally Approved' : entry.outcome === 'blocked' ? 'Blocked' : 'Pending'}`,
          detail: entry.conditions ? `Conditions: ${entry.conditions}` : entry.summary,
          isLaunchCritical: entry.isLaunchBlocking,
        })
      }
    }
  }

  // Sort descending by timestamp (most recent first)
  events.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime()
    const tb = new Date(b.timestamp).getTime()
    return tb - ta
  })

  return events
}

// ---------------------------------------------------------------------------
// Contradiction detection
// ---------------------------------------------------------------------------

/**
 * Detect logical contradictions in the compliance evidence set.
 * These are cases where two pieces of evidence are in conflict
 * or where operator configuration contradicts the current evidence state.
 */
export function detectContradictions(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null,
): ContradictionFlag[] {
  const contradictions: ContradictionFlag[] = []
  const now = new Date().toISOString()

  // KYC required but provider not configured
  if (bundle.kycAml.kycRequired && !bundle.kycAml.providerConfigured) {
    contradictions.push({
      id: 'contradiction-kyc-no-provider',
      severity: 'critical',
      title: 'KYC Required But No Provider Configured',
      description:
        'The compliance policy requires KYC verification, but no KYC provider has been configured. This means investor onboarding cannot be completed as required.',
      affectedSections: ['kyc_aml'],
      remediationHint:
        'Go to Compliance Setup and add a KYC provider, or disable the KYC requirement if not applicable to this launch.',
      detectedAt: now,
    })
  }

  // Whitelist required but zero approved investors
  if (bundle.whitelist.whitelistRequired && bundle.whitelist.approvedInvestorCount === 0) {
    contradictions.push({
      id: 'contradiction-whitelist-empty',
      severity: 'critical',
      title: 'Whitelist Required But No Approved Investors',
      description:
        'The compliance policy requires a whitelist, but no investors have been approved. No one can legally participate in this token launch in its current state.',
      affectedSections: ['whitelist'],
      remediationHint:
        'Approve at least one investor in the Whitelist Policy workspace before exporting a package for review.',
      detectedAt: now,
    })
  }

  // Jurisdiction not configured despite KYC/whitelist requirements
  if (!bundle.jurisdiction.configured && (bundle.kycAml.kycRequired || bundle.whitelist.whitelistRequired)) {
    contradictions.push({
      id: 'contradiction-jurisdiction-missing',
      severity: 'high',
      title: 'Compliance Controls Enabled Without Jurisdiction Coverage',
      description:
        'KYC or whitelist requirements are enabled, but no jurisdiction coverage has been configured. Compliance controls cannot be applied without a defined jurisdiction policy.',
      affectedSections: ['jurisdiction', 'kyc_aml', 'whitelist'],
      remediationHint:
        'Configure permitted and restricted jurisdictions in Compliance Setup before generating a regulator-ready package.',
      detectedAt: now,
    })
  }

  // Approved stages exist alongside active blockers
  if (
    approvalSummary &&
    approvalSummary.approvedCount > 0 &&
    approvalSummary.blockedCount > 0
  ) {
    contradictions.push({
      id: 'contradiction-mixed-approval',
      severity: 'high',
      title: 'Approval Workflow Has Both Approved and Blocked Stages',
      description:
        'Some approval stages are signed off while others are blocked. The overall launch readiness cannot be confirmed until all blocking stages are resolved or overridden with documented conditions.',
      affectedSections: ['approval_history'],
      remediationHint:
        'Review blocked approval stages in the Approval Queue and resolve or document the outstanding issues.',
      detectedAt: now,
    })
  }

  // Stale evidence alongside a positive readiness state
  const staleItems = [
    bundle.jurisdiction.staleSince,
    bundle.kycAml.staleSince,
    bundle.whitelist.staleSince,
    bundle.investorEligibility.staleSince,
  ].filter((ts) => isTimestampStale(ts))

  if (staleItems.length > 0 && bundle.overallStatus === 'ready') {
    contradictions.push({
      id: 'contradiction-stale-evidence-vs-ready',
      severity: 'medium',
      title: 'Stale Evidence Alongside a Ready Posture',
      description:
        `${staleItems.length} evidence item${staleItems.length !== 1 ? 's are' : ' is'} older than 30 days. The current compliance posture is reported as ready, but stale evidence may not accurately reflect the current state.`,
      affectedSections: ['overall'],
      remediationHint:
        'Refresh compliance data by re-running the Compliance Setup workflow before generating an external submission.',
      detectedAt: now,
    })
  }

  // Pending KYC reviews with an overall ready posture
  if (bundle.kycAml.pendingReviewCount > 0 && bundle.overallStatus === 'ready') {
    contradictions.push({
      id: 'contradiction-pending-kyc-vs-ready',
      severity: 'medium',
      title: 'Pending KYC Reviews Alongside a Ready Posture',
      description:
        `${bundle.kycAml.pendingReviewCount} KYC investor review${bundle.kycAml.pendingReviewCount !== 1 ? 's are' : ' is'} still pending while the overall compliance status is reported as ready. These reviews may affect investor eligibility.`,
      affectedSections: ['kyc_aml'],
      remediationHint:
        'Complete all pending KYC reviews in the Investor Onboarding workspace before generating a regulator-ready package.',
      detectedAt: now,
    })
  }

  return contradictions
}

// ---------------------------------------------------------------------------
// Audit export package assembly
// ---------------------------------------------------------------------------

/**
 * Generate a simple deterministic package ID from the assembled timestamp.
 * TODO (backend contract): Replace with a backend-issued package ID once
 * the audit export API is available.
 */
function generatePackageId(assembledAt: string): string {
  const ts = assembledAt.replace(/[^0-9]/g, '').slice(0, 14)
  return `pkg-${ts}`
}

/**
 * Determine whether the assembled package meets the bar for regulator submission.
 * Fail-closed: any active blocker, missing required evidence, or critical
 * contradiction prevents the package from being marked regulator-ready.
 */
function computeReadinessGate(
  exportReadiness: ExportPackageReadiness,
  contradictions: ContradictionFlag[],
): { isRegulatorReady: boolean; readinessGateText: string } {
  const criticalContradictions = contradictions.filter((c) => c.severity === 'critical')

  if (exportReadiness.status === 'blocked' || criticalContradictions.length > 0) {
    const reasons: string[] = []
    if (exportReadiness.blockerCount > 0) {
      reasons.push(`${exportReadiness.blockerCount} active compliance blocker${exportReadiness.blockerCount !== 1 ? 's' : ''}`)
    }
    if (criticalContradictions.length > 0) {
      reasons.push(`${criticalContradictions.length} critical contradiction${criticalContradictions.length !== 1 ? 's' : ''} detected`)
    }
    return {
      isRegulatorReady: false,
      readinessGateText: `This package is not suitable for regulator submission: ${reasons.join(' and ')}. Resolve all issues before generating a submission-ready package.`,
    }
  }

  if (exportReadiness.status === 'incomplete') {
    return {
      isRegulatorReady: false,
      readinessGateText: `This package is incomplete: ${exportReadiness.missingCount} required evidence item${exportReadiness.missingCount !== 1 ? 's are' : ' is'} missing. Complete the Compliance Setup workflow before submission.`,
    }
  }

  if (exportReadiness.status === 'ready_for_internal') {
    const highContradictions = contradictions.filter((c) => c.severity === 'high')
    if (highContradictions.length > 0) {
      return {
        isRegulatorReady: false,
        readinessGateText: `This package is ready for internal review only. ${highContradictions.length} high-severity contradiction${highContradictions.length !== 1 ? 's require' : ' requires'} attention before external submission.`,
      }
    }
    return {
      isRegulatorReady: false,
      readinessGateText:
        'This package is ready for internal review. Some evidence items may need refreshing or approval sign-off before external submission.',
    }
  }

  // ready_for_external — all checks pass
  const mediumContradictions = contradictions.filter((c) => c.severity === 'medium')
  if (mediumContradictions.length > 0) {
    return {
      isRegulatorReady: true,
      readinessGateText: `Package is ready for external submission. Note: ${mediumContradictions.length} advisory item${mediumContradictions.length !== 1 ? 's were' : ' was'} detected and included in this bundle for transparency.`,
    }
  }

  return {
    isRegulatorReady: true,
    readinessGateText:
      'All compliance controls are configured, evidence is present and fresh, approval stages are signed off, and no critical contradictions were detected. This package is suitable for regulator or auditor submission.',
  }
}

/**
 * Assemble a complete audit export package from compliance workspace data.
 *
 * @param bundle - The compliance report bundle (from loadBundle() or API)
 * @param approvalSummary - Optional approval history (null if no stages recorded)
 * @param audience - Target audience for redaction and filtering
 * @param exportReadiness - Pre-computed export readiness state
 */
export function assembleAuditExportPackage(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null,
  audience: AudiencePreset,
  exportReadiness: ExportPackageReadiness,
): AuditExportPackage {
  const assembledAt = new Date().toISOString()
  const packageId = generatePackageId(assembledAt)

  const manifest = buildEvidenceManifest(bundle, approvalSummary)
  const timeline = buildEvidenceTimeline(bundle, approvalSummary)
  const contradictions = detectContradictions(bundle, approvalSummary)

  const includedItemCount = manifest.filter((e) => e.isIncluded).length
  const excludedItemCount = manifest.filter((e) => !e.isIncluded).length
  const { isRegulatorReady, readinessGateText } = computeReadinessGate(exportReadiness, contradictions)

  return {
    packageId,
    launchName: bundle.launchName,
    audience,
    audienceLabel: AUDIENCE_PRESET_LABELS[audience],
    assembledAt,
    evidenceManifest: manifest,
    timeline,
    contradictions,
    totalEvidenceItems: manifest.length,
    includedItemCount,
    excludedItemCount,
    contradictionCount: contradictions.length,
    isRegulatorReady,
    readinessGateText,
    exportReadinessStatus: exportReadiness.status,
  }
}

// ---------------------------------------------------------------------------
// CSS / UI helpers
// ---------------------------------------------------------------------------

export function contradictionSeverityBadgeClass(severity: ContradictionSeverity): string {
  const map: Record<ContradictionSeverity, string> = {
    critical: 'bg-red-900 text-red-200',
    high: 'bg-orange-900 text-orange-200',
    medium: 'bg-yellow-900 text-yellow-200',
  }
  return map[severity]
}

export function manifestAuthorityBadgeClass(level: EvidenceAuthorityLevel): string {
  const map: Record<EvidenceAuthorityLevel, string> = {
    authoritative: 'bg-green-900/50 text-green-300',
    derived: 'bg-blue-900/50 text-blue-300',
    pending: 'bg-gray-700 text-gray-400',
    blocked: 'bg-red-900/50 text-red-300',
  }
  return map[level]
}

export function auditPackageReadinessClass(isRegulatorReady: boolean, status: ExportReadinessStatus): string {
  if (!isRegulatorReady) {
    if (status === 'blocked') return 'bg-red-900/30 border-red-700/50'
    if (status === 'incomplete') return 'bg-yellow-900/30 border-yellow-700/50'
    return 'bg-blue-900/30 border-blue-700/50'
  }
  return 'bg-green-900/30 border-green-700/50'
}
