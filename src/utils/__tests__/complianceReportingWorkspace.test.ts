/**
 * Unit Tests: complianceReportingWorkspace.ts
 *
 * Covers audience preset metadata, approval history derivation,
 * export package readiness derivation (positive/negative/stale cases),
 * audience-specific text report building, and CSS helper functions.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AUDIENCE_PRESET_LABELS,
  AUDIENCE_PRESET_DESCRIPTIONS,
  AUDIENCE_SECTION_PRIORITIES,
  APPROVAL_OUTCOME_LABELS,
  EXPORT_READINESS_LABELS,
  EXPORT_READINESS_DESCRIPTIONS,
  deriveApprovalHistorySummary,
  deriveExportPackageReadiness,
  buildAudienceReportText,
  exportReadinessStatusClass,
  approvalOutcomeBadgeClass,
  isTimestampStale,
  type AudiencePreset,
  type ApprovalOutcome,
  type ExportReadinessStatus,
  type ApprovalHistorySummary,
} from '../complianceReportingWorkspace'
import type { ComplianceReportBundle } from '../complianceEvidencePack'

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
      eligibilityCategories: ['Accredited', 'Institutional'],
      staleSince: null,
    },
    evidenceSections: [],
    exportVersion: '1.0',
    ...overrides,
  }
}

function makeApprovalStages(count = 4, allApproved = true) {
  const statuses = allApproved
    ? ['approved', 'approved', 'approved', 'approved']
    : ['approved', 'conditionally_approved', 'blocked', 'not_started']
  return Array.from({ length: count }, (_, i) => ({
    id: `stage-${i}`,
    label: `Stage ${i + 1}`,
    role: 'compliance_operator',
    status: statuses[i] ?? 'not_started',
    lastActionAt: allApproved ? new Date().toISOString() : null,
    conditions: statuses[i] === 'conditionally_approved' ? 'Condition A must be met' : null,
    summary: `Summary for stage ${i + 1}`,
    blockers: statuses[i] === 'blocked' ? [{ isLaunchBlocking: true }] : [],
  }))
}

function makeApprovalSummary(allSigned = true): ApprovalHistorySummary {
  return deriveApprovalHistorySummary(makeApprovalStages(4, allSigned))
}

// ---------------------------------------------------------------------------
// 1. Audience preset metadata
// ---------------------------------------------------------------------------

describe('AUDIENCE_PRESET_LABELS', () => {
  it('exports a label for all preset types', () => {
    const presets: AudiencePreset[] = ['all', 'compliance', 'procurement', 'executive']
    for (const preset of presets) {
      expect(AUDIENCE_PRESET_LABELS[preset]).toBeTruthy()
    }
  })

  it('all preset is labeled Full Report', () => {
    expect(AUDIENCE_PRESET_LABELS.all).toContain('Full Report')
  })

  it('compliance preset mentions Compliance Review', () => {
    expect(AUDIENCE_PRESET_LABELS.compliance).toMatch(/Compliance/i)
  })

  it('procurement preset mentions Procurement', () => {
    expect(AUDIENCE_PRESET_LABELS.procurement).toMatch(/Procurement/i)
  })

  it('executive preset mentions Executive', () => {
    expect(AUDIENCE_PRESET_LABELS.executive).toMatch(/Executive/i)
  })
})

describe('AUDIENCE_PRESET_DESCRIPTIONS', () => {
  it('exports a non-empty description for all presets', () => {
    const presets: AudiencePreset[] = ['all', 'compliance', 'procurement', 'executive']
    for (const preset of presets) {
      expect(AUDIENCE_PRESET_DESCRIPTIONS[preset].length).toBeGreaterThan(10)
    }
  })

  it('compliance description mentions regulatory or KYC', () => {
    expect(AUDIENCE_PRESET_DESCRIPTIONS.compliance).toMatch(/regulatory|KYC|jurisdiction/i)
  })

  it('procurement description mentions controls or policy', () => {
    expect(AUDIENCE_PRESET_DESCRIPTIONS.procurement).toMatch(/controls|policy|obligations/i)
  })

  it('executive description mentions high-level or sign-off', () => {
    expect(AUDIENCE_PRESET_DESCRIPTIONS.executive).toMatch(/high-level|summary|sign-off/i)
  })
})

describe('AUDIENCE_SECTION_PRIORITIES', () => {
  it('all preset includes all major section IDs', () => {
    const priorities = AUDIENCE_SECTION_PRIORITIES.all
    expect(priorities).toContain('overall')
    expect(priorities).toContain('jurisdiction')
    expect(priorities).toContain('kyc_aml')
    expect(priorities).toContain('whitelist')
    expect(priorities).toContain('evidence')
    expect(priorities).toContain('export')
  })

  it('executive preset includes approval_history and evidence', () => {
    const priorities = AUDIENCE_SECTION_PRIORITIES.executive
    expect(priorities).toContain('approval_history')
    expect(priorities).toContain('evidence')
    expect(priorities).toContain('overall')
  })

  it('procurement preset does not include approval_history', () => {
    expect(AUDIENCE_SECTION_PRIORITIES.procurement).not.toContain('approval_history')
  })
})

// ---------------------------------------------------------------------------
// 2. Approval outcome labels
// ---------------------------------------------------------------------------

describe('APPROVAL_OUTCOME_LABELS', () => {
  it('exports a label for all outcomes', () => {
    const outcomes: ApprovalOutcome[] = [
      'approved',
      'conditionally_approved',
      'blocked',
      'pending',
      'not_started',
    ]
    for (const outcome of outcomes) {
      expect(APPROVAL_OUTCOME_LABELS[outcome]).toBeTruthy()
    }
  })

  it('approved label is human-readable', () => {
    expect(APPROVAL_OUTCOME_LABELS.approved).toMatch(/approved/i)
  })

  it('blocked label is human-readable', () => {
    expect(APPROVAL_OUTCOME_LABELS.blocked).toMatch(/blocked/i)
  })
})

// ---------------------------------------------------------------------------
// 3. deriveApprovalHistorySummary
// ---------------------------------------------------------------------------

describe('deriveApprovalHistorySummary — all approved', () => {
  let summary: ApprovalHistorySummary

  beforeEach(() => {
    summary = deriveApprovalHistorySummary(makeApprovalStages(4, true))
  })

  it('totalStages matches input count', () => {
    expect(summary.totalStages).toBe(4)
  })

  it('approvedCount is 4 when all approved', () => {
    expect(summary.approvedCount).toBe(4)
  })

  it('blockedCount is 0 when all approved', () => {
    expect(summary.blockedCount).toBe(0)
  })

  it('pendingCount is 0 when all approved', () => {
    expect(summary.pendingCount).toBe(0)
  })

  it('allLaunchCriticalSigned is true when all approved', () => {
    expect(summary.allLaunchCriticalSigned).toBe(true)
  })

  it('lastActionAt is populated when stages have action timestamps', () => {
    expect(summary.lastActionAt).toBeTruthy()
  })

  it('entries length matches stage count', () => {
    expect(summary.entries.length).toBe(4)
  })
})

describe('deriveApprovalHistorySummary — mixed outcomes', () => {
  let summary: ApprovalHistorySummary

  beforeEach(() => {
    // one approved, one conditional, one blocked, one not_started
    summary = deriveApprovalHistorySummary(makeApprovalStages(4, false))
  })

  it('approvedCount counts approved + conditional', () => {
    // approved + conditionally_approved both counted as signed off
    expect(summary.approvedCount).toBe(2)
  })

  it('conditionalCount is 1', () => {
    expect(summary.conditionalCount).toBe(1)
  })

  it('blockedCount is 1', () => {
    expect(summary.blockedCount).toBe(1)
  })

  it('pendingCount is 1', () => {
    expect(summary.pendingCount).toBe(1)
  })

  it('allLaunchCriticalSigned is false when any blocked', () => {
    expect(summary.allLaunchCriticalSigned).toBe(false)
  })

  it('blocked entry has isLaunchBlocking true', () => {
    const blocked = summary.entries.find((e) => e.outcome === 'blocked')
    expect(blocked?.isLaunchBlocking).toBe(true)
  })

  it('conditional entry has conditions set', () => {
    const conditional = summary.entries.find((e) => e.outcome === 'conditionally_approved')
    expect(conditional?.conditions).toBeTruthy()
  })
})

describe('deriveApprovalHistorySummary — empty stages', () => {
  it('returns zero counts for empty stages array', () => {
    const summary = deriveApprovalHistorySummary([])
    expect(summary.totalStages).toBe(0)
    expect(summary.approvedCount).toBe(0)
    expect(summary.allLaunchCriticalSigned).toBe(true) // vacuously true
    expect(summary.lastActionAt).toBeNull()
    expect(summary.entries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 4. deriveExportPackageReadiness
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — fully ready bundle + all approved', () => {
  it('status is ready_for_external when bundle is ready and all stages signed', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(true))
    expect(result.status).toBe('ready_for_external')
  })

  it('headline matches EXPORT_READINESS_LABELS.ready_for_external', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(true))
    expect(result.headline).toBe(EXPORT_READINESS_LABELS.ready_for_external)
  })

  it('checklist has no missing required items', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(true))
    const missingRequired = result.checklist.filter(
      (item) => item.isRequiredForExternal && !item.isPresent,
    )
    expect(missingRequired).toHaveLength(0)
  })

  it('missingCount is 0', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(true))
    expect(result.missingCount).toBe(0)
  })
})

describe('deriveExportPackageReadiness — ready bundle but approval not signed', () => {
  it('status is ready_for_internal when bundle ready but no approval sign-off', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(false))
    expect(result.status).toBe('ready_for_internal')
  })

  it('status is ready_for_internal when approvalSummary is null', () => {
    const result = deriveExportPackageReadiness(makeBundle(), null)
    expect(result.status).toBe('ready_for_internal')
  })
})

describe('deriveExportPackageReadiness — failed bundle', () => {
  it('status is blocked when overall status is failed', () => {
    const bundle = makeBundle({ overallStatus: 'failed' })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.status).toBe('blocked')
  })

  it('headline matches EXPORT_READINESS_LABELS.blocked', () => {
    const bundle = makeBundle({ overallStatus: 'failed' })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.headline).toBe(EXPORT_READINESS_LABELS.blocked)
  })

  it('rationale mentions critical blockers', () => {
    const bundle = makeBundle({ overallStatus: 'failed' })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.rationale).toMatch(/critical/i)
  })
})

describe('deriveExportPackageReadiness — missing jurisdiction', () => {
  it('status is incomplete when jurisdiction not configured', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.status).toBe('incomplete')
  })

  it('jurisdiction checklist item is not present', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'jurisdiction')
    expect(item?.isPresent).toBe(false)
  })

  it('jurisdiction checklist item has a remediationHint', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'jurisdiction')
    expect(item?.remediationHint).toBeTruthy()
  })
})

describe('deriveExportPackageReadiness — KYC failed', () => {
  it('KYC checklist item is not present when status is failed', () => {
    const bundle = makeBundle({
      overallStatus: 'failed',
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'kyc_aml')
    expect(item?.isPresent).toBe(false)
    expect(item?.remediationHint).toBeTruthy()
  })

  it('KYC checklist mentions pending reviews when pendingReviewCount > 0', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'warning',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: true,
        pendingReviewCount: 3,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'kyc_aml')
    expect(item?.remediationHint).toMatch(/pending/i)
  })
})

describe('deriveExportPackageReadiness — whitelist fail-closed', () => {
  it('whitelist checklist item is not present when status is failed', () => {
    const bundle = makeBundle({
      overallStatus: 'failed',
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'whitelist')
    expect(item?.isPresent).toBe(false)
    expect(item?.remediationHint).toMatch(/approved investors/i)
  })
})

describe('deriveExportPackageReadiness — stale evidence', () => {
  it('detects stale jurisdiction evidence', () => {
    const staleDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: staleDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'jurisdiction')
    expect(item?.isStale).toBe(true)
    expect(result.staleCount).toBeGreaterThan(0)
  })

  it('does not flag recent evidence as stale', () => {
    const recentDate = new Date().toISOString()
    const bundle = makeBundle({
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: recentDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'jurisdiction')
    expect(item?.isStale).toBe(false)
  })
})

describe('deriveExportPackageReadiness — approval history item', () => {
  it('approval_history is optional (isRequiredForExternal false)', () => {
    const result = deriveExportPackageReadiness(makeBundle(), null)
    const item = result.checklist.find((c) => c.id === 'approval_history')
    expect(item?.isRequiredForExternal).toBe(false)
  })

  it('approval_history is present when summary has stages', () => {
    const result = deriveExportPackageReadiness(makeBundle(), makeApprovalSummary(true))
    const item = result.checklist.find((c) => c.id === 'approval_history')
    expect(item?.isPresent).toBe(true)
  })

  it('approval_history is not present when no summary', () => {
    const result = deriveExportPackageReadiness(makeBundle(), null)
    const item = result.checklist.find((c) => c.id === 'approval_history')
    expect(item?.isPresent).toBe(false)
  })
})

describe('deriveExportPackageReadiness — computedAt is set', () => {
  it('computedAt is a valid ISO string', () => {
    const result = deriveExportPackageReadiness(makeBundle(), null)
    expect(() => new Date(result.computedAt)).not.toThrow()
    expect(result.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

// ---------------------------------------------------------------------------
// 5. buildAudienceReportText
// ---------------------------------------------------------------------------

describe('buildAudienceReportText — all preset', () => {
  let text: string

  beforeEach(() => {
    const bundle = makeBundle()
    const approvalSummary = makeApprovalSummary(true)
    const exportReadiness = deriveExportPackageReadiness(bundle, approvalSummary)
    text = buildAudienceReportText(bundle, 'all', approvalSummary, exportReadiness)
  })

  it('includes BIATEC TOKENS header', () => {
    expect(text).toContain('BIATEC TOKENS')
  })

  it('includes FULL REPORT audience label', () => {
    expect(text).toMatch(/FULL REPORT/i)
  })

  it('includes overall compliance posture section', () => {
    expect(text).toContain('OVERALL COMPLIANCE POSTURE')
  })

  it('includes jurisdiction section', () => {
    expect(text).toContain('JURISDICTION COVERAGE')
  })

  it('includes KYC/AML section', () => {
    expect(text).toContain('KYC / AML')
  })

  it('includes approval history section', () => {
    expect(text).toContain('APPROVAL STAGE HISTORY')
  })

  it('includes export checklist section', () => {
    expect(text).toContain('Export Package Checklist')
  })

  it('includes Biatec Tokens footer', () => {
    expect(text).toContain('Biatec Tokens')
  })
})

describe('buildAudienceReportText — executive preset', () => {
  it('includes overall posture', () => {
    const bundle = makeBundle()
    const approval = makeApprovalSummary(true)
    const readiness = deriveExportPackageReadiness(bundle, approval)
    const text = buildAudienceReportText(bundle, 'executive', approval, readiness)
    expect(text).toContain('OVERALL COMPLIANCE POSTURE')
  })

  it('includes approval history for executive audience', () => {
    const bundle = makeBundle()
    const approval = makeApprovalSummary(true)
    const readiness = deriveExportPackageReadiness(bundle, approval)
    const text = buildAudienceReportText(bundle, 'executive', approval, readiness)
    expect(text).toContain('APPROVAL STAGE HISTORY')
  })

  it('does NOT include KYC/AML detail for executive audience', () => {
    const bundle = makeBundle()
    const approval = makeApprovalSummary(true)
    const readiness = deriveExportPackageReadiness(bundle, approval)
    const text = buildAudienceReportText(bundle, 'executive', approval, readiness)
    // Executive preset omits KYC/AML section
    expect(text).not.toContain('KYC / AML REVIEW STATUS')
  })
})

describe('buildAudienceReportText — blockers included in report', () => {
  it('includes BLOCKER text when whitelist required but no approved investors', () => {
    const bundle = makeBundle({
      overallStatus: 'failed',
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    expect(text).toContain('BLOCKER')
  })
})

describe('buildAudienceReportText — missing checklist items include remediation hints', () => {
  it('includes remediation hint for missing jurisdiction', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'compliance', null, readiness)
    expect(text).toMatch(/MISSING/i)
    expect(text).toMatch(/Configure jurisdiction/i)
  })
})

describe('buildAudienceReportText — no approval summary', () => {
  it('omits approval history section when null', () => {
    const bundle = makeBundle()
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    // approval_history section should not appear when no summary provided
    expect(text).not.toContain('APPROVAL STAGE HISTORY')
  })
})

// ---------------------------------------------------------------------------
// 6. CSS helpers
// ---------------------------------------------------------------------------

describe('exportReadinessStatusClass', () => {
  const statuses: ExportReadinessStatus[] = [
    'ready_for_external',
    'ready_for_internal',
    'incomplete',
    'blocked',
  ]

  it('returns a non-empty string for each status', () => {
    for (const status of statuses) {
      expect(exportReadinessStatusClass(status).length).toBeGreaterThan(0)
    }
  })

  it('ready_for_external includes green color class', () => {
    expect(exportReadinessStatusClass('ready_for_external')).toMatch(/green/)
  })

  it('blocked includes red color class', () => {
    expect(exportReadinessStatusClass('blocked')).toMatch(/red/)
  })

  it('incomplete includes yellow color class', () => {
    expect(exportReadinessStatusClass('incomplete')).toMatch(/yellow/)
  })

  it('ready_for_internal includes blue color class', () => {
    expect(exportReadinessStatusClass('ready_for_internal')).toMatch(/blue/)
  })
})

describe('approvalOutcomeBadgeClass', () => {
  const outcomes: ApprovalOutcome[] = [
    'approved',
    'conditionally_approved',
    'blocked',
    'pending',
    'not_started',
  ]

  it('returns a non-empty string for each outcome', () => {
    for (const outcome of outcomes) {
      expect(approvalOutcomeBadgeClass(outcome).length).toBeGreaterThan(0)
    }
  })

  it('approved includes green class', () => {
    expect(approvalOutcomeBadgeClass('approved')).toMatch(/green/)
  })

  it('blocked includes red class', () => {
    expect(approvalOutcomeBadgeClass('blocked')).toMatch(/red/)
  })
})

// ---------------------------------------------------------------------------
// 7. Export readiness label coverage
// ---------------------------------------------------------------------------

describe('EXPORT_READINESS_LABELS', () => {
  it('exports a label for all statuses', () => {
    const statuses: ExportReadinessStatus[] = [
      'ready_for_external',
      'ready_for_internal',
      'incomplete',
      'blocked',
    ]
    for (const status of statuses) {
      expect(EXPORT_READINESS_LABELS[status]).toBeTruthy()
    }
  })
})

describe('EXPORT_READINESS_DESCRIPTIONS', () => {
  it('exports a non-empty description for all statuses', () => {
    const statuses: ExportReadinessStatus[] = [
      'ready_for_external',
      'ready_for_internal',
      'incomplete',
      'blocked',
    ]
    for (const status of statuses) {
      expect(EXPORT_READINESS_DESCRIPTIONS[status].length).toBeGreaterThan(10)
    }
  })

  it('blocked description mentions blockers', () => {
    expect(EXPORT_READINESS_DESCRIPTIONS.blocked).toMatch(/blocker/i)
  })

  it('ready_for_external description mentions external or regulator', () => {
    expect(EXPORT_READINESS_DESCRIPTIONS.ready_for_external).toMatch(/external|regulator/i)
  })
})

// ---------------------------------------------------------------------------
// 8. mapStageStatusToOutcome via deriveApprovalHistorySummary — uncovered branches
// ---------------------------------------------------------------------------

describe('deriveApprovalHistorySummary — in_review and ready_for_review stages map to pending', () => {
  it('in_review stage contributes to pendingCount', () => {
    const stages = [
      {
        id: 'stage-ir',
        label: 'Legal Review',
        role: 'legal' as const,
        status: 'in_review',
        lastActionAt: null,
        conditions: null,
        summary: 'Under active review',
        blockers: [],
      },
    ]
    const summary = deriveApprovalHistorySummary(stages)
    expect(summary.pendingCount).toBe(1)
    expect(summary.entries[0].outcome).toBe('pending')
  })

  it('ready_for_review stage contributes to pendingCount', () => {
    const stages = [
      {
        id: 'stage-rfr',
        label: 'Compliance Sign-off',
        role: 'compliance_operator' as const,
        status: 'ready_for_review',
        lastActionAt: null,
        conditions: null,
        summary: 'Awaiting reviewer assignment',
        blockers: [],
      },
    ]
    const summary = deriveApprovalHistorySummary(stages)
    expect(summary.pendingCount).toBe(1)
    expect(summary.entries[0].outcome).toBe('pending')
  })

  it('unknown status falls through to not_started', () => {
    const stages = [
      {
        id: 'stage-unk',
        label: 'Unknown Stage',
        role: 'compliance_operator' as const,
        status: 'draft_only',
        lastActionAt: null,
        conditions: null,
        summary: '',
        blockers: [],
      },
    ]
    const summary = deriveApprovalHistorySummary(stages)
    expect(summary.entries[0].outcome).toBe('not_started')
  })
})

// ---------------------------------------------------------------------------
// 9. deriveExportPackageReadiness — ready_for_internal via stale evidence path
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — stale evidence degrades to ready_for_internal', () => {
  it('status is ready_for_internal (not ready_for_external) when evidence is stale even with approval sign-off', () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    // Bundle is 'ready' overall and approval is fully signed, but evidence is stale
    const bundle = makeBundle({
      overallStatus: 'ready',
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: staleDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, makeApprovalSummary(true))
    expect(result.status).toBe('ready_for_internal')
  })

  it('rationale mentions stale evidence', () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      overallStatus: 'ready',
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: staleDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, makeApprovalSummary(true))
    expect(result.rationale).toMatch(/stale/i)
  })

  it('staleCount is at least 1', () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    const bundle = makeBundle({
      overallStatus: 'ready',
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: staleDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, makeApprovalSummary(true))
    expect(result.staleCount).toBeGreaterThanOrEqual(1)
  })

  it('status is ready_for_internal when bundle status is warning and staleCount > 0', () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    // 'warning' overallStatus with stale evidence reaches the else-if(staleCount > 0) branch
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: true,
        jurisdictions: ['Germany'],
        permittedCount: 1,
        restrictedCount: 0,
        staleSince: staleDate,
      },
    })
    const result = deriveExportPackageReadiness(bundle, makeApprovalSummary(true))
    expect(result.status).toBe('ready_for_internal')
    expect(result.rationale).toMatch(/stale/i)
  })
})

// ---------------------------------------------------------------------------
// 10. buildAudienceReportText — KYC pendingReviewCount > 0 in report text
// ---------------------------------------------------------------------------

describe('buildAudienceReportText — KYC pending reviews in report', () => {
  it('includes pending review count when pendingReviewCount > 0', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'warning',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: true,
        pendingReviewCount: 7,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'compliance', null, readiness)
    // The pending review count line (line 435) should appear in the report
    expect(text).toMatch(/pending reviews\s*:\s*7/i)
  })

  it('does NOT include pending review count line when pendingReviewCount is 0', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'ready',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: true,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'compliance', null, readiness)
    expect(text).not.toMatch(/Pending Reviews\s*:/)
  })
})

// ---------------------------------------------------------------------------
// 11. isTimestampStale — exported and deterministically testable
// ---------------------------------------------------------------------------

describe('isTimestampStale — exported with injectable now', () => {
  const THIRTY_ONE_DAYS_MS = 31 * 24 * 60 * 60 * 1000
  const TWENTY_NINE_DAYS_MS = 29 * 24 * 60 * 60 * 1000

  it('returns true when timestamp is older than 30 days', () => {
    const now = Date.now()
    const staleDate = new Date(now - THIRTY_ONE_DAYS_MS).toISOString()
    expect(isTimestampStale(staleDate, now)).toBe(true)
  })

  it('returns false when timestamp is within 30 days', () => {
    const now = Date.now()
    const freshDate = new Date(now - TWENTY_NINE_DAYS_MS).toISOString()
    expect(isTimestampStale(freshDate, now)).toBe(false)
  })

  it('returns false when timestamp is null', () => {
    expect(isTimestampStale(null)).toBe(false)
  })

  it('is deterministic with injected now — does not depend on Date.now()', () => {
    const frozenNow = new Date('2024-06-01T00:00:00Z').getTime()
    const staleDate = new Date('2024-04-01T00:00:00Z').toISOString() // 61 days before frozenNow
    const freshDate = new Date('2024-05-20T00:00:00Z').toISOString() // 12 days before frozenNow
    expect(isTimestampStale(staleDate, frozenNow)).toBe(true)
    expect(isTimestampStale(freshDate, frozenNow)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 12. ExportChecklistItem.isBlocked semantics — blocker vs missing distinction
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — isBlocked field semantics', () => {
  it('kyc_aml item has isBlocked=true when kycAml.status === failed', () => {
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
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'kyc_aml')
    expect(item?.isBlocked).toBe(true)
    expect(item?.isPresent).toBe(false)
  })

  it('kyc_aml item has isBlocked=false when kycAml.status === warning', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'warning',
        kycRequired: true,
        amlRequired: true,
        providerConfigured: true,
        pendingReviewCount: 2,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'kyc_aml')
    expect(item?.isBlocked).toBe(false)
    expect(item?.isPresent).toBe(true)
  })

  it('whitelist item has isBlocked=true when whitelist.status === failed', () => {
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
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'whitelist')
    expect(item?.isBlocked).toBe(true)
    expect(item?.isPresent).toBe(false)
  })

  it('whitelist item has isBlocked=false when whitelist.status === warning', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'warning',
        whitelistRequired: true,
        approvedInvestorCount: 1,
        pendingInvestorCount: 3,
        activeWhitelistId: 'wl-001',
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'whitelist')
    expect(item?.isBlocked).toBe(false)
    expect(item?.isPresent).toBe(true)
  })

  it('investor_eligibility item has isBlocked=true when status === failed', () => {
    const bundle = makeBundle({
      investorEligibility: {
        status: 'failed',
        accreditedRequired: true,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'investor_eligibility')
    expect(item?.isBlocked).toBe(true)
    expect(item?.isPresent).toBe(false)
  })

  it('investor_eligibility item has isBlocked=false when status === pending (not yet configured)', () => {
    const bundle = makeBundle({
      investorEligibility: {
        status: 'pending',
        accreditedRequired: false,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'investor_eligibility')
    expect(item?.isBlocked).toBe(false)
    expect(item?.isPresent).toBe(false)
  })

  it('jurisdiction item always has isBlocked=false (no failed state — either configured or not)', () => {
    const bundle = makeBundle({
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'jurisdiction')
    expect(item?.isBlocked).toBe(false)
  })

  it('approval_history item always has isBlocked=false', () => {
    const result = deriveExportPackageReadiness(makeBundle(), null)
    const item = result.checklist.find((c) => c.id === 'approval_history')
    expect(item?.isBlocked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 13. blockerCount vs missingCount — semantically different computations
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — blockerCount vs missingCount semantics', () => {
  it('blockerCount counts items with isBlocked=true (active failures), missingCount counts not-yet-configured items', () => {
    // kyc_aml.status=failed → blockerCount=1, missingCount=0 (it is blocked, not just missing)
    const bundle = makeBundle({
      overallStatus: 'warning',
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.blockerCount).toBe(1)
    expect(result.missingCount).toBe(0)
  })

  it('jurisdiction not configured → missingCount=1, blockerCount=0 (not set up yet, not actively failed)', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.missingCount).toBe(1)
    expect(result.blockerCount).toBe(0)
  })

  it('investor_eligibility pending → missingCount counts it, blockerCount does not', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      investorEligibility: {
        status: 'pending',
        accreditedRequired: false,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.missingCount).toBeGreaterThanOrEqual(1)
    expect(result.blockerCount).toBe(0)
  })

  it('investor_eligibility failed → blockerCount counts it, missingCount does not', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      investorEligibility: {
        status: 'failed',
        accreditedRequired: true,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.blockerCount).toBeGreaterThanOrEqual(1)
    expect(result.missingCount).toBe(0)
  })

  it('blockerCount and missingCount are NOT the same value when both blocked and missing items exist', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      kycAml: {
        status: 'failed', // active blocker
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
      jurisdiction: {
        configured: false, // missing (not yet set up)
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    // blockerCount = 1 (kyc failed), missingCount = 1 (jurisdiction not configured)
    expect(result.blockerCount).toBe(1)
    expect(result.missingCount).toBe(1)
    // Crucially they are not equal to each other's total
    expect(result.blockerCount).not.toBe(result.missingCount + result.blockerCount)
  })
})

// ---------------------------------------------------------------------------
// 14. Status derivation — blocked status triggered by blockerCount, not just overallStatus
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — blocked status from checklist blockers', () => {
  it('status is blocked when kyc_aml.status === failed even if bundle.overallStatus !== failed', () => {
    // This is the key correctness fix: a failed checklist item should block export
    // regardless of what the overall bundle status says
    const bundle = makeBundle({
      overallStatus: 'warning', // overall is NOT failed
      kycAml: {
        status: 'failed', // but KYC is failed → active blocker
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.status).toBe('blocked')
    expect(result.blockerCount).toBe(1)
  })

  it('status is blocked when whitelist.status === failed even if bundle.overallStatus !== failed', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      whitelist: {
        status: 'failed',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 0,
        activeWhitelistId: null,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.status).toBe('blocked')
  })

  it('status is blocked when investor_eligibility.status === failed even if overallStatus !== failed', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      investorEligibility: {
        status: 'failed',
        accreditedRequired: true,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.status).toBe('blocked')
  })

  it('status is incomplete (not blocked) when jurisdiction is not configured — that is a missing item, not a blocker', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    // jurisdiction being unconfigured is a setup gap, not an active failure
    expect(result.status).toBe('incomplete')
    expect(result.missingCount).toBe(1)
    expect(result.blockerCount).toBe(0)
  })

  it('rationale for blocked state mentions critical controls', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    expect(result.rationale).toMatch(/failed state/i)
  })
})

// ---------------------------------------------------------------------------
// 15. Remediation hints — completeness for all non-ready states
// ---------------------------------------------------------------------------

describe('deriveExportPackageReadiness — remediation hints for all non-ready states', () => {
  it('investor_eligibility has remediation hint when status === failed', () => {
    const bundle = makeBundle({
      investorEligibility: {
        status: 'failed',
        accreditedRequired: true,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'investor_eligibility')
    expect(item?.remediationHint).toBeTruthy()
    expect(item?.remediationHint).toMatch(/failed|fix|review|correct/i)
  })

  it('investor_eligibility has remediation hint when status === unavailable', () => {
    const bundle = makeBundle({
      investorEligibility: {
        status: 'unavailable',
        accreditedRequired: false,
        retailPermitted: false,
        eligibilityCategories: [],
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'investor_eligibility')
    expect(item?.remediationHint).toBeTruthy()
    expect(item?.remediationHint).toMatch(/unavailable|check/i)
  })

  it('whitelist has remediation hint when whitelistRequired and approvedInvestorCount === 0 (warning state)', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'warning',
        whitelistRequired: true,
        approvedInvestorCount: 0,
        pendingInvestorCount: 2,
        activeWhitelistId: 'wl-001',
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'whitelist')
    expect(item?.remediationHint).toBeTruthy()
  })

  it('whitelist has remediation hint when pendingInvestorCount > 0', () => {
    const bundle = makeBundle({
      whitelist: {
        status: 'warning',
        whitelistRequired: true,
        approvedInvestorCount: 2,
        pendingInvestorCount: 5,
        activeWhitelistId: 'wl-001',
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'whitelist')
    expect(item?.remediationHint).toBeTruthy()
    expect(item?.remediationHint).toMatch(/pending/i)
  })

  it('kyc_aml has remediation hint for pending state', () => {
    const bundle = makeBundle({
      kycAml: {
        status: 'pending',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const result = deriveExportPackageReadiness(bundle, null)
    const item = result.checklist.find((c) => c.id === 'kyc_aml')
    // kyc_aml with status pending is not present (pending is not ready/warning)
    // it should have a hint
    expect(item?.remediationHint).toBeTruthy()
    expect(item?.remediationHint).toMatch(/progress|complete|setup/i)
  })
})

// ---------------------------------------------------------------------------
// 16. buildAudienceReportText — safety with partial/null data
// ---------------------------------------------------------------------------

describe('buildAudienceReportText — safety with partial/null data', () => {
  it('does not throw when bundle.launchName is null', () => {
    const bundle = makeBundle({ launchName: null as unknown as string })
    const readiness = deriveExportPackageReadiness(bundle, null)
    expect(() => buildAudienceReportText(bundle, 'all', null, readiness)).not.toThrow()
  })

  it('includes fallback "Unnamed Launch" when bundle.launchName is null', () => {
    const bundle = makeBundle({ launchName: null as unknown as string })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    expect(text).toContain('Unnamed Launch')
  })

  it('does not throw when approvalSummary has an empty entries array', () => {
    const approvalSummary: ApprovalHistorySummary = {
      totalStages: 0,
      approvedCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      pendingCount: 0,
      allLaunchCriticalSigned: false,
      entries: [],
      lastActionAt: null,
    }
    const bundle = makeBundle()
    const readiness = deriveExportPackageReadiness(bundle, approvalSummary)
    expect(() => buildAudienceReportText(bundle, 'all', approvalSummary, readiness)).not.toThrow()
  })

  it('does not throw when jurisdiction.jurisdictions is empty', () => {
    const bundle = makeBundle({
      jurisdiction: {
        configured: true,
        jurisdictions: [],
        permittedCount: 0,
        restrictedCount: 0,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    expect(() => buildAudienceReportText(bundle, 'all', null, readiness)).not.toThrow()
  })

  it('renders BLOCKED label in export text for blocked checklist items', () => {
    const bundle = makeBundle({
      overallStatus: 'warning',
      kycAml: {
        status: 'failed',
        kycRequired: true,
        amlRequired: false,
        providerConfigured: false,
        pendingReviewCount: 0,
        staleSince: null,
      },
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    // A blocked item should render as BLOCKED not just MISSING
    expect(text).toMatch(/BLOCKED/)
  })

  it('all audience presets generate text without throwing for edge-case bundle', () => {
    const bundle = makeBundle({
      launchName: null as unknown as string,
      readinessScore: 0,
      overallStatus: 'pending',
    })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const presets: AudiencePreset[] = ['all', 'compliance', 'procurement', 'executive']
    for (const preset of presets) {
      expect(() => buildAudienceReportText(bundle, preset, null, readiness)).not.toThrow()
    }
  })
})

// ---------------------------------------------------------------------------
// 17. buildAudienceReportText — launch name is included in report header
// ---------------------------------------------------------------------------

describe('buildAudienceReportText — report header', () => {
  it('includes launch name in report header', () => {
    const bundle = makeBundle({ launchName: 'My Special Token Launch' })
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    expect(text).toContain('My Special Token Launch')
  })

  it('includes BIATEC TOKENS header in report', () => {
    const bundle = makeBundle()
    const readiness = deriveExportPackageReadiness(bundle, null)
    const text = buildAudienceReportText(bundle, 'all', null, readiness)
    expect(text).toContain('BIATEC TOKENS')
  })
})
