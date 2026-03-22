/**
 * strictSignoffArtifact.ts
 *
 * Types, classification, and display helpers for the `signoff-status.json`
 * artifact produced by the `.github/workflows/strict-signoff.yml` CI lane.
 *
 * Design principles
 * -----------------
 * - Fail-closed: absent, malformed, or "not-configured" artifacts NEVER map
 *   to a release-ready state.  The caller must receive an explicit error or
 *   a conservative fallback state.
 * - Pure functions only — zero side effects, zero I/O.
 * - All state is passed in so helpers are trivially unit-testable.
 *
 * Artifact format (from strict-signoff.yml):
 * ```json
 * {
 *   "status": "not_configured | passed | failed | skipped",
 *   "mode": "not-configured | full-strict",
 *   "is_release_evidence": false | true,
 *   "timestamp": "ISO-8601",
 *   "run_id": "string",
 *   "commit_sha": "string",
 *   "ref": "string",
 *   "trigger": "string",
 *   "api_base_url_set": boolean,
 *   "credentials_set": boolean,
 *   "summary": "string",
 *   "action_required": "string (only in not_configured)",
 *   "next_steps": ["string", ...] (only in not_configured)
 * }
 * ```
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import type { EvidenceTruthClass } from './evidenceTruthfulness'

// ---------------------------------------------------------------------------
// Artifact shape
// ---------------------------------------------------------------------------

/**
 * The shape of `signoff-status.json` produced by the strict-signoff CI lane.
 *
 * All fields are `readonly` to prevent accidental mutation after parse.
 */
export interface SignoffStatusArtifact {
  /** Overall job status inside the strict-signoff lane. */
  readonly status: 'not_configured' | 'passed' | 'failed' | 'skipped'
  /** Whether the run was a full real-backend run or an infrastructure-only run. */
  readonly mode: 'not-configured' | 'full-strict'
  /**
   * The single most important field:
   * `true` only when `mode === "full-strict"` AND `status === "passed"`.
   * Everything else is `false` — the artifact is NOT credible release evidence.
   */
  readonly is_release_evidence: boolean
  /** ISO-8601 timestamp when the artifact was produced. */
  readonly timestamp: string
  /** GitHub Actions run ID for audit traceability. */
  readonly run_id: string
  /** Git commit SHA the workflow ran against. */
  readonly commit_sha: string
  /** The git ref (branch or tag) that triggered the run. */
  readonly ref: string
  /** The GitHub event that triggered the workflow. */
  readonly trigger: string
  /** Whether `API_BASE_URL` was set in the run environment. */
  readonly api_base_url_set: boolean
  /** Whether `SIGNOFF_TEST_PASSWORD` was set in the run environment. */
  readonly credentials_set: boolean
  /** Human-readable summary of the run result. */
  readonly summary: string
  /**
   * Operator guidance for resolving the `not_configured` state.
   * Present only when `status === "not_configured"`.
   */
  readonly action_required?: string
  /**
   * Ordered list of remediation steps.
   * Present only when `status === "not_configured"`.
   */
  readonly next_steps?: readonly string[]
}

// ---------------------------------------------------------------------------
// Derived classification state
// ---------------------------------------------------------------------------

/**
 * A higher-level classification derived from a `SignoffStatusArtifact`.
 * This is what the frontend UI should use for rendering decisions.
 *
 * States (most trusted → least trusted):
 * - `backend_confirmed_passing`  — `is_release_evidence: true`, full-strict mode, passed.
 * - `backend_confirmed_failed`   — `mode: "full-strict"`, but tests failed.  Backend was
 *                                   configured but the product did not pass.
 * - `backend_configured_skipped` — `mode: "full-strict"`, but tests were skipped. Backend
 *                                   configured but the strict lane did not run.
 * - `not_configured`             — `mode: "not-configured"`.  Secrets / env vars absent.
 * - `infrastructure_only`        — Artifact present but `is_release_evidence: false` and
 *                                   mode is not-configured (fallback for partial states).
 * - `missing`                    — No artifact available (URL not set or fetch failed).
 */
