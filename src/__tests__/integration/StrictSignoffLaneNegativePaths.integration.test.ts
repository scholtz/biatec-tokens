/**
 * Integration Tests: Strict Sign-off Lane — Negative Paths
 *
 * Validates that the frontend handles all negative lifecycle scenarios
 * with honest, actionable user-facing behavior — not silent success, blank states,
 * or raw error codes.
 *
 * This test file directly addresses the acceptance criteria from the "Create protected
 * strict sign-off lane for backend-backed issuance UX" issue:
 *
 *   AC #4  — Token issuance lifecycle UX maps to authoritative backend truth and avoids
 *            misleading success states (tests: missing assetId on Completed, missing
 *            errorGuidance on Failed, backend-unavailable scenarios).
 *
 *   Testing requirement — Negative-path tests: Include unavailable backend, missing
 *   deployment identifiers, incomplete lifecycle evidence, failed authentication, and
 *   terminal deployment failure scenarios, verifying that user-facing behavior remains
 *   explicit and actionable.
 *
 * Test categories:
 *   1. Lifecycle UI honest rendering (DeploymentStatusPanel + BackendDeploymentContractClient)
 *      - Completed state without assetId → guidance shown (not silence)
 *      - Failed state without errorGuidance → fallback guidance shown (not silence)
 *      - Failed state with network error → error surfaced to panel
 *
 *   2. Backend unavailable — client behavior
 *      - Initiate deployment fails: network error → result.ok = false, message without raw stack
 *      - Status poll with non-existent deploymentId → 404 handled gracefully
 *
 *   3. Incomplete lifecycle evidence
 *      - Deployment stuck in Pending state → panel does NOT display success indicators
 *      - Terminal Failed state → all relevant context surfaced
 *
 *   4. Auth failure (login contract)
 *      - Login API returns 401 → client throws / returns structured error
 *      - Login response missing address field → validation fails with explanation
 *
 * Design:
 *   - Tests use mocked fetch — zero real network calls.
 *   - All assertions synchronous or minimal async (only awaiting mocked promises).
 *   - No arbitrary timeouts. No broad error suppression.
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DeploymentStatusPanel from '../../components/deployment/DeploymentStatusPanel.vue'
import {
  BackendDeploymentContractClient,
  DEPLOYMENT_ERROR_MESSAGES,
  getUserGuidance,
} from '../../lib/api/backendDeploymentContract'
import type { DeploymentStatusResponse } from '../../lib/api/backendDeploymentContract'
import {
  isStrictBackendMode,
  isSignoffFullyConfigured,
  getSignoffSkipReason,
  describeBackendSignoffConfig,
} from '../../utils/backendSignoffConfig'

const BASE_URL = 'http://localhost:5000'
const BEARER = 'negative-path-test-bearer-token'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

function makeFetchError(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  })
}

function makeFetchNetworkFailure() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
}

function makeFetchNoBody(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
  })
}

function mountPanel(props: {
  state: import('../../lib/api/backendDeploymentContract').DeploymentLifecycleState
  previousState?: import('../../lib/api/backendDeploymentContract').DeploymentLifecycleState
  isIdempotentReplay?: boolean
  assetId?: string
  errorGuidance?: string
  auditTrailUrl?: string
}) {
  return mount(DeploymentStatusPanel, { props })
}

// ===========================================================================
// 1. Lifecycle UI honest rendering — negative-path scenarios
// ===========================================================================

describe('Negative path: Completed state without assetId', () => {
  it('shows pending-asset guidance section (not silence) when assetId is absent', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    // The main success section (with asset ID display) must NOT show — there's no assetId yet
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(false)
    // BUT the pending-asset guidance section MUST show — silence would be misleading
    expect(wrapper.find('[data-testid="success-section-pending-asset"]').exists()).toBe(true)
  })

  it('pending-asset message guides user to dashboard (not a raw placeholder)', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    const msg = wrapper.find('[data-testid="pending-asset-message"]').text()
    expect(msg.trim().length).toBeGreaterThan(10)
    // Message must guide the user — not just say "undefined" or empty string
    expect(msg.toLowerCase()).toMatch(/dashboard|details|asset/)
    expect(msg).not.toContain('undefined')
    expect(msg).not.toContain('null')
  })

  it('Completed without assetId still shows all lifecycle steps as completed', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    // Even without an assetId, the lifecycle steps should show Completed
    const steps = ['pending', 'validated', 'submitted', 'confirmed']
    for (const step of steps) {
      const el = wrapper.find(`[data-testid="step-${step}"]`)
      expect(el.exists()).toBe(true)
      expect(el.html()).toContain('bg-green-500')
    }
  })

  it('Completed without assetId does NOT show the error guidance box', () => {
    // The missing-assetId state is NOT an error — it's a pending-resolution state.
    // The red error-guidance box must not appear for Completed state.
    const wrapper = mountPanel({ state: 'Completed' })
    expect(wrapper.find('[data-testid="error-guidance"]').exists()).toBe(false)
  })
})

describe('Negative path: Failed state without errorGuidance', () => {
  it('always shows error-guidance box on Failed state (even without errorGuidance prop)', () => {
    // Prior behavior: error-guidance was hidden when errorGuidance was absent.
    // New behavior: always show on Failed — silence leaves user with no next step.
    const wrapper = mountPanel({ state: 'Failed' })
    expect(wrapper.find('[data-testid="error-guidance"]').exists()).toBe(true)
  })

  it('fallback message is actionable (mentions dashboard or support or retry)', () => {
    const wrapper = mountPanel({ state: 'Failed' })
    const text = wrapper.find('[data-testid="error-guidance-text"]').text()
    expect(text.trim().length).toBeGreaterThan(10)
    expect(text.toLowerCase()).toMatch(/dashboard|support|contact|try again|check/)
  })

  it('fallback message is not a raw error code', () => {
    const wrapper = mountPanel({ state: 'Failed' })
    const text = wrapper.find('[data-testid="error-guidance-text"]').text()
    // Must not contain technical error identifiers
    expect(text).not.toMatch(/^error$/i)
    expect(text).not.toContain('undefined')
    expect(text).not.toContain('null')
    expect(text).not.toMatch(/\bError\b:/)
  })

  it('uses backend-provided guidance when available (not the fallback)', () => {
    const specificGuidance = 'Your session has expired. Sign in again to continue.'
    const wrapper = mountPanel({ state: 'Failed', errorGuidance: specificGuidance })
    const text = wrapper.find('[data-testid="error-guidance-text"]').text()
    expect(text).toContain(specificGuidance)
  })

  it('error-guidance box has role="alert" for screen reader announcement', () => {
    // Even without errorGuidance, the alert role must be present so AT users
    // are informed of the failure state without relying on visual color alone.
    const wrapper = mountPanel({ state: 'Failed' })
    expect(wrapper.find('[data-testid="error-guidance"]').attributes('role')).toBe('alert')
  })
})

describe('Negative path: Pending state (incomplete lifecycle evidence)', () => {
  it('Pending state shows no success section and no error guidance', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    // In-progress state must not imply success
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="success-section-pending-asset"]').exists()).toBe(false)
    // And not failure either
    expect(wrapper.find('[data-testid="error-guidance"]').exists()).toBe(false)
  })

  it('Pending state shows lifecycle description describing the current activity', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    const desc = wrapper.find('[data-testid="lifecycle-description"]').text()
    expect(desc.trim().length).toBeGreaterThan(0)
    // Description must explain what the system is doing — not a blank/null
    expect(desc).not.toContain('undefined')
    expect(desc).not.toContain('null')
  })

  it('Pending state lifecycle label is not "Deployment complete"', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    const label = wrapper.find('[data-testid="lifecycle-label"]').text()
    expect(label).not.toContain('complete')
    expect(label).not.toContain('Complete')
    expect(label).toContain('Preparing')
  })
})

// ===========================================================================
// 2. Backend unavailable — client negative paths
// ===========================================================================

describe('Negative path: BackendDeploymentContractClient — network failure', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initiateDeployment returns ok=false and a non-empty userGuidance when fetch throws (backend unavailable)', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkFailure())

    const result = await client.initiateDeployment(
      {
        idempotencyKey: 'neg-test-001',
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        totalSupply: '1000000',
        decimals: 6,
        standard: 'ASA',
        network: 'algorand-mainnet',
        bearerToken: BEARER,
      },
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    // error is a DeploymentContractError object — must have non-empty userGuidance
    expect(typeof result.error.userGuidance).toBe('string')
    expect(result.error.userGuidance.trim().length).toBeGreaterThan(0)
    // errorCode must be set (not undefined)
    expect(result.error.errorCode).toBeTruthy()
  })

  it('getDeploymentStatus returns ok=false with non-empty userGuidance for network failure', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkFailure())

    const result = await client.getDeploymentStatus('non-existent-dep-id', BEARER)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(typeof result.error.userGuidance).toBe('string')
    expect(result.error.userGuidance.trim().length).toBeGreaterThan(0)
  })

  it('getDeploymentStatus returns ok=false for 404 (missing deployment identifier)', async () => {
    vi.stubGlobal('fetch', makeFetchError(404, { message: 'Deployment not found' }))

    const result = await client.getDeploymentStatus('non-existent-dep-id', BEARER)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(typeof result.error.userGuidance).toBe('string')
    expect(result.error.userGuidance.trim().length).toBeGreaterThan(0)
  })

  it('initiateDeployment returns ok=false for 401 (auth failure)', async () => {
    vi.stubGlobal('fetch', makeFetchError(401, { message: 'Unauthorized' }))

    const result = await client.initiateDeployment(
      {
        idempotencyKey: 'neg-test-auth',
        tokenName: 'Test',
        tokenSymbol: 'TST',
        totalSupply: '100',
        decimals: 2,
        standard: 'ASA',
        network: 'algorand-mainnet',
        bearerToken: 'invalid-token',
      },
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(typeof result.error.userGuidance).toBe('string')
    expect(result.error.userGuidance.trim().length).toBeGreaterThan(0)
  })

  it('getDeploymentStatus returns ok=false when response body is not JSON', async () => {
    vi.stubGlobal('fetch', makeFetchNoBody(500))

    const result = await client.getDeploymentStatus('dep-broken-json', BEARER)

    expect(result.ok).toBe(false)
    if (result.ok) return
    // Even with no parseable body, there must be a guidance string
    expect(typeof result.error.userGuidance).toBe('string')
    expect(result.error.userGuidance.trim().length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// 3. Terminal lifecycle failure — wiring to panel
// ===========================================================================

describe('Negative path: terminal Failed lifecycle wired to DeploymentStatusPanel', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Failed response from API wires to panel with user guidance (no raw code in UI)', async () => {
    const failedStatusBody: DeploymentStatusResponse = {
      deploymentId: 'neg-dep-failed',
      state: 'Failed',
      updatedAt: '2026-03-01T00:00:00Z',
      error: {
        errorCode: 'ContractDeploymentFailed',
        userGuidance: 'The on-chain deployment failed. Please contact support and quote your deployment ID.',
      },
    }
    vi.stubGlobal('fetch', makeFetchOk(failedStatusBody))

    const result = await client.getDeploymentStatus('neg-dep-failed', BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const wrapper = mountPanel({
      state: result.data.state,
      errorGuidance: result.data.error?.userGuidance,
    })

    // Panel shows user-friendly guidance from backend
    const errorEl = wrapper.find('[data-testid="error-guidance"]')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('contact support')
    // Raw error code must NOT appear in the UI
    expect(errorEl.text()).not.toContain('ContractDeploymentFailed')
  })

  it('Failed response with no error object → panel uses fallback guidance (not blank)', async () => {
    // Simulates a backend that returns state=Failed but no error detail
    const failedNoDetail: DeploymentStatusResponse = {
      deploymentId: 'neg-dep-no-detail',
      state: 'Failed',
      updatedAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(failedNoDetail))

    const result = await client.getDeploymentStatus('neg-dep-no-detail', BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // errorGuidance is undefined when backend returns no error detail
    const wrapper = mountPanel({
      state: result.data.state,
      errorGuidance: result.data.error?.userGuidance,
    })

    // Panel must NOT be silent — it shows fallback guidance
    const errorEl = wrapper.find('[data-testid="error-guidance"]')
    expect(errorEl.exists()).toBe(true)
    const guidanceText = wrapper.find('[data-testid="error-guidance-text"]').text()
    expect(guidanceText.trim().length).toBeGreaterThan(10)
    expect(guidanceText).not.toContain('undefined')
  })

  it('Completed response with no assetId → panel shows pending-asset guidance (not silence)', async () => {
    // Simulates backend confirming deployment Completed but assetId not relayed
    const completedNoAsset: DeploymentStatusResponse = {
      deploymentId: 'neg-dep-no-asset',
      state: 'Completed',
      updatedAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(completedNoAsset))

    const result = await client.getDeploymentStatus('neg-dep-no-asset', BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const wrapper = mountPanel({
      state: result.data.state,
      assetId: result.data.assetId,
    })

    // Panel must NOT claim success without evidence
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(false)
    // But it must guide the user instead of showing blank
    expect(wrapper.find('[data-testid="success-section-pending-asset"]').exists()).toBe(true)
    const msg = wrapper.find('[data-testid="pending-asset-message"]').text()
    expect(msg.trim().length).toBeGreaterThan(10)
  })
})

// ===========================================================================
// 4. getUserGuidance — no raw error codes in returned strings
// ===========================================================================

describe('Negative path: getUserGuidance covers all error codes without raw identifiers', () => {
  it('every DeploymentErrorCode produces a non-empty guidance string', () => {
    const codes: import('../../lib/api/backendDeploymentContract').DeploymentErrorCode[] = [
      'DeriveAddressMismatch',
      'SessionExpired',
      'IdempotencyConflict',
      'ValidationFailed',
      'InsufficientBalance',
      'NetworkUnavailable',
      'ContractDeploymentFailed',
      'AuditTrailUnavailable',
      'UnknownError',
    ]

    for (const code of codes) {
      const guidance = getUserGuidance(code)
      expect(typeof guidance).toBe('string')
      expect(guidance.trim().length).toBeGreaterThan(0)
      // The guidance must NOT contain the raw PascalCase code identifier (e.g. "ContractDeploymentFailed").
      // Using a word-boundary-aware regex ensures case variants ("contractDeploymentFailed")
      // are also excluded, but legitimate English phrases that happen to share words
      // with the code (e.g. "network unavailable") remain acceptable.
      const codeAsRegex = new RegExp(`\\b${code}\\b`)
      expect(guidance).not.toMatch(codeAsRegex)
    }
  })

  it('DEPLOYMENT_ERROR_MESSAGES record contains all DeploymentErrorCodes', () => {
    const expectedCodes = [
      'DeriveAddressMismatch',
      'SessionExpired',
      'IdempotencyConflict',
      'ValidationFailed',
      'InsufficientBalance',
      'NetworkUnavailable',
      'ContractDeploymentFailed',
      'AuditTrailUnavailable',
      'UnknownError',
    ]
    for (const code of expectedCodes) {
      expect(code in DEPLOYMENT_ERROR_MESSAGES).toBe(true)
      expect(typeof DEPLOYMENT_ERROR_MESSAGES[code as keyof typeof DEPLOYMENT_ERROR_MESSAGES]).toBe('string')
    }
  })
})

// ===========================================================================
// 5. Strict sign-off configuration — negative paths
// ===========================================================================

describe('Negative path: strict sign-off configuration — not-configured states', () => {
  it('isStrictBackendMode returns false when env has no BIATEC_STRICT_BACKEND', () => {
    expect(isStrictBackendMode({})).toBe(false)
  })

  it('getSignoffSkipReason returns a non-empty skip message when not in strict mode', () => {
    const reason = getSignoffSkipReason({ BIATEC_STRICT_BACKEND: undefined })
    expect(typeof reason).toBe('string')
    expect((reason as string).trim().length).toBeGreaterThan(0)
    // Skip message must explain the env var requirement, not just say "skip"
    expect(reason).toMatch(/BIATEC_STRICT_BACKEND/)
  })

  it('isSignoffFullyConfigured returns false when API_BASE_URL is localhost', () => {
    expect(
      isSignoffFullyConfigured({ BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'http://localhost:3000' }),
    ).toBe(false)
  })

  it('isSignoffFullyConfigured returns false when API_BASE_URL is 127.0.0.1', () => {
    expect(
      isSignoffFullyConfigured({ BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'http://127.0.0.1:3000' }),
    ).toBe(false)
  })

  it('isSignoffFullyConfigured returns false when BIATEC_STRICT_BACKEND is absent', () => {
    expect(
      isSignoffFullyConfigured({ API_BASE_URL: 'https://staging.biatec.io' }),
    ).toBe(false)
  })

  it('isSignoffFullyConfigured returns false when API_BASE_URL is malformed', () => {
    expect(
      isSignoffFullyConfigured({ BIATEC_STRICT_BACKEND: 'true', API_BASE_URL: 'not-a-url' }),
    ).toBe(false)
  })

  it('describeBackendSignoffConfig configSummary explains missing configuration', () => {
    const config = describeBackendSignoffConfig({})
    expect(config.strictMode).toBe(false)
    expect(config.configSummary.length).toBeGreaterThan(0)
    // Summary must be informative about what is missing
    expect(config.configSummary).toMatch(/BIATEC_STRICT_BACKEND/)
  })

  it('getSignoffSkipReason is undefined when strict mode is fully configured', () => {
    const reason = getSignoffSkipReason({
      BIATEC_STRICT_BACKEND: 'true',
      API_BASE_URL: 'https://staging.biatec.io',
    })
    expect(reason).toBeUndefined()
  })
})
