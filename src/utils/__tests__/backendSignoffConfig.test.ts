/**
 * Unit Tests: Backend Sign-off Config Utilities
 *
 * Validates all helpers in src/utils/backendSignoffConfig.ts.
 *
 * AC #1 — Strict backend mode detection correctly reads BIATEC_STRICT_BACKEND env var
 * AC #2 — `isStrictBackendMode` returns false when env var is absent or non-"true"
 * AC #3 — `getBackendBaseUrl` returns API_BASE_URL when set, localhost fallback otherwise
 * AC #4 — `isSignoffFullyConfigured` requires both strict mode AND non-localhost URL
 * AC #5 — `getSignoffSkipReason` returns undefined in strict mode (test should run)
 * AC #6 — `describeBackendSignoffConfig` provides accurate human-readable summary
 *
 * All tests are synchronous and deterministic. Zero I/O, zero side effects.
 *
 * Issue: Close MVP sign-off gap with real-backend Playwright evidence
 */

import { describe, it, expect } from 'vitest'
import {
  isStrictBackendMode,
  getBackendBaseUrl,
  getSignoffTestEmail,
  isSignoffFullyConfigured,
  describeBackendSignoffConfig,
  getSignoffSkipReason,
  requireStrictBackend,
} from '../backendSignoffConfig'

// ---------------------------------------------------------------------------
// isStrictBackendMode
// ---------------------------------------------------------------------------

