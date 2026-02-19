/**
 * Cockpit Status Derivation Utility Tests
 *
 * Exhaustive mapping tests for healthy/warning/critical states.
 * Each test verifies deterministic behaviour for known inputs.
 */

import { describe, it, expect } from 'vitest'
import {
  deriveMintPolicyStatus,
  deriveMetadataStatus,
  deriveConcentrationStatus,
  deriveTreasuryStatus,
  derivePermissionStatus,
  deriveKycStatus,
  deriveEngagementStatus,
  worstStatus,
  deriveHealthIndicators,
  healthStatusToRiskSeverity,
  healthStatusLabel,
  type TokenHealthState,
} from '../cockpitStatusDerivation'

// ─── Helper ───────────────────────────────────────────────────────────────────

function fullHealthyState(): TokenHealthState {
  return {
    mintPolicyValid: true,
    metadataComplete: true,
    topHolderPct: 10,
    treasuryAnomalyCount: 0,
    permissionPostureConfigured: true,
    kycProviderConfigured: true,
    inactiveHolderPct: 20,
  }
}

// ─── deriveMintPolicyStatus ───────────────────────────────────────────────────

describe('deriveMintPolicyStatus', () => {
  it('returns healthy when policy is valid', () => {
    expect(deriveMintPolicyStatus(true)).toBe('healthy')
  })

  it('returns critical when policy is invalid', () => {
    expect(deriveMintPolicyStatus(false)).toBe('critical')
  })
})

// ─── deriveMetadataStatus ─────────────────────────────────────────────────────

describe('deriveMetadataStatus', () => {
  it('returns healthy when metadata is complete', () => {
    expect(deriveMetadataStatus(true)).toBe('healthy')
  })

  it('returns critical when metadata is incomplete', () => {
    expect(deriveMetadataStatus(false)).toBe('critical')
  })
})

// ─── deriveConcentrationStatus ────────────────────────────────────────────────

describe('deriveConcentrationStatus', () => {
  it('returns healthy for 0%', () => {
    expect(deriveConcentrationStatus(0)).toBe('healthy')
  })

  it('returns healthy for 24%', () => {
    expect(deriveConcentrationStatus(24)).toBe('healthy')
  })

  it('returns warning at exactly 25%', () => {
    expect(deriveConcentrationStatus(25)).toBe('warning')
  })

  it('returns warning for 30%', () => {
    expect(deriveConcentrationStatus(30)).toBe('warning')
  })

  it('returns warning for 39%', () => {
    expect(deriveConcentrationStatus(39)).toBe('warning')
  })

  it('returns critical at exactly 40%', () => {
    expect(deriveConcentrationStatus(40)).toBe('critical')
  })

  it('returns critical for 100%', () => {
    expect(deriveConcentrationStatus(100)).toBe('critical')
  })
})

// ─── deriveTreasuryStatus ─────────────────────────────────────────────────────

describe('deriveTreasuryStatus', () => {
  it('returns healthy for 0 anomalies', () => {
    expect(deriveTreasuryStatus(0)).toBe('healthy')
  })

  it('returns warning for 1 anomaly', () => {
    expect(deriveTreasuryStatus(1)).toBe('warning')
  })

  it('returns warning for 4 anomalies', () => {
    expect(deriveTreasuryStatus(4)).toBe('warning')
  })

  it('returns critical for exactly 5 anomalies', () => {
    expect(deriveTreasuryStatus(5)).toBe('critical')
  })

  it('returns critical for 10 anomalies', () => {
    expect(deriveTreasuryStatus(10)).toBe('critical')
  })
})

// ─── derivePermissionStatus ───────────────────────────────────────────────────

describe('derivePermissionStatus', () => {
  it('returns healthy when configured', () => {
    expect(derivePermissionStatus(true)).toBe('healthy')
  })

  it('returns critical when not configured', () => {
    expect(derivePermissionStatus(false)).toBe('critical')
  })
})

// ─── deriveKycStatus ──────────────────────────────────────────────────────────

describe('deriveKycStatus', () => {
  it('returns healthy when KYC is configured', () => {
    expect(deriveKycStatus(true)).toBe('healthy')
  })

  it('returns critical when KYC is not configured', () => {
    expect(deriveKycStatus(false)).toBe('critical')
  })
})

// ─── deriveEngagementStatus ───────────────────────────────────────────────────

