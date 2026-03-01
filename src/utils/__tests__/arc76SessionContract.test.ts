/**
 * Unit Tests: ARC76 Session Contract Utility
 *
 * Validates the contract validation functions used by:
 *   - The router auth guard (issuance route check)
 *   - E2E test auth helpers (session bootstrap validation)
 *   - Frontend auth store (session parse/validate on init)
 *
 * AC coverage:
 *   AC #2  Backend auth realism: session contract is validated before use
 *   AC #5  Traceability: contract failures produce clear descriptions
 *   AC #6  Vision alignment: no wallet jargon, email/password contract only
 *
 * All tests are synchronous and deterministic (no async, no timeouts).
 *
 * Related:
 *   src/utils/arc76SessionContract.ts
 *   src/utils/authFirstIssuanceWorkspace.ts
 *   e2e/helpers/auth.ts
 */

import { describe, it, expect } from 'vitest'
import {
  validateARC76Session,
  isConnectedSession,
  parseAndValidateSession,
  describeSessionFailure,
  getMissingSessionFields,
  type ARC76SessionContract,
  type SessionValidationResult,
} from '../arc76SessionContract'

// ---------------------------------------------------------------------------
// validateARC76Session
// ---------------------------------------------------------------------------

describe('validateARC76Session', () => {
  describe('valid sessions', () => {
    it('returns valid for minimal well-formed session', () => {
      const session: ARC76SessionContract = {
        address: 'ARC76_TEST_ADDR',
        email: 'test@example.com',
        isConnected: true,
      }
      const result: SessionValidationResult = validateARC76Session(session)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns valid when isConnected is false (disconnected but structurally valid)', () => {
      const session = { address: 'ADDR', email: 'x@y.com', isConnected: false }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns valid when extra fields are present', () => {
      const session = {
        address: 'ADDR',
        email: 'x@y.com',
        isConnected: true,
        name: 'User Name',
        canDeploy: true,
        provisioningStatus: 'active',
      }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(true)
    })
  })

  describe('null and undefined', () => {
    it('returns invalid for null', () => {
      const result = validateARC76Session(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/non-null object/)
    })

    it('returns invalid for undefined', () => {
      const result = validateARC76Session(undefined)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/non-null object/)
    })

    it('returns invalid for a string', () => {
      const result = validateARC76Session('{"address":"A"}')
      expect(result.valid).toBe(false)
    })

    it('returns invalid for a number', () => {
      const result = validateARC76Session(42)
      expect(result.valid).toBe(false)
    })
  })

  describe('address field', () => {
    it('returns invalid when address is missing', () => {
      const session = { email: 'x@y.com', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('address'))).toBe(true)
    })

    it('returns invalid when address is empty string', () => {
      const session = { address: '', email: 'x@y.com', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('address'))).toBe(true)
    })

    it('returns invalid when address is whitespace', () => {
      const session = { address: '   ', email: 'x@y.com', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })

    it('returns invalid when address is null', () => {
      const session = { address: null, email: 'x@y.com', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })

    it('returns invalid when address is a number', () => {
      const session = { address: 12345, email: 'x@y.com', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })
  })

  describe('email field', () => {
    it('returns invalid when email is missing', () => {
      const session = { address: 'ADDR', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('email'))).toBe(true)
    })

    it('returns invalid when email is empty string', () => {
      const session = { address: 'ADDR', email: '', isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })

    it('returns invalid when email is null', () => {
      const session = { address: 'ADDR', email: null, isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })
  })

  describe('isConnected field', () => {
    it('returns invalid when isConnected is missing', () => {
      const session = { address: 'ADDR', email: 'x@y.com' }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('isConnected'))).toBe(true)
    })

    it('returns invalid when isConnected is null', () => {
      const session = { address: 'ADDR', email: 'x@y.com', isConnected: null }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })

    it('returns invalid when isConnected is a string "true"', () => {
      const session = { address: 'ADDR', email: 'x@y.com', isConnected: 'true' }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })

    it('returns invalid when isConnected is 1 (number)', () => {
      const session = { address: 'ADDR', email: 'x@y.com', isConnected: 1 }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
    })
  })

  describe('multiple field failures', () => {
    it('reports all failing fields when all three are missing', () => {
      const result = validateARC76Session({})
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })

    it('reports two errors when address and email are missing', () => {
      const session = { isConnected: true }
      const result = validateARC76Session(session)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })
})

// ---------------------------------------------------------------------------
// isConnectedSession
// ---------------------------------------------------------------------------

describe('isConnectedSession', () => {
  it('returns true for valid connected session', () => {
    expect(isConnectedSession({ address: 'A', email: 'a@b.com', isConnected: true })).toBe(true)
  })

  it('returns false when isConnected is false', () => {
    expect(isConnectedSession({ address: 'A', email: 'a@b.com', isConnected: false })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isConnectedSession(null)).toBe(false)
  })

  it('returns false for invalid session (missing address)', () => {
    expect(isConnectedSession({ email: 'a@b.com', isConnected: true })).toBe(false)
  })

  it('returns false for session with missing email', () => {
    expect(isConnectedSession({ address: 'A', isConnected: true })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseAndValidateSession
// ---------------------------------------------------------------------------

describe('parseAndValidateSession', () => {
  it('returns parsed session for valid JSON', () => {
    const raw = JSON.stringify({ address: 'ADDR', email: 'x@y.com', isConnected: true })
    const result = parseAndValidateSession(raw)
    expect(result).not.toBeNull()
    expect(result?.address).toBe('ADDR')
    expect(result?.email).toBe('x@y.com')
    expect(result?.isConnected).toBe(true)
  })

  it('returns null for null input', () => {
    expect(parseAndValidateSession(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseAndValidateSession('')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseAndValidateSession('not-json')).toBeNull()
  })

  it('returns null for JSON with invalid contract (missing address)', () => {
    const raw = JSON.stringify({ email: 'x@y.com', isConnected: true })
    expect(parseAndValidateSession(raw)).toBeNull()
  })

  it('returns null for JSON with isConnected as string', () => {
    const raw = JSON.stringify({ address: 'A', email: 'x@y.com', isConnected: 'true' })
    expect(parseAndValidateSession(raw)).toBeNull()
  })

  it('returns null for JSON array', () => {
    expect(parseAndValidateSession('[1,2,3]')).toBeNull()
  })

  it('returns null for JSON null', () => {
    expect(parseAndValidateSession('null')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// describeSessionFailure
// ---------------------------------------------------------------------------

describe('describeSessionFailure', () => {
  it('describes null as unauthenticated', () => {
    const msg = describeSessionFailure(null)
    expect(msg).toMatch(/null|undefined|not authenticated/i)
  })

  it('describes undefined as unauthenticated', () => {
    const msg = describeSessionFailure(undefined)
    expect(msg).toMatch(/null|undefined|not authenticated/i)
  })

  it('describes disconnected session', () => {
    const msg = describeSessionFailure({ address: 'A', email: 'a@b.com', isConnected: false })
    expect(msg).toMatch(/false|expired|disconnected/i)
  })

  it('describes valid connected session as valid', () => {
    const msg = describeSessionFailure({ address: 'A', email: 'a@b.com', isConnected: true })
    expect(msg).toMatch(/valid/i)
  })

  it('describes missing address', () => {
    const msg = describeSessionFailure({ email: 'a@b.com', isConnected: true })
    expect(msg).toMatch(/address|contract/i)
  })
})

// ---------------------------------------------------------------------------
// getMissingSessionFields
// ---------------------------------------------------------------------------

describe('getMissingSessionFields', () => {
  it('returns empty array for valid session', () => {
    const session = { address: 'A', email: 'a@b.com', isConnected: true }
    expect(getMissingSessionFields(session)).toHaveLength(0)
  })

  it('returns all three fields for null', () => {
    const missing = getMissingSessionFields(null)
    expect(missing).toContain('address')
    expect(missing).toContain('email')
    expect(missing).toContain('isConnected')
    expect(missing).toHaveLength(3)
  })

  it('returns address for session with empty address', () => {
    const session = { address: '', email: 'a@b.com', isConnected: true }
    expect(getMissingSessionFields(session)).toContain('address')
  })

  it('returns isConnected for session with string isConnected', () => {
    const session = { address: 'A', email: 'a@b.com', isConnected: 'yes' }
    expect(getMissingSessionFields(session)).toContain('isConnected')
  })

  it('returns multiple fields when multiple are invalid', () => {
    const session = { address: '', isConnected: true }
    const missing = getMissingSessionFields(session)
    expect(missing).toContain('address')
    expect(missing).toContain('email')
    expect(missing).not.toContain('isConnected')
  })
})

// ---------------------------------------------------------------------------
// Integration: E2E session bootstrap shapes pass contract validation
// ---------------------------------------------------------------------------

describe('E2E session bootstrap shapes meet contract', () => {
  const e2eSessionShapes = [
    {
      label: 'DEFAULT_TEST_USER shape',
      session: {
        address: 'E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS',
        email: 'e2e-test@biatec.io',
        name: 'E2E Test User',
        isConnected: true,
        provisioningStatus: 'active',
        canDeploy: true,
      },
    },
    {
      label: 'confidence-hardening test session',
      session: {
        address: 'CONFIDENCE_HARDENING_TEST_ADDRESS',
        email: 'confidence-hardening@biatec.io',
        isConnected: true,
      },
    },
    {
      label: 'issuance workspace test session',
      session: {
        address: 'ISSUANCE_WORKSPACE_TEST_ADDR',
        email: 'issuance-test@biatec.io',
        isConnected: true,
      },
    },
    {
      label: 'ARC76 validation test session',
      session: {
        address: 'ARC76_TEST_ADDRESS_12345',
        email: 'arc76test@example.com',
        isConnected: true,
      },
    },
    {
      label: 'auth-first-token-creation test session',
      session: {
        address: 'TEST_ADDRESS_AUTH_FIRST',
        email: 'test@example.com',
        isConnected: true,
      },
    },
    // Sessions used in harden-auth-guided-launch.spec.ts (AC #1)
    {
      label: 'harden-auth-guided-launch: custom hardening session',
      session: {
        address: 'CUSTOM_ARC76_TEST_ADDR_HARDENING',
        email: 'custom-hardening@biatec.io',
        isConnected: true,
        name: 'Hardening Test User',
      },
    },
    {
      label: 'harden-auth-guided-launch: ARC76 derived identity session',
      session: {
        address: 'ARC76_DERIVED_IDENTITY_ADDR_BIATEC_HARDENING',
        email: 'identity-check@biatec.io',
        isConnected: true,
      },
    },
    {
      label: 'harden-auth-guided-launch: persistent identity session',
      session: {
        address: 'ARC76_PERSISTENT_SESSION_TEST',
        email: 'arc76-persistent-identity@biatec.io',
        isConnected: true,
      },
    },
  ]

  for (const { label, session } of e2eSessionShapes) {
    it(`${label} passes ARC76 contract validation`, () => {
      const result = validateARC76Session(session)
      expect(result.valid, `${label}: ${result.errors.join(', ')}`).toBe(true)
    })

    it(`${label} passes isConnectedSession check`, () => {
      expect(isConnectedSession(session)).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// withAuth contract enforcement (fail-fast validation for E2E session bootstrap)
// ---------------------------------------------------------------------------

describe('withAuth fail-fast contract enforcement (session shapes that must be rejected)', () => {
  // These tests verify the same logic used by withAuth() in e2e/helpers/auth.ts.
  // validateARC76Session() accepts `unknown` so we can pass intentionally invalid
  // shapes without TypeScript compile errors — the function must catch them at runtime.

  it('session missing address fails contract', () => {
    // Invalid: address field is absent — withAuth() would throw before seeding localStorage
    const result = validateARC76Session({ email: 'test@test.com', isConnected: true } as unknown)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('address'))).toBe(true)
  })

  it('session missing email fails contract', () => {
    // Invalid: email field is absent
    const result = validateARC76Session({ address: 'ADDR', isConnected: true } as unknown)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('email'))).toBe(true)
  })

  it('session with string isConnected fails contract', () => {
    // Invalid: isConnected must be a boolean, not a string
    const result = validateARC76Session({ address: 'ADDR', email: 'x@y.com', isConnected: 'true' } as unknown)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('isConnected'))).toBe(true)
  })

  it('session with empty address fails contract', () => {
    // Invalid: address must be a non-empty string
    const result = validateARC76Session({ address: '', email: 'x@y.com', isConnected: true } as unknown)
    expect(result.valid).toBe(false)
  })

  it('describeSessionFailure provides actionable error for empty address', () => {
    const msg = describeSessionFailure({ address: '', email: 'x@y.com', isConnected: true } as unknown)
    // Error message should reference the contract violation clearly
    expect(msg).toMatch(/address|contract/i)
  })

  it('getMissingSessionFields identifies missing fields for withAuth input validation', () => {
    // This mirrors what withAuth() would check before seeding localStorage
    const session = { email: 'x@y.com' } as unknown // missing address and isConnected
    const missing = getMissingSessionFields(session)
    expect(missing).toContain('address')
    expect(missing).toContain('isConnected')
    expect(missing).not.toContain('email')
  })
})