export type StrictArtifactState =
  | 'backend_confirmed_passing'
  | 'backend_confirmed_failed'
  | 'backend_configured_skipped'
  | 'not_configured'
  | 'infrastructure_only'
  | 'missing'

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Classifies a parsed `SignoffStatusArtifact` into a `StrictArtifactState`.
 *
 * Fail-closed: any ambiguous input resolves to a non-passing state.
 */
export function classifyArtifactState(artifact: SignoffStatusArtifact): StrictArtifactState {
  if (artifact.mode === 'not-configured' || artifact.status === 'not_configured') {
    return 'not_configured'
  }
  if (artifact.mode === 'full-strict') {
    if (artifact.is_release_evidence && artifact.status === 'passed') {
      return 'backend_confirmed_passing'
    }
    if (artifact.status === 'failed') {
      return 'backend_confirmed_failed'
    }
    if (artifact.status === 'skipped') {
      return 'backend_configured_skipped'
    }
  }
  return 'infrastructure_only'
}

/**
 * Maps a `StrictArtifactState` to an `EvidenceTruthClass`.
 *
 * Only `backend_confirmed_passing` maps to `backend_confirmed`.
 * All other states map to conservative classes (fail-closed).
 */
export function artifactStateToEvidenceTruth(state: StrictArtifactState): EvidenceTruthClass {
  switch (state) {
    case 'backend_confirmed_passing':
      return 'backend_confirmed'
    case 'backend_confirmed_failed':
      return 'unavailable'
    case 'backend_configured_skipped':
      return 'partial_hydration'
    case 'not_configured':
    case 'infrastructure_only':
      return 'environment_blocked'
    case 'missing':
      return 'environment_blocked'
  }
}

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

export const STRICT_ARTIFACT_STATE_LABELS: Record<StrictArtifactState, string> = {
  backend_confirmed_passing: 'Backend-Confirmed Release Evidence',
  backend_confirmed_failed: 'Backend-Configured — Tests Failed',
  backend_configured_skipped: 'Backend-Configured — Tests Skipped',
  not_configured: 'Not Configured',
  infrastructure_only: 'Infrastructure Only',
  missing: 'No Artifact Available',
}

export const STRICT_ARTIFACT_STATE_DESCRIPTIONS: Record<StrictArtifactState, string> = {
  backend_confirmed_passing:
    'The protected strict sign-off lane ran against a live backend, all validations passed, ' +
    'and the artifact confirms is_release_evidence: true. This is credible release evidence.',
  backend_confirmed_failed:
    'The protected strict sign-off lane was configured with a live backend, but one or more ' +
    'validations failed. This artifact is NOT credible release evidence. Review the workflow ' +
    'traces for the specific failures before attempting release authorization.',
  backend_configured_skipped:
    'The protected strict sign-off lane was configured but individual tests were skipped. ' +
    'The lane did not produce credible release evidence. Verify the backend configuration ' +
    'and re-trigger the workflow.',
  not_configured:
    'The strict sign-off lane ran without a live backend. The required environment secrets ' +
    '(SIGNOFF_API_BASE_URL and SIGNOFF_TEST_PASSWORD) were not set. ' +
    'This artifact is infrastructure-only proof and is NOT credible release evidence.',
  infrastructure_only:
    'The strict sign-off lane ran, but the resulting artifact does not meet the threshold ' +
    'for credible release evidence. This is infrastructure-status proof only.',
  missing:
    'No strict sign-off artifact has been detected. Either the workflow has not run yet ' +
    'on current head, or the VITE_SIGNOFF_STATUS_URL environment variable is not configured. ' +
    'The release evidence posture cannot be assessed without a current-head artifact.',
}

