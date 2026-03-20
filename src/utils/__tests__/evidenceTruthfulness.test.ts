/**
 * Unit tests: evidenceTruthfulness.ts
 *
 * Verifies all classification helpers, CSS helpers, merge logic, and
 * derivation functions for the evidence truth classification utility.
 *
 * 40+ tests covering all 5 truth classes, edge cases, and merge semantics.
 */

import { describe, it, expect } from 'vitest'
import {
  type EvidenceTruthClass,
  EVIDENCE_TRUTH_SEVERITY,
  EVIDENCE_TRUTH_LABELS,
  EVIDENCE_TRUTH_SHORT_LABELS,
  EVIDENCE_TRUTH_DESCRIPTIONS,
  EVIDENCE_TRUTH_NEXT_ACTIONS,
  EVIDENCE_TRUTH_TEST_IDS,
  evidenceTruthBadgeClass,
  evidenceTruthBannerClass,
  evidenceTruthTitleClass,
  evidenceTruthBodyClass,
  isEvidenceTrustworthy,
  isEvidenceTruthBlocking,
  requiresOperatorAction,
  deriveEvidenceTruthClass,
  deriveFixtureTruthClass,
  deriveBackendResponseTruthClass,
  mergeEvidenceTruth,
  buildProvenanceLabel,
} from '../evidenceTruthfulness'

// ---------------------------------------------------------------------------
// Severity ordering
// ---------------------------------------------------------------------------

describe('EVIDENCE_TRUTH_SEVERITY', () => {
  it('backend_confirmed has the lowest severity (0)', () => {
    expect(EVIDENCE_TRUTH_SEVERITY.backend_confirmed).toBe(0)
  })

  it('environment_blocked has the highest severity (4)', () => {
    expect(EVIDENCE_TRUTH_SEVERITY.environment_blocked).toBe(4)
  })

  it('severity ordering is backend_confirmed < stale < partial_hydration < unavailable < environment_blocked', () => {
    const { backend_confirmed, stale, partial_hydration, unavailable, environment_blocked } =
      EVIDENCE_TRUTH_SEVERITY
    expect(backend_confirmed).toBeLessThan(stale)
    expect(stale).toBeLessThan(partial_hydration)
    expect(partial_hydration).toBeLessThan(unavailable)
    expect(unavailable).toBeLessThan(environment_blocked)
  })
})

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

