/**
 * Unit Tests: Investor Compliance Onboarding Utility
 *
 * Validates:
 *  AC #1  isOnboardingStageBlocking identifies blocked/stale statuses
 *  AC #2  isOnboardingStageComplete identifies complete status
 *  AC #3  formatOnboardingStalenessLabel produces human-friendly output
 *  AC #4  isOnboardingEvidenceStale detects stale evidence
 *  AC #5  deriveWorkspacePosture maps stage combinations → correct posture
 *  AC #6  deriveReadinessScore computes correct percentage
 *  AC #7  buildReadinessHeadline covers all postures with blocker counts
 *  AC #8  buildReadinessRationale covers all postures
 *  AC #9  deriveOnboardingWorkspaceState aggregates all workspace metrics
 *  AC #10 getTopOnboardingBlockers sorts by launch-blocking then severity
 *  AC #11 postureCardClass / postureTextClass / postureBadgeClass cover all postures
 *  AC #12 stageStatusBadgeClass covers all stage statuses
 *  AC #13 blockerSeverityBadgeClass covers all severities
 *  AC #14 isDocumentActionRequired identifies docs needing attention
 *  AC #15 isKYCApproved / isAMLClear / isJurisdictionBlocking work correctly
 *  AC #16 ONBOARDING_STAGE_LABELS covers all stage IDs
 *  AC #17 Mock fixtures (READY, BLOCKED, PARTIAL, STALE) are well-formed and fail-closed
 */

import { describe, it, expect } from 'vitest'
import {
  // Status helpers
  isOnboardingStageBlocking,
  isOnboardingStageComplete,
  // Staleness helpers
  formatOnboardingStalenessLabel,
  isOnboardingEvidenceStale,
  // Readiness derivation
  deriveWorkspacePosture,
  deriveReadinessScore,
  buildReadinessHeadline,
  buildReadinessRationale,
  deriveOnboardingWorkspaceState,
  // Blocker helpers
  getTopOnboardingBlockers,
  // CSS helpers
  postureCardClass,
  postureTextClass,
  postureBadgeClass,
  stageStatusBadgeClass,
  blockerSeverityBadgeClass,
  // Entity helpers
  isDocumentActionRequired,
  isKYCApproved,
  isAMLClear,
  isJurisdictionBlocking,
  // Constants
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STAGE_STATUS_LABELS,
  ONBOARDING_BLOCKER_SEVERITY_LABELS,
  WORKSPACE_READINESS_POSTURE_LABELS,
  ONBOARDING_STAGE_ORDER,
  // Fixtures
  MOCK_ONBOARDING_STAGES_READY,
  MOCK_ONBOARDING_STAGES_BLOCKED,
  MOCK_ONBOARDING_STAGES_PARTIAL,
  MOCK_ONBOARDING_STAGES_STALE,
  // Types
  type OnboardingStage,
  type OnboardingStageStatus,
  type WorkspaceReadinessPosture,
  type OnboardingBlockerSeverity,
  type OnboardingBlocker,
  type DocumentItem,
  type KYCReviewRecord,
  type AMLScreeningRecord,
  type JurisdictionEntry,
} from '../investorComplianceOnboarding'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000

function makeBlocker(overrides: Partial<OnboardingBlocker> = {}): OnboardingBlocker {
  return {
    id: 'test-blk',
    stageId: 'intake',
    severity: 'high',
    title: 'Test blocker',
    reason: 'Reason',
    recommendedAction: 'Fix this',
    remediationPath: '/compliance/setup',
    staleSince: null,
    isLaunchBlocking: true,
    ...overrides,
  }
}

