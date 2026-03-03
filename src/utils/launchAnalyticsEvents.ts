/**
 * Launch Analytics Events
 *
 * Typed event names and structured payload builders for the guided token launch flow.
 * Each event carries a stable name and a structured payload so downstream analytics
 * consumers can rely on a consistent schema.
 *
 * Design goals:
 * - Compile-time safety: event names as readonly string literals
 * - Pure functions: no side effects, same inputs → same outputs
 * - No wallet/blockchain jargon in event names or payload keys
 *
 * Usage:
 *   import { LAUNCH_ANALYTICS_EVENTS, buildStepEnteredPayload } from './launchAnalyticsEvents'
 *   analyticsService.trackEvent(LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED, buildStepEnteredPayload(...))
 *
 * Issue: Vision milestone — Frontend conversion-first guided launch and lifecycle UX
 */

// ---------------------------------------------------------------------------
// Typed event name constants
// ---------------------------------------------------------------------------

export const LAUNCH_ANALYTICS_EVENTS = {
  STEP_ENTERED: 'launch:step_entered',
  STEP_COMPLETED: 'launch:step_completed',
  VALIDATION_FAILED: 'launch:validation_failed',
  DRAFT_SAVED: 'launch:draft_saved',
  LAUNCH_SUCCEEDED: 'launch:launch_succeeded',
  LAUNCH_CANCELLED: 'launch:launch_cancelled',
  LAUNCH_FAILED: 'launch:launch_failed',
  PREFLIGHT_CHECKED: 'launch:preflight_checked',
  TRANSACTION_PREVIEW_OPENED: 'launch:transaction_preview_opened',
  RISK_ACKNOWLEDGED: 'launch:risk_acknowledged',
} as const

export type LaunchAnalyticsEventName =
  (typeof LAUNCH_ANALYTICS_EVENTS)[keyof typeof LAUNCH_ANALYTICS_EVENTS]

// ---------------------------------------------------------------------------
// Payload builders
// ---------------------------------------------------------------------------

/**
 * Payload for when a user enters a guided launch step.
 */
export function buildStepEnteredPayload(
  stepId: string,
  stepIndex: number,
  totalSteps: number,
): Record<string, unknown> {
  return {
    stepId,
    stepIndex,
    totalSteps,
    progressPercent: totalSteps > 0 ? Math.round((stepIndex / totalSteps) * 100) : 0,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when a user successfully completes a guided launch step.
 */
export function buildStepCompletedPayload(
  stepId: string,
  durationMs: number,
): Record<string, unknown> {
  return {
    stepId,
    durationMs,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when validation fails on a step.
 */
export function buildValidationFailedPayload(
  stepId: string,
  fieldIds: string[],
  errorCount: number,
): Record<string, unknown> {
  return {
    stepId,
    fieldIds,
    errorCount,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when a draft is saved.
 */
export function buildDraftSavedPayload(stepId: string): Record<string, unknown> {
  return {
    stepId,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when a token launch submission succeeds.
 */
export function buildLaunchSucceededPayload(
  submissionId: string,
  template: string,
  network: string,
): Record<string, unknown> {
  return {
    submissionId,
    template,
    network,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when a user cancels the guided launch flow.
 */
export function buildLaunchCancelledPayload(
  stepId: string,
  reason?: string,
): Record<string, unknown> {
  return {
    stepId,
    reason: reason ?? 'user_initiated',
    timestamp: Date.now(),
  }
}

/**
 * Payload for when a launch submission fails with an error.
 */
export function buildLaunchFailedPayload(
  error: string,
  stepId: string,
): Record<string, unknown> {
  return {
    error,
    stepId,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when the preflight validator is run.
 */
export function buildPreflightCheckedPayload(
  passed: boolean,
  blockerCount: number,
  warningCount: number,
): Record<string, unknown> {
  return {
    passed,
    blockerCount,
    warningCount,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when the transaction preview panel is opened.
 */
export function buildTransactionPreviewOpenedPayload(
  tokenName: string,
  tokenStandard: string,
  network: string,
): Record<string, unknown> {
  return {
    tokenName,
    tokenStandard,
    network,
    timestamp: Date.now(),
  }
}

/**
 * Payload for when the user acknowledges deployment risk.
 */
export function buildRiskAcknowledgedPayload(
  tokenName: string,
  network: string,
): Record<string, unknown> {
  return {
    tokenName,
    network,
    timestamp: Date.now(),
  }
}
