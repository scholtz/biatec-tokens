/**
 * Unit Tests: cockpitHardeningAdapter.ts
 *
 * Validates all hardening utilities:
 *  - detectStaleness(): correct band for various ages
 *  - stalenessBadgeClass(): returns non-empty CSS for all levels
 *  - stalenessRequiresAlert(): true only for stale/severely_stale
 *  - scorePartialHydration(): correct counts and ratio
 *  - isWorkItemPartiallyHydrated(): detects missing ownership/stage/title
 *  - classifyEvidenceCompleteness(): all levels from complete to unavailable
 *  - classifyBackendError(): maps error strings to error kinds
 *  - buildDegradedOperatorGuidance(): returns actionable guidance per kind
 *  - buildEscalationErrorGuidance(): translates errors for modal
 *  - formatDataFreshnessLabel(): correct label and staleness
 *  - COCKPIT_HARDENING_TEST_IDS: all expected constants present
 */

import { describe, it, expect } from 'vitest'
import {
  detectStaleness,
  stalenessBadgeClass,
  stalenessRequiresAlert,
  scorePartialHydration,
  isWorkItemPartiallyHydrated,
  classifyEvidenceCompleteness,
  classifyBackendError,
  buildDegradedOperatorGuidance,
  buildEscalationErrorGuidance,
  formatDataFreshnessLabel,
  STALENESS_THRESHOLDS_MS,
  STALENESS_LABELS,
  PARTIAL_HYDRATION_THRESHOLD,
  COCKPIT_HARDENING_TEST_IDS,
  type StalenessLevel,
  type BackendErrorKind,
} from '../cockpitHardeningAdapter'
import type { WorkItem } from '../complianceOperationsCockpit'
import type { EvidenceGroup, EvidenceItem } from '../caseDrillDown'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-03-15T12:00:00.000Z').getTime()
const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

function makeFetchedAt(ageMs: number): string {
  return new Date(NOW - ageMs).toISOString()
}

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'wi-001',
    title: 'KYC Review — Test Investor',
    stage: 'kyc_aml',
    status: 'in_progress',
    ownership: 'assigned_to_me',
    lastActionAt: '2026-03-15T10:00:00.000Z',
    dueAt: '2026-03-20T10:00:00.000Z',
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking: false,
    ...overrides,
  }
}

/** Create an EvidenceItem matching the actual caseDrillDown.ts interface. */
function makeEvidenceItem(status: EvidenceItem['status'], label = 'Test Doc'): EvidenceItem {
  return {
    id: `ev-${label.replace(/\s/g, '-').toLowerCase()}`,
    label,
    status,
    lastUpdatedAt: null,
    note: null,
  }
}

/** Create an EvidenceGroup matching the actual caseDrillDown.ts interface. */
function makeEvidenceGroup(
  label: string,
  items: EvidenceItem[],
  overallStatus?: EvidenceGroup['overallStatus'],
): EvidenceGroup {
  // If overallStatus is not provided, derive it from items (same logic as deriveGroupOverallStatus)
  let derived: EvidenceGroup['overallStatus'] = 'available'
  if (items.some((i) => i.status === 'degraded')) derived = 'degraded'
  else if (items.some((i) => i.status === 'missing')) derived = 'missing'
  else if (items.some((i) => i.status === 'stale')) derived = 'stale'

  return {
    category: 'identity_kyc',
    label,
    description: `Evidence group: ${label}`,
    items,
    overallStatus: overallStatus ?? derived,
  }
}

// ---------------------------------------------------------------------------
// detectStaleness
// ---------------------------------------------------------------------------

