/**
 * Release Readiness Workspace — typed interfaces and helper utilities.
 *
 * Provides the data model and derivation logic for the strict sign-off
 * readiness workspace inside the enterprise approval cockpit.  The feature
 * surfaces protected live-backend evidence readiness, configuration
 * completeness signals, strict-run recency, evidence-pack freshness, and
 * guided next actions for compliance operators and enterprise reviewers.
 *
 * Designed to be backend-ready: all interfaces can later be hydrated from a
 * protected sign-off API without architectural changes.
 *
 * Terminology is aligned with the Biatec compliance workspace, approval
 * cockpit, and remediation workflow utilities for operator consistency.
 */

import type { OwnerDomain } from './remediationWorkflow'

// ---------------------------------------------------------------------------
// Sign-off readiness state
// ---------------------------------------------------------------------------

/**
 * The overall readiness classification for the strict live-backend sign-off
 * lane.  Ordered by severity so numeric comparison is valid:
 *   missing_evidence > configuration_blocked > stale_evidence > advisory_follow_up > ready
 */
export type SignOffReadinessState =
  | 'ready'
  | 'stale_evidence'
  | 'missing_evidence'
  | 'configuration_blocked'
  | 'advisory_follow_up'

export const SIGN_OFF_READINESS_LABELS: Record<SignOffReadinessState, string> = {
  ready: 'Ready for Sign-Off',
  stale_evidence: 'Stale Evidence',
  missing_evidence: 'Missing Evidence',
  configuration_blocked: 'Configuration Blocked',
  advisory_follow_up: 'Advisory Follow-Up',
}

export const SIGN_OFF_READINESS_DESCRIPTIONS: Record<SignOffReadinessState, string> = {
  ready:
    'All required protected sign-off evidence is present, fresh, and validated. The strict lane is ready for release authorization.',
  stale_evidence:
    'Required sign-off evidence exists but is older than the acceptable freshness window. A fresh protected run must be executed before launch authorization is valid.',
  missing_evidence:
    'One or more required sign-off artifacts are absent. The protected lane has not produced the evidence needed for launch authorization.',
  configuration_blocked:
    'Required backend environment variables or protected credentials are not configured. The strict sign-off lane cannot execute until these operational dependencies are resolved.',
  advisory_follow_up:
    'All launch-critical evidence is present and fresh. Non-blocking improvements or follow-up actions are recommended to strengthen the release posture.',
}

/** True when the state represents a launch-blocking condition. */
export function isSignOffBlocking(state: SignOffReadinessState): boolean {
  return (
    state === 'missing_evidence' ||
    state === 'configuration_blocked' ||
    state === 'stale_evidence'
  )
}

/** True when the state is fully ready or has only advisory items. */
export function isSignOffClear(state: SignOffReadinessState): boolean {
  return state === 'ready' || state === 'advisory_follow_up'
}

// ---------------------------------------------------------------------------
// Evidence dimension
// ---------------------------------------------------------------------------

/**
 * An individual evidence dimension that contributes to the overall
 * sign-off readiness assessment.
 */
export interface EvidenceDimension {
  id: string
  /** Short title displayed in the UI */
  title: string
  /** Human-readable description of what this dimension measures */
  description: string
  /** Readiness classification for this dimension */
  state: SignOffReadinessState
  /** Whether this dimension is launch-critical (vs. advisory) */
  isLaunchCritical: boolean
  /**
   * ISO-8601 timestamp of the last evidence refresh for this dimension.
   * `null` means no evidence has ever been recorded.
   */
  lastEvidenceAt: string | null
  /** Human-readable freshness label, e.g. "14 days ago" or "Never" */
  freshnessLabel: string
  /** The owner domain responsible for the next action on this dimension */
  ownerDomain: OwnerDomain
  /** Short plain-language next-step instruction */
  nextActionSummary: string
  /**
   * Optional path to the evidence artifact, documentation, or workspace
   * where the operator can take the required action.
   */
  evidencePath: string | null
}

// ---------------------------------------------------------------------------
// Next action
// ---------------------------------------------------------------------------

/** A concrete guidance step derived from one or more blocked dimensions. */
export interface ReadinessNextAction {
  id: string
  /** Owning domain responsible for this action */
  ownerDomain: OwnerDomain
  /** Short imperative description, e.g. "Re-run the protected sign-off workflow" */
  summary: string
  /** Explanatory sentence for non-engineering reviewers */
  explanation: string
  /** Whether skipping this action prevents launch */
  isLaunchBlocking: boolean
  /** Related evidence dimension IDs */
  dimensionIds: string[]
  /** Optional deep-link to take the action */
  actionPath: string | null
}

