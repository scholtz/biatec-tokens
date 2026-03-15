/**
 * Unit tests: Release Readiness Workspace — utility logic
 *
 * Verifies all derivation functions, state machines, freshness calculations,
 * owner assignment, and CSS helpers for the strict sign-off readiness feature.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  type SignOffReadinessState,
  type EvidenceDimension,
  type ConfigurationDependency,
  SIGN_OFF_READINESS_LABELS,
  SIGN_OFF_READINESS_DESCRIPTIONS,
  OWNER_DOMAIN_NEXT_ACTION_LABELS,
  NEXT_ACTION_IDS,
  EVIDENCE_FRESHNESS_DAYS,
  EVIDENCE_FRESHNESS_MS,
  isSignOffBlocking,
  isSignOffClear,
  evidenceAgeMs,
  isSignOffEvidenceStale,
  formatEvidenceFreshnessLabel,
  deriveDimensionState,
  computeOverallReadinessState,
  deriveNextActions,
  deriveReadinessHeadline,
  deriveReadinessRationale,
  buildDefaultEvidenceDimensions,
  buildDefaultConfigDependencies,
  deriveReleaseReadiness,
  buildDefaultReleaseReadiness,
  readinessStateBadgeClass,
  dimensionCardBorderClass,
  dimensionCardBgClass,
  readinessBannerClass,
  readinessBannerTextClass,
  ownerDomainDisplayName,
} from '../releaseReadiness'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-03-15T12:00:00.000Z')

const freshTimestamp = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days old
const staleTimestamp = new Date(NOW.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days old (> 30 day threshold)

function makeDimension(overrides: Partial<EvidenceDimension> = {}): EvidenceDimension {
  return {
    id: 'test-dim',
    title: 'Test Dimension',
    description: 'Test description',
    state: 'ready',
    isLaunchCritical: true,
    lastEvidenceAt: freshTimestamp,
    freshnessLabel: '5 days ago',
    ownerDomain: 'compliance',
    nextActionSummary: 'Take action',
    evidencePath: '/compliance/reporting',
    ...overrides,
  }
}

function makeConfigDep(overrides: Partial<ConfigurationDependency> = {}): ConfigurationDependency {
  return {
    id: 'test-config',
    label: 'Test Config',
    description: 'Test config description',
    isConfigured: true,
    isRequired: true,
    ownerDomain: 'shared_ops',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1. Constants
// ---------------------------------------------------------------------------

describe('SIGN_OFF_READINESS_LABELS', () => {
  it('covers all states', () => {
    const states: SignOffReadinessState[] = [
      'ready',
      'stale_evidence',
      'missing_evidence',
      'configuration_blocked',
      'advisory_follow_up',
    ]
    for (const s of states) {
      expect(SIGN_OFF_READINESS_LABELS[s]).toBeTruthy()
    }
  })
})

describe('SIGN_OFF_READINESS_DESCRIPTIONS', () => {
  it('covers all states', () => {
    const states: SignOffReadinessState[] = [
      'ready',
      'stale_evidence',
      'missing_evidence',
      'configuration_blocked',
      'advisory_follow_up',
    ]
    for (const s of states) {
      expect(SIGN_OFF_READINESS_DESCRIPTIONS[s]).toBeTruthy()
      expect(SIGN_OFF_READINESS_DESCRIPTIONS[s].length).toBeGreaterThan(10)
    }
  })
})

describe('OWNER_DOMAIN_NEXT_ACTION_LABELS', () => {
  it('covers all owner domains', () => {
    const domains = ['compliance', 'legal', 'procurement', 'executive', 'shared_ops', 'unassigned'] as const
    for (const d of domains) {
      expect(OWNER_DOMAIN_NEXT_ACTION_LABELS[d]).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 2. isSignOffBlocking / isSignOffClear
// ---------------------------------------------------------------------------

describe('isSignOffBlocking', () => {
  it('returns true for missing_evidence', () => {
    expect(isSignOffBlocking('missing_evidence')).toBe(true)
  })

  it('returns true for configuration_blocked', () => {
    expect(isSignOffBlocking('configuration_blocked')).toBe(true)
  })

  it('returns true for stale_evidence', () => {
    expect(isSignOffBlocking('stale_evidence')).toBe(true)
  })

  it('returns false for ready', () => {
    expect(isSignOffBlocking('ready')).toBe(false)
  })

  it('returns false for advisory_follow_up', () => {
    expect(isSignOffBlocking('advisory_follow_up')).toBe(false)
  })
})

describe('isSignOffClear', () => {
  it('returns true for ready', () => {
    expect(isSignOffClear('ready')).toBe(true)
  })

  it('returns true for advisory_follow_up', () => {
    expect(isSignOffClear('advisory_follow_up')).toBe(true)
  })

  it('returns false for blocking states', () => {
    expect(isSignOffClear('missing_evidence')).toBe(false)
    expect(isSignOffClear('configuration_blocked')).toBe(false)
    expect(isSignOffClear('stale_evidence')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Freshness helpers
// ---------------------------------------------------------------------------

describe('evidenceAgeMs', () => {
  it('returns null for null timestamp', () => {
    expect(evidenceAgeMs(null, NOW)).toBeNull()
  })

  it('returns null for invalid timestamp', () => {
    expect(evidenceAgeMs('not-a-date', NOW)).toBeNull()
  })

  it('returns correct age in milliseconds', () => {
    const fiveDaysAgo = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const age = evidenceAgeMs(fiveDaysAgo, NOW)
    expect(age).not.toBeNull()
    expect(age!).toBeCloseTo(5 * 24 * 60 * 60 * 1000, -3)
  })

  it('returns 0-ish age for very recent timestamp', () => {
    const justNow = NOW.toISOString()
    const age = evidenceAgeMs(justNow, NOW)
    expect(age).not.toBeNull()
    expect(age!).toBeGreaterThanOrEqual(0)
    expect(age!).toBeLessThan(1000)
  })
})

describe('isSignOffEvidenceStale', () => {
  it('returns false for null', () => {
    expect(isSignOffEvidenceStale(null, NOW)).toBe(false)
  })

  it('returns false for invalid timestamp', () => {
    expect(isSignOffEvidenceStale('invalid', NOW)).toBe(false)
  })

  it('returns false for fresh evidence (5 days old)', () => {
    expect(isSignOffEvidenceStale(freshTimestamp, NOW)).toBe(false)
  })

  it('returns true for stale evidence (35 days old, threshold is 30)', () => {
    expect(isSignOffEvidenceStale(staleTimestamp, NOW)).toBe(true)
  })

  it('returns false for evidence exactly at the threshold (30 days)', () => {
    const exactThreshold = new Date(NOW.getTime() - EVIDENCE_FRESHNESS_MS).toISOString()
    // Exactly at threshold is NOT stale (> not >=)
    expect(isSignOffEvidenceStale(exactThreshold, NOW)).toBe(false)
  })

  it('returns true for evidence just over the threshold', () => {
    const justOver = new Date(NOW.getTime() - EVIDENCE_FRESHNESS_MS - 1000).toISOString()
    expect(isSignOffEvidenceStale(justOver, NOW)).toBe(true)
  })
})

describe('formatEvidenceFreshnessLabel', () => {
  it('returns "Never" for null timestamp', () => {
    expect(formatEvidenceFreshnessLabel(null, NOW)).toBe('Never')
  })

  it('returns "Never" for invalid timestamp', () => {
    expect(formatEvidenceFreshnessLabel('invalid', NOW)).toBe('Never')
  })

  it('returns "Just now" for very recent timestamp', () => {
    const justNow = new Date(NOW.getTime() - 30_000).toISOString() // 30 seconds ago
    expect(formatEvidenceFreshnessLabel(justNow, NOW)).toBe('Just now')
  })

  it('returns "X minutes ago" for recent timestamps', () => {
    const thirtyMinsAgo = new Date(NOW.getTime() - 30 * 60_000).toISOString()
    expect(formatEvidenceFreshnessLabel(thirtyMinsAgo, NOW)).toBe('30 minutes ago')
  })

  it('returns singular form for 1 minute ago', () => {
    const oneMinAgo = new Date(NOW.getTime() - 60_001).toISOString()
    expect(formatEvidenceFreshnessLabel(oneMinAgo, NOW)).toBe('1 minute ago')
  })

  it('returns "X hours ago" for hour-range timestamps', () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 3600_000).toISOString()
    expect(formatEvidenceFreshnessLabel(threeHoursAgo, NOW)).toBe('3 hours ago')
  })

  it('returns singular form for 1 hour ago', () => {
    const oneHourAgo = new Date(NOW.getTime() - 3600_001).toISOString()
    expect(formatEvidenceFreshnessLabel(oneHourAgo, NOW)).toBe('1 hour ago')
  })

  it('returns "X days ago" for multi-day timestamps', () => {
    expect(formatEvidenceFreshnessLabel(freshTimestamp, NOW)).toBe('5 days ago')
  })

  it('returns "35 days ago" for stale evidence', () => {
    expect(formatEvidenceFreshnessLabel(staleTimestamp, NOW)).toBe('35 days ago')
  })

  it('returns singular form for 1 day ago', () => {
    const oneDayAgo = new Date(NOW.getTime() - 24 * 3600_000 - 1000).toISOString()
    expect(formatEvidenceFreshnessLabel(oneDayAgo, NOW)).toBe('1 day ago')
  })
})

// ---------------------------------------------------------------------------
// 4. deriveDimensionState
// ---------------------------------------------------------------------------

describe('deriveDimensionState', () => {
  it('returns configuration_blocked when not configured', () => {
    expect(deriveDimensionState(false, freshTimestamp, NOW)).toBe('configuration_blocked')
  })

  it('returns configuration_blocked when not configured even with timestamp', () => {
    expect(deriveDimensionState(false, freshTimestamp, NOW)).toBe('configuration_blocked')
  })

  it('returns missing_evidence when configured but no evidence', () => {
    expect(deriveDimensionState(true, null, NOW)).toBe('missing_evidence')
  })

  it('returns stale_evidence when configured and evidence is stale', () => {
    expect(deriveDimensionState(true, staleTimestamp, NOW)).toBe('stale_evidence')
  })

  it('returns ready when configured and evidence is fresh', () => {
    expect(deriveDimensionState(true, freshTimestamp, NOW)).toBe('ready')
  })
})

// ---------------------------------------------------------------------------
// 5. computeOverallReadinessState
// ---------------------------------------------------------------------------

describe('computeOverallReadinessState', () => {
  it('returns ready when all dimensions are ready', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'ready', isLaunchCritical: true }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('ready')
  })

  it('returns missing_evidence when a critical dimension is missing', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'missing_evidence', isLaunchCritical: true }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('missing_evidence')
  })

  it('prioritises missing_evidence over configuration_blocked', () => {
    const dims = [
      makeDimension({ state: 'configuration_blocked', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'missing_evidence', isLaunchCritical: true }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('missing_evidence')
  })

  it('returns configuration_blocked when a critical dimension is blocked and none missing', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'configuration_blocked', isLaunchCritical: true }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('configuration_blocked')
  })

  it('returns stale_evidence when a critical dimension is stale', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: true }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('stale_evidence')
  })

  it('returns advisory_follow_up when all critical dims are ready but advisory dims are not', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('advisory_follow_up')
  })

  it('returns ready when all dimensions including non-critical are ready', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'ready', isLaunchCritical: false }),
    ]
    expect(computeOverallReadinessState(dims)).toBe('ready')
  })

  it('does not promote non-critical missing to overall blocking', () => {
    const dims = [
      makeDimension({ state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'missing_evidence', isLaunchCritical: false }),
    ]
    // Missing but not launch-critical → advisory_follow_up
    expect(computeOverallReadinessState(dims)).toBe('advisory_follow_up')
  })

  it('returns ready for empty dimensions list', () => {
    expect(computeOverallReadinessState([])).toBe('ready')
  })
})

// ---------------------------------------------------------------------------
// 6. deriveNextActions
// ---------------------------------------------------------------------------

describe('deriveNextActions', () => {
  it('returns empty array when all dimensions are ready and no config gaps', () => {
    const dims = [makeDimension({ state: 'ready' })]
    const configs = [makeConfigDep({ isConfigured: true })]
    const actions = deriveNextActions(dims, configs)
    expect(actions).toHaveLength(0)
  })

  it('includes config-missing action when required config not configured', () => {
    const dims = [makeDimension({ state: 'ready' })]
    const configs = [makeConfigDep({ isConfigured: false, isRequired: true })]
    const actions = deriveNextActions(dims, configs)
    const configAction = actions.find((a) => a.id === NEXT_ACTION_IDS.CONFIG_MISSING)
    expect(configAction).toBeDefined()
    expect(configAction!.isLaunchBlocking).toBe(true)
  })

  it('does not include config action for non-required unconfigured deps', () => {
    const dims = [makeDimension({ state: 'ready' })]
    const configs = [makeConfigDep({ isConfigured: false, isRequired: false })]
    const actions = deriveNextActions(dims, configs)
    expect(actions.find((a) => a.id === NEXT_ACTION_IDS.CONFIG_MISSING)).toBeUndefined()
  })

  it('includes evidence-missing action for missing critical dimensions', () => {
    const dims = [makeDimension({ state: 'missing_evidence', isLaunchCritical: true })]
    const configs = [makeConfigDep({ isConfigured: true })]
    const actions = deriveNextActions(dims, configs)
    const missingAction = actions.find((a) => a.id === NEXT_ACTION_IDS.EVIDENCE_MISSING)
    expect(missingAction).toBeDefined()
    expect(missingAction!.isLaunchBlocking).toBe(true)
    expect(missingAction!.dimensionIds).toContain('test-dim')
  })

  it('includes evidence-stale action for stale critical dimensions', () => {
    const dims = [makeDimension({ state: 'stale_evidence', isLaunchCritical: true })]
    const configs = [makeConfigDep({ isConfigured: true })]
    const actions = deriveNextActions(dims, configs)
    const staleAction = actions.find((a) => a.id === NEXT_ACTION_IDS.EVIDENCE_STALE)
    expect(staleAction).toBeDefined()
    expect(staleAction!.isLaunchBlocking).toBe(true)
  })

  it('includes advisory action for non-critical non-ready dimensions', () => {
    const dims = [makeDimension({ state: 'stale_evidence', isLaunchCritical: false })]
    const configs = [makeConfigDep({ isConfigured: true })]
    const actions = deriveNextActions(dims, configs)
    const advisoryAction = actions.find((a) => a.id === NEXT_ACTION_IDS.ADVISORY_IMPROVEMENTS)
    expect(advisoryAction).toBeDefined()
    expect(advisoryAction!.isLaunchBlocking).toBe(false)
  })

  it('does not produce a stale action for non-critical stale dimensions', () => {
    // Non-critical stale dims go to advisory, not to the blocking stale action
    const dims = [makeDimension({ state: 'stale_evidence', isLaunchCritical: false })]
    const actions = deriveNextActions(dims, [])
    expect(actions.find((a) => a.id === NEXT_ACTION_IDS.EVIDENCE_STALE)).toBeUndefined()
    expect(actions.find((a) => a.id === NEXT_ACTION_IDS.ADVISORY_IMPROVEMENTS)).toBeDefined()
  })

  it('can include multiple actions simultaneously', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'missing_evidence', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
    ]
    const configs = [makeConfigDep({ isConfigured: false, isRequired: true })]
    const actions = deriveNextActions(dims, configs)
    // Should have: config-missing, evidence-missing, advisory-improvements
    expect(actions.map((a) => a.id)).toEqual(
      expect.arrayContaining([
        NEXT_ACTION_IDS.CONFIG_MISSING,
        NEXT_ACTION_IDS.EVIDENCE_MISSING,
        NEXT_ACTION_IDS.ADVISORY_IMPROVEMENTS,
      ]),
    )
  })

  it('uses shared_ops owner when multiple config deps have different owners', () => {
    const dims: EvidenceDimension[] = []
    const configs = [
      makeConfigDep({ isConfigured: false, isRequired: true, ownerDomain: 'compliance' }),
      makeConfigDep({ id: 'dep2', isConfigured: false, isRequired: true, ownerDomain: 'legal' }),
    ]
    const actions = deriveNextActions(dims, configs)
    const configAction = actions.find((a) => a.id === NEXT_ACTION_IDS.CONFIG_MISSING)
    expect(configAction).toBeDefined()
    // Multiple owners → canonical shared_ops attribution
    expect(configAction!.ownerDomain).toBe('shared_ops')
  })

  it('uses the single owner when all missing config deps share one owner', () => {
    const dims: EvidenceDimension[] = []
    const configs = [
      makeConfigDep({ isConfigured: false, isRequired: true, ownerDomain: 'compliance' }),
      makeConfigDep({ id: 'dep2', isConfigured: false, isRequired: true, ownerDomain: 'compliance' }),
    ]
    const actions = deriveNextActions(dims, configs)
    const configAction = actions.find((a) => a.id === NEXT_ACTION_IDS.CONFIG_MISSING)
    expect(configAction).toBeDefined()
    // Single shared owner → use that owner
    expect(configAction!.ownerDomain).toBe('compliance')
  })
})

// ---------------------------------------------------------------------------
// 7. deriveReadinessHeadline
// ---------------------------------------------------------------------------

describe('deriveReadinessHeadline', () => {
  it('returns affirmative headline for ready', () => {
    const h = deriveReadinessHeadline('ready', 0, 0)
    expect(h).toBeTruthy()
    expect(h.toLowerCase()).toContain('all')
  })

  it('returns count-based headline for missing_evidence', () => {
    const h = deriveReadinessHeadline('missing_evidence', 2, 0)
    expect(h).toContain('2')
  })

  it('uses singular form for 1 missing dimension', () => {
    const h = deriveReadinessHeadline('missing_evidence', 1, 0)
    expect(h).toContain('1')
    expect(h).not.toContain('1 required evidence dimensions')
  })

  it('returns config-based headline for configuration_blocked', () => {
    const h = deriveReadinessHeadline('configuration_blocked', 0, 3)
    expect(h).toContain('3')
    expect(h.toLowerCase()).toContain('configuration')
  })

  it('returns stale headline for stale_evidence', () => {
    const h = deriveReadinessHeadline('stale_evidence', 1, 0)
    expect(h.toLowerCase()).toContain('fresh')
  })

  it('returns advisory headline for advisory_follow_up', () => {
    const h = deriveReadinessHeadline('advisory_follow_up', 0, 0)
    expect(h.toLowerCase()).toContain('advisory')
  })
})

// ---------------------------------------------------------------------------
// 8. deriveReadinessRationale
// ---------------------------------------------------------------------------

describe('deriveReadinessRationale', () => {
  const states: SignOffReadinessState[] = [
    'ready',
    'stale_evidence',
    'missing_evidence',
    'configuration_blocked',
    'advisory_follow_up',
  ]

  it('returns non-empty rationale for all states', () => {
    for (const s of states) {
      const r = deriveReadinessRationale(s)
      expect(r).toBeTruthy()
      expect(r.length).toBeGreaterThan(20)
    }
  })

  it('uses fail-closed language for blocking states', () => {
    const missing = deriveReadinessRationale('missing_evidence')
    expect(missing.toLowerCase()).toContain('blocker')

    const configBlocked = deriveReadinessRationale('configuration_blocked')
    expect(configBlocked.toLowerCase()).toContain('block')
  })
})

// ---------------------------------------------------------------------------
// 9. buildDefaultEvidenceDimensions
// ---------------------------------------------------------------------------

describe('buildDefaultEvidenceDimensions', () => {
  it('returns 4 dimensions', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    expect(dims).toHaveLength(4)
  })

  it('every dimension has required fields', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    for (const d of dims) {
      expect(d.id).toBeTruthy()
      expect(d.title).toBeTruthy()
      expect(d.description).toBeTruthy()
      expect(d.ownerDomain).toBeTruthy()
      expect(d.nextActionSummary).toBeTruthy()
      expect(SIGN_OFF_READINESS_LABELS[d.state]).toBeTruthy()
    }
  })

  it('strict-run-execution is configuration_blocked (backend not configured)', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    const runDim = dims.find((d) => d.id === 'strict-run-execution')
    expect(runDim).toBeDefined()
    expect(runDim!.state).toBe('configuration_blocked')
    expect(runDim!.isLaunchCritical).toBe(true)
  })

  it('integration-validation is stale (35 days old)', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    const integDim = dims.find((d) => d.id === 'integration-validation')
    expect(integDim).toBeDefined()
    expect(integDim!.state).toBe('stale_evidence')
    expect(integDim!.isLaunchCritical).toBe(true)
  })

  it('approval-sign-off is advisory_follow_up', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    const approvalDim = dims.find((d) => d.id === 'approval-sign-off')
    expect(approvalDim).toBeDefined()
    expect(approvalDim!.state).toBe('advisory_follow_up')
    expect(approvalDim!.isLaunchCritical).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 10. buildDefaultConfigDependencies
// ---------------------------------------------------------------------------

describe('buildDefaultConfigDependencies', () => {
  it('returns 3 config dependencies', () => {
    const deps = buildDefaultConfigDependencies()
    expect(deps).toHaveLength(3)
  })

  it('required deps are not configured (MVP blocker state)', () => {
    const deps = buildDefaultConfigDependencies()
    const required = deps.filter((d) => d.isRequired)
    expect(required.length).toBeGreaterThan(0)
    for (const d of required) {
      expect(d.isConfigured).toBe(false)
    }
  })

  it('every dep has an id, label, description, and owner domain', () => {
    const deps = buildDefaultConfigDependencies()
    for (const d of deps) {
      expect(d.id).toBeTruthy()
      expect(d.label).toBeTruthy()
      expect(d.description).toBeTruthy()
      expect(d.ownerDomain).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 11. deriveReleaseReadiness
// ---------------------------------------------------------------------------

describe('deriveReleaseReadiness', () => {
  it('produces a complete ReleaseReadinessState', () => {
    const dims = buildDefaultEvidenceDimensions(NOW)
    const configs = buildDefaultConfigDependencies()
    const state = deriveReleaseReadiness(dims, configs, null, null, NOW)

    expect(state.overallState).toBeTruthy()
    expect(state.headline).toBeTruthy()
    expect(state.rationale).toBeTruthy()
    expect(state.dimensions).toHaveLength(dims.length)
    expect(state.configDependencies).toHaveLength(configs.length)
    expect(state.computedAt).toBe(NOW.toISOString())
  })

  it('sets launchBlockingCount correctly', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'missing_evidence', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: true }),
      makeDimension({ id: 'd3', state: 'ready', isLaunchCritical: true }),
    ]
    const state = deriveReleaseReadiness(dims, [], null, null, NOW)
    // d1 and d2 are blocking (not ready)
    expect(state.launchBlockingCount).toBe(2)
  })

  it('sets staleCount correctly', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'stale_evidence', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
      makeDimension({ id: 'd3', state: 'ready', isLaunchCritical: true }),
    ]
    const state = deriveReleaseReadiness(dims, [], null, null, NOW)
    expect(state.staleCount).toBe(2)
  })

  it('sets missingConfigCount correctly', () => {
    const configs = [
      makeConfigDep({ id: 'c1', isConfigured: false, isRequired: true }),
      makeConfigDep({ id: 'c2', isConfigured: false, isRequired: true }),
      makeConfigDep({ id: 'c3', isConfigured: true, isRequired: true }),
    ]
    const state = deriveReleaseReadiness([], configs, null, null, NOW)
    expect(state.missingConfigCount).toBe(2)
  })

  it('propagates lastProtectedRunAt and lastRunSucceeded', () => {
    const state = deriveReleaseReadiness([], [], freshTimestamp, true, NOW)
    expect(state.lastProtectedRunAt).toBe(freshTimestamp)
    expect(state.lastRunSucceeded).toBe(true)
    expect(state.lastProtectedRunLabel).toBe('5 days ago')
  })

  it('handles null lastProtectedRunAt', () => {
    const state = deriveReleaseReadiness([], [], null, null, NOW)
    expect(state.lastProtectedRunAt).toBeNull()
    expect(state.lastRunSucceeded).toBeNull()
    expect(state.lastProtectedRunLabel).toBe('Never')
  })

  it('derives next actions from blocking dimensions', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'missing_evidence', isLaunchCritical: true }),
    ]
    const state = deriveReleaseReadiness(dims, [], null, null, NOW)
    expect(state.nextActions.length).toBeGreaterThan(0)
    expect(state.nextActions.some((a) => a.id === 'evidence-missing')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 12. buildDefaultReleaseReadiness
// ---------------------------------------------------------------------------

describe('buildDefaultReleaseReadiness', () => {
  it('builds a well-formed default state', () => {
    const state = buildDefaultReleaseReadiness(NOW)
    expect(state.overallState).toBeTruthy()
    expect(state.dimensions.length).toBeGreaterThan(0)
    expect(state.configDependencies.length).toBeGreaterThan(0)
    expect(state.computedAt).toBeTruthy()
  })

  it('reflects the MVP blocker: overall state is configuration_blocked or missing_evidence', () => {
    const state = buildDefaultReleaseReadiness(NOW)
    // Default state should be blocking (backend not configured yet)
    expect(isSignOffBlocking(state.overallState)).toBe(true)
  })

  it('has at least one launch-blocking next action', () => {
    const state = buildDefaultReleaseReadiness(NOW)
    expect(state.nextActions.some((a) => a.isLaunchBlocking)).toBe(true)
  })

  it('has fail-closed rationale for blocking state', () => {
    const state = buildDefaultReleaseReadiness(NOW)
    expect(state.rationale).toBeTruthy()
    expect(state.rationale.length).toBeGreaterThan(10)
  })
})

// ---------------------------------------------------------------------------
// 13. Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('all dimensions ready + all configs configured → ready overall', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'ready', isLaunchCritical: false }),
    ]
    const configs = [makeConfigDep({ isConfigured: true })]
    const state = deriveReleaseReadiness(dims, configs, freshTimestamp, true, NOW)
    expect(state.overallState).toBe('ready')
    expect(state.nextActions).toHaveLength(0)
    expect(state.launchBlockingCount).toBe(0)
    expect(state.staleCount).toBe(0)
    expect(state.missingConfigCount).toBe(0)
  })

  it('stale evidence does not block when all critical are ready', () => {
    // Stale non-critical dim → advisory, not blocking
    const dims = [
      makeDimension({ id: 'd1', state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
    ]
    const state = deriveReleaseReadiness(dims, [], freshTimestamp, true, NOW)
    expect(state.overallState).toBe('advisory_follow_up')
    expect(isSignOffBlocking(state.overallState)).toBe(false)
  })

  it('non-required unconfigured config dep does not block', () => {
    const dims = [makeDimension({ state: 'ready' })]
    const configs = [makeConfigDep({ isConfigured: false, isRequired: false })]
    const state = deriveReleaseReadiness(dims, configs, freshTimestamp, true, NOW)
    expect(state.missingConfigCount).toBe(0)
    expect(state.nextActions.find((a) => a.id === NEXT_ACTION_IDS.CONFIG_MISSING)).toBeUndefined()
  })

  it('correctly prioritizes missing > stale for overall state', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'stale_evidence', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'missing_evidence', isLaunchCritical: true }),
    ]
    const state = deriveReleaseReadiness(dims, [], null, null, NOW)
    expect(state.overallState).toBe('missing_evidence')
  })

  it('zero dimensions and zero configs results in ready state', () => {
    const state = deriveReleaseReadiness([], [], freshTimestamp, true, NOW)
    expect(state.overallState).toBe('ready')
  })
})

// ---------------------------------------------------------------------------
// 14. CSS helpers
// ---------------------------------------------------------------------------

describe('CSS helper functions', () => {
  const states: SignOffReadinessState[] = [
    'ready',
    'stale_evidence',
    'missing_evidence',
    'configuration_blocked',
    'advisory_follow_up',
  ]

  it('readinessStateBadgeClass returns non-empty strings for all states', () => {
    for (const s of states) {
      const cls = readinessStateBadgeClass(s)
      expect(cls).toBeTruthy()
      expect(cls.length).toBeGreaterThan(0)
    }
  })

  it('dimensionCardBorderClass returns border-* class for all states', () => {
    for (const s of states) {
      const cls = dimensionCardBorderClass(s)
      expect(cls).toMatch(/^border-/)
    }
  })

  it('dimensionCardBgClass returns bg-* class for all states', () => {
    for (const s of states) {
      const cls = dimensionCardBgClass(s)
      expect(cls).toMatch(/^bg-/)
    }
  })

  it('readinessBannerClass returns border-* and bg-* for all states', () => {
    for (const s of states) {
      const cls = readinessBannerClass(s)
      expect(cls).toContain('border-')
      expect(cls).toContain('bg-')
    }
  })

  it('readinessBannerTextClass returns text-* for all states', () => {
    for (const s of states) {
      const cls = readinessBannerTextClass(s)
      expect(cls).toMatch(/^text-/)
    }
  })

  it('all states produce different banner colors', () => {
    const classes = states.map((s) => readinessBannerClass(s))
    const unique = new Set(classes)
    expect(unique.size).toBe(states.length)
  })
})

// ---------------------------------------------------------------------------
// 15. ownerDomainDisplayName
// ---------------------------------------------------------------------------

describe('ownerDomainDisplayName', () => {
  it('returns display name without "Action required by:" prefix', () => {
    expect(ownerDomainDisplayName('compliance')).toBe('Compliance Team')
    expect(ownerDomainDisplayName('legal')).toBe('Legal Team')
    expect(ownerDomainDisplayName('procurement')).toBe('Procurement Team')
    expect(ownerDomainDisplayName('executive')).toBe('Executive Sponsor')
    expect(ownerDomainDisplayName('shared_ops')).toBe('Shared Operations')
    expect(ownerDomainDisplayName('unassigned')).toBe('Unassigned')
  })

  it('does not include a colon or "Action required by" prefix in any value', () => {
    const domains = ['compliance', 'legal', 'procurement', 'executive', 'shared_ops', 'unassigned'] as const
    for (const d of domains) {
      const name = ownerDomainDisplayName(d)
      expect(name).not.toContain('Action required by')
      expect(name).not.toContain(':')
    }
  })
})

// ---------------------------------------------------------------------------
// 16. formatEvidenceFreshnessLabel — negative / future timestamp
// ---------------------------------------------------------------------------

const CLOCK_SKEW_TOLERANCE_MS = 60_000 // 60 seconds ahead

describe('formatEvidenceFreshnessLabel — edge cases', () => {
  it('returns "Just now" for a future timestamp (clock skew tolerance)', () => {
    // ageMs < 0 when the evidence timestamp is slightly in the future
    const future = new Date(NOW.getTime() + CLOCK_SKEW_TOLERANCE_MS).toISOString()
    expect(formatEvidenceFreshnessLabel(future, NOW)).toBe('Just now')
  })
})

// ---------------------------------------------------------------------------
// 17. deriveReadinessHeadline — singular/plural completeness
// ---------------------------------------------------------------------------

describe('deriveReadinessHeadline — singular forms', () => {
  it('uses singular "dimension requires" for stale_evidence with count = 1', () => {
    const h = deriveReadinessHeadline('stale_evidence', 1, 0)
    // Singular: "1 evidence dimension requires a fresh protected run"
    expect(h).toContain('1')
    expect(h.toLowerCase()).not.toContain('dimensions require ')
  })

  it('uses plural "dimensions require" for stale_evidence with count > 1', () => {
    const h = deriveReadinessHeadline('stale_evidence', 2, 0)
    expect(h).toContain('2')
  })

  it('uses singular "item is" for configuration_blocked with count = 1', () => {
    const h = deriveReadinessHeadline('configuration_blocked', 0, 1)
    expect(h).toContain('1')
    expect(h.toLowerCase()).toContain('item')
  })

  it('uses plural "items are" for configuration_blocked with count > 1', () => {
    const h = deriveReadinessHeadline('configuration_blocked', 0, 2)
    expect(h).toContain('2')
    expect(h.toLowerCase()).toContain('items')
  })
})

// ---------------------------------------------------------------------------
// 18. Full-state integration — advisory_follow_up scenario
// ---------------------------------------------------------------------------

describe('advisory_follow_up full integration', () => {
  it('advisory_follow_up state is non-blocking', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
    ]
    const state = deriveReleaseReadiness(dims, [], freshTimestamp, true, NOW)
    expect(state.overallState).toBe('advisory_follow_up')
    expect(isSignOffBlocking(state.overallState)).toBe(false)
    expect(isSignOffClear(state.overallState)).toBe(true)
  })

  it('advisory_follow_up headline mentions advisory', () => {
    const h = deriveReadinessHeadline('advisory_follow_up', 0, 0)
    expect(h.toLowerCase()).toContain('advisory')
  })

  it('advisory_follow_up rationale mentions launch-critical evidence being clear', () => {
    const r = deriveReadinessRationale('advisory_follow_up')
    // Should affirm that launch-critical evidence is clear
    expect(r.toLowerCase()).toContain('launch')
  })

  it('advisory next action is not launch-blocking', () => {
    const dims = [
      makeDimension({ id: 'd1', state: 'ready', isLaunchCritical: true }),
      makeDimension({ id: 'd2', state: 'stale_evidence', isLaunchCritical: false }),
    ]
    const actions = deriveNextActions(dims, [])
    const advisoryAction = actions.find((a) => a.id === NEXT_ACTION_IDS.ADVISORY_IMPROVEMENTS)
    expect(advisoryAction).toBeDefined()
    expect(advisoryAction!.isLaunchBlocking).toBe(false)
  })
})