export const STRICT_ARTIFACT_NEXT_ACTIONS: Record<StrictArtifactState, string> = {
  backend_confirmed_passing:
    'No action required. This artifact is credible release evidence and can be cited for ' +
    'release authorization. Ensure this run_id is recorded in the release notes.',
  backend_confirmed_failed:
    'Review the Playwright traces in the strict-signoff-report artifact. Identify and resolve ' +
    'the failing tests, then re-trigger the strict sign-off workflow via workflow_dispatch. ' +
    'Do not proceed with release authorization until a passing artifact is produced.',
  backend_configured_skipped:
    'Verify that BIATEC_STRICT_BACKEND=true is set and that requireStrictBackend() inside ' +
    'mvp-backend-signoff.spec.ts does not return a skip reason. Re-trigger the workflow.',
  not_configured:
    'Configure the required environment secrets in the sign-off-protected GitHub Environment: ' +
    'SIGNOFF_API_BASE_URL (live staging/production backend URL) and SIGNOFF_TEST_PASSWORD ' +
    '(credentials for the sign-off test account). Then trigger workflow_dispatch on the ' +
    '🔒 Strict Backend Sign-off Gate workflow.',
  infrastructure_only:
    'Re-trigger the strict sign-off workflow after verifying that all backend prerequisites ' +
    'are in place. Confirm the artifact reports is_release_evidence: true before authorizing release.',
  missing:
    'Trigger the 🔒 Strict Backend Sign-off Gate workflow from GitHub Actions ' +
    '(Actions → Strict Backend Sign-off Gate → Run workflow). Ensure SIGNOFF_API_BASE_URL ' +
    'and SIGNOFF_TEST_PASSWORD are configured as environment secrets.',
}

/** True when this state represents credible release evidence. */
export function isArtifactReleaseEvidence(state: StrictArtifactState): boolean {
  return state === 'backend_confirmed_passing'
}

/** True when this state is a launch blocker for release promotion. */
export function isArtifactBlocking(state: StrictArtifactState): boolean {
  return state !== 'backend_confirmed_passing'
}

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

/** Returns a Tailwind border + background class pair for the artifact banner. */
export function artifactStateBannerClass(state: StrictArtifactState): string {
  switch (state) {
    case 'backend_confirmed_passing':
      return 'border-green-700 bg-green-950'
    case 'backend_confirmed_failed':
      return 'border-red-700 bg-red-950'
    case 'backend_configured_skipped':
      return 'border-blue-700 bg-blue-950'
    case 'not_configured':
    case 'infrastructure_only':
    case 'missing':
      return 'border-yellow-700 bg-yellow-950'
  }
}

/** Returns a Tailwind text color class for the banner title. */
export function artifactStateTitleClass(state: StrictArtifactState): string {
  switch (state) {
    case 'backend_confirmed_passing':
      return 'text-green-200'
    case 'backend_confirmed_failed':
      return 'text-red-200'
    case 'backend_configured_skipped':
      return 'text-blue-200'
    case 'not_configured':
    case 'infrastructure_only':
    case 'missing':
      return 'text-yellow-200'
  }
}

/** Returns a Tailwind text color class for the banner body text. */
export function artifactStateBodyClass(state: StrictArtifactState): string {
  switch (state) {
    case 'backend_confirmed_passing':
      return 'text-green-300'
    case 'backend_confirmed_failed':
      return 'text-red-300'
    case 'backend_configured_skipped':
      return 'text-blue-300'
    case 'not_configured':
    case 'infrastructure_only':
    case 'missing':
      return 'text-yellow-300'
  }
}

/** Returns a Tailwind badge class for the artifact state pill. */
export function artifactStateBadgeClass(state: StrictArtifactState): string {
  switch (state) {
    case 'backend_confirmed_passing':
      return 'bg-green-800 text-green-100'
    case 'backend_confirmed_failed':
      return 'bg-red-800 text-red-100'
    case 'backend_configured_skipped':
      return 'bg-blue-800 text-blue-100'
    case 'not_configured':
    case 'infrastructure_only':
    case 'missing':
      return 'bg-yellow-800 text-yellow-100'
  }
}

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

/**
 * Formats a short commit SHA for display (first 8 characters).
 * Returns 'unknown' when the SHA is absent or empty.
 */
export function formatCommitSha(sha: string | undefined): string {
  if (!sha || sha.trim() === '') return 'unknown'
  return sha.slice(0, 8)
}

/**
 * Formats an ISO-8601 timestamp for human-readable display.
 * Returns 'Unknown' when the timestamp is absent or unparseable.
 */
export function formatArtifactTimestamp(timestamp: string | undefined): string {
  if (!timestamp || timestamp.trim() === '') return 'Unknown'
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return timestamp
  }
}

/**
 * Builds a short provenance string suitable for use in aria-label or
 * disclaimer text under the strict sign-off status banner.
 */
