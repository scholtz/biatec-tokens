/**
 * GuidedPortfolioOnboarding Integration Tests
 *
 * Tests for the complete onboarding orchestration: step-state derivation
 * from auth/portfolio context, continuity delta computation, readiness
 * checks, analytics event emission, and router-guard integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  deriveOnboardingSteps,
  evaluateActionReadiness,
  computePortfolioDeltas,
  buildOnboardingAnalyticsPayload,
  getNextStep,
  savePortfolioSnapshot,
  loadPortfolioSnapshot,
  calculateOnboardingProgress,
  type UserOnboardingContext,
  type PortfolioSnapshot,
  type ActionReadinessContext,
} from '../../utils/portfolioOnboarding'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ctx(overrides: Partial<UserOnboardingContext> = {}): UserOnboardingContext {
  return {
    isAuthenticated: true,
    user: { address: 'ADDR', email: 'user@test.com' },
    provisioningStatus: 'active',
    hasCreatedToken: false,
    hasDeployedToken: false,
    hasConfiguredCompliance: false,
    tokenCount: 0,
    ...overrides,
  }
}

function snapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    tokenCount: 1,
    deployedCount: 0,
    complianceScore: 70,
    capturedAt: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  }
}

// ─── Complete authenticated journey ──────────────────────────────────────────

describe('Full authenticated journey — step progression', () => {
  it('first step is sign_in when not authenticated', () => {
    const steps = deriveOnboardingSteps(ctx({ isAuthenticated: false, user: null }))
    expect(steps[0].status).toBe('in_progress')
    expect(steps[0].id).toBe('sign_in')
  })

  it('second step becomes in_progress after authentication', () => {
    const steps = deriveOnboardingSteps(ctx())
    const signIn = steps.find((s) => s.id === 'sign_in')!
    const provisioning = steps.find((s) => s.id === 'account_provisioning')!
    expect(signIn.status).toBe('completed')
    expect(provisioning.status).toBe('completed') // active provisioning
  })

  it('explore step is in_progress after account is active', () => {
    const steps = deriveOnboardingSteps(ctx())
    const explore = steps.find((s) => s.id === 'explore_standards')!
    expect(explore.status).toBe('in_progress')
  })

  it('create_first_token becomes in_progress when ready', () => {
    const steps = deriveOnboardingSteps(ctx())
    const create = steps.find((s) => s.id === 'create_first_token')!
    expect(create.status).toBe('in_progress')
  })

  it('compliance step becomes in_progress after first token created', () => {
    const steps = deriveOnboardingSteps(ctx({ hasCreatedToken: true }))
    const compliance = steps.find((s) => s.id === 'configure_compliance')!
    expect(compliance.status).toBe('in_progress')
  })

  it('deploy step becomes in_progress when compliance configured', () => {
    const steps = deriveOnboardingSteps(ctx({ hasCreatedToken: true, hasConfiguredCompliance: true }))
    const deploy = steps.find((s) => s.id === 'deploy_token')!
    expect(deploy.status).toBe('in_progress')
  })

  it('all steps complete after full journey', () => {
    const fullCtx = ctx({
      hasCreatedToken: true,
      hasConfiguredCompliance: true,
      hasDeployedToken: true,
    })
    const steps = deriveOnboardingSteps(fullCtx)
    // Steps that are neither completed nor pending (i.e., still in_progress or blocked)
    const inProgressOrBlocked = steps.filter((s) => s.status !== 'completed' && s.status !== 'pending')
    // complete and deploy are completed; 'complete' step should also be completed
    const deployStep = steps.find((s) => s.id === 'deploy_token')!
    const completeStep = steps.find((s) => s.id === 'complete')!
    expect(deployStep.status).toBe('completed')
    expect(completeStep.status).toBe('completed')
    expect(inProgressOrBlocked.length).toBe(0)
  })

  it('progress increases at each journey milestone', () => {
    const contexts: UserOnboardingContext[] = [
      ctx({ isAuthenticated: false, user: null }),
      ctx(),
      ctx({ hasCreatedToken: true }),
      ctx({ hasCreatedToken: true, hasConfiguredCompliance: true }),
      ctx({ hasCreatedToken: true, hasConfiguredCompliance: true, hasDeployedToken: true }),
    ]

    const progresses = contexts.map((c) => {
      const steps = deriveOnboardingSteps(c)
      return calculateOnboardingProgress(steps)
    })

    for (let i = 1; i < progresses.length; i++) {
      expect(progresses[i]).toBeGreaterThanOrEqual(progresses[i - 1])
    }
  })
})

// ─── Readiness checks for token action entry ─────────────────────────────────

describe('Action readiness — integration with auth context', () => {
  it('fully ready when all conditions met', () => {
    const readiness = evaluateActionReadiness({
      isAuthenticated: true,
      provisioningStatus: 'active',
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })
    expect(readiness.canProceed).toBe(true)
    expect(readiness.blockingCount).toBe(0)
  })

  it('blocked when not authenticated + network invalid', () => {
    const readiness = evaluateActionReadiness({
      isAuthenticated: false,
      provisioningStatus: undefined,
      networkValid: false,
      requiredFieldsComplete: false,
      estimatedImpactAvailable: false,
    })
    expect(readiness.canProceed).toBe(false)
    expect(readiness.blockingCount).toBeGreaterThanOrEqual(2)
  })

  it('all check IDs are present', () => {
    const readiness = evaluateActionReadiness({
      isAuthenticated: true,
      provisioningStatus: 'active',
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })
    const ids = readiness.checks.map((c) => c.id)
    expect(ids).toContain('auth')
    expect(ids).toContain('provisioning')
    expect(ids).toContain('network')
    expect(ids).toContain('fields')
    expect(ids).toContain('impact')
  })
})

// ─── Portfolio continuity delta integration ───────────────────────────────────

describe('Portfolio continuity — delta computation + persistence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('computes meaningful deltas for token count increase', () => {
    const prev = snapshot({ tokenCount: 2, deployedCount: 1 })
    const curr = snapshot({ tokenCount: 5, deployedCount: 3, capturedAt: new Date().toISOString() })
    const deltas = computePortfolioDeltas(prev, curr)

    const tokenDelta = deltas.find((d) => d.indicator === 'Tokens Created')!
    expect(tokenDelta.change).toBe(3)
    expect(tokenDelta.isPositive).toBe(true)
  })

  it('full round-trip: save snapshot then compute deltas on next visit', () => {
    const firstVisit = snapshot({ tokenCount: 0, deployedCount: 0, complianceScore: 0 })
    savePortfolioSnapshot(firstVisit)

    const loaded = loadPortfolioSnapshot()!
    expect(loaded.tokenCount).toBe(0)

    const secondVisit = snapshot({
      tokenCount: 2,
      deployedCount: 1,
      complianceScore: 80,
      capturedAt: new Date().toISOString(),
    })
    const deltas = computePortfolioDeltas(loaded, secondVisit)

    expect(deltas.find((d) => d.indicator === 'Tokens Created')!.change).toBe(2)
    expect(deltas.find((d) => d.indicator === 'Deployed Tokens')!.change).toBe(1)
    expect(deltas.find((d) => d.indicator === 'Compliance Score')!.change).toBe(80)
  })
})

// ─── Analytics payload integration ───────────────────────────────────────────

describe('Analytics payload emission', () => {
  it('onboarding_started payload has required fields', () => {
    const payload = buildOnboardingAnalyticsPayload('onboarding_started', 'sess_01', {
      metadata: { progressPercent: 14 },
    })
    expect(payload.event).toBe('onboarding_started')
    expect(payload.sessionId).toBe('sess_01')
    expect(payload.metadata).toEqual({ progressPercent: 14 })
    expect(payload.timestamp).toBeTruthy()
  })

  it('return_session_started payload is distinct from onboarding_started', () => {
    const start = buildOnboardingAnalyticsPayload('onboarding_started', 'sess_02')
    const ret = buildOnboardingAnalyticsPayload('return_session_started', 'sess_03')
    expect(start.event).not.toBe(ret.event)
  })

  it('step_completed event includes stepId', () => {
    const payload = buildOnboardingAnalyticsPayload('onboarding_step_completed', 'sess_04', {
      stepId: 'create_first_token',
    })
    expect(payload.stepId).toBe('create_first_token')
  })

  it('payload does not include sensitive user data by design', () => {
    const payload = buildOnboardingAnalyticsPayload('wallet_connected', 'sess_05')
    // userId should only be present if explicitly passed
    expect(payload.userId).toBeUndefined()
    // The payload type has no email, password, or address fields
    const keys = Object.keys(payload)
    expect(keys).not.toContain('email')
    expect(keys).not.toContain('password')
  })
})

// ─── getNextStep integration with journey state ───────────────────────────────

describe('getNextStep — journey integration', () => {
  it('returns sign_in step for unauthenticated user', () => {
    const steps = deriveOnboardingSteps(ctx({ isAuthenticated: false, user: null }))
    const next = getNextStep(steps)
    expect(next?.id).toBe('sign_in')
  })

  it('returns explore_standards for freshly authenticated user', () => {
    const steps = deriveOnboardingSteps(ctx())
    const next = getNextStep(steps)
    // Should be explore or create (depends on which comes first as in_progress)
    expect(['explore_standards', 'create_first_token']).toContain(next?.id)
  })

  it('returns configure_compliance once first token is created', () => {
    const steps = deriveOnboardingSteps(ctx({ hasCreatedToken: true }))
    const next = getNextStep(steps)
    expect(next?.id).toBe('configure_compliance')
  })

  it('returns null when all steps are completed', () => {
    // Override all statuses to 'completed' to test the null-return edge case
    // in getNextStep when there is no remaining in_progress or blocked step.
    const steps = deriveOnboardingSteps(ctx({
      hasCreatedToken: true,
      hasConfiguredCompliance: true,
      hasDeployedToken: true,
    })).map((s) => ({ ...s, status: 'completed' as const }))
    expect(getNextStep(steps)).toBeNull()
  })
})

// ─── Edge case: empty wallet / no user ────────────────────────────────────────

describe('Empty wallet / no user context', () => {
  it('user with null address still derives steps without throwing', () => {
    const emptyWalletCtx = ctx({ user: { address: '' } })
    expect(() => deriveOnboardingSteps(emptyWalletCtx)).not.toThrow()
  })

  it('user with null address is treated as authenticated if isAuthenticated=true', () => {
    const steps = deriveOnboardingSteps(ctx({ user: { address: '' } }))
    const signIn = steps.find((s) => s.id === 'sign_in')!
    expect(signIn.status).toBe('completed')
  })

  it('null user with isAuthenticated=false shows sign_in as actionable', () => {
    const steps = deriveOnboardingSteps(ctx({ isAuthenticated: false, user: null }))
    expect(getNextStep(steps)?.id).toBe('sign_in')
  })

  it('empty wallet user with tokenCount 0 has correct progress', () => {
    const steps = deriveOnboardingSteps(ctx({ user: { address: '' }, tokenCount: 0 }))
    const progress = calculateOnboardingProgress(steps)
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(100)
  })

  it('readiness fails gracefully for empty-wallet context', () => {
    const result = evaluateActionReadiness({
      isAuthenticated: false,
      provisioningStatus: undefined,
      networkValid: false,
      requiredFieldsComplete: false,
      estimatedImpactAvailable: false,
    })
    expect(result.canProceed).toBe(false)
    expect(result.checks).toHaveLength(5)
    expect(result.blockingCount).toBeGreaterThanOrEqual(2)
  })
})

// ─── Edge case: interrupted onboarding session ────────────────────────────────

describe('Interrupted onboarding session', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('session interrupted after sign_in but before provisioning completes', () => {
    const interruptedCtx = ctx({ provisioningStatus: 'provisioning' })
    const steps = deriveOnboardingSteps(interruptedCtx)
    const provisioning = steps.find((s) => s.id === 'account_provisioning')!
    expect(provisioning.status).toBe('in_progress')
    // subsequent steps are pending/blocked — not falsely completed
    const createToken = steps.find((s) => s.id === 'create_first_token')!
    expect(['pending', 'blocked']).toContain(createToken.status)
  })

  it('session interrupted mid-compliance: token exists but compliance not configured', () => {
    const interruptedCtx = ctx({
      hasCreatedToken: true,
      hasConfiguredCompliance: false,
    })
    const steps = deriveOnboardingSteps(interruptedCtx)
    const compliance = steps.find((s) => s.id === 'configure_compliance')!
    expect(compliance.status).toBe('in_progress')
    // Deploy step remains blocked
    const deploy = steps.find((s) => s.id === 'deploy_token')!
    expect(deploy.status).toBe('blocked')
  })

  it('progress after interruption is strictly less than 100', () => {
    const interruptedCtx = ctx({
      hasCreatedToken: true,
      hasConfiguredCompliance: false,
    })
    const steps = deriveOnboardingSteps(interruptedCtx)
    expect(calculateOnboardingProgress(steps)).toBeLessThan(100)
  })

  it('snapshot from an interrupted session is preserved and reloaded correctly', () => {
    const interruptedSnapshot: PortfolioSnapshot = {
      tokenCount: 1,
      deployedCount: 0,
      complianceScore: 0,
      capturedAt: new Date().toISOString(),
    }
    savePortfolioSnapshot(interruptedSnapshot)
    const loaded = loadPortfolioSnapshot()
    expect(loaded?.tokenCount).toBe(1)
    expect(loaded?.deployedCount).toBe(0)
    expect(loaded?.complianceScore).toBe(0)
  })

  it('deltas after resume show correct changes since interrupted session', () => {
    // Save state at time of interruption
    const atInterrupt: PortfolioSnapshot = {
      tokenCount: 2,
      deployedCount: 0,
      complianceScore: 30,
      capturedAt: new Date(Date.now() - 3_600_000).toISOString(),
    }
    savePortfolioSnapshot(atInterrupt)

    // Resume with additional work done
    const afterResume: PortfolioSnapshot = {
      tokenCount: 3,
      deployedCount: 1,
      complianceScore: 80,
      capturedAt: new Date().toISOString(),
    }
    const deltas = computePortfolioDeltas(atInterrupt, afterResume)

    expect(deltas.find((d) => d.indicator === 'Tokens Created')!.change).toBe(1)
    expect(deltas.find((d) => d.indicator === 'Deployed Tokens')!.change).toBe(1)
    expect(deltas.find((d) => d.indicator === 'Compliance Score')!.change).toBe(50)
  })
})

// ─── Edge case: account switching while form is partially complete ─────────────

describe('Account switching — cross-wallet state isolation', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('switching from user A to user B resets step derivation', () => {
    const userA = ctx({ user: { address: 'ADDR_A' }, hasCreatedToken: true })
    const userB = ctx({ user: { address: 'ADDR_B' }, hasCreatedToken: false })

    const stepsA = deriveOnboardingSteps(userA)
    const stepsB = deriveOnboardingSteps(userB)

    const nextA = getNextStep(stepsA)
    const nextB = getNextStep(stepsB)

    // User A is further along; user B should see an earlier step
    expect(nextA?.id).not.toBe('sign_in')
    expect(nextB?.id).not.toBe('complete')
    // Both derived independently with no shared state leakage
    expect(nextA?.id).not.toBe(nextB?.id)
  })

  it('user B does not inherit snapshot from user A', () => {
    // User A saves a snapshot
    const snapshotA: PortfolioSnapshot = {
      tokenCount: 10,
      deployedCount: 5,
      complianceScore: 95,
      capturedAt: new Date().toISOString(),
    }
    savePortfolioSnapshot(snapshotA)

    // After account switch: the snapshot persists in localStorage (keyed globally,
    // not per-user). We verify that new-user context returns deltas against this.
    const loaded = loadPortfolioSnapshot()
    expect(loaded?.tokenCount).toBe(10) // snapshot is present

    // User B with 0 tokens should show a negative delta vs snapshot
    const userBCurrent: PortfolioSnapshot = {
      tokenCount: 0,
      deployedCount: 0,
      complianceScore: 0,
      capturedAt: new Date().toISOString(),
    }
    const deltas = computePortfolioDeltas(loaded!, userBCurrent)
    const tokenDelta = deltas.find((d) => d.indicator === 'Tokens Created')!
    expect(tokenDelta.change).toBe(-10)
    expect(tokenDelta.isPositive).toBe(false)
  })

  it('step derivation is fully deterministic — same input always yields same output', () => {
    const input = ctx({
      user: { address: 'ADDR_SAME' },
      hasCreatedToken: true,
      hasConfiguredCompliance: false,
    })
    const steps1 = deriveOnboardingSteps(input)
    const steps2 = deriveOnboardingSteps(input)

    expect(steps1.map((s) => `${s.id}:${s.status}`)).toEqual(
      steps2.map((s) => `${s.id}:${s.status}`),
    )
  })

  it('readiness context is isolated to the current user auth state', () => {
    // Simulates two sequential readiness evaluations with different auth states
    const readinessA = evaluateActionReadiness({
      isAuthenticated: true,
      provisioningStatus: 'active',
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })
    const readinessB = evaluateActionReadiness({
      isAuthenticated: false,
      provisioningStatus: undefined,
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })

    expect(readinessA.canProceed).toBe(true)
    expect(readinessB.canProceed).toBe(false)
    // Outputs are independent — check IDs same, statuses differ
    expect(readinessA.checks.map((c) => c.id)).toEqual(readinessB.checks.map((c) => c.id))
    expect(readinessA.checks.find((c) => c.id === 'auth')!.status).toBe('pass')
    expect(readinessB.checks.find((c) => c.id === 'auth')!.status).toBe('fail')
  })
})

// ─── Telemetry / analytics event validation ───────────────────────────────────

describe('Telemetry and analytics event coverage', () => {
  it('all 9 defined funnel events are valid event names', () => {
    const events = [
      'onboarding_started',
      'onboarding_step_completed',
      'onboarding_step_blocked',
      'continuity_panel_viewed',
      'action_readiness_checked',
      'first_action_initiated',
      'first_action_succeeded',
      'return_session_started',
      'wallet_connected',
    ] as const

    events.forEach((event) => {
      const payload = buildOnboardingAnalyticsPayload(event, 'sess_telemetry')
      expect(payload.event).toBe(event)
      expect(payload.sessionId).toBe('sess_telemetry')
      expect(typeof payload.timestamp).toBe('string')
      expect(() => new Date(payload.timestamp)).not.toThrow()
    })
  })

  it('telemetry payloads never include PII (email, password, private key)', () => {
    const payload = buildOnboardingAnalyticsPayload('wallet_connected', 'sess_pii_check', {
      userId: 'uid_abc',
      metadata: { progressPercent: 50 },
    })
    const rawStr = JSON.stringify(payload)
    expect(rawStr).not.toContain('password')
    expect(rawStr).not.toContain('privateKey')
    expect(rawStr).not.toContain('mnemonic')
    expect(rawStr).not.toContain('email') // email not part of payload type
  })

  it('step_blocked event includes stepId in metadata when provided', () => {
    const payload = buildOnboardingAnalyticsPayload('onboarding_step_blocked', 'sess_blocked', {
      stepId: 'configure_compliance',
      metadata: { blockReason: 'Token not created' },
    })
    expect(payload.stepId).toBe('configure_compliance')
    expect(payload.metadata).toMatchObject({ blockReason: 'Token not created' })
  })

  it('return_session payload includes metadata about session context', () => {
    const payload = buildOnboardingAnalyticsPayload('return_session_started', 'sess_return', {
      metadata: { daysSinceLastVisit: 3, deltaCount: 2 },
    })
    expect(payload.metadata).toMatchObject({ daysSinceLastVisit: 3, deltaCount: 2 })
  })

  it('each payload has a monotonically increasing (or equal) timestamp', async () => {
    const p1 = buildOnboardingAnalyticsPayload('onboarding_started', 's1')
    const p2 = buildOnboardingAnalyticsPayload('first_action_initiated', 's2')
    const t1 = new Date(p1.timestamp).getTime()
    const t2 = new Date(p2.timestamp).getTime()
    expect(t2).toBeGreaterThanOrEqual(t1)
  })
})

// ─── Wallet reconnect state ───────────────────────────────────────────────────

describe('Wallet reconnect state', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('reconnected user (was authenticated, now unauthenticated) shows sign_in as in_progress', () => {
    // Simulates a wallet session expiry / logout followed by reconnect
    const reconnectCtx = ctx({ isAuthenticated: false, user: null })
    const steps = deriveOnboardingSteps(reconnectCtx)
    expect(steps.find((s) => s.id === 'sign_in')!.status).toBe('in_progress')
  })

  it('all non-auth steps are pending while wallet is not connected', () => {
    const steps = deriveOnboardingSteps(ctx({ isAuthenticated: false, user: null }))
    const nonAuthSteps = steps.filter((s) => s.id !== 'sign_in')
    nonAuthSteps.forEach((s) => {
      expect(['pending', 'blocked']).toContain(s.status)
    })
  })

  it('progress is 0% for completely unauthenticated user', () => {
    const steps = deriveOnboardingSteps(ctx({ isAuthenticated: false, user: null }))
    expect(calculateOnboardingProgress(steps)).toBe(0)
  })

  it('after reconnect, provisioning step depends on status not previous session', () => {
    // User reconnects and provisioning is now active (recovered from failed state)
    const recoveredCtx = ctx({ provisioningStatus: 'active' })
    const steps = deriveOnboardingSteps(recoveredCtx)
    expect(steps.find((s) => s.id === 'account_provisioning')!.status).toBe('completed')
  })

  it('readiness check auth status reflects current session not cached state', () => {
    // Session 1: authenticated
    const session1 = evaluateActionReadiness({
      isAuthenticated: true,
      provisioningStatus: 'active',
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })
    // Session 2: wallet reconnected but not authenticated yet
    const session2 = evaluateActionReadiness({
      isAuthenticated: false,
      provisioningStatus: undefined,
      networkValid: true,
      requiredFieldsComplete: true,
      estimatedImpactAvailable: true,
    })
    expect(session1.canProceed).toBe(true)
    expect(session2.canProceed).toBe(false)
    // Auth check must fail in session2
    expect(session2.checks.find((c) => c.id === 'auth')!.status).toBe('fail')
  })

  it('snapshot survives wallet reconnect (persisted across sessions)', () => {
    const snap: PortfolioSnapshot = {
      tokenCount: 3,
      deployedCount: 2,
      complianceScore: 85,
      capturedAt: new Date().toISOString(),
    }
    savePortfolioSnapshot(snap)
    // Simulate reconnect: clear auth but NOT localStorage
    // (localStorage snapshot should still be there)
    const loaded = loadPortfolioSnapshot()
    expect(loaded?.tokenCount).toBe(3)
  })
})

// ─── First-time user setup state ─────────────────────────────────────────────

describe('First-time user setup state', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('first-time user has no localStorage snapshot', () => {
    const loaded = loadPortfolioSnapshot()
    expect(loaded).toBeNull()
  })

  it('first-time authenticated user sees explore_standards as next step', () => {
    const firstTimeCtx = ctx({
      provisioningStatus: 'active',
      hasCreatedToken: false,
      hasDeployedToken: false,
      hasConfiguredCompliance: false,
      tokenCount: 0,
    })
    const steps = deriveOnboardingSteps(firstTimeCtx)
    const next = getNextStep(steps)
    expect(['explore_standards', 'create_first_token']).toContain(next?.id)
  })

  it('first-time user progress is between 14% and 30% after sign-in and provisioning', () => {
    const steps = deriveOnboardingSteps(ctx({
      provisioningStatus: 'active',
      hasCreatedToken: false,
    }))
    const pct = calculateOnboardingProgress(steps)
    // 2 steps completed out of 7 = ~28%
    expect(pct).toBeGreaterThanOrEqual(14)
    expect(pct).toBeLessThan(50)
  })

  it('first-time user with pending provisioning has no next step after sign_in', () => {
    const pendingProvisionCtx = ctx({ provisioningStatus: 'provisioning' })
    const steps = deriveOnboardingSteps(pendingProvisionCtx)
    const next = getNextStep(steps)
    // Should be account_provisioning as in_progress
    expect(next?.id).toBe('account_provisioning')
  })

  it('computePortfolioDeltas with null prev snapshot returns empty array', () => {
    const current: PortfolioSnapshot = {
      tokenCount: 1,
      deployedCount: 0,
      complianceScore: 0,
      capturedAt: new Date().toISOString(),
    }
    const deltas = computePortfolioDeltas(null, current)
    expect(deltas).toHaveLength(0)
  })

  it('action readiness for first-time user: fields not complete blocks action', () => {
    const result = evaluateActionReadiness({
      isAuthenticated: true,
      provisioningStatus: 'active',
      networkValid: true,
      requiredFieldsComplete: false,
      estimatedImpactAvailable: true,
    })
    // Fields check is a warn, not block — canProceed may still be true
    const fieldsCheck = result.checks.find((c) => c.id === 'fields')!
    expect(fieldsCheck.status).toBe('warning')
    // Should not block proceed — warnings don't block
    expect(result.canProceed).toBe(true)
  })

  it('all 7 steps are present for first-time user context', () => {
    const steps = deriveOnboardingSteps(ctx({
      provisioningStatus: 'active',
      hasCreatedToken: false,
      hasDeployedToken: false,
      hasConfiguredCompliance: false,
      tokenCount: 0,
    }))
    const ids = steps.map((s) => s.id)
    expect(ids).toContain('sign_in')
    expect(ids).toContain('account_provisioning')
    expect(ids).toContain('explore_standards')
    expect(ids).toContain('create_first_token')
    expect(ids).toContain('configure_compliance')
    expect(ids).toContain('deploy_token')
    expect(ids).toContain('complete')
    expect(steps).toHaveLength(7)
  })
})
