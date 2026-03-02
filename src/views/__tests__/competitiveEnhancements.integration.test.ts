/**
 * Integration: Token Deployment Lifecycle — Competitive Enhancements
 *
 * Validates that the two new competitive enhancements work together in a
 * realistic end-to-end deployment scenario:
 *
 *  1. tokenDeploymentNextSteps — post-deployment guidance system
 *  2. walletNetworkChangeHandler — mid-session context change detection
 *
 * Scenario: A user deploys a token, encounters a network switch mid-session,
 * and then receives appropriate guidance for both events.
 *
 * Business value:
 *  - Proves AC #1: clear success/failure outcomes with actionable messaging
 *  - Proves AC #2: wallet/network context changes handled gracefully
 *  - Proves AC #3: at least one competitive gap (post-deployment UX) closed
 */

import { describe, it, expect } from 'vitest'
import {
  getDeploymentNextSteps,
  classifyDeploymentError,
  type DeploymentContext,
} from '../../utils/tokenDeploymentNextSteps'
import {
  detectContextChange,
  buildContextSnapshot,
  isOperationBlocked,
  requiresUserAcknowledgement,
  getContextChangeToastText,
} from '../../utils/walletNetworkChangeHandler'

// ─── Scenario 1: Successful deployment with RWA guidance ─────────────────────

describe('Deployment lifecycle: successful RWA token', () => {
  const context: DeploymentContext = {
    tokenName: 'GreenBond2025',
    tokenStandard: 'ARC1400',
    network: 'algorand',
    complianceComplete: false,
    isRWA: true,
  }

  it('success outcome returns correct title', () => {
    const result = getDeploymentNextSteps('success', context)
    expect(result.title).toMatch(/deployed successfully/i)
  })

  it('success outcome names the token in the summary', () => {
    const result = getDeploymentNextSteps('success', context)
    expect(result.summary).toContain('GreenBond2025')
    expect(result.summary).toContain('algorand')
  })

  it('success outcome for RWA includes compliance as required step', () => {
    const result = getDeploymentNextSteps('success', context)
    const compliance = result.nextSteps.find((s) => s.id === 'complete-compliance')
    expect(compliance).toBeDefined()
    expect(compliance?.route).toBe('/compliance')
    expect(compliance?.priority).toBe('required')
  })

  it('success outcome for ARC1400 includes whitelist setup step', () => {
    const result = getDeploymentNextSteps('success', context)
    const whitelist = result.nextSteps.find((s) => s.id === 'manage-whitelist')
    expect(whitelist).toBeDefined()
    expect(whitelist?.route).toBe('/compliance/whitelists')
  })

  it('success outcome has green colour class', () => {
    const result = getDeploymentNextSteps('success', context)
    expect(result.colorClass).toContain('green')
  })
})

// ─── Scenario 2: Failed deployment with network error recovery ────────────────

describe('Deployment lifecycle: network error recovery flow', () => {
  it('classifies fetch network error correctly', () => {
    const err = new Error('fetch failed: network unreachable')
    const outcome = classifyDeploymentError(err)
    expect(outcome).toBe('network_error')
  })

  it('network_error outcome provides check-network step', () => {
    const result = getDeploymentNextSteps('network_error', { tokenName: 'MyToken' })
    const step = result.nextSteps.find((s) => s.id === 'check-network')
    expect(step).toBeDefined()
    expect(step?.route).toBeNull()  // External check — no app route
  })

  it('network_error outcome provides retry step', () => {
    const result = getDeploymentNextSteps('network_error', { tokenName: 'MyToken' })
    const retry = result.nextSteps.find((s) => s.id === 'retry-launch')
    expect(retry?.route).toBe('/launch/guided')
  })

  it('user can always get support after a network error', () => {
    const result = getDeploymentNextSteps('network_error')
    const support = result.nextSteps.find((s) => s.id === 'contact-support')
    expect(support).toBeDefined()
  })
})

// ─── Scenario 3: Mid-session network switch blocks token operation ─────────────

describe('Wallet context change: network switch during deployment', () => {
  it('detects network change mid-session', () => {
    const prev = buildContextSnapshot({ address: 'USER_ADDR', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'USER_ADDR', network: 'ethereum' })
    const change = detectContextChange(prev, next)
    expect(change.kind).toBe('network_changed')
  })

  it('network change does not block operation outright (warning level)', () => {
    const prev = buildContextSnapshot({ address: 'USER_ADDR', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'USER_ADDR', network: 'voi' })
    const change = detectContextChange(prev, next)
    expect(isOperationBlocked(change)).toBe(false)
    expect(change.impact).toBe('warning')
  })

  it('network change toast text is non-empty', () => {
    const prev = buildContextSnapshot({ address: 'USER_ADDR', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'USER_ADDR', network: 'base' })
    const change = detectContextChange(prev, next)
    expect(getContextChangeToastText(change).length).toBeGreaterThan(0)
  })

  it('network change routes user to check configuration', () => {
    const prev = buildContextSnapshot({ address: 'USER_ADDR', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'USER_ADDR', network: 'ethereum' })
    const change = detectContextChange(prev, next)
    expect(change.actionRoute).toBe('/launch/guided')
  })
})