describe('deriveEngagementStatus', () => {
  it('returns healthy for 0% inactivity', () => {
    expect(deriveEngagementStatus(0)).toBe('healthy')
  })

  it('returns healthy for 39% inactivity', () => {
    expect(deriveEngagementStatus(39)).toBe('healthy')
  })

  it('returns warning at exactly 40% inactivity', () => {
    expect(deriveEngagementStatus(40)).toBe('warning')
  })

  it('returns warning for 59% inactivity', () => {
    expect(deriveEngagementStatus(59)).toBe('warning')
  })

  it('returns critical at exactly 60% inactivity', () => {
    expect(deriveEngagementStatus(60)).toBe('critical')
  })

  it('returns critical for 100% inactivity', () => {
    expect(deriveEngagementStatus(100)).toBe('critical')
  })
})

// ─── worstStatus ──────────────────────────────────────────────────────────────

describe('worstStatus', () => {
  it('returns healthy when all are healthy', () => {
    expect(worstStatus(['healthy', 'healthy'])).toBe('healthy')
  })

  it('returns warning when at least one warning and no critical', () => {
    expect(worstStatus(['healthy', 'warning', 'healthy'])).toBe('warning')
  })

  it('returns critical when at least one critical', () => {
    expect(worstStatus(['healthy', 'warning', 'critical'])).toBe('critical')
  })

  it('returns critical even when all are critical', () => {
    expect(worstStatus(['critical', 'critical'])).toBe('critical')
  })

  it('returns healthy for an empty list', () => {
    expect(worstStatus([])).toBe('healthy')
  })

  it('critical overrides warning', () => {
    expect(worstStatus(['warning', 'critical'])).toBe('critical')
  })
})

// ─── deriveHealthIndicators ───────────────────────────────────────────────────

describe('deriveHealthIndicators', () => {
  it('returns all healthy for a fully healthy token', () => {
    const indicators = deriveHealthIndicators(fullHealthyState())
    expect(indicators.mintPolicy).toBe('healthy')
    expect(indicators.metadataCompleteness).toBe('healthy')
    expect(indicators.holderConcentration).toBe('healthy')
    expect(indicators.treasuryMovements).toBe('healthy')
    expect(indicators.permissionPosture).toBe('healthy')
    expect(indicators.kycCompliance).toBe('healthy')
    expect(indicators.holderEngagement).toBe('healthy')
    expect(indicators.overall).toBe('healthy')
  })

  it('overall is critical when any dimension is critical', () => {
    const state = { ...fullHealthyState(), mintPolicyValid: false }
    const indicators = deriveHealthIndicators(state)
    expect(indicators.mintPolicy).toBe('critical')
    expect(indicators.overall).toBe('critical')
  })

  it('overall is warning when only warning-level issues exist', () => {
    const state = { ...fullHealthyState(), topHolderPct: 30, treasuryAnomalyCount: 0 }
    const indicators = deriveHealthIndicators(state)
    expect(indicators.holderConcentration).toBe('warning')
    expect(indicators.overall).toBe('warning')
  })

  it('propagates multiple critical issues correctly', () => {
    const state: TokenHealthState = {
      mintPolicyValid: false,
      metadataComplete: false,
      topHolderPct: 50,
      treasuryAnomalyCount: 10,
      permissionPostureConfigured: false,
      kycProviderConfigured: false,
      inactiveHolderPct: 80,
    }
    const indicators = deriveHealthIndicators(state)
    expect(indicators.overall).toBe('critical')
  })

  it('is deterministic: same input always produces same output', () => {
    const state = fullHealthyState()
    const r1 = deriveHealthIndicators(state)
    const r2 = deriveHealthIndicators(state)
    expect(r1).toEqual(r2)
  })
})

// ─── healthStatusToRiskSeverity ───────────────────────────────────────────────

describe('healthStatusToRiskSeverity', () => {
  it('maps critical to critical', () => {
    expect(healthStatusToRiskSeverity('critical')).toBe('critical')
  })

  it('maps warning to medium', () => {
    expect(healthStatusToRiskSeverity('warning')).toBe('medium')
  })

  it('maps healthy to none', () => {
    expect(healthStatusToRiskSeverity('healthy')).toBe('none')
  })
})

// ─── healthStatusLabel ────────────────────────────────────────────────────────

describe('healthStatusLabel', () => {
  it('returns Healthy for healthy', () => {
    expect(healthStatusLabel('healthy')).toBe('Healthy')
  })

  it('returns Needs Attention for warning', () => {
    expect(healthStatusLabel('warning')).toBe('Needs Attention')
  })

  it('returns Action Required for critical', () => {
    expect(healthStatusLabel('critical')).toBe('Action Required')
  })
})
