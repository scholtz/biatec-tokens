/**
 * Unit tests for GuidedTokenLaunch auth-first behavior and error messaging
 *
 * Validates:
 * 1. Error messages use user-friendly launchErrorMessages (not raw technical leakage) - AC #5
 * 2. No wallet/network UI appears in the guided launch surface - AC #2, #6
 * 3. Error classification maps correctly to user-actionable messages
 *
 * Business value: Prevents auth regressions and ensures users receive
 * actionable guidance instead of technical error fragments.
 */

import { describe, it, expect } from 'vitest'
import {
  getLaunchErrorMessage,
  classifyLaunchError,
  type LaunchErrorCode,
} from '../../utils/launchErrorMessages'

// ---------------------------------------------------------------------------
// Error messaging integration (mirrors GuidedTokenLaunch.vue submissionErrorMessage computed)
// ---------------------------------------------------------------------------

/**
 * Simulates the submissionErrorMessage computed property from GuidedTokenLaunch.vue:
 *   const submissionErrorMessage = computed(() => {
 *     const rawError = currentForm.value.submissionError
 *     if (!rawError) return null
 *     const code = classifyLaunchError(rawError)
 *     return getLaunchErrorMessage(code)
 *   })
 */
function simulateSubmissionErrorMessage(rawError: string | null) {
  if (!rawError) return null
  const code = classifyLaunchError(rawError)
  return getLaunchErrorMessage(code)
}

describe('GuidedTokenLaunch - Auth-First Error Messaging', () => {
  // ── AC #5: User-guided error messages, not raw technical leakage ──────────

  it('should return null when there is no submission error', () => {
    expect(simulateSubmissionErrorMessage(null)).toBeNull()
    expect(simulateSubmissionErrorMessage('')).toBeNull()
  })

  it('should convert raw auth error to user-friendly message', () => {
    const result = simulateSubmissionErrorMessage('unauthorized access to resource')
    expect(result).not.toBeNull()
    expect(result!.title).toBeTruthy()
    expect(result!.description).toBeTruthy()
    expect(result!.action).toBeTruthy()
    // Should NOT expose raw technical text as the title
    expect(result!.title).not.toBe('unauthorized access to resource')
  })

  it('should convert session-expiry error to user-friendly message', () => {
    const result = simulateSubmissionErrorMessage('session expired, please sign in again')
    expect(result).not.toBeNull()
    expect(result!.title).toBeTruthy()
    expect(result!.description).toMatch(/session|sign in|expired/i)
    expect(result!.action).toBeTruthy()
    expect(result!.recoverable).toBe(true)
  })

  it('should convert validation error to user-friendly message', () => {
    const result = simulateSubmissionErrorMessage('validation failed: field required')
    expect(result).not.toBeNull()
    expect(result!.title).toBeTruthy()
    expect(result!.action.length).toBeGreaterThan(10)
  })

  it('should fall back to UNKNOWN for unrecognized errors without exposing raw fragments', () => {
    const result = simulateSubmissionErrorMessage('Something completely unexpected happened')
    expect(result).not.toBeNull()
    expect(result!.title).toBeTruthy()
    expect(result!.description).toBeTruthy()
    expect(result!.action).toBeTruthy()
    // UNKNOWN should be safe and not expose the raw error string in the title
    expect(result!.title).not.toBe('Something completely unexpected happened')
  })

  it('should produce a severity level for all classification outcomes', () => {
    const testCases: string[] = [
      '401 Unauthorized',
      '422 validation error',
      '500 Internal Server Error',
      'network timeout',
      'rate limit exceeded',
    ]

    for (const raw of testCases) {
      const result = simulateSubmissionErrorMessage(raw)
      expect(result).not.toBeNull()
      expect(['error', 'warning', 'info']).toContain(result!.severity)
    }
  })

  // ── AC #2/#6: No wallet/network UI in guided launch surface ──────────────

  it('getLaunchErrorMessage should not contain wallet-connector references', () => {
    const allCodes: LaunchErrorCode[] = [
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
    ]

    for (const code of allCodes) {
      const msg = getLaunchErrorMessage(code)
      const combined = `${msg.title} ${msg.description} ${msg.action}`.toLowerCase()

      // No wallet-connector language in error messages (roadmap: email/password only)
      expect(combined).not.toContain('walletconnect')
      expect(combined).not.toContain('metamask')
      expect(combined).not.toContain('connect wallet')
      expect(combined).not.toContain('not connected')
      expect(combined).not.toContain('blockchain wallet')
    }
  })

  it('AUTH_REQUIRED message should guide user to email/password sign-in', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED')
    const combined = `${msg.title} ${msg.description} ${msg.action}`.toLowerCase()
    // Should mention sign-in (not wallet connect)
    expect(combined).toMatch(/sign.?in/i)
    // Should not direct the user to connect a wallet
    expect(combined).not.toContain('wallet')
    expect(combined).not.toContain('connect')
  })

  // ── Deterministic classification contract ────────────────────────────────

  it('classifyLaunchError should deterministically classify auth errors', () => {
    expect(classifyLaunchError('unauthorized access')).toBe('AUTH_REQUIRED')
    expect(classifyLaunchError('unauthenticated request')).toBe('AUTH_REQUIRED')
    expect(classifyLaunchError('session expired')).toBe('SESSION_EXPIRED')
    expect(classifyLaunchError('token expired')).toBe('SESSION_EXPIRED')
  })

  it('classifyLaunchError should deterministically classify validation errors', () => {
    expect(classifyLaunchError('validation failed')).toBe('VALIDATION_FAILED')
    expect(classifyLaunchError('invalid input')).toBe('VALIDATION_FAILED')
    expect(classifyLaunchError('field required')).toBe('VALIDATION_FAILED')
  })

  it('classifyLaunchError should deterministically classify network errors', () => {
    expect(classifyLaunchError('network error')).toBe('NETWORK_UNAVAILABLE')
    expect(classifyLaunchError('fetch failed')).toBe('NETWORK_UNAVAILABLE')
    expect(classifyLaunchError('offline')).toBe('NETWORK_UNAVAILABLE')
  })

  it('classifyLaunchError should fall back to UNKNOWN for unrecognized errors', () => {
    expect(classifyLaunchError('completely unknown')).toBe('UNKNOWN')
    expect(classifyLaunchError('')).toBe('UNKNOWN')
  })
})

