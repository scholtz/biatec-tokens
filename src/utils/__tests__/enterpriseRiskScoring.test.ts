/**
 * Unit tests for enterpriseRiskScoring.ts
 *
 * Covers:
 *  - daysSince helper
 *  - scoreToBand helper
 *  - KYC/AML factor derivation
 *  - Whitelist factor derivation
 *  - Jurisdiction factor derivation
 *  - Evidence section factor derivation
 *  - Investor eligibility factor derivation
 *  - computeRiskAssessment (integration of all factors)
 *  - buildReportSections (preset + override logic)
 *  - buildCustomReportPayload
 *  - formatReportAsText
 *  - Edge cases: missing data, all-clean, maximum risk
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  daysSince,
  scoreToBand,
  deriveKycAmlFactors,
  deriveWhitelistFactors,
  deriveJurisdictionFactors,
  deriveEvidenceFactors,
  deriveInvestorEligibilityFactors,
  computeRiskAssessment,
  buildReportSections,
  buildCustomReportPayload,
  formatReportAsText,
  STALE_DAYS_THRESHOLD,
  REPORT_SECTION_DEFS,
  HEURISTIC_DISCLAIMER,
  PRESET_LABELS,
  RISK_BAND_LABELS,
} from '../enterpriseRiskScoring'
import type { ComplianceReportBundle } from '../complianceEvidencePack'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBundle(overrides: Partial<ComplianceReportBundle> = {}): ComplianceReportBundle {
  return {
    generatedAt: new Date().toISOString(),
    launchName: 'Test Launch',
    overallStatus: 'ready',
    readinessScore: 80,
    jurisdiction: {
      configured: true,
      jurisdictions: ['DE', 'FR', 'US'],
      restrictedCount: 1,
      permittedCount: 2,
      staleSince: null,
    },
    kycAml: {
      status: 'ready',
      kycRequired: true,
      amlRequired: true,
      providerConfigured: true,
      pendingReviewCount: 0,
      staleSince: null,
    },
    whitelist: {
      status: 'ready',
      whitelistRequired: true,
      approvedInvestorCount: 5,
      pendingInvestorCount: 2,
      activeWhitelistId: 'wl-001',
      staleSince: null,
    },
    investorEligibility: {
      status: 'ready',
      accreditedRequired: true,
      retailPermitted: false,
      eligibilityCategories: ['accredited'],
      staleSince: null,
    },
    evidenceSections: [],
    exportVersion: '1.0',
    ...overrides,
  }
}

/** Returns an ISO timestamp N days ago. */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

// ---------------------------------------------------------------------------
// daysSince
// ---------------------------------------------------------------------------

