/**
 * ARC76 Session Contract + GuidedLaunch Integration Tests
 *
 * Provides deterministic ARC76 auth contract evidence as required by the
 * product owner. Tests pure-function contract validation WITHOUT using
 * localStorage seeding shortcuts — each test exercises the validation
 * contract directly.
 *
 * Coverage:
 * - validateARC76Session: boundary + failure + success cases
 * - isConnectedSession: null, disconnected, connected
 * - parseAndValidateSession: null input, invalid JSON, invalid contract, valid
 * - describeSessionFailure: human-readable output for each state
 * - getMissingSessionFields: null, empty, partial, full object
 * - isIssuanceSessionValid: null, disconnected, connected
 * - GuidedLaunch store draft roundtrip with riskAcknowledged preservation
 * - Draft resilience: missing stepStatuses, invalid JSON, no draft
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  validateARC76Session,
  isConnectedSession,
  parseAndValidateSession,
  describeSessionFailure,
  getMissingSessionFields,
} from '../../utils/arc76SessionContract'
import { isIssuanceSessionValid } from '../../utils/authFirstIssuanceWorkspace'
import { useGuidedLaunchStore } from '../guidedLaunch'

// ── Mock launchTelemetryService ───────────────────────────────────────────────
vi.mock('../../services/launchTelemetry', () => ({
  launchTelemetryService: {
    initialize: vi.fn(),
    trackFlowStarted: vi.fn(),
    trackStepStarted: vi.fn(),
    trackStepCompleted: vi.fn(),
    trackValidationFailed: vi.fn(),
    trackDraftResumed: vi.fn(),
    trackDraftSaved: vi.fn(),
    trackLaunchSubmitted: vi.fn(),
    trackLaunchSuccess: vi.fn(),
    trackLaunchFailed: vi.fn(),
  },
}))

vi.mock('../../utils/policyGuardrails', () => ({
  runPolicyGuardrails: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
}))

vi.mock('../../utils/issuanceIdempotency', () => ({
  deriveIdempotencyKey: vi.fn().mockReturnValue('key_mock'),
  checkIdempotency: vi.fn().mockReturnValue({ isSafeToSubmit: true }),
  recordSubmissionAttempt: vi.fn(),
  markSubmissionSuccess: vi.fn(),
  markSubmissionFailed: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal valid connected session object */
const VALID_SESSION = { address: 'ADDR123', email: 'user@example.com', isConnected: true }

/** Draft storage key mirrors the store constant */
const DRAFT_KEY = 'biatec_guided_launch_draft'

