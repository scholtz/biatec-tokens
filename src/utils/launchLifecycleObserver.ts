/**
 * Launch Lifecycle Observer
 *
 * Provides structured, observable event streaming for every critical state
 * transition in the guided token launch flow. Multiple observers can subscribe
 * to the stream (analytics, structured logging, UI feedback, metrics panels).
 *
 * Design goals:
 * - Each transition has a stable event type, a correlation ID, and a timestamp
 * - Pure derivation: same inputs → same structured event (no side effects in builders)
 * - Observer registry: register/unregister handlers safely without memory leaks
 * - Singleton session context: session ID is stable across the lifecycle
 * - No wallet/blockchain jargon in event names or payload keys
 *
 * Issue: Vision Milestone — Conversion-Optimized Token Launch Journey with
 *   Observable Lifecycle and Recovery Guarantees
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type LaunchLifecycleEventType =
  | 'session_started'       // User enters the launch flow
  | 'step_entered'          // User navigates to a numbered step
  | 'step_validated'        // A step passes its validation rules
  | 'validation_failed'     // A step fails validation (with field details)
  | 'draft_saved'           // Draft state persisted successfully
  | 'draft_restored'        // Draft loaded from persistent storage
  | 'preflight_passed'      // Pre-submission preflight checks passed
  | 'preflight_failed'      // Pre-submission preflight checks failed
  | 'submission_started'    // User initiates the final submission
  | 'submission_succeeded'  // Backend confirms successful token issuance
  | 'submission_failed'     // Backend returns error or connection fails
  | 'retry_attempted'       // A failed operation is being retried
  | 'idempotency_blocked'   // Duplicate submission attempt detected and blocked
  | 'session_stale'         // Session age exceeds the staleness threshold
  | 'session_abandoned'     // User leaves the flow without completing

// ---------------------------------------------------------------------------
// Event structure
// ---------------------------------------------------------------------------

export interface LaunchLifecycleEvent {
  /** Stable event type identifier */
  type: LaunchLifecycleEventType
  /** Stable session identifier for the entire launch flow */
  sessionId: string
  /** Draft ID if available (undefined for pre-draft events) */
  draftId?: string
  /** Step identifier for step-scoped events */
  stepId?: string
  /** Unix timestamp (ms) when this event was recorded */
  timestamp: number
  /** Correlation ID — same value across a single user action span */
  correlationId: string
  /** Additional structured metadata for this event type */
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Observer type
// ---------------------------------------------------------------------------

export type LifecycleObserverFn = (event: LaunchLifecycleEvent) => void

// ---------------------------------------------------------------------------
// Internal registry (module-level singleton)
// ---------------------------------------------------------------------------

const _observers = new Set<LifecycleObserverFn>()
let _sessionId: string | null = null

// ---------------------------------------------------------------------------
// Public API: session management
// ---------------------------------------------------------------------------

/**
 * Initialise (or reset) the lifecycle session.
 * Returns the new session ID.
 *
 * Session IDs use Math.random() intentionally: they are for analytics and
 * debug tracing only, not for cryptographic purposes. The timestamp prefix
 * ensures ordering; the random suffix avoids collisions in the same
 * millisecond within a single session context.
 */
