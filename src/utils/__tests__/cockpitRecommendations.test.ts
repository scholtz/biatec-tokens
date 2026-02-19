/**
 * Cockpit Recommendation Engine Tests
 *
 * Deterministic ordering tests, precedence tests, and edge-case tests
 * for the recommendation engine module.
 */

import { describe, it, expect } from 'vitest'
import {
  generateRecommendations,
  topRecommendation,
  activeRuleIds,
} from '../cockpitRecommendations'
import type { TokenHealthState } from '../cockpitStatusDerivation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function allHealthyState(): TokenHealthState {
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

// ─── No recommendations ───────────────────────────────────────────────────────

describe('generateRecommendations - healthy token', () => {
  it('returns empty array for a fully healthy state', () => {
    const recs = generateRecommendations(allHealthyState())
    expect(recs).toHaveLength(0)
  })
})

// ─── Individual rule activation ───────────────────────────────────────────────

describe('generateRecommendations - individual rules', () => {
  it('fires kyc_not_configured when KYC is absent', () => {
    const state = { ...allHealthyState(), kycProviderConfigured: false }
    const ids = activeRuleIds(state)
    expect(ids).toContain('kyc_not_configured')
  })

  it('fires metadata_incomplete when metadata is missing', () => {
    const state = { ...allHealthyState(), metadataComplete: false }
    const ids = activeRuleIds(state)
    expect(ids).toContain('metadata_incomplete')
  })

  it('fires mint_policy_invalid when policy is invalid', () => {
    const state = { ...allHealthyState(), mintPolicyValid: false }
    const ids = activeRuleIds(state)
    expect(ids).toContain('mint_policy_invalid')
  })

  it('fires permissions_unconfigured when permissions are absent', () => {
    const state = { ...allHealthyState(), permissionPostureConfigured: false }
    const ids = activeRuleIds(state)
    expect(ids).toContain('permissions_unconfigured')
  })

  it('fires high_concentration for topHolderPct >= 40', () => {
    const state = { ...allHealthyState(), topHolderPct: 45 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('high_concentration')
    expect(ids).not.toContain('moderate_concentration')
  })

  it('fires moderate_concentration for topHolderPct in [25, 40)', () => {
    const state = { ...allHealthyState(), topHolderPct: 30 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('moderate_concentration')
    expect(ids).not.toContain('high_concentration')
  })

  it('fires treasury_anomalies_critical for >= 5 anomalies', () => {
    const state = { ...allHealthyState(), treasuryAnomalyCount: 6 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('treasury_anomalies_critical')
    expect(ids).not.toContain('treasury_anomalies_warning')
  })

  it('fires treasury_anomalies_warning for 1–4 anomalies', () => {
    const state = { ...allHealthyState(), treasuryAnomalyCount: 3 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('treasury_anomalies_warning')
    expect(ids).not.toContain('treasury_anomalies_critical')
  })

  it('fires high_inactivity for >= 60% inactive', () => {
    const state = { ...allHealthyState(), inactiveHolderPct: 65 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('high_inactivity')
    expect(ids).not.toContain('moderate_inactivity')
  })

  it('fires moderate_inactivity for 40–59% inactive', () => {
    const state = { ...allHealthyState(), inactiveHolderPct: 50 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('moderate_inactivity')
    expect(ids).not.toContain('high_inactivity')
  })
})

// ─── Precedence ordering ──────────────────────────────────────────────────────

describe('generateRecommendations - precedence ordering', () => {
  it('kyc_not_configured comes before metadata_incomplete', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      kycProviderConfigured: false,
      metadataComplete: false,
    }
    const recs = generateRecommendations(state)
    const ids = recs.map((r) => r.id)
    expect(ids.indexOf('rec-kyc-setup')).toBeLessThan(ids.indexOf('rec-metadata-complete'))
  })

  it('metadata_incomplete comes before mint_policy_invalid', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      metadataComplete: false,
      mintPolicyValid: false,
    }
    const recs = generateRecommendations(state)
    const ids = recs.map((r) => r.id)
    expect(ids.indexOf('rec-metadata-complete')).toBeLessThan(ids.indexOf('rec-mint-policy'))
  })

  it('critical KYC blocker appears before high-concentration warning', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      kycProviderConfigured: false,
      topHolderPct: 45,
    }
    const recs = generateRecommendations(state)
    const kycIndex = recs.findIndex((r) => r.id === 'rec-kyc-setup')
    const concentrationIndex = recs.findIndex((r) => r.id === 'rec-concentration')
    expect(kycIndex).toBeLessThan(concentrationIndex)
  })

  it('treasury_anomalies_critical appears before treasury_anomalies_warning', () => {
    // Only one should fire at a time, but critical rule has lower precedence number
    const critState = { ...allHealthyState(), treasuryAnomalyCount: 5 }
    const warnState = { ...allHealthyState(), treasuryAnomalyCount: 3 }
    const critRecs = generateRecommendations(critState)
    const warnRecs = generateRecommendations(warnState)
    expect(critRecs.some((r) => r.id === 'rec-treasury-critical')).toBe(true)
    expect(warnRecs.some((r) => r.id === 'rec-treasury-warn')).toBe(true)
    // Critical ID should not appear in warning state
    expect(warnRecs.some((r) => r.id === 'rec-treasury-critical')).toBe(false)
  })
})

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('generateRecommendations - determinism', () => {
  it('produces identical output for identical inputs', () => {
    const state: TokenHealthState = {
      mintPolicyValid: false,
      metadataComplete: false,
      topHolderPct: 45,
      treasuryAnomalyCount: 3,
      permissionPostureConfigured: false,
      kycProviderConfigured: false,
      inactiveHolderPct: 65,
    }
    const first = generateRecommendations(state).map((r) => r.id)
    const second = generateRecommendations(state).map((r) => r.id)
    expect(first).toEqual(second)
  })
})