describe('detectStaleness()', () => {
  it('returns fresh for data fetched < 5 minutes ago', () => {
    expect(detectStaleness(makeFetchedAt(4 * MINUTE_MS), NOW)).toBe('fresh')
  })

  it('returns fresh for data fetched exactly at the boundary', () => {
    expect(detectStaleness(makeFetchedAt(STALENESS_THRESHOLDS_MS.fresh - 1), NOW)).toBe('fresh')
  })

  it('returns mild_stale for data 6-29 minutes old', () => {
    expect(detectStaleness(makeFetchedAt(6 * MINUTE_MS), NOW)).toBe('mild_stale')
    expect(detectStaleness(makeFetchedAt(29 * MINUTE_MS), NOW)).toBe('mild_stale')
  })

  it('returns stale for data 31 minutes to 2 hours old', () => {
    expect(detectStaleness(makeFetchedAt(31 * MINUTE_MS), NOW)).toBe('stale')
    expect(detectStaleness(makeFetchedAt(119 * MINUTE_MS), NOW)).toBe('stale')
  })

  it('returns severely_stale for data older than 2 hours', () => {
    expect(detectStaleness(makeFetchedAt(2 * HOUR_MS + 1), NOW)).toBe('severely_stale')
    expect(detectStaleness(makeFetchedAt(24 * HOUR_MS), NOW)).toBe('severely_stale')
  })

  it('returns severely_stale for null fetchedAt', () => {
    expect(detectStaleness(null, NOW)).toBe('severely_stale')
    expect(detectStaleness(undefined, NOW)).toBe('severely_stale')
  })

  it('returns severely_stale for invalid date string', () => {
    expect(detectStaleness('not-a-date', NOW)).toBe('severely_stale')
    expect(detectStaleness('', NOW)).toBe('severely_stale')
  })

  it('returns fresh for future timestamps (clock skew)', () => {
    const futureTimestamp = new Date(NOW + HOUR_MS).toISOString()
    expect(detectStaleness(futureTimestamp, NOW)).toBe('fresh')
  })
})

// ---------------------------------------------------------------------------
// stalenessBadgeClass
// ---------------------------------------------------------------------------

describe('stalenessBadgeClass()', () => {
  const levels: StalenessLevel[] = ['fresh', 'mild_stale', 'stale', 'severely_stale']

  it('returns a non-empty string for every staleness level', () => {
    for (const level of levels) {
      const cls = stalenessBadgeClass(level)
      expect(typeof cls).toBe('string')
      expect(cls.trim().length).toBeGreaterThan(0)
    }
  })

  it('fresh badge uses green colors', () => {
    expect(stalenessBadgeClass('fresh')).toContain('green')
  })

  it('severely_stale badge uses red colors', () => {
    expect(stalenessBadgeClass('severely_stale')).toContain('red')
  })
})

// ---------------------------------------------------------------------------
// stalenessRequiresAlert
// ---------------------------------------------------------------------------