export function buildArtifactProvenanceLabel(
  artifact: SignoffStatusArtifact | null,
  state: StrictArtifactState,
): string {
  if (state === 'missing' || !artifact) {
    return 'No current-head strict sign-off artifact available.'
  }
  const sha = formatCommitSha(artifact.commit_sha)
  const ts = formatArtifactTimestamp(artifact.timestamp)
  const runId = artifact.run_id || 'unknown'
  return `Artifact from run ${runId} on commit ${sha} at ${ts}.`
}

// ---------------------------------------------------------------------------
// Parsing / safe access
// ---------------------------------------------------------------------------

/**
 * Attempts to parse a plain `unknown` value as a `SignoffStatusArtifact`.
 *
 * This is a best-effort parser — it checks that the required fields are
 * present and have the expected primitive types.  Returns `null` when the
 * input does not look like a valid artifact.
 *
 * This is intentionally lenient about extra fields so that future artifact
 * format additions don't break existing deployments.
 */
export function parseSignoffStatusArtifact(raw: unknown): SignoffStatusArtifact | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const obj = raw as Record<string, unknown>

  if (typeof obj.status !== 'string') return null
  if (typeof obj.mode !== 'string') return null
  if (typeof obj.is_release_evidence !== 'boolean') return null
  if (typeof obj.timestamp !== 'string') return null

  return {
    status: obj.status as SignoffStatusArtifact['status'],
    mode: obj.mode as SignoffStatusArtifact['mode'],
    is_release_evidence: obj.is_release_evidence,
    timestamp: obj.timestamp,
    run_id: typeof obj.run_id === 'string' ? obj.run_id : '',
    commit_sha: typeof obj.commit_sha === 'string' ? obj.commit_sha : '',
    ref: typeof obj.ref === 'string' ? obj.ref : '',
    trigger: typeof obj.trigger === 'string' ? obj.trigger : '',
    api_base_url_set: obj.api_base_url_set === true,
    credentials_set: obj.credentials_set === true,
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    action_required:
      typeof obj.action_required === 'string' ? obj.action_required : undefined,
    next_steps: Array.isArray(obj.next_steps)
      ? (obj.next_steps as unknown[]).filter((s): s is string => typeof s === 'string')
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Fetch artifact from VITE_SIGNOFF_STATUS_URL
// ---------------------------------------------------------------------------

/**
 * Fetches and parses the `signoff-status.json` artifact from the URL
 * configured in `VITE_SIGNOFF_STATUS_URL`.
 *
 * Returns `null` when:
 * - The env var is not set
 * - The fetch fails (network error, 4xx, 5xx)
 * - The response body cannot be parsed as a valid `SignoffStatusArtifact`
 *
 * The caller should treat `null` as the `'missing'` state.
 */
export async function fetchSignoffStatusArtifact(): Promise<SignoffStatusArtifact | null> {
  const artifactUrl = (import.meta.env?.VITE_SIGNOFF_STATUS_URL as string | undefined) ?? ''

  if (!artifactUrl) return null

  try {
    const response = await fetch(artifactUrl, {
      // Disable caching so operators always see the latest artifact
      cache: 'no-cache',
    })
    if (!response.ok) return null
    const json: unknown = await response.json()
    return parseSignoffStatusArtifact(json)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

/**
 * Stable `data-testid` values for the strict sign-off artifact panel.
 * Shared between the Vue template and test files.
 */
export const STRICT_ARTIFACT_TEST_IDS = {
  PANEL: 'strict-artifact-panel',
  BANNER: 'strict-artifact-banner',
  STATE_BADGE: 'strict-artifact-state-badge',
  RELEASE_EVIDENCE_INDICATOR: 'strict-artifact-release-evidence',
  PROVENANCE_LABEL: 'strict-artifact-provenance',
  COMMIT_SHA: 'strict-artifact-commit-sha',
  TIMESTAMP: 'strict-artifact-timestamp',
  RUN_ID: 'strict-artifact-run-id',
  DESCRIPTION: 'strict-artifact-description',
  NEXT_ACTION: 'strict-artifact-next-action',
  NEXT_STEPS_LIST: 'strict-artifact-next-steps',
  FETCH_ERROR: 'strict-artifact-fetch-error',
} as const
