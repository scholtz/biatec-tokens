import { describe, it, expect } from 'vitest'
import {
  getDeploymentNextSteps,
  classifyDeploymentError,
  type DeploymentOutcome,
  type DeploymentContext,
} from '../tokenDeploymentNextSteps'

// ─── getDeploymentNextSteps ────────────────────────────────────────────────────

describe('getDeploymentNextSteps — success', () => {
  it('returns success outcome with correct title', () => {
    const result = getDeploymentNextSteps('success')
    expect(result.outcome).toBe('success')
    expect(result.title).toMatch(/deployed successfully/i)
  })

  it('uses green colour class for success', () => {
    const result = getDeploymentNextSteps('success')
    expect(result.colorClass).toContain('green')
  })

  it('includes view-dashboard as first step', () => {
    const result = getDeploymentNextSteps('success')
    expect(result.nextSteps[0].id).toBe('view-dashboard')
    expect(result.nextSteps[0].route).toBe('/dashboard')
    expect(result.nextSteps[0].priority).toBe('required')
  })

  it('includes token name in summary when provided', () => {
    const ctx: DeploymentContext = { tokenName: 'MyToken', network: 'algorand' }
    const result = getDeploymentNextSteps('success', ctx)
    expect(result.summary).toContain('MyToken')
    expect(result.summary).toContain('algorand')
  })

  it('includes generic "Your token" when no name is provided', () => {
    const result = getDeploymentNextSteps('success', {})
    expect(result.summary).toContain('Your token')
  })

  it('includes compliance step for RWA tokens even on success', () => {
    const ctx: DeploymentContext = { isRWA: true }
    const result = getDeploymentNextSteps('success', ctx)
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('complete-compliance')
  })

  it('includes attestation step for RWA tokens', () => {
    const ctx: DeploymentContext = { isRWA: true }
    const result = getDeploymentNextSteps('success', ctx)
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('add-attestation')
  })

  it('includes whitelist step for ARC1400 tokens', () => {
    const ctx: DeploymentContext = { tokenStandard: 'ARC1400' }
    const result = getDeploymentNextSteps('success', ctx)
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('manage-whitelist')
  })

  it('includes compliance step when compliance not complete for non-RWA', () => {
    const ctx: DeploymentContext = { complianceComplete: false }
    const result = getDeploymentNextSteps('success', ctx)
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('complete-compliance')
  })

  it('skips compliance step when compliance is already complete', () => {
    const ctx: DeploymentContext = { complianceComplete: true }
    const result = getDeploymentNextSteps('success', ctx)
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).not.toContain('complete-compliance')
  })

  it('has at least one step with a route', () => {
    const result = getDeploymentNextSteps('success')
    expect(result.nextSteps.some((s) => s.route !== null)).toBe(true)
  })
})

describe('getDeploymentNextSteps — partial_success', () => {
  it('returns partial_success outcome', () => {
    const result = getDeploymentNextSteps('partial_success')
    expect(result.outcome).toBe('partial_success')
  })

  it('uses blue colour class for partial success', () => {
    const result = getDeploymentNextSteps('partial_success')
    expect(result.colorClass).toContain('blue')
  })

  it('title communicates pending steps', () => {
    const result = getDeploymentNextSteps('partial_success')
    expect(result.title).toMatch(/pending/i)
  })

  it('summary reassures user the token is functional', () => {
    const result = getDeploymentNextSteps('partial_success')
    expect(result.summary).toMatch(/functional/i)
  })

  it('includes dashboard and cockpit steps', () => {
    const result = getDeploymentNextSteps('partial_success')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('view-dashboard')
    expect(ids).toContain('view-cockpit')
  })

  it('includes attestation for RWA partial success', () => {
    const result = getDeploymentNextSteps('partial_success', { isRWA: true })
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('add-attestation')
  })
})

