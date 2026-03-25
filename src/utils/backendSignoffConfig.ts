/**
 * Backend Sign-off Mode Detection Utilities
 *
 * Provides deterministic, testable helpers for identifying whether the test
 * environment is configured for strict backend sign-off testing.
 *
 * These utilities are shared between:
 *   - `e2e/helpers/auth.ts` (isStrictBackendMode, getBackendBaseUrl)
 *   - `e2e/mvp-backend-signoff.spec.ts` (strict sign-off lane)
 *
 * ## Design principle
 *
 * All functions are pure or only read process.env — zero side effects.
 * This makes them straightforward to unit-test by mocking env vars.
 *
 * ## Strict backend mode
 *
 * Strict mode is enabled by setting `BIATEC_STRICT_BACKEND=true` in the
 * test environment (typically CI staging with a live backend). When active:
 *
 *   1. `loginWithCredentialsStrict()` throws instead of falling back to seeded state
 *   2. Sign-off specs run against real backend endpoints
 *   3. Fallback to localStorage seeding is an explicit FAILURE, not a silent pass
 *
 * Without strict mode (standard CI): tests skip gracefully, permissive
 * helpers fall back to contract-validated localStorage seeding.
 *
 * Issue: Close MVP sign-off gap with real-backend Playwright evidence
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// TypeScript 6 compatibility: process global not available without @types/node
// ---------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const process: { env: Record<string, string | undefined> }
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackendSignoffConfig {
  /** Whether strict backend mode is active */
  strictMode: boolean
  /** Backend base URL for API calls */
  apiBaseUrl: string
  /** Email used for sign-off test authentication */
  testEmail: string
  /** Whether the configuration is considered complete for sign-off */
  isConfigured: boolean
  /** Human-readable description of the current configuration */
  configSummary: string
}

// ---------------------------------------------------------------------------
// Environment-driven mode detection
// ---------------------------------------------------------------------------

