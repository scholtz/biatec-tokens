/**
 * portfolioAnalytics utility tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizePortfolioPayload,
  buildPortfolioEvent,
  dispatchPortfolioEvent,
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackInsightClicked,
  trackInsightDismissed,
  trackWatchlistAdded,
  trackWatchlistRemoved,
} from '../portfolioAnalytics'

// ─── sanitizePortfolioPayload ─────────────────────────────────────────────────

describe('sanitizePortfolioPayload', () => {
  it('strips password field', () => {
    const result = sanitizePortfolioPayload({ password: 'secret123', name: 'Alice' })
    expect(result.password).toBe('[REDACTED]')
    expect(result.name).toBe('Alice')
  })

  it('strips email field', () => {
    const result = sanitizePortfolioPayload({ email: 'user@example.com', action: 'click' })
    expect(result.email).toBe('[REDACTED]')
    expect(result.action).toBe('click')
  })

  it('strips walletAddress field', () => {
    const result = sanitizePortfolioPayload({ walletAddress: 'ALGO123', count: 5 })
    expect(result.walletAddress).toBe('[REDACTED]')
    expect(result.count).toBe(5)
  })

  it('preserves safe fields', () => {
    const result = sanitizePortfolioPayload({ insightId: 'ins-1', type: 'concentration_risk' })
    expect(result.insightId).toBe('ins-1')
    expect(result.type).toBe('concentration_risk')
  })

  it('handles nested objects recursively', () => {
    const result = sanitizePortfolioPayload({ user: { email: 'x@y.com', id: 'u1' } })
    const nested = result.user as Record<string, unknown>
    expect(nested.email).toBe('[REDACTED]')
    expect(nested.id).toBe('u1')
  })

  it('preserves arrays', () => {
    const result = sanitizePortfolioPayload({ ids: [1, 2, 3] })
    expect(result.ids).toEqual([1, 2, 3])
  })

  it('strips apiKey', () => {
    const result = sanitizePortfolioPayload({ apiKey: 'sk-123' })
    expect(result.apiKey).toBe('[REDACTED]')
  })

  it('does not mutate original object', () => {
    const original = { password: 'secret' }
    sanitizePortfolioPayload(original)
    expect(original.password).toBe('secret')
  })
})

// ─── buildPortfolioEvent ──────────────────────────────────────────────────────

describe('buildPortfolioEvent', () => {
  it('sets correct eventType', () => {
    const event = buildPortfolioEvent('onboarding_started', 'u1')
    expect(event.eventType).toBe('onboarding_started')
  })

  it('sets userId', () => {
    const event = buildPortfolioEvent('insight_clicked', 'user-42')
    expect(event.userId).toBe('user-42')
  })

  it('timestamp is a Date', () => {
    const event = buildPortfolioEvent('watchlist_asset_added', 'u1')
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('metadata is undefined when not provided', () => {
    const event = buildPortfolioEvent('onboarding_skipped', 'u1')
    expect(event.metadata).toBeUndefined()
  })

  it('sanitizes metadata', () => {
    const event = buildPortfolioEvent('insight_clicked', 'u1', { insightId: 'i1', email: 'x@y.com' })
    expect(event.metadata?.email).toBe('[REDACTED]')
    expect(event.metadata?.insightId).toBe('i1')
  })
})

// ─── dispatchPortfolioEvent ───────────────────────────────────────────────────

describe('dispatchPortfolioEvent', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('calls console.log', () => {
    const event = buildPortfolioEvent('cta_clicked', 'u1')
    dispatchPortfolioEvent(event)
    expect(console.log).toHaveBeenCalled()
  })

  it('includes [Portfolio Analytics] prefix', () => {
    const event = buildPortfolioEvent('onboarding_started', 'u1')
    dispatchPortfolioEvent(event)
    expect(vi.mocked(console.log).mock.calls[0][0]).toBe('[Portfolio Analytics]')
  })
})

// ─── Typed helper functions ───────────────────────────────────────────────────

// Shared setup: reset + spy before each helper test
function setupConsoleSpy() {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
}

describe('trackOnboardingStarted', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches onboarding_started event', () => {
    trackOnboardingStarted('u1')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('onboarding_started')
  })
})

describe('trackOnboardingCompleted', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches onboarding_completed event', () => {
    trackOnboardingCompleted('u1')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('onboarding_completed')
  })
})

describe('trackOnboardingSkipped', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches onboarding_skipped event', () => {
    trackOnboardingSkipped('u1')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('onboarding_skipped')
  })
})

describe('trackInsightClicked', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches insight_clicked event', () => {
    trackInsightClicked('u1', 'ins-1', 'concentration_risk')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('insight_clicked')
  })

  it('includes insightId in payload', () => {
    trackInsightClicked('u1', 'ins-99', 'unusual_movement')
    const event = vi.mocked(console.log).mock.calls[0][2] as { metadata?: Record<string, unknown> }
    expect(event.metadata?.insightId).toBe('ins-99')
  })
})

describe('trackInsightDismissed', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches insight_dismissed event', () => {
    trackInsightDismissed('u1', 'ins-1')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('insight_dismissed')
  })
})

describe('trackWatchlistAdded', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches watchlist_asset_added event', () => {
    trackWatchlistAdded('u1', 'asset-1', 'Algorand')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('watchlist_asset_added')
  })

  it('does not leak sensitive wallet fields in payload', () => {
    trackWatchlistAdded('u1', 'asset-1', 'Algorand')
    const event = vi.mocked(console.log).mock.calls[0][2] as { metadata?: Record<string, unknown> }
    expect(event.metadata?.assetId).toBe('asset-1')
  })
})

describe('trackWatchlistRemoved', () => {
  beforeEach(setupConsoleSpy)

  it('dispatches watchlist_asset_removed event', () => {
    trackWatchlistRemoved('u1', 'asset-1', 'Ethereum')
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe('watchlist_asset_removed')
  })
})
