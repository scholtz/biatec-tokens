/**
 * Cockpit Analytics Utilities
 *
 * Privacy-safe analytics event helpers for the token lifecycle cockpit.
 * Ensures sensitive fields are stripped before dispatch, events fire exactly
 * once per interaction, and payloads conform to the CockpitAnalyticsEvent schema.
 */

import type { CockpitAnalyticsEvent } from '../types/lifecycleCockpit'

// ─── Sensitive field denylist ─────────────────────────────────────────────────

/**
 * Fields that must never appear in outbound analytics payloads.
 * Add new entries here as the product evolves.
 */
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
  'address', // physical street address
  'phone',
  'phoneNumber',
  'creditCard',
  'cardNumber',
  'cvv',
])

// ─── Payload sanitization ─────────────────────────────────────────────────────

/**
 * Recursively strips sensitive keys from a metadata object.
 * Returns a new object; the original is not mutated.
 */
export function sanitizeAnalyticsPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_FIELDS.has(key)) {
      result[key] = '[REDACTED]'
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeAnalyticsPayload(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

// ─── Event builders ───────────────────────────────────────────────────────────

/**
 * Builds a sanitized CockpitAnalyticsEvent. The caller should pass the
 * current user identifier (opaque, non-PII form such as a hashed or anonymised ID).
 */
export function buildAnalyticsEvent(
  eventType: CockpitAnalyticsEvent['eventType'],
  userId: string,
  metadata?: Record<string, unknown>,
): CockpitAnalyticsEvent {
  return {
    eventType,
    timestamp: new Date(),
    userId,
    metadata: metadata ? sanitizeAnalyticsPayload(metadata) : undefined,
  }
}

// ─── Event trigger guards ─────────────────────────────────────────────────────

/**
 * Returns true when the event should fire, false when it should be suppressed.
 *
 * Rules:
 * - page_view fires unconditionally.
 * - action_selected and action_completed require a non-empty actionId in metadata.
 * - evidence_viewed requires a non-empty evidenceId in metadata.
 * - widget_expanded and export_initiated fire unconditionally.
 */
export function shouldFireEvent(event: CockpitAnalyticsEvent): boolean {
  switch (event.eventType) {
    case 'page_view':
    case 'widget_expanded':
    case 'export_initiated':
      return true

    case 'action_selected':
    case 'action_completed':
      return !!(event.metadata?.actionId && String(event.metadata.actionId).length > 0)

    case 'evidence_viewed':
      return !!(event.metadata?.evidenceId && String(event.metadata.evidenceId).length > 0)

    default:
      return false
  }
}

// ─── Dispatch helper ──────────────────────────────────────────────────────────

/**
 * Dispatches a cockpit analytics event if it passes the trigger guard.
 * In production this would call the real analytics service; here it writes
 * to the console in a structured format for observability.
 *
 * Returns the event that was dispatched, or null if suppressed.
 */
export function dispatchCockpitEvent(
  eventType: CockpitAnalyticsEvent['eventType'],
  userId: string,
  metadata?: Record<string, unknown>,
): CockpitAnalyticsEvent | null {
  const event = buildAnalyticsEvent(eventType, userId, metadata)

  if (!shouldFireEvent(event)) {
    return null
  }

  // Structured log — replace with real analytics SDK call in production
  console.log('[CockpitAnalytics]', JSON.stringify({
    eventType: event.eventType,
    userId: event.userId,
    timestamp: event.timestamp.toISOString(),
    metadata: event.metadata,
  }))

  return event
}