describe('isStrictBackendMode', () => {
  it('returns true when BIATEC_STRICT_BACKEND is "true"', () => {
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: 'true' })).toBe(true)
  })

  it('returns false when BIATEC_STRICT_BACKEND is undefined', () => {
    expect(isStrictBackendMode({})).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is "false"', () => {
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: 'false' })).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is "TRUE" (case-sensitive)', () => {
    // Strict comparison: only the exact string "true" enables strict mode
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: 'TRUE' })).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is "1"', () => {
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: '1' })).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is empty string', () => {
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: '' })).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is "yes"', () => {
    expect(isStrictBackendMode({ BIATEC_STRICT_BACKEND: 'yes' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getBackendBaseUrl
// ---------------------------------------------------------------------------

describe('getBackendBaseUrl', () => {
  it('returns API_BASE_URL when set', () => {
    expect(getBackendBaseUrl({ API_BASE_URL: 'https://staging.biatec.io' })).toBe(
      'https://staging.biatec.io',
    )
  })

  it('returns localhost fallback when API_BASE_URL is not set', () => {
    expect(getBackendBaseUrl({})).toBe('http://localhost:3000')
  })

  it('returns the exact value of API_BASE_URL without modification', () => {
    const url = 'https://api.biatec.io/v2'
    expect(getBackendBaseUrl({ API_BASE_URL: url })).toBe(url)
  })

  it('returns localhost fallback when API_BASE_URL is undefined', () => {
    expect(getBackendBaseUrl({ API_BASE_URL: undefined })).toBe('http://localhost:3000')
  })
})

// ---------------------------------------------------------------------------
// getSignoffTestEmail
// ---------------------------------------------------------------------------

describe('getSignoffTestEmail', () => {
  it('returns TEST_USER_EMAIL when set', () => {
    expect(getSignoffTestEmail({ TEST_USER_EMAIL: 'signoff@biatec.io' })).toBe(
      'signoff@biatec.io',
    )
  })

  it('returns default email when TEST_USER_EMAIL is not set', () => {
    expect(getSignoffTestEmail({})).toBe('e2e-test@biatec.io')
  })

  it('returns the exact value of TEST_USER_EMAIL', () => {
    const email = 'custom-signoff@example.com'
    expect(getSignoffTestEmail({ TEST_USER_EMAIL: email })).toBe(email)
  })
})

// ---------------------------------------------------------------------------
// isSignoffFullyConfigured
// ---------------------------------------------------------------------------

describe('isSignoffFullyConfigured', () => {
  it('returns false when BIATEC_STRICT_BACKEND is not set', () => {
    expect(
      isSignoffFullyConfigured({ API_BASE_URL: 'https://staging.biatec.io' }),
    ).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is true but API_BASE_URL is localhost', () => {
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'http://localhost:3000',
      }),
    ).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is true and API_BASE_URL is 127.0.0.1', () => {
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'http://127.0.0.1:3000',
      }),
    ).toBe(false)
  })

  it('returns false when BIATEC_STRICT_BACKEND is true and API_BASE_URL is unset (falls back to localhost)', () => {
    expect(
      isSignoffFullyConfigured({ BIATEC_STRICT_BACKEND: 'true' }),
    ).toBe(false)
  })

  it('returns true when BIATEC_STRICT_BACKEND=true and API_BASE_URL is a non-localhost URL', () => {
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://staging.biatec.io',
      }),
    ).toBe(true)
  })

  it('returns true for https staging URL with path', () => {
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://api.biatec.io/v2',
      }),
    ).toBe(true)
  })

  it('does NOT incorrectly flag non-localhost domain that contains the word "localhost"', () => {
    // URL parsing uses hostname, not string search — "my-localhost-server.com" is NOT localhost
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://my-localhost-server.com',
      }),
    ).toBe(true)
  })

  it('does NOT incorrectly flag URL whose path contains "127.0.0.1"', () => {
    // URL parsing uses hostname, not string search — path segment is not the host
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://api.example.com/endpoint/127.0.0.1/data',
      }),
    ).toBe(true)
  })

  it('returns false for malformed URL when strict mode is active', () => {
    expect(
      isSignoffFullyConfigured({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'not-a-valid-url',
      }),
    ).toBe(false)
  })

  it('returns false when both are absent', () => {
    expect(isSignoffFullyConfigured({})).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getSignoffSkipReason
// ---------------------------------------------------------------------------

describe('getSignoffSkipReason', () => {
  it('returns undefined when BIATEC_STRICT_BACKEND=true (test should run)', () => {
    expect(
      getSignoffSkipReason({ BIATEC_STRICT_BACKEND: 'true' }),
    ).toBeUndefined()
  })

  it('returns a skip message when BIATEC_STRICT_BACKEND is not set', () => {
    const reason = getSignoffSkipReason({})
    expect(typeof reason).toBe('string')
    expect((reason as string).length).toBeGreaterThan(0)
  })

  it('skip message mentions BIATEC_STRICT_BACKEND and API_BASE_URL', () => {
    const reason = getSignoffSkipReason({})
    expect(reason).toMatch(/BIATEC_STRICT_BACKEND/i)
    expect(reason).toMatch(/API_BASE_URL/i)
  })

  it('skip message explains this is intentional (test must fail not silently pass)', () => {
    const reason = getSignoffSkipReason({})
    expect(reason).toMatch(/FAIL|fail/i)
  })

  it('returns skip message when BIATEC_STRICT_BACKEND=false', () => {
    const reason = getSignoffSkipReason({ BIATEC_STRICT_BACKEND: 'false' })
    expect(typeof reason).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// describeBackendSignoffConfig
// ---------------------------------------------------------------------------

describe('describeBackendSignoffConfig', () => {
  it('returns correct config when strict mode is inactive', () => {
    const config = describeBackendSignoffConfig({})
    expect(config.strictMode).toBe(false)
    expect(config.apiBaseUrl).toBe('http://localhost:3000')
    expect(config.testEmail).toBe('e2e-test@biatec.io')
    expect(config.isConfigured).toBe(false)
    expect(config.configSummary).toMatch(/NOT active|not active/i)
  })

  it('returns correct config when strict mode is active with real backend', () => {
    const config = describeBackendSignoffConfig({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'https://staging.biatec.io',
      TEST_USER_EMAIL: 'signoff@biatec.io',
    })
    expect(config.strictMode).toBe(true)
    expect(config.apiBaseUrl).toBe('https://staging.biatec.io')
    expect(config.testEmail).toBe('signoff@biatec.io')
    expect(config.isConfigured).toBe(true)
    expect(config.configSummary).toMatch(/ACTIVE|active/i)
  })

  it('returns correct config when strict mode active but using localhost', () => {
    const config = describeBackendSignoffConfig({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'http://localhost:3000',
    })
    expect(config.strictMode).toBe(true)
    expect(config.isConfigured).toBe(false)
    expect(config.configSummary).toMatch(/local|localhost/i)
  })

  it('configSummary is always a non-empty string', () => {
    const env1 = {}
    const env2 = { BIATEC_STRICT_BACKEND: 'true' }
    const env3 = { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'https://staging.biatec.io' }

    expect(describeBackendSignoffConfig(env1).configSummary.length).toBeGreaterThan(0)
    expect(describeBackendSignoffConfig(env2).configSummary.length).toBeGreaterThan(0)
    expect(describeBackendSignoffConfig(env3).configSummary.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// requireStrictBackend (full sign-off guard: strict mode + real URL)
//
// This is the canonical guard function used by mvp-backend-signoff.spec.ts.
// It is now exported from backendSignoffConfig.ts for testability.
//
// Contract:
//   - Returns undefined   → test SHOULD run (real backend configured)
//   - Returns string      → test SHOULD be skipped (provide reason to test.skip)
//
// Separation from getSignoffSkipReason:
//   getSignoffSkipReason only checks BIATEC_STRICT_BACKEND (simpler, older guard)
//   requireStrictBackend also validates API_BASE_URL is a real non-localhost URL
// ---------------------------------------------------------------------------

describe('requireStrictBackend', () => {
  // --- Positive path: test SHOULD run ---

  it('returns undefined when BIATEC_STRICT_BACKEND=true and API_BASE_URL is a real staging URL', () => {
    expect(
      requireStrictBackend({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://staging.biatec.io',
      }),
    ).toBeUndefined()
  })

  it('returns undefined when BIATEC_STRICT_BACKEND=true and API_BASE_URL is a production URL', () => {
    expect(
      requireStrictBackend({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://api.biatec.io',
      }),
    ).toBeUndefined()
  })

  it('returns undefined when BIATEC_STRICT_BACKEND=true and API_BASE_URL has a path prefix', () => {
    expect(
      requireStrictBackend({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://staging.biatec.io/api/v1',
      }),
    ).toBeUndefined()
  })

  it('returns undefined when BIATEC_STRICT_BACKEND=true and API_BASE_URL uses a non-standard port', () => {
    expect(
      requireStrictBackend({
        BIATEC_STRICT_BACKEND: 'true',
        API_BASE_URL: 'https://staging.biatec.io:8443',
      }),
    ).toBeUndefined()
  })

  // --- Negative path: BIATEC_STRICT_BACKEND not "true" ---

  it('returns a skip reason when BIATEC_STRICT_BACKEND is not set', () => {
    const reason = requireStrictBackend({ API_BASE_URL: 'https://staging.biatec.io' })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/BIATEC_STRICT_BACKEND/i)
  })

  it('returns a skip reason when BIATEC_STRICT_BACKEND is "false"', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'false',
      API_BASE_URL: 'https://staging.biatec.io',
    })
    expect(typeof reason).toBe('string')
  })

  it('returns a skip reason when BIATEC_STRICT_BACKEND is "TRUE" (case-sensitive)', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'TRUE',
      API_BASE_URL: 'https://staging.biatec.io',
    })
    expect(typeof reason).toBe('string')
  })

  it('returns a skip reason when BIATEC_STRICT_BACKEND is "1"', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: '1',
      API_BASE_URL: 'https://staging.biatec.io',
    })
    expect(typeof reason).toBe('string')
  })

  it('returns a skip reason when BIATEC_STRICT_BACKEND is empty string', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: '',
      API_BASE_URL: 'https://staging.biatec.io',
    })
    expect(typeof reason).toBe('string')
  })

  // --- Negative path: API_BASE_URL not configured ---

  it('returns a skip reason when API_BASE_URL is not set', () => {
    const reason = requireStrictBackend({ BIATEC_STRICT_BACKEND: 'true' })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/API_BASE_URL/i)
    // Must explicitly say this is NOT release evidence
    expect(reason as string).toMatch(/NOT credible release evidence/i)
  })

  it('returns a skip reason when API_BASE_URL is empty string', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: '',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/API_BASE_URL/i)
  })

  it('skip reason for missing URL mentions SIGNOFF_API_BASE_URL secret name', () => {
    const reason = requireStrictBackend({ BIATEC_STRICT_BACKEND: 'true' })
    // Must guide operator to the correct configuration action
    expect(reason as string).toMatch(/SIGNOFF_API_BASE_URL/i)
  })

  // --- Negative path: API_BASE_URL is localhost (not a valid sign-off target) ---

  it('returns a skip reason when API_BASE_URL is http://localhost:3000', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'http://localhost:3000',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/localhost/i)
    expect(reason as string).toMatch(/NOT credible release evidence/i)
  })

  it('returns a skip reason when API_BASE_URL is http://localhost (no port)', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'http://localhost',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/localhost/i)
  })

  it('returns a skip reason when API_BASE_URL is http://127.0.0.1:3000', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'http://127.0.0.1:3000',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/localhost/i)
    expect(reason as string).toMatch(/NOT credible release evidence/i)
  })

  it('returns a skip reason when API_BASE_URL is http://127.0.0.1 (no port)', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'http://127.0.0.1',
    })
    expect(typeof reason).toBe('string')
  })

  // --- Negative path: API_BASE_URL is malformed ---

  it('returns a skip reason when API_BASE_URL is not a valid URL', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'not-a-valid-url',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/malformed/i)
    expect(reason as string).toMatch(/NOT credible release evidence/i)
  })

  it('returns a skip reason when API_BASE_URL is just a path (no scheme)', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: '/api/v1',
    })
    expect(typeof reason).toBe('string')
    expect(reason as string).toMatch(/malformed/i)
  })

  it('returns a skip reason when API_BASE_URL is plain text with no scheme', () => {
    const reason = requireStrictBackend({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'staging.biatec.io',
    })
    expect(typeof reason).toBe('string')
    // Without scheme, URL constructor throws → malformed
    expect(reason as string).toMatch(/malformed/i)
  })

  // --- Message quality: skip reasons are non-trivial and actionable ---

  it('all skip reasons are non-empty strings with actionable guidance', () => {
    const cases: Record<string, string | undefined>[] = [
      {},
      { BIATEC_STRICT_BACKEND: 'false' },
      { BIATEC_STRICT_BACKEND: 'true' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: '' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'http://localhost:3000' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'not-valid' },
    ]
    for (const env of cases) {
      const reason = requireStrictBackend(env)
      expect(typeof reason).toBe('string')
      expect((reason as string).length).toBeGreaterThan(40) // not a trivial one-liner
    }
  })

  it('none of the skip reasons silently pass — all mention this is intentional or not evidence', () => {
    const cases: Record<string, string | undefined>[] = [
      {},
      { BIATEC_STRICT_BACKEND: 'false' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: '' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'http://localhost:3000' },
    ]
    for (const env of cases) {
      const reason = requireStrictBackend(env)
      // Each message must make it explicit this is not release evidence or is intentional
      const hasReleaseEvidence = /NOT credible release evidence/i.test(reason as string)
      const hasIntentional = /intentional/i.test(reason as string)
      expect(hasReleaseEvidence || hasIntentional, `Skip reason missing evidence/intentional mention: ${reason}`).toBe(true)
    }
  })

  // --- Integration-readiness: requireStrictBackend vs getSignoffSkipReason ---

  it('requireStrictBackend returns undefined only when isSignoffFullyConfigured would also return true', () => {
    const env = {
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'https://staging.biatec.io',
    }
    expect(requireStrictBackend(env)).toBeUndefined()
    expect(isSignoffFullyConfigured(env)).toBe(true)
  })

  it('requireStrictBackend returns a skip reason when isSignoffFullyConfigured returns false', () => {
    const cases: Array<Record<string, string | undefined>> = [
      {},
      { BIATEC_STRICT_BACKEND: 'true' },
      { BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'http://localhost:3000' },
    ]
    for (const env of cases) {
      expect(isSignoffFullyConfigured(env)).toBe(false)
      expect(requireStrictBackend(env)).toBeDefined()
    }
  })
})
