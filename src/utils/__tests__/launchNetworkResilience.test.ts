/**
 * Unit tests for launchNetworkResilience.ts
 *
 * Covers:
 * - isRetryableError classification
 * - calculateBackoffDelay with backoff factor and caps
 * - withRetry happy path (success on first attempt)
 * - withRetry retries transient errors and succeeds
 * - withRetry exhausts retries and returns failed outcome
 * - withRetry stops immediately on non-retryable errors
 * - detectDegradedState thresholds and messages
 *
 * Business value: Resilience under transient failures prevents abandoned
 * sessions during intermittent connectivity issues, directly improving
 * completion rate for the primary launch journey.
 *
 * Issue: Vision Milestone — Conversion-Optimized Token Launch Journey
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isRetryableError,
  calculateBackoffDelay,
  withRetry,
  detectDegradedState,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '../launchNetworkResilience'

// ─── isRetryableError ─────────────────────────────────────────────────────────

describe('isRetryableError', () => {
  it('classifies network errors as retryable', () => {
    expect(isRetryableError(new Error('Network request failed'))).toBe(true)
  })

  it('classifies timeout errors as retryable', () => {
    expect(isRetryableError(new Error('Request timeout after 30s'))).toBe(true)
  })

  it('classifies fetch errors as retryable', () => {
    expect(isRetryableError(new Error('Failed to fetch'))).toBe(true)
  })

  it('classifies 503 service unavailable as retryable', () => {
    expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true)
  })

  it('classifies 504 gateway timeout as retryable', () => {
    expect(isRetryableError(new Error('504 Gateway Timeout'))).toBe(true)
  })

  it('classifies 429 rate limit as retryable', () => {
    expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true)
  })

  it('classifies ECONNRESET as retryable', () => {
    expect(isRetryableError(new Error('ECONNRESET read failed'))).toBe(true)
  })

  it('classifies ETIMEDOUT as retryable', () => {
    expect(isRetryableError(new Error('ETIMEDOUT connection dropped'))).toBe(true)
  })

  it('classifies connection errors as retryable', () => {
    expect(isRetryableError(new Error('connection refused'))).toBe(true)
  })

  it('classifies validation errors as non-retryable', () => {
    expect(isRetryableError(new Error('Validation failed: name is required'))).toBe(false)
  })

  it('classifies auth errors as non-retryable', () => {
    expect(isRetryableError(new Error('Unauthorized: invalid token'))).toBe(false)
  })

  it('classifies 400 bad request as non-retryable', () => {
    expect(isRetryableError(new Error('400 Bad Request: invalid payload'))).toBe(false)
  })

  it('classifies duplicate submission as non-retryable', () => {
    expect(isRetryableError(new Error('Duplicate submission detected'))).toBe(false)
  })

  it('classifies generic errors as non-retryable', () => {
    expect(isRetryableError(new Error('Something went wrong'))).toBe(false)
  })
})

// ─── calculateBackoffDelay ────────────────────────────────────────────────────

describe('calculateBackoffDelay', () => {
  const deterministicConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    jitter: false,
  }

  it('returns baseDelayMs for first retry (attempt 0)', () => {
    const delay = calculateBackoffDelay(0, deterministicConfig)
    expect(delay).toBe(deterministicConfig.baseDelayMs)
  })

  it('doubles delay for second retry (attempt 1) with factor=2', () => {
    const delay = calculateBackoffDelay(1, deterministicConfig)
    expect(delay).toBe(deterministicConfig.baseDelayMs * 2)
  })

  it('respects maxDelayMs cap', () => {
    const delay = calculateBackoffDelay(10, { ...deterministicConfig, maxDelayMs: 5000 })
    expect(delay).toBeLessThanOrEqual(5000)
  })

  it('adds jitter when jitter=true (result differs from base)', () => {
    // Run multiple times; jitter should cause at least some variation
    const delays = new Set<number>()
    for (let i = 0; i < 10; i++) {
      delays.add(calculateBackoffDelay(0, { ...DEFAULT_RETRY_CONFIG, jitter: true }))
    }
    // With jitter the values should not all be the same
    expect(delays.size).toBeGreaterThan(1)
  })

  it('returns 0 or positive ms (never negative)', () => {
    for (let i = 0; i < 5; i++) {
      const delay = calculateBackoffDelay(i, DEFAULT_RETRY_CONFIG)
      expect(delay).toBeGreaterThanOrEqual(0)
    }
  })
})

// ─── withRetry ────────────────────────────────────────────────────────────────

describe('withRetry', () => {
  // Use a very fast config for tests (no real delays)
  const fastConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 0,
    backoffFactor: 1,
    maxDelayMs: 0,
    jitter: false,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns success on first attempt', async () => {
    const op = vi.fn().mockResolvedValue('ok')
    const promise = withRetry(op, fastConfig)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.value).toBe('ok')
      expect(result.attempts).toBe(1)
    }
  })

  it('retries a transient error and succeeds on second attempt', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValue('ok')
    const promise = withRetry(op, fastConfig)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.attempts).toBe(2)
    }
  })

  it('exhausts retries and returns failed with isRetryable=true', async () => {
    const op = vi.fn().mockRejectedValue(new Error('timeout'))
    const promise = withRetry(op, fastConfig)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.status).toBe('failed')
    if (result.status === 'failed') {
      expect(result.isRetryable).toBe(true)
      expect(result.attempts).toBe(fastConfig.maxAttempts)
    }
  })

  it('stops immediately on non-retryable error (single attempt)', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Validation failed: name required'))
    const promise = withRetry(op, fastConfig)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.status).toBe('failed')
    if (result.status === 'failed') {
      expect(result.isRetryable).toBe(false)
      expect(result.attempts).toBe(1)
    }
    // Should not retry — only called once
    expect(op).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry callback before each retry', async () => {
    const onRetry = vi.fn()
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('done')
    const promise = withRetry(op, fastConfig, onRetry)
    await vi.runAllTimersAsync()
    await promise
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not call onRetry for non-retryable failures', async () => {
    const onRetry = vi.fn()
    const op = vi.fn().mockRejectedValue(new Error('auth failed'))
    const promise = withRetry(op, fastConfig, onRetry)
    await vi.runAllTimersAsync()
    await promise
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('includes totalDurationMs in the result', async () => {
    const op = vi.fn().mockResolvedValue('result')
    const promise = withRetry(op, fastConfig)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0)
  })

  it('success with maxAttempts=1 does not retry', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Network error'))
    const promise = withRetry(op, { ...fastConfig, maxAttempts: 1 })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.status).toBe('failed')
    expect(op).toHaveBeenCalledTimes(1)
  })
})

// ─── detectDegradedState ─────────────────────────────────────────────────────

describe('detectDegradedState', () => {
  it('returns isDegraded=false below threshold', () => {
    const result = detectDegradedState(1, null)
    expect(result.isDegraded).toBe(false)
  })

  it('returns isDegraded=true at threshold (2 consecutive failures)', () => {
    const result = detectDegradedState(2, null)
    expect(result.isDegraded).toBe(true)
  })

  it('returns isDegraded=true above threshold', () => {
    const result = detectDegradedState(5, null)
    expect(result.isDegraded).toBe(true)
  })

  it('returns canRetry=true for network-classified failures', () => {
    const result = detectDegradedState(2, new Error('Network request failed'))
    expect(result.canRetry).toBe(true)
  })

  it('returns canRetry=false for non-network failures', () => {
    const result = detectDegradedState(2, new Error('Something went wrong'))
    expect(result.canRetry).toBe(false)
  })

  it('provides a non-empty userMessage when degraded', () => {
    const result = detectDegradedState(2, new Error('Network timeout'))
    expect(result.userMessage.length).toBeGreaterThan(0)
  })

  it('provides empty userMessage when not degraded', () => {
    const result = detectDegradedState(1, null)
    expect(result.userMessage).toBe('')
  })

  it('respects custom threshold parameter', () => {
    const result3 = detectDegradedState(3, null, 5)
    expect(result3.isDegraded).toBe(false)

    const result5 = detectDegradedState(5, null, 5)
    expect(result5.isDegraded).toBe(true)
  })

  it('includes reason for degraded state', () => {
    const netResult = detectDegradedState(3, new Error('timeout'))
    expect(netResult.reason).toBe('repeated_network_failure')

    const svcResult = detectDegradedState(3, new Error('server error'))
    expect(svcResult.reason).toBe('repeated_service_error')
  })

  it('reason is empty string when not degraded', () => {
    const result = detectDegradedState(0, null)
    expect(result.reason).toBe('')
  })
})

// ─── DEFAULT_RETRY_CONFIG ─────────────────────────────────────────────────────

describe('DEFAULT_RETRY_CONFIG', () => {
  it('has maxAttempts=3', () => {
    expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3)
  })

  it('has a positive baseDelayMs', () => {
    expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBeGreaterThan(0)
  })

  it('has jitter enabled', () => {
    expect(DEFAULT_RETRY_CONFIG.jitter).toBe(true)
  })

  it('has backoffFactor greater than 1', () => {
    expect(DEFAULT_RETRY_CONFIG.backoffFactor).toBeGreaterThan(1)
  })
})