// ---------------------------------------------------------------------------
// Configuration dependency
// ---------------------------------------------------------------------------

/** Models an external secret or environment variable that the protected
 *  sign-off lane requires.  Missing items surface as configuration_blocked. */
export interface ConfigurationDependency {
  id: string
  /** Human-readable name for the dependency */
  label: string
  /** Hint for what kind of secret/env var is needed (no actual values) */
  description: string
  /** Whether the dependency is currently satisfied */
  isConfigured: boolean
  /** True when this is required for strict sign-off (not just advisory) */
  isRequired: boolean
  /** Which team owns configuring this dependency */
  ownerDomain: OwnerDomain
}

// ---------------------------------------------------------------------------
// Top-level readiness posture
// ---------------------------------------------------------------------------

/** The full release-readiness workspace state. */
export interface ReleaseReadinessState {
  /** Overall readiness classification */
  overallState: SignOffReadinessState
  /** Plain-language headline for the overall state */
  headline: string
  /** Supporting rationale sentence */
  rationale: string
  /** Individual evidence dimensions contributing to the overall state */
  dimensions: EvidenceDimension[]
  /** External configuration dependencies (may block the strict lane) */
  configDependencies: ConfigurationDependency[]
  /** Derived next-action guidance grouped by owner domain */
  nextActions: ReadinessNextAction[]
  /** Number of launch-blocking dimensions */
  launchBlockingCount: number
  /** Number of dimensions with stale evidence */
  staleCount: number
  /** Number of unconfigured required dependencies */
  missingConfigCount: number
  /** ISO-8601 timestamp of the last successful protected sign-off run */
  lastProtectedRunAt: string | null
  /** Human-readable label for lastProtectedRunAt */
  lastProtectedRunLabel: string
  /** Whether the most recent protected run was successful */
  lastRunSucceeded: boolean | null
  /** ISO-8601 timestamp when this assessment was computed */
  computedAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum age (in days) for sign-off evidence to be considered fresh. */
export const EVIDENCE_FRESHNESS_DAYS = 30

/** Freshness threshold in milliseconds (for arithmetic comparisons). */
export const EVIDENCE_FRESHNESS_MS = EVIDENCE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000

export const OWNER_DOMAIN_NEXT_ACTION_LABELS: Record<OwnerDomain, string> = {
  compliance: 'Action required by: Compliance Team',
  legal: 'Action required by: Legal Team',
  procurement: 'Action required by: Procurement Team',
  executive: 'Action required by: Executive Sponsor',
  shared_ops: 'Action required by: Shared Operations',
  unassigned: 'Action required by: Unassigned (escalation needed)',
}

/** Display name for an owner domain (no "Action required by:" prefix). */
export const OWNER_DOMAIN_DISPLAY_NAMES: Record<OwnerDomain, string> = {
  compliance: 'Compliance Team',
  legal: 'Legal Team',
  procurement: 'Procurement Team',
  executive: 'Executive Sponsor',
  shared_ops: 'Shared Operations',
  unassigned: 'Unassigned',
}

/** Returns the display name for an owner domain (without label prefix). */
export function ownerDomainDisplayName(domain: OwnerDomain): string {
  return OWNER_DOMAIN_DISPLAY_NAMES[domain]
}

// ---------------------------------------------------------------------------
// Next action ID constants (export to allow stable references in tests/components)
// ---------------------------------------------------------------------------

export const NEXT_ACTION_IDS = {
  CONFIG_MISSING: 'config-missing',
  EVIDENCE_MISSING: 'evidence-missing',
  EVIDENCE_STALE: 'evidence-stale',
  ADVISORY_IMPROVEMENTS: 'advisory-improvements',
} as const

// ---------------------------------------------------------------------------
// Freshness helpers
// ---------------------------------------------------------------------------

/**
 * Returns the age of an evidence timestamp in milliseconds.
 * Returns `null` if the timestamp is absent or unparseable.
 */
export function evidenceAgeMs(isoTimestamp: string | null, now = new Date()): number | null {
  if (!isoTimestamp) return null
  const d = new Date(isoTimestamp)
  if (isNaN(d.getTime())) return null
  return now.getTime() - d.getTime()
}

/**
 * Returns `true` when the evidence is older than `EVIDENCE_FRESHNESS_DAYS`.
 * Returns `false` for null/invalid timestamps (treat as missing, not stale).
 */
export function isSignOffEvidenceStale(isoTimestamp: string | null, now = new Date()): boolean {
  const age = evidenceAgeMs(isoTimestamp, now)
  if (age === null) return false
  return age > EVIDENCE_FRESHNESS_MS
}

/**
 * Produces a plain-language freshness label.
 * Examples: "14 days ago", "2 hours ago", "Never", "Today"
 */
export function formatEvidenceFreshnessLabel(
  isoTimestamp: string | null,
  now = new Date(),
): string {
  if (!isoTimestamp) return 'Never'
  const d = new Date(isoTimestamp)
  if (isNaN(d.getTime())) return 'Never'
  const ageMs = now.getTime() - d.getTime()
  if (ageMs < 0) return 'Just now'
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// ---------------------------------------------------------------------------
// Dimension state derivation
// ---------------------------------------------------------------------------

/**
 * Derives the readiness state for a single evidence dimension based on
 * whether it is configured, present, and fresh.
 */
export function deriveDimensionState(
  isConfigured: boolean,
  lastEvidenceAt: string | null,
  now = new Date(),
): SignOffReadinessState {
  if (!isConfigured) return 'configuration_blocked'
  if (!lastEvidenceAt) return 'missing_evidence'
  if (isSignOffEvidenceStale(lastEvidenceAt, now)) return 'stale_evidence'
  return 'ready'
}

// ---------------------------------------------------------------------------
// Overall state derivation
// ---------------------------------------------------------------------------

/**
 * Computes the overall sign-off readiness state from a collection of
 * evidence dimensions.  The worst launch-critical dimension wins.
 *
 * Priority order (worst → best):
 *   missing_evidence
 *   configuration_blocked
 *   stale_evidence
 *   advisory_follow_up (non-critical items still present)
 *   ready
 */
export function computeOverallReadinessState(dimensions: EvidenceDimension[]): SignOffReadinessState {
  const critical = dimensions.filter((d) => d.isLaunchCritical)

  if (critical.some((d) => d.state === 'missing_evidence')) return 'missing_evidence'
  if (critical.some((d) => d.state === 'configuration_blocked')) return 'configuration_blocked'
  if (critical.some((d) => d.state === 'stale_evidence')) return 'stale_evidence'

  // All critical dimensions clear — check advisory
  const hasAdvisory = dimensions.some(
    (d) => !d.isLaunchCritical && d.state !== 'ready',
  )
  if (hasAdvisory) return 'advisory_follow_up'

  return 'ready'
}

// ---------------------------------------------------------------------------
// Next action derivation
// ---------------------------------------------------------------------------

/**
 * Derives next actions from a set of blocking/stale/missing evidence
 * dimensions and unresolved configuration dependencies.
 */
export function deriveNextActions(
  dimensions: EvidenceDimension[],
  configDeps: ConfigurationDependency[],
): ReadinessNextAction[] {
  const actions: ReadinessNextAction[] = []

  // Config-blocked dependencies go first
  const missingConfigs = configDeps.filter((c) => !c.isConfigured && c.isRequired)
  if (missingConfigs.length > 0) {
    // When multiple configs are missing and owned by different domains, use the
    // canonical shared_ops domain to avoid mis-attributing a multi-team dependency
    // to a single owner.  If all missing configs share one owner, use that owner.
    const uniqueOwners = [...new Set(missingConfigs.map((c) => c.ownerDomain))]
    const configOwner: OwnerDomain = uniqueOwners.length === 1 ? uniqueOwners[0] : 'shared_ops'
    actions.push({
      id: NEXT_ACTION_IDS.CONFIG_MISSING,
      ownerDomain: configOwner,
      summary: 'Configure missing protected environment credentials',
      explanation:
        'The strict sign-off lane requires backend environment variables or secrets that are not yet configured. ' +
        'Until these are in place, the protected run cannot execute and sign-off evidence cannot be generated. ' +
        'Contact the Shared Operations team to provision the required credentials.',
      isLaunchBlocking: true,
      dimensionIds: [],
      actionPath: null,
    })
  }

  // Missing evidence dimensions
  const missingDims = dimensions.filter((d) => d.isLaunchCritical && d.state === 'missing_evidence')
  if (missingDims.length > 0) {
    actions.push({
      id: NEXT_ACTION_IDS.EVIDENCE_MISSING,
      ownerDomain: missingDims[0].ownerDomain,
      summary: 'Execute the protected strict sign-off run to generate release evidence',
      explanation:
        'No sign-off evidence has been recorded for the live-backend protected lane. ' +
        'A complete protected run must be executed against the production-equivalent environment ' +
        'and the resulting artifacts must be captured before launch authorization can proceed.',
      isLaunchBlocking: true,
      dimensionIds: missingDims.map((d) => d.id),
      actionPath: missingDims[0].evidencePath,
    })
  }

  // Stale evidence dimensions
  const staleDims = dimensions.filter((d) => d.isLaunchCritical && d.state === 'stale_evidence')
  if (staleDims.length > 0) {
    actions.push({
      id: NEXT_ACTION_IDS.EVIDENCE_STALE,
      ownerDomain: staleDims[0].ownerDomain,
      summary: 'Re-run the protected sign-off workflow to refresh stale evidence',
      explanation:
        `Protected sign-off evidence exists but is older than the ${EVIDENCE_FRESHNESS_DAYS}-day freshness window. ` +
        'A fresh protected run must be completed so that the release artifacts reflect the current codebase ' +
        'and environment state. Stale evidence is not acceptable for launch authorization.',
      isLaunchBlocking: true,
      dimensionIds: staleDims.map((d) => d.id),
      actionPath: staleDims[0].evidencePath,
    })
  }

  // Advisory dimensions
  const advisoryDims = dimensions.filter((d) => !d.isLaunchCritical && d.state !== 'ready')
  if (advisoryDims.length > 0) {
    actions.push({
      id: NEXT_ACTION_IDS.ADVISORY_IMPROVEMENTS,
      ownerDomain: advisoryDims[0].ownerDomain,
      summary: 'Address advisory evidence improvements to strengthen release posture',
      explanation:
        'Non-blocking improvements have been identified that would strengthen the overall evidence pack. ' +
        'These do not prevent launch authorization but are recommended before enterprise customer review.',
      isLaunchBlocking: false,
      dimensionIds: advisoryDims.map((d) => d.id),
      actionPath: null,
    })
  }

  return actions
}

// ---------------------------------------------------------------------------
// Headline derivation
// ---------------------------------------------------------------------------

export function deriveReadinessHeadline(
  state: SignOffReadinessState,
  launchBlockingCount: number,
  missingConfigCount: number,
): string {
  switch (state) {
    case 'ready':
      return 'All protected sign-off evidence is present, fresh, and validated.'
    case 'advisory_follow_up':
      return 'Protected sign-off evidence is ready. Advisory improvements are available.'
    case 'stale_evidence':
      return `${launchBlockingCount} evidence dimension${launchBlockingCount === 1 ? '' : 's'} require${launchBlockingCount === 1 ? 's' : ''} a fresh protected run.`
    case 'missing_evidence':
      return `${launchBlockingCount} required evidence dimension${launchBlockingCount === 1 ? '' : 's'} ha${launchBlockingCount === 1 ? 's' : 've'} no recorded sign-off proof.`
    case 'configuration_blocked':
      return `${missingConfigCount} required configuration item${missingConfigCount === 1 ? ' is' : 's are'} preventing the strict sign-off lane from executing.`
  }
}

export function deriveReadinessRationale(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'The release evidence posture meets launch-authorization requirements. Executive sign-off can proceed.'
    case 'advisory_follow_up':
      return 'Launch-critical evidence is clear. Review the advisory items and decide whether to address them before customer delivery.'
    case 'stale_evidence':
      return 'Stale evidence is not acceptable for launch authorization. Execute a fresh protected run and confirm the resulting artifacts before proceeding.'
    case 'missing_evidence':
      return 'Missing evidence is a launch blocker. No authorization is possible until the protected run produces the required artifacts.'
    case 'configuration_blocked':
      return 'The protected sign-off lane is operationally blocked. Resolve the configuration dependencies so that the strict run can execute and produce evidence.'
  }
}

// ---------------------------------------------------------------------------
// Default evidence dimensions
// ---------------------------------------------------------------------------

/**
 * Builds the default set of evidence dimensions for the strict sign-off
 * workspace.  In a future release these would be hydrated from a protected
 * API response; for now they represent the documented MVP sign-off requirements.
 */
export function buildDefaultEvidenceDimensions(now = new Date()): EvidenceDimension[] {
  // Simulate a state where protected backend credentials are not yet configured.
  // This matches the documented MVP blocker in the business roadmap.
  const strictRunAt: string | null = null
  const complianceReportAt: string | null = null
  const integrationEvidenceAt = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days old — stale

  return [
    {
      id: 'strict-run-execution',
      title: 'Protected Strict Sign-Off Run',
      description:
        'A complete protected run must execute against the live backend and produce a signed artifact confirming all validations passed. This is the primary launch-blocking requirement.',
      state: deriveDimensionState(false, strictRunAt, now),
      isLaunchCritical: true,
      lastEvidenceAt: strictRunAt,
      freshnessLabel: formatEvidenceFreshnessLabel(strictRunAt, now),
      ownerDomain: 'shared_ops',
      nextActionSummary:
        'Configure protected backend credentials and execute the strict sign-off workflow.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'compliance-report-bundle',
      title: 'Compliance Evidence Bundle',
      description:
        'A release-grade compliance report bundle including KYC/AML, jurisdiction, whitelist, and investor eligibility evidence — generated against the live environment.',
      state: deriveDimensionState(false, complianceReportAt, now),
      isLaunchCritical: true,
      lastEvidenceAt: complianceReportAt,
      freshnessLabel: formatEvidenceFreshnessLabel(complianceReportAt, now),
      ownerDomain: 'compliance',
      nextActionSummary:
        'Generate and export a full compliance evidence bundle from the live environment.',
      evidencePath: '/compliance/evidence',
    },
    {
      id: 'integration-validation',
      title: 'Live Integration Validation',
      description:
        'End-to-end integration test evidence produced against the live backend, confirming that the full token issuance workflow executes correctly in the production environment.',
      state: deriveDimensionState(true, integrationEvidenceAt, now),
      isLaunchCritical: true,
      lastEvidenceAt: integrationEvidenceAt,
      freshnessLabel: formatEvidenceFreshnessLabel(integrationEvidenceAt, now),
      ownerDomain: 'shared_ops',
      nextActionSummary:
        'Re-run live integration tests and capture a fresh evidence artifact.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'approval-sign-off',
      title: 'Multi-Stakeholder Approval Sign-Off',
      description:
        'Final authorization by all required reviewers: compliance operator, legal, procurement, and executive sponsor. Each stage must be approved before this dimension is complete.',
      state: 'advisory_follow_up',
      isLaunchCritical: false,
      lastEvidenceAt: null,
      freshnessLabel: 'Not yet complete',
      ownerDomain: 'executive',
      nextActionSummary:
        'Complete all approval stages in the Enterprise Approval Queue.',
      evidencePath: '/compliance/approval',
    },
  ]
}

// ---------------------------------------------------------------------------
// Default configuration dependencies
// ---------------------------------------------------------------------------

export function buildDefaultConfigDependencies(): ConfigurationDependency[] {
  return [
    {
      id: 'backend-api-url',
      label: 'Protected Backend API URL',
      description:
        'The base URL for the live-backend protected environment (e.g., VITE_API_BASE_URL set to a production-equivalent endpoint).',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'strict-run-token',
      label: 'Strict Sign-Off Bearer Token',
      description:
        'An authentication credential scoped for the protected sign-off lane. Required for the strict run workflow to authenticate against the live backend.',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'evidence-storage',
      label: 'Evidence Artifact Storage',
      description:
        'A configured storage destination for capturing and retaining protected sign-off artifacts (e.g., an S3 bucket or artifact registry).',
      isConfigured: false,
      isRequired: false,
      ownerDomain: 'shared_ops',
    },
  ]
}

// ---------------------------------------------------------------------------
// Top-level derivation
// ---------------------------------------------------------------------------

/**
 * Derives the full release-readiness workspace state from evidence dimensions
 * and configuration dependencies.
 *
 * This is the primary public API for the readiness utility.
 */
export function deriveReleaseReadiness(
  dimensions: EvidenceDimension[],
  configDeps: ConfigurationDependency[],
  lastProtectedRunAt: string | null,
  lastRunSucceeded: boolean | null,
  now = new Date(),
): ReleaseReadinessState {
  const overallState = computeOverallReadinessState(dimensions)
  const launchBlockingCount = dimensions.filter(
    (d) => d.isLaunchCritical && d.state !== 'ready',
  ).length
  const staleCount = dimensions.filter((d) => d.state === 'stale_evidence').length
  const missingConfigCount = configDeps.filter((c) => !c.isConfigured && c.isRequired).length
  const nextActions = deriveNextActions(dimensions, configDeps)

  return {
    overallState,
    headline: deriveReadinessHeadline(overallState, launchBlockingCount, missingConfigCount),
    rationale: deriveReadinessRationale(overallState),
    dimensions,
    configDependencies: configDeps,
    nextActions,
    launchBlockingCount,
    staleCount,
    missingConfigCount,
    lastProtectedRunAt,
    lastProtectedRunLabel: formatEvidenceFreshnessLabel(lastProtectedRunAt, now),
    lastRunSucceeded,
    computedAt: now.toISOString(),
  }
}

/**
 * Builds the default readiness state using the documented MVP sign-off
 * requirements.  Used as the initial state for the frontend workspace
 * before a live API is connected.
 */
export function buildDefaultReleaseReadiness(now = new Date()): ReleaseReadinessState {
  const dimensions = buildDefaultEvidenceDimensions(now)
  const configDeps = buildDefaultConfigDependencies()
  return deriveReleaseReadiness(dimensions, configDeps, null, null, now)
}

// ---------------------------------------------------------------------------
// CSS helpers (consistent with approval cockpit palette)
// ---------------------------------------------------------------------------

/** Returns a Tailwind border+background class pair for a readiness state badge. */
export function readinessStateBadgeClass(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'bg-green-800 text-green-200'
    case 'advisory_follow_up':
      return 'bg-teal-800 text-teal-200'
    case 'stale_evidence':
      return 'bg-orange-800 text-orange-200'
    case 'missing_evidence':
      return 'bg-red-800 text-red-200'
    case 'configuration_blocked':
      return 'bg-yellow-800 text-yellow-200'
  }
}

