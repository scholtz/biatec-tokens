/**
 * API Contract Alignment Tests: Create-Token Frontend Expectations
 *
 * Tests validate that the frontend correctly handles API response shapes
 * for auth/session and token creation endpoints.
 *
 * These are integration-style frontend tests that verify:
 * 1. Error response classification matches expected API error patterns
 * 2. Auth expiry detection from common server error shapes
 * 3. Validation error extraction from API response bodies
 * 4. Network failure graceful handling
 *
 * Business value: Prevents user-facing "something went wrong" errors when
 * the underlying API returns structured errors that the frontend can handle
 * specifically (e.g., showing "session expired - please sign in" vs generic error).
 */

import { describe, it, expect } from 'vitest'
import { classifyLaunchError, getLaunchErrorMessage } from '../launchErrorMessages'

// ---------------------------------------------------------------------------
// Simulate common API response error shapes
// ---------------------------------------------------------------------------

interface ApiErrorResponse {
  status: number
  message: string
  code?: string
}

/**
 * Maps an HTTP API error response to a launch error code
 * using the existing classifyLaunchError utility.
 */
function classifyApiError(response: ApiErrorResponse): ReturnType<typeof classifyLaunchError> {
  // Build a synthetic Error from the API response for classification
  const errorMsg = `${response.code ?? ''} ${response.message}`.trim()
  return classifyLaunchError(new Error(errorMsg))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API Contract Alignment: Auth/Session Endpoint Errors', () => {
  it('should classify HTTP 401 Unauthorized as AUTH_REQUIRED', () => {
    const response: ApiErrorResponse = {
      status: 401,
      message: 'Unauthorized - authentication required',
    }
    const code = classifyApiError(response)
    expect(code).toBe('AUTH_REQUIRED')

    const msg = getLaunchErrorMessage(code)
    expect(msg.recoverable).toBe(true)
    expect(msg.action).toMatch(/sign in/i)
  })

  it('should classify HTTP 401 with token expired as SESSION_EXPIRED', () => {
    const response: ApiErrorResponse = {
      status: 401,
      message: 'Token expired - session has ended',
      code: 'SESSION_EXPIRED',
    }
    const code = classifyApiError(response)
    expect(code).toBe('SESSION_EXPIRED')

    const msg = getLaunchErrorMessage(code)
    expect(msg.recoverable).toBe(true)
    expect(msg.severity).toBe('warning')
  })

  it('should classify HTTP 403 unauthenticated as AUTH_REQUIRED', () => {
    const response: ApiErrorResponse = {
      status: 403,
      message: 'Access denied - user is not authenticated',
    }
    const code = classifyApiError(response)
    expect(code).toBe('AUTH_REQUIRED')
  })

  it('should classify expired session message as SESSION_EXPIRED', () => {
    const response: ApiErrorResponse = {
      status: 401,
      message: 'Session has expired, please log in again',
    }
    const code = classifyApiError(response)
    expect(code).toBe('SESSION_EXPIRED')
  })
})

describe('API Contract Alignment: Token Creation Endpoint Errors', () => {
  it('should classify validation error as VALIDATION_FAILED', () => {
    const response: ApiErrorResponse = {
      status: 422,
      message: 'Validation failed: token name is required',
    }
    const code = classifyApiError(response)
    expect(code).toBe('VALIDATION_FAILED')

    const msg = getLaunchErrorMessage(code)
    expect(msg.recoverable).toBe(true)
    expect(msg.action).toMatch(/review/i)
  })

  it('should classify invalid payload as VALIDATION_FAILED', () => {
    const response: ApiErrorResponse = {
      status: 400,
      message: 'Invalid request: missing required fields',
    }
    const code = classifyApiError(response)
    expect(code).toBe('VALIDATION_FAILED')
  })

  it('should classify compliance missing as COMPLIANCE_INCOMPLETE', () => {
    const response: ApiErrorResponse = {
      status: 400,
      message: 'Compliance checklist not completed',
    }
    const code = classifyApiError(response)
    expect(code).toBe('COMPLIANCE_INCOMPLETE')

    const msg = getLaunchErrorMessage(code)
    expect(msg.action).toMatch(/compliance/i)
  })

  it('should classify KYC check failure as COMPLIANCE_INCOMPLETE', () => {
    const response: ApiErrorResponse = {
      status: 400,
      message: 'KYC verification required before token deployment',
    }
    const code = classifyApiError(response)
    expect(code).toBe('COMPLIANCE_INCOMPLETE')
  })

  it('should classify backend service unavailability as SERVICE_UNAVAILABLE', () => {
    const response: ApiErrorResponse = {
      status: 503,
      message: 'Submission failed: deployment service unavailable',
    }
    const code = classifyApiError(response)
    expect(code).toBe('SERVICE_UNAVAILABLE')

    const msg = getLaunchErrorMessage(code)
    expect(msg.recoverable).toBe(true)
    expect(msg.action).toMatch(/try.*again|wait/i)
  })

  it('should classify rate limit as RATE_LIMITED', () => {
    const response: ApiErrorResponse = {
      status: 429,
      message: 'Too many requests - rate limit exceeded',
    }
    const code = classifyApiError(response)
    expect(code).toBe('RATE_LIMITED')

    const msg = getLaunchErrorMessage(code)
    expect(msg.severity).toBe('warning')
    expect(msg.action).toMatch(/wait/i)
  })
})