describe('getDeploymentNextSteps — validation_failed', () => {
  it('returns validation_failed outcome', () => {
    const result = getDeploymentNextSteps('validation_failed')
    expect(result.outcome).toBe('validation_failed')
  })

  it('uses amber colour class', () => {
    const result = getDeploymentNextSteps('validation_failed')
    expect(result.colorClass).toContain('amber')
  })

  it('includes fix-validation as required step', () => {
    const result = getDeploymentNextSteps('validation_failed')
    const step = result.nextSteps.find((s) => s.id === 'fix-validation')
    expect(step).toBeDefined()
    expect(step?.priority).toBe('required')
    expect(step?.route).toBe('/launch/guided')
  })

  it('routes back to guided launch for correction', () => {
    const result = getDeploymentNextSteps('validation_failed')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('fix-validation')
  })
})

describe('getDeploymentNextSteps — compliance_hold', () => {
  it('returns compliance_hold outcome', () => {
    const result = getDeploymentNextSteps('compliance_hold')
    expect(result.outcome).toBe('compliance_hold')
  })

  it('includes complete-compliance as required step', () => {
    const result = getDeploymentNextSteps('compliance_hold')
    const step = result.nextSteps.find((s) => s.id === 'complete-compliance')
    expect(step?.priority).toBe('required')
    expect(step?.route).toBe('/compliance')
  })

  it('includes retry-launch step after compliance', () => {
    const result = getDeploymentNextSteps('compliance_hold')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('retry-launch')
  })
})

describe('getDeploymentNextSteps — network_error', () => {
  it('returns network_error outcome', () => {
    const result = getDeploymentNextSteps('network_error')
    expect(result.outcome).toBe('network_error')
  })

  it('uses red colour class', () => {
    const result = getDeploymentNextSteps('network_error')
    expect(result.colorClass).toContain('red')
  })

  it('includes check-network and retry steps', () => {
    const result = getDeploymentNextSteps('network_error')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('check-network')
    expect(ids).toContain('retry-launch')
  })

  it('check-network step has null route (user action required externally)', () => {
    const result = getDeploymentNextSteps('network_error')
    const step = result.nextSteps.find((s) => s.id === 'check-network')
    expect(step?.route).toBeNull()
  })
})

describe('getDeploymentNextSteps — rejected', () => {
  it('returns rejected outcome', () => {
    const result = getDeploymentNextSteps('rejected')
    expect(result.outcome).toBe('rejected')
  })

  it('includes fix-validation step', () => {
    const result = getDeploymentNextSteps('rejected')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('fix-validation')
  })

  it('includes contact-support as fallback', () => {
    const result = getDeploymentNextSteps('rejected')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('contact-support')
  })
})

describe('getDeploymentNextSteps — timeout', () => {
  it('returns timeout outcome', () => {
    const result = getDeploymentNextSteps('timeout')
    expect(result.outcome).toBe('timeout')
  })

  it('advises checking dashboard before retrying', () => {
    const result = getDeploymentNextSteps('timeout')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids[0]).toBe('view-dashboard')
  })

  it('uses amber colour class', () => {
    const result = getDeploymentNextSteps('timeout')
    expect(result.colorClass).toContain('amber')
  })
})

describe('getDeploymentNextSteps — unknown', () => {
  it('returns unknown outcome', () => {
    const result = getDeploymentNextSteps('unknown')
    expect(result.outcome).toBe('unknown')
  })

  it('includes retry and support steps', () => {
    const result = getDeploymentNextSteps('unknown')
    const ids = result.nextSteps.map((s) => s.id)
    expect(ids).toContain('retry-launch')
    expect(ids).toContain('contact-support')
  })

  it('falls through to unknown for an unrecognised outcome string', () => {
    const result = getDeploymentNextSteps('this-is-not-valid' as DeploymentOutcome)
    expect(result.outcome).toBe('unknown')
  })
})