/** Returns a Tailwind border class for a dimension card. */
export function dimensionCardBorderClass(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'border-green-700'
    case 'advisory_follow_up':
      return 'border-teal-700'
    case 'stale_evidence':
      return 'border-orange-700'
    case 'missing_evidence':
      return 'border-red-700'
    case 'configuration_blocked':
      return 'border-yellow-700'
  }
}

/** Returns a Tailwind background class for a dimension card. */
export function dimensionCardBgClass(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'bg-green-950'
    case 'advisory_follow_up':
      return 'bg-teal-950'
    case 'stale_evidence':
      return 'bg-orange-950'
    case 'missing_evidence':
      return 'bg-red-950'
    case 'configuration_blocked':
      return 'bg-yellow-950'
  }
}

/** Returns a Tailwind border+background class for the overall summary banner. */
export function readinessBannerClass(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'border-green-700 bg-green-950'
    case 'advisory_follow_up':
      return 'border-teal-700 bg-teal-950'
    case 'stale_evidence':
      return 'border-orange-700 bg-orange-950'
    case 'missing_evidence':
      return 'border-red-700 bg-red-950'
    case 'configuration_blocked':
      return 'border-yellow-700 bg-yellow-950'
  }
}

/** Returns a Tailwind text color class for headline text in a given state. */
export function readinessBannerTextClass(state: SignOffReadinessState): string {
  switch (state) {
    case 'ready':
      return 'text-green-300'
    case 'advisory_follow_up':
      return 'text-teal-300'
    case 'stale_evidence':
      return 'text-orange-300'
    case 'missing_evidence':
      return 'text-red-300'
    case 'configuration_blocked':
      return 'text-yellow-300'
  }
}

