import { describe, it, expect } from 'vitest'
import {
  buildDefaultTrustSignals,
  computeTrustScore,
  getTrustLevel,
  getTrustLevelLabel,
  getTrustLevelColor,
  getTrustLevelDescription,
  getTrustImprovementAction,
  type TokenTrustData,
  type TrustLevel,
  type TrustSignal,
} from '../trustScoreCalculator'

describe('buildDefaultTrustSignals', () => {
  it('returns 8 signals for empty data', () => {
    expect(buildDefaultTrustSignals({})).toHaveLength(8)
  })

  it('all signals are absent for empty data', () => {
    const signals = buildDefaultTrustSignals({})
    signals.forEach(s => expect(s.present).toBe(false))
  })

  it('marks compliance-check present when hasComplianceCheck is true', () => {
    const signals = buildDefaultTrustSignals({ hasComplianceCheck: true })
    expect(signals.find(s => s.id === 'compliance-check')!.present).toBe(true)
  })

  it('marks identity-verified present when identityVerified is true', () => {
    const signals = buildDefaultTrustSignals({ identityVerified: true })
    expect(signals.find(s => s.id === 'identity-verified')!.present).toBe(true)
  })

  it('marks organization-verified present when organizationVerified is true', () => {
    const signals = buildDefaultTrustSignals({ organizationVerified: true })
    expect(signals.find(s => s.id === 'organization-verified')!.present).toBe(true)
  })

  it('marks attestation present when hasAttestation is true', () => {
    const signals = buildDefaultTrustSignals({ hasAttestation: true })
    expect(signals.find(s => s.id === 'attestation')!.present).toBe(true)
  })

  it('marks audit-trail present when hasAuditTrail is true', () => {
    const signals = buildDefaultTrustSignals({ hasAuditTrail: true })
    expect(signals.find(s => s.id === 'audit-trail')!.present).toBe(true)
  })

  it('marks token-metadata present when hasTokenMetadata is true', () => {
    const signals = buildDefaultTrustSignals({ hasTokenMetadata: true })
    expect(signals.find(s => s.id === 'token-metadata')!.present).toBe(true)
  })

  it('marks whitelist present when hasWhitelist is true', () => {
    const signals = buildDefaultTrustSignals({ hasWhitelist: true })
    expect(signals.find(s => s.id === 'whitelist')!.present).toBe(true)
  })

  it('marks legal-documentation present when hasLegalDocumentation is true', () => {
    const signals = buildDefaultTrustSignals({ hasLegalDocumentation: true })
    expect(signals.find(s => s.id === 'legal-documentation')!.present).toBe(true)
  })

  it('all weights are positive', () => {
    const signals = buildDefaultTrustSignals({})
    signals.forEach(s => expect(s.weight).toBeGreaterThan(0))
  })
})

describe('computeTrustScore', () => {
  it('returns score 0 for empty signals array', () => {
    const result = computeTrustScore([])
    expect(result.score).toBe(0)
    expect(result.level).toBe('unverified')
    expect(result.verifiedSignalCount).toBe(0)
    expect(result.totalSignalCount).toBe(0)
  })

  it('returns score 0 when all signals are absent', () => {
    const signals = buildDefaultTrustSignals({})
    const result = computeTrustScore(signals)
    expect(result.score).toBe(0)
    expect(result.level).toBe('unverified')
  })

  it('returns score 100 when all signals are present', () => {
    const data: TokenTrustData = {
      hasComplianceCheck: true,
      identityVerified: true,
      organizationVerified: true,
      hasAttestation: true,
      hasAuditTrail: true,
      hasTokenMetadata: true,
      hasWhitelist: true,
      hasLegalDocumentation: true,
    }
    const signals = buildDefaultTrustSignals(data)
    const result = computeTrustScore(signals)
    expect(result.score).toBe(100)
    expect(result.level).toBe('trusted')
    expect(result.verifiedSignalCount).toBe(8)
  })

  it('includes label, colorClass, description in result', () => {
    const result = computeTrustScore(buildDefaultTrustSignals({}))
    expect(result.label).toBeTruthy()
    expect(result.colorClass).toBeTruthy()
    expect(result.description).toBeTruthy()
  })

  it('sets correct verifiedSignalCount', () => {
    const signals = buildDefaultTrustSignals({ hasComplianceCheck: true, identityVerified: true })
    const result = computeTrustScore(signals)
    expect(result.verifiedSignalCount).toBe(2)
  })

  it('sets totalSignalCount to number of signals', () => {
    const signals = buildDefaultTrustSignals({})
    const result = computeTrustScore(signals)
    expect(result.totalSignalCount).toBe(8)
  })

  it('compliance check alone (weight 25) yields ~25% score from 8 signals totalling 100 weight', () => {
    const signals = buildDefaultTrustSignals({ hasComplianceCheck: true })
    const result = computeTrustScore(signals)
    expect(result.score).toBe(25)
  })

  it('returns level basic for score around 25', () => {
    const signals = buildDefaultTrustSignals({ hasComplianceCheck: true })
    const result = computeTrustScore(signals)
    expect(result.level).toBe('basic')
  })
})