describe('EVIDENCE_TRUTH_LABELS', () => {
  const ALL_CLASSES: EvidenceTruthClass[] = [
    'backend_confirmed',
    'partial_hydration',
    'stale',
    'unavailable',
    'environment_blocked',
  ]

  it('has a non-empty label for every truth class', () => {
    for (const cls of ALL_CLASSES) {
      expect(EVIDENCE_TRUTH_LABELS[cls]).toBeTruthy()
      expect(EVIDENCE_TRUTH_LABELS[cls].length).toBeGreaterThan(0)
    }
  })

  it('has a non-empty short label for every truth class', () => {
    for (const cls of ALL_CLASSES) {
      expect(EVIDENCE_TRUTH_SHORT_LABELS[cls]).toBeTruthy()
    }
  })

  it('has a description for every truth class', () => {
    for (const cls of ALL_CLASSES) {
      expect(EVIDENCE_TRUTH_DESCRIPTIONS[cls]).toBeTruthy()
    }
  })

  it('has a next-action for every truth class', () => {
    for (const cls of ALL_CLASSES) {
      expect(EVIDENCE_TRUTH_NEXT_ACTIONS[cls]).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

describe('evidenceTruthBadgeClass', () => {
  it('returns green for backend_confirmed', () => {
    expect(evidenceTruthBadgeClass('backend_confirmed')).toContain('green')
  })

  it('returns blue for partial_hydration', () => {
    expect(evidenceTruthBadgeClass('partial_hydration')).toContain('blue')
  })

  it('returns orange for stale', () => {
    expect(evidenceTruthBadgeClass('stale')).toContain('orange')
  })

  it('returns red for unavailable', () => {
    expect(evidenceTruthBadgeClass('unavailable')).toContain('red')
  })

  it('returns yellow for environment_blocked', () => {
    expect(evidenceTruthBadgeClass('environment_blocked')).toContain('yellow')
  })
})

describe('evidenceTruthBannerClass', () => {
  it('returns green border for backend_confirmed', () => {
    const cls = evidenceTruthBannerClass('backend_confirmed')
    expect(cls).toContain('border-green')
    expect(cls).toContain('bg-green')
  })

  it('returns blue border for partial_hydration', () => {
    const cls = evidenceTruthBannerClass('partial_hydration')
    expect(cls).toContain('border-blue')
    expect(cls).toContain('bg-blue')
  })

  it('returns orange border for stale', () => {
    const cls = evidenceTruthBannerClass('stale')
    expect(cls).toContain('border-orange')
    expect(cls).toContain('bg-orange')
  })

  it('returns red border for unavailable', () => {
    const cls = evidenceTruthBannerClass('unavailable')
    expect(cls).toContain('border-red')
    expect(cls).toContain('bg-red')
  })

  it('returns yellow for environment_blocked', () => {
    const cls = evidenceTruthBannerClass('environment_blocked')
    expect(cls).toContain('yellow')
  })

  it('returns a distinct class for each of the 5 truth classes', () => {
    const classes = [
      evidenceTruthBannerClass('backend_confirmed'),
      evidenceTruthBannerClass('partial_hydration'),
      evidenceTruthBannerClass('stale'),
      evidenceTruthBannerClass('unavailable'),
      evidenceTruthBannerClass('environment_blocked'),
    ]
    const unique = new Set(classes)
    expect(unique.size).toBe(5)
  })
})

describe('evidenceTruthTitleClass', () => {
  it('returns text-green for backend_confirmed', () => {
    expect(evidenceTruthTitleClass('backend_confirmed')).toContain('text-green')
  })

  it('returns text-blue for partial_hydration', () => {
    expect(evidenceTruthTitleClass('partial_hydration')).toContain('text-blue')
  })

  it('returns text-orange for stale', () => {
    expect(evidenceTruthTitleClass('stale')).toContain('text-orange')
  })

  it('returns text-red for unavailable', () => {
    expect(evidenceTruthTitleClass('unavailable')).toContain('text-red')
  })

  it('returns text-yellow for environment_blocked', () => {
    expect(evidenceTruthTitleClass('environment_blocked')).toContain('text-yellow')
  })
})

describe('evidenceTruthBodyClass', () => {
  it('returns text-green for backend_confirmed', () => {
    expect(evidenceTruthBodyClass('backend_confirmed')).toContain('text-green')
  })

  it('returns text-blue for partial_hydration', () => {
    expect(evidenceTruthBodyClass('partial_hydration')).toContain('text-blue')
  })

  it('returns text-orange for stale', () => {
    expect(evidenceTruthBodyClass('stale')).toContain('text-orange')
  })

  it('returns text-red for unavailable', () => {
    expect(evidenceTruthBodyClass('unavailable')).toContain('text-red')
  })

  it('returns text-yellow for environment_blocked', () => {
    expect(evidenceTruthBodyClass('environment_blocked')).toContain('text-yellow')
  })
})

// ---------------------------------------------------------------------------
// isEvidenceTrustworthy
// ---------------------------------------------------------------------------

describe('isEvidenceTrustworthy', () => {
  it('returns true only for backend_confirmed', () => {
    expect(isEvidenceTrustworthy('backend_confirmed')).toBe(true)
  })

  it('returns false for partial_hydration', () => {
    expect(isEvidenceTrustworthy('partial_hydration')).toBe(false)
  })

  it('returns false for stale', () => {
    expect(isEvidenceTrustworthy('stale')).toBe(false)
  })

  it('returns false for unavailable', () => {
    expect(isEvidenceTrustworthy('unavailable')).toBe(false)
  })

  it('returns false for environment_blocked', () => {
    expect(isEvidenceTrustworthy('environment_blocked')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isEvidenceTruthBlocking
// ---------------------------------------------------------------------------

describe('isEvidenceTruthBlocking', () => {
  it('returns false for backend_confirmed', () => {
    expect(isEvidenceTruthBlocking('backend_confirmed')).toBe(false)
  })

  it('returns false for partial_hydration (advisory, not blocking)', () => {
    expect(isEvidenceTruthBlocking('partial_hydration')).toBe(false)
  })

  it('returns true for stale', () => {
    expect(isEvidenceTruthBlocking('stale')).toBe(true)
  })

  it('returns true for unavailable', () => {
    expect(isEvidenceTruthBlocking('unavailable')).toBe(true)
  })

  it('returns true for environment_blocked', () => {
    expect(isEvidenceTruthBlocking('environment_blocked')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// requiresOperatorAction
// ---------------------------------------------------------------------------

describe('requiresOperatorAction', () => {
  it('returns false for backend_confirmed', () => {
    expect(requiresOperatorAction('backend_confirmed')).toBe(false)
  })

  it('returns true for all non-confirmed classes', () => {
    const nonConfirmed: EvidenceTruthClass[] = [
      'partial_hydration',
      'stale',
      'unavailable',
      'environment_blocked',
    ]
    for (const cls of nonConfirmed) {
      expect(requiresOperatorAction(cls)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// deriveEvidenceTruthClass
// ---------------------------------------------------------------------------

describe('deriveEvidenceTruthClass', () => {
  const FULL_READY = {
    isBackendConnected: true,
    isAuthenticated: true,
    isEnvironmentReady: true,
    isDataPresent: true,
    isDataComplete: true,
    isDataFresh: true,
  }

  it('returns backend_confirmed when all conditions are met', () => {
    expect(deriveEvidenceTruthClass(FULL_READY)).toBe('backend_confirmed')
  })

  it('returns environment_blocked when environment is not ready (highest priority)', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isEnvironmentReady: false }),
    ).toBe('environment_blocked')
  })

  it('returns unavailable when not authenticated', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isAuthenticated: false }),
    ).toBe('unavailable')
  })

  it('returns unavailable when backend not connected', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isBackendConnected: false }),
    ).toBe('unavailable')
  })

  it('returns unavailable when data is not present', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isDataPresent: false }),
    ).toBe('unavailable')
  })

  it('returns stale when data is not fresh', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isDataFresh: false }),
    ).toBe('stale')
  })

  it('returns partial_hydration when data is not complete', () => {
    expect(
      deriveEvidenceTruthClass({ ...FULL_READY, isDataComplete: false }),
    ).toBe('partial_hydration')
  })

  it('environment_blocked takes priority over authentication failure', () => {
    expect(
      deriveEvidenceTruthClass({
        ...FULL_READY,
        isEnvironmentReady: false,
        isAuthenticated: false,
      }),
    ).toBe('environment_blocked')
  })
})

// ---------------------------------------------------------------------------
// deriveFixtureTruthClass
// ---------------------------------------------------------------------------

describe('deriveFixtureTruthClass', () => {
  it('returns partial_hydration when data is present (fixture-backed)', () => {
    expect(deriveFixtureTruthClass(true)).toBe('partial_hydration')
  })

  it('returns unavailable when data is absent', () => {
    expect(deriveFixtureTruthClass(false)).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// deriveBackendResponseTruthClass
// ---------------------------------------------------------------------------

describe('deriveBackendResponseTruthClass', () => {
  it('returns backend_confirmed for a healthy, complete, fresh response', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: false, isPartial: false, isStale: false }),
    ).toBe('backend_confirmed')
  })

  it('returns unavailable when degraded', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: true, isPartial: false, isStale: false }),
    ).toBe('unavailable')
  })

  it('returns stale when stale (not degraded)', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: false, isPartial: false, isStale: true }),
    ).toBe('stale')
  })

  it('returns partial_hydration when partial (not degraded, not stale)', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: false, isPartial: true, isStale: false }),
    ).toBe('partial_hydration')
  })

  it('degraded takes priority over stale', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: true, isPartial: false, isStale: true }),
    ).toBe('unavailable')
  })

  it('stale takes priority over partial', () => {
    expect(
      deriveBackendResponseTruthClass({ isDegraded: false, isPartial: true, isStale: true }),
    ).toBe('stale')
  })
})