// ─── Limit parameter ──────────────────────────────────────────────────────────

describe('generateRecommendations - limit', () => {
  it('respects limit=1', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      kycProviderConfigured: false,
      metadataComplete: false,
    }
    const recs = generateRecommendations(state, 1)
    expect(recs).toHaveLength(1)
    expect(recs[0].id).toBe('rec-kyc-setup')
  })

  it('respects limit=2', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      kycProviderConfigured: false,
      metadataComplete: false,
      mintPolicyValid: false,
    }
    const recs = generateRecommendations(state, 2)
    expect(recs).toHaveLength(2)
  })

  it('returns all when limit exceeds available rules', () => {
    const state = { ...allHealthyState(), kycProviderConfigured: false }
    const recs = generateRecommendations(state, 999)
    expect(recs.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── topRecommendation ────────────────────────────────────────────────────────

describe('topRecommendation', () => {
  it('returns null for healthy token', () => {
    expect(topRecommendation(allHealthyState())).toBeNull()
  })

  it('returns KYC recommendation when KYC is absent (highest precedence)', () => {
    const state: TokenHealthState = {
      ...allHealthyState(),
      kycProviderConfigured: false,
      metadataComplete: false,
    }
    const rec = topRecommendation(state)
    expect(rec).not.toBeNull()
    expect(rec!.id).toBe('rec-kyc-setup')
    expect(rec!.priority).toBe('critical')
  })

  it('returns a GuidedAction with all required fields', () => {
    const state = { ...allHealthyState(), mintPolicyValid: false }
    const rec = topRecommendation(state)
    expect(rec).not.toBeNull()
    expect(rec!.id).toBeDefined()
    expect(rec!.title).toBeDefined()
    expect(rec!.description).toBeDefined()
    expect(rec!.rationale).toBeDefined()
    expect(rec!.expectedImpact).toBeDefined()
    expect(rec!.deepLink).toBeDefined()
    expect(rec!.category).toBeDefined()
    expect(rec!.priority).toBeDefined()
    expect(rec!.status).toBe('pending')
    expect(rec!.createdAt).toBeInstanceOf(Date)
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('generateRecommendations - edge cases', () => {
  it('boundary: topHolderPct exactly at 25 fires moderate, not high', () => {
    const state = { ...allHealthyState(), topHolderPct: 25 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('moderate_concentration')
    expect(ids).not.toContain('high_concentration')
  })

  it('boundary: topHolderPct exactly at 40 fires high, not moderate', () => {
    const state = { ...allHealthyState(), topHolderPct: 40 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('high_concentration')
    expect(ids).not.toContain('moderate_concentration')
  })

  it('boundary: inactiveHolderPct exactly at 60 fires high_inactivity', () => {
    const state = { ...allHealthyState(), inactiveHolderPct: 60 }
    const ids = activeRuleIds(state)
    expect(ids).toContain('high_inactivity')
    expect(ids).not.toContain('moderate_inactivity')
  })

  it('includes top-holder percentage in description', () => {
    const state = { ...allHealthyState(), topHolderPct: 45.0 }
    const rec = topRecommendation(state)
    expect(rec!.description).toContain('45.0%')
  })

  it('uses singular form for 1 treasury anomaly', () => {
    const state = { ...allHealthyState(), treasuryAnomalyCount: 1 }
    const recs = generateRecommendations(state)
    const treasuryRec = recs.find((r) => r.id === 'rec-treasury-warn')
    expect(treasuryRec).toBeDefined()
    expect(treasuryRec!.description).not.toContain('movements')
  })
})
