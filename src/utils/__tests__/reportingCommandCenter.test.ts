/**
 * Unit Tests: reportingCommandCenter.ts
 *
 * Covers template/run type definitions, freshness classification,
 * command-center summary derivation, CTA availability rules,
 * CSS badge helpers, cadence label building, and test-ID constants.
 */

import { describe, it, expect } from 'vitest'
import {
  REPORT_AUDIENCE_LABELS,
  REPORT_CADENCE_LABELS,
  REPORT_CADENCE_DESCRIPTIONS,
  REPORT_RUN_STATUS_LABELS,
  EVIDENCE_FRESHNESS_LABELS,
  DELIVERY_DESTINATION_LABELS,
  REPORTING_CENTER_TEST_IDS,
  MOCK_TEMPLATES_HEALTHY,
  MOCK_TEMPLATES_BLOCKED,
  MOCK_RUNS_ACTIVE,
  deriveCommandCenterSummary,
  getRunCta,
  runStatusBadgeClass,
  freshnessIndicatorClass,
  templateCardBorderClass,
  buildCadenceLabel,
  isEvidenceBlocking,
  type ReportTemplate,
  type ReportRun,
  type ReportRunStatus,
  type EvidenceFreshnessState,
  type ReportCadence,
  type ReportAudience,
} from '../reportingCommandCenter'

// ---------------------------------------------------------------------------
// Audience labels
// ---------------------------------------------------------------------------

describe('REPORT_AUDIENCE_LABELS', () => {
  it('provides human-readable labels for all four enterprise audiences', () => {
    expect(REPORT_AUDIENCE_LABELS.internal_compliance).toBe('Internal Compliance Committee')
    expect(REPORT_AUDIENCE_LABELS.executive).toBe('Executive Leadership')
    expect(REPORT_AUDIENCE_LABELS.auditor).toBe('External Auditor')
    expect(REPORT_AUDIENCE_LABELS.regulator).toBe('Regulatory Authority')
  })
})

// ---------------------------------------------------------------------------
// Cadence labels
// ---------------------------------------------------------------------------

describe('REPORT_CADENCE_LABELS', () => {
  it('provides labels for all four cadence options', () => {
    expect(REPORT_CADENCE_LABELS.monthly).toBe('Monthly')
    expect(REPORT_CADENCE_LABELS.quarterly).toBe('Quarterly')
    expect(REPORT_CADENCE_LABELS.event_driven).toBe('Event-Driven')
    expect(REPORT_CADENCE_LABELS.manual).toBe('Manual (One-Off)')
  })

  it('provides non-empty descriptions for all cadences', () => {
    const cadences: ReportCadence[] = ['monthly', 'quarterly', 'event_driven', 'manual']
    for (const c of cadences) {
      expect(REPORT_CADENCE_DESCRIPTIONS[c].length).toBeGreaterThan(10)
    }
  })
})

// ---------------------------------------------------------------------------
// Run status labels
// ---------------------------------------------------------------------------

describe('REPORT_RUN_STATUS_LABELS', () => {
  it('covers all seven lifecycle states plus degraded', () => {
    const statuses: ReportRunStatus[] = [
      'draft', 'awaiting_review', 'awaiting_approval', 'scheduled',
      'blocked', 'exported', 'delivered', 'degraded',
    ]
    for (const s of statuses) {
      expect(REPORT_RUN_STATUS_LABELS[s]).toBeTruthy()
    }
  })

  it('draft maps to "Draft"', () => {
    expect(REPORT_RUN_STATUS_LABELS.draft).toBe('Draft')
  })

  it('blocked maps to "Blocked"', () => {
    expect(REPORT_RUN_STATUS_LABELS.blocked).toBe('Blocked')
  })
})

// ---------------------------------------------------------------------------
// Evidence freshness classification
// ---------------------------------------------------------------------------

