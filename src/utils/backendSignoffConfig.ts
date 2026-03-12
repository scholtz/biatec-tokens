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