describe('API Contract Alignment: Network and Infrastructure Errors', () => {
  it('should classify network fetch failure as NETWORK_UNAVAILABLE', () => {
    const networkError = new Error('Failed to fetch - network error')
    const code = classifyLaunchError(networkError)
    expect(code).toBe('NETWORK_UNAVAILABLE')

    const msg = getLaunchErrorMessage(code)
    expect(msg.action).toMatch(/connection|try again/i)
  })

  it('should classify offline error as NETWORK_UNAVAILABLE', () => {
    const code = classifyLaunchError(new Error('You are offline'))
    expect(code).toBe('NETWORK_UNAVAILABLE')
  })

  it('should classify unexpected server error as UNKNOWN', () => {
    const response: ApiErrorResponse = {
      status: 500,
      message: 'Internal server error',
    }
    const code = classifyApiError(response)
    // "Internal server error" doesn't match any specific pattern → UNKNOWN
    expect(code).toBe('UNKNOWN')

    const msg = getLaunchErrorMessage(code)
    expect(msg.recoverable).toBe(true)
    expect(msg.action).toContain('support@biatec.io')
  })
})

describe('API Contract Alignment: Message Shape Contract', () => {
  it('every error code message should have a non-empty title', () => {
    const codes = [
      'AUTH_REQUIRED',
      'SESSION_EXPIRED',
      'VALIDATION_FAILED',
      'COMPLIANCE_INCOMPLETE',
      'NETWORK_UNAVAILABLE',
      'SAVE_FAILED',
      'STEP_LOAD_FAILED',
      'SUBMISSION_FAILED',
      'RATE_LIMITED',
      'UNKNOWN',
    ] as const

    for (const code of codes) {
      const msg = getLaunchErrorMessage(code)
      expect(msg.title, `Expected non-empty title for ${code}`).toBeTruthy()
      expect(msg.description, `Expected non-empty description for ${code}`).toBeTruthy()
      expect(msg.action, `Expected non-empty action for ${code}`).toBeTruthy()
    }
  })

  it('every error code message should have a severity and recoverable flag', () => {
    const codes = [
      'AUTH_REQUIRED',
      'SESSION_EXPIRED',
      'VALIDATION_FAILED',
      'UNKNOWN',
    ] as const

    for (const code of codes) {
      const msg = getLaunchErrorMessage(code)
      expect(['error', 'warning', 'info']).toContain(msg.severity)
      expect(typeof msg.recoverable).toBe('boolean')
    }
  })

  it('AUTH_REQUIRED should have info severity (not error - it is expected state)', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED')
    expect(msg.severity).toBe('info')
  })

  it('VALIDATION_FAILED should have error severity', () => {
    const msg = getLaunchErrorMessage('VALIDATION_FAILED')
    expect(msg.severity).toBe('error')
  })

  it('SESSION_EXPIRED should have warning severity', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED')
    expect(msg.severity).toBe('warning')
  })

  it('all messages should be non-technical (no blockchain jargon in action text)', () => {
    const technicalTerms = ['ARC76', 'ARC200', 'algosdk', 'transaction', 'blockchain', 'wallet']
    const codes = [
      'AUTH_REQUIRED',
      'SESSION_EXPIRED',
      'VALIDATION_FAILED',
      'COMPLIANCE_INCOMPLETE',
      'NETWORK_UNAVAILABLE',
      'SAVE_FAILED',
      'STEP_LOAD_FAILED',
      'SUBMISSION_FAILED',
      'RATE_LIMITED',
      'UNKNOWN',
    ] as const

    for (const code of codes) {
      const msg = getLaunchErrorMessage(code)
      for (const term of technicalTerms) {
        expect(
          msg.action.toLowerCase(),
          `Action text for ${code} should not contain '${term}'`
        ).not.toContain(term.toLowerCase())
      }
    }
  })
})
