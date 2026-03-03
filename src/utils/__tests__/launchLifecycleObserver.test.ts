/**
 * Unit tests for launchLifecycleObserver.ts
 *
 * Covers:
 * - Session management (start, get, reset)
 * - Observer registration and deregistration
 * - Event emission to all observers
 * - Observer isolation (exceptions in one do not affect others)
 * - Payload builders return correct shape
 * - Session staleness detection
 *
 * Business value: Observable lifecycle is the foundation for operator
 * diagnostics and product conversion analytics. These tests enforce that
 * every critical state transition is trackable and observable.
 *
 * Issue: Vision Milestone — Conversion-Optimized Token Launch Journey
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  startLifecycleSession,
  getCurrentSessionId,
  registerLifecycleObserver,
  removeLifecycleObserver,
  observerCount,
  resetLifecycleObserver,
  emitLifecycleEvent,
  buildStepEnteredMeta,
  buildValidationFailedMeta,
  buildSubmissionFailedMeta,
  buildSessionStaleMeta,
  buildRetryAttemptedMeta,
  checkSessionStaleness,
  DEFAULT_STALE_THRESHOLD_MS,
  type LaunchLifecycleEvent,
} from '../launchLifecycleObserver'

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  resetLifecycleObserver()
})

afterEach(() => {
  resetLifecycleObserver()
})

// ─── Session management ───────────────────────────────────────────────────────

describe('startLifecycleSession', () => {
  it('returns a non-empty session ID string', () => {
    const id = startLifecycleSession()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('accepts an explicit session ID', () => {
    const id = startLifecycleSession('my-session-123')
    expect(id).toBe('my-session-123')
  })

  it('generates a unique ID each call when not specified', () => {
    const id1 = startLifecycleSession()
    resetLifecycleObserver()
    const id2 = startLifecycleSession()
    expect(id1).not.toBe(id2)
  })

  it('updates the current session ID', () => {
    startLifecycleSession('sess-abc')
    expect(getCurrentSessionId()).toBe('sess-abc')
  })
})

describe('getCurrentSessionId', () => {
  it('returns null before any session is started', () => {
    expect(getCurrentSessionId()).toBeNull()
  })

  it('returns the ID after startLifecycleSession', () => {
    startLifecycleSession('sess-xyz')
    expect(getCurrentSessionId()).toBe('sess-xyz')
  })

  it('returns null after resetLifecycleObserver', () => {
    startLifecycleSession('sess-xyz')
    resetLifecycleObserver()
    expect(getCurrentSessionId()).toBeNull()
  })
})

// ─── Observer registry ────────────────────────────────────────────────────────

describe('registerLifecycleObserver', () => {
  it('increases observer count by 1', () => {
    expect(observerCount()).toBe(0)
    registerLifecycleObserver(() => {})
    expect(observerCount()).toBe(1)
  })

  it('is idempotent — registering same function twice counts as 1', () => {
    const fn = vi.fn()
    registerLifecycleObserver(fn)
    registerLifecycleObserver(fn)
    expect(observerCount()).toBe(1)
  })

  it('supports multiple distinct observers', () => {
    registerLifecycleObserver(() => {})
    registerLifecycleObserver(() => {})
    expect(observerCount()).toBe(2)
  })
})

describe('removeLifecycleObserver', () => {
  it('removes a registered observer', () => {
    const fn = vi.fn()
    registerLifecycleObserver(fn)
    removeLifecycleObserver(fn)
    expect(observerCount()).toBe(0)
  })

  it('is safe to call with an unregistered function', () => {
    expect(() => removeLifecycleObserver(() => {})).not.toThrow()
  })
})

describe('resetLifecycleObserver', () => {
  it('clears all observers', () => {
    registerLifecycleObserver(() => {})
    registerLifecycleObserver(() => {})
    resetLifecycleObserver()
    expect(observerCount()).toBe(0)
  })

  it('resets the session ID to null', () => {
    startLifecycleSession('s1')
    resetLifecycleObserver()
    expect(getCurrentSessionId()).toBeNull()
  })
})

// ─── Event emission ───────────────────────────────────────────────────────────

describe('emitLifecycleEvent', () => {
  it('returns an event with the correct type', () => {
    const ev = emitLifecycleEvent('session_started')
    expect(ev.type).toBe('session_started')
  })

  it('includes timestamp as a positive number', () => {
    const ev = emitLifecycleEvent('step_entered')
    expect(ev.timestamp).toBeGreaterThan(0)
  })

  it('includes a correlationId when not provided', () => {
    const ev = emitLifecycleEvent('draft_saved')
    expect(ev.correlationId).toBeTruthy()
  })

  it('uses provided correlationId', () => {
    const ev = emitLifecycleEvent('validation_failed', { correlationId: 'corr-999' })
    expect(ev.correlationId).toBe('corr-999')
  })

  it('sets sessionId to no_session when no session active', () => {
    const ev = emitLifecycleEvent('session_started')
    expect(ev.sessionId).toBe('no_session')
  })

  it('sets sessionId from active session', () => {
    startLifecycleSession('my-session')
    const ev = emitLifecycleEvent('step_entered')
    expect(ev.sessionId).toBe('my-session')
  })

  it('forwards draftId and stepId', () => {
    const ev = emitLifecycleEvent('step_validated', { draftId: 'd1', stepId: 'org_profile' })
    expect(ev.draftId).toBe('d1')
    expect(ev.stepId).toBe('org_profile')
  })

  it('calls all registered observers', () => {
    const obs1 = vi.fn()
    const obs2 = vi.fn()
    registerLifecycleObserver(obs1)
    registerLifecycleObserver(obs2)
    emitLifecycleEvent('submission_started')
    expect(obs1).toHaveBeenCalledTimes(1)
    expect(obs2).toHaveBeenCalledTimes(1)
  })

  it('passes the event object to each observer', () => {
    const received: LaunchLifecycleEvent[] = []
    registerLifecycleObserver(ev => received.push(ev))
    emitLifecycleEvent('submission_succeeded', { draftId: 'draft-42' })
    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('submission_succeeded')
    expect(received[0].draftId).toBe('draft-42')
  })

  it('does not call removed observers', () => {
    const fn = vi.fn()
    registerLifecycleObserver(fn)
    removeLifecycleObserver(fn)
    emitLifecycleEvent('session_abandoned')
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not propagate exceptions from one observer to others', () => {
    const throwing = vi.fn(() => { throw new Error('observer crash') })
    const safe = vi.fn()
    registerLifecycleObserver(throwing)
    registerLifecycleObserver(safe)
    expect(() => emitLifecycleEvent('retry_attempted')).not.toThrow()
    expect(safe).toHaveBeenCalledTimes(1)
  })

  it('stores metadata on the event', () => {
    const ev = emitLifecycleEvent('preflight_failed', { metadata: { failedChecks: 2 } })
    expect(ev.metadata?.failedChecks).toBe(2)
  })

  it('supports all lifecycle event types without throwing', () => {
    const types = [
      'session_started', 'step_entered', 'step_validated', 'validation_failed',
      'draft_saved', 'draft_restored', 'preflight_passed', 'preflight_failed',
      'submission_started', 'submission_succeeded', 'submission_failed',
      'retry_attempted', 'idempotency_blocked', 'session_stale', 'session_abandoned',
    ] as const

    for (const type of types) {
      expect(() => emitLifecycleEvent(type)).not.toThrow()
    }
  })
})

// ─── Payload builders ─────────────────────────────────────────────────────────

describe('buildStepEnteredMeta', () => {
  it('calculates progressPercent = 0 for step 0 of 6', () => {
    const meta = buildStepEnteredMeta(0, 6, false)
    expect(meta.progressPercent).toBe(0)
  })

  it('calculates progressPercent = 50 for step 3 of 6', () => {
    const meta = buildStepEnteredMeta(3, 6, false)
    expect(meta.progressPercent).toBe(50)
  })

  it('calculates progressPercent = 100 for step 6 of 6', () => {
    const meta = buildStepEnteredMeta(6, 6, false)
    expect(meta.progressPercent).toBe(100)
  })

  it('handles zero totalSteps without division by zero', () => {
    const meta = buildStepEnteredMeta(0, 0, false)
    expect(meta.progressPercent).toBe(0)
  })

  it('includes isReturn flag', () => {
    expect(buildStepEnteredMeta(1, 5, true).isReturn).toBe(true)
    expect(buildStepEnteredMeta(1, 5, false).isReturn).toBe(false)
  })
})

describe('buildValidationFailedMeta', () => {
  it('includes errorCount equal to fieldIds length', () => {
    const meta = buildValidationFailedMeta(['name', 'email'], 'VALIDATION_FAILED')
    expect(meta.errorCount).toBe(2)
  })

  it('includes fieldIds array', () => {
    const meta = buildValidationFailedMeta(['org_name'], 'VALIDATION_FAILED')
    expect(meta.fieldIds).toEqual(['org_name'])
  })

  it('includes errorCode', () => {
    const meta = buildValidationFailedMeta([], 'COMPLIANCE_INCOMPLETE')
    expect(meta.errorCode).toBe('COMPLIANCE_INCOMPLETE')
  })

  it('handles empty fieldIds', () => {
    const meta = buildValidationFailedMeta([], 'UNKNOWN')
    expect(meta.errorCount).toBe(0)
    expect(meta.fieldIds).toEqual([])
  })
})

describe('buildSubmissionFailedMeta', () => {
  it('includes all required fields', () => {
    const meta = buildSubmissionFailedMeta('SUBMISSION_FAILED', true, 1)
    expect(meta.errorCode).toBe('SUBMISSION_FAILED')
    expect(meta.isRetryable).toBe(true)
    expect(meta.attemptNumber).toBe(1)
  })

  it('sets isRetryable=false for non-retryable errors', () => {
    const meta = buildSubmissionFailedMeta('VALIDATION_FAILED', false, 1)
    expect(meta.isRetryable).toBe(false)
  })
})

describe('buildSessionStaleMeta', () => {
  it('calculates staleByMs correctly', () => {
    const meta = buildSessionStaleMeta(35 * 60 * 1000, 30 * 60 * 1000)
    expect(meta.staleByMs).toBe(5 * 60 * 1000)
  })

  it('staleByMs is 0 when not stale', () => {
    const meta = buildSessionStaleMeta(10 * 60 * 1000, 30 * 60 * 1000)
    expect(meta.staleByMs).toBe(0)
  })

  it('includes ageMs and thresholdMs', () => {
    const meta = buildSessionStaleMeta(1000, 2000)
    expect(meta.ageMs).toBe(1000)
    expect(meta.thresholdMs).toBe(2000)
  })
})

describe('buildRetryAttemptedMeta', () => {
  it('calculates remainingAttempts correctly', () => {
    const meta = buildRetryAttemptedMeta(2, 3, 1000, 'network_timeout')
    expect(meta.remainingAttempts).toBe(1)
  })

  it('includes all required fields', () => {
    const meta = buildRetryAttemptedMeta(1, 3, 500, 'connection_reset')
    expect(meta.attemptNumber).toBe(1)
    expect(meta.maxAttempts).toBe(3)
    expect(meta.delayMs).toBe(500)
    expect(meta.reason).toBe('connection_reset')
  })
})

// ─── Session staleness detection ──────────────────────────────────────────────

describe('checkSessionStaleness', () => {
  it('returns isStale=false when session is fresh', () => {
    const now = Date.now()
    const result = checkSessionStaleness(now - 5 * 60 * 1000, now)
    expect(result.isStale).toBe(false)
  })

  it('returns isStale=true when session exceeds threshold', () => {
    const now = Date.now()
    const result = checkSessionStaleness(now - 35 * 60 * 1000, now)
    expect(result.isStale).toBe(true)
  })

  it('returns isStale=true at exactly the threshold', () => {
    const now = Date.now()
    const result = checkSessionStaleness(now - DEFAULT_STALE_THRESHOLD_MS, now)
    expect(result.isStale).toBe(true)
  })

  it('includes ageMs and thresholdMs in the result', () => {
    const now = Date.now()
    const started = now - 10 * 60 * 1000
    const result = checkSessionStaleness(started, now, 20 * 60 * 1000)
    expect(result.ageMs).toBeGreaterThan(0)
    expect(result.thresholdMs).toBe(20 * 60 * 1000)
  })

  it('uses custom threshold parameter', () => {
    const now = Date.now()
    const result = checkSessionStaleness(now - 5 * 60 * 1000, now, 3 * 60 * 1000)
    expect(result.isStale).toBe(true)
  })

  it('never returns negative ageMs', () => {
    const future = Date.now() + 60000
    const result = checkSessionStaleness(future)
    expect(result.ageMs).toBe(0)
  })

  it('DEFAULT_STALE_THRESHOLD_MS is 30 minutes', () => {
    expect(DEFAULT_STALE_THRESHOLD_MS).toBe(30 * 60 * 1000)
  })
})