function makeStage(overrides: Partial<OnboardingStage> = {}): OnboardingStage {
  return {
    id: 'intake',
    label: 'Intake',
    description: 'Intake description',
    status: 'not_started',
    summary: 'Summary',
    blockers: [],
    lastActionAt: null,
    evidenceLinks: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// AC #1: isOnboardingStageBlocking
// ---------------------------------------------------------------------------

describe('isOnboardingStageBlocking', () => {
  it('returns true for blocked status', () => {
    expect(isOnboardingStageBlocking('blocked')).toBe(true)
  })

  it('returns true for stale status', () => {
    expect(isOnboardingStageBlocking('stale')).toBe(true)
  })

  it('returns false for complete', () => {
    expect(isOnboardingStageBlocking('complete')).toBe(false)
  })

  it('returns false for in_progress', () => {
    expect(isOnboardingStageBlocking('in_progress')).toBe(false)
  })

  it('returns false for not_started', () => {
    expect(isOnboardingStageBlocking('not_started')).toBe(false)
  })

  it('returns false for pending_review', () => {
    expect(isOnboardingStageBlocking('pending_review')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #2: isOnboardingStageComplete
// ---------------------------------------------------------------------------

describe('isOnboardingStageComplete', () => {
  it('returns true for complete', () => {
    expect(isOnboardingStageComplete('complete')).toBe(true)
  })

  it('returns false for all non-complete statuses', () => {
    const notComplete: OnboardingStageStatus[] = [
      'not_started', 'in_progress', 'pending_review', 'stale', 'blocked',
    ]
    for (const s of notComplete) {
      expect(isOnboardingStageComplete(s)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// AC #3: formatOnboardingStalenessLabel
// ---------------------------------------------------------------------------

describe('formatOnboardingStalenessLabel', () => {
  it('returns null for null input', () => {
    expect(formatOnboardingStalenessLabel(null)).toBeNull()
  })

  it('returns "Earlier today" for a timestamp from today', () => {
    const now = new Date().toISOString()
    const result = formatOnboardingStalenessLabel(now)
    expect(result).toBe('Earlier today')
  })

  it('returns "1 day ago" for exactly 1 day', () => {
    const yesterday = new Date(Date.now() - DAY_MS).toISOString()
    expect(formatOnboardingStalenessLabel(yesterday)).toBe('1 day ago')
  })

  it('returns "N days ago" for 5 days', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * DAY_MS).toISOString()
    expect(formatOnboardingStalenessLabel(fiveDaysAgo)).toBe('5 days ago')
  })

  it('returns "1 month ago" for ~31 days', () => {
    const oneMonthAgo = new Date(Date.now() - 31 * DAY_MS).toISOString()
    expect(formatOnboardingStalenessLabel(oneMonthAgo)).toBe('1 month ago')
  })

  it('returns "N months ago" for 65 days', () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * DAY_MS).toISOString()
    expect(formatOnboardingStalenessLabel(twoMonthsAgo)).toBe('2 months ago')
  })
})

// ---------------------------------------------------------------------------
// AC #4: isOnboardingEvidenceStale
// ---------------------------------------------------------------------------

describe('isOnboardingEvidenceStale', () => {
  it('returns false for null', () => {
    expect(isOnboardingEvidenceStale(null)).toBe(false)
  })

  it('returns false for recent evidence (5 days)', () => {
    const recent = new Date(Date.now() - 5 * DAY_MS).toISOString()
    expect(isOnboardingEvidenceStale(recent)).toBe(false)
  })

  it('returns true for evidence older than 30 days', () => {
    const old = new Date(Date.now() - 45 * DAY_MS).toISOString()
    expect(isOnboardingEvidenceStale(old)).toBe(true)
  })

  it('returns false at exactly the boundary (30 days)', () => {
    // 30 * DAY_MS is not strictly > 30 days
    const boundary = new Date(Date.now() - 30 * DAY_MS).toISOString()
    expect(isOnboardingEvidenceStale(boundary)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #5: deriveWorkspacePosture
// ---------------------------------------------------------------------------

describe('deriveWorkspacePosture', () => {
  it('returns not_started for empty stages array', () => {
    expect(deriveWorkspacePosture([])).toBe('not_started')
  })

  it('returns not_started when all stages are not_started', () => {
    const stages = ONBOARDING_STAGE_ORDER.map((id) => makeStage({ id, status: 'not_started' }))
    expect(deriveWorkspacePosture(stages)).toBe('not_started')
  })

  it('returns blocked when any stage is blocked', () => {
    const stages = [
      makeStage({ id: 'intake', status: 'complete' }),
      makeStage({ id: 'documentation_review', status: 'blocked' }),
    ]
    expect(deriveWorkspacePosture(stages)).toBe('blocked')
  })

  it('returns stale when a stage has stale status (and no blocked)', () => {
    const stages = [
      makeStage({ id: 'intake', status: 'complete' }),
      makeStage({ id: 'documentation_review', status: 'stale' }),
    ]
    expect(deriveWorkspacePosture(stages)).toBe('stale')
  })

  it('returns blocked when a stage has a launch-blocking blocker', () => {
    const stages = [
      makeStage({
        id: 'intake',
        status: 'in_progress',
        blockers: [makeBlocker({ isLaunchBlocking: true })],
      }),
    ]
    expect(deriveWorkspacePosture(stages)).toBe('blocked')
  })

  it('returns ready_for_handoff when all stages are complete', () => {
    const stages = ONBOARDING_STAGE_ORDER.map((id) => makeStage({ id, status: 'complete' }))
    expect(deriveWorkspacePosture(stages)).toBe('ready_for_handoff')
  })

  it('returns partially_ready for mixed in-progress and not_started', () => {
    const stages = [
      makeStage({ id: 'intake', status: 'complete' }),
      makeStage({ id: 'documentation_review', status: 'in_progress' }),
      makeStage({ id: 'identity_kyc_review', status: 'not_started' }),
    ]
    expect(deriveWorkspacePosture(stages)).toBe('partially_ready')
  })

  it('blocked takes precedence over stale', () => {
    const stages = [
      makeStage({ id: 'intake', status: 'blocked' }),
      makeStage({ id: 'documentation_review', status: 'stale' }),
    ]
    expect(deriveWorkspacePosture(stages)).toBe('blocked')
  })
})

// ---------------------------------------------------------------------------
// AC #6: deriveReadinessScore
// ---------------------------------------------------------------------------

describe('deriveReadinessScore', () => {
  it('returns 0 for empty stages', () => {
    expect(deriveReadinessScore([])).toBe(0)
  })

  it('returns 100 when all stages are complete', () => {
    const stages = ONBOARDING_STAGE_ORDER.map((id) => makeStage({ id, status: 'complete' }))
    expect(deriveReadinessScore(stages)).toBe(100)
  })

  it('returns 0 when all stages are not_started', () => {
    const stages = ONBOARDING_STAGE_ORDER.map((id) => makeStage({ id, status: 'not_started' }))
    expect(deriveReadinessScore(stages)).toBe(0)
  })

  it('returns 50 for a single in_progress stage', () => {
    const stages = [makeStage({ status: 'in_progress' })]
    expect(deriveReadinessScore(stages)).toBe(50)
  })

  it('returns 50 for a single pending_review stage', () => {
    const stages = [makeStage({ status: 'pending_review' })]
    expect(deriveReadinessScore(stages)).toBe(50)
  })

  it('returns 0 for a single blocked stage', () => {
    const stages = [makeStage({ status: 'blocked' })]
    expect(deriveReadinessScore(stages)).toBe(0)
  })

  it('returns 0 for a single stale stage', () => {
    const stages = [makeStage({ status: 'stale' })]
    expect(deriveReadinessScore(stages)).toBe(0)
  })

  it('returns correct average for mixed stages (2 complete, 1 not_started)', () => {
    const stages = [
      makeStage({ id: 'intake', status: 'complete' }),
      makeStage({ id: 'documentation_review', status: 'complete' }),
      makeStage({ id: 'identity_kyc_review', status: 'not_started' }),
    ]
    // (100 + 100 + 0) / 3 = 66.67 → rounds to 67
    expect(deriveReadinessScore(stages)).toBe(67)
  })
})

// ---------------------------------------------------------------------------
// AC #7: buildReadinessHeadline
// ---------------------------------------------------------------------------

describe('buildReadinessHeadline', () => {
  it('returns ready_for_handoff message when posture is ready', () => {
    const headline = buildReadinessHeadline('ready_for_handoff', 0)
    expect(headline).toContain('ready')
  })

  it('returns singular blocker message for 1 blocker', () => {
    const headline = buildReadinessHeadline('blocked', 1)
    expect(headline).toContain('1 critical issue')
  })

  it('returns plural blocker message for 3 blockers', () => {
    const headline = buildReadinessHeadline('blocked', 3)
    expect(headline).toContain('3 critical issues')
  })

  it('returns stale message', () => {
    const headline = buildReadinessHeadline('stale', 0)
    expect(headline).toContain('Stale')
  })

  it('returns partially_ready message', () => {
    const headline = buildReadinessHeadline('partially_ready', 0)
    expect(headline).toContain('progress')
  })

  it('returns not_started message', () => {
    const headline = buildReadinessHeadline('not_started', 0)
    expect(headline).toContain('not started')
  })
})

// ---------------------------------------------------------------------------
// AC #8: buildReadinessRationale
// ---------------------------------------------------------------------------

describe('buildReadinessRationale', () => {
  const postures: WorkspaceReadinessPosture[] = [
    'ready_for_handoff',
    'blocked',
    'stale',
    'partially_ready',
    'not_started',
  ]

  for (const posture of postures) {
    it(`returns a non-empty string for posture: ${posture}`, () => {
      const rationale = buildReadinessRationale(posture, 2, 7)
      expect(typeof rationale).toBe('string')
      expect(rationale.length).toBeGreaterThan(0)
    })
  }

  it('includes completed stage count for blocked posture', () => {
    const rationale = buildReadinessRationale('blocked', 3, 7)
    expect(rationale).toContain('3')
    expect(rationale).toContain('7')
  })
})

// ---------------------------------------------------------------------------
// AC #9: deriveOnboardingWorkspaceState
// ---------------------------------------------------------------------------

describe('deriveOnboardingWorkspaceState', () => {
  it('produces correct state for all-complete stages', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_READY)
    expect(state.posture).toBe('ready_for_handoff')
    expect(state.completedStageCount).toBe(ONBOARDING_STAGE_ORDER.length)
    expect(state.blockedStageCount).toBe(0)
    expect(state.staleStageCount).toBe(0)
    expect(state.totalLaunchBlockers).toBe(0)
    expect(state.readinessScore).toBe(100)
    expect(typeof state.headline).toBe('string')
    expect(typeof state.rationale).toBe('string')
    expect(typeof state.lastRefreshedAt).toBe('string')
  })

  it('produces blocked state when KYC/AML stages are blocked', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_BLOCKED)
    expect(state.posture).toBe('blocked')
    expect(state.blockedStageCount).toBeGreaterThan(0)
    expect(state.totalLaunchBlockers).toBeGreaterThan(0)
    expect(state.readinessScore).toBeLessThan(100)
  })

  it('produces partially_ready state for partial fixture', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_PARTIAL)
    expect(state.posture).toBe('partially_ready')
    expect(state.completedStageCount).toBeGreaterThan(0)
    expect(state.completedStageCount).toBeLessThan(ONBOARDING_STAGE_ORDER.length)
  })

  it('produces stale state when stages have stale evidence', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_STALE)
    // All stages have stale status, so posture is 'stale' (stale check precedes blocker check)
    expect(state.posture).toBe('stale')
    expect(state.staleStageCount).toBe(ONBOARDING_STAGE_ORDER.length)
    expect(state.totalLaunchBlockers).toBeGreaterThan(0)
  })

  it('includes stages array in state', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_PARTIAL)
    expect(Array.isArray(state.stages)).toBe(true)
    expect(state.stages.length).toBe(ONBOARDING_STAGE_ORDER.length)
  })
})

// ---------------------------------------------------------------------------
// AC #10: getTopOnboardingBlockers
// ---------------------------------------------------------------------------

describe('getTopOnboardingBlockers', () => {
  it('returns empty array when no blockers', () => {
    const stages = [makeStage({ blockers: [] })]
    expect(getTopOnboardingBlockers(stages)).toEqual([])
  })

  it('returns at most the specified limit', () => {
    const blockers = Array.from({ length: 10 }, (_, i) =>
      makeBlocker({ id: `b${i}`, severity: 'high' }),
    )
    const stages = [makeStage({ blockers })]
    expect(getTopOnboardingBlockers(stages, 5)).toHaveLength(5)
  })

  it('places launch-blocking blockers first', () => {
    const stages = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'non-blocking', severity: 'critical', isLaunchBlocking: false }),
          makeBlocker({ id: 'blocking', severity: 'medium', isLaunchBlocking: true }),
        ],
      }),
    ]
    const top = getTopOnboardingBlockers(stages, 5)
    expect(top[0].id).toBe('blocking')
    expect(top[1].id).toBe('non-blocking')
  })

  it('sorts by severity among same launch-blocking flag', () => {
    const stages = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'medium-blk', severity: 'medium', isLaunchBlocking: true }),
          makeBlocker({ id: 'critical-blk', severity: 'critical', isLaunchBlocking: true }),
        ],
      }),
    ]
    const top = getTopOnboardingBlockers(stages, 5)
    expect(top[0].id).toBe('critical-blk')
    expect(top[1].id).toBe('medium-blk')
  })

  it('collects blockers across all stages', () => {
    const stages = [
      makeStage({ id: 'intake', blockers: [makeBlocker({ id: 'b1' })] }),
      makeStage({ id: 'documentation_review', blockers: [makeBlocker({ id: 'b2' })] }),
    ]
    expect(getTopOnboardingBlockers(stages, 10)).toHaveLength(2)
  })

  it('defaults to limit of 5', () => {
    const blockers = Array.from({ length: 8 }, (_, i) =>
      makeBlocker({ id: `b${i}` }),
    )
    const stages = [makeStage({ blockers })]
    expect(getTopOnboardingBlockers(stages)).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// AC #11: CSS posture helpers
// ---------------------------------------------------------------------------

describe('postureCardClass / postureTextClass / postureBadgeClass', () => {
  const postures: WorkspaceReadinessPosture[] = [
    'ready_for_handoff',
    'partially_ready',
    'blocked',
    'stale',
    'not_started',
  ]

  for (const posture of postures) {
    it(`postureCardClass returns non-empty string for: ${posture}`, () => {
      expect(postureCardClass(posture).length).toBeGreaterThan(0)
    })

    it(`postureTextClass returns non-empty string for: ${posture}`, () => {
      expect(postureTextClass(posture).length).toBeGreaterThan(0)
    })

    it(`postureBadgeClass returns non-empty string for: ${posture}`, () => {
      expect(postureBadgeClass(posture).length).toBeGreaterThan(0)
    })
  }

  it('ready_for_handoff uses green classes', () => {
    expect(postureCardClass('ready_for_handoff')).toContain('green')
    expect(postureBadgeClass('ready_for_handoff')).toContain('green')
  })

  it('blocked uses red classes', () => {
    expect(postureCardClass('blocked')).toContain('red')
    expect(postureBadgeClass('blocked')).toContain('red')
  })

  it('stale uses yellow classes', () => {
    expect(postureCardClass('stale')).toContain('yellow')
    expect(postureBadgeClass('stale')).toContain('yellow')
  })
})

// ---------------------------------------------------------------------------
// AC #12: stageStatusBadgeClass
// ---------------------------------------------------------------------------

describe('stageStatusBadgeClass', () => {
  const statuses: OnboardingStageStatus[] = [
    'complete', 'in_progress', 'pending_review', 'blocked', 'stale', 'not_started',
  ]

  for (const status of statuses) {
    it(`returns non-empty string for status: ${status}`, () => {
      expect(stageStatusBadgeClass(status).length).toBeGreaterThan(0)
    })
  }

  it('complete uses green classes', () => {
    expect(stageStatusBadgeClass('complete')).toContain('green')
  })

  it('blocked uses red classes', () => {
    expect(stageStatusBadgeClass('blocked')).toContain('red')
  })

  it('stale uses yellow classes', () => {
    expect(stageStatusBadgeClass('stale')).toContain('yellow')
  })
})

// ---------------------------------------------------------------------------
// AC #13: blockerSeverityBadgeClass
// ---------------------------------------------------------------------------

describe('blockerSeverityBadgeClass', () => {
  const severities: OnboardingBlockerSeverity[] = [
    'critical', 'high', 'medium', 'informational',
  ]

  for (const severity of severities) {
    it(`returns non-empty string for severity: ${severity}`, () => {
      expect(blockerSeverityBadgeClass(severity).length).toBeGreaterThan(0)
    })
  }

  it('critical uses red classes', () => {
    expect(blockerSeverityBadgeClass('critical')).toContain('red')
  })

  it('informational uses gray classes', () => {
    expect(blockerSeverityBadgeClass('informational')).toContain('gray')
  })
})

// ---------------------------------------------------------------------------
// AC #14: isDocumentActionRequired
// ---------------------------------------------------------------------------

describe('isDocumentActionRequired', () => {
  function makeDoc(status: DocumentItem['status']): DocumentItem {
    return {
      id: 'doc-1',
      label: 'Document',
      description: 'Description',
      status,
      verifiedAt: null,
      isRequired: true,
    }
  }

  it('returns false for present documents', () => {
    expect(isDocumentActionRequired(makeDoc('present'))).toBe(false)
  })

  it('returns true for missing documents', () => {
    expect(isDocumentActionRequired(makeDoc('missing'))).toBe(true)
  })

  it('returns true for expired documents', () => {
    expect(isDocumentActionRequired(makeDoc('expired'))).toBe(true)
  })

  it('returns true for pending_review documents', () => {
    expect(isDocumentActionRequired(makeDoc('pending_review'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC #15: isKYCApproved / isAMLClear / isJurisdictionBlocking
// ---------------------------------------------------------------------------

describe('isKYCApproved', () => {
  function makeKYC(status: KYCReviewRecord['status']): KYCReviewRecord {
    return {
      entityId: 'e1',
      entityName: 'Entity',
      status,
      lastActionAt: null,
      reviewNote: null,
      isLaunchBlocking: false,
    }
  }

  it('returns true only for approved', () => {
    expect(isKYCApproved(makeKYC('approved'))).toBe(true)
  })

  it('returns false for all non-approved statuses', () => {
    for (const s of ['not_submitted', 'pending', 'in_review', 'rejected', 'requires_more_info'] as const) {
      expect(isKYCApproved(makeKYC(s))).toBe(false)
    }
  })
})

describe('isAMLClear', () => {
  function makeAML(status: AMLScreeningRecord['screeningStatus']): AMLScreeningRecord {
    return {
      entityId: 'e1',
      entityName: 'Entity',
      screeningStatus: status,
      riskRating: 'low',
      screenedAt: null,
      note: null,
      isLaunchBlocking: false,
    }
  }

  it('returns true only for clear status', () => {
    expect(isAMLClear(makeAML('clear'))).toBe(true)
  })

  it('returns false for all non-clear statuses', () => {
    for (const s of ['not_run', 'running', 'flagged', 'inconclusive'] as const) {
      expect(isAMLClear(makeAML(s))).toBe(false)
    }
  })
})

describe('isJurisdictionBlocking', () => {
  function makeJurisdiction(decision: JurisdictionEntry['decision'], isBlocking: boolean): JurisdictionEntry {
    return {
      jurisdictionCode: 'US',
      jurisdictionName: 'United States',
      decision,
      isLaunchBlocking: isBlocking,
      reason: null,
    }
  }

  it('returns true for restricted + launch-blocking', () => {
    expect(isJurisdictionBlocking(makeJurisdiction('restricted', true))).toBe(true)
  })

  it('returns true for contradicted + launch-blocking', () => {
    expect(isJurisdictionBlocking(makeJurisdiction('contradicted', true))).toBe(true)
  })

  it('returns false for restricted + not launch-blocking', () => {
    expect(isJurisdictionBlocking(makeJurisdiction('restricted', false))).toBe(false)
  })

  it('returns false for permitted', () => {
    expect(isJurisdictionBlocking(makeJurisdiction('permitted', true))).toBe(false)
  })

  it('returns false for pending', () => {
    expect(isJurisdictionBlocking(makeJurisdiction('pending', true))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #16: ONBOARDING_STAGE_LABELS covers all stage IDs
// ---------------------------------------------------------------------------

describe('ONBOARDING_STAGE_LABELS', () => {
  it('covers all stage IDs in ONBOARDING_STAGE_ORDER', () => {
    for (const id of ONBOARDING_STAGE_ORDER) {
      expect(ONBOARDING_STAGE_LABELS[id]).toBeDefined()
      expect(ONBOARDING_STAGE_LABELS[id].length).toBeGreaterThan(0)
    }
  })
})

describe('ONBOARDING_STAGE_STATUS_LABELS', () => {
  const statuses: OnboardingStageStatus[] = [
    'not_started', 'in_progress', 'pending_review', 'stale', 'blocked', 'complete',
  ]

  for (const status of statuses) {
    it(`covers status: ${status}`, () => {
      expect(ONBOARDING_STAGE_STATUS_LABELS[status]).toBeDefined()
      expect(ONBOARDING_STAGE_STATUS_LABELS[status].length).toBeGreaterThan(0)
    })
  }
})

describe('ONBOARDING_BLOCKER_SEVERITY_LABELS', () => {
  const severities: OnboardingBlockerSeverity[] = ['critical', 'high', 'medium', 'informational']
  for (const s of severities) {
    it(`covers severity: ${s}`, () => {
      expect(ONBOARDING_BLOCKER_SEVERITY_LABELS[s]).toBeDefined()
    })
  }
})

describe('WORKSPACE_READINESS_POSTURE_LABELS', () => {
  const postures: WorkspaceReadinessPosture[] = [
    'ready_for_handoff', 'partially_ready', 'blocked', 'stale', 'not_started',
  ]
  for (const p of postures) {
    it(`covers posture: ${p}`, () => {
      expect(WORKSPACE_READINESS_POSTURE_LABELS[p]).toBeDefined()
      expect(WORKSPACE_READINESS_POSTURE_LABELS[p].length).toBeGreaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// AC #17: Mock fixtures are well-formed and fail-closed
// ---------------------------------------------------------------------------

describe('MOCK_ONBOARDING_STAGES_READY', () => {
  it('has one entry per stage ID', () => {
    expect(MOCK_ONBOARDING_STAGES_READY).toHaveLength(ONBOARDING_STAGE_ORDER.length)
  })

  it('all stages are complete', () => {
    for (const stage of MOCK_ONBOARDING_STAGES_READY) {
      expect(stage.status).toBe('complete')
    }
  })

  it('no blockers in any stage', () => {
    for (const stage of MOCK_ONBOARDING_STAGES_READY) {
      expect(stage.blockers).toHaveLength(0)
    }
  })

  it('derives ready_for_handoff posture', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_READY)
    expect(state.posture).toBe('ready_for_handoff')
  })

  it('readiness score is 100', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_READY)
    expect(state.readinessScore).toBe(100)
  })
})

describe('MOCK_ONBOARDING_STAGES_BLOCKED', () => {
  it('has one entry per stage ID', () => {
    expect(MOCK_ONBOARDING_STAGES_BLOCKED).toHaveLength(ONBOARDING_STAGE_ORDER.length)
  })

  it('includes at least one blocked stage', () => {
    const hasBlocked = MOCK_ONBOARDING_STAGES_BLOCKED.some((s) => s.status === 'blocked')
    expect(hasBlocked).toBe(true)
  })

  it('includes at least one launch-blocking blocker', () => {
    const hasLaunchBlocker = MOCK_ONBOARDING_STAGES_BLOCKED.some((s) =>
      s.blockers.some((b) => b.isLaunchBlocking),
    )
    expect(hasLaunchBlocker).toBe(true)
  })

  it('does NOT derive ready_for_handoff posture (fail-closed)', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_BLOCKED)
    expect(state.posture).not.toBe('ready_for_handoff')
  })
})

describe('MOCK_ONBOARDING_STAGES_PARTIAL', () => {
  it('has one entry per stage ID', () => {
    expect(MOCK_ONBOARDING_STAGES_PARTIAL).toHaveLength(ONBOARDING_STAGE_ORDER.length)
  })

  it('has at least one complete stage and at least one non-complete stage', () => {
    const completedCount = MOCK_ONBOARDING_STAGES_PARTIAL.filter((s) => s.status === 'complete').length
    const nonCompletedCount = MOCK_ONBOARDING_STAGES_PARTIAL.filter((s) => s.status !== 'complete').length
    expect(completedCount).toBeGreaterThan(0)
    expect(nonCompletedCount).toBeGreaterThan(0)
  })

  it('does NOT derive ready_for_handoff posture (fail-closed)', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_PARTIAL)
    expect(state.posture).not.toBe('ready_for_handoff')
  })
})

describe('MOCK_ONBOARDING_STAGES_STALE', () => {
  it('has one entry per stage ID', () => {
    expect(MOCK_ONBOARDING_STAGES_STALE).toHaveLength(ONBOARDING_STAGE_ORDER.length)
  })

  it('all stages are stale', () => {
    for (const stage of MOCK_ONBOARDING_STAGES_STALE) {
      expect(stage.status).toBe('stale')
    }
  })

  it('all stages have at least one blocker', () => {
    for (const stage of MOCK_ONBOARDING_STAGES_STALE) {
      expect(stage.blockers.length).toBeGreaterThan(0)
    }
  })

  it('does NOT derive ready_for_handoff posture (fail-closed)', () => {
    const state = deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_STALE)
    expect(state.posture).not.toBe('ready_for_handoff')
  })
})