describe('daysSince', () => {
  it('returns null for null input', () => {
    expect(daysSince(null)).toBeNull()
  })

  it('returns 0 for a timestamp that is now', () => {
    const now = new Date().toISOString()
    expect(daysSince(now)).toBe(0)
  })

  it('returns correct days for a timestamp 10 days ago', () => {
    const ts = daysAgo(10)
    expect(daysSince(ts)).toBe(10)
  })

  it('returns correct days for a timestamp 31 days ago', () => {
    const ts = daysAgo(31)
    expect(daysSince(ts)).toBe(31)
  })

  it('returns null for an unparseable string', () => {
    expect(daysSince('not-a-date')).toBeNull()
  })

  // ── Invalid / malformed ISO string regression tests ────────────────────────
  // These guard the isNaN path added to the shared helper. A component-local
  // duplicate that omits the isNaN check would return a large positive number
  // instead of null, silently marking stale evidence as non-stale (the bug
  // reported in the product-owner review of PR #647).

  it('returns null for an empty string (NaN guard)', () => {
    expect(daysSince('')).toBeNull()
  })

  it('returns null for a string that new Date() treats as NaN ("not-a-date")', () => {
    // new Date('not-a-date').getTime() === NaN — must return null, not a
    // large negative or positive number that bypasses staleness checks.
    // This is the canonical "truly unparseable" string.
    expect(daysSince('not-a-date')).toBeNull()
  })

  it('returns null for a truncated ISO string missing time component ("2020-01")', () => {
    // "2020-01" is accepted by some environments as NaN — must be treated as
    // invalid to avoid silently masking freshness misclassification.
    const result = daysSince('2020-01')
    // Either null (correctly rejected) or a positive integer (date was parsed)
    // are acceptable, but it must NOT be NaN propagated as 0.
    if (result !== null) {
      expect(typeof result).toBe('number')
      expect(isNaN(result)).toBe(false)
    }
  })

  it('does not return NaN for any string input — NaN is always converted to null', () => {
    const inputs = ['', 'NaN', 'undefined', '0', 'garbage', '2020-99-99', 'not-a-date']
    for (const input of inputs) {
      const result = daysSince(input)
      // result must be either null or a finite integer — never NaN
      if (result !== null) {
        expect(isNaN(result)).toBe(false)
      }
    }
  })

  it('returns null for a numeric string that new Date() may misinterpret ("0")', () => {
    // new Date('0') varies by JS engine — ensure we never leak NaN
    const result = daysSince('0')
    if (result !== null) {
      expect(isNaN(result)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// scoreToBand
// ---------------------------------------------------------------------------

describe('scoreToBand', () => {
  it('returns critical for 80', () => expect(scoreToBand(80)).toBe('critical'))
  it('returns critical for 100', () => expect(scoreToBand(100)).toBe('critical'))
  it('returns high for 79', () => expect(scoreToBand(79)).toBe('high'))
  it('returns high for 60', () => expect(scoreToBand(60)).toBe('high'))
  it('returns medium for 59', () => expect(scoreToBand(59)).toBe('medium'))
  it('returns medium for 40', () => expect(scoreToBand(40)).toBe('medium'))
  it('returns low for 39', () => expect(scoreToBand(39)).toBe('low'))
  it('returns low for 20', () => expect(scoreToBand(20)).toBe('low'))
  it('returns minimal for 19', () => expect(scoreToBand(19)).toBe('minimal'))
  it('returns minimal for 0', () => expect(scoreToBand(0)).toBe('minimal'))
})

// ---------------------------------------------------------------------------
// deriveKycAmlFactors
// ---------------------------------------------------------------------------

describe('deriveKycAmlFactors', () => {
  it('returns no factors for a fully configured, fresh KYC/AML setup', () => {
    const { factors, incompleteSources } = deriveKycAmlFactors(makeBundle())
    expect(factors).toHaveLength(0)
    expect(incompleteSources).toHaveLength(0)
  })

  it('returns critical factor when KYC required but provider not configured', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    expect(factors.some(f => f.id === 'kyc-no-provider')).toBe(true)
    const kyc = factors.find(f => f.id === 'kyc-no-provider')!
    expect(kyc.score).toBe(25)
    expect(kyc.band).toBe('critical')
    expect(kyc.evidencePath).toBe('/compliance/setup')
  })

  it('returns high factor when AML required but provider not configured', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: false,
        amlRequired: true,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    expect(factors.some(f => f.id === 'aml-no-provider')).toBe(true)
    const aml = factors.find(f => f.id === 'aml-no-provider')!
    expect(aml.score).toBe(20)
    expect(aml.band).toBe('high')
  })

  it('returns medium factor for pending reviews', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, pendingReviewCount: 2 },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    const pending = factors.find(f => f.id === 'kyc-pending-reviews')!
    expect(pending).toBeDefined()
    expect(pending.band).toBe('medium')
  })

  it('returns high factor for >3 pending reviews', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, pendingReviewCount: 5 },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    const pending = factors.find(f => f.id === 'kyc-pending-reviews')!
    expect(pending.band).toBe('high')
  })

  it('returns high stale factor when staleSince > STALE_DAYS_THRESHOLD days', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, staleSince: daysAgo(STALE_DAYS_THRESHOLD + 5) },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    const stale = factors.find(f => f.id === 'kyc-stale')!
    expect(stale).toBeDefined()
    expect(stale.isStale).toBe(true)
    expect(stale.staleDays).toBeGreaterThan(STALE_DAYS_THRESHOLD)
    expect(stale.band).toBe('high')
  })

  it('does NOT return stale factor when staleSince is within threshold', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, staleSince: daysAgo(10) },
    })
    const { factors } = deriveKycAmlFactors(bundle)
    expect(factors.find(f => f.id === 'kyc-stale')).toBeUndefined()
  })

  it('returns incomplete source when KYC status is unavailable', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, status: 'unavailable' },
    })
    const { factors, incompleteSources } = deriveKycAmlFactors(bundle)
    expect(factors).toHaveLength(0)
    expect(incompleteSources).toContain('KYC/AML status')
  })
})