// ---------------------------------------------------------------------------
// Release Evidence Center — test ID constants
// ---------------------------------------------------------------------------

/**
 * Stable data-testid values for the Release Evidence Center workspace.
 * Centralised here so component templates and test files share the same source
 * of truth and never drift apart.
 */
export const RELEASE_CENTER_TEST_IDS = {
  ROOT: 'release-evidence-center',
  HEADING: 'release-center-heading',
  LOADING: 'release-center-loading',
  DEGRADED_ALERT: 'release-center-degraded',
  REFRESH_BTN: 'release-center-refresh',
  REFRESHED_AT: 'release-center-refreshed-at',
  READINESS_PANEL: 'release-readiness-panel-wrapper',
  DIMENSIONS_SECTION: 'release-dimensions-section',
  DIMENSION_CARD: (id: string) => `rc-dim-card-${id}`,
  DIMENSION_BADGE: (id: string) => `rc-dim-badge-${id}`,
  ENV_DIAG_SECTION: 'release-env-diagnostics',
  ENV_DEP_CARD: (id: string) => `env-dep-${id}`,
  NEXT_ACTIONS_SECTION: 'release-next-actions',
  NEXT_ACTION_ITEM: (id: string) => `next-action-${id}`,
  APPROVAL_HANDOFF_SECTION: 'release-approval-handoff',
  EXPORT_SECTION: 'release-export-section',
  EXPORT_BTN: 'release-export-btn',
  EXPORT_STATUS: 'release-export-status',
} as const