describe('isEvidenceBlocking', () => {
  it('returns false for fresh evidence', () => {
    expect(isEvidenceBlocking('fresh')).toBe(false)
  })

  it('returns true for stale evidence', () => {
    expect(isEvidenceBlocking('stale')).toBe(true)
  })

  it('returns true for missing evidence', () => {
    expect(isEvidenceBlocking('missing')).toBe(true)
  })

  it('returns true for unresolved_blocker', () => {
    expect(isEvidenceBlocking('unresolved_blocker')).toBe(true)
  })

  it('returns true for unavailable', () => {
    expect(isEvidenceBlocking('unavailable')).toBe(true)
  })
})

describe('EVIDENCE_FRESHNESS_LABELS', () => {
  it('provides labels for all freshness states', () => {
    const states: EvidenceFreshnessState[] = ['fresh', 'stale', 'missing', 'unresolved_blocker', 'unavailable']
    for (const s of states) {
      expect(EVIDENCE_FRESHNESS_LABELS[s].length).toBeGreaterThan(2)
    }
  })

  it('fresh maps to "Up to Date"', () => {
    expect(EVIDENCE_FRESHNESS_LABELS.fresh).toBe('Up to Date')
  })
})

// ---------------------------------------------------------------------------
// deriveCommandCenterSummary
// ---------------------------------------------------------------------------