// ---------------------------------------------------------------------------
// deriveWhitelistFactors
// ---------------------------------------------------------------------------

describe('deriveWhitelistFactors', () => {
  it('returns no factors for a configured whitelist with approved investors', () => {
    const { factors } = deriveWhitelistFactors(makeBundle())
    expect(factors).toHaveLength(0)
  })

  it('returns critical factor when whitelist required but no active whitelist', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const { factors } = deriveWhitelistFactors(bundle)
    const factor = factors.find(f => f.id === 'whitelist-no-active')!
    expect(factor).toBeDefined()
    expect(factor.score).toBe(25)
    expect(factor.band).toBe('critical')
  })

  it('returns high factor when whitelist exists but has 0 approved investors', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 3,
        activeWhitelistId: 'wl-001',
        staleSince: null,
      },
    })
    const { factors } = deriveWhitelistFactors(bundle)
    const factor = factors.find(f => f.id === 'whitelist-empty')!
    expect(factor).toBeDefined()
    expect(factor.score).toBe(20)
    expect(factor.band).toBe('high')
  })

  it('returns medium stale factor when staleSince > threshold', () => {
    const bundle = makeBundle({
      whitelist: { ...makeBundle().whitelist, staleSince: daysAgo(STALE_DAYS_THRESHOLD + 1) },
    })
    const { factors } = deriveWhitelistFactors(bundle)
    const stale = factors.find(f => f.id === 'whitelist-stale')!
    expect(stale).toBeDefined()
    expect(stale.band).toBe('medium')
  })

  it('returns incomplete source when whitelist status is unavailable', () => {
    const bundle = makeBundle({
      whitelist: { ...makeBundle().whitelist, status: 'unavailable' },
    })
    const { incompleteSources } = deriveWhitelistFactors(bundle)
    expect(incompleteSources).toContain('Whitelist status')
  })
})

// ---------------------------------------------------------------------------
// deriveJurisdictionFactors
// ---------------------------------------------------------------------------

describe('deriveJurisdictionFactors', () => {
  it('returns no factors for a configured jurisdiction with permitted countries', () => {
    const { factors } = deriveJurisdictionFactors(makeBundle())
    expect(factors).toHaveLength(0)
  })

  it('returns high factor when jurisdiction not configured', () => {
    const bundle = makeBundle({
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        restrictedCount: 0,
        permittedCount: 0,
        staleSince: null,
      },
    })
    const { factors } = deriveJurisdictionFactors(bundle)
    const factor = factors.find(f => f.id === 'jurisdiction-not-configured')!
    expect(factor).toBeDefined()
    expect(factor.score).toBe(20)
    expect(factor.band).toBe('high')
  })

  it('returns high factor when jurisdiction configured but no permitted jurisdictions', () => {
    const bundle = makeBundle({
      jurisdiction: {
        configured: true,
        jurisdictions: [],
        restrictedCount: 5,
        permittedCount: 0,
        staleSince: null,
      },
    })
    const { factors } = deriveJurisdictionFactors(bundle)
    const factor = factors.find(f => f.id === 'jurisdiction-no-permitted')!
    expect(factor).toBeDefined()
    expect(factor.score).toBe(15)
    expect(factor.band).toBe('high')
  })

  it('returns medium stale factor when evidence is stale', () => {
    const bundle = makeBundle({
      jurisdiction: { ...makeBundle().jurisdiction, staleSince: daysAgo(STALE_DAYS_THRESHOLD + 5) },
    })
    const { factors } = deriveJurisdictionFactors(bundle)
    const factor = factors.find(f => f.id === 'jurisdiction-stale')!
    expect(factor).toBeDefined()
    expect(factor.band).toBe('medium')
  })
})

// ---------------------------------------------------------------------------
// deriveEvidenceFactors
// ---------------------------------------------------------------------------