// ---------------------------------------------------------------------------
// mergeEvidenceTruth
// ---------------------------------------------------------------------------

describe('mergeEvidenceTruth', () => {
  it('returns backend_confirmed for an empty array', () => {
    expect(mergeEvidenceTruth([])).toBe('backend_confirmed')
  })

  it('returns the single class when only one is provided', () => {
    expect(mergeEvidenceTruth(['stale'])).toBe('stale')
  })

  it('returns the worst class when multiple are provided', () => {
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'stale', 'partial_hydration']),
    ).toBe('partial_hydration')
  })

  it('returns environment_blocked when it is included', () => {
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'unavailable', 'environment_blocked']),
    ).toBe('environment_blocked')
  })

  it('returns unavailable when present with confirmed and stale', () => {
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'stale', 'unavailable']),
    ).toBe('unavailable')
  })

  it('returns backend_confirmed for an all-confirmed array', () => {
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'backend_confirmed']),
    ).toBe('backend_confirmed')
  })

  it('is order-independent', () => {
    const result1 = mergeEvidenceTruth(['stale', 'unavailable', 'backend_confirmed'])
    const result2 = mergeEvidenceTruth(['backend_confirmed', 'stale', 'unavailable'])
    const result3 = mergeEvidenceTruth(['unavailable', 'backend_confirmed', 'stale'])
    expect(result1).toBe(result2)
    expect(result2).toBe(result3)
  })
})