// ---------------------------------------------------------------------------
// Deterministic fixtures for testing (AC #7)
// ---------------------------------------------------------------------------

/** Fixed past timestamp helpers (deterministic, no Date.now() dependency). */
const FIXTURE_BASE_ISO = '2025-01-15T09:00:00.000Z' // arbitrary fixed base

function _fixtureFreshAt(): string {
  // 5 days before FIXTURE_BASE_ISO
  return new Date(new Date(FIXTURE_BASE_ISO).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
}

function _fixtureStaleAt(): string {
  // 40 days before FIXTURE_BASE_ISO
  return new Date(new Date(FIXTURE_BASE_ISO).getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Deterministic fixture: every evidence dimension is ready and fresh.
 * Used for "happy-path" unit and E2E test scenarios.
 */
export function buildReadyFixture(now = new Date(FIXTURE_BASE_ISO)): ReleaseReadinessState {
  const freshAt = _fixtureFreshAt()
  const dimensions: EvidenceDimension[] = [
    {
      id: 'strict-run-execution',
      title: 'Protected Strict Sign-Off Run',
      description: 'Protected run executed and signed artifact confirmed.',
      state: 'ready',
      isLaunchCritical: true,
      lastEvidenceAt: freshAt,
      freshnessLabel: '5 days ago',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'No action required.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'compliance-report-bundle',
      title: 'Compliance Evidence Bundle',
      description: 'Release-grade compliance report bundle generated.',
      state: 'ready',
      isLaunchCritical: true,
      lastEvidenceAt: freshAt,
      freshnessLabel: '5 days ago',
      ownerDomain: 'compliance',
      nextActionSummary: 'No action required.',
      evidencePath: '/compliance/evidence',
    },
    {
      id: 'integration-validation',
      title: 'Live Integration Validation',
      description: 'End-to-end integration validation complete.',
      state: 'ready',
      isLaunchCritical: true,
      lastEvidenceAt: freshAt,
      freshnessLabel: '5 days ago',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'No action required.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'approval-sign-off',
      title: 'Multi-Stakeholder Approval Sign-Off',
      description: 'All required reviewers have completed sign-off.',
      state: 'ready',
      isLaunchCritical: false,
      lastEvidenceAt: freshAt,
      freshnessLabel: '5 days ago',
      ownerDomain: 'executive',
      nextActionSummary: 'No action required.',
      evidencePath: '/compliance/approval',
    },
  ]
  const configDeps: ConfigurationDependency[] = [
    {
      id: 'backend-api-url',
      label: 'Protected Backend API URL',
      description: 'Backend API URL is configured.',
      isConfigured: true,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'strict-run-token',
      label: 'Strict Sign-Off Bearer Token',
      description: 'Bearer token is configured.',
      isConfigured: true,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'evidence-storage',
      label: 'Evidence Artifact Storage',
      description: 'Storage destination configured.',
      isConfigured: true,
      isRequired: false,
      ownerDomain: 'shared_ops',
    },
  ]
  return deriveReleaseReadiness(dimensions, configDeps, freshAt, true, now)
}

/**
 * Deterministic fixture: critical evidence is missing (never recorded).
 * Used for "fail-closed / blocked" test scenarios.
 */
export function buildBlockedFixture(now = new Date(FIXTURE_BASE_ISO)): ReleaseReadinessState {
  const dimensions: EvidenceDimension[] = [
    {
      id: 'strict-run-execution',
      title: 'Protected Strict Sign-Off Run',
      description: 'Protected run has not been executed.',
      state: 'missing_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Configure protected backend credentials and execute the strict sign-off workflow.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'compliance-report-bundle',
      title: 'Compliance Evidence Bundle',
      description: 'Compliance bundle has not been generated.',
      state: 'missing_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'compliance',
      nextActionSummary: 'Generate and export a full compliance evidence bundle.',
      evidencePath: '/compliance/evidence',
    },
    {
      id: 'integration-validation',
      title: 'Live Integration Validation',
      description: 'Integration validation has not been run.',
      state: 'missing_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Run live integration tests against the protected environment.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'approval-sign-off',
      title: 'Multi-Stakeholder Approval Sign-Off',
      description: 'Approval sign-off has not started.',
      state: 'advisory_follow_up',
      isLaunchCritical: false,
      lastEvidenceAt: null,
      freshnessLabel: 'Not yet complete',
      ownerDomain: 'executive',
      nextActionSummary: 'Complete all approval stages in the Enterprise Approval Queue.',
      evidencePath: '/compliance/approval',
    },
  ]
  const configDeps: ConfigurationDependency[] = [
    {
      id: 'backend-api-url',
      label: 'Protected Backend API URL',
      description: 'Not yet configured.',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'strict-run-token',
      label: 'Strict Sign-Off Bearer Token',
      description: 'Not yet configured.',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'evidence-storage',
      label: 'Evidence Artifact Storage',
      description: 'Not yet configured.',
      isConfigured: false,
      isRequired: false,
      ownerDomain: 'shared_ops',
    },
  ]
  return deriveReleaseReadiness(dimensions, configDeps, null, null, now)
}

/**
 * Deterministic fixture: evidence exists but is older than the freshness window.
 * Used for "at-risk / stale" test scenarios.
 */
export function buildStaleFixture(now = new Date(FIXTURE_BASE_ISO)): ReleaseReadinessState {
  const staleAt = _fixtureStaleAt()
  const dimensions: EvidenceDimension[] = [
    {
      id: 'strict-run-execution',
      title: 'Protected Strict Sign-Off Run',
      description: 'Protected run evidence is stale — a fresh run is required.',
      state: 'stale_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: staleAt,
      freshnessLabel: '40 days ago',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Re-execute the strict sign-off workflow to produce fresh evidence.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'compliance-report-bundle',
      title: 'Compliance Evidence Bundle',
      description: 'Compliance bundle is stale — regenerate for release.',
      state: 'stale_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: staleAt,
      freshnessLabel: '40 days ago',
      ownerDomain: 'compliance',
      nextActionSummary: 'Regenerate the compliance evidence bundle from the live environment.',
      evidencePath: '/compliance/evidence',
    },
    {
      id: 'integration-validation',
      title: 'Live Integration Validation',
      description: 'Integration validation evidence is stale.',
      state: 'stale_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: staleAt,
      freshnessLabel: '40 days ago',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Re-run live integration tests to produce fresh evidence.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'approval-sign-off',
      title: 'Multi-Stakeholder Approval Sign-Off',
      description: 'Approval sign-off pending re-confirmation after evidence refresh.',
      state: 'advisory_follow_up',
      isLaunchCritical: false,
      lastEvidenceAt: null,
      freshnessLabel: 'Not yet complete',
      ownerDomain: 'executive',
      nextActionSummary: 'Re-confirm approval sign-off after fresh evidence is available.',
      evidencePath: '/compliance/approval',
    },
  ]
  const configDeps: ConfigurationDependency[] = [
    {
      id: 'backend-api-url',
      label: 'Protected Backend API URL',
      description: 'Configured.',
      isConfigured: true,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'strict-run-token',
      label: 'Strict Sign-Off Bearer Token',
      description: 'Configured.',
      isConfigured: true,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'evidence-storage',
      label: 'Evidence Artifact Storage',
      description: 'Not configured (optional).',
      isConfigured: false,
      isRequired: false,
      ownerDomain: 'shared_ops',
    },
  ]
  return deriveReleaseReadiness(dimensions, configDeps, staleAt, true, now)
}

/**
 * Deterministic fixture: required configuration dependencies are absent.
 * Used for "degraded / configuration-blocked" test scenarios.
 */
export function buildDegradedFixture(now = new Date(FIXTURE_BASE_ISO)): ReleaseReadinessState {
  const dimensions: EvidenceDimension[] = [
    {
      id: 'strict-run-execution',
      title: 'Protected Strict Sign-Off Run',
      description: 'Cannot execute — protected backend credentials are missing.',
      state: 'configuration_blocked',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Configure the protected backend API URL and bearer token first.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'compliance-report-bundle',
      title: 'Compliance Evidence Bundle',
      description: 'Cannot generate — environment not configured.',
      state: 'missing_evidence',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'compliance',
      nextActionSummary: 'Resolve environment configuration, then generate the bundle.',
      evidencePath: '/compliance/evidence',
    },
    {
      id: 'integration-validation',
      title: 'Live Integration Validation',
      description: 'Cannot run — backend endpoint not reachable.',
      state: 'configuration_blocked',
      isLaunchCritical: true,
      lastEvidenceAt: null,
      freshnessLabel: 'Never',
      ownerDomain: 'shared_ops',
      nextActionSummary: 'Resolve backend connectivity before running integration tests.',
      evidencePath: '/compliance/reporting',
    },
    {
      id: 'approval-sign-off',
      title: 'Multi-Stakeholder Approval Sign-Off',
      description: 'Blocked on upstream evidence resolution.',
      state: 'advisory_follow_up',
      isLaunchCritical: false,
      lastEvidenceAt: null,
      freshnessLabel: 'Not yet complete',
      ownerDomain: 'executive',
      nextActionSummary: 'Cannot proceed until upstream blockers are resolved.',
      evidencePath: '/compliance/approval',
    },
  ]
  const configDeps: ConfigurationDependency[] = [
    {
      id: 'backend-api-url',
      label: 'Protected Backend API URL',
      description: 'Not configured.',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'strict-run-token',
      label: 'Strict Sign-Off Bearer Token',
      description: 'Not configured.',
      isConfigured: false,
      isRequired: true,
      ownerDomain: 'shared_ops',
    },
    {
      id: 'evidence-storage',
      label: 'Evidence Artifact Storage',
      description: 'Not configured.',
      isConfigured: false,
      isRequired: false,
      ownerDomain: 'shared_ops',
    },
  ]
  return deriveReleaseReadiness(dimensions, configDeps, null, null, now)
}
