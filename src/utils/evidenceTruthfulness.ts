/**
 * evidenceTruthfulness.ts
 *
 * Shared, typed contract for classifying the truthfulness of evidence data
 * presented across release-critical operator surfaces: the Release Evidence
 * Center, Investor Compliance Onboarding workspace, and Compliance Reporting
 * workspace.
 *
 * Design principles
 * -----------------
 * - Fail-closed: absent or ambiguous data resolves to the most conservative
 *   truth class, never to a falsely-ready state.
 * - No wallet assumptions. All terminology is enterprise compliance-oriented.
 * - Pure functions only — zero side effects, zero I/O. All state is passed in.
 * - Composable: individual dimension truth classes can be merged into a
 *   worst-case composite using `mergeEvidenceTruth`.
 *
 * Truth class severity order (most severe → least severe):
 *   environment_blocked > unavailable > partial_hydration > stale > backend_confirmed
 */

// ---------------------------------------------------------------------------
// Core type: EvidenceTruthClass
// ---------------------------------------------------------------------------

/**
 * Classifies the reliability of an evidence data dimension.
 *
 * - `backend_confirmed`  — data was retrieved from the live protected backend
 *                          API, validated, and is within the freshness window.
 * - `partial_hydration`  — some data came from the live backend but other
 *                          required fields are absent, incomplete, or defaulted
 *                          to frontend fixtures. The operator cannot fully
 *                          trust this dimension for sign-off decisions.
 * - `stale`              — data was retrieved from the backend but exceeds the
 *                          freshness window. It may no longer reflect current
 *                          reality and should not be used for sign-off without
 *                          a refresh.
 * - `unavailable`        — the backend returned an error, the network call
 *                          failed, or the auth token is absent. The operator
 *                          must treat this dimension as unconfirmed.
 * - `environment_blocked` — required environment configuration (API URL,
 *                           credentials, strict-mode secrets) is missing.
 *                           The protected sign-off lane cannot execute until
 *                           these operational dependencies are resolved.
 */
export type EvidenceTruthClass =
  | 'backend_confirmed'
  | 'partial_hydration'
  | 'stale'
  | 'unavailable'
  | 'environment_blocked'

// ---------------------------------------------------------------------------
// Severity ordering
// ---------------------------------------------------------------------------

/**
 * Numeric severity for each truth class.
 * Higher numbers are more severe (less trustworthy).
 */
export const EVIDENCE_TRUTH_SEVERITY: Record<EvidenceTruthClass, number> = {
  backend_confirmed: 0,
  stale: 1,
  partial_hydration: 2,
  unavailable: 3,
  environment_blocked: 4,
}

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

export const EVIDENCE_TRUTH_LABELS: Record<EvidenceTruthClass, string> = {
  backend_confirmed: 'Backend Confirmed',
  partial_hydration: 'Partially Hydrated',
  stale: 'Stale Evidence',
  unavailable: 'Unavailable',
  environment_blocked: 'Environment Blocked',
}

export const EVIDENCE_TRUTH_SHORT_LABELS: Record<EvidenceTruthClass, string> = {
  backend_confirmed: 'Confirmed',
  partial_hydration: 'Partial',
  stale: 'Stale',
  unavailable: 'Unavailable',
  environment_blocked: 'Blocked',
}

export const EVIDENCE_TRUTH_DESCRIPTIONS: Record<EvidenceTruthClass, string> = {
  backend_confirmed:
    'This evidence was retrieved from the live protected backend API and is within the required freshness window. It can be used for release sign-off decisions.',
  partial_hydration:
    'Some evidence data came from the live backend, but other required fields are absent or defaulted to frontend fixtures. This dimension cannot fully support a sign-off decision until the backend provides complete data.',
  stale:
    'This evidence was retrieved from the backend but has exceeded the freshness window. It may no longer reflect current reality. Re-run the relevant workflow before using this evidence for sign-off.',
  unavailable:
    'The backend returned an error, the network call failed, or no authentication token is available. This dimension is unconfirmed. Do not use it for sign-off decisions.',
  environment_blocked:
    'Required environment configuration — API base URL, authentication credentials, or strict-mode secrets — is missing. The protected sign-off lane cannot execute until these dependencies are resolved by the operations team.',
}

// ---------------------------------------------------------------------------
// Operator next-action guidance per truth class
// ---------------------------------------------------------------------------