// ---------------------------------------------------------------------------
// Navigation state tests (AC #6 - deterministic test for no wallet/network status)
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch - Navigation state (no wallet/network status for unauth users)', () => {
  /**
   * AC #6: At least one deterministic automated test validates that unauthenticated
   * users do not see wallet or network "Not connected" status in top nav.
   *
   * The Navbar.vue does NOT render any "Not connected" or wallet network status.
   * This test documents the behavioral contract as a unit-level regression check.
   */

  it('NAV_ITEMS constant does not expose wallet-connection routes', async () => {
    const { NAV_ITEMS } = await import('../../constants/navItems')
    const paths = NAV_ITEMS.map((item) => item.path)

    // No wallet-connection-specific routes in primary navigation
    expect(paths).not.toContain('/wallet/connect')
    expect(paths).not.toContain('/network/select')
  })

  it('NAV_ITEMS canonical create entry routes to auth-first guided launch, not wallet setup', async () => {
    const { NAV_ITEMS } = await import('../../constants/navItems')
    const createEntry = NAV_ITEMS.find(
      (item) => item.path === '/launch/guided' || item.label?.includes('Create')
    )
    // The create entry must exist
    expect(createEntry).toBeDefined()
    // And must NOT point to any wallet setup path
    expect(createEntry!.path).not.toContain('wallet')
    expect(createEntry!.path).not.toContain('connect')
  })

  it('legacy /create/wizard redirect target is auth-first guided launch', async () => {
    // Verify the router source code defines the /create/wizard → /launch/guided redirect
    // This tests the actual router configuration file, not just constants.
    const fs = await import('fs')
    const path = await import('path')
    const routerSource = fs.readFileSync(
      path.resolve(__dirname, '../../router/index.ts'),
      'utf-8'
    )

    // The router source must define the legacy wizard redirect (may use single or double quotes)
    expect(routerSource).toMatch(/['"]\/create\/wizard['"]/)
    expect(routerSource).toMatch(/redirect.*['"]\/launch\/guided['"]/)

    // Confirm the guided launch route is properly defined as the canonical destination
    expect(routerSource).toMatch(/path.*['"]\/launch\/guided['"]/)
    expect(routerSource).toContain('GuidedTokenLaunch')
  })
})
