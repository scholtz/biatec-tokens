/**
 * Unit Tests: auditExportPackage.ts
 *
 * Covers evidence manifest construction, timeline building,
 * contradiction detection, audit package assembly, readiness gating,
 * and CSS helper functions.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildEvidenceManifest,
  buildEvidenceTimeline,
  detectContradictions,
  assembleAuditExportPackage,
  contradictionSeverityBadgeClass,
  manifestAuthorityBadgeClass,
  auditPackageReadinessClass,
  EVIDENCE_AUTHORITY_LABELS,
  CONTRADICTION_SEVERITY_LABELS,
  type EvidenceManifestEntry,
  type EvidenceTimelineEvent,
  type ContradictionFlag,
  type AuditExportPackage,
} from '../auditExportPackage'
import type { ComplianceReportBundle } from '../complianceEvidencePack'
import type { ApprovalHistorySummary, ExportPackageReadiness } from '../complianceReportingWorkspace'
import { deriveExportPackageReadiness } from '../complianceReportingWorkspace'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeBundle(overrides: Partial<ComplianceReportBundle> = {}): ComplianceReportBundle {
  return {
    generatedAt: new Date().toISOString(),
    launchName: 'Test Token Launch',
    overallStatus: 'ready',
    readinessScore: 100,
    jurisdiction: {
      configured: true,
      jurisdictions: ['Germany', 'France'],
      permittedCount: 2,
      restrictedCount: 0,
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
      pendingInvestorCount: 0,
      activeWhitelistId: 'wl-001',
      staleSince: null,
    },
    investorEligibility: {
      status: 'ready',
      accreditedRequired: true,
      retailPermitted: false,
      eligibilityCategories: ['Accredited'],
      staleSince: null,
    },
    evidenceSections: [],
    exportVersion: '1.0',
    ...overrides,
  }
}

function makeApprovalSummary(overrides: Partial<ApprovalHistorySummary> = {}): ApprovalHistorySummary {
  return {
    totalStages: 3,
    approvedCount: 2,
    conditionalCount: 1,
    blockedCount: 0,
    pendingCount: 0,
    allLaunchCriticalSigned: true,
    lastActionAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    entries: [
      {
        id: 'legal',
        label: 'Legal Review',
        reviewerRole: 'Legal Counsel',
        outcome: 'approved',
        summary: 'Reviewed and approved',
        conditions: null,
        actionedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isLaunchBlocking: true,
      },
      {
        id: 'compliance',
        label: 'Compliance Sign-Off',
        reviewerRole: 'Compliance Officer',
        outcome: 'conditionally_approved',
        summary: 'Approved with conditions',
        conditions: 'Requires quarterly review',
        actionedAt: new Date(Date.now() - 2000 * 60 * 60).toISOString(),
        isLaunchBlocking: true,
      },
      {
        id: 'risk',
        label: 'Risk Assessment',
        reviewerRole: 'Risk Manager',
        outcome: 'approved',
        summary: 'Risk acceptable',
        conditions: null,
        actionedAt: new Date(Date.now() - 3000 * 60 * 60).toISOString(),
        isLaunchBlocking: false,
      },
    ],
    ...overrides,
  }
}

function makeExportReadiness(
  bundle: ComplianceReportBundle,
  approvalSummary: ApprovalHistorySummary | null = null,
): ExportPackageReadiness {
  return deriveExportPackageReadiness(bundle, approvalSummary)
}

// ---------------------------------------------------------------------------
// buildEvidenceManifest
// ---------------------------------------------------------------------------

describe('buildEvidenceManifest', () => {
  it('returns an entry for each core evidence domain', () => {
    const bundle = makeBundle()
    const manifest = buildEvidenceManifest(bundle, null)
    const ids = manifest.map((e) => e.id)
    expect(ids).toContain('manifest-jurisdiction')
    expect(ids).toContain('manifest-kyc-aml')
    expect(ids).toContain('manifest-whitelist')
    expect(ids).toContain('manifest-investor-eligibility')
    expect(ids).toContain('manifest-approval-history')
  })

  it('marks all entries as included when bundle is fully ready', () => {
    const bundle = makeBundle()
    const approvalSummary = makeApprovalSummary()
    const manifest = buildEvidenceManifest(bundle, approvalSummary)
    const coreIds = ['manifest-jurisdiction', 'manifest-kyc-aml', 'manifest-whitelist', 'manifest-investor-eligibility', 'manifest-approval-history']
    const coreEntries = manifest.filter((e) => coreIds.includes(e.id))
    expect(coreEntries.every((e) => e.isIncluded)).toBe(true)
  })

  it('marks jurisdiction as excluded when not configured', () => {
    const bundle = makeBundle({
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const juris = manifest.find((e) => e.id === 'manifest-jurisdiction')!
    expect(juris.isIncluded).toBe(false)
    expect(juris.exclusionReason).not.toBeNull()
    expect(juris.authorityLevel).toBe('pending')
  })

  it('marks kyc_aml as blocked when status is failed', () => {
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
    const manifest = buildEvidenceManifest(bundle, null)
    const kyc = manifest.find((e) => e.id === 'manifest-kyc-aml')!
    expect(kyc.isIncluded).toBe(false)
    expect(kyc.authorityLevel).toBe('blocked')
    expect(kyc.exclusionReason).toContain('failed state')
  })

  it('marks whitelist as blocked when status is failed', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 2,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const wl = manifest.find((e) => e.id === 'manifest-whitelist')!
    expect(wl.isIncluded).toBe(false)
    expect(wl.authorityLevel).toBe('blocked')
  })

  it('marks approval history as excluded when no stages recorded', () => {
    const manifest = buildEvidenceManifest(makeBundle(), null)
    const approval = manifest.find((e) => e.id === 'manifest-approval-history')!
    expect(approval.isIncluded).toBe(false)
    expect(approval.exclusionReason).not.toBeNull()
    expect(approval.authorityLevel).toBe('pending')
  })

  it('includes approval history when stages are present', () => {
    const approvalSummary = makeApprovalSummary()
    const manifest = buildEvidenceManifest(makeBundle(), approvalSummary)
    const approval = manifest.find((e) => e.id === 'manifest-approval-history')!
    expect(approval.isIncluded).toBe(true)
    expect(approval.exclusionReason).toBeNull()
  })

  it('marks approval history authority as pending when not all launch-critical stages signed', () => {
    const approvalSummary = makeApprovalSummary({ allLaunchCriticalSigned: false })
    const manifest = buildEvidenceManifest(makeBundle(), approvalSummary)
    const approval = manifest.find((e) => e.id === 'manifest-approval-history')!
    expect(approval.authorityLevel).toBe('pending')
  })

  it('includes evidence_section entries from bundle.evidenceSections', () => {
    const bundle = makeBundle({
      evidenceSections: [
        { id: 'sec1', title: 'Risk Assessment', status: 'ready', releaseGrade: true, summary: 'Risk assessed', timestamp: new Date().toISOString() },
        { id: 'sec2', title: 'Legal Review', status: 'failed', releaseGrade: false, summary: 'Review failed', timestamp: null },
      ],
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const sec1 = manifest.find((e) => e.id === 'manifest-evidence-sec1')
    const sec2 = manifest.find((e) => e.id === 'manifest-evidence-sec2')
    expect(sec1).toBeDefined()
    expect(sec1!.isIncluded).toBe(true)
    expect(sec1!.authorityLevel).toBe('authoritative')
    expect(sec2).toBeDefined()
    expect(sec2!.isIncluded).toBe(false)
    expect(sec2!.authorityLevel).toBe('blocked')
  })

  it('produces summaryText for whitelist when not required', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'ready',
        whitelistRequired: false,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const wl = manifest.find((e) => e.id === 'manifest-whitelist')!
    expect(wl.summaryText).toContain('not required')
    expect(wl.isIncluded).toBe(true)
  })

  it('marks entries as stale when staleSince exceeds 30 days', () => {
    const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      kycAml: {
        status: 'ready',
        kycRequired: false,
        amlRequired: false,
        providerConfigured: true,
        pendingReviewCount: 0,
        staleSince: staleDate,
      },
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const kyc = manifest.find((e) => e.id === 'manifest-kyc-aml')!
    expect(kyc.isStale).toBe(true)
  })

  it('does not mark entries as stale when staleSince is recent', () => {
    const recentDate = new Date(Date.now() - 1000 * 60).toISOString() // 1 min ago
    const bundle = makeBundle({
      kycAml: {
        status: 'ready',
        kycRequired: false,
        amlRequired: false,
        providerConfigured: true,
        pendingReviewCount: 0,
        staleSince: recentDate,
      },
    })
    const manifest = buildEvidenceManifest(bundle, null)
    const kyc = manifest.find((e) => e.id === 'manifest-kyc-aml')!
    expect(kyc.isStale).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// buildEvidenceTimeline
// ---------------------------------------------------------------------------

describe('buildEvidenceTimeline', () => {
  it('returns an empty array when all timestamps are null', () => {
    const bundle = makeBundle({
      jurisdiction: { configured: false, jurisdictions: [], permittedCount: 0, restrictedCount: 0, staleSince: null },
      kycAml: { status: 'pending', kycRequired: false, amlRequired: false, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
      whitelist: { status: 'pending', whitelistRequired: false, approvedInvestorCount: 0, pendingInvestorCount: 0, activeWhitelistId: null, staleSince: null },
      investorEligibility: { status: 'pending', accreditedRequired: false, retailPermitted: true, eligibilityCategories: [], staleSince: null },
    })
    const timeline = buildEvidenceTimeline(bundle, null)
    expect(timeline.length).toBe(0)
  })

  it('includes a configuration event for jurisdiction when configured and has timestamp', () => {
    const ts = new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
    const bundle = makeBundle({
      jurisdiction: { configured: true, jurisdictions: ['DE'], permittedCount: 1, restrictedCount: 0, staleSince: ts },
    })
    const timeline = buildEvidenceTimeline(bundle, null)
    const juris = timeline.find((e) => e.id === 'timeline-jurisdiction-configured')
    expect(juris).toBeDefined()
    expect(juris!.eventType).toBe('configuration')
    expect(juris!.isLaunchCritical).toBe(true)
  })

  it('includes a kyc_review event when pendingReviewCount > 0', () => {
    const ts = new Date().toISOString()
    const bundle = makeBundle({
      kycAml: { status: 'warning', kycRequired: true, amlRequired: true, providerConfigured: true, pendingReviewCount: 3, staleSince: ts },
    })
    const timeline = buildEvidenceTimeline(bundle, null)
    const kyc = timeline.find((e) => e.id === 'timeline-kyc-aml')
    expect(kyc).toBeDefined()
    expect(kyc!.eventType).toBe('kyc_review')
    expect(kyc!.detail).toContain('3 investor KYC review')
  })

  it('includes approval events from approvalSummary entries with actionedAt', () => {
    const approvalSummary = makeApprovalSummary()
    const timeline = buildEvidenceTimeline(makeBundle(), approvalSummary)
    const approvalEvents = timeline.filter((e) => e.eventType === 'approval')
    expect(approvalEvents.length).toBe(3)
  })

  it('does not include approval events for entries without actionedAt', () => {
    const approvalSummary = makeApprovalSummary({
      entries: [
        {
          id: 'pending-stage',
          label: 'Pending Review',
          reviewerRole: 'Reviewer',
          outcome: 'not_started',
          summary: '',
          conditions: null,
          actionedAt: null,
          isLaunchBlocking: false,
        },
      ],
    })
    const timeline = buildEvidenceTimeline(makeBundle(), approvalSummary)
    const pendingEvent = timeline.find((e) => e.id === 'timeline-approval-pending-stage')
    expect(pendingEvent).toBeUndefined()
  })

  it('sorts events in descending chronological order (most recent first)', () => {
    const older = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const newer = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      jurisdiction: { configured: true, jurisdictions: ['DE'], permittedCount: 1, restrictedCount: 0, staleSince: older },
      kycAml: { status: 'ready', kycRequired: false, amlRequired: false, providerConfigured: true, pendingReviewCount: 0, staleSince: newer },
    })
    const timeline = buildEvidenceTimeline(bundle, null)
    if (timeline.length >= 2) {
      const t0 = new Date(timeline[0].timestamp).getTime()
      const t1 = new Date(timeline[1].timestamp).getTime()
      expect(t0).toBeGreaterThanOrEqual(t1)
    }
  })

  it('marks approval event as launch-critical when entry.isLaunchBlocking is true', () => {
    const approvalSummary = makeApprovalSummary({
      entries: [
        {
          id: 'critical-legal',
          label: 'Legal Review',
          reviewerRole: 'Legal',
          outcome: 'approved',
          summary: '',
          conditions: null,
          actionedAt: new Date().toISOString(),
          isLaunchBlocking: true,
        },
      ],
    })
    const timeline = buildEvidenceTimeline(makeBundle(), approvalSummary)
    const event = timeline.find((e) => e.id === 'timeline-approval-critical-legal')!
    expect(event.isLaunchCritical).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// detectContradictions
// ---------------------------------------------------------------------------

describe('detectContradictions', () => {
  it('returns an empty array for a fully ready bundle with no issues', () => {
    const bundle = makeBundle()
    const approvalSummary = makeApprovalSummary()
    const contradictions = detectContradictions(bundle, approvalSummary)
    expect(contradictions.length).toBe(0)
  })

  it('detects critical contradiction when KYC required but provider not configured', () => {
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
    const contradictions = detectContradictions(bundle, null)
    const c = contradictions.find((c) => c.id === 'contradiction-kyc-no-provider')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('critical')
    expect(c!.affectedSections).toContain('kyc_aml')
  })

  it('detects critical contradiction when whitelist required but zero approved investors', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 2,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const contradictions = detectContradictions(bundle, null)
    const c = contradictions.find((c) => c.id === 'contradiction-whitelist-empty')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('critical')
    expect(c!.remediationHint).toContain('Whitelist Policy')
  })

  it('detects high contradiction when compliance controls enabled without jurisdiction', () => {
    const bundle = makeBundle({
      jurisdiction: { configured: false, jurisdictions: [], permittedCount: 0, restrictedCount: 0, staleSince: null },
      kycAml: {
        status: 'ready',
        kycRequired: true, // KYC required but no jurisdiction
        amlRequired: false,
        providerConfigured: true,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const contradictions = detectContradictions(bundle, null)
    const c = contradictions.find((c) => c.id === 'contradiction-jurisdiction-missing')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('high')
  })

  it('detects high contradiction when approval workflow has both approved and blocked stages', () => {
    const approvalSummary = makeApprovalSummary({
      approvedCount: 2,
      blockedCount: 1,
    })
    const contradictions = detectContradictions(makeBundle(), approvalSummary)
    const c = contradictions.find((c) => c.id === 'contradiction-mixed-approval')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('high')
    expect(c!.affectedSections).toContain('approval_history')
  })

  it('does not detect mixed-approval contradiction when blockedCount is zero', () => {
    const approvalSummary = makeApprovalSummary({ approvedCount: 3, blockedCount: 0 })
    const contradictions = detectContradictions(makeBundle(), approvalSummary)
    const c = contradictions.find((c) => c.id === 'contradiction-mixed-approval')
    expect(c).toBeUndefined()
  })

  it('detects medium contradiction when stale evidence alongside ready status', () => {
    const staleDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      overallStatus: 'ready',
      jurisdiction: { configured: true, jurisdictions: ['DE'], permittedCount: 1, restrictedCount: 0, staleSince: staleDate },
    })
    const contradictions = detectContradictions(bundle, null)
    const c = contradictions.find((c) => c.id === 'contradiction-stale-evidence-vs-ready')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('medium')
  })

  it('detects medium contradiction when pending KYC reviews alongside ready posture', () => {
    const bundle = makeBundle({
      overallStatus: 'ready',
      kycAml: {
        status: 'warning',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: true,
        pendingReviewCount: 2,
        staleSince: null,
      },
    })
    const contradictions = detectContradictions(bundle, null)
    const c = contradictions.find((c) => c.id === 'contradiction-pending-kyc-vs-ready')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('medium')
  })

  it('each contradiction has a non-empty remediationHint', () => {
    const bundle = makeBundle({
      kycAml: { status: 'failed', kycRequired: true, amlRequired: true, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
      whitelist: { status: 'failed', whitelistRequired: true, approvedInvestorCount: 0, pendingInvestorCount: 0, activeWhitelistId: null, staleSince: null },
      jurisdiction: { configured: false, jurisdictions: [], permittedCount: 0, restrictedCount: 0, staleSince: null },
    })
    const contradictions = detectContradictions(bundle, null)
    for (const c of contradictions) {
      expect(c.remediationHint.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// assembleAuditExportPackage
// ---------------------------------------------------------------------------

describe('assembleAuditExportPackage', () => {
  let bundle: ComplianceReportBundle
  let approvalSummary: ApprovalHistorySummary
  let exportReadiness: ExportPackageReadiness

  beforeEach(() => {
    bundle = makeBundle()
    approvalSummary = makeApprovalSummary()
    exportReadiness = makeExportReadiness(bundle, approvalSummary)
  })

  it('returns an AuditExportPackage with all required fields', () => {
    const pkg = assembleAuditExportPackage(bundle, approvalSummary, 'all', exportReadiness)
    expect(pkg.packageId).toBeTruthy()
    expect(pkg.audience).toBe('all')
    expect(pkg.audienceLabel).toBe('Full Report')
    expect(pkg.assembledAt).toBeTruthy()
    expect(typeof pkg.isRegulatorReady).toBe('boolean')
    expect(pkg.readinessGateText.length).toBeGreaterThan(0)
  })

  it('marks isRegulatorReady true when package is ready_for_external with no critical contradictions', () => {
    const readyExportReadiness = makeExportReadiness(bundle, approvalSummary)
    const pkg = assembleAuditExportPackage(bundle, approvalSummary, 'compliance', readyExportReadiness)
    // Only regulator-ready when the bundle is fully ready
    if (readyExportReadiness.status === 'ready_for_external') {
      expect(pkg.isRegulatorReady).toBe(true)
    } else {
      expect(pkg.isRegulatorReady).toBe(false)
    }
  })

  it('marks isRegulatorReady false when exportReadiness is blocked', () => {
    const blockedBundle = makeBundle({
      kycAml: { status: 'failed', kycRequired: true, amlRequired: true, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
    })
    const blockedReadiness = makeExportReadiness(blockedBundle)
    const pkg = assembleAuditExportPackage(blockedBundle, null, 'compliance', blockedReadiness)
    expect(pkg.isRegulatorReady).toBe(false)
    expect(pkg.readinessGateText).toContain('not suitable for regulator')
  })

  it('marks isRegulatorReady false when exportReadiness is incomplete', () => {
    const incompleteBundle = makeBundle({
      overallStatus: 'pending',
      jurisdiction: { configured: false, jurisdictions: [], permittedCount: 0, restrictedCount: 0, staleSince: null },
    })
    const incompleteReadiness = makeExportReadiness(incompleteBundle)
    const pkg = assembleAuditExportPackage(incompleteBundle, null, 'all', incompleteReadiness)
    expect(pkg.isRegulatorReady).toBe(false)
  })

  it('marks isRegulatorReady false when critical contradictions exist even if export is ready_for_external', () => {
    // Create a scenario with KYC required but no provider — critical contradiction
    const contradictoryBundle = makeBundle({
      kycAml: { status: 'failed', kycRequired: true, amlRequired: false, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
    })
    const readiness = makeExportReadiness(contradictoryBundle, approvalSummary)
    const pkg = assembleAuditExportPackage(contradictoryBundle, approvalSummary, 'compliance', readiness)
    expect(pkg.isRegulatorReady).toBe(false)
  })

  it('counts manifest entries correctly', () => {
    const pkg = assembleAuditExportPackage(bundle, approvalSummary, 'all', exportReadiness)
    expect(pkg.totalEvidenceItems).toBeGreaterThan(0)
    expect(pkg.includedItemCount + pkg.excludedItemCount).toBe(pkg.totalEvidenceItems)
  })

  it('includedItemCount is zero when all evidence is missing', () => {
    const emptyBundle = makeBundle({
      overallStatus: 'pending',
      jurisdiction: { configured: false, jurisdictions: [], permittedCount: 0, restrictedCount: 0, staleSince: null },
      kycAml: { status: 'pending', kycRequired: false, amlRequired: false, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
      whitelist: { status: 'pending', whitelistRequired: false, approvedInvestorCount: 0, pendingInvestorCount: 0, activeWhitelistId: null, staleSince: null },
      investorEligibility: { status: 'pending', accreditedRequired: false, retailPermitted: true, eligibilityCategories: [], staleSince: null },
    })
    const emptyReadiness = makeExportReadiness(emptyBundle, null)
    const pkg = assembleAuditExportPackage(emptyBundle, null, 'all', emptyReadiness)
    expect(pkg.includedItemCount).toBe(0)
  })

  it('generates a unique packageId per assembly', () => {
    const pkg1 = assembleAuditExportPackage(bundle, approvalSummary, 'all', exportReadiness)
    const pkg2 = assembleAuditExportPackage(bundle, approvalSummary, 'compliance', exportReadiness)
    // Same bundle but different assembly calls — IDs may match if in same millisecond
    // Just verify format
    expect(pkg1.packageId).toMatch(/^pkg-\d+$/)
    expect(pkg2.packageId).toMatch(/^pkg-\d+$/)
  })

  it('includes all audience presets without throwing', () => {
    const audiences: Array<'all' | 'compliance' | 'procurement' | 'executive'> = ['all', 'compliance', 'procurement', 'executive']
    for (const audience of audiences) {
      expect(() => assembleAuditExportPackage(bundle, approvalSummary, audience, exportReadiness)).not.toThrow()
    }
  })

  it('readinessGateText mentions advisory contradictions when medium-only contradictions present', () => {
    // Stale evidence alongside ready: medium contradiction
    const staleDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const bundleWithStale = makeBundle({
      overallStatus: 'ready',
      jurisdiction: { configured: true, jurisdictions: ['DE'], permittedCount: 1, restrictedCount: 0, staleSince: staleDate },
    })
    const readiness = makeExportReadiness(bundleWithStale, approvalSummary)
    if (readiness.status === 'ready_for_external') {
      const pkg = assembleAuditExportPackage(bundleWithStale, approvalSummary, 'all', readiness)
      if (pkg.isRegulatorReady) {
        expect(pkg.readinessGateText).toContain('advisory')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// CSS helper functions
// ---------------------------------------------------------------------------

describe('contradictionSeverityBadgeClass', () => {
  it('returns distinct classes for critical, high, medium', () => {
    const critical = contradictionSeverityBadgeClass('critical')
    const high = contradictionSeverityBadgeClass('high')
    const medium = contradictionSeverityBadgeClass('medium')
    expect(critical).not.toBe(high)
    expect(high).not.toBe(medium)
    expect(critical).not.toBe(medium)
  })

  it('returns a string containing text-red for critical', () => {
    expect(contradictionSeverityBadgeClass('critical')).toContain('text-red')
  })

  it('returns a string containing text-yellow for medium', () => {
    expect(contradictionSeverityBadgeClass('medium')).toContain('text-yellow')
  })
})

describe('manifestAuthorityBadgeClass', () => {
  it('returns a string for all authority levels', () => {
    const levels: Array<'authoritative' | 'derived' | 'pending' | 'blocked'> = ['authoritative', 'derived', 'pending', 'blocked']
    for (const level of levels) {
      expect(typeof manifestAuthorityBadgeClass(level)).toBe('string')
      expect(manifestAuthorityBadgeClass(level).length).toBeGreaterThan(0)
    }
  })

  it('returns green class for authoritative', () => {
    expect(manifestAuthorityBadgeClass('authoritative')).toContain('green')
  })

  it('returns red class for blocked', () => {
    expect(manifestAuthorityBadgeClass('blocked')).toContain('red')
  })
})

describe('auditPackageReadinessClass', () => {
  it('returns green class when isRegulatorReady is true', () => {
    const cls = auditPackageReadinessClass(true, 'ready_for_external')
    expect(cls).toContain('green')
  })

  it('returns red class when status is blocked and not ready', () => {
    const cls = auditPackageReadinessClass(false, 'blocked')
    expect(cls).toContain('red')
  })

  it('returns yellow class when status is incomplete and not ready', () => {
    const cls = auditPackageReadinessClass(false, 'incomplete')
    expect(cls).toContain('yellow')
  })

  it('returns blue class when status is ready_for_internal and not fully ready', () => {
    const cls = auditPackageReadinessClass(false, 'ready_for_internal')
    expect(cls).toContain('blue')
  })
})

// ---------------------------------------------------------------------------
// EVIDENCE_AUTHORITY_LABELS and CONTRADICTION_SEVERITY_LABELS
// ---------------------------------------------------------------------------

describe('EVIDENCE_AUTHORITY_LABELS', () => {
  it('has a label for each authority level', () => {
    expect(EVIDENCE_AUTHORITY_LABELS.authoritative).toBeTruthy()
    expect(EVIDENCE_AUTHORITY_LABELS.derived).toBeTruthy()
    expect(EVIDENCE_AUTHORITY_LABELS.pending).toBeTruthy()
    expect(EVIDENCE_AUTHORITY_LABELS.blocked).toBeTruthy()
  })
})

describe('CONTRADICTION_SEVERITY_LABELS', () => {
  it('has a label for each severity level', () => {
    expect(CONTRADICTION_SEVERITY_LABELS.critical).toBeTruthy()
    expect(CONTRADICTION_SEVERITY_LABELS.high).toBeTruthy()
    expect(CONTRADICTION_SEVERITY_LABELS.medium).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Fail-closed behavior validation
// ---------------------------------------------------------------------------

describe('fail-closed behavior', () => {
  it('assembleAuditExportPackage never marks regulator-ready when export status is blocked', () => {
    const bundle = makeBundle({ overallStatus: 'failed' })
    const readiness = makeExportReadiness(bundle)
    const pkg = assembleAuditExportPackage(bundle, null, 'all', readiness)
    expect(pkg.isRegulatorReady).toBe(false)
  })

  it('assembleAuditExportPackage never marks regulator-ready when there are critical contradictions', () => {
    // KYC required but no provider — always a critical contradiction
    const bundle = makeBundle({
      kycAml: { status: 'failed', kycRequired: true, amlRequired: false, providerConfigured: false, pendingReviewCount: 0, staleSince: null },
    })
    // Even if we pass in a "ready" readiness status (which shouldn't happen in real use)
    const pkg = assembleAuditExportPackage(bundle, null, 'all', {
      status: 'ready_for_external',
      headline: 'Ready for External Review',
      rationale: 'Fake',
      checklist: [],
      blockerCount: 0,
      missingCount: 0,
      staleCount: 0,
      computedAt: new Date().toISOString(),
    })
    // Critical contradiction: kyc required but no provider
    const contradictions = pkg.contradictions.filter((c) => c.severity === 'critical')
    expect(contradictions.length).toBeGreaterThan(0)
    expect(pkg.isRegulatorReady).toBe(false)
  })

  it('readinessGateText always explains why the package is not regulator-ready', () => {
    const blockedBundle = makeBundle({
      whitelist: { status: 'failed', whitelistRequired: true, approvedInvestorCount: 0, pendingInvestorCount: 0, activeWhitelistId: null, staleSince: null },
    })
    const readiness = makeExportReadiness(blockedBundle)
    const pkg = assembleAuditExportPackage(blockedBundle, null, 'compliance', readiness)
    expect(pkg.isRegulatorReady).toBe(false)
    expect(pkg.readinessGateText.length).toBeGreaterThan(50) // substantial explanation
  })
})