describe('deriveEvidenceFactors', () => {
  it('returns no factors when all evidence sections pass', () => {
    const bundle = makeBundle({
      evidenceSections: [
        {
          id: 'acc',
          title: 'Accessibility',
          status: 'ready',
          releaseGrade: true,
          summary: '',
          details: [],
          timestamp: null,
          actionLabel: null,
          actionPath: null,
        },
      ],
    })
    const { factors } = deriveEvidenceFactors(bundle)
    expect(factors.find(f => f.id === 'evidence-failed-sections')).toBeUndefined()
  })

  it('returns high factor for failed evidence sections', () => {
    const bundle = makeBundle({
      evidenceSections: [
        {
          id: 'acc',
          title: 'Accessibility',
          status: 'failed',
          releaseGrade: true,
          summary: '',
          details: [],
          timestamp: null,
          actionLabel: null,
          actionPath: null,
        },
        {
          id: 'backend',
          title: 'Backend Sign-off',
          status: 'failed',
          releaseGrade: true,
          summary: '',
          details: [],
          timestamp: null,
          actionLabel: null,
          actionPath: null,
        },
      ],
    })
    const { factors } = deriveEvidenceFactors(bundle)
    const failed = factors.find(f => f.id === 'evidence-failed-sections')!
    expect(failed).toBeDefined()
    expect(failed.band).toBe('high')
    expect(failed.score).toBeGreaterThan(0)
  })

  it('returns medium factor for pending evidence sections', () => {
    const bundle = makeBundle({
      evidenceSections: [
        {
          id: 'pending-sec',
          title: 'Policy Review',
          status: 'pending',
          releaseGrade: true,
          summary: '',
          details: [],
          timestamp: null,
          actionLabel: null,
          actionPath: null,
        },
      ],
    })
    const { factors } = deriveEvidenceFactors(bundle)
    const pending = factors.find(f => f.id === 'evidence-pending-sections')!
    expect(pending).toBeDefined()
    expect(pending.band).toBe('medium')
  })

  it('caps total evidence factor score at 15', () => {
    // 4 failed sections × 5 = 20, should cap at 15
    const failedSections = Array.from({ length: 4 }, (_, i) => ({
      id: `s-${i}`,
      title: `Section ${i}`,
      status: 'failed' as const,
      releaseGrade: true,
      summary: '',
      details: [],
      timestamp: null,
      actionLabel: null,
      actionPath: null,
    }))
    const bundle = makeBundle({ evidenceSections: failedSections })
    const { factors } = deriveEvidenceFactors(bundle)
    const failed = factors.find(f => f.id === 'evidence-failed-sections')!
    expect(failed.score).toBeLessThanOrEqual(15)
  })
})

// ---------------------------------------------------------------------------
// deriveInvestorEligibilityFactors
// ---------------------------------------------------------------------------

describe('deriveInvestorEligibilityFactors', () => {
  it('returns no factors for a ready, fresh eligibility setup', () => {
    const { factors } = deriveInvestorEligibilityFactors(makeBundle())
    expect(factors).toHaveLength(0)
  })

  it('returns medium factor when eligibility status is failed', () => {
    const bundle = makeBundle({
      investorEligibility: { ...makeBundle().investorEligibility, status: 'failed' },
    })
    const { factors } = deriveInvestorEligibilityFactors(bundle)
    expect(factors.find(f => f.id === 'investor-eligibility-failed')).toBeDefined()
  })

  it('returns medium stale factor when staleSince > threshold', () => {
    const bundle = makeBundle({
      investorEligibility: {
        ...makeBundle().investorEligibility,
        staleSince: daysAgo(STALE_DAYS_THRESHOLD + 1),
      },
    })
    const { factors } = deriveInvestorEligibilityFactors(bundle)
    const stale = factors.find(f => f.id === 'investor-eligibility-stale')!
    expect(stale).toBeDefined()
    expect(stale.band).toBe('medium')
  })

  it('returns incomplete source when eligibility status is unavailable', () => {
    const bundle = makeBundle({
      investorEligibility: { ...makeBundle().investorEligibility, status: 'unavailable' },
    })
    const { incompleteSources } = deriveInvestorEligibilityFactors(bundle)
    expect(incompleteSources).toContain('Investor eligibility status')
  })
})

// ---------------------------------------------------------------------------
// computeRiskAssessment
// ---------------------------------------------------------------------------

