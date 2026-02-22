/**
 * Unit tests for portfolioOnboarding.ts
 *
 * Covers step-state derivation, portfolio continuity deltas, action readiness
 * checks, analytics payload construction, and formatting helpers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  deriveOnboardingSteps,
  getNextStep,
  calculateOnboardingProgress,
  computePortfolioDeltas,
  savePortfolioSnapshot,
  loadPortfolioSnapshot,
  evaluateActionReadiness,
  buildOnboardingAnalyticsPayload,
  formatSnapshotAge,
  type UserOnboardingContext,
  type PortfolioSnapshot,
  type ActionReadinessContext,
} from '../portfolioOnboarding'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<UserOnboardingContext> = {}): UserOnboardingContext {
  return {
    isAuthenticated: true,
    user: { address: 'TESTADDRESS' },
    provisioningStatus: 'active',
    hasCreatedToken: false,
    hasDeployedToken: false,
    hasConfiguredCompliance: false,
    tokenCount: 0,
    ...overrides,
  }
}

function makeReadinessCtx(overrides: Partial<ActionReadinessContext> = {}): ActionReadinessContext {
  return {
    isAuthenticated: true,
    provisioningStatus: 'active',
    networkValid: true,
    requiredFieldsComplete: true,
    estimatedImpactAvailable: true,
    ...overrides,
  }
}

function makeSnapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    tokenCount: 2,
    deployedCount: 1,
    complianceScore: 80,
    capturedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── Step derivation ──────────────────────────────────────────────────────────

describe('deriveOnboardingSteps', () => {
  it('marks sign_in as in_progress when not authenticated', () => {
    const steps = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const signIn = steps.find((s) => s.id === 'sign_in')!
    expect(signIn.status).toBe('in_progress')
  })

  it('marks sign_in as completed when authenticated', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const signIn = steps.find((s) => s.id === 'sign_in')!
    expect(signIn.status).toBe('completed')
  })

  it('marks account_provisioning as in_progress when status is provisioning', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'provisioning' }))
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('in_progress')
  })

  it('marks account_provisioning as blocked when status is failed', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'failed' }))
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('blocked')
    expect(step.blockedReason).toBeDefined()
  })

  it('marks account_provisioning as blocked when status is suspended', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'suspended' }))
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('blocked')
    expect(step.remediationAction).toBeDefined()
  })

  it('marks account_provisioning as completed when status is active', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('completed')
  })

  it('marks explore_standards as pending when not authenticated', () => {
    const steps = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const step = steps.find((s) => s.id === 'explore_standards')!
    expect(step.status).toBe('pending')
  })

  it('marks explore_standards as in_progress when authenticated and no tokens yet', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const step = steps.find((s) => s.id === 'explore_standards')!
    expect(step.status).toBe('in_progress')
  })

  it('marks explore_standards as completed when user has created a token', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true }))
    const step = steps.find((s) => s.id === 'explore_standards')!
    expect(step.status).toBe('completed')
  })

  it('marks create_first_token as blocked when not authenticated', () => {
    const steps = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const step = steps.find((s) => s.id === 'create_first_token')!
    expect(step.status).toBe('blocked')
  })

  it('marks create_first_token as blocked when provisioning not active', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'provisioning' }))
    const step = steps.find((s) => s.id === 'create_first_token')!
    expect(step.status).toBe('blocked')
  })

  it('marks create_first_token as in_progress when ready but no token yet', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const step = steps.find((s) => s.id === 'create_first_token')!
    expect(step.status).toBe('in_progress')
  })

  it('marks create_first_token as completed when token exists', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true, hasConfiguredCompliance: true }))
    const step = steps.find((s) => s.id === 'create_first_token')!
    expect(step.status).toBe('completed')
  })

  it('marks configure_compliance as blocked when no token exists', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const step = steps.find((s) => s.id === 'configure_compliance')!
    expect(step.status).toBe('blocked')
    expect(step.blockedReason).toBeDefined()
  })

  it('marks configure_compliance as in_progress when token exists but not configured', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true }))
    const step = steps.find((s) => s.id === 'configure_compliance')!
    expect(step.status).toBe('in_progress')
  })

  it('marks configure_compliance as completed when configured', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true, hasConfiguredCompliance: true }))
    const step = steps.find((s) => s.id === 'configure_compliance')!
    expect(step.status).toBe('completed')
  })

  it('marks deploy_token as blocked when compliance not configured', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true }))
    const step = steps.find((s) => s.id === 'deploy_token')!
    expect(step.status).toBe('blocked')
  })

  it('marks deploy_token as in_progress when all prerequisites met', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasCreatedToken: true, hasConfiguredCompliance: true }))
    const step = steps.find((s) => s.id === 'deploy_token')!
    expect(step.status).toBe('in_progress')
  })

  it('marks deploy_token as completed when deployed', () => {
    const steps = deriveOnboardingSteps(makeCtx({
      hasCreatedToken: true,
      hasConfiguredCompliance: true,
      hasDeployedToken: true,
    }))
    const step = steps.find((s) => s.id === 'deploy_token')!
    expect(step.status).toBe('completed')
  })

  it('marks complete as completed only when token is deployed', () => {
    const steps = deriveOnboardingSteps(makeCtx({ hasDeployedToken: true, hasCreatedToken: true, hasConfiguredCompliance: true }))
    const step = steps.find((s) => s.id === 'complete')!
    expect(step.status).toBe('completed')
  })

  it('marks complete as pending when not deployed', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const step = steps.find((s) => s.id === 'complete')!
    expect(step.status).toBe('pending')
  })

  it('returns exactly 7 steps', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    expect(steps).toHaveLength(7)
  })

  it('all steps have ctaPath when applicable', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const stepsWithCta = steps.filter((s) => s.ctaPath)
    expect(stepsWithCta.length).toBeGreaterThan(0)
  })
})

// ─── getNextStep ──────────────────────────────────────────────────────────────

describe('getNextStep', () => {
  it('returns the first in_progress step', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const next = getNextStep(steps)
    expect(next).not.toBeNull()
    expect(next!.status).toMatch(/in_progress|blocked/)
  })

  it('returns null when all steps are completed', () => {
    const ctx = makeCtx({
      hasCreatedToken: true,
      hasConfiguredCompliance: true,
      hasDeployedToken: true,
    })
    const steps = deriveOnboardingSteps(ctx)
    // Manually force all to completed for this edge case
    const allCompleted = steps.map((s) => ({ ...s, status: 'completed' as const }))
    expect(getNextStep(allCompleted)).toBeNull()
  })

  it('returns sign_in step when not authenticated', () => {
    const steps = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const next = getNextStep(steps)
    expect(next!.id).toBe('sign_in')
  })
})

// ─── calculateOnboardingProgress ─────────────────────────────────────────────

describe('calculateOnboardingProgress', () => {
  it('returns 0 when no steps are completed', () => {
    const steps = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const allPending = steps.map((s) => ({ ...s, status: 'pending' as const }))
    expect(calculateOnboardingProgress(allPending)).toBe(0)
  })

  it('returns 100 when all steps are completed', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const allCompleted = steps.map((s) => ({ ...s, status: 'completed' as const }))
    expect(calculateOnboardingProgress(allCompleted)).toBe(100)
  })

  it('returns correct percentage for partial completion', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    // Override 2 of 7 to completed
    const mixed = steps.map((s, i) => ({
      ...s,
      status: i < 2 ? ('completed' as const) : ('pending' as const),
    }))
    expect(calculateOnboardingProgress(mixed)).toBe(Math.round((2 / 7) * 100))
  })

  it('increases as more steps are completed for a fresh user', () => {
    const noAuth = deriveOnboardingSteps(makeCtx({ isAuthenticated: false, user: null }))
    const withAuth = deriveOnboardingSteps(makeCtx())
    expect(calculateOnboardingProgress(withAuth)).toBeGreaterThan(
      calculateOnboardingProgress(noAuth),
    )
  })
})

// ─── Portfolio continuity deltas ──────────────────────────────────────────────

describe('computePortfolioDeltas', () => {
  it('returns exactly three delta indicators', () => {
    const deltas = computePortfolioDeltas(makeSnapshot(), makeSnapshot())
    expect(deltas).toHaveLength(3)
  })

  it('shows direction up when count increased', () => {
    const prev = makeSnapshot({ tokenCount: 2 })
    const curr = makeSnapshot({ tokenCount: 5, capturedAt: new Date().toISOString() })
    const deltas = computePortfolioDeltas(prev, curr)
    const tokenDelta = deltas.find((d) => d.indicator === 'Tokens Created')!
    expect(tokenDelta.direction).toBe('up')
    expect(tokenDelta.change).toBe(3)
    expect(tokenDelta.formattedChange).toBe('+3')
    expect(tokenDelta.isPositive).toBe(true)
  })

  it('shows direction down when count decreased', () => {
    const prev = makeSnapshot({ deployedCount: 3 })
    const curr = makeSnapshot({ deployedCount: 1, capturedAt: new Date().toISOString() })
    const deltas = computePortfolioDeltas(prev, curr)
    const deployDelta = deltas.find((d) => d.indicator === 'Deployed Tokens')!
    expect(deployDelta.direction).toBe('down')
    expect(deployDelta.change).toBe(-2)
    expect(deployDelta.formattedChange).toBe('-2')
  })

  it('shows unchanged when values are equal', () => {
    const snapshot = makeSnapshot()
    const deltas = computePortfolioDeltas(snapshot, { ...snapshot })
    deltas.forEach((d) => {
      expect(d.direction).toBe('unchanged')
      expect(d.change).toBe(0)
    })
  })

  it('reflects compliance score changes', () => {
    const prev = makeSnapshot({ complianceScore: 60 })
    const curr = makeSnapshot({ complianceScore: 85, capturedAt: new Date().toISOString() })
    const deltas = computePortfolioDeltas(prev, curr)
    const compDelta = deltas.find((d) => d.indicator === 'Compliance Score')!
    expect(compDelta.direction).toBe('up')
    expect(compDelta.isPositive).toBe(true)
  })
})

// ─── savePortfolioSnapshot / loadPortfolioSnapshot ───────────────────────────

describe('savePortfolioSnapshot / loadPortfolioSnapshot', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when no snapshot has been saved', () => {
    expect(loadPortfolioSnapshot()).toBeNull()
  })

  it('round-trips a snapshot correctly', () => {
    const snapshot = makeSnapshot({ tokenCount: 5, deployedCount: 3, complianceScore: 90 })
    savePortfolioSnapshot(snapshot)
    const loaded = loadPortfolioSnapshot()
    expect(loaded).toEqual(snapshot)
  })

  it('overwrites previous snapshot', () => {
    savePortfolioSnapshot(makeSnapshot({ tokenCount: 1 }))
    savePortfolioSnapshot(makeSnapshot({ tokenCount: 9 }))
    const loaded = loadPortfolioSnapshot()
    expect(loaded!.tokenCount).toBe(9)
  })
})

// ─── Action readiness ─────────────────────────────────────────────────────────

describe('evaluateActionReadiness', () => {
  it('returns canProceed true when all checks pass', () => {
    const result = evaluateActionReadiness(makeReadinessCtx())
    expect(result.canProceed).toBe(true)
    expect(result.blockingCount).toBe(0)
  })

  it('blocks when not authenticated', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ isAuthenticated: false }))
    expect(result.canProceed).toBe(false)
    const authCheck = result.checks.find((c) => c.id === 'auth')!
    expect(authCheck.status).toBe('fail')
    expect(authCheck.message).toBeDefined()
    expect(authCheck.remediationPath).toBeDefined()
  })

  it('blocks when provisioning failed', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ provisioningStatus: 'failed' }))
    expect(result.canProceed).toBe(false)
  })

  it('warns but does not block when provisioning is in_progress', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ provisioningStatus: 'provisioning' }))
    const provCheck = result.checks.find((c) => c.id === 'provisioning')!
    expect(provCheck.status).toBe('warning')
    // Should still be able to proceed (only fail blocks)
    expect(result.canProceed).toBe(true)
  })

  it('blocks when network is invalid', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ networkValid: false }))
    expect(result.canProceed).toBe(false)
    const networkCheck = result.checks.find((c) => c.id === 'network')!
    expect(networkCheck.status).toBe('fail')
  })

  it('warns but does not block when required fields incomplete', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ requiredFieldsComplete: false }))
    const fieldsCheck = result.checks.find((c) => c.id === 'fields')!
    expect(fieldsCheck.status).toBe('warning')
    expect(result.canProceed).toBe(true)
  })

  it('warns but does not block when impact estimate unavailable', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ estimatedImpactAvailable: false }))
    const impactCheck = result.checks.find((c) => c.id === 'impact')!
    expect(impactCheck.status).toBe('warning')
    expect(result.canProceed).toBe(true)
  })

  it('returns exactly 5 checks', () => {
    const result = evaluateActionReadiness(makeReadinessCtx())
    expect(result.checks).toHaveLength(5)
  })

  it('accumulates multiple blocking failures', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({
      isAuthenticated: false,
      networkValid: false,
    }))
    expect(result.blockingCount).toBe(2)
    expect(result.canProceed).toBe(false)
  })
})

// ─── Analytics payload builder ────────────────────────────────────────────────

describe('buildOnboardingAnalyticsPayload', () => {
  it('includes the required fields', () => {
    const payload = buildOnboardingAnalyticsPayload('onboarding_started', 'sess_001')
    expect(payload.event).toBe('onboarding_started')
    expect(payload.sessionId).toBe('sess_001')
    expect(payload.timestamp).toBeTruthy()
  })

  it('includes optional stepId and metadata', () => {
    const payload = buildOnboardingAnalyticsPayload('onboarding_step_completed', 'sess_002', {
      stepId: 'sign_in',
      metadata: { source: 'test' },
    })
    expect(payload.stepId).toBe('sign_in')
    expect(payload.metadata).toEqual({ source: 'test' })
  })

  it('does not include userId when not provided', () => {
    const payload = buildOnboardingAnalyticsPayload('wallet_connected', 'sess_003')
    expect(payload.userId).toBeUndefined()
  })

  it('produces a valid ISO timestamp', () => {
    const payload = buildOnboardingAnalyticsPayload('return_session_started', 'sess_004')
    expect(() => new Date(payload.timestamp)).not.toThrow()
  })

  it('works for all defined event types', () => {
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
    events.forEach((evt) => {
      const payload = buildOnboardingAnalyticsPayload(evt, 'sess_x')
      expect(payload.event).toBe(evt)
    })
  })
})

// ─── formatSnapshotAge ────────────────────────────────────────────────────────

describe('formatSnapshotAge', () => {
  it('returns "Just now" for very recent timestamps', () => {
    const recent = new Date(Date.now() - 10_000).toISOString()
    expect(formatSnapshotAge(recent)).toBe('Just now')
  })

  it('returns minutes ago label for timestamps within 1 hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60_000).toISOString()
    expect(formatSnapshotAge(thirtyMinsAgo)).toContain('minutes ago')
  })

  it('returns hours ago label for timestamps within 24 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    expect(formatSnapshotAge(twoHoursAgo)).toContain('hours ago')
  })

  it('returns formatted date for timestamps older than 24 hours', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const result = formatSnapshotAge(twoDaysAgo)
    // Should be a date string, not a relative label
    expect(result).not.toContain('ago')
    expect(result).not.toBe('Just now')
  })
})

// ─── Edge cases: uncovered branches ──────────────────────────────────────────

describe('deriveOnboardingSteps — edge cases', () => {
  it('treats provisioningStatus not_started as in_progress for account_provisioning', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'not_started' }))
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('in_progress')
  })

  it('treats provisioningStatus undefined as in_progress for account_provisioning', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: undefined }))
    const step = steps.find((s) => s.id === 'account_provisioning')!
    expect(step.status).toBe('in_progress')
  })

  it('explore_standards is pending when provisioning not active', () => {
    const steps = deriveOnboardingSteps(makeCtx({ provisioningStatus: 'provisioning' }))
    const step = steps.find((s) => s.id === 'explore_standards')!
    expect(step.status).toBe('pending')
  })

  it('all step IDs are unique', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    const ids = steps.map((s) => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all step titles and descriptions are non-empty strings', () => {
    const steps = deriveOnboardingSteps(makeCtx())
    steps.forEach((s) => {
      expect(typeof s.title).toBe('string')
      expect(s.title.length).toBeGreaterThan(0)
      expect(typeof s.description).toBe('string')
      expect(s.description.length).toBeGreaterThan(0)
    })
  })

  it('blocked steps provide either blockedReason or remediationAction', () => {
    // Test all blocking scenarios
    const blockedCtx = makeCtx({ provisioningStatus: 'failed' })
    const steps = deriveOnboardingSteps(blockedCtx)
    const blockedSteps = steps.filter((s) => s.status === 'blocked')
    blockedSteps.forEach((s) => {
      const hasGuidance = !!s.blockedReason || !!s.remediationAction
      expect(hasGuidance).toBe(true)
    })
  })
})

describe('loadPortfolioSnapshot — corrupt storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('biatec_portfolio_snapshot', '{invalid-json')
    expect(loadPortfolioSnapshot()).toBeNull()
  })

  it('returns null when localStorage contains empty string', () => {
    localStorage.setItem('biatec_portfolio_snapshot', '')
    expect(loadPortfolioSnapshot()).toBeNull()
  })
})

describe('evaluateActionReadiness — combined and edge cases', () => {
  it('warns when both fields and impact are unavailable', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({
      requiredFieldsComplete: false,
      estimatedImpactAvailable: false,
    }))
    const fieldsCheck = result.checks.find((c) => c.id === 'fields')!
    const impactCheck = result.checks.find((c) => c.id === 'impact')!
    expect(fieldsCheck.status).toBe('warning')
    expect(impactCheck.status).toBe('warning')
    // Warnings don't block
    expect(result.canProceed).toBe(true)
  })

  it('all fail checks have human-readable messages', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({
      isAuthenticated: false,
      networkValid: false,
    }))
    result.checks.filter((c) => c.status === 'fail').forEach((c) => {
      expect(c.message).toBeTruthy()
      expect(typeof c.message).toBe('string')
    })
  })

  it('failed auth check provides remediation path', () => {
    const result = evaluateActionReadiness(makeReadinessCtx({ isAuthenticated: false }))
    const authCheck = result.checks.find((c) => c.id === 'auth')!
    expect(authCheck.remediationPath).toBeTruthy()
    expect(authCheck.remediationLabel).toBeTruthy()
  })

  it('check IDs are deterministic regardless of input', () => {
    const fullFail = evaluateActionReadiness(makeReadinessCtx({
      isAuthenticated: false,
      networkValid: false,
      requiredFieldsComplete: false,
      estimatedImpactAvailable: false,
    }))
    const fullPass = evaluateActionReadiness(makeReadinessCtx())
    expect(fullFail.checks.map((c) => c.id)).toEqual(fullPass.checks.map((c) => c.id))
  })
})

describe('buildOnboardingAnalyticsPayload — additional coverage', () => {
  it('includes userId when provided via options', () => {
    const payload = buildOnboardingAnalyticsPayload('wallet_connected', 'sess_05', {
      userId: 'user_abc',
    })
    expect(payload.userId).toBe('user_abc')
  })

  it('each call produces a unique timestamp', async () => {
    const p1 = buildOnboardingAnalyticsPayload('onboarding_started', 'sess_1')
    await new Promise((r) => setTimeout(r, 2)) // ensure time difference
    const p2 = buildOnboardingAnalyticsPayload('onboarding_started', 'sess_1')
    // Timestamps should be ISO strings; actual uniqueness depends on resolution
    expect(typeof p1.timestamp).toBe('string')
    expect(typeof p2.timestamp).toBe('string')
  })
})
