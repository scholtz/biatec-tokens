/**
 * Integration tests: Competitive Platform Enhancements
 *
 * Tests the interactions between the three new utilities:
 * 1. launchPreflightValidator — preflight validation before token launch
 * 2. trustScoreCalculator — trust signal aggregation
 * 3. walletActivationCheckpoint — checkpoint persistence for wallet activation
 *
 * These tests validate that the utilities compose correctly and cover
 * cross-cutting concerns such as state transitions, edge cases, and
 * error recovery.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validatePreflightChecks,
  runTokenConfigCheck,
  runComplianceCheck,
  isPreflightPassed,
  type TokenLaunchConfig,
} from '../../utils/launchPreflightValidator'
import {
  buildDefaultTrustSignals,
  computeTrustScore,
  getTrustImprovementAction,
  getTrustLevel,
  type TokenTrustData,
} from '../../utils/trustScoreCalculator'
import {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  isCheckpointResumable,
  getResumeMessage,
} from '../../utils/walletActivationCheckpoint'

// ─── Preflight + Trust Score Integration ──────────────────────────────────────

describe('Preflight and Trust Score: correlated signals', () => {
  it('a fully configured token yields max trust score and passes preflight', () => {
    const config: TokenLaunchConfig = {
      tokenName: 'BiatecRWA',
      tokenSymbol: 'BRWA',
      totalSupply: 10_000_000,
      network: 'algorand',
      complianceComplete: true,
      identityVerified: true,
      organizationVerified: true,
      templateSelected: true,
    }
    const preflight = validatePreflightChecks(config)
    expect(isPreflightPassed(preflight)).toBe(true)

    const data: TokenTrustData = {
      hasComplianceCheck: config.complianceComplete,
      identityVerified: config.identityVerified,
      organizationVerified: config.organizationVerified,
      hasAttestation: true,
      hasAuditTrail: true,
      hasTokenMetadata: true,
      hasWhitelist: true,
      hasLegalDocumentation: true,
    }
    const trust = computeTrustScore(buildDefaultTrustSignals(data))
    expect(trust.level).toBe('trusted')
    expect(trust.score).toBe(100)
  })

  it('a token with no setup fails preflight and has unverified trust', () => {
    const preflight = validatePreflightChecks({})
    expect(isPreflightPassed(preflight)).toBe(false)

    const trust = computeTrustScore(buildDefaultTrustSignals({}))
    expect(trust.level).toBe('unverified')
    expect(trust.score).toBe(0)
  })

  it('adding organization verification fixes one required preflight failure and raises trust', () => {
    const withoutOrg = validatePreflightChecks({ organizationVerified: false })
    const withOrg = validatePreflightChecks({ organizationVerified: true, tokenName: 'T', tokenSymbol: 'TST', totalSupply: 1, network: 'algorand', templateSelected: true })

    const orgFailedCount = withoutOrg.failedRequired.filter(c => c.id === 'organization-verified').length
    expect(orgFailedCount).toBe(1)

    // Organization-verified check is now passing
    const orgCheck = withOrg.checks.find(c => c.id === 'organization-verified')
    expect(orgCheck!.status).toBe('pass')

    const trustWithout = computeTrustScore(buildDefaultTrustSignals({ organizationVerified: false }))
    const trustWith = computeTrustScore(buildDefaultTrustSignals({ organizationVerified: true }))
    expect(trustWith.score).toBeGreaterThan(trustWithout.score)
  })
})

// ─── Preflight Improvement Path ───────────────────────────────────────────────

describe('Preflight: step-by-step improvement path', () => {
  const steps: Array<{ field: keyof TokenLaunchConfig; value: unknown }> = [
    { field: 'organizationVerified', value: true },
    { field: 'templateSelected', value: true },
    { field: 'network', value: 'algorand' },
    { field: 'tokenName', value: 'MyToken' },
    { field: 'tokenSymbol', value: 'MTKN' },
    { field: 'totalSupply', value: 1_000_000 },
  ]

  it('each additional step reduces or maintains the failed required count', () => {
    let config: TokenLaunchConfig = {}
    let prevFailed = validatePreflightChecks(config).failedRequired.length

    for (const step of steps) {
      config = { ...config, [step.field]: step.value }
      const result = validatePreflightChecks(config)
      expect(result.failedRequired.length).toBeLessThanOrEqual(prevFailed)
      prevFailed = result.failedRequired.length
    }

    // After all steps: should pass
    expect(isPreflightPassed(validatePreflightChecks(config))).toBe(true)
  })
})

// ─── Trust Score Improvement Path ─────────────────────────────────────────────

describe('Trust Score: incremental improvement', () => {
  it('trust score increases monotonically as signals are added', () => {
    const fields: Array<keyof TokenTrustData> = [
      'hasComplianceCheck',
      'identityVerified',
      'organizationVerified',
      'hasAttestation',
      'hasAuditTrail',
      'hasTokenMetadata',
      'hasWhitelist',
      'hasLegalDocumentation',
    ]

    let data: TokenTrustData = {}
    let prevScore = 0

    for (const field of fields) {
      data = { ...data, [field]: true }
      const score = computeTrustScore(buildDefaultTrustSignals(data)).score
      expect(score).toBeGreaterThanOrEqual(prevScore)
      prevScore = score
    }

    expect(prevScore).toBe(100)
  })

  it('getTrustImprovementAction prioritises highest-weight absent signal', () => {
    // Only low-weight signals present; highest absent should be compliance (weight 25)
    const data: TokenTrustData = {
      hasWhitelist: true,
      hasLegalDocumentation: true,
      hasTokenMetadata: true,
    }
    const signals = buildDefaultTrustSignals(data)
    const action = getTrustImprovementAction(signals)
    // Compliance (25) > Identity (20) > Organization (15) > Attestation (15) > Audit (10)
    expect(action!.id).toBe('compliance-check')
  })
})

// ─── Checkpoint Integration ────────────────────────────────────────────────────

describe('Wallet Activation Checkpoint: journey persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('a new user has no resumable checkpoint', () => {
    const result = loadCheckpoint('new_user_journey')
    expect(isCheckpointResumable(result)).toBe(false)
  })

  it('saving step 2 makes journey resumable', () => {
    saveCheckpoint('j', 2, 4, [1])
    const result = loadCheckpoint('j')
    expect(isCheckpointResumable(result)).toBe(true)
    expect(result.checkpoint!.step).toBe(2)
  })

  it('clearing checkpoint removes resumability', () => {
    saveCheckpoint('j', 2, 4, [1])
    clearCheckpoint('j')
    expect(isCheckpointResumable(loadCheckpoint('j'))).toBe(false)
  })

  it('overwriting checkpoint updates step', () => {
    saveCheckpoint('j', 2, 4, [1])
    saveCheckpoint('j', 3, 4, [1, 2])
    const result = loadCheckpoint('j')
    expect(result.checkpoint!.step).toBe(3)
    expect(result.checkpoint!.completedSteps).toEqual([1, 2])
  })

  it('resume message includes correct step information', () => {
    saveCheckpoint('j', 3, 4, [1, 2])
    const result = loadCheckpoint('j')
    const msg = getResumeMessage(result.checkpoint!)
    expect(msg).toContain('3')
    expect(msg).toContain('4')
  })

  it('multiple journeys are independent', () => {
    saveCheckpoint('journey_a', 2, 4, [1])
    saveCheckpoint('journey_b', 3, 5, [1, 2])
    clearCheckpoint('journey_a')

    expect(isCheckpointResumable(loadCheckpoint('journey_a'))).toBe(false)
    expect(isCheckpointResumable(loadCheckpoint('journey_b'))).toBe(true)
    expect(loadCheckpoint('journey_b').checkpoint!.step).toBe(3)
  })
})

// ─── Compliance check edge cases ──────────────────────────────────────────────

describe('runComplianceCheck: edge cases', () => {
  it('treats undefined fields as missing (warnings/failures, not errors)', () => {
    const checks = runComplianceCheck({})
    // compliance and identity should be warnings; organization should be fail
    expect(checks.find(c => c.id === 'compliance-complete')!.status).toBe('warning')
    expect(checks.find(c => c.id === 'identity-verified')!.status).toBe('warning')
    expect(checks.find(c => c.id === 'organization-verified')!.status).toBe('fail')
  })
})

// ─── Token config edge cases ──────────────────────────────────────────────────

describe('runTokenConfigCheck: edge cases', () => {
  it('handles whitespace-only token name as fail', () => {
    const checks = runTokenConfigCheck({ tokenName: '  ' })
    expect(checks.find(c => c.id === 'token-name')!.status).toBe('fail')
  })

  it('passes supply of 1', () => {
    const checks = runTokenConfigCheck({ totalSupply: 1 })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('pass')
  })

  it('passes supply of 0.5 (positive fraction)', () => {
    // 0.5 > 0, so should pass
    const checks = runTokenConfigCheck({ totalSupply: 0.5 })
    expect(checks.find(c => c.id === 'total-supply')!.status).toBe('pass')
  })
})