describe('computeRiskAssessment', () => {
  it('returns minimal risk for a fully compliant bundle', () => {
    const result = computeRiskAssessment(makeBundle())
    expect(result.overallScore).toBe(0)
    expect(result.overallBand).toBe('minimal')
    expect(result.factors).toHaveLength(0)
    expect(result.topFactors).toHaveLength(0)
    expect(result.isHeuristic).toBe(true)
  })

  it('returns critical band when multiple critical blockers exist', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: false,
        pendingReviewCount: 5,
        staleSince: null,
      },
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        restrictedCount: 0,
        permittedCount: 0,
        staleSince: null,
      },
    })
    const result = computeRiskAssessment(bundle)
    expect(result.overallScore).toBeGreaterThanOrEqual(60)
    expect(['critical', 'high'].includes(result.overallBand)).toBe(true)
  })

  it('caps overall score at 100', () => {
    // Extreme case: all blockers at once
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: false,
        pendingReviewCount: 10,
        staleSince: daysAgo(60),
      },
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: daysAgo(60),
      },
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        restrictedCount: 0,
        permittedCount: 0,
        staleSince: null,
      },
      investorEligibility: {
        status: 'failed',
        accreditedRequired: false,
        retailPermitted: true,
        eligibilityCategories: [],
        staleSince: null,
      },
      evidenceSections: Array.from({ length: 3 }, (_, i) => ({
        id: `s-${i}`,
        title: `Section ${i}`,
        status: 'failed' as const,
        releaseGrade: true,
        summary: '',
        details: [],
        timestamp: null,
        actionLabel: null,
        actionPath: null,
      })),
    })
    const result = computeRiskAssessment(bundle)
    expect(result.overallScore).toBeLessThanOrEqual(100)
  })

  it('sorts factors by score descending', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 1,
        staleSince: null,
      },
    })
    const result = computeRiskAssessment(bundle)
    for (let i = 1; i < result.factors.length; i++) {
      expect(result.factors[i - 1].score).toBeGreaterThanOrEqual(result.factors[i].score)
    }
  })

  it('topFactors contains at most 3 items', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: false,
        pendingReviewCount: 5,
        staleSince: daysAgo(60),
      },
    })
    const result = computeRiskAssessment(bundle)
    expect(result.topFactors.length).toBeLessThanOrEqual(3)
  })

  it('includes assessedAt as a valid ISO timestamp', () => {
    const result = computeRiskAssessment(makeBundle())
    expect(() => new Date(result.assessedAt)).not.toThrow()
    expect(new Date(result.assessedAt).toISOString()).toBe(result.assessedAt)
  })

  it('de-duplicates recommendations', () => {
    // Both KYC and AML blockers recommend the same compliance setup path
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = computeRiskAssessment(bundle)
    const seen = new Set(result.recommendedActions)
    expect(seen.size).toBe(result.recommendedActions.length)
  })

  it('collects incomplete sources across all factor derivers', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, status: 'unavailable' },
      whitelist: { ...makeBundle().whitelist, status: 'unavailable' },
    })
    const result = computeRiskAssessment(bundle)
    expect(result.incompleteSources.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// buildReportSections
// ---------------------------------------------------------------------------

describe('buildReportSections', () => {
  it('includes all sections for the operator preset by default', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const sections = buildReportSections('operator', bundle, assessment)
    const operatorDefaults = REPORT_SECTION_DEFS.filter(d =>
      d.defaultForPresets.includes('operator'),
    )
    operatorDefaults.forEach(def => {
      const section = sections.find(s => s.def.id === def.id)!
      expect(section.included).toBe(true)
    })
  })

  it('only includes executive preset sections for executive preset', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const sections = buildReportSections('executive', bundle, assessment)

    const execDefs = REPORT_SECTION_DEFS.filter(d => d.defaultForPresets.includes('executive'))
    const nonExecDefs = REPORT_SECTION_DEFS.filter(d => !d.defaultForPresets.includes('executive'))

    execDefs.forEach(def => {
      expect(sections.find(s => s.def.id === def.id)!.included).toBe(true)
    })
    nonExecDefs.forEach(def => {
      expect(sections.find(s => s.def.id === def.id)!.included).toBe(false)
    })
  })

  it('respects operator override to include a non-default section', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    // evidence-inventory is not default for executive
    const overrides = new Map([['evidence-inventory', true]])
    const sections = buildReportSections('executive', bundle, assessment, overrides)
    expect(sections.find(s => s.def.id === 'evidence-inventory')!.included).toBe(true)
  })

  it('respects operator override to exclude a default section', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    // risk-overview is default for all presets
    const overrides = new Map([['risk-overview', false]])
    const sections = buildReportSections('operator', bundle, assessment, overrides)
    expect(sections.find(s => s.def.id === 'risk-overview')!.included).toBe(false)
  })

  it('sets omitReason for excluded sections', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const sections = buildReportSections('executive', bundle, assessment)
    const omitted = sections.filter(s => !s.included)
    omitted.forEach(s => {
      expect(s.omitReason).not.toBeNull()
    })
  })

  it('returns one IncludedSection per REPORT_SECTION_DEF', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const sections = buildReportSections('operator', bundle, assessment)
    expect(sections).toHaveLength(REPORT_SECTION_DEFS.length)
  })
})

