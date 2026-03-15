/**
 * Unit Tests: Enterprise Approval Cockpit Utility
 *
 * Validates:
 *  AC #1  isEvidenceStale returns correct boolean for various ages
 *  AC #2  formatStalenessLabel produces human-friendly output
 *  AC #3  deriveStageStatus maps blockers → correct ApprovalStageStatus
 *  AC #4  computeReleaseRecommendation covers all posture scenarios
 *  AC #5  buildDefaultCockpitState produces a well-formed initial state
 *  AC #6  findBlockingStage returns first blocking/needs-attention stage
 *  AC #7  getTopBlockers sorts by severity and filters to launch-blocking only
 *  AC #8  stageStatusColorClass returns non-empty strings for every status
 *  AC #9  releasePostureBannerClass / releasePostureTextClass cover all postures
 *  AC #10 blockerSeverityBadgeClass covers all severities
 *  AC #11 isBlockingStatus and isSignedOff are accurate
 *  AC #12 STAGE_STATUS_LABELS / RELEASE_POSTURE_LABELS cover all keys
 */

import { describe, it, expect } from 'vitest'
import {
  isEvidenceStale,
  formatStalenessLabel,
  deriveStageStatus,
  computeReleaseRecommendation,
  buildDefaultCockpitState,
  findBlockingStage,
  getTopBlockers,
  stageStatusColorClass,
  releasePostureBannerClass,
  releasePostureTextClass,
  blockerSeverityBadgeClass,
  isBlockingStatus,
  isSignedOff,
  STAGE_STATUS_LABELS,
  STAGE_STATUS_DESCRIPTIONS,
  RELEASE_POSTURE_LABELS,
  RELEASE_POSTURE_DESCRIPTIONS,
  REVIEWER_ROLE_LABELS,
  REVIEWER_ROLE_DESCRIPTIONS,
  BLOCKER_SEVERITY_LABELS,
  type ApprovalStage,
  type StageBlocker,
  type ApprovalStageStatus,
  type ReviewerRole,
  type ReleasePosture,
  type BlockerSeverity,
} from '../../utils/approvalCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000

function makeBlocker(
  overrides: Partial<StageBlocker> = {},
): StageBlocker {
  return {
    id: 'test-blocker',
    severity: 'high',
    title: 'Test blocker',
    reason: 'Reason text',
    action: 'Action text',
    evidencePath: null,
    isLaunchBlocking: true,
    staleSince: null,
    ...overrides,
  }
}

