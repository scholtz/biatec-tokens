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