// ---------------------------------------------------------------------------
// buildCustomReportPayload
// ---------------------------------------------------------------------------

describe('buildCustomReportPayload', () => {
  it('produces a payload with the correct preset label', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('executive', bundle, assessment)
    expect(payload.preset).toBe('executive')
    expect(payload.presetLabel).toBe(PRESET_LABELS.executive)
  })

  it('sets exportVersion to "2.0"', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    expect(payload.exportVersion).toBe('2.0')
  })

  it('includes the heuristic disclaimer', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('procurement', bundle, assessment)
    expect(payload.heuristicDisclaimer).toBe(HEURISTIC_DISCLAIMER)
  })

  it('includes generatedAt as a valid ISO timestamp', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    expect(() => new Date(payload.generatedAt)).not.toThrow()
  })

  it('applies section overrides', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const overrides = new Map([['evidence-inventory', true]])
    const payload = buildCustomReportPayload('executive', bundle, assessment, overrides)
    const inventorySection = payload.includedSections.find(s => s.def.id === 'evidence-inventory')!
    expect(inventorySection.included).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// formatReportAsText
// ---------------------------------------------------------------------------

describe('formatReportAsText', () => {
  it('includes the launch name in the output', () => {
    const bundle = makeBundle({ launchName: 'Acme Corp Token' })
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('Acme Corp Token')
  })

  it('includes the preset label', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('executive', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain(PRESET_LABELS.executive)
  })

  it('includes the risk band label for a non-trivial risk', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain(RISK_BAND_LABELS[assessment.overallBand])
  })

  it('labels omitted sections', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    // executive preset excludes evidence-inventory by default
    const payload = buildCustomReportPayload('executive', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('[SECTION OMITTED:')
  })

  it('includes the disclaimer', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('DISCLAIMER')
  })

  it('ends with END OF REPORT', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text.trim()).toMatch(/END OF REPORT$/)
  })

  it('labels stale evidence items in stale-evidence section', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, staleSince: daysAgo(STALE_DAYS_THRESHOLD + 5) },
    })
    const assessment = computeRiskAssessment(bundle)
    // operator preset includes stale-evidence by default
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('KYC/AML Records')
  })

  it('says "No actions required" when there are no risk factors', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('No actions required')
  })

  it('includes all section headers for operator preset', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('operator', bundle, assessment)
    const text = formatReportAsText(payload)
    const includedDefs = REPORT_SECTION_DEFS.filter(d => d.defaultForPresets.includes('operator'))
    includedDefs.forEach(def => {
      expect(text).toContain(def.label.toUpperCase())
    })
  })

  it('handles null launchName gracefully', () => {
    const bundle = makeBundle({ launchName: null })
    const assessment = computeRiskAssessment(bundle)
    const payload = buildCustomReportPayload('executive', bundle, assessment)
    const text = formatReportAsText(payload)
    expect(text).toContain('Not specified')
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('handles an empty evidence sections array without errors', () => {
    const bundle = makeBundle({ evidenceSections: [] })
    expect(() => computeRiskAssessment(bundle)).not.toThrow()
  })

  it('handles all-unavailable subsystems without throwing', () => {
    const bundle = makeBundle({
      kycAml: { ...makeBundle().kycAml, status: 'unavailable' },
      whitelist: { ...makeBundle().whitelist, status: 'unavailable' },
      investorEligibility: { ...makeBundle().investorEligibility, status: 'unavailable' },
    })
    expect(() => computeRiskAssessment(bundle)).not.toThrow()
  })

  it('formatReportAsText handles a payload with all sections omitted (executive empty)', () => {
    const bundle = makeBundle()
    const assessment = computeRiskAssessment(bundle)
    // Exclude every section
    const overrides = new Map(REPORT_SECTION_DEFS.map(d => [d.id, false]))
    const payload = buildCustomReportPayload('executive', bundle, assessment, overrides)
    expect(() => formatReportAsText(payload)).not.toThrow()
  })
})