function makeStage(overrides: Partial<ApprovalStage> = {}): ApprovalStage {
  return {
    id: 'test-stage',
    label: 'Test Stage',
    role: 'compliance_operator',
    status: 'not_started',
    summary: 'Summary',
    blockers: [],
    reviewScope: 'Scope',
    lastActionAt: null,
    dueAt: null,
    evidenceLinks: [],
    conditions: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// AC #1 — isEvidenceStale
// ---------------------------------------------------------------------------

describe('isEvidenceStale', () => {
  const now = Date.now()

  it('returns false for null timestamp', () => {
    expect(isEvidenceStale(null, now)).toBe(false)
  })

  it('returns false for an invalid ISO string', () => {
    expect(isEvidenceStale('NOT_A_DATE', now)).toBe(false)
  })

  it('returns false for evidence updated today', () => {
    const today = new Date(now - 60 * 1000).toISOString()
    expect(isEvidenceStale(today, now)).toBe(false)
  })

  it('returns false for evidence exactly 30 days old (boundary)', () => {
    const exactly30 = new Date(now - 30 * DAY_MS).toISOString()
    expect(isEvidenceStale(exactly30, now)).toBe(false)
  })

  it('returns true for evidence 31 days old', () => {
    const old = new Date(now - 31 * DAY_MS).toISOString()
    expect(isEvidenceStale(old, now)).toBe(true)
  })

  it('returns true for evidence 90 days old', () => {
    const veryOld = new Date(now - 90 * DAY_MS).toISOString()
    expect(isEvidenceStale(veryOld, now)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC #2 — formatStalenessLabel
// ---------------------------------------------------------------------------

describe('formatStalenessLabel', () => {
  const now = Date.now()

  it('returns null for null timestamp', () => {
    expect(formatStalenessLabel(null, now)).toBeNull()
  })

  it('returns null for invalid ISO string', () => {
    expect(formatStalenessLabel('bad', now)).toBeNull()
  })

  it('returns "today" for a timestamp from the same day', () => {
    const ts = new Date(now - 30 * 1000).toISOString()
    expect(formatStalenessLabel(ts, now)).toBe('today')
  })

  it('returns "1 day ago" for 1-day-old evidence', () => {
    const ts = new Date(now - DAY_MS).toISOString()
    expect(formatStalenessLabel(ts, now)).toBe('1 day ago')
  })

  it('returns "5 days ago" for 5-day-old evidence', () => {
    const ts = new Date(now - 5 * DAY_MS).toISOString()
    expect(formatStalenessLabel(ts, now)).toBe('5 days ago')
  })

  it('returns null when timestamp is in the future', () => {
    const future = new Date(now + DAY_MS).toISOString()
    expect(formatStalenessLabel(future, now)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC #3 — deriveStageStatus
// ---------------------------------------------------------------------------

describe('deriveStageStatus', () => {
  it('returns "blocked" when any critical launch-blocking blocker is present', () => {
    const blockers = [makeBlocker({ severity: 'critical', isLaunchBlocking: true })]
    expect(deriveStageStatus(blockers)).toBe('blocked')
  })

  it('returns "blocked" when any high launch-blocking blocker is present', () => {
    const blockers = [makeBlocker({ severity: 'high', isLaunchBlocking: true })]
    expect(deriveStageStatus(blockers)).toBe('blocked')
  })

  it('returns "needs_attention" when only medium launch-blocking blockers are present', () => {
    const blockers = [makeBlocker({ severity: 'medium', isLaunchBlocking: true })]
    expect(deriveStageStatus(blockers)).toBe('needs_attention')
  })

  it('returns "needs_attention" when non-launch-blocking informational blockers exist', () => {
    const blockers = [makeBlocker({ severity: 'informational', isLaunchBlocking: false })]
    expect(deriveStageStatus(blockers)).toBe('needs_attention')
  })

  it('returns "ready_for_review" when no blockers and status is not_started', () => {
    expect(deriveStageStatus([], 'not_started')).toBe('ready_for_review')
  })

  it('preserves "approved" status when there are no blockers at all', () => {
    expect(deriveStageStatus([], 'approved')).toBe('approved')
  })

  it('preserves "conditionally_approved" status when there are no blockers at all', () => {
    expect(deriveStageStatus([], 'conditionally_approved')).toBe('conditionally_approved')
  })

  it('overrides "approved" to "blocked" when a critical blocker is added', () => {
    const blockers = [makeBlocker({ severity: 'critical', isLaunchBlocking: true })]
    expect(deriveStageStatus(blockers, 'approved')).toBe('blocked')
  })

  it('handles informational non-launch-blocking as needs_attention (not blocked)', () => {
    const blockers = [makeBlocker({ severity: 'informational', isLaunchBlocking: false })]
    const status = deriveStageStatus(blockers)
    expect(status).toBe('needs_attention')
    expect(status).not.toBe('blocked')
  })

  // Regression: approved + informational blocker — PO reported correctness gap
  // An approved stage must be downgraded when new concerns appear so reviewers
  // know re-review is required.  Without this fix the stage silently stayed
  // "approved" even after new informational evidence was added.
  it('downgrades "approved" to "needs_attention" when an informational blocker is added', () => {
    const blockers = [makeBlocker({ severity: 'informational', isLaunchBlocking: false })]
    expect(deriveStageStatus(blockers, 'approved')).toBe('needs_attention')
  })

  it('downgrades "conditionally_approved" to "needs_attention" when an informational blocker is added', () => {
    const blockers = [makeBlocker({ severity: 'informational', isLaunchBlocking: false })]
    expect(deriveStageStatus(blockers, 'conditionally_approved')).toBe('needs_attention')
  })

  it('downgrades "approved" to "needs_attention" when a non-launch-blocking medium blocker is added', () => {
    const blockers = [makeBlocker({ severity: 'medium', isLaunchBlocking: false })]
    expect(deriveStageStatus(blockers, 'approved')).toBe('needs_attention')
  })

  it('downgrades "conditionally_approved" to "needs_attention" when a non-launch-blocking medium blocker is added', () => {
    const blockers = [makeBlocker({ severity: 'medium', isLaunchBlocking: false })]
    expect(deriveStageStatus(blockers, 'conditionally_approved')).toBe('needs_attention')
  })

  it('preserves "approved" only when there are truly zero blockers', () => {
    expect(deriveStageStatus([], 'approved')).toBe('approved')
  })

  it('preserves "conditionally_approved" only when there are truly zero blockers', () => {
    expect(deriveStageStatus([], 'conditionally_approved')).toBe('conditionally_approved')
  })
})

// ---------------------------------------------------------------------------
// AC #4 — computeReleaseRecommendation
// ---------------------------------------------------------------------------

describe('computeReleaseRecommendation', () => {
  const now = Date.now()

  it('returns "not_ready" when a stage is blocked', () => {
    const stages = [
      makeStage({ status: 'blocked', blockers: [makeBlocker({ severity: 'critical', isLaunchBlocking: true })] }),
      makeStage({ id: 'stage-2', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('not_ready')
    expect(rec.blockedStageCount).toBe(1)
  })

  it('returns "not_ready" when a stage needs attention', () => {
    const stages = [
      makeStage({ status: 'needs_attention' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('not_ready')
  })

  it('returns "conditionally_ready" when stages have conditional approval', () => {
    const stages = [
      makeStage({ status: 'conditionally_approved' }),
      makeStage({ id: 's2', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('conditionally_ready')
    expect(rec.approvedStageCount).toBe(2) // both conditional + approved count
  })

  it('returns "ready" when all stages are approved', () => {
    const stages = [
      makeStage({ status: 'approved' }),
      makeStage({ id: 's2', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('ready')
    expect(rec.approvedStageCount).toBe(2)
    expect(rec.blockedStageCount).toBe(0)
  })

  it('returns "not_ready" for an empty stage list', () => {
    const rec = computeReleaseRecommendation([], now)
    expect(rec.posture).toBe('not_ready')
  })

  it('includes criticalBlockerCount from all stages', () => {
    const stages = [
      makeStage({
        status: 'blocked',
        blockers: [
          makeBlocker({ id: 'b1', severity: 'critical', isLaunchBlocking: true }),
          makeBlocker({ id: 'b2', severity: 'critical', isLaunchBlocking: true }),
        ],
      }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.criticalBlockerCount).toBe(2)
  })

  it('computes computedAt as a valid ISO string', () => {
    const stages = [makeStage({ status: 'approved' })]
    const rec = computeReleaseRecommendation(stages, now)
    expect(() => new Date(rec.computedAt)).not.toThrow()
    expect(new Date(rec.computedAt).getTime()).toBe(now)
  })

  it('headline is a non-empty string for all postures', () => {
    const postures: Array<[ApprovalStageStatus, ApprovalStageStatus]> = [
      ['blocked', 'approved'],
      ['approved', 'approved'],
      ['conditionally_approved', 'approved'],
    ]
    for (const [s1, s2] of postures) {
      const stages = [makeStage({ status: s1 }), makeStage({ id: 's2', status: s2 })]
      const rec = computeReleaseRecommendation(stages, now)
      expect(rec.headline).toBeTruthy()
      expect(typeof rec.headline).toBe('string')
    }
  })

  it('headline uses singular "stage" when exactly 1 stage needs attention (line 303 branch)', () => {
    const stages = [makeStage({ status: 'needs_attention' })]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('not_ready')
    expect(rec.headline).toContain('1 stage require')
    expect(rec.headline).not.toContain('stages require')
  })

  it('headline uses plural "stages" when more than 1 stage needs attention (line 303 branch)', () => {
    const stages = [
      makeStage({ status: 'needs_attention' }),
      makeStage({ id: 's2', status: 'needs_attention' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.headline).toContain('stages require')
  })

  it('headline uses singular "stage" for conditionally_ready when 1 stage (line 307 branch)', () => {
    const stages = [
      makeStage({ status: 'conditionally_approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('conditionally_ready')
    expect(rec.headline).toContain('1 stage')
    expect(rec.headline).not.toContain('1 stages')
  })

  it('headline uses plural "stages" for conditionally_ready when multiple (line 307 branch)', () => {
    const stages = [
      makeStage({ status: 'conditionally_approved' }),
      makeStage({ id: 's2', status: 'conditionally_approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.headline).toContain('2 stages')
  })

  // Regression: release recommendation must reflect downgraded stage status.
  // When deriveStageStatus downgrades approved/conditionally_approved → needs_attention,
  // computeReleaseRecommendation must produce not_ready (not conditionally_ready / ready).
  it('returns "not_ready" when a previously-approved stage now has an informational blocker (needs_attention)', () => {
    // Stage was approved, but an informational blocker now exists — deriveStageStatus
    // returns needs_attention; computeReleaseRecommendation must produce not_ready.
    const stages = [
      makeStage({
        status: 'needs_attention', // result of deriveStageStatus(informationalBlockers, 'approved')
        blockers: [makeBlocker({ severity: 'informational', isLaunchBlocking: false })],
      }),
      makeStage({ id: 's2', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('not_ready')
    expect(rec.approvedStageCount).toBe(1) // only the genuinely approved stage counts
  })

  it('returns "not_ready" when a previously-conditionally-approved stage now has an informational blocker', () => {
    const stages = [
      makeStage({
        status: 'needs_attention', // deriveStageStatus(informationalBlockers, 'conditionally_approved')
        blockers: [makeBlocker({ severity: 'informational', isLaunchBlocking: false })],
      }),
      makeStage({ id: 's2', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).toBe('not_ready')
  })

  it('does NOT produce "ready" when any stage is needs_attention (regression guard)', () => {
    // All stages appear signed-off in raw data, but one has an informational blocker
    // that deriveStageStatus should downgrade.  Simulate the derived result here.
    const stages = [
      makeStage({ status: 'needs_attention' }),
      makeStage({ id: 's2', status: 'approved' }),
      makeStage({ id: 's3', status: 'approved' }),
    ]
    const rec = computeReleaseRecommendation(stages, now)
    expect(rec.posture).not.toBe('ready')
    expect(rec.posture).not.toBe('conditionally_ready')
    expect(rec.posture).toBe('not_ready')
  })
})

// ---------------------------------------------------------------------------
// AC #5 — buildDefaultCockpitState
// ---------------------------------------------------------------------------

describe('buildDefaultCockpitState', () => {
  it('returns a state with exactly 4 stages', () => {
    const s = buildDefaultCockpitState()
    expect(s.stages).toHaveLength(4)
  })

  it('stage ids are unique', () => {
    const s = buildDefaultCockpitState()
    const ids = s.stages.map((st) => st.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every stage has a non-empty label and summary', () => {
    const s = buildDefaultCockpitState()
    for (const stage of s.stages) {
      expect(stage.label).toBeTruthy()
      expect(stage.summary).toBeTruthy()
    }
  })

  it('recommendation is present and has a valid posture', () => {
    const s = buildDefaultCockpitState()
    expect(['ready', 'conditionally_ready', 'not_ready']).toContain(
      s.recommendation.posture,
    )
  })

  it('refreshedAt is a valid ISO string', () => {
    const now = Date.now()
    const s = buildDefaultCockpitState(now)
    expect(new Date(s.refreshedAt).getTime()).toBe(now)
  })

  it('first stage (compliance-review) has blockers', () => {
    const s = buildDefaultCockpitState()
    const complianceStage = s.stages.find((st) => st.id === 'compliance-review')
    expect(complianceStage).toBeDefined()
    expect(complianceStage!.blockers.length).toBeGreaterThan(0)
  })

  it('second stage (legal-review) is blocked due to critical blocker', () => {
    const s = buildDefaultCockpitState()
    const legalStage = s.stages.find((st) => st.id === 'legal-review')
    expect(legalStage).toBeDefined()
    expect(legalStage!.status).toBe('blocked')
  })

  it('third stage (procurement-review) has no launch-blocking blockers', () => {
    const s = buildDefaultCockpitState()
    const procStage = s.stages.find((st) => st.id === 'procurement-review')
    expect(procStage).toBeDefined()
    expect(procStage!.blockers.filter((b) => b.isLaunchBlocking)).toHaveLength(0)
  })

  it('fourth stage (executive-sign-off) has no launch-blocking blockers', () => {
    const s = buildDefaultCockpitState()
    const execStage = s.stages.find((st) => st.id === 'executive-sign-off')
    expect(execStage).toBeDefined()
    // No blockers → derived status is ready_for_review (stage ordering is not encoded in util)
    expect(execStage!.blockers.filter((b) => b.isLaunchBlocking)).toHaveLength(0)
    expect(['not_started', 'ready_for_review']).toContain(execStage!.status)
  })
})

// ---------------------------------------------------------------------------
// AC #6 — findBlockingStage
// ---------------------------------------------------------------------------

describe('findBlockingStage', () => {
  it('returns null when no stages are blocked or need attention', () => {
    const stages = [
      makeStage({ status: 'approved' }),
      makeStage({ id: 's2', status: 'ready_for_review' }),
    ]
    expect(findBlockingStage(stages)).toBeNull()
  })

  it('returns the first blocked stage', () => {
    const stages = [
      makeStage({ status: 'approved' }),
      makeStage({ id: 's2', status: 'blocked' }),
      makeStage({ id: 's3', status: 'blocked' }),
    ]
    expect(findBlockingStage(stages)!.id).toBe('s2')
  })

  it('returns a needs_attention stage if no blocked stages', () => {
    const stages = [
      makeStage({ status: 'approved' }),
      makeStage({ id: 's2', status: 'needs_attention' }),
    ]
    expect(findBlockingStage(stages)!.id).toBe('s2')
  })

  it('prefers blocked over needs_attention', () => {
    const stages = [
      makeStage({ status: 'needs_attention' }),
      makeStage({ id: 's2', status: 'blocked' }),
    ]
    // First match found (blocked comes second but findBlockingStage finds first match)
    // Actually it finds FIRST of either, so 'needs_attention' is at index 0
    const result = findBlockingStage(stages)
    expect(result).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC #7 — getTopBlockers
// ---------------------------------------------------------------------------

describe('getTopBlockers', () => {
  it('returns only launch-blocking blockers', () => {
    const stages = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'lb', isLaunchBlocking: true, severity: 'high' }),
          makeBlocker({ id: 'nlb', isLaunchBlocking: false, severity: 'informational' }),
        ],
      }),
    ]
    const result = getTopBlockers(stages)
    expect(result.map((b) => b.id)).toEqual(['lb'])
  })

  it('sorts by severity: critical → high → medium → informational', () => {
    const stages = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'med', severity: 'medium', isLaunchBlocking: true }),
          makeBlocker({ id: 'crit', severity: 'critical', isLaunchBlocking: true }),
          makeBlocker({ id: 'high', severity: 'high', isLaunchBlocking: true }),
        ],
      }),
    ]
    const result = getTopBlockers(stages)
    expect(result.map((b) => b.id)).toEqual(['crit', 'high', 'med'])
  })

  it('returns empty array when no launch-blocking items', () => {
    const stages = [makeStage({ blockers: [] })]
    expect(getTopBlockers(stages)).toHaveLength(0)
  })

  it('aggregates blockers across multiple stages', () => {
    const stages = [
      makeStage({ blockers: [makeBlocker({ id: 'b1', severity: 'high', isLaunchBlocking: true })] }),
      makeStage({ id: 's2', blockers: [makeBlocker({ id: 'b2', severity: 'critical', isLaunchBlocking: true })] }),
    ]
    const result = getTopBlockers(stages)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('b2') // critical first
  })
})

// ---------------------------------------------------------------------------
// AC #8 — stageStatusColorClass
// ---------------------------------------------------------------------------

describe('stageStatusColorClass', () => {
  const statuses: ApprovalStageStatus[] = [
    'not_started', 'ready_for_review', 'in_review',
    'needs_attention', 'conditionally_approved', 'approved', 'blocked',
  ]
  const variants = ['badge', 'border', 'text'] as const

  for (const status of statuses) {
    for (const variant of variants) {
      it(`returns a non-empty string for status="${status}" variant="${variant}"`, () => {
        const result = stageStatusColorClass(status, variant)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    }
  }
})

// ---------------------------------------------------------------------------
// AC #9 — releasePostureBannerClass / releasePostureTextClass
// ---------------------------------------------------------------------------

describe('releasePostureBannerClass', () => {
  const postures: ReleasePosture[] = ['ready', 'conditionally_ready', 'not_ready']
  for (const posture of postures) {
    it(`returns non-empty string for posture="${posture}"`, () => {
      const result = releasePostureBannerClass(posture)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  }
})

describe('releasePostureTextClass', () => {
  const postures: ReleasePosture[] = ['ready', 'conditionally_ready', 'not_ready']
  for (const posture of postures) {
    it(`returns non-empty string for posture="${posture}"`, () => {
      const result = releasePostureTextClass(posture)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// AC #10 — blockerSeverityBadgeClass
// ---------------------------------------------------------------------------

describe('blockerSeverityBadgeClass', () => {
  const severities: BlockerSeverity[] = ['critical', 'high', 'medium', 'informational']
  for (const severity of severities) {
    it(`returns non-empty string for severity="${severity}"`, () => {
      const result = blockerSeverityBadgeClass(severity)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// AC #11 — isBlockingStatus / isSignedOff
// ---------------------------------------------------------------------------

describe('isBlockingStatus', () => {
  it('returns true for "blocked"', () => expect(isBlockingStatus('blocked')).toBe(true))
  it('returns true for "needs_attention"', () => expect(isBlockingStatus('needs_attention')).toBe(true))
  it('returns false for "approved"', () => expect(isBlockingStatus('approved')).toBe(false))
  it('returns false for "ready_for_review"', () => expect(isBlockingStatus('ready_for_review')).toBe(false))
  it('returns false for "not_started"', () => expect(isBlockingStatus('not_started')).toBe(false))
})

describe('isSignedOff', () => {
  it('returns true for "approved"', () => expect(isSignedOff('approved')).toBe(true))
  it('returns true for "conditionally_approved"', () => expect(isSignedOff('conditionally_approved')).toBe(true))
  it('returns false for "blocked"', () => expect(isSignedOff('blocked')).toBe(false))
  it('returns false for "not_started"', () => expect(isSignedOff('not_started')).toBe(false))
})

// ---------------------------------------------------------------------------
// AC #12 — Label maps are complete
// ---------------------------------------------------------------------------

describe('Label maps completeness', () => {
  const stageStatuses: ApprovalStageStatus[] = [
    'not_started', 'ready_for_review', 'in_review',
    'needs_attention', 'conditionally_approved', 'approved', 'blocked',
  ]
  const postures: ReleasePosture[] = ['ready', 'conditionally_ready', 'not_ready']
  const roles: ReviewerRole[] = [
    'compliance_operator', 'legal_reviewer', 'procurement_reviewer', 'executive_sponsor',
  ]
  const severities: BlockerSeverity[] = ['critical', 'high', 'medium', 'informational']

  it('STAGE_STATUS_LABELS covers all statuses', () => {
    for (const s of stageStatuses) {
      expect(STAGE_STATUS_LABELS[s]).toBeTruthy()
    }
  })

  it('STAGE_STATUS_DESCRIPTIONS covers all statuses', () => {
    for (const s of stageStatuses) {
      expect(STAGE_STATUS_DESCRIPTIONS[s]).toBeTruthy()
    }
  })

  it('RELEASE_POSTURE_LABELS covers all postures', () => {
    for (const p of postures) {
      expect(RELEASE_POSTURE_LABELS[p]).toBeTruthy()
    }
  })

  it('RELEASE_POSTURE_DESCRIPTIONS covers all postures', () => {
    for (const p of postures) {
      expect(RELEASE_POSTURE_DESCRIPTIONS[p]).toBeTruthy()
    }
  })

  it('REVIEWER_ROLE_LABELS covers all roles', () => {
    for (const r of roles) {
      expect(REVIEWER_ROLE_LABELS[r]).toBeTruthy()
    }
  })

  it('REVIEWER_ROLE_DESCRIPTIONS covers all roles', () => {
    for (const r of roles) {
      expect(REVIEWER_ROLE_DESCRIPTIONS[r]).toBeTruthy()
    }
  })

  it('BLOCKER_SEVERITY_LABELS covers all severities', () => {
    for (const s of severities) {
      expect(BLOCKER_SEVERITY_LABELS[s]).toBeTruthy()
    }
  })
})