export const EVIDENCE_TRUTH_NEXT_ACTIONS: Record<EvidenceTruthClass, string> = {
  backend_confirmed: 'No action required. Evidence is current and backend-confirmed.',
  partial_hydration:
    'Investigate which data fields are missing and trigger a backend data refresh. Do not proceed with sign-off until full hydration is confirmed.',
  stale:
    'Re-run the protected sign-off workflow to generate fresh evidence. Stale evidence cannot be used for release authorization.',
  unavailable:
    'Check network connectivity and authentication status. Confirm the backend API is reachable and retry. If the error persists, escalate to platform operations.',
  environment_blocked:
    'Contact the platform operations team to configure the required environment secrets and backend credentials. The strict sign-off lane cannot execute without this setup.',
}

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

/** Returns a Tailwind border + background class pair for a truth class badge. */
export function evidenceTruthBadgeClass(truthClass: EvidenceTruthClass): string {
  switch (truthClass) {
    case 'backend_confirmed':
      return 'bg-green-800 text-green-100'
    case 'partial_hydration':
      return 'bg-blue-800 text-blue-100'
    case 'stale':
      return 'bg-orange-800 text-orange-100'
    case 'unavailable':
      return 'bg-red-800 text-red-100'
    case 'environment_blocked':
      return 'bg-yellow-800 text-yellow-100'
  }
}

/** Returns a Tailwind border + background class pair for a truth class banner. */
export function evidenceTruthBannerClass(truthClass: EvidenceTruthClass): string {
  switch (truthClass) {
    case 'backend_confirmed':
      return 'border-green-700 bg-green-950'
    case 'partial_hydration':
      return 'border-blue-700 bg-blue-950'
    case 'stale':
      return 'border-orange-700 bg-orange-950'
    case 'unavailable':
      return 'border-red-700 bg-red-950'
    case 'environment_blocked':
      return 'border-yellow-700 bg-yellow-950'
  }
}

/** Returns a Tailwind text color class for the title text in a truth banner. */
export function evidenceTruthTitleClass(truthClass: EvidenceTruthClass): string {
  switch (truthClass) {
    case 'backend_confirmed':
      return 'text-green-200'
    case 'partial_hydration':
      return 'text-blue-200'
    case 'stale':
      return 'text-orange-200'
    case 'unavailable':
      return 'text-red-200'
    case 'environment_blocked':
      return 'text-yellow-200'
  }
}