// ---------------------------------------------------------------------------
// buildProvenanceLabel
// ---------------------------------------------------------------------------

describe('buildProvenanceLabel', () => {
  it('includes "backend-confirmed" wording for backend_confirmed', () => {
    const label = buildProvenanceLabel('backend_confirmed')
    expect(label).toMatch(/backend-confirmed/i)
  })

  it('includes "partial" or "fixture" language for partial_hydration', () => {
    const label = buildProvenanceLabel('partial_hydration')
    expect(label.toLowerCase()).toMatch(/partial|fixture/)
  })

  it('includes "stale" or "freshness" language for stale', () => {
    const label = buildProvenanceLabel('stale')
    expect(label.toLowerCase()).toMatch(/stale|freshness|refresh/)
  })

  it('includes "unavailable" or "fixture" language for unavailable', () => {
    const label = buildProvenanceLabel('unavailable')
    expect(label.toLowerCase()).toMatch(/unavailable|fixture|backend/)
  })

  it('includes "environment" language for environment_blocked', () => {
    const label = buildProvenanceLabel('environment_blocked')
    expect(label.toLowerCase()).toMatch(/environment|protected|backend/)
  })

  it('prepends the surface name when provided', () => {
    const label = buildProvenanceLabel('backend_confirmed', 'Release Evidence Center')
    expect(label).toContain('Release Evidence Center')
  })

  it('works without a surface name', () => {
    const label = buildProvenanceLabel('unavailable')
    expect(label.length).toBeGreaterThan(10)
  })
})

// ---------------------------------------------------------------------------
// EVIDENCE_TRUTH_TEST_IDS
// ---------------------------------------------------------------------------

describe('EVIDENCE_TRUTH_TEST_IDS', () => {
  it('has stable string values for all keys', () => {
    expect(EVIDENCE_TRUTH_TEST_IDS.BANNER).toBe('evidence-truth-banner')
    expect(EVIDENCE_TRUTH_TEST_IDS.BADGE).toBe('evidence-truth-badge')
    expect(EVIDENCE_TRUTH_TEST_IDS.TITLE).toBe('evidence-truth-title')
    expect(EVIDENCE_TRUTH_TEST_IDS.DESCRIPTION).toBe('evidence-truth-description')
    expect(EVIDENCE_TRUTH_TEST_IDS.NEXT_ACTION).toBe('evidence-truth-next-action')
    expect(EVIDENCE_TRUTH_TEST_IDS.PROVENANCE_LABEL).toBe('evidence-truth-provenance')
  })
})
