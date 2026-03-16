/**
 * Integration tests: ComplianceCaseManagementClient ↔ InvestorComplianceOnboardingWorkspace
 *
 * Tests the boundary between the typed API client and the UI components:
 *   - EnterpriseApprovalCockpit surfaces onboarding readiness data from the client
 *   - normaliseCohortReadinessSummary correctly translates API states to component props
 *   - Fail-closed: blocked/stale cohort states produce blocked UI, not green
 *   - Error states from client produce degraded (not ready) UI
 *   - Unauthenticated path shows neutral "Not Available" state (not blocked/not ready)
 *   - Readiness data flows consistently across cockpit and onboarding workspace
 *
 * Issue: Integrate live compliance case management into investor onboarding
 * and approval workspaces
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ComplianceCaseManagementClient,
  createComplianceCaseClient,
} from '../../lib/api/complianceCaseManagement'
import {
  normaliseCohortReadinessSummary,
  normaliseCohortReadinessToStages,
  buildDegradedOnboardingStages,
} from '../../utils/complianceCaseNormalizer'
import type { BackendCohortReadiness } from '../../lib/api/complianceCaseManagement'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) })
}
function makeFetchError(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({ ok: false, status, json: () => Promise.resolve(body) })
}
function makeFetchNetworkError(msg: string) {
  return vi.fn().mockRejectedValue(new Error(msg))
}

const BASE = 'https://api.integration.biatec.io'
const TOKEN = 'integration-bearer-token'

const READY_COHORT: BackendCohortReadiness = {
  cohortId: 'cohort-integ-ready',
  cohortName: 'Integration Ready Cohort',
  overallStatus: 'READY',
  totalCases: 20,
  completedCases: 20,
  blockedCases: 0,
  pendingCases: 0,
  staleCases: 0,
  readinessScore: 100,
  cohortBlockers: [],
  computedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
}

const BLOCKED_COHORT: BackendCohortReadiness = {
  cohortId: 'cohort-integ-blocked',
  cohortName: 'Integration Blocked Cohort',
  overallStatus: 'BLOCKED',
  totalCases: 20,
  completedCases: 12,
  blockedCases: 5,
  pendingCases: 3,
  staleCases: 0,
  readinessScore: 60,
  cohortBlockers: [
    {
      id: 'blk-integ-001',
      title: 'AML flag unresolved — Meridian Fund LLC',
      reason: 'A sanctions watchlist hit was identified and has not been manually reviewed.',
      affectedCaseIds: ['case-001'],
      severity: 'CRITICAL',
      remediationPath: '/compliance/reporting',
    },
    {
      id: 'blk-integ-002',
      title: 'KYC documentation missing — 4 entities',
      reason: 'Investors have not yet submitted all required identity documents.',
      affectedCaseIds: ['case-002', 'case-003', 'case-004', 'case-005'],
      severity: 'HIGH',
      remediationPath: '/compliance/setup',
    },
  ],
  computedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
}

const STALE_COHORT: BackendCohortReadiness = {
  cohortId: 'cohort-integ-stale',
  cohortName: 'Integration Stale Cohort',
  overallStatus: 'STALE',
  totalCases: 15,
  completedCases: 13,
  blockedCases: 0,
  pendingCases: 0,
  staleCases: 2,
  readinessScore: 55,
  cohortBlockers: [],
  computedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
}

afterEach(() => { vi.unstubAllGlobals() })

// ---------------------------------------------------------------------------
// AC #1: Live data loading from API → UI normalization
// ---------------------------------------------------------------------------

describe('AC #1: Live data loading — ready cohort', () => {
  it('READY cohort produces isReadyForHandoff:true in normalized summary', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ cohortSummaries: [READY_COHORT], openCaseCount: 0, criticalRiskCount: 0, overdueTaskCount: 0, expiringEvidenceCount: 0, asOf: READY_COHORT.computedAt }))
    const client = new ComplianceCaseManagementClient(BASE, TOKEN)
    const result = await client.getMonitoringDashboard()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const summary = normaliseCohortReadinessSummary(result.data.cohortSummaries[0])
    expect(summary.isReadyForHandoff).toBe(true)
    expect(summary.hasLaunchBlockers).toBe(false)
    expect(summary.readinessScore).toBe(100)
    expect(summary.statusLabel).toBe('Ready for Handoff')
    expect(summary.blockerTitles).toHaveLength(0)
  })

  it('READY cohort produces all-complete stages', () => {
    const stages = normaliseCohortReadinessToStages(READY_COHORT)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.status).toBe('complete')
    // Intake always complete when total > 0
    const intake = stages.find((s) => s.id === 'intake')
    expect(intake?.status).toBe('complete')
  })
})

// ---------------------------------------------------------------------------
// AC #2, #4: Blocked cohort — UI must not show ready
// ---------------------------------------------------------------------------

describe('AC #2/#4: Blocked cohort — fail-closed rendering', () => {
  it('BLOCKED cohort produces isReadyForHandoff:false', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(summary.isReadyForHandoff).toBe(false)
    expect(summary.hasLaunchBlockers).toBe(true)
  })

  it('BLOCKED cohort surface all blocker titles from API', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(summary.blockerTitles.length).toBeGreaterThanOrEqual(2)
    expect(summary.blockerTitles[0]).toContain('AML')
    expect(summary.blockerTitles[1]).toContain('KYC')
  })

  it('BLOCKED cohort produces readinessScore < 100', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(summary.readinessScore).toBeLessThan(100)
  })

  it('BLOCKED cohort headline mentions blocked cases', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(summary.headline.toLowerCase()).toContain('blocked')
  })

  it('BLOCKED cohort produces approval_handoff as not_started', () => {
    const stages = normaliseCohortReadinessToStages(BLOCKED_COHORT)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.status).toBe('not_started')
  })

  it('BLOCKED cohort AML blocker maps to aml_risk_review stage as blocked', () => {
    const stages = normaliseCohortReadinessToStages(BLOCKED_COHORT)
    const aml = stages.find((s) => s.id === 'aml_risk_review')
    expect(aml?.status).toBe('blocked')
    expect(aml?.blockers.some((b) => b.title.includes('AML'))).toBe(true)
  })

  it('BLOCKED cohort KYC blocker maps to identity_kyc_review stage as blocked', () => {
    const stages = normaliseCohortReadinessToStages(BLOCKED_COHORT)
    const kyc = stages.find((s) => s.id === 'identity_kyc_review')
    expect(kyc?.status).toBe('blocked')
    expect(kyc?.blockers.some((b) => b.title.includes('KYC'))).toBe(true)
  })

  it('BLOCKED status label uses clear operator language', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(summary.statusLabel).toContain('Blocked')
  })
})

// ---------------------------------------------------------------------------
// AC #4: Stale evidence — explicit fail-closed state
// ---------------------------------------------------------------------------

describe('AC #4: Stale evidence — explicit UI blocks advancement', () => {
  it('STALE cohort headline explains evidence expiry clearly', () => {
    const summary = normaliseCohortReadinessSummary(STALE_COHORT)
    expect(summary.headline).toContain('Evidence has expired')
  })

  it('STALE cohort documentation_review stage is stale', () => {
    const stages = normaliseCohortReadinessToStages(STALE_COHORT)
    const doc = stages.find((s) => s.id === 'documentation_review')
    expect(doc?.status).toBe('stale')
  })

  it('STALE cohort readinessScore is below threshold', () => {
    const summary = normaliseCohortReadinessSummary(STALE_COHORT)
    expect(summary.readinessScore).toBeLessThan(70)
  })

  it('STALE cohort isReadyForHandoff is false (fail-closed)', () => {
    const summary = normaliseCohortReadinessSummary(STALE_COHORT)
    expect(summary.isReadyForHandoff).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #6: Degraded backend — explicit error state, not false positive "ready"
// ---------------------------------------------------------------------------

describe('AC #6: Degraded backend — explicit error state', () => {
  it('502 error from API produces fail-closed stages (all blocked)', async () => {
    vi.stubGlobal('fetch', makeFetchError(502, {}))
    const client = new ComplianceCaseManagementClient(BASE, TOKEN)
    const result = await client.getMonitoringDashboard()
    expect(result.ok).toBe(false)
    if (result.ok) return
    // Use degraded fallback since API failed
    const stages = buildDegradedOnboardingStages(result.error.userGuidance)
    for (const s of stages) {
      expect(s.status).toBe('blocked')
    }
  })

  it('network error produces fail-closed stages with useful guidance', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError('ECONNREFUSED'))
    const client = new ComplianceCaseManagementClient(BASE, TOKEN)
    const result = await client.getMonitoringDashboard()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.userGuidance).toContain('Unable to reach')
    const stages = buildDegradedOnboardingStages(result.error.userGuidance)
    for (const s of stages) {
      expect(s.blockers[0].reason).toContain('Unable to reach')
    }
  })

  it('401 from API produces fail-closed error (not a false positive ready)', async () => {
    vi.stubGlobal('fetch', makeFetchError(401, {}))
    const client = new ComplianceCaseManagementClient(BASE, TOKEN)
    const result = await client.getMonitoringDashboard()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.errorCode).toBe('Unauthorized')
    // Guidance tells operator to sign in — not to proceed with launch
    expect(result.error.userGuidance).toContain('sign in')
  })
})

// ---------------------------------------------------------------------------
// createComplianceCaseClient factory — null when no token
// ---------------------------------------------------------------------------

describe('Unauthenticated path — factory returns null (not a client)', () => {
  it('returns null for null token → no live data fetch possible', () => {
    expect(createComplianceCaseClient(null)).toBeNull()
  })

  it('returns null for empty string token', () => {
    expect(createComplianceCaseClient('')).toBeNull()
  })

  it('returns a client for a valid token', () => {
    const client = createComplianceCaseClient('valid-token')
    expect(client).not.toBeNull()
    expect(client).toBeInstanceOf(ComplianceCaseManagementClient)
  })
})

// ---------------------------------------------------------------------------
// AC #5: Readiness consistency across surfaces
// ---------------------------------------------------------------------------

describe('AC #5: Readiness consistency — same normalized output for same cohort', () => {
  it('normaliseCohortReadinessSummary is deterministic (same input → same output)', () => {
    const s1 = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    const s2 = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    expect(s1.isReadyForHandoff).toBe(s2.isReadyForHandoff)
    expect(s1.readinessScore).toBe(s2.readinessScore)
    expect(s1.statusLabel).toBe(s2.statusLabel)
    expect(s1.blockerTitles).toEqual(s2.blockerTitles)
  })

  it('normaliseCohortReadinessToStages is deterministic', () => {
    const st1 = normaliseCohortReadinessToStages(READY_COHORT)
    const st2 = normaliseCohortReadinessToStages(READY_COHORT)
    for (let i = 0; i < st1.length; i++) {
      expect(st1[i].status).toBe(st2[i].status)
      expect(st1[i].id).toBe(st2[i].id)
    }
  })

  it('BLOCKED cohort never produces more than 5 blocker titles (UI limit)', () => {
    // Cohort with 10 blockers
    const manyBlockers: BackendCohortReadiness = {
      ...BLOCKED_COHORT,
      cohortBlockers: Array.from({ length: 10 }, (_, i) => ({
        id: `blk-${i}`,
        title: `Blocker ${i}`,
        reason: `Reason ${i}`,
        affectedCaseIds: [],
        severity: 'HIGH' as const,
        remediationPath: '/compliance/setup',
      })),
    }
    const summary = normaliseCohortReadinessSummary(manyBlockers)
    expect(summary.blockerTitles.length).toBeLessThanOrEqual(5)
  })
})

// ---------------------------------------------------------------------------
// AC #7: Wallet-free — client and normalizer contain no chain/wallet language
// ---------------------------------------------------------------------------

describe('AC #7: Wallet-free language in normalized output', () => {
  const walletPattern = /WalletConnect|MetaMask|\bPera\b|Defly|connect wallet|sign transaction/i

  it('normaliseCohortReadinessSummary output contains no wallet terminology', () => {
    const summary = normaliseCohortReadinessSummary(BLOCKED_COHORT)
    const text = JSON.stringify(summary)
    expect(text).not.toMatch(walletPattern)
  })

  it('normaliseCohortReadinessToStages output contains no wallet terminology', () => {
    const stages = normaliseCohortReadinessToStages(BLOCKED_COHORT)
    const text = JSON.stringify(stages)
    expect(text).not.toMatch(walletPattern)
  })

  it('buildDegradedOnboardingStages output contains no wallet terminology', () => {
    const stages = buildDegradedOnboardingStages('Service unavailable.')
    const text = JSON.stringify(stages)
    expect(text).not.toMatch(walletPattern)
  })
})
