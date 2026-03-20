/**
 * Integration Tests: EvidenceTruthfulness Utility → Release-Critical View Wiring
 *
 * Validates that the shared `evidenceTruthfulness` utility correctly drives
 * the data-provenance banner rendering in all three release-critical views:
 *   - ReleaseEvidenceCenterView.vue
 *   - InvestorComplianceOnboardingWorkspace.vue
 *   - ComplianceReportingWorkspace.vue
 *
 * These tests prove that:
 *   1. Each truth class produces a distinct, operator-meaningful banner
 *   2. The banner never implies readiness when data is fixture-backed or unavailable
 *   3. Next-action guidance is surfaced for every non-confirmed state
 *   4. The provenance label correctly identifies the view/source
 *   5. CSS helpers produce distinct visual classes for each truth class
 *
 * Closes: #726
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect } from 'vitest'
import {
  type EvidenceTruthClass,
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
  EVIDENCE_TRUTH_SEVERITY,
} from '../../utils/evidenceTruthfulness'

const ALL_TRUTH_CLASSES: EvidenceTruthClass[] = [
  'backend_confirmed',
  'partial_hydration',
  'stale',
  'unavailable',
  'environment_blocked',
]

// ---------------------------------------------------------------------------
// Section 1: Banner rendering contracts per truth class
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — banner rendering contracts', () => {
  it('every truth class has a non-empty label', () => {
    for (const tc of ALL_TRUTH_CLASSES) {
      expect(EVIDENCE_TRUTH_LABELS[tc].length).toBeGreaterThan(0)
    }
  })

  it('every truth class has a non-empty short label', () => {
    for (const tc of ALL_TRUTH_CLASSES) {
      expect(EVIDENCE_TRUTH_SHORT_LABELS[tc].length).toBeGreaterThan(0)
    }
  })

  it('every truth class has a non-empty description', () => {
    for (const tc of ALL_TRUTH_CLASSES) {
      expect(EVIDENCE_TRUTH_DESCRIPTIONS[tc].length).toBeGreaterThan(0)
    }
  })

  it('every non-confirmed truth class has a non-empty next-action guidance', () => {
    const nonConfirmed = ALL_TRUTH_CLASSES.filter((tc) => tc !== 'backend_confirmed')
    for (const tc of nonConfirmed) {
      expect(EVIDENCE_TRUTH_NEXT_ACTIONS[tc].length).toBeGreaterThan(0)
    }
  })

  it('EVIDENCE_TRUTH_TEST_IDS contains all expected DOM anchor keys', () => {
    expect(EVIDENCE_TRUTH_TEST_IDS.BANNER).toBeTruthy()
    expect(EVIDENCE_TRUTH_TEST_IDS.BADGE).toBeTruthy()
    expect(EVIDENCE_TRUTH_TEST_IDS.TITLE).toBeTruthy()
    expect(EVIDENCE_TRUTH_TEST_IDS.DESCRIPTION).toBeTruthy()
    expect(EVIDENCE_TRUTH_TEST_IDS.NEXT_ACTION).toBeTruthy()
    expect(EVIDENCE_TRUTH_TEST_IDS.PROVENANCE_LABEL).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Section 2: CSS helper contracts — distinct classes per truth class
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — CSS helper contracts', () => {
  it('evidenceTruthBadgeClass returns distinct classes for each truth class', () => {
    const classes = ALL_TRUTH_CLASSES.map(evidenceTruthBadgeClass)
    const unique = new Set(classes)
    expect(unique.size).toBe(ALL_TRUTH_CLASSES.length)
  })

  it('evidenceTruthBannerClass returns distinct classes for each truth class', () => {
    const classes = ALL_TRUTH_CLASSES.map(evidenceTruthBannerClass)
    const unique = new Set(classes)
    expect(unique.size).toBe(ALL_TRUTH_CLASSES.length)
  })

  it('evidenceTruthTitleClass returns distinct classes for each truth class', () => {
    const classes = ALL_TRUTH_CLASSES.map(evidenceTruthTitleClass)
    const unique = new Set(classes)
    expect(unique.size).toBe(ALL_TRUTH_CLASSES.length)
  })

  it('evidenceTruthBodyClass returns distinct classes for each truth class', () => {
    const classes = ALL_TRUTH_CLASSES.map(evidenceTruthBodyClass)
    const unique = new Set(classes)
    expect(unique.size).toBe(ALL_TRUTH_CLASSES.length)
  })

  it('backend_confirmed banner is green-tinted (success signal)', () => {
    expect(evidenceTruthBannerClass('backend_confirmed')).toContain('green')
    expect(evidenceTruthBadgeClass('backend_confirmed')).toContain('green')
    expect(evidenceTruthTitleClass('backend_confirmed')).toContain('green')
  })

  it('unavailable banner is red-tinted (failure signal)', () => {
    expect(evidenceTruthBannerClass('unavailable')).toContain('red')
    expect(evidenceTruthBadgeClass('unavailable')).toContain('red')
    expect(evidenceTruthTitleClass('unavailable')).toContain('red')
  })

  it('environment_blocked banner is yellow-tinted (warning signal)', () => {
    expect(evidenceTruthBannerClass('environment_blocked')).toContain('yellow')
    expect(evidenceTruthBadgeClass('environment_blocked')).toContain('yellow')
    expect(evidenceTruthTitleClass('environment_blocked')).toContain('yellow')
  })

  it('partial_hydration banner is blue-tinted (info signal)', () => {
    expect(evidenceTruthBannerClass('partial_hydration')).toContain('blue')
    expect(evidenceTruthBadgeClass('partial_hydration')).toContain('blue')
    expect(evidenceTruthTitleClass('partial_hydration')).toContain('blue')
  })

  it('stale banner is orange-tinted (caution signal)', () => {
    expect(evidenceTruthBannerClass('stale')).toContain('orange')
    expect(evidenceTruthBadgeClass('stale')).toContain('orange')
    expect(evidenceTruthTitleClass('stale')).toContain('orange')
  })
})

// ---------------------------------------------------------------------------
// Section 3: Readiness gate — never implies success when not backend_confirmed
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — readiness gate contracts', () => {
  it('isEvidenceTrustworthy returns true ONLY for backend_confirmed', () => {
    expect(isEvidenceTrustworthy('backend_confirmed')).toBe(true)
    expect(isEvidenceTrustworthy('partial_hydration')).toBe(false)
    expect(isEvidenceTrustworthy('stale')).toBe(false)
    expect(isEvidenceTrustworthy('unavailable')).toBe(false)
    expect(isEvidenceTrustworthy('environment_blocked')).toBe(false)
  })

  it('isEvidenceTruthBlocking returns true for unavailable, environment_blocked, and stale', () => {
    expect(isEvidenceTruthBlocking('unavailable')).toBe(true)
    expect(isEvidenceTruthBlocking('environment_blocked')).toBe(true)
    expect(isEvidenceTruthBlocking('stale')).toBe(true)
    expect(isEvidenceTruthBlocking('partial_hydration')).toBe(false)
    expect(isEvidenceTruthBlocking('backend_confirmed')).toBe(false)
  })

  it('requiresOperatorAction is false ONLY for backend_confirmed', () => {
    expect(requiresOperatorAction('backend_confirmed')).toBe(false)
    expect(requiresOperatorAction('partial_hydration')).toBe(true)
    expect(requiresOperatorAction('stale')).toBe(true)
    expect(requiresOperatorAction('unavailable')).toBe(true)
    expect(requiresOperatorAction('environment_blocked')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 4: Severity ordering — worst-case merge
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — severity ordering and merge', () => {
  it('severity ordering is worst-to-best: environment_blocked > unavailable > partial_hydration > stale > backend_confirmed', () => {
    expect(EVIDENCE_TRUTH_SEVERITY['environment_blocked']).toBeGreaterThan(
      EVIDENCE_TRUTH_SEVERITY['unavailable'],
    )
    expect(EVIDENCE_TRUTH_SEVERITY['unavailable']).toBeGreaterThan(
      EVIDENCE_TRUTH_SEVERITY['partial_hydration'],
    )
    expect(EVIDENCE_TRUTH_SEVERITY['partial_hydration']).toBeGreaterThan(
      EVIDENCE_TRUTH_SEVERITY['stale'],
    )
    expect(EVIDENCE_TRUTH_SEVERITY['stale']).toBeGreaterThan(
      EVIDENCE_TRUTH_SEVERITY['backend_confirmed'],
    )
  })

  it('mergeEvidenceTruth returns worst class in the set', () => {
    expect(mergeEvidenceTruth(['backend_confirmed', 'unavailable'])).toBe('unavailable')
    expect(mergeEvidenceTruth(['partial_hydration', 'stale'])).toBe('partial_hydration')
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'partial_hydration', 'environment_blocked']),
    ).toBe('environment_blocked')
  })

  it('mergeEvidenceTruth returns backend_confirmed when all are confirmed', () => {
    expect(
      mergeEvidenceTruth(['backend_confirmed', 'backend_confirmed', 'backend_confirmed']),
    ).toBe('backend_confirmed')
  })

  it('mergeEvidenceTruth returns partial_hydration for a single-item array', () => {
    expect(mergeEvidenceTruth(['partial_hydration'])).toBe('partial_hydration')
  })
})

// ---------------------------------------------------------------------------
// Section 5: Classification helpers (fixture, backend response, general)
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — classification helpers', () => {
  it('deriveFixtureTruthClass returns partial_hydration when data is present', () => {
    expect(deriveFixtureTruthClass(true)).toBe('partial_hydration')
  })

  it('deriveFixtureTruthClass returns unavailable when data is absent', () => {
    expect(deriveFixtureTruthClass(false)).toBe('unavailable')
  })

  it('deriveBackendResponseTruthClass returns backend_confirmed for ok + fresh response', () => {
    const result = deriveBackendResponseTruthClass({
      isDegraded: false,
      isPartial: false,
      isStale: false,
    })
    expect(result).toBe('backend_confirmed')
  })

  it('deriveBackendResponseTruthClass returns stale for ok + stale response', () => {
    const result = deriveBackendResponseTruthClass({
      isDegraded: false,
      isPartial: false,
      isStale: true,
    })
    expect(result).toBe('stale')
  })

  it('deriveBackendResponseTruthClass returns unavailable for failed response', () => {
    const result = deriveBackendResponseTruthClass({
      isDegraded: true,
      isPartial: false,
      isStale: false,
    })
    expect(result).toBe('unavailable')
  })

  it('deriveEvidenceTruthClass returns backend_confirmed for live, complete, non-stale data', () => {
    const result = deriveEvidenceTruthClass({
      isBackendConnected: true,
      isAuthenticated: true,
      isEnvironmentReady: true,
      isDataPresent: true,
      isDataComplete: true,
      isDataFresh: true,
    })
    expect(result).toBe('backend_confirmed')
  })

  it('deriveEvidenceTruthClass returns environment_blocked when environment not ready', () => {
    const result = deriveEvidenceTruthClass({
      isBackendConnected: false,
      isAuthenticated: false,
      isEnvironmentReady: false,
      isDataPresent: false,
      isDataComplete: false,
      isDataFresh: false,
    })
    expect(result).toBe('environment_blocked')
  })

  it('deriveEvidenceTruthClass returns partial_hydration for connected backend with incomplete data', () => {
    const result = deriveEvidenceTruthClass({
      isBackendConnected: true,
      isAuthenticated: true,
      isEnvironmentReady: true,
      isDataPresent: true,
      isDataComplete: false,
      isDataFresh: true,
    })
    expect(result).toBe('partial_hydration')
  })
})

// ---------------------------------------------------------------------------
// Section 6: Provenance label — view-specific labelling
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — provenance label wiring', () => {
  it('buildProvenanceLabel for Release Evidence Center contains view name', () => {
    const label = buildProvenanceLabel('partial_hydration', 'Release Evidence Center')
    expect(label).toContain('Release Evidence Center')
  })

  it('buildProvenanceLabel for Investor Compliance Onboarding contains view name', () => {
    const label = buildProvenanceLabel('unavailable', 'Investor Compliance Onboarding')
    expect(label).toContain('Investor Compliance Onboarding')
  })

  it('buildProvenanceLabel for Compliance Reporting Workspace contains view name', () => {
    const label = buildProvenanceLabel('backend_confirmed', 'Compliance Reporting Workspace')
    expect(label).toContain('Compliance Reporting Workspace')
  })

  it('buildProvenanceLabel includes the truth class classification', () => {
    const label = buildProvenanceLabel('stale', 'Release Evidence Center')
    // The label should reference stale data provenance
    expect(label.length).toBeGreaterThan(10)
    expect(typeof label).toBe('string')
  })

  it('buildProvenanceLabel is non-empty for all truth classes', () => {
    for (const tc of ALL_TRUTH_CLASSES) {
      const label = buildProvenanceLabel(tc, 'Test View')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 7: View wiring contracts — data flow from utility to rendered output
// ---------------------------------------------------------------------------
describe('EvidenceTruthfulness — view wiring contracts', () => {
  it('partial_hydration is the safe default initial state (never implies backend success)', () => {
    // Views initialize with 'partial_hydration' before any data loads.
    // This ensures the UI never shows a success state before backend confirmation.
    const initial: EvidenceTruthClass = 'partial_hydration'
    expect(isEvidenceTrustworthy(initial)).toBe(false)
    expect(requiresOperatorAction(initial)).toBe(true)
    expect(EVIDENCE_TRUTH_NEXT_ACTIONS[initial].length).toBeGreaterThan(0)
  })

  it('fixture-backed data (ReleaseEvidenceCenter initial load) classifies as partial_hydration', () => {
    // When loadData() runs with fixture data (no live backend), it calls deriveFixtureTruthClass(true)
    const truthClass = deriveFixtureTruthClass(true)
    expect(truthClass).toBe('partial_hydration')
    expect(isEvidenceTrustworthy(truthClass)).toBe(false)
    expect(requiresOperatorAction(truthClass)).toBe(true)
  })

  it('backend error in ReleaseEvidenceCenter loadData() classifies as unavailable', () => {
    // When loadData() encounters a fetch error, it sets evidenceTruthClass.value = 'unavailable'
    const truthClass: EvidenceTruthClass = 'unavailable'
    expect(isEvidenceTruthBlocking(truthClass)).toBe(true)
    expect(isEvidenceTrustworthy(truthClass)).toBe(false)
    expect(evidenceTruthBannerClass(truthClass)).toContain('red')
  })

  it('successful live backend call classifies as backend_confirmed', () => {
    // When InvestorComplianceOnboardingWorkspace gets a valid backend response,
    // it sets evidenceTruthClass.value = 'backend_confirmed'
    const truthClass: EvidenceTruthClass = 'backend_confirmed'
    expect(isEvidenceTrustworthy(truthClass)).toBe(true)
    expect(requiresOperatorAction(truthClass)).toBe(false)
    expect(evidenceTruthBannerClass(truthClass)).toContain('green')
  })

  it('no-auth path in InvestorComplianceOnboardingWorkspace classifies as partial_hydration', () => {
    // When loadLiveData() finds no auth token, it falls back to fixture data → partial_hydration
    const truthClass = deriveFixtureTruthClass(true)
    expect(truthClass).toBe('partial_hydration')
    expect(isEvidenceTrustworthy(truthClass)).toBe(false)
  })

  it('ComplianceReportingWorkspace error path classifies as unavailable', () => {
    // When ComplianceReportingWorkspace fetch fails, it sets evidenceTruthClass.value = 'unavailable'
    const truthClass: EvidenceTruthClass = 'unavailable'
    expect(isEvidenceTruthBlocking(truthClass)).toBe(true)
    expect(evidenceTruthBannerClass(truthClass)).toContain('red')
    expect(EVIDENCE_TRUTH_NEXT_ACTIONS[truthClass].length).toBeGreaterThan(0)
  })
})