describe('deriveCommandCenterSummary', () => {
  it('returns zero counts when given empty arrays', () => {
    const summary = deriveCommandCenterSummary([], [])
    expect(summary.scheduledRunCount).toBe(0)
    expect(summary.blockedRunCount).toBe(0)
    expect(summary.staleEvidenceCount).toBe(0)
    expect(summary.awaitingActionCount).toBe(0)
  })

  it('counts scheduled runs correctly', () => {
    const runs: ReportRun[] = [
      { ...MOCK_RUNS_ACTIVE[0], status: 'scheduled' },
      { ...MOCK_RUNS_ACTIVE[1], status: 'scheduled' },
      { ...MOCK_RUNS_ACTIVE[2], status: 'delivered' },
    ]
    const summary = deriveCommandCenterSummary([], runs)
    expect(summary.scheduledRunCount).toBe(2)
  })

  it('counts blocked runs correctly', () => {
    const runs: ReportRun[] = [
      { ...MOCK_RUNS_ACTIVE[0], status: 'blocked' },
      { ...MOCK_RUNS_ACTIVE[1], status: 'blocked' },
      { ...MOCK_RUNS_ACTIVE[2], status: 'awaiting_review' },
    ]
    const summary = deriveCommandCenterSummary([], runs)
    expect(summary.blockedRunCount).toBe(2)
  })

  it('counts stale evidence across templates (stale, missing, unresolved_blocker)', () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_BLOCKED, [])
    // MOCK_TEMPLATES_BLOCKED has stale + fresh + missing + unresolved_blocker → 3 blocking
    expect(summary.staleEvidenceCount).toBe(3)
  })

  it('does not count fresh templates as stale', () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_HEALTHY, [])
    expect(summary.staleEvidenceCount).toBe(0)
  })

  it('counts awaiting_review and awaiting_approval for action count', () => {
    const runs: ReportRun[] = [
      { ...MOCK_RUNS_ACTIVE[0], status: 'awaiting_review' },
      { ...MOCK_RUNS_ACTIVE[1], status: 'awaiting_approval' },
      { ...MOCK_RUNS_ACTIVE[2], status: 'blocked' },
    ]
    const summary = deriveCommandCenterSummary([], runs)
    expect(summary.awaitingActionCount).toBe(2)
  })

  it('uses MOCK_RUNS_ACTIVE correctly — blocked + awaiting_approval + delivered', () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_HEALTHY, MOCK_RUNS_ACTIVE)
    expect(summary.blockedRunCount).toBe(1)
    expect(summary.awaitingActionCount).toBe(1)
    expect(summary.scheduledRunCount).toBe(0)
    expect(summary.staleEvidenceCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getRunCta
// ---------------------------------------------------------------------------

describe('getRunCta', () => {
  function makeRun(status: ReportRunStatus): ReportRun {
    return { ...MOCK_RUNS_ACTIVE[0], status }
  }

  it('returns "review" for awaiting_review', () => {
    expect(getRunCta(makeRun('awaiting_review'))).toBe('review')
  })

  it('returns "approve" for awaiting_approval', () => {
    expect(getRunCta(makeRun('awaiting_approval'))).toBe('approve')
  })

  it('returns "view" for exported', () => {
    expect(getRunCta(makeRun('exported'))).toBe('view')
  })

  it('returns "view" for delivered', () => {
    expect(getRunCta(makeRun('delivered'))).toBe('view')
  })

  it('returns "view_blockers" for blocked', () => {
    expect(getRunCta(makeRun('blocked'))).toBe('view_blockers')
  })

  it('returns "view_blockers" for degraded', () => {
    expect(getRunCta(makeRun('degraded'))).toBe('view_blockers')
  })

  it('returns null for draft', () => {
    expect(getRunCta(makeRun('draft'))).toBeNull()
  })

  it('returns null for scheduled', () => {
    expect(getRunCta(makeRun('scheduled'))).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// CSS badge helpers
// ---------------------------------------------------------------------------

describe('runStatusBadgeClass', () => {
  it('delivered uses green badge', () => {
    expect(runStatusBadgeClass('delivered')).toContain('green')
  })

  it('blocked uses red badge', () => {
    expect(runStatusBadgeClass('blocked')).toContain('red')
  })

  it('awaiting_review uses yellow badge', () => {
    expect(runStatusBadgeClass('awaiting_review')).toContain('yellow')
  })

  it('scheduled uses blue badge', () => {
    expect(runStatusBadgeClass('scheduled')).toContain('blue')
  })

  it('degraded uses orange badge', () => {
    expect(runStatusBadgeClass('degraded')).toContain('orange')
  })

  it('draft uses gray badge', () => {
    expect(runStatusBadgeClass('draft')).toContain('gray')
  })
})

describe('freshnessIndicatorClass', () => {
  it('fresh uses green indicator', () => {
    expect(freshnessIndicatorClass('fresh')).toContain('green')
  })

  it('stale uses yellow indicator', () => {
    expect(freshnessIndicatorClass('stale')).toContain('yellow')
  })

  it('missing uses red indicator', () => {
    expect(freshnessIndicatorClass('missing')).toContain('red')
  })

  it('unresolved_blocker uses red indicator', () => {
    expect(freshnessIndicatorClass('unresolved_blocker')).toContain('red')
  })

  it('unavailable uses gray indicator', () => {
    expect(freshnessIndicatorClass('unavailable')).toContain('gray')
  })
})

describe('templateCardBorderClass', () => {
  it('fresh has green left border', () => {
    expect(templateCardBorderClass('fresh')).toContain('green')
  })

  it('stale has yellow left border', () => {
    expect(templateCardBorderClass('stale')).toContain('yellow')
  })

  it('missing has red left border', () => {
    expect(templateCardBorderClass('missing')).toContain('red')
  })

  it('unavailable has gray left border', () => {
    expect(templateCardBorderClass('unavailable')).toContain('gray')
  })

  it('all variants include border-l-4 (non-color shape indicator)', () => {
    const states: EvidenceFreshnessState[] = ['fresh', 'stale', 'missing', 'unresolved_blocker', 'unavailable']
    for (const s of states) {
      expect(templateCardBorderClass(s)).toContain('border-l-4')
    }
  })
})

// ---------------------------------------------------------------------------
// buildCadenceLabel
// ---------------------------------------------------------------------------

describe('buildCadenceLabel', () => {
  it('returns plain cadence label when nextRunAt is null', () => {
    expect(buildCadenceLabel('manual', null)).toBe('Manual (One-Off)')
  })

  it('appends formatted date when nextRunAt is a valid ISO string', () => {
    const label = buildCadenceLabel('quarterly', '2026-04-01T09:00:00Z')
    expect(label).toContain('Quarterly')
    expect(label).toContain('2026')
  })

  it('falls back to cadence label when date is invalid', () => {
    expect(buildCadenceLabel('monthly', 'NOT_A_DATE')).toBe('Monthly')
  })
})

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

describe('REPORTING_CENTER_TEST_IDS', () => {
  it('has distinct non-empty values for every key', () => {
    const values = Object.values(REPORTING_CENTER_TEST_IDS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
    for (const v of values) {
      expect(typeof v).toBe('string')
      expect((v as string).length).toBeGreaterThan(0)
    }
  })

  it('PAGE_ROOT is "reporting-command-center"', () => {
    expect(REPORTING_CENTER_TEST_IDS.PAGE_ROOT).toBe('reporting-command-center')
  })

  it('TEMPLATE_CARD is "report-template-card"', () => {
    expect(REPORTING_CENTER_TEST_IDS.TEMPLATE_CARD).toBe('report-template-card')
  })
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

describe('MOCK_TEMPLATES_HEALTHY', () => {
  it('has four templates covering all four enterprise audiences', () => {
    const audiences: ReportAudience[] = MOCK_TEMPLATES_HEALTHY.map((t) => t.audience)
    expect(audiences).toContain('internal_compliance')
    expect(audiences).toContain('executive')
    expect(audiences).toContain('regulator')
    expect(audiences).toContain('auditor')
  })

  it('all healthy templates have fresh evidence', () => {
    for (const t of MOCK_TEMPLATES_HEALTHY) {
      expect(t.evidenceFreshness).toBe('fresh')
    }
  })
})

describe('MOCK_TEMPLATES_BLOCKED', () => {
  it('contains stale, missing, and unresolved_blocker states', () => {
    const states = MOCK_TEMPLATES_BLOCKED.map((t) => t.evidenceFreshness)
    expect(states).toContain('stale')
    expect(states).toContain('missing')
    expect(states).toContain('unresolved_blocker')
  })
})

describe('MOCK_RUNS_ACTIVE', () => {
  it('contains at least one blocked run with a remediation path', () => {
    const blocked = MOCK_RUNS_ACTIVE.filter((r) => r.status === 'blocked')
    expect(blocked.length).toBeGreaterThan(0)
    for (const r of blocked) {
      expect(r.remediationPath).toBeTruthy()
    }
  })

  it('contains a run with a non-null changeSummary', () => {
    const withSummary = MOCK_RUNS_ACTIVE.filter((r) => r.changeSummary !== null)
    expect(withSummary.length).toBeGreaterThan(0)
  })

  it('changeSummary highlights is a non-empty array', () => {
    const run = MOCK_RUNS_ACTIVE.find((r) => r.changeSummary !== null)
    expect(run?.changeSummary?.highlights).toBeDefined()
    expect(run!.changeSummary!.highlights.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Delivery destination labels
// ---------------------------------------------------------------------------

describe('DELIVERY_DESTINATION_LABELS', () => {
  it('provides labels for all four delivery options', () => {
    expect(DELIVERY_DESTINATION_LABELS.internal_portal).toBeTruthy()
    expect(DELIVERY_DESTINATION_LABELS.email).toBeTruthy()
    expect(DELIVERY_DESTINATION_LABELS.sftp_export).toBeTruthy()
    expect(DELIVERY_DESTINATION_LABELS.unavailable).toBeTruthy()
  })

  it('unavailable maps to a plain-language "not configured" message', () => {
    expect(DELIVERY_DESTINATION_LABELS.unavailable).toMatch(/not configured/i)
  })
})
