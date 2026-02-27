/**
 * Tests for issuanceIdempotency.ts
 *
 * Validates deterministic key derivation, submission tracking, deduplication
 * logic, retry safety, and localStorage persistence helpers.
 *
 * Issue: Roadmap — production-grade auth-first issuance UX
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  deriveIdempotencyKey,
  checkIdempotency,
  recordSubmissionAttempt,
  markSubmissionSuccess,
  markSubmissionFailed,
  clearIdempotencyRecord,
  getIdempotencyRecord,
  pruneExpiredRecords,
} from '../issuanceIdempotency'

// ---------------------------------------------------------------------------
// localStorage mock (happy-dom provides it; ensure clean slate per test)
// ---------------------------------------------------------------------------

const STORE_KEY = 'biatec_issuance_idempotency_v1'

function clearStore() {
  localStorage.removeItem(STORE_KEY)
}

beforeEach(() => {
  clearStore()
})

afterEach(() => {
  clearStore()
})

// ---------------------------------------------------------------------------
// deriveIdempotencyKey
// ---------------------------------------------------------------------------

describe('deriveIdempotencyKey', () => {
  it('returns a non-empty string', () => {
    const key = deriveIdempotencyKey('draft_001', 'user@example.com')
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })

  it('always produces the same key for the same inputs (deterministic)', () => {
    const k1 = deriveIdempotencyKey('draft_001', 'user@example.com')
    const k2 = deriveIdempotencyKey('draft_001', 'user@example.com')
    expect(k1).toBe(k2)
  })

  it('produces different keys for different draftIds', () => {
    const k1 = deriveIdempotencyKey('draft_001', 'user@example.com')
    const k2 = deriveIdempotencyKey('draft_002', 'user@example.com')
    expect(k1).not.toBe(k2)
  })

  it('produces different keys for different emails', () => {
    const k1 = deriveIdempotencyKey('draft_001', 'alice@example.com')
    const k2 = deriveIdempotencyKey('draft_001', 'bob@example.com')
    expect(k1).not.toBe(k2)
  })

  it('is case-insensitive for email (normalises to lowercase)', () => {
    const k1 = deriveIdempotencyKey('draft_001', 'User@Example.COM')
    const k2 = deriveIdempotencyKey('draft_001', 'user@example.com')
    expect(k1).toBe(k2)
  })

  it('trims whitespace from inputs', () => {
    const k1 = deriveIdempotencyKey('  draft_001  ', '  user@example.com  ')
    const k2 = deriveIdempotencyKey('draft_001', 'user@example.com')
    expect(k1).toBe(k2)
  })

  it('throws when draftId is empty', () => {
    expect(() => deriveIdempotencyKey('', 'user@example.com')).toThrow()
  })

  it('throws when userEmail is empty', () => {
    expect(() => deriveIdempotencyKey('draft_001', '')).toThrow()
  })

  it('key starts with "idem_" prefix', () => {
    const key = deriveIdempotencyKey('draft_abc', 'x@y.com')
    expect(key.startsWith('idem_')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// checkIdempotency
// ---------------------------------------------------------------------------

describe('checkIdempotency', () => {
  it('returns isSafeToSubmit: true when no record exists', () => {
    const result = checkIdempotency('unknown_key')
    expect(result.isSafeToSubmit).toBe(true)
    expect(result.existingRecord).toBeUndefined()
  })

  it('returns isSafeToSubmit: true for a pending record (retry allowed)', () => {
    const key = deriveIdempotencyKey('draft_p', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_p')
    const result = checkIdempotency(key)
    expect(result.isSafeToSubmit).toBe(true)
    expect(result.existingRecord).toBeDefined()
    expect(result.existingRecord?.status).toBe('pending')
  })

  it('returns isSafeToSubmit: true for a failed record (retry allowed)', () => {
    const key = deriveIdempotencyKey('draft_f', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_f')
    markSubmissionFailed(key, 'network timeout')
    const result = checkIdempotency(key)
    expect(result.isSafeToSubmit).toBe(true)
    expect(result.existingRecord?.status).toBe('failed')
  })

  it('returns isSafeToSubmit: false for a successful record (blocks duplicate)', () => {
    const key = deriveIdempotencyKey('draft_s', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_s')
    markSubmissionSuccess(key, 'server-sub-001')
    const result = checkIdempotency(key)
    expect(result.isSafeToSubmit).toBe(false)
    expect(result.existingRecord?.status).toBe('success')
    expect(result.blockedReason).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// recordSubmissionAttempt
// ---------------------------------------------------------------------------

describe('recordSubmissionAttempt', () => {
  it('creates a new pending record', () => {
    const key = deriveIdempotencyKey('draft_r', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_r')
    const record = getIdempotencyRecord(key)
    expect(record).toBeDefined()
    expect(record?.status).toBe('pending')
    expect(record?.draftId).toBe('draft_r')
    expect(record?.attemptCount).toBe(1)
  })

  it('increments attempt count on repeated calls', () => {
    const key = deriveIdempotencyKey('draft_r2', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_r2')
    recordSubmissionAttempt(key, 'draft_r2')
    recordSubmissionAttempt(key, 'draft_r2')
    const record = getIdempotencyRecord(key)
    expect(record?.attemptCount).toBe(3)
  })

  it('preserves firstAttemptAt across retries', () => {
    const key = deriveIdempotencyKey('draft_r3', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_r3')
    const firstAt = getIdempotencyRecord(key)?.firstAttemptAt
    recordSubmissionAttempt(key, 'draft_r3')
    const still = getIdempotencyRecord(key)?.firstAttemptAt
    expect(firstAt).toBe(still)
  })
})

// ---------------------------------------------------------------------------
// markSubmissionSuccess
// ---------------------------------------------------------------------------

describe('markSubmissionSuccess', () => {
  it('updates status to success and stores serverSubmissionId', () => {
    const key = deriveIdempotencyKey('draft_ok', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_ok')
    markSubmissionSuccess(key, 'srv-123')
    const record = getIdempotencyRecord(key)
    expect(record?.status).toBe('success')
    expect(record?.serverSubmissionId).toBe('srv-123')
  })

  it('is a no-op when the record does not exist', () => {
    // Should not throw
    expect(() => markSubmissionSuccess('nonexistent', 'srv-x')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// markSubmissionFailed
// ---------------------------------------------------------------------------

describe('markSubmissionFailed', () => {
  it('updates status to failed and stores error message', () => {
    const key = deriveIdempotencyKey('draft_err', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_err')
    markSubmissionFailed(key, 'timeout occurred')
    const record = getIdempotencyRecord(key)
    expect(record?.status).toBe('failed')
    expect(record?.lastError).toBe('timeout occurred')
  })

  it('is a no-op when the record does not exist', () => {
    expect(() => markSubmissionFailed('nonexistent', 'err')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// clearIdempotencyRecord
// ---------------------------------------------------------------------------

describe('clearIdempotencyRecord', () => {
  it('removes the record so future checks allow submission', () => {
    const key = deriveIdempotencyKey('draft_clr', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_clr')
    markSubmissionSuccess(key, 'srv-clr')
    expect(checkIdempotency(key).isSafeToSubmit).toBe(false)

    clearIdempotencyRecord(key)
    expect(checkIdempotency(key).isSafeToSubmit).toBe(true)
    expect(getIdempotencyRecord(key)).toBeUndefined()
  })

  it('is a no-op when the record does not exist', () => {
    expect(() => clearIdempotencyRecord('nonexistent')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// getIdempotencyRecord
// ---------------------------------------------------------------------------

describe('getIdempotencyRecord', () => {
  it('returns undefined for unknown key', () => {
    expect(getIdempotencyRecord('unknown')).toBeUndefined()
  })

  it('returns the stored record for a known key', () => {
    const key = deriveIdempotencyKey('draft_get', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_get')
    const record = getIdempotencyRecord(key)
    expect(record).toBeDefined()
    expect(record?.key).toBe(key)
  })
})

// ---------------------------------------------------------------------------
// pruneExpiredRecords
// ---------------------------------------------------------------------------

describe('pruneExpiredRecords', () => {
  it('returns 0 when store is empty', () => {
    expect(pruneExpiredRecords()).toBe(0)
  })

  it('does not prune recent records', () => {
    const key = deriveIdempotencyKey('draft_prune_new', 'user@example.com')
    recordSubmissionAttempt(key, 'draft_prune_new')
    const removed = pruneExpiredRecords(7 * 24 * 60 * 60 * 1000)
    expect(removed).toBe(0)
    expect(getIdempotencyRecord(key)).toBeDefined()
  })

  it('prunes records older than maxAgeMs', () => {
    const key = deriveIdempotencyKey('draft_old', 'user@example.com')
    // Write a record with an ancient timestamp
    const store: Record<string, unknown> = {}
    store[key] = {
      key,
      draftId: 'draft_old',
      firstAttemptAt: new Date(0).toISOString(),
      lastAttemptAt: new Date(0).toISOString(),
      attemptCount: 1,
      status: 'failed',
    }
    localStorage.setItem('biatec_issuance_idempotency_v1', JSON.stringify(store))

    const removed = pruneExpiredRecords(1000) // 1 second max age
    expect(removed).toBe(1)
    expect(getIdempotencyRecord(key)).toBeUndefined()
  })

  it('prunes only expired records, leaves recent ones', () => {
    const oldKey = deriveIdempotencyKey('draft_old2', 'user@example.com')
    const newKey = deriveIdempotencyKey('draft_new2', 'user@example.com')

    const store: Record<string, unknown> = {}
    store[oldKey] = {
      key: oldKey,
      draftId: 'draft_old2',
      firstAttemptAt: new Date(0).toISOString(),
      lastAttemptAt: new Date(0).toISOString(),
      attemptCount: 1,
      status: 'failed',
    }
    localStorage.setItem('biatec_issuance_idempotency_v1', JSON.stringify(store))

    // Add a fresh record via the normal API
    recordSubmissionAttempt(newKey, 'draft_new2')

    const removed = pruneExpiredRecords(1000)
    expect(removed).toBe(1)
    expect(getIdempotencyRecord(oldKey)).toBeUndefined()
    expect(getIdempotencyRecord(newKey)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// End-to-end flow: duplicate prevention
// ---------------------------------------------------------------------------

describe('end-to-end: duplicate submission prevention', () => {
  it('blocks a second submission after the first succeeds', () => {
    const key = deriveIdempotencyKey('draft_e2e', 'user@example.com')

    // First submission attempt
    let check = checkIdempotency(key)
    expect(check.isSafeToSubmit).toBe(true)

    recordSubmissionAttempt(key, 'draft_e2e')
    markSubmissionSuccess(key, 'srv-e2e-001')

    // Second attempt should be blocked
    check = checkIdempotency(key)
    expect(check.isSafeToSubmit).toBe(false)
    expect(check.existingRecord?.serverSubmissionId).toBe('srv-e2e-001')
  })

  it('allows retry after failure (no blocking on failed submissions)', () => {
    const key = deriveIdempotencyKey('draft_retry', 'user@example.com')

    recordSubmissionAttempt(key, 'draft_retry')
    markSubmissionFailed(key, 'network error')

    const check = checkIdempotency(key)
    expect(check.isSafeToSubmit).toBe(true)
    expect(check.existingRecord?.attemptCount).toBe(1)

    // Retry
    recordSubmissionAttempt(key, 'draft_retry')
    markSubmissionSuccess(key, 'srv-retry-001')

    expect(checkIdempotency(key).isSafeToSubmit).toBe(false)
    expect(getIdempotencyRecord(key)?.attemptCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// LocalStorage resilience
// ---------------------------------------------------------------------------

describe('localStorage resilience', () => {
  it('returns safe defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem('biatec_issuance_idempotency_v1', '{invalid json}')
    const result = checkIdempotency('any_key')
    expect(result.isSafeToSubmit).toBe(true)
  })

  it('does not throw when localStorage is empty', () => {
    localStorage.removeItem('biatec_issuance_idempotency_v1')
    expect(() => checkIdempotency('any_key')).not.toThrow()
  })
})