describe('getDeploymentNextSteps — general invariants', () => {
  const outcomes: DeploymentOutcome[] = [
    'success', 'partial_success', 'validation_failed',
    'compliance_hold', 'network_error', 'rejected', 'timeout', 'unknown',
  ]

  it.each(outcomes)('always returns at least one next step for outcome "%s"', (outcome) => {
    const result = getDeploymentNextSteps(outcome)
    expect(result.nextSteps.length).toBeGreaterThan(0)
  })

  it.each(outcomes)('every step has a non-empty label for outcome "%s"', (outcome) => {
    const result = getDeploymentNextSteps(outcome)
    result.nextSteps.forEach((step) => {
      expect(step.label.trim().length).toBeGreaterThan(0)
    })
  })

  it.each(outcomes)('every step has a non-empty description for outcome "%s"', (outcome) => {
    const result = getDeploymentNextSteps(outcome)
    result.nextSteps.forEach((step) => {
      expect(step.description.trim().length).toBeGreaterThan(0)
    })
  })

  it.each(outcomes)('title is non-empty for outcome "%s"', (outcome) => {
    const result = getDeploymentNextSteps(outcome)
    expect(result.title.trim().length).toBeGreaterThan(0)
  })

  it.each(outcomes)('colorClass is non-empty for outcome "%s"', (outcome) => {
    const result = getDeploymentNextSteps(outcome)
    expect(result.colorClass.trim().length).toBeGreaterThan(0)
  })
})

// ─── classifyDeploymentError ───────────────────────────────────────────────────

describe('classifyDeploymentError', () => {
  it('returns validation_failed for validation error', () => {
    expect(classifyDeploymentError(new Error('validation failed'))).toBe('validation_failed')
  })

  it('returns validation_failed for "invalid" in message', () => {
    expect(classifyDeploymentError(new Error('invalid input'))).toBe('validation_failed')
  })

  it('returns validation_failed for "required field" in message', () => {
    expect(classifyDeploymentError(new Error('required field missing'))).toBe('validation_failed')
  })

  it('returns compliance_hold for compliance errors', () => {
    expect(classifyDeploymentError(new Error('compliance check failed'))).toBe('compliance_hold')
  })

  it('returns compliance_hold for kyc errors', () => {
    expect(classifyDeploymentError(new Error('kyc not complete'))).toBe('compliance_hold')
  })

  it('returns compliance_hold for hold keyword', () => {
    expect(classifyDeploymentError(new Error('account on hold'))).toBe('compliance_hold')
  })

  it('returns network_error for offline errors', () => {
    expect(classifyDeploymentError(new Error('offline'))).toBe('network_error')
  })

  it('returns network_error for fetch errors', () => {
    expect(classifyDeploymentError(new Error('fetch failed'))).toBe('network_error')
  })

  it('returns network_error for connection errors', () => {
    expect(classifyDeploymentError(new Error('connection refused'))).toBe('network_error')
  })

  it('returns rejected for rejection messages', () => {
    expect(classifyDeploymentError(new Error('transaction rejected'))).toBe('rejected')
  })

  it('returns rejected for "refused" keyword', () => {
    expect(classifyDeploymentError(new Error('request refused'))).toBe('rejected')
  })

  it('returns rejected for refused keyword', () => {
    expect(classifyDeploymentError(new Error('transaction refused by node'))).toBe('rejected')
  })

  it('returns timeout for timeout messages', () => {
    expect(classifyDeploymentError(new Error('request timeout'))).toBe('timeout')
  })

  it('returns timeout for "timed out" messages', () => {
    expect(classifyDeploymentError(new Error('timed out after 30s'))).toBe('timeout')
  })

  it('returns unknown for unrecognised errors', () => {
    expect(classifyDeploymentError(new Error('something weird happened'))).toBe('unknown')
  })

  it('returns unknown for empty message', () => {
    expect(classifyDeploymentError(new Error(''))).toBe('unknown')
  })

  it('handles non-Error thrown values (string)', () => {
    expect(classifyDeploymentError('validation failed')).toBe('validation_failed')
  })

  it('handles non-Error thrown values (unknown object)', () => {
    expect(classifyDeploymentError({ code: 42 })).toBe('unknown')
  })

  it('handles null thrown value', () => {
    expect(classifyDeploymentError(null)).toBe('unknown')
  })
})