/** Returns a Tailwind text color class for body text in a truth banner. */
export function evidenceTruthBodyClass(truthClass: EvidenceTruthClass): string {
  switch (truthClass) {
    case 'backend_confirmed':
      return 'text-green-300'
    case 'partial_hydration':
      return 'text-blue-300'
    case 'stale':
      return 'text-orange-300'
    case 'unavailable':
      return 'text-red-300'
    case 'environment_blocked':
      return 'text-yellow-300'
  }
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the truth class indicates the evidence CANNOT be used
 * for a sign-off decision (unavailable, environment_blocked, partial_hydration,
 * or stale).
 */
export function isEvidenceTrustworthy(truthClass: EvidenceTruthClass): boolean {
  return truthClass === 'backend_confirmed'
}

/**
 * Returns true when the truth class represents a launch-blocking condition.
 * Stale evidence is blocking because it may not reflect current state.
 */
export function isEvidenceTruthBlocking(truthClass: EvidenceTruthClass): boolean {
  return (
    truthClass === 'unavailable' ||
    truthClass === 'environment_blocked' ||
    truthClass === 'stale'
  )
}

/**
 * Returns true when operator action is required to improve the truth class.
 */
export function requiresOperatorAction(truthClass: EvidenceTruthClass): boolean {
  return truthClass !== 'backend_confirmed'
}

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

/**
 * Derives an EvidenceTruthClass from the observable state of a data dimension.
 *
 * @param isBackendConnected  - Whether a live backend API connection was established
 * @param isAuthenticated     - Whether a valid auth token was present
 * @param isEnvironmentReady  - Whether required env vars/secrets are configured
 * @param isDataPresent       - Whether data was actually returned (non-null/empty)
 * @param isDataComplete      - Whether all required fields are populated
 * @param isDataFresh         - Whether the data is within the freshness window
 */
export function deriveEvidenceTruthClass(params: {
  isBackendConnected: boolean
  isAuthenticated: boolean
  isEnvironmentReady: boolean
  isDataPresent: boolean
  isDataComplete: boolean
  isDataFresh: boolean
}): EvidenceTruthClass {
  const { isBackendConnected, isAuthenticated, isEnvironmentReady, isDataPresent, isDataComplete, isDataFresh } = params

  if (!isEnvironmentReady) return 'environment_blocked'
  if (!isAuthenticated) return 'unavailable'
  if (!isBackendConnected) return 'unavailable'
  if (!isDataPresent) return 'unavailable'
  if (!isDataFresh) return 'stale'
  if (!isDataComplete) return 'partial_hydration'
  return 'backend_confirmed'
}

/**
 * Derives the truth class for a surface that uses only frontend fixtures
 * (no backend connectivity attempted). This is the most conservative posture
 * for development/demo environments.
 *
 * Returns 'partial_hydration' to signal that data is available but not
 * backend-confirmed. Use 'unavailable' when data is absent.
 */
export function deriveFixtureTruthClass(isDataPresent: boolean): EvidenceTruthClass {
  return isDataPresent ? 'partial_hydration' : 'unavailable'
}

/**
 * Derives a truth class from a backend API response state.
 *
 * @param isDegraded   - Whether the backend returned an error or degraded state
 * @param isPartial    - Whether only partial data was returned
 * @param isStale      - Whether the data exceeds the freshness window
 */
export function deriveBackendResponseTruthClass(params: {
  isDegraded: boolean
  isPartial: boolean
  isStale: boolean
}): EvidenceTruthClass {
  const { isDegraded, isPartial, isStale } = params
  if (isDegraded) return 'unavailable'
  if (isStale) return 'stale'
  if (isPartial) return 'partial_hydration'
  return 'backend_confirmed'
}

// ---------------------------------------------------------------------------
// Merge: worst-case composite
// ---------------------------------------------------------------------------

/**
 * Merges multiple truth classes into the single worst-case (most severe) class.
 * This is used to derive the composite truth class for a page or section that
 * aggregates multiple evidence dimensions.
 *
 * An empty input returns 'backend_confirmed' (no evidence = no degradation,
 * by design — callers should ensure only relevant dimensions are passed).
 */
export function mergeEvidenceTruth(classes: EvidenceTruthClass[]): EvidenceTruthClass {
  if (classes.length === 0) return 'backend_confirmed'
  return classes.reduce((worst, current) =>
    EVIDENCE_TRUTH_SEVERITY[current] > EVIDENCE_TRUTH_SEVERITY[worst] ? current : worst,
  )
}

// ---------------------------------------------------------------------------
// Provenance label builder
// ---------------------------------------------------------------------------

/**
 * Builds a short human-readable provenance string for use in disclaimer text
 * and accessibility labels.
 *
 * @param truthClass  - The evidence truth class
 * @param surfaceName - Optional surface name, e.g. "Investor Onboarding"
 */
export function buildProvenanceLabel(
  truthClass: EvidenceTruthClass,
  surfaceName?: string,
): string {
  const prefix = surfaceName ? `${surfaceName}: ` : ''
  switch (truthClass) {
    case 'backend_confirmed':
      return `${prefix}Data is backend-confirmed and current.`
    case 'partial_hydration':
      return `${prefix}Data is partially hydrated from the backend. Some fields derive from frontend fixtures.`
    case 'stale':
      return `${prefix}Data was retrieved from the backend but is outside the freshness window. Refresh before sign-off.`
    case 'unavailable':
      return `${prefix}Backend data is unavailable. This view is showing frontend fixtures only.`
    case 'environment_blocked':
      return `${prefix}Protected backend environment is not configured. Sign-off lane cannot execute.`
  }
}

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

/**
 * Stable data-testid values for evidence truth banners.
 * Shared across release evidence, onboarding, and reporting views.
 */
export const EVIDENCE_TRUTH_TEST_IDS = {
  BANNER: 'evidence-truth-banner',
  BADGE: 'evidence-truth-badge',
  TITLE: 'evidence-truth-title',
  DESCRIPTION: 'evidence-truth-description',
  NEXT_ACTION: 'evidence-truth-next-action',
  PROVENANCE_LABEL: 'evidence-truth-provenance',
} as const