describe('getTrustLevel', () => {
  const cases: [number, TrustLevel][] = [
    [0, 'unverified'],
    [24, 'unverified'],
    [25, 'basic'],
    [54, 'basic'],
    [55, 'verified'],
    [79, 'verified'],
    [80, 'trusted'],
    [100, 'trusted'],
  ]
  it.each(cases)('score %i → level %s', (score, expected) => {
    expect(getTrustLevel(score)).toBe(expected)
  })
})

describe('getTrustLevelLabel', () => {
  it('returns Unverified for unverified', () => {
    expect(getTrustLevelLabel('unverified')).toBe('Unverified')
  })
  it('returns Basic for basic', () => {
    expect(getTrustLevelLabel('basic')).toBe('Basic')
  })
  it('returns Verified for verified', () => {
    expect(getTrustLevelLabel('verified')).toBe('Verified')
  })
  it('returns Trusted for trusted', () => {
    expect(getTrustLevelLabel('trusted')).toBe('Trusted')
  })
})

describe('getTrustLevelColor', () => {
  it('returns gray color for unverified', () => {
    expect(getTrustLevelColor('unverified')).toBe('text-gray-400')
  })
  it('returns amber color for basic', () => {
    expect(getTrustLevelColor('basic')).toBe('text-amber-400')
  })
  it('returns blue color for verified', () => {
    expect(getTrustLevelColor('verified')).toBe('text-blue-400')
  })
  it('returns green color for trusted', () => {
    expect(getTrustLevelColor('trusted')).toBe('text-green-400')
  })
})

describe('getTrustLevelDescription', () => {
  it('returns non-empty string for each level', () => {
    const levels: TrustLevel[] = ['unverified', 'basic', 'verified', 'trusted']
    levels.forEach(l => {
      const desc = getTrustLevelDescription(l)
      expect(desc.length).toBeGreaterThan(10)
    })
  })

  it('unverified description mentions caution', () => {
    expect(getTrustLevelDescription('unverified')).toMatch(/caution/i)
  })

  it('trusted description is most positive', () => {
    const desc = getTrustLevelDescription('trusted')
    expect(desc).toMatch(/highest/i)
  })
})

describe('getTrustImprovementAction', () => {
  it('returns null when all signals are present', () => {
    const signals: TrustSignal[] = [
      { id: 'a', name: 'A', description: '', weight: 10, present: true },
      { id: 'b', name: 'B', description: '', weight: 5, present: true },
    ]
    expect(getTrustImprovementAction(signals)).toBeNull()
  })

  it('returns the absent signal with highest weight', () => {
    const signals: TrustSignal[] = [
      { id: 'low', name: 'Low', description: '', weight: 5, present: false },
      { id: 'high', name: 'High', description: '', weight: 25, present: false },
      { id: 'present', name: 'Present', description: '', weight: 20, present: true },
    ]
    const action = getTrustImprovementAction(signals)
    expect(action!.id).toBe('high')
  })

  it('returns null for empty signals', () => {
    expect(getTrustImprovementAction([])).toBeNull()
  })

  it('returns highest-weight absent signal from default signals', () => {
    // Only compliance (weight 25) is absent; all others are present
    const signals = buildDefaultTrustSignals({
      identityVerified: true,
      organizationVerified: true,
      hasAttestation: true,
      hasAuditTrail: true,
      hasTokenMetadata: true,
      hasWhitelist: true,
      hasLegalDocumentation: true,
    })
    const action = getTrustImprovementAction(signals)
    expect(action!.id).toBe('compliance-check')
  })
})
