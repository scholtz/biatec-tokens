/**
 * Cockpit Analytics Utility Tests
 *
 * Tests for payload sanitization, event trigger conditions, and event dispatch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizeAnalyticsPayload,
  buildAnalyticsEvent,
  shouldFireEvent,
  dispatchCockpitEvent,
} from '../cockpitAnalytics'
import type { CockpitAnalyticsEvent } from '../../types/lifecycleCockpit'

// ─── sanitizeAnalyticsPayload ─────────────────────────────────────────────────

describe('sanitizeAnalyticsPayload', () => {
  it('redacts password field', () => {
    const result = sanitizeAnalyticsPayload({ password: 'secret123' })
    expect(result.password).toBe('[REDACTED]')
  })

  it('redacts privateKey field', () => {
    const result = sanitizeAnalyticsPayload({ privateKey: 'abc123' })
    expect(result.privateKey).toBe('[REDACTED]')
  })

  it('redacts mnemonic field', () => {
    const result = sanitizeAnalyticsPayload({ mnemonic: 'word1 word2' })
    expect(result.mnemonic).toBe('[REDACTED]')
  })

  it('redacts accessToken field', () => {
    const result = sanitizeAnalyticsPayload({ accessToken: 'jwt.payload.sig' })
    expect(result.accessToken).toBe('[REDACTED]')
  })

  it('redacts apiKey field', () => {
    const result = sanitizeAnalyticsPayload({ apiKey: 'key-123' })
    expect(result.apiKey).toBe('[REDACTED]')
  })

  it('does not redact safe fields', () => {
    const result = sanitizeAnalyticsPayload({ actionId: 'rec-kyc', role: 'compliance' })
    expect(result.actionId).toBe('rec-kyc')
    expect(result.role).toBe('compliance')
  })

  it('recursively redacts nested sensitive fields', () => {
    const result = sanitizeAnalyticsPayload({
      user: { password: 'secret', name: 'Alice' },
    })
    expect((result.user as Record<string, unknown>).password).toBe('[REDACTED]')
    expect((result.user as Record<string, unknown>).name).toBe('Alice')
  })

  it('does not mutate the original payload', () => {
    const original = { password: 'secret', actionId: 'test' }
    sanitizeAnalyticsPayload(original)
    expect(original.password).toBe('secret')
  })

  it('handles empty payload', () => {
    expect(sanitizeAnalyticsPayload({})).toEqual({})
  })

  it('preserves non-sensitive fields in mixed payload', () => {
    const result = sanitizeAnalyticsPayload({
      actionId: 'rec-kyc',
      token: 'should-be-redacted',
      timestamp: '2024-01-01',
    })
    expect(result.actionId).toBe('rec-kyc')
    expect(result.token).toBe('[REDACTED]')
    expect(result.timestamp).toBe('2024-01-01')
  })
})

// ─── buildAnalyticsEvent ──────────────────────────────────────────────────────

describe('buildAnalyticsEvent', () => {
  it('creates event with correct eventType and userId', () => {
    const event = buildAnalyticsEvent('page_view', 'user-123')
    expect(event.eventType).toBe('page_view')
    expect(event.userId).toBe('user-123')
  })

  it('sets timestamp to a Date', () => {
    const event = buildAnalyticsEvent('page_view', 'user-123')
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('sets metadata to undefined when not provided', () => {
    const event = buildAnalyticsEvent('page_view', 'user-123')
    expect(event.metadata).toBeUndefined()
  })

  it('sanitizes metadata when provided', () => {
    const event = buildAnalyticsEvent('action_selected', 'user-123', {
      actionId: 'rec-kyc',
      password: 'should-be-redacted',
    })
    expect(event.metadata?.actionId).toBe('rec-kyc')
    expect(event.metadata?.password).toBe('[REDACTED]')
  })
})

// ─── shouldFireEvent ──────────────────────────────────────────────────────────

describe('shouldFireEvent', () => {
  function makeEvent(
    eventType: CockpitAnalyticsEvent['eventType'],
    metadata?: Record<string, unknown>,
  ): CockpitAnalyticsEvent {
    return { eventType, timestamp: new Date(), userId: 'u1', metadata }
  }

  it('fires page_view unconditionally', () => {
    expect(shouldFireEvent(makeEvent('page_view'))).toBe(true)
  })

  it('fires widget_expanded unconditionally', () => {
    expect(shouldFireEvent(makeEvent('widget_expanded'))).toBe(true)
  })

  it('fires export_initiated unconditionally', () => {
    expect(shouldFireEvent(makeEvent('export_initiated'))).toBe(true)
  })

  it('fires action_selected when actionId is present', () => {
    expect(shouldFireEvent(makeEvent('action_selected', { actionId: 'rec-kyc' }))).toBe(true)
  })

  it('suppresses action_selected when actionId is absent', () => {
    expect(shouldFireEvent(makeEvent('action_selected'))).toBe(false)
  })

  it('suppresses action_selected when actionId is empty string', () => {
    expect(shouldFireEvent(makeEvent('action_selected', { actionId: '' }))).toBe(false)
  })

  it('fires action_completed when actionId is present', () => {
    expect(shouldFireEvent(makeEvent('action_completed', { actionId: 'rec-kyc' }))).toBe(true)
  })

  it('suppresses action_completed when actionId is absent', () => {
    expect(shouldFireEvent(makeEvent('action_completed'))).toBe(false)
  })

  it('fires evidence_viewed when evidenceId is present', () => {
    expect(shouldFireEvent(makeEvent('evidence_viewed', { evidenceId: 'ev-1' }))).toBe(true)
  })

  it('suppresses evidence_viewed when evidenceId is absent', () => {
    expect(shouldFireEvent(makeEvent('evidence_viewed'))).toBe(false)
  })

  it('suppresses evidence_viewed when evidenceId is empty string', () => {
    expect(shouldFireEvent(makeEvent('evidence_viewed', { evidenceId: '' }))).toBe(false)
  })
})

// ─── dispatchCockpitEvent ─────────────────────────────────────────────────────

describe('dispatchCockpitEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  it('returns event for page_view', () => {
    const event = dispatchCockpitEvent('page_view', 'user-1')
    expect(event).not.toBeNull()
    expect(event!.eventType).toBe('page_view')
  })

  it('calls console.log for dispatched event', () => {
    dispatchCockpitEvent('page_view', 'user-1')
    expect(console.log).toHaveBeenCalled()
  })

  it('returns null when event should not fire', () => {
    const result = dispatchCockpitEvent('action_selected', 'user-1')
    // No actionId in metadata → should not fire
    expect(result).toBeNull()
  })

  it('returns event with sanitized payload', () => {
    const event = dispatchCockpitEvent('action_selected', 'user-1', {
      actionId: 'rec-kyc',
      password: 'exposed',
    })
    expect(event).not.toBeNull()
    expect(event!.metadata?.password).toBe('[REDACTED]')
    expect(event!.metadata?.actionId).toBe('rec-kyc')
  })

  it('does not call console.log when event is suppressed', () => {
    dispatchCockpitEvent('action_selected', 'user-1') // no actionId
    expect(console.log).not.toHaveBeenCalled()
  })
})
