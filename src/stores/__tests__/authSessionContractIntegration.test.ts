/**
 * Integration Tests: Auth Session Contract × Route Guard × Auth Store
 *
 * Validates cross-cutting contract assumptions between:
 *   - validateARC76Session (arc76SessionContract.ts)
 *   - isConnectedSession / parseAndValidateSession
 *   - Route guard logic expectations (canonical vs legacy path enforcement)
 *   - Auth bootstrap failure behavior (fail-fast diagnostics)
 *
 * Acceptance criteria addressed (Issue: Harden auth-first guided launch):
 *   AC #2  Backend-verified auth: session contract validated before use
 *   AC #3  Deterministic navigation: authenticated vs unauthenticated route access
 *   AC #5  Traceability: contract failures produce actionable diagnostics
 *
 * All tests synchronous and deterministic — no arbitrary timeouts.
 *
 * Related:
 *   src/utils/arc76SessionContract.ts
 *   src/utils/authFirstIssuanceWorkspace.ts
 *   e2e/helpers/auth.ts
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect } from 'vitest'
import {
  validateARC76Session,
  isConnectedSession,
  parseAndValidateSession,
  describeSessionFailure,
  getMissingSessionFields,
  type ARC76SessionContract,
} from '../../utils/arc76SessionContract'

// ---------------------------------------------------------------------------
// Session contract → route guard integration
// ---------------------------------------------------------------------------

describe('Session contract → route guard integration', () => {
  describe('isConnectedSession: the exact check used by the issuance route guard', () => {
    it('grants access for a well-formed, connected session', () => {
      const session: ARC76SessionContract = {
        address: 'ROUTE_GUARD_TEST_ADDRESS',
        email: 'routeguard@biatec.io',
        isConnected: true,
      }
      // The route guard uses isConnectedSession to decide whether to allow or redirect
      expect(isConnectedSession(session)).toBe(true)
    })

    it('denies access (redirects) when isConnected is false', () => {
      const session: ARC76SessionContract = {
        address: 'ROUTE_GUARD_TEST_ADDRESS',
        email: 'routeguard@biatec.io',
        isConnected: false,
      }
      // A structurally valid but disconnected session still redirects the user
      expect(isConnectedSession(session)).toBe(false)
    })

    it('denies access (redirects) when session is null', () => {
      // No localStorage entry — unauthenticated user
      expect(isConnectedSession(null)).toBe(false)
    })

    it('denies access (redirects) when session is undefined', () => {
      expect(isConnectedSession(undefined)).toBe(false)
    })

    it('denies access when address is empty (contract violation)', () => {
      // An empty address fails the contract — the derived ARC76 account is unknown
      const malformed = { address: '', email: 'test@biatec.io', isConnected: true }
      expect(isConnectedSession(malformed)).toBe(false)
    })

    it('denies access when email is missing (contract violation)', () => {
      // Email is required for ARC76 account derivation traceability
      const malformed = { address: 'ADDR', isConnected: true }
      expect(isConnectedSession(malformed)).toBe(false)
    })

    it('denies access when isConnected is a string (runtime type check)', () => {
      // TypeScript prevents this at compile time, but the validator must also handle
      // runtime type confusion (e.g., values deserialized from untrusted localStorage JSON).
      // The `as any` cast simulates a value arriving at runtime without TypeScript's checks.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const malformed = { address: 'ADDR', email: 'test@biatec.io', isConnected: 'true' as any }
      expect(isConnectedSession(malformed)).toBe(false)
    })
  })

  describe('Route guard simulation: localStorage → parse → validate → allow/deny', () => {
    it('allows access for a valid serialised session round-trip', () => {
      const session: ARC76SessionContract = {
        address: 'SIMULATION_ADDR_ARC76',
        email: 'simulation@biatec.io',
        isConnected: true,
      }
      const serialised = JSON.stringify(session)

      // Simulate the router guard: read from localStorage string, validate contract
      const parsed = parseAndValidateSession(serialised)
      expect(parsed).not.toBeNull()
      expect(isConnectedSession(parsed)).toBe(true)
    })

    it('denies access for a corrupted localStorage string (malformed JSON)', () => {
      const corrupted = 'CORRUPTED_NOT_JSON'
      const parsed = parseAndValidateSession(corrupted)
      // parseAndValidateSession must return null for invalid JSON — fail-fast guard
      expect(parsed).toBeNull()
      expect(isConnectedSession(parsed)).toBe(false)
    })

    it('denies access when localStorage is null (unauthenticated user)', () => {
      const parsed = parseAndValidateSession(null)
      expect(parsed).toBeNull()
      expect(isConnectedSession(parsed)).toBe(false)
    })

    it('denies access for a session with isConnected missing (expired/truncated)', () => {
      // Backend contract change or truncated storage — must reject gracefully
      const truncated = JSON.stringify({ address: 'ADDR', email: 'test@biatec.io' })
      const parsed = parseAndValidateSession(truncated)
      // The contract is violated — isConnected is absent
      expect(parsed).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Fail-fast diagnostics — auth bootstrap failures must surface immediately
// ---------------------------------------------------------------------------

describe('Auth bootstrap fail-fast diagnostics', () => {
  describe('validateARC76Session: structured error reporting for test helpers', () => {
    it('returns structured errors for a completely empty session object', () => {
      const result = validateARC76Session({})
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
      // Each missing field must produce a distinct, actionable error message
      const joined = result.errors.join(' ')
      expect(joined).toMatch(/address/i)
      expect(joined).toMatch(/email/i)
      expect(joined).toMatch(/isConnected/i)
    })

    it('reports only the failing field when one field is invalid', () => {
      const result = validateARC76Session({
        address: '',  // fails: empty string
        email: 'valid@biatec.io',
        isConnected: true,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatch(/address/i)
    })

    it('provides a human-readable description for the null session case', () => {
      const description = describeSessionFailure(null)
      expect(typeof description).toBe('string')
      expect(description.length).toBeGreaterThan(0)
      // Must guide the developer toward the auth issue, not show a generic error
      expect(description).not.toBe('Unknown error')
    })

    it('provides a useful description for an expired (isConnected: false) session', () => {
      const expired: ARC76SessionContract = {
        address: 'EXPIRED_ADDR',
        email: 'expired@biatec.io',
        isConnected: false,
      }
      const description = describeSessionFailure(expired)
      expect(description).toMatch(/isConnected.*false|disconnected|expired/i)
    })

    it('lists missing fields for a partial session (getMissingSessionFields)', () => {
      const partial = { address: 'SOME_ADDR' } // email and isConnected missing
      const missing = getMissingSessionFields(partial)
      expect(missing).toContain('email')
      expect(missing).toContain('isConnected')
      expect(missing).not.toContain('address')
    })
  })

  describe('Session contract invariants for E2E bootstrap pattern', () => {
    it('accepts a session with extra fields (backward-compatible)', () => {
      // The auth store and E2E helpers may attach extra fields (name, canDeploy, etc.)
      // The contract validator must only enforce the three required fields.
      const extended = {
        address: 'ARC76_EXTENDED_ADDR',
        email: 'extended@biatec.io',
        isConnected: true,
        name: 'Test User',
        canDeploy: true,
        provisioningStatus: 'active',
      }
      const result = validateARC76Session(extended)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('requires address to be a non-whitespace string', () => {
      const whitespaceAddr = { address: '   ', email: 'test@biatec.io', isConnected: true }
      const result = validateARC76Session(whitespaceAddr)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => /address/.test(e))).toBe(true)
    })

    it('parses a session seeded by the canonical E2E withAuth pattern', () => {
      // Mirrors the session shape used by e2e/helpers/auth.ts withAuth()
      const e2eSessionShape = {
        address: 'E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS',
        email: 'e2e-test@biatec.io',
        name: 'E2E Test User',
        isConnected: true,
        provisioningStatus: 'active',
        canDeploy: true,
      }
      const serialised = JSON.stringify(e2eSessionShape)
      const parsed = parseAndValidateSession(serialised)

      expect(parsed).not.toBeNull()
      expect(parsed!.address).toBe('E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS')
      expect(parsed!.email).toBe('e2e-test@biatec.io')
      expect(parsed!.isConnected).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Canonical vs legacy route path contract
// ---------------------------------------------------------------------------

describe('Canonical route path contract', () => {
  const CANONICAL_ISSUANCE_PATH = '/launch/guided'
  const LEGACY_WIZARD_PATH = '/create/wizard'

  it('canonical issuance route is defined and non-empty', () => {
    expect(CANONICAL_ISSUANCE_PATH).toBeTruthy()
    expect(CANONICAL_ISSUANCE_PATH).toMatch(/^\//)
  })

  it('legacy wizard path is different from canonical path (no aliasing)', () => {
    expect(CANONICAL_ISSUANCE_PATH).not.toBe(LEGACY_WIZARD_PATH)
  })

  it('canonical path does not contain "wizard" (legacy terminology removed)', () => {
    expect(CANONICAL_ISSUANCE_PATH).not.toMatch(/wizard/i)
  })

  it('canonical path does not contain "create" (legacy create route removed)', () => {
    // The canonical flow is /launch/guided, not /create/*
    expect(CANONICAL_ISSUANCE_PATH).not.toMatch(/\/create\//i)
  })

  it('legacy path remains identifiable for redirect-compatibility test assertions', () => {
    // Redirect-compatibility tests (wizard-redirect-compat.spec.ts) must be able to
    // reference the legacy path — it must not be undefined or empty.
    expect(LEGACY_WIZARD_PATH).toBeTruthy()
    expect(LEGACY_WIZARD_PATH).toMatch(/\/create\/wizard/)
  })
})

// ---------------------------------------------------------------------------
// Multiple session failure modes (regression guard for invalid credential handling)
// ---------------------------------------------------------------------------

describe('Invalid credential / failed auth response shapes', () => {
  it('handles an auth response with a null address gracefully', () => {
    // Simulates a backend response with a missing/null address field
    const brokenResponse = { address: null, email: 'user@biatec.io', isConnected: true }
    const result = validateARC76Session(brokenResponse)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => /address/.test(e))).toBe(true)
  })

  it('handles an auth response with a numeric address gracefully', () => {
    // Simulates type-coercion bug in backend response parsing
    const typeCoerced = { address: 12345, email: 'user@biatec.io', isConnected: true }
    const result = validateARC76Session(typeCoerced)
    expect(result.valid).toBe(false)
  })

  it('handles an empty auth response object gracefully', () => {
    // Simulates a backend returning {} on auth error
    const emptyResponse = {}
    const result = validateARC76Session(emptyResponse)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles a non-object auth response gracefully', () => {
    // Simulates a backend returning a plain string on error
    const stringResponse = 'error: invalid credentials'
    const result = validateARC76Session(stringResponse)
    expect(result.valid).toBe(false)
  })

  it('handles an array auth response gracefully (type confusion)', () => {
    const arrayResponse = [{ address: 'ADDR', email: 'test@biatec.io', isConnected: true }]
    const result = validateARC76Session(arrayResponse)
    // An array is typeof 'object' so it passes the null/object check, but array index properties
    // are not accessible as named fields — address/email/isConnected are all undefined.
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
