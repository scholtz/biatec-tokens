/**
 * Launch Network Resilience
 *
 * Provides controlled retry orchestration for transient failures during the
 * guided token launch flow. Implements exponential backoff with jitter,
 * explicit degraded-state detection, and structured metadata for lifecycle
 * event emission.
 *
 * Design goals:
 * - Safe retry: only idempotent operations should be retried
 * - Exponential backoff: prevents thundering-herd on shared backend
 * - Max attempts: guarantees termination and "give up" state
 * - Pure result types: callers get structured outcomes, not thrown exceptions
 * - No wallet/blockchain jargon
 *
 * Issue: Vision Milestone — Conversion-Optimized Token Launch Journey with
 *   Observable Lifecycle and Recovery Guarantees
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Maximum number of attempts (including the first attempt) */
  maxAttempts: number
  /** Base delay in ms for the first retry */
  baseDelayMs: number
  /** Multiplier applied to delay on each retry */
  backoffFactor: number
  /** Maximum delay cap in ms */
  maxDelayMs: number
  /** Whether to add random jitter (±25%) to prevent thundering herd */
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
  jitter: true,
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type RetryOutcome<T> =
  | { status: 'success'; value: T; attempts: number; totalDurationMs: number }
  | { status: 'failed'; error: Error; attempts: number; totalDurationMs: number; isRetryable: boolean }
  | { status: 'blocked'; reason: string }

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Errors that are safe to retry (transient, not business-logic failures).
 * Any error NOT matching these patterns is treated as non-retryable.
 */
const RETRYABLE_ERROR_PATTERNS = [
  /network/i,
  /timeout/i,
  /fetch/i,
  /connection/i,
  /unavailable/i,
  /503/,
  /504/,
  /429/,
  /ECONNRESET/,
  /ETIMEDOUT/,
]

/**
 * Classify whether an error is safe to retry.
 *
 * @param error - The caught error
 * @returns true if the error is a transient condition that may resolve on retry
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message ?? ''
  return RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

// ---------------------------------------------------------------------------
// Backoff calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the delay in ms for a given retry attempt (zero-indexed).
 *
 * @param attemptIndex - 0-indexed retry number (0 = first retry after initial failure)
 * @param config - Retry configuration
 * @returns Delay in ms, capped at config.maxDelayMs
 */
export function calculateBackoffDelay(
  attemptIndex: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const base = config.baseDelayMs * Math.pow(config.backoffFactor, attemptIndex)
  const capped = Math.min(base, config.maxDelayMs)
  if (!config.jitter) {
    return capped
  }
  // Add ±25% jitter
  const jitterRange = capped * 0.25
  const jitter = (Math.random() * 2 - 1) * jitterRange
  return Math.max(0, Math.round(capped + jitter))
}

// ---------------------------------------------------------------------------
// Core retry orchestration
// ---------------------------------------------------------------------------

/**
 * Execute an async operation with controlled retries and structured outcome.
 *
 * Only retries if the error is classified as transient (`isRetryableError`).
 * Non-retryable errors (validation failures, auth errors, etc.) are returned
 * immediately without retrying.
 *
 * @param operation   - Async function to execute
 * @param config      - Retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @param onRetry     - Optional callback called before each retry attempt
 * @returns           - Structured RetryOutcome
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attemptNumber: number, delayMs: number, error: Error) => void,
): Promise<RetryOutcome<T>> {
  const startTime = Date.now()
  // Defensive initialisation: lastError is always set before it is read
  // because every loop iteration either returns or assigns a caught error.
  let lastError: Error = new Error('withRetry: no attempts were made (maxAttempts must be ≥ 1)')

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const value = await operation()
      return {
        status: 'success',
        value,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      const retryable = isRetryableError(lastError)

      // Non-retryable: return immediately, no delay
      if (!retryable) {
        return {
          status: 'failed',
          error: lastError,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
          isRetryable: false,
        }
      }

      // Final attempt — no more retries
      if (attempt === config.maxAttempts) {
        return {
          status: 'failed',
          error: lastError,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
          isRetryable: true,
        }
      }

      // Compute delay and notify caller before waiting
      const delayMs = calculateBackoffDelay(attempt - 1, config)
      onRetry?.(attempt, delayMs, lastError)

      await sleep(delayMs)
    }
  }

  // Should not reach here, but satisfy TypeScript
  return {
    status: 'failed',
    error: lastError,
    attempts: config.maxAttempts,
    totalDurationMs: Date.now() - startTime,
    isRetryable: false,
  }
}

// ---------------------------------------------------------------------------
// Degraded state detection
// ---------------------------------------------------------------------------

export interface DegradedStateResult {
  /** Whether the service appears to be in a degraded state */
  isDegraded: boolean
  /** Reason for degradation (for logging and UI) */
  reason: string
  /** Whether the user should be offered a manual retry option */
  canRetry: boolean
  /** Human-readable message for the user */
  userMessage: string
}

/**
 * Determine whether a sequence of consecutive failures indicates a degraded
 * service state, and produce a structured result for UI and logging.
 *
 * @param consecutiveFailures  - Number of consecutive failures observed
 * @param lastError            - Most recent error
 * @param degradedThreshold    - How many consecutive failures trigger degraded state (default: 2)
 */
export function detectDegradedState(
  consecutiveFailures: number,
  lastError: Error | null,
  degradedThreshold = 2,
): DegradedStateResult {
  if (consecutiveFailures < degradedThreshold) {
    return {
      isDegraded: false,
      reason: '',
      canRetry: true,
      userMessage: '',
    }
  }

  const isNetwork = lastError ? isRetryableError(lastError) : false

  if (isNetwork) {
    return {
      isDegraded: true,
      reason: 'repeated_network_failure',
      canRetry: true,
      userMessage:
        'We are having trouble reaching the service. Your progress is saved — try again in a moment.',
    }
  }

  return {
    isDegraded: true,
    reason: 'repeated_service_error',
    canRetry: false,
    userMessage:
      'A service issue is preventing completion. Please try again later or contact support if the problem persists.',
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