/**
 * Returns true when strict backend sign-off mode is active.
 *
 * Strict mode is enabled by setting `BIATEC_STRICT_BACKEND=true` in the test
 * environment (CI staging with a live backend). When strict mode is active,
 * sign-off specs run against real backend endpoints instead of seeded state.
 *
 * Case-sensitive: only the exact lowercase string `'true'` enables strict mode.
 * Values like `'TRUE'`, `'1'`, `'yes'` are NOT treated as enabling strict mode.
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function isStrictBackendMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.BIATEC_STRICT_BACKEND === 'true'
}

/**
 * Returns the backend base URL configured for the sign-off environment.
 * Falls back to localhost:3000 for local development.
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function getBackendBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return env.API_BASE_URL ?? 'http://localhost:3000'
}

/**
 * Returns the test email configured for sign-off authentication.
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function getSignoffTestEmail(env: Record<string, string | undefined> = process.env): string {
  return env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'
}

/**
 * Returns true when the sign-off configuration is considered complete:
 * strict mode is active AND a real (non-localhost) backend URL is configured.
 *
 * A localhost URL is considered "not fully configured" because it indicates
 * a local development setup rather than a CI staging environment.
 *
 * Uses `URL.hostname` parsing for accurate host extraction — avoids false
 * positives from `String.includes()` which would incorrectly flag URLs like
 * `https://my-localhost-server.com` or paths containing `127.0.0.1`.
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function isSignoffFullyConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!isStrictBackendMode(env)) return false
  const rawUrl = getBackendBaseUrl(env)
  let hostname: string
  try {
    hostname = new URL(rawUrl).hostname
  } catch {
    // If URL is malformed, treat as not configured
    return false
  }
  return hostname !== 'localhost' && hostname !== '127.0.0.1'
}

/**
 * Returns a human-readable summary of the current backend sign-off configuration.
 * Useful for CI logs and test skip messages.
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function describeBackendSignoffConfig(
  env: Record<string, string | undefined> = process.env,
): BackendSignoffConfig {
  const strictMode = isStrictBackendMode(env)
  const apiBaseUrl = getBackendBaseUrl(env)
  const testEmail = getSignoffTestEmail(env)
  const isConfigured = isSignoffFullyConfigured(env)

  let configSummary: string
  if (!strictMode) {
    configSummary =
      'Strict backend mode NOT active (BIATEC_STRICT_BACKEND != true). ' +
      'Sign-off tests will skip. Set BIATEC_STRICT_BACKEND=true and API_BASE_URL to enable.'
  } else if (!isConfigured) {
    configSummary =
      `Strict backend mode active but API_BASE_URL points to local (${apiBaseUrl}). ` +
      'Sign-off tests will run but may fail if no local backend is present. ' +
      'Set API_BASE_URL to a staging URL for production sign-off.'
  } else {
    configSummary =
      `Strict backend sign-off ACTIVE. Backend: ${apiBaseUrl}. Email: ${testEmail}. ` +
      'Tests will fail loudly if backend is unavailable or auth fails.'
  }

  return { strictMode, apiBaseUrl, testEmail, isConfigured, configSummary }
}

/**
 * Returns a skip message suitable for `test.skip()` calls in sign-off specs.
 * Returns `undefined` when the test should NOT be skipped (strict mode active).
 *
 * This is a simpler predecessor to `requireStrictBackend()`. It only checks
 * `BIATEC_STRICT_BACKEND` — not the backend URL. For the full guard that also
 * validates `API_BASE_URL` is a real non-localhost URL, use `requireStrictBackend()`.
 *
 * Usage:
 *   const skipMsg = getSignoffSkipReason()
 *   test.skip(skipMsg !== undefined, skipMsg ?? '')
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function getSignoffSkipReason(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  if (isStrictBackendMode(env)) return undefined
  return (
    'Strict backend sign-off lane requires BIATEC_STRICT_BACKEND=true and API_BASE_URL. ' +
    'This skip is intentional — the test must FAIL (not silently pass) when run without a ' +
    'real backend. Set BIATEC_STRICT_BACKEND=true and API_BASE_URL=<staging-url> to run ' +
    'this sign-off lane.'
  )
}

/**
 * Full skip guard for strict sign-off specs.
 *
 * Returns a skip-reason string when the test should be skipped; returns
 * `undefined` when the test SHOULD run (strict mode active + real backend URL).
 *
 * This is the canonical guard for `e2e/mvp-backend-signoff.spec.ts`. It enforces
 * both conditions required for credible release evidence:
 *   1. `BIATEC_STRICT_BACKEND === "true"` — strict mode must be explicitly activated.
 *   2. `API_BASE_URL` is set, is a valid URL, and is NOT localhost/127.0.0.1 — must
 *      point to a real staging or production backend, not a local dev server.
 *
 * Skip conditions (in priority order):
 *   1. `BIATEC_STRICT_BACKEND` is not set to "true" — standard CI, tests skip gracefully.
 *   2. `API_BASE_URL` is not set or is empty — backend not configured; tests skip with a
 *      clear "not release evidence" message rather than failing at the network layer.
 *   3. `API_BASE_URL` is malformed (not a valid URL) — tests skip with a parse-error message.
 *   4. `API_BASE_URL` points to localhost or 127.0.0.1 — tests skip; localhost is not a
 *      valid sign-off target for production release evidence.
 *
 * When `BIATEC_STRICT_BACKEND=true` AND a real non-localhost `API_BASE_URL` is set:
 * returns `undefined` — all tests run and fail loudly on any backend unavailability
 * or contract violation (fail-closed behaviour is preserved).
 *
 * Usage:
 *   const skipReason = requireStrictBackend()
 *   test.skip(skipReason !== undefined, skipReason ?? '')
 *
 * @param env - Environment variables map (defaults to process.env for production use)
 */
export function requireStrictBackend(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  if (!isStrictBackendMode(env)) {
    return (
      'Strict backend sign-off lane requires BIATEC_STRICT_BACKEND=true. ' +
      'Set API_BASE_URL and BIATEC_STRICT_BACKEND=true to run against a live backend. ' +
      'This skip is intentional: the test must fail (not silently pass) if run without a real backend.'
    )
  }

  const apiBaseUrl = env.API_BASE_URL ?? ''
  if (!apiBaseUrl) {
    return (
      'Strict backend sign-off mode is active (BIATEC_STRICT_BACKEND=true) but ' +
      'API_BASE_URL is not set. Configure the SIGNOFF_API_BASE_URL repository secret ' +
      'or environment secret to point to a live staging backend ' +
      '(e.g. https://staging.biatec.io). ' +
      'This skip is intentional — tests will NOT silently pass without a real backend. ' +
      'This run is NOT credible release evidence. See STRICT_SIGNOFF_LANE.md.'
    )
  }

  let hostname: string
  try {
    hostname = new URL(apiBaseUrl).hostname
  } catch {
    return (
      `Strict backend sign-off mode is active but API_BASE_URL is malformed: "${apiBaseUrl}". ` +
      'Configure SIGNOFF_API_BASE_URL with a valid URL (e.g. https://staging.biatec.io). ' +
      'This run is NOT credible release evidence.'
    )
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return (
      `Strict backend sign-off mode is active but API_BASE_URL points to localhost (${apiBaseUrl}). ` +
      'A localhost URL is not a valid strict sign-off target. Configure SIGNOFF_API_BASE_URL ' +
      'with a real staging or production URL for credible release evidence. ' +
      'This run is NOT credible release evidence. See STRICT_SIGNOFF_LANE.md.'
    )
  }

  return undefined
}
