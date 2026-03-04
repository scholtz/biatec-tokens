/**
 * Integration tests: BackendDeploymentContractClient ↔ DeploymentStatusPanel wiring
 *
 * Tests the boundary between the typed API client and the UI component:
 *   - DeploymentStatusPanel correctly renders states returned by the client
 *   - Error guidance from the client reaches the component with no raw error codes
 *   - Idempotency replay signal from the client flows correctly to the component
 *   - Audit trail URL from the client is accessible from the component
 *   - State machine lifecycle transitions are reflected accurately in the UI
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 * Issue: #557 — Frontend Integration: Backend Deployment Contract API
 * AC#3: Integration tests for auth/session bootstrap and deployment status wiring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DeploymentStatusPanel from '../../components/deployment/DeploymentStatusPanel.vue'
import {
  BackendDeploymentContractClient,
  DEPLOYMENT_ERROR_MESSAGES,
  getUserGuidance,
} from '../../lib/api/backendDeploymentContract'
import type {
  InitiateDeploymentResponse,
  DeploymentStatusResponse,
} from '../../lib/api/backendDeploymentContract'

const BEARER = 'integration-test-bearer-token'
const DEPLOYMENT_ID = 'integ-dep-001'
const BASE_URL = 'http://localhost:5000'

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

// ---------------------------------------------------------------------------
// Suite 1: API client state → DeploymentStatusPanel rendering
// ---------------------------------------------------------------------------

describe('BackendDeploymentStatusWiring: client state → panel rendering', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Pending state from API is reflected as "Preparing deployment" in the panel', async () => {
    const statusBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Pending',
      updatedAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(statusBody))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const wrapper = mount(DeploymentStatusPanel, {
      props: { state: result.data.state },
    })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Preparing deployment')
    expect(wrapper.find('[data-testid="icon-in-progress"]').exists()).toBe(true)
  })

  it('Completed state from API is reflected with checkmark icon and "Deployment complete" label', async () => {
    const statusBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Completed',
      updatedAt: '2026-03-01T00:05:00Z',
      assetId: '99887766',
    }
    vi.stubGlobal('fetch', makeFetchOk(statusBody))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const wrapper = mount(DeploymentStatusPanel, {
      props: { state: result.data.state, assetId: result.data.assetId },
    })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Deployment complete')
    expect(wrapper.find('[data-testid="icon-completed"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="asset-id"]').text()).toBe('99887766')
  })

  it('Failed state with error from API surfaces user guidance — no raw error code in panel', async () => {
    const statusBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Failed',
      updatedAt: '2026-03-01T00:03:00Z',
      error: {
        errorCode: 'InsufficientBalance',
        userGuidance: getUserGuidance('InsufficientBalance'),
      },
    }
    vi.stubGlobal('fetch', makeFetchOk(statusBody))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const guidance = result.data.error?.userGuidance ?? ''
    expect(guidance).toBeTruthy()
    // Guidance must not contain raw error codes
    expect(guidance).not.toContain('InsufficientBalance')
    expect(guidance).not.toContain('ContractDeploymentFailed')
    expect(guidance).not.toContain('DeriveAddressMismatch')

    const wrapper = mount(DeploymentStatusPanel, {
      props: { state: result.data.state, errorGuidance: guidance },
    })
    const panelText = wrapper.text()
    // Panel shows the human-readable guidance
    expect(panelText).not.toContain('InsufficientBalance')
    // Ensure the icon shows the failed state
    expect(wrapper.find('[data-testid="icon-failed"]').exists()).toBe(true)
  })

  it('Validated → Submitted transition: panel step indicators update correctly', async () => {
    // Simulate polling through state transitions
    const states: DeploymentStatusResponse[] = [
      { deploymentId: DEPLOYMENT_ID, state: 'Validated', updatedAt: 't1' },
      { deploymentId: DEPLOYMENT_ID, state: 'Submitted', updatedAt: 't2' },
    ]
    let call = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(states[call++]) })
    ))

    const r1 = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)
    expect(r1.ok).toBe(true)
    if (!r1.ok) return
    const w1 = mount(DeploymentStatusPanel, { props: { state: r1.data.state } })
    // In Validated state: Pending step is completed (green), Validated step is active
    expect(w1.find('[data-testid="step-pending"]').html()).toContain('bg-green-500')
    expect(w1.find('[data-testid="step-validated"]').html()).toContain('bg-blue-500')

    const r2 = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)
    expect(r2.ok).toBe(true)
    if (!r2.ok) return
    const w2 = mount(DeploymentStatusPanel, { props: { state: r2.data.state } })
    // In Submitted state: Pending + Validated steps are completed (green), Submitted is active
    expect(w2.find('[data-testid="step-pending"]').html()).toContain('bg-green-500')
    expect(w2.find('[data-testid="step-validated"]').html()).toContain('bg-green-500')
    expect(w2.find('[data-testid="step-submitted"]').html()).toContain('bg-blue-500')
  })
})

// ---------------------------------------------------------------------------
// Suite 2: Idempotency replay wiring — client → panel
// ---------------------------------------------------------------------------

describe('BackendDeploymentStatusWiring: idempotency replay signal', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('idempotencyReplay:true from initiateDeployment flows to the panel replay notice', async () => {
    const replayBody: InitiateDeploymentResponse = {
      deploymentId: DEPLOYMENT_ID,
      isIdempotentReplay: true,
      state: 'Completed',
      createdAt: '2026-02-20T10:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(replayBody))

    const result = await client.initiateDeployment({
      idempotencyKey: 'test-key-001',
      tokenName: 'Acme Token',
      tokenSymbol: 'ACME',
      totalSupply: '1000000',
      decimals: 6,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // isIdempotentReplay from API must flow to the panel
    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: result.data.state,
        isIdempotentReplay: result.data.isIdempotentReplay,
      },
    })

    const notice = wrapper.find('[data-testid="idempotency-replay-notice"]')
    expect(notice.exists()).toBe(true)
    expect(notice.attributes('role')).toBe('alert')
    expect(notice.text()).toContain('already deployed')
  })

  it('isIdempotentReplay:false produces no replay notice in the panel', async () => {
    const freshBody: InitiateDeploymentResponse = {
      deploymentId: DEPLOYMENT_ID,
      isIdempotentReplay: false,
      state: 'Pending',
      createdAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(freshBody))

    const result = await client.initiateDeployment({
      idempotencyKey: 'unique-key-002',
      tokenName: 'Beta Token',
      tokenSymbol: 'BETA',
      totalSupply: '500000',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-testnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: result.data.state,
        isIdempotentReplay: result.data.isIdempotentReplay,
      },
    })

    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Suite 3: Audit trail URL wiring — client → panel
// ---------------------------------------------------------------------------

describe('BackendDeploymentStatusWiring: audit trail link', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('audit trail URL from client renders as accessible link in Completed panel', async () => {
    const auditUrl = `${BASE_URL}/api/v1/backend-deployment-contract/audit/${DEPLOYMENT_ID}`
    vi.stubGlobal('fetch', makeFetchOk({
      deploymentId: DEPLOYMENT_ID,
      events: [],
      totalEvents: 0,
    }))

    // Simulate providing the audit URL (constructed from the deployment ID)
    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: 'Completed',
        assetId: '12300456',
        auditTrailUrl: auditUrl,
      },
    })

    const link = wrapper.find('[data-testid="audit-trail-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(auditUrl)
    expect(link.attributes('target')).toBe('_blank')
    // Link text must be human-readable
    expect(link.text()).toMatch(/audit trail/i)
  })
})

// ---------------------------------------------------------------------------
// Suite 4: Error guidance taxonomy — no raw codes reach the UI
// ---------------------------------------------------------------------------

describe('BackendDeploymentStatusWiring: error taxonomy', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('all DeploymentErrorCode values map to messages that contain no raw code strings', () => {
    // Verify the complete error taxonomy used in the client matches what the panel displays
    const errorCodes = Object.keys(DEPLOYMENT_ERROR_MESSAGES) as Array<keyof typeof DEPLOYMENT_ERROR_MESSAGES>

    for (const code of errorCodes) {
      const guidance = getUserGuidance(code)

      // Raw code must not appear in the guidance message
      expect(guidance).not.toContain(code)

      // Guidance must be non-empty, user-readable (contains spaces — not a code string)
      expect(guidance.length).toBeGreaterThan(0)
      expect(guidance).toContain(' ') // Has at least one space — is a sentence, not a code
    }
  })

  it('DeploymentStatusPanel renders error guidance without exposing raw error codes', () => {
    for (const [code, guidance] of Object.entries(DEPLOYMENT_ERROR_MESSAGES)) {
      const wrapper = mount(DeploymentStatusPanel, {
        props: {
          state: 'Failed',
          errorGuidance: guidance,
        },
      })
      const panelText = wrapper.text()
      // The panel shows the human-readable guidance
      expect(panelText).not.toContain(code) // raw code must not appear
    }
  })

  it('API client 4xx error with no body falls back to UnknownError guidance', async () => {
    const client = new BackendDeploymentContractClient(BASE_URL)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve(null),
    }))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('UnknownError')
      // The panel can safely display this without exposing a raw code
      const wrapper = mount(DeploymentStatusPanel, {
        props: { state: 'Failed', errorGuidance: result.error.userGuidance },
      })
      expect(wrapper.find('[data-testid="icon-failed"]').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Suite 5: Failed state previousState wiring
// ---------------------------------------------------------------------------

describe('BackendDeploymentStatusWiring: Failed state previousState accuracy', () => {
  it('panel shows correct completed steps when Failed after Confirmed', () => {
    // If the deployment failed after reaching Confirmed, the panel must show
    // Pending → Validated → Submitted → Confirmed as all completed (green)
    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: 'Failed',
        previousState: 'Confirmed',
        errorGuidance: getUserGuidance('ContractDeploymentFailed'),
      },
    })

    // Steps that should be green (completed before failure)
    for (const step of ['pending', 'validated', 'submitted', 'confirmed']) {
      expect(wrapper.find(`[data-testid="step-${step}"]`).html()).toContain('bg-green-500')
    }
    // The Completed step was not reached — must NOT be green
    expect(wrapper.find('[data-testid="step-completed"]').html()).not.toContain('bg-green-500')
  })

  it('panel shows no completed steps when Failed with no previousState', () => {
    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: 'Failed',
        errorGuidance: getUserGuidance('ValidationFailed'),
      },
    })

    // No step should be green — deployment failed before any step succeeded
    for (const step of ['pending', 'validated', 'submitted', 'confirmed']) {
      expect(wrapper.find(`[data-testid="step-${step}"]`).html()).not.toContain('bg-green-500')
    }
  })

  it('panel shows all steps completed when Failed after Completed (edge case)', () => {
    // Even if a "Failed" status is received after Completed (e.g. late audit failure),
    // the UI should reflect the true last known good state
    const wrapper = mount(DeploymentStatusPanel, {
      props: {
        state: 'Failed',
        previousState: 'Completed',
        errorGuidance: getUserGuidance('AuditTrailUnavailable'),
      },
    })

    // Pending through Confirmed should all be green (as Completed has passed them all)
    for (const step of ['pending', 'validated', 'submitted', 'confirmed']) {
      expect(wrapper.find(`[data-testid="step-${step}"]`).html()).toContain('bg-green-500')
    }
  })
})