// ─── Scenario 4: Account switch during deployment — operation paused ──────────

describe('Wallet context change: account switch during deployment', () => {
  it('detects account switch on same network', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'ACCOUNT_B', network: 'algorand' })
    const change = detectContextChange(prev, next)
    expect(change.kind).toBe('account_changed')
  })

  it('account switch blocks the in-progress operation', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'ACCOUNT_B', network: 'algorand' })
    const change = detectContextChange(prev, next)
    expect(isOperationBlocked(change)).toBe(true)
  })

  it('account switch requires user acknowledgement before continuing', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'ACCOUNT_B', network: 'algorand' })
    const change = detectContextChange(prev, next)
    expect(requiresUserAcknowledgement(change)).toBe(true)
  })

  it('account switch provides an actionable next step label', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot({ address: 'ACCOUNT_B', network: 'algorand' })
    const change = detectContextChange(prev, next)
    expect(change.actionLabel).toBeTruthy()
  })
})

// ─── Scenario 5: Session logout during active deployment ─────────────────────

describe('Wallet context change: session logout mid-deployment', () => {
  it('detects session clearance when address becomes null', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot(null)
    const change = detectContextChange(prev, next)
    expect(change.kind).toBe('session_cleared')
  })

  it('session clearance requires re-authentication', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot(null)
    const change = detectContextChange(prev, next)
    expect(change.requiresReauth).toBe(true)
    expect(isOperationBlocked(change)).toBe(true)
  })

  it('session clearance directs user to sign in', () => {
    const prev = buildContextSnapshot({ address: 'ACCOUNT_A', network: 'algorand' })
    const next = buildContextSnapshot(null)
    const change = detectContextChange(prev, next)
    expect(change.actionLabel).toMatch(/sign in/i)
    expect(change.actionRoute).toBe('/')
  })
})

// ─── Scenario 6: Post-deployment next steps cover all outcomes ────────────────

describe('Deployment next steps: invariants across all outcomes', () => {
  it('every outcome has a non-empty summary', () => {
    const outcomes = [
      'success', 'partial_success', 'validation_failed', 'compliance_hold',
      'network_error', 'rejected', 'timeout', 'unknown',
    ] as const

    outcomes.forEach((outcome) => {
      const result = getDeploymentNextSteps(outcome)
      expect(result.summary.trim().length).toBeGreaterThan(0)
    })
  })

  it('compliance_hold always provides a path to /compliance', () => {
    const result = getDeploymentNextSteps('compliance_hold')
    const routes = result.nextSteps.map((s) => s.route).filter(Boolean)
    expect(routes).toContain('/compliance')
  })

  it('validation_failed always provides a path back to /launch/guided', () => {
    const result = getDeploymentNextSteps('validation_failed')
    const routes = result.nextSteps.map((s) => s.route).filter(Boolean)
    expect(routes).toContain('/launch/guided')
  })

  it('all error outcomes include a contact-support fallback', () => {
    const errorOutcomes = ['network_error', 'rejected', 'timeout', 'unknown'] as const
    errorOutcomes.forEach((outcome) => {
      const result = getDeploymentNextSteps(outcome)
      const ids = result.nextSteps.map((s) => s.id)
      expect(ids).toContain('contact-support')
    })
  })
})

// ─── Scenario 7: classifyDeploymentError maps raw errors to outcomes ──────────

describe('classifyDeploymentError: error-to-outcome mapping coverage', () => {
  const cases: Array<[string, string]> = [
    ['validation error occurred', 'validation_failed'],
    ['compliance check incomplete', 'compliance_hold'],
    ['kyc required before deployment', 'compliance_hold'],
    ['network unreachable', 'network_error'],
    ['fetch failed: ERR_NETWORK_CHANGED', 'network_error'],
    ['transaction rejected by node', 'rejected'],
    ['connection refused', 'network_error'],
    ['request timed out after 30 seconds', 'timeout'],
    ['server returned 500', 'unknown'],
  ]

  it.each(cases)('"%s" classifies as %s', (message, expectedOutcome) => {
    const outcome = classifyDeploymentError(new Error(message))
    expect(outcome).toBe(expectedOutcome)
  })
})
