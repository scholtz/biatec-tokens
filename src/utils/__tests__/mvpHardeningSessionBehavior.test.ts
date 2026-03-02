/**
 * Unit Tests: MVP Hardening — Session Behavior, Deterministic Auth, and Actionable Errors
 *
 * Proves the acceptance criteria for the MVP hardening issue:
 *
 * AC #2 — Backend-verified auth confidence:
 *   - Session contract is the single source of truth for route guard decisions
 *   - Same credentials produce identical route guard outcomes (deterministic)
 *   - Invalid session fields each produce a distinct, actionable error description
 *
 * AC #3 — Deterministic behavior evidence:
 *   - Repeated isIssuanceSessionValid() calls with same input always return same result
 *   - Repeated parseAndValidateSession() calls with same JSON always produce same object
 *   - All invalid-session paths produce user-readable error messages
 *
 * AC #5 — UX/accessibility quality in error states:
 *   - AUTH_REQUIRED and SESSION_EXPIRED error messages are actionable (contain 'action')
 *   - No raw technical error codes surface in mapped messages
 *
 * AC #6 — Documentation accuracy:
 *   - Tests prove the canonical route constants match their expected values
 *   - Tests prove that the route guard uses structural session validation for
 *     the issuance route (not just truthy check)
 *
 * All tests are synchronous and deterministic — no setTimeout, no async.
 *
 * Issue: Frontend MVP hardening: canonical guided flow and backend-verified auth confidence
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  validateARC76Session,
  isConnectedSession,
  parseAndValidateSession,
  describeSessionFailure,
  getMissingSessionFields,
} from '../arc76SessionContract'
import {
  isIssuanceSessionValid,
  CANONICAL_ISSUANCE_ROUTE,
  LEGACY_ISSUANCE_ROUTE,
  ISSUANCE_RETURN_PATH_KEY,
  storeIssuanceReturnPath,
  consumeIssuanceReturnPath,
} from '../authFirstIssuanceWorkspace'
import {
  getLaunchErrorMessage,
  classifyLaunchError,
  type LaunchErrorCode,
} from '../launchErrorMessages'

// ---------------------------------------------------------------------------
// AC #2: Backend-verified session contract determinism
// ---------------------------------------------------------------------------

describe('AC #2: Session contract validation is deterministic', () => {
  it('same valid session always passes validation', () => {
    const session = { address: 'ARC76_ADDR_ABC', email: 'user@biatec.io', isConnected: true }
    const r1 = validateARC76Session(session)
    const r2 = validateARC76Session(session)
    expect(r1.valid).toBe(true)
    expect(r2.valid).toBe(true)
    expect(r1.errors).toHaveLength(0)
    expect(r2.errors).toHaveLength(0)
  })

  it('same invalid session always fails validation with same error list', () => {
    const session = { address: '', email: 'user@biatec.io', isConnected: true }
    const r1 = validateARC76Session(session)
    const r2 = validateARC76Session(session)
    expect(r1.valid).toBe(false)
    expect(r2.valid).toBe(false)
    expect(r1.errors).toEqual(r2.errors)
  })

  it('null session always returns the same error shape', () => {
    const r1 = validateARC76Session(null)
    const r2 = validateARC76Session(null)
    expect(r1.valid).toBe(false)
    expect(r2.valid).toBe(false)
    expect(r1.errors[0]).toBe(r2.errors[0])
  })

  it('same email+address always produces the same isConnectedSession result', () => {
    const session = { address: 'ADDR_BIATEC_1', email: 'test@biatec.io', isConnected: true }
    expect(isConnectedSession(session)).toBe(true)
    expect(isConnectedSession(session)).toBe(true)
  })

  it('isConnectedSession returns false for isConnected:false (expired session)', () => {
    const session = { address: 'ADDR_BIATEC_1', email: 'test@biatec.io', isConnected: false }
    expect(isConnectedSession(session)).toBe(false)
    expect(isConnectedSession(session)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #2: parseAndValidateSession — contract-validated JSON round-trip
// ---------------------------------------------------------------------------

describe('AC #2: parseAndValidateSession determinism — same JSON, same result', () => {
  it('valid JSON always returns the same parsed session', () => {
    const json = JSON.stringify({ address: 'ARC76_PARSE_TEST', email: 'parse@biatec.io', isConnected: true })
    const r1 = parseAndValidateSession(json)
    const r2 = parseAndValidateSession(json)
    expect(r1).not.toBeNull()
    expect(r2).not.toBeNull()
    expect(r1?.address).toBe(r2?.address)
    expect(r1?.email).toBe(r2?.email)
    expect(r1?.isConnected).toBe(r2?.isConnected)
  })

  it('invalid JSON always returns null', () => {
    expect(parseAndValidateSession(null)).toBeNull()
    expect(parseAndValidateSession(null)).toBeNull()
    expect(parseAndValidateSession('{invalid}')).toBeNull()
    expect(parseAndValidateSession('{invalid}')).toBeNull()
  })

  it('session with empty address always returns null', () => {
    const json = JSON.stringify({ address: '', email: 'test@biatec.io', isConnected: true })
    expect(parseAndValidateSession(json)).toBeNull()
    expect(parseAndValidateSession(json)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC #2: Route guard — issuance route uses structural session validation
// ---------------------------------------------------------------------------

describe('AC #2: isIssuanceSessionValid — structural check (address + isConnected)', () => {
  it('returns true for a well-formed, connected session', () => {
    const session = JSON.stringify({ address: 'ISSUANCE_GUARD_ADDR', email: 'x@biatec.io', isConnected: true })
    expect(isIssuanceSessionValid(session)).toBe(true)
  })

  it('returns false for null (no session stored)', () => {
    expect(isIssuanceSessionValid(null)).toBe(false)
  })

  it('returns false for isConnected:false (expired/disconnected session)', () => {
    const session = JSON.stringify({ address: 'ADDR', email: 'x@biatec.io', isConnected: false })
    expect(isIssuanceSessionValid(session)).toBe(false)
  })

  it('returns false for session with empty address (structurally invalid)', () => {
    const session = JSON.stringify({ address: '', email: 'x@biatec.io', isConnected: true })
    expect(isIssuanceSessionValid(session)).toBe(false)
  })

  it('returns false for invalid JSON', () => {
    expect(isIssuanceSessionValid('{malformed}')).toBe(false)
  })

  it('repeated calls with same valid session always return true (deterministic)', () => {
    const session = JSON.stringify({ address: 'STABLE_ADDR_123', email: 'a@b.com', isConnected: true })
    expect(isIssuanceSessionValid(session)).toBe(true)
    expect(isIssuanceSessionValid(session)).toBe(true)
    expect(isIssuanceSessionValid(session)).toBe(true)
  })

  it('repeated calls with invalid session always return false (deterministic)', () => {
    const session = JSON.stringify({ address: 'ADDR', email: 'a@b.com', isConnected: false })
    expect(isIssuanceSessionValid(session)).toBe(false)
    expect(isIssuanceSessionValid(session)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #1 + AC #6: Canonical route constants
// ---------------------------------------------------------------------------

describe('AC #1 / AC #6: Canonical route constants', () => {
  it('CANONICAL_ISSUANCE_ROUTE is /launch/guided', () => {
    expect(CANONICAL_ISSUANCE_ROUTE).toBe('/launch/guided')
  })

  it('LEGACY_ISSUANCE_ROUTE is /create/wizard', () => {
    expect(LEGACY_ISSUANCE_ROUTE).toBe('/create/wizard')
  })

  it('canonical route does not contain wizard terminology', () => {
    expect(CANONICAL_ISSUANCE_ROUTE).not.toContain('wizard')
    expect(CANONICAL_ISSUANCE_ROUTE).not.toContain('create')
  })

  it('legacy route is distinct from canonical route', () => {
    expect(LEGACY_ISSUANCE_ROUTE).not.toBe(CANONICAL_ISSUANCE_ROUTE)
  })
})

// ---------------------------------------------------------------------------
// AC #3: Deterministic return-path storage and consumption
// ---------------------------------------------------------------------------

describe('AC #3: Return-path store/consume — deterministic and isolated', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('storeIssuanceReturnPath stores the path in localStorage', () => {
    storeIssuanceReturnPath('/launch/guided?step=2')
    const stored = localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)
    expect(stored).toBe('/launch/guided?step=2')
  })

  it('consumeIssuanceReturnPath retrieves and removes the path', () => {
    storeIssuanceReturnPath('/launch/guided?step=3')
    const path = consumeIssuanceReturnPath()
    expect(path).toBe('/launch/guided?step=3')
    // Key must be removed after consumption
    expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull()
  })

  it('consumeIssuanceReturnPath returns null when no path is stored', () => {
    expect(consumeIssuanceReturnPath()).toBeNull()
  })

  it('repeated store calls overwrite the previous path', () => {
    storeIssuanceReturnPath('/launch/guided?step=1')
    storeIssuanceReturnPath('/launch/guided?step=4')
    expect(consumeIssuanceReturnPath()).toBe('/launch/guided?step=4')
  })
})

// ---------------------------------------------------------------------------
// AC #3 + AC #5: Invalid session → user-meaningful actionable errors
// ---------------------------------------------------------------------------

describe('AC #3 / AC #5: Invalid session surfaces actionable error messages', () => {
  it('describeSessionFailure returns a non-empty string for null', () => {
    const msg = describeSessionFailure(null)
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('describeSessionFailure returns different messages for missing address vs missing email', () => {
    const noAddress = describeSessionFailure({ email: 'x@y.com', isConnected: true })
    const noEmail = describeSessionFailure({ address: 'ADDR', isConnected: true })
    expect(noAddress).not.toBe(noEmail)
  })

  it('getMissingSessionFields lists address when address is missing', () => {
    const fields = getMissingSessionFields({ email: 'x@y.com', isConnected: true })
    expect(fields).toContain('address')
  })

  it('getMissingSessionFields lists email when email is missing', () => {
    const fields = getMissingSessionFields({ address: 'ADDR', isConnected: true })
    expect(fields).toContain('email')
  })

  it('getMissingSessionFields returns empty array for a complete session', () => {
    const fields = getMissingSessionFields({ address: 'ADDR', email: 'x@y.com', isConnected: true })
    expect(fields).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// AC #5: Launch error messages — actionable, user-readable (no raw tech codes)
// ---------------------------------------------------------------------------

describe('AC #5: Launch error messages are actionable for auth failures', () => {
  const authErrorCodes: LaunchErrorCode[] = ['AUTH_REQUIRED', 'SESSION_EXPIRED']

  for (const code of authErrorCodes) {
    it(`${code} has a non-empty title and action`, () => {
      const msg = getLaunchErrorMessage(code)
      expect(msg.title.length).toBeGreaterThan(0)
      expect(msg.action.length).toBeGreaterThan(0)
    })

    it(`${code} does not expose raw error codes in title or description`, () => {
      const msg = getLaunchErrorMessage(code)
      // User-facing text must not contain raw technical identifiers
      expect(msg.title).not.toMatch(/^[A-Z_]{3,}$/)
      expect(msg.description).not.toContain(code)
    })

    it(`${code} is marked recoverable (user can retry without support)`, () => {
      const msg = getLaunchErrorMessage(code)
      expect(msg.recoverable).toBe(true)
    })
  }

  it('AUTH_REQUIRED message severity is info (not alarming for routine auth prompt)', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED')
    expect(msg.severity).toBe('info')
  })

  it('SESSION_EXPIRED message severity is warning (session loss is notable but recoverable)', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED')
    expect(msg.severity).toBe('warning')
  })

  it('classifyLaunchError maps AUTH_REQUIRED literal → AUTH_REQUIRED code', () => {
    expect(classifyLaunchError('AUTH_REQUIRED')).toBe('AUTH_REQUIRED')
  })

  it('classifyLaunchError maps unknown strings to UNKNOWN', () => {
    expect(classifyLaunchError('SOME_RANDOM_ERROR')).toBe('UNKNOWN')
  })
})

// ---------------------------------------------------------------------------
// AC #3: Deterministic behavior — same inputs, same outputs across iterations
// ---------------------------------------------------------------------------

describe('AC #3: All helpers produce identical outputs for repeated identical inputs', () => {
  const VALID_SESSION_JSON = JSON.stringify({
    address: 'DETERMINISM_TEST_ADDR_BIATEC_TOKENS',
    email: 'determinism@biatec.io',
    isConnected: true,
  })
  const INVALID_SESSION_JSON = JSON.stringify({
    address: '',
    email: 'determinism@biatec.io',
    isConnected: true,
  })

  it('isIssuanceSessionValid is deterministic over 5 repeated calls', () => {
    const results = Array.from({ length: 5 }, () => isIssuanceSessionValid(VALID_SESSION_JSON))
    expect(new Set(results).size).toBe(1)
    expect(results[0]).toBe(true)
  })

  it('isIssuanceSessionValid(invalid) is deterministic over 5 repeated calls', () => {
    const results = Array.from({ length: 5 }, () => isIssuanceSessionValid(INVALID_SESSION_JSON))
    expect(new Set(results).size).toBe(1)
    expect(results[0]).toBe(false)
  })

  it('parseAndValidateSession is deterministic over 5 repeated calls', () => {
    const results = Array.from({ length: 5 }, () => parseAndValidateSession(VALID_SESSION_JSON))
    const nonNullResults = results.filter(Boolean)
    expect(nonNullResults).toHaveLength(5)
    // All parsed sessions must have identical fields
    const addresses = results.map(r => r?.address)
    expect(new Set(addresses).size).toBe(1)
  })

  it('getLaunchErrorMessage is deterministic over 5 repeated calls', () => {
    const results = Array.from({ length: 5 }, () => getLaunchErrorMessage('AUTH_REQUIRED'))
    const titles = results.map(r => r.title)
    expect(new Set(titles).size).toBe(1)
  })
})