const makeCompliance = (riskAcknowledged: boolean) => ({
  requiresMICA: false,
  requiresKYC: false,
  requiresAML: false,
  hasLegalReview: true,
  hasRiskAssessment: true,
  restrictedJurisdictions: [] as string[],
  whitelistRequired: false,
  riskAcknowledged,
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. validateARC76Session — boundary tests
// ─────────────────────────────────────────────────────────────────────────────

describe('validateARC76Session — boundary tests', () => {
  it('returns invalid with "session must be a non-null object" for null input', () => {
    const result = validateARC76Session(null)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('session must be a non-null object')
  })

  it('returns invalid with "session must be a non-null object" for undefined', () => {
    const result = validateARC76Session(undefined)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('session must be a non-null object')
  })

  it('returns invalid with 3 field errors for empty object {}', () => {
    const result = validateARC76Session({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('returns invalid when address is empty string', () => {
    const result = validateARC76Session({ address: '', email: 'test@x.com', isConnected: true })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('address'))).toBe(true)
  })

  it('returns invalid when address is whitespace only', () => {
    const result = validateARC76Session({ address: '   ', email: 'test@x.com', isConnected: true })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('address'))).toBe(true)
  })

  it('returns invalid when email is empty string', () => {
    const result = validateARC76Session({ address: 'ADDR', email: '', isConnected: true })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('email'))).toBe(true)
  })

  it('returns invalid when isConnected is a string "yes" (not boolean)', () => {
    const result = validateARC76Session({ address: 'ADDR', email: 'test@x.com', isConnected: 'yes' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('isConnected'))).toBe(true)
  })

  it('returns invalid when isConnected is 1 (number, not boolean)', () => {
    const result = validateARC76Session({ address: 'ADDR', email: 'test@x.com', isConnected: 1 })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('isConnected'))).toBe(true)
  })

  it('returns VALID for disconnected but structurally correct session', () => {
    const result = validateARC76Session({ address: 'ADDR', email: 'test@x.com', isConnected: false })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns VALID for connected session with all fields present', () => {
    const result = validateARC76Session(VALID_SESSION)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns non-empty errors array on failure', () => {
    const result = validateARC76Session(null)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. isConnectedSession — null / disconnected / connected
// ─────────────────────────────────────────────────────────────────────────────

describe('isConnectedSession', () => {
  it('returns false for null', () => {
    expect(isConnectedSession(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isConnectedSession(undefined)).toBe(false)
  })

  it('returns false for empty object', () => {
    expect(isConnectedSession({})).toBe(false)
  })

  it('returns false for disconnected session (isConnected: false)', () => {
    expect(isConnectedSession({ address: 'ADDR', email: 'x@x.com', isConnected: false })).toBe(false)
  })

  it('returns true for valid connected session', () => {
    expect(isConnectedSession(VALID_SESSION)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. parseAndValidateSession — JSON string inputs
// ─────────────────────────────────────────────────────────────────────────────

describe('parseAndValidateSession', () => {
  it('returns null for null input', () => {
    expect(parseAndValidateSession(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseAndValidateSession('')).toBeNull()
  })

  it('returns null for non-JSON string', () => {
    expect(parseAndValidateSession('not json')).toBeNull()
  })

  it('returns null for "null" JSON string', () => {
    expect(parseAndValidateSession('null')).toBeNull()
  })

  it('returns null for valid JSON that fails the contract (empty object)', () => {
    expect(parseAndValidateSession('{}')).toBeNull()
  })

  it('returns null for JSON with only address (missing email and isConnected)', () => {
    expect(parseAndValidateSession('{"address":"ADDR"}')).toBeNull()
  })

  it('returns the parsed object for a fully valid session JSON', () => {
    const raw = JSON.stringify(VALID_SESSION)
    const result = parseAndValidateSession(raw)
    expect(result).not.toBeNull()
    expect(result?.address).toBe('ADDR123')
    expect(result?.email).toBe('user@example.com')
    expect(result?.isConnected).toBe(true)
  })

  it('returns parsed object for a disconnected session JSON (structurally valid, isConnected=false passes contract)', () => {
    // isConnected=false is structurally valid, so parseAndValidateSession returns the object
    const raw = JSON.stringify({ address: 'A', email: 'b@b.com', isConnected: false })
    const result = parseAndValidateSession(raw)
    // Contract validation: structurally valid even when disconnected
    expect(result).not.toBeNull()
    expect(result?.isConnected).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. describeSessionFailure — human-readable descriptions
// ─────────────────────────────────────────────────────────────────────────────

describe('describeSessionFailure', () => {
  it('mentions "not authenticated" or "null" for null input', () => {
    const description = describeSessionFailure(null)
    expect(description.toLowerCase()).toMatch(/not authenticated|null|undefined/)
  })

  it('mentions "not authenticated" or "undefined" for undefined input', () => {
    const description = describeSessionFailure(undefined)
    expect(description.toLowerCase()).toMatch(/not authenticated|null|undefined/)
  })

  it('mentions "contract violated" for empty object', () => {
    const description = describeSessionFailure({})
    expect(description.toLowerCase()).toContain('contract violated')
  })

  it('mentions "expired or disconnected" for disconnected valid session', () => {
    const description = describeSessionFailure({ address: 'A', email: 'b@c.com', isConnected: false })
    expect(description.toLowerCase()).toMatch(/expired|disconnected/)
  })

  it('reports "valid and connected" for a fully connected session', () => {
    const description = describeSessionFailure(VALID_SESSION)
    expect(description.toLowerCase()).toMatch(/valid.*connected|connected.*valid/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. getMissingSessionFields
// ─────────────────────────────────────────────────────────────────────────────

describe('getMissingSessionFields', () => {
  it('returns all 3 field names for null', () => {
    const fields = getMissingSessionFields(null)
    expect(fields).toContain('address')
    expect(fields).toContain('email')
    expect(fields).toContain('isConnected')
    expect(fields).toHaveLength(3)
  })

  it('returns all 3 field names for empty object', () => {
    const fields = getMissingSessionFields({})
    expect(fields).toHaveLength(3)
  })

  it('returns address and isConnected when only email is present', () => {
    const fields = getMissingSessionFields({ email: 'a@b.com' })
    expect(fields).toContain('address')
    expect(fields).toContain('isConnected')
    expect(fields).not.toContain('email')
  })

  it('returns empty array for fully valid connected session', () => {
    const fields = getMissingSessionFields(VALID_SESSION)
    expect(fields).toHaveLength(0)
  })

  it('returns empty array for structurally valid disconnected session', () => {
    const fields = getMissingSessionFields({ address: 'A', email: 'b@c.com', isConnected: false })
    expect(fields).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. isIssuanceSessionValid — session gate (raw JSON string input)
// ─────────────────────────────────────────────────────────────────────────────

describe('isIssuanceSessionValid — session gate', () => {
  it('returns false for null (no session)', () => {
    expect(isIssuanceSessionValid(null)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isIssuanceSessionValid('')).toBe(false)
  })

  it('returns false for invalid JSON', () => {
    expect(isIssuanceSessionValid('not-json')).toBe(false)
  })

  it('returns false for disconnected session JSON', () => {
    const raw = JSON.stringify({ address: 'A', email: 'b@c.com', isConnected: false })
    expect(isIssuanceSessionValid(raw)).toBe(false)
  })

  it('returns false for JSON missing address', () => {
    const raw = JSON.stringify({ email: 'b@c.com', isConnected: true })
    expect(isIssuanceSessionValid(raw)).toBe(false)
  })

  it('returns false for JSON with empty address', () => {
    const raw = JSON.stringify({ address: '', email: 'b@c.com', isConnected: true })
    expect(isIssuanceSessionValid(raw)).toBe(false)
  })

  it('returns true for valid connected session JSON', () => {
    const raw = JSON.stringify(VALID_SESSION)
    expect(isIssuanceSessionValid(raw)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. GuidedLaunch draft persistence — riskAcknowledged roundtrip
// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — draft roundtrip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('saves and reloads draft with riskAcknowledged=true preserved', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(makeCompliance(true))
    store.saveDraft()

    const store2 = useGuidedLaunchStore()
    const loaded = store2.loadDraft()
    expect(loaded).toBe(true)
    expect(store2.currentForm.complianceReadiness?.riskAcknowledged).toBe(true)
  })

  it('saves and reloads draft with riskAcknowledged=false preserved', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(makeCompliance(false))
    store.saveDraft()

    const store2 = useGuidedLaunchStore()
    const loaded = store2.loadDraft()
    expect(loaded).toBe(true)
    expect(store2.currentForm.complianceReadiness?.riskAcknowledged).toBe(false)
  })

  it('returns false when no draft exists', () => {
    const store = useGuidedLaunchStore()
    const loaded = store.loadDraft()
    expect(loaded).toBe(false)
  })

  it('returns false and does not crash when localStorage has invalid JSON', () => {
    localStorage.setItem(DRAFT_KEY, 'this is not valid json')
    const store = useGuidedLaunchStore()
    expect(() => store.loadDraft()).not.toThrow()
    expect(store.loadDraft()).toBe(false)
  })

  it('loads draft without crashing when stepStatuses field is absent', () => {
    // Manually write a draft with missing stepStatuses
    const partial = {
      version: '1.0',
      form: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        currentStep: 0,
        completedSteps: [],
        isSubmitted: false,
      },
      // stepStatuses intentionally absent
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(partial))
    const store = useGuidedLaunchStore()
    expect(() => store.loadDraft()).not.toThrow()
    // stepStatuses should fall back to initial store value
    expect(Array.isArray(store.stepStatuses)).toBe(true)
    expect(store.stepStatuses.length).toBeGreaterThan(0)
  })

  it('clearDraft when no draft exists does not throw', () => {
    const store = useGuidedLaunchStore()
    expect(() => store.clearDraft()).not.toThrow()
  })

  it('draft roundtrip preserves all compliance fields', () => {
    const store = useGuidedLaunchStore()
    const compliance = {
      requiresMICA: true,
      requiresKYC: true,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: true,
      restrictedJurisdictions: ['US', 'CN'],
      whitelistRequired: true,
      selectedWhitelistId: 'wl-001',
      riskAcknowledged: true,
    }
    store.setComplianceReadiness(compliance)
    store.saveDraft()

    const store2 = useGuidedLaunchStore()
    store2.loadDraft()
    const loaded = store2.currentForm.complianceReadiness
    expect(loaded?.requiresMICA).toBe(true)
    expect(loaded?.requiresKYC).toBe(true)
    expect(loaded?.restrictedJurisdictions).toEqual(['US', 'CN'])
    expect(loaded?.selectedWhitelistId).toBe('wl-001')
    expect(loaded?.riskAcknowledged).toBe(true)
  })
})
