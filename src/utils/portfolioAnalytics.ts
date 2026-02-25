/**
 * Portfolio Analytics Utilities
 *
 * Privacy-safe analytics event helpers for the Portfolio Intelligence Layer.
 * Sensitive fields are stripped before dispatch; events fire with a
 * [Portfolio Analytics] prefix for easy log filtering.
 */

import type { PortfolioAnalyticsEvent, PortfolioEventType } from '../types/portfolioIntelligence'

// ─── Sensitive field denylist ─────────────────────────────────────────────────

const SENSITIVE_FIELDS = new Set([
  'password',
  'secret',
  'privateKey',
  'mnemonic',
  'seedPhrase',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'ssn',
  'taxId',
  'dob',
  'dateOfBirth',
  'fullName',
  'address',
  'phone',
  'phoneNumber',
  'creditCard',
  'cardNumber',
  'cvv',
  'email',
  'walletAddress',
])

// ─── Payload sanitization ─────────────────────────────────────────────────────

export function sanitizePortfolioPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_FIELDS.has(key)) {
      result[key] = '[REDACTED]'
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizePortfolioPayload(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

// ─── Event builder ────────────────────────────────────────────────────────────

export function buildPortfolioEvent(
  eventType: PortfolioEventType,
  userId: string,
  metadata?: Record<string, unknown>,
): PortfolioAnalyticsEvent {
  return {
    eventType,
    userId,
    timestamp: new Date(),
    metadata: metadata ? sanitizePortfolioPayload(metadata) : undefined,
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function dispatchPortfolioEvent(event: PortfolioAnalyticsEvent): void {
  console.log('[Portfolio Analytics]', event.eventType, event)
}

// ─── Typed helper functions ───────────────────────────────────────────────────

export function trackOnboardingStarted(userId: string): void {
  dispatchPortfolioEvent(buildPortfolioEvent('onboarding_started', userId))
}

export function trackOnboardingCompleted(userId: string): void {
  dispatchPortfolioEvent(buildPortfolioEvent('onboarding_completed', userId))
}

export function trackOnboardingSkipped(userId: string): void {
  dispatchPortfolioEvent(buildPortfolioEvent('onboarding_skipped', userId))
}

export function trackInsightClicked(userId: string, insightId: string, insightType: string): void {
  dispatchPortfolioEvent(
    buildPortfolioEvent('insight_clicked', userId, { insightId, insightType }),
  )
}

export function trackInsightDismissed(userId: string, insightId: string): void {
  dispatchPortfolioEvent(buildPortfolioEvent('insight_dismissed', userId, { insightId }))
}

export function trackWatchlistAdded(userId: string, assetId: string, network: string): void {
  dispatchPortfolioEvent(buildPortfolioEvent('watchlist_asset_added', userId, { assetId, network }))
}

export function trackWatchlistRemoved(userId: string, assetId: string, network: string): void {
  dispatchPortfolioEvent(
    buildPortfolioEvent('watchlist_asset_removed', userId, { assetId, network }),
  )
}