export function startLifecycleSession(sessionId?: string): string {
  _sessionId = sessionId ?? `launch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return _sessionId
}

/**
 * Return the current session ID, or null if no session is active.
 */
export function getCurrentSessionId(): string | null {
  return _sessionId
}

// ---------------------------------------------------------------------------
// Public API: observer registry
// ---------------------------------------------------------------------------

/**
 * Register an observer function to be called on every lifecycle event.
 * Safe to call multiple times with the same function (idempotent).
 */
export function registerLifecycleObserver(fn: LifecycleObserverFn): void {
  _observers.add(fn)
}

/**
 * Remove a previously registered observer.
 */
export function removeLifecycleObserver(fn: LifecycleObserverFn): void {
  _observers.delete(fn)
}

/**
 * Return the number of currently registered observers.
 */
export function observerCount(): number {
  return _observers.size
}

/**
 * Remove all registered observers and reset the session.
 * Intended for testing teardown only.
 */
export function resetLifecycleObserver(): void {
  _observers.clear()
  _sessionId = null
}

// ---------------------------------------------------------------------------
// Public API: event emission
// ---------------------------------------------------------------------------

/**
 * Emit a lifecycle event to all registered observers.
 *
 * @param type  - The event type
 * @param opts  - Event fields. correlationId defaults to a new ID per call.
 */
export function emitLifecycleEvent(
  type: LaunchLifecycleEventType,
  opts: {
    draftId?: string
    stepId?: string
    correlationId?: string
    metadata?: Record<string, unknown>
  } = {},
): LaunchLifecycleEvent {
  const event: LaunchLifecycleEvent = {
    type,
    sessionId: _sessionId ?? 'no_session',
    draftId: opts.draftId,
    stepId: opts.stepId,
    timestamp: Date.now(),
    // Correlation IDs use Math.random() intentionally: they are for analytics
    // correlation and debug tracing only — not for cryptographic purposes.
    // The combination of timestamp + random suffix provides sufficient uniqueness
    // for session-scoped event correlation in a single-tab context.
    correlationId: opts.correlationId ?? `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    metadata: opts.metadata,
  }

  for (const observer of _observers) {
    try {
      observer(event)
    } catch {
      // Observer exceptions are intentionally swallowed to prevent one
      // misbehaving observer from crashing the emit loop. In a production
      // deployment, wrap observers with structured error logging at the
      // call site (e.g., registerLifecycleObserver(withErrorLogging(myFn))).
    }
  }

  return event
}

// ---------------------------------------------------------------------------
// Payload builders (pure helpers — same inputs → same shape)
// ---------------------------------------------------------------------------

/**
 * Build metadata for a step_entered event.
 */
export function buildStepEnteredMeta(
  stepIndex: number,
  totalSteps: number,
  isReturn: boolean,
): Record<string, unknown> {
  return {
    stepIndex,
    totalSteps,
    progressPercent: totalSteps > 0 ? Math.round((stepIndex / totalSteps) * 100) : 0,
    isReturn,
  }
}

/**
 * Build metadata for a validation_failed event.
 */
export function buildValidationFailedMeta(
  fieldIds: string[],
  errorCode: string,
): Record<string, unknown> {
  return {
    fieldIds,
    errorCount: fieldIds.length,
    errorCode,
  }
}

/**
 * Build metadata for a submission_failed event.
 */
export function buildSubmissionFailedMeta(
  errorCode: string,
  isRetryable: boolean,
  attemptNumber: number,
): Record<string, unknown> {
  return {
    errorCode,
    isRetryable,
    attemptNumber,
  }
}

/**
 * Build metadata for a session_stale event.
 */
export function buildSessionStaleMeta(
  ageMs: number,
  thresholdMs: number,
): Record<string, unknown> {
  return {
    ageMs,
    thresholdMs,
    staleByMs: Math.max(0, ageMs - thresholdMs),
  }
}

/**
 * Build metadata for a retry_attempted event.
 */
export function buildRetryAttemptedMeta(
  attemptNumber: number,
  maxAttempts: number,
  delayMs: number,
  reason: string,
): Record<string, unknown> {
  return {
    attemptNumber,
    maxAttempts,
    delayMs,
    reason,
    remainingAttempts: maxAttempts - attemptNumber,
  }
}

// ---------------------------------------------------------------------------
// Session staleness detection
// ---------------------------------------------------------------------------

/** Default session staleness threshold: 30 minutes */
export const DEFAULT_STALE_THRESHOLD_MS = 30 * 60 * 1000

/**
 * Check whether a session started at `startedAtMs` is stale relative to
 * the given threshold. Returns an object with the staleness decision and
 * the age so callers can emit an appropriate lifecycle event.
 */
export function checkSessionStaleness(
  startedAtMs: number,
  nowMs: number = Date.now(),
  thresholdMs: number = DEFAULT_STALE_THRESHOLD_MS,
): { isStale: boolean; ageMs: number; thresholdMs: number } {
  const ageMs = Math.max(0, nowMs - startedAtMs)
  return {
    isStale: ageMs >= thresholdMs,
    ageMs,
    thresholdMs,
  }
}