describe('stalenessRequiresAlert()', () => {
  it('returns false for fresh', () => {
    expect(stalenessRequiresAlert('fresh')).toBe(false)
  })

  it('returns false for mild_stale', () => {
    expect(stalenessRequiresAlert('mild_stale')).toBe(false)
  })

  it('returns true for stale', () => {
    expect(stalenessRequiresAlert('stale')).toBe(true)
  })

  it('returns true for severely_stale', () => {
    expect(stalenessRequiresAlert('severely_stale')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// scorePartialHydration
// ---------------------------------------------------------------------------

describe('scorePartialHydration()', () => {
  it('returns ratio=1 and isPartiallyHydrated=false for empty list', () => {
    const score = scorePartialHydration([])
    expect(score.totalItems).toBe(0)
    expect(score.hydrationRatio).toBe(1)
    expect(score.isPartiallyHydrated).toBe(false)
    expect(score.reason).toBeNull()
  })

  it('returns ratio=1 for fully hydrated list', () => {
    const items = [makeWorkItem(), makeWorkItem({ id: 'wi-002' })]
    const score = scorePartialHydration(items)
    expect(score.hydrationRatio).toBe(1)
    expect(score.isPartiallyHydrated).toBe(false)
    expect(score.fullyHydratedCount).toBe(2)
    expect(score.partialCount).toBe(0)
  })

  it('flags partial hydration when > 20% items are missing fields', () => {
    const items = [
      makeWorkItem(),
      makeWorkItem({ id: 'wi-002' }),
      makeWorkItem({ id: 'wi-003' }),
      makeWorkItem({ id: 'wi-004', ownership: undefined as unknown as WorkItem['ownership'] }),
      makeWorkItem({ id: 'wi-005', ownership: undefined as unknown as WorkItem['ownership'] }),
    ]
    const score = scorePartialHydration(items)
    expect(score.partialCount).toBe(2)
    expect(score.isPartiallyHydrated).toBe(true)
    expect(score.reason).not.toBeNull()
    expect(score.reason).toContain('2 of 5')
  })

  it('does not flag when exactly at the threshold (80% hydrated)', () => {
    // 8 fully hydrated, 2 partial = 80% = not below threshold
    const items = [
      ...Array.from({ length: 8 }, (_, i) => makeWorkItem({ id: `wi-${i}` })),
      makeWorkItem({ id: 'wi-8', ownership: undefined as unknown as WorkItem['ownership'] }),
      makeWorkItem({ id: 'wi-9', ownership: undefined as unknown as WorkItem['ownership'] }),
    ]
    const score = scorePartialHydration(items)
    // 80% hydration ratio is NOT below the 0.8 threshold (not strictly less than)
    expect(score.hydrationRatio).toBe(0.8)
    expect(score.isPartiallyHydrated).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isWorkItemPartiallyHydrated
// ---------------------------------------------------------------------------

describe('isWorkItemPartiallyHydrated()', () => {
  it('returns false for a complete work item', () => {
    expect(isWorkItemPartiallyHydrated(makeWorkItem())).toBe(false)
  })

  it('returns true when ownership is missing', () => {
    expect(
      isWorkItemPartiallyHydrated(makeWorkItem({ ownership: undefined as unknown as WorkItem['ownership'] })),
    ).toBe(true)
  })

  it('returns true when stage is missing', () => {
    expect(
      isWorkItemPartiallyHydrated(makeWorkItem({ stage: undefined as unknown as WorkItem['stage'] })),
    ).toBe(true)
  })

  it('returns true when title is too short', () => {
    expect(isWorkItemPartiallyHydrated(makeWorkItem({ title: 'X' }))).toBe(true)
    expect(isWorkItemPartiallyHydrated(makeWorkItem({ title: '' }))).toBe(true)
  })

  it('returns false when title is exactly 5 characters', () => {
    expect(isWorkItemPartiallyHydrated(makeWorkItem({ title: 'AB123' }))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// classifyEvidenceCompleteness
// ---------------------------------------------------------------------------

describe('classifyEvidenceCompleteness()', () => {
  it('returns unavailable for empty groups array', () => {
    const result = classifyEvidenceCompleteness([])
    expect(result.level).toBe('unavailable')
    expect(result.missingItems.length).toBeGreaterThan(0)
  })

  it('returns unavailable when groups have no items', () => {
    const result = classifyEvidenceCompleteness([makeEvidenceGroup('KYC', [])])
    expect(result.level).toBe('unavailable')
  })

  it('returns complete when all items are available', () => {
    const groups = [
      makeEvidenceGroup('KYC', [
        makeEvidenceItem('available', 'Passport'),
        makeEvidenceItem('available', 'Address Proof'),
      ]),
    ]
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('complete')
    expect(result.missingItems).toHaveLength(0)
  })

  it('returns critical_gaps when any group has overallStatus degraded', () => {
    const groups = [
      makeEvidenceGroup('KYC', [makeEvidenceItem('degraded', 'Passport')]),
    ]
    // overallStatus will be auto-derived as 'degraded'
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('critical_gaps')
    expect(result.missingItems).toHaveLength(1)
    expect(result.nextAction).toContain('backend')
  })

  it('returns critical_gaps for degraded overallStatus regardless of item count', () => {
    const groups = [
      // overallStatus explicitly set to 'degraded' (backend unavailable for group)
      makeEvidenceGroup('KYC', [makeEvidenceItem('available', 'Passport')], 'degraded'),
    ]
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('critical_gaps')
  })

  it('returns significant_gaps when any group has overallStatus missing', () => {
    const groups = [
      makeEvidenceGroup('KYC', [makeEvidenceItem('missing', 'Passport')]),
    ]
    // overallStatus will be auto-derived as 'missing'
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('significant_gaps')
    expect(result.missingItems).toHaveLength(1)
    expect(result.nextAction).toContain('missing')
  })

  it('returns significant_gaps for multiple missing groups', () => {
    const groups = [
      makeEvidenceGroup('KYC', [makeEvidenceItem('missing', 'Doc 1')]),
      makeEvidenceGroup('AML', [makeEvidenceItem('missing', 'Doc 2')]),
    ]
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('significant_gaps')
    expect(result.missingItems).toHaveLength(2)
  })

  it('degraded takes priority over missing', () => {
    const groups = [
      makeEvidenceGroup('KYC', [makeEvidenceItem('degraded', 'Failed Doc')]),
      makeEvidenceGroup('AML', [makeEvidenceItem('missing', 'Missing Doc')]),
    ]
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('critical_gaps')
  })

  it('returns minor_gaps when only stale evidence present', () => {
    const groups = [
      makeEvidenceGroup('KYC', [
        makeEvidenceItem('stale', 'Stale Doc'),
        makeEvidenceItem('available', 'Current Doc'),
      ]),
    ]
    // overallStatus will be auto-derived as 'stale' (one stale item)
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('minor_gaps')
    expect(result.nextAction).toContain('stale')
  })

  it('complete group with only available items does not flag stale', () => {
    const groups = [
      makeEvidenceGroup('KYC', [
        makeEvidenceItem('available', 'Doc 1'),
        makeEvidenceItem('available', 'Doc 2'),
      ]),
      makeEvidenceGroup('AML', [
        makeEvidenceItem('available', 'Screen 1'),
      ]),
    ]
    const result = classifyEvidenceCompleteness(groups)
    expect(result.level).toBe('complete')
  })

  it('badge classes are non-empty for all level scenarios', () => {
    const scenarios: Array<EvidenceGroup[]> = [
      [],
      [makeEvidenceGroup('KYC', [makeEvidenceItem('available', 'Doc')])],
      [makeEvidenceGroup('KYC', [makeEvidenceItem('degraded', 'Doc')])],
      [makeEvidenceGroup('KYC', [makeEvidenceItem('missing', 'Doc')])],
      [makeEvidenceGroup('KYC', [makeEvidenceItem('stale', 'Doc')])],
    ]
    for (const groups of scenarios) {
      const result = classifyEvidenceCompleteness(groups)
      expect(result.badgeClass.trim().length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// classifyBackendError
// ---------------------------------------------------------------------------

describe('classifyBackendError()', () => {
  const cases: Array<{ msg: string; expected: BackendErrorKind }> = [
    { msg: 'No authentication token', expected: 'auth_missing' },
    { msg: 'No bearer token provided', expected: 'auth_missing' },
    { msg: 'No token available', expected: 'auth_missing' },
    { msg: '401 Unauthorized', expected: 'auth_expired' },
    { msg: 'token expired', expected: 'auth_expired' },
    { msg: 'session expired', expected: 'auth_expired' },
    { msg: '403 Forbidden', expected: 'auth_forbidden' },
    { msg: 'Access denied to resource', expected: 'auth_forbidden' },
    { msg: 'Request timed out after 30s', expected: 'timeout' },
    { msg: '408 Timed Out', expected: 'timeout' },
    { msg: 'Network error', expected: 'network_failure' },
    { msg: 'Connection refused', expected: 'network_failure' },
    { msg: 'ECONNREFUSED', expected: 'network_failure' },
    { msg: '500 Internal Server Error', expected: 'server_error' },
    { msg: '502 Bad Gateway', expected: 'server_error' },
    { msg: '503 Service Unavailable', expected: 'server_error' },
    { msg: 'Partial data returned', expected: 'partial_data' },
    { msg: 'Not all cases loaded', expected: 'partial_data' },
    { msg: 'Some unexpected failure', expected: 'unknown' },
    { msg: '', expected: 'unknown' },
  ]

  for (const { msg, expected } of cases) {
    it(`classifies "${msg}" as ${expected}`, () => {
      expect(classifyBackendError(msg)).toBe(expected)
    })
  }

  it('returns unknown for null', () => {
    expect(classifyBackendError(null)).toBe('unknown')
  })

  it('returns unknown for undefined', () => {
    expect(classifyBackendError(undefined)).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// buildDegradedOperatorGuidance
// ---------------------------------------------------------------------------

describe('buildDegradedOperatorGuidance()', () => {
  it('produces actionable guidance for auth_missing', () => {
    const g = buildDegradedOperatorGuidance('No authentication token')
    expect(g.urgency).toBe('high')
    expect(g.headline).toBeTruthy()
    expect(g.nextAction).toContain('Sign')
    expect(g.panelClass.trim().length).toBeGreaterThan(0)
  })

  it('produces critical guidance for auth_expired', () => {
    const g = buildDegradedOperatorGuidance('401 unauthorized')
    expect(g.urgency).toBe('critical')
    expect(g.headline).toContain('expired')
  })

  it('produces auth_forbidden guidance with contact admin direction', () => {
    const g = buildDegradedOperatorGuidance('403 forbidden')
    expect(g.urgency).toBe('critical')
    expect(g.nextAction).toContain('administrator')
  })

  it('produces timeout guidance with retry instruction', () => {
    const g = buildDegradedOperatorGuidance('Request timed out')
    expect(g.urgency).toBe('high')
    expect(g.nextAction.toLowerCase()).toContain('refresh')
  })

  it('produces network_failure guidance with refresh instruction', () => {
    const g = buildDegradedOperatorGuidance('Network error')
    expect(g.urgency).toBe('high')
    expect(g.nextAction.toLowerCase()).toContain('refresh')
  })

  it('produces server_error guidance', () => {
    const g = buildDegradedOperatorGuidance('500 Internal Server Error')
    expect(g.urgency).toBe('high')
    expect(g.panelClass.trim().length).toBeGreaterThan(0)
  })

  it('produces partial_data guidance with reload instruction', () => {
    const g = buildDegradedOperatorGuidance('Partial data returned')
    expect(g.urgency).toBe('medium')
    expect(g.nextAction.toLowerCase()).toContain('refresh')
  })

  it('produces partial hydration guidance when isPartiallyHydrated=true', () => {
    const g = buildDegradedOperatorGuidance(null, true)
    expect(g.urgency).toBe('medium')
    expect(g.headline).toContain('incomplete')
  })

  it('falls back gracefully for unknown errors', () => {
    const g = buildDegradedOperatorGuidance('Something unexpected happened')
    expect(g.headline.length).toBeGreaterThan(0)
    expect(g.detail.length).toBeGreaterThan(0)
    expect(g.nextAction.length).toBeGreaterThan(0)
  })

  it('all guidance objects have non-empty required fields', () => {
    const errors = [
      'No authentication token',
      '401 unauthorized',
      '403 forbidden',
      'Request timed out',
      'Network error',
      '500 error',
      'Partial data',
      null,
    ]
    for (const err of errors) {
      const g = buildDegradedOperatorGuidance(err)
      expect(g.headline.length).toBeGreaterThan(0)
      expect(g.detail.length).toBeGreaterThan(0)
      expect(g.nextAction.length).toBeGreaterThan(0)
      expect(g.panelClass.length).toBeGreaterThan(0)
      expect(['critical', 'high', 'medium', 'low']).toContain(g.urgency)
    }
  })
})

// ---------------------------------------------------------------------------
// buildEscalationErrorGuidance
// ---------------------------------------------------------------------------

describe('buildEscalationErrorGuidance()', () => {
  it('returns non-retryable for auth errors', () => {
    const g = buildEscalationErrorGuidance('No authentication token')
    expect(g.isRetryable).toBe(false)
    expect(g.headline).toBeTruthy()
  })

  it('returns non-retryable for forbidden', () => {
    const g = buildEscalationErrorGuidance('403 forbidden')
    expect(g.isRetryable).toBe(false)
  })

  it('returns retryable for timeout', () => {
    const g = buildEscalationErrorGuidance('Request timed out')
    expect(g.isRetryable).toBe(true)
  })

  it('returns retryable for network failure', () => {
    const g = buildEscalationErrorGuidance('Network error')
    expect(g.isRetryable).toBe(true)
  })

  it('returns retryable for unknown errors', () => {
    const g = buildEscalationErrorGuidance('Escalation submission failed.')
    expect(g.isRetryable).toBe(true)
  })

  it('includes original error message in detail for unknown errors', () => {
    const rawMsg = 'Some unexpected error occurred during escalation.'
    const g = buildEscalationErrorGuidance(rawMsg)
    expect(g.detail).toContain(rawMsg)
  })

  it('handles null and undefined gracefully', () => {
    const g1 = buildEscalationErrorGuidance(null)
    const g2 = buildEscalationErrorGuidance(undefined)
    expect(g1.headline.length).toBeGreaterThan(0)
    expect(g2.headline.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatDataFreshnessLabel
// ---------------------------------------------------------------------------

describe('formatDataFreshnessLabel()', () => {
  it('returns "Just now" for data < 1 minute old', () => {
    const result = formatDataFreshnessLabel(makeFetchedAt(30_000), NOW)
    expect(result.label).toBe('Just now')
    expect(result.staleness).toBe('fresh')
    expect(result.ageMinutes).toBe(0)
  })

  it('returns "Xm ago" for data 2-59 minutes old', () => {
    const result = formatDataFreshnessLabel(makeFetchedAt(7 * MINUTE_MS), NOW)
    expect(result.label).toBe('7m ago')
    expect(result.ageMinutes).toBe(7)
  })

  it('returns "Xh ago" for data >= 1 hour old', () => {
    const result = formatDataFreshnessLabel(makeFetchedAt(90 * MINUTE_MS), NOW)
    expect(result.label).toBe('1h ago')
    expect(result.ageMinutes).toBe(90)
  })

  it('returns severely_stale staleness for null fetchedAt', () => {
    const result = formatDataFreshnessLabel(null, NOW)
    expect(result.label).toBe('Unknown')
    expect(result.staleness).toBe('severely_stale')
    expect(result.ageMinutes).toBeNull()
  })

  it('returns severely_stale for invalid date', () => {
    const result = formatDataFreshnessLabel('not-a-date', NOW)
    expect(result.staleness).toBe('severely_stale')
  })
})

// ---------------------------------------------------------------------------
// STALENESS_LABELS
// ---------------------------------------------------------------------------

describe('STALENESS_LABELS', () => {
  it('contains non-empty labels for all staleness levels', () => {
    const levels: StalenessLevel[] = ['fresh', 'mild_stale', 'stale', 'severely_stale']
    for (const level of levels) {
      expect(STALENESS_LABELS[level]).toBeTruthy()
      expect(typeof STALENESS_LABELS[level]).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// COCKPIT_HARDENING_TEST_IDS
// ---------------------------------------------------------------------------

describe('COCKPIT_HARDENING_TEST_IDS', () => {
  it('exports all expected test ID constants', () => {
    const expected = [
      'STALE_DATA_BANNER',
      'STALENESS_BADGE',
      'PARTIAL_HYDRATION_NOTICE',
      'DEGRADED_GUIDANCE_PANEL',
      'DEGRADED_NEXT_ACTION',
      'EVIDENCE_COMPLETENESS_BADGE',
      'MISSING_EVIDENCE_LIST',
      'MISSING_EVIDENCE_ITEM',
      'ESCALATION_ERROR_GUIDANCE',
      'ESCALATION_ERROR_RETRY_BTN',
    ]
    for (const key of expected) {
      expect(COCKPIT_HARDENING_TEST_IDS[key as keyof typeof COCKPIT_HARDENING_TEST_IDS]).toBeTruthy()
    }
  })

  it('all test ID values are unique strings', () => {
    const values = Object.values(COCKPIT_HARDENING_TEST_IDS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })
})

// ---------------------------------------------------------------------------
// PARTIAL_HYDRATION_THRESHOLD
// ---------------------------------------------------------------------------

describe('PARTIAL_HYDRATION_THRESHOLD', () => {
  it('is a numeric value between 0 and 1', () => {
    expect(PARTIAL_HYDRATION_THRESHOLD).toBeGreaterThan(0)
    expect(PARTIAL_HYDRATION_THRESHOLD).toBeLessThanOrEqual(1)
  })
})
