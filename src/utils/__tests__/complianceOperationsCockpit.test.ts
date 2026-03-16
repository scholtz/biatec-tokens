/**
 * Unit Tests: Compliance Operations Cockpit Utility
 *
 * Validates:
 *  AC #1  classifySlaUrgency returns correct band for null, past, near-future, far-future
 *  AC #2  deriveQueueHealth counts items correctly from work item lists
 *  AC #3  deriveStageBottlenecks groups by stage and orders by severity
 *  AC #4  deriveHandoffReadiness returns correct state per stage contents
 *  AC #5  deriveCockpitPosture maps health + availability to posture correctly
 *  AC #6  buildDefaultHandoffs produces 3 handoff cards with correct paths
 *  AC #7  All CSS helpers return non-empty strings for every enum value
 *  AC #8  COCKPIT_TEST_IDS contains expected string constants
 *  AC #9  Mock fixtures are well-formed (healthy and degraded)
 *  AC #10 Fail-closed: absent/degraded data treated as degraded posture
 */

import { describe, it, expect } from 'vitest'
import {
  classifySlaUrgency,
  classifyItemAge,
  deriveAgingBuckets,
  agingBucketBadgeClass,
  agingBucketCellClass,
  deriveQueueHealth,
  deriveStageBottlenecks,
  deriveHandoffReadiness,
  deriveCockpitPosture,
  buildDefaultHandoffs,
  deriveRoleSummaries,
  cockpitPostureBannerClass,
  cockpitPostureIconClass,
  workItemStatusBadgeClass,
  ownershipBadgeClass,
  slaUrgencyBadgeClass,
  handoffReadinessBadgeClass,
  COCKPIT_TEST_IDS,
  OPERATOR_ROLE_LABELS,
  OWNERSHIP_STATE_LABELS,
  SLA_URGENCY_LABELS,
  WORK_ITEM_STATUS_LABELS,
  COCKPIT_POSTURE_LABELS,
  COCKPIT_STAGE_LABELS,
  HANDOFF_READINESS_LABELS,
  COCKPIT_PERSONA_LABELS,
  AGING_BUCKET_LABELS,
  AGING_BUCKET_THRESHOLDS,
  WORKFLOW_STAGE_ORDER,
  MOCK_WORK_ITEMS_HEALTHY,
  MOCK_WORK_ITEMS_DEGRADED,
  SLA_DUE_SOON_HOURS,
  type WorkItem,
  type CockpitPosture,
  type WorkItemStatus,
  type OwnershipState,
  type SlaUrgency,
  type HandoffReadiness,
  type CockpitWorkflowStage,
  type AgingBucket,
} from '../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000

function makeItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'test-item',
    title: 'Test Work Item',
    stage: 'kyc_aml',
    status: 'open',
    ownership: 'assigned_to_me',
    lastActionAt: null,
    dueAt: null,
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking: false,
    ...overrides,
  }
}

// Fixed reference time: 2026-03-16T10:00:00.000Z
const FIXED_NOW = new Date('2026-03-16T10:00:00.000Z').getTime()

// ---------------------------------------------------------------------------
// AC #1 — classifySlaUrgency
// ---------------------------------------------------------------------------

describe('classifySlaUrgency', () => {
  it('returns no_deadline when dueAt is null', () => {
    expect(classifySlaUrgency(null, FIXED_NOW)).toBe('no_deadline')
  })

  it('returns no_deadline when dueAt is an invalid date string', () => {
    expect(classifySlaUrgency('not-a-date', FIXED_NOW)).toBe('no_deadline')
  })

  it('returns overdue when dueAt is in the past', () => {
    const yesterday = new Date(FIXED_NOW - 24 * HOUR_MS).toISOString()
    expect(classifySlaUrgency(yesterday, FIXED_NOW)).toBe('overdue')
  })

  it('returns overdue when dueAt equals now exactly', () => {
    const nowIso = new Date(FIXED_NOW).toISOString()
    expect(classifySlaUrgency(nowIso, FIXED_NOW)).toBe('overdue')
  })

  it('returns due_soon when dueAt is within SLA_DUE_SOON_HOURS', () => {
    const soonIso = new Date(FIXED_NOW + (SLA_DUE_SOON_HOURS - 1) * HOUR_MS).toISOString()
    expect(classifySlaUrgency(soonIso, FIXED_NOW)).toBe('due_soon')
  })

  it('returns due_soon when dueAt is exactly SLA_DUE_SOON_HOURS away', () => {
    const atThresholdIso = new Date(FIXED_NOW + SLA_DUE_SOON_HOURS * HOUR_MS).toISOString()
    // Exactly at threshold is still "due_soon" (<=)
    expect(classifySlaUrgency(atThresholdIso, FIXED_NOW)).toBe('due_soon')
  })

  it('returns on_track when dueAt is beyond SLA_DUE_SOON_HOURS', () => {
    const farFuture = new Date(FIXED_NOW + 72 * HOUR_MS).toISOString()
    expect(classifySlaUrgency(farFuture, FIXED_NOW)).toBe('on_track')
  })

  it('uses Date.now() when now is not provided', () => {
    // Far future should always be on_track regardless of now
    const farFuture = new Date(Date.now() + 7 * 24 * HOUR_MS).toISOString()
    expect(classifySlaUrgency(farFuture)).toBe('on_track')
  })
})

// ---------------------------------------------------------------------------
// AC #2 — deriveQueueHealth
// ---------------------------------------------------------------------------

describe('deriveQueueHealth', () => {
  it('returns all zeros for empty item list', () => {
    const health = deriveQueueHealth([], FIXED_NOW)
    expect(health.total).toBe(0)
    expect(health.overdue).toBe(0)
    expect(health.dueSoon).toBe(0)
    expect(health.blocked).toBe(0)
    expect(health.approvalReady).toBe(0)
    expect(health.unassigned).toBe(0)
    expect(health.assignedToMe).toBe(0)
    expect(health.escalated).toBe(0)
  })

  it('excludes complete items from totals', () => {
    const items = [
      makeItem({ status: 'complete' }),
      makeItem({ status: 'open' }),
    ]
    const health = deriveQueueHealth(items, FIXED_NOW)
    expect(health.total).toBe(1)
  })

  it('counts overdue items by status', () => {
    const items = [
      makeItem({ status: 'overdue' }),
      makeItem({ status: 'open' }),
    ]
    const health = deriveQueueHealth(items, FIXED_NOW)
    expect(health.overdue).toBe(1)
  })

  it('counts overdue items by SLA deadline', () => {
    const pastDue = new Date(FIXED_NOW - HOUR_MS).toISOString()
    const items = [
      makeItem({ status: 'open', dueAt: pastDue }),
    ]
    const health = deriveQueueHealth(items, FIXED_NOW)
    expect(health.overdue).toBe(1)
  })

  it('counts blocked items', () => {
    const items = [
      makeItem({ status: 'blocked' }),
      makeItem({ status: 'blocked' }),
      makeItem({ status: 'open' }),
    ]
    expect(deriveQueueHealth(items, FIXED_NOW).blocked).toBe(2)
  })

  it('counts approval_ready items', () => {
    const items = [makeItem({ status: 'approval_ready' })]
    expect(deriveQueueHealth(items, FIXED_NOW).approvalReady).toBe(1)
  })

  it('counts unassigned items', () => {
    const items = [
      makeItem({ ownership: 'unassigned' }),
      makeItem({ ownership: 'assigned_to_me' }),
    ]
    expect(deriveQueueHealth(items, FIXED_NOW).unassigned).toBe(1)
  })

  it('counts assigned_to_me items', () => {
    const items = [
      makeItem({ ownership: 'assigned_to_me' }),
      makeItem({ ownership: 'assigned_to_team' }),
    ]
    expect(deriveQueueHealth(items, FIXED_NOW).assignedToMe).toBe(1)
  })

  it('counts escalated items by status', () => {
    const items = [makeItem({ status: 'escalated' })]
    expect(deriveQueueHealth(items, FIXED_NOW).escalated).toBe(1)
  })

  it('counts escalated items by ownership', () => {
    const items = [makeItem({ ownership: 'escalated' })]
    expect(deriveQueueHealth(items, FIXED_NOW).escalated).toBe(1)
  })

  it('counts due_soon items correctly (not double-counted in overdue)', () => {
    const soonIso = new Date(FIXED_NOW + 10 * HOUR_MS).toISOString()
    const items = [makeItem({ status: 'open', dueAt: soonIso })]
    const health = deriveQueueHealth(items, FIXED_NOW)
    expect(health.dueSoon).toBe(1)
    expect(health.overdue).toBe(0)
  })

  it('works correctly with MOCK_WORK_ITEMS_HEALTHY', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_HEALTHY, FIXED_NOW)
    expect(health.total).toBe(MOCK_WORK_ITEMS_HEALTHY.length)
    expect(health.blocked).toBe(0)
    expect(health.approvalReady).toBeGreaterThanOrEqual(1) // wi-003 is approval_ready
  })

  it('works correctly with MOCK_WORK_ITEMS_DEGRADED', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    expect(health.total).toBe(MOCK_WORK_ITEMS_DEGRADED.length)
    expect(health.blocked).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// AC #3 — deriveStageBottlenecks
// ---------------------------------------------------------------------------

describe('deriveStageBottlenecks', () => {
  it('returns empty array when all items are complete', () => {
    const items = [makeItem({ status: 'complete' })]
    expect(deriveStageBottlenecks(items, FIXED_NOW)).toHaveLength(0)
  })

  it('returns empty array when no items have issues', () => {
    const farFuture = new Date(FIXED_NOW + 72 * HOUR_MS).toISOString()
    const items = [makeItem({ status: 'open', dueAt: farFuture, ownership: 'assigned_to_me' })]
    expect(deriveStageBottlenecks(items, FIXED_NOW)).toHaveLength(0)
  })

  it('includes stages with blocked items', () => {
    const items = [makeItem({ stage: 'kyc_aml', status: 'blocked' })]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    expect(bottlenecks.some((b) => b.stage === 'kyc_aml')).toBe(true)
  })

  it('includes stages with unassigned items', () => {
    const items = [makeItem({ stage: 'approval', ownership: 'unassigned' })]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    expect(bottlenecks.some((b) => b.stage === 'approval')).toBe(true)
  })

  it('includes stages with due-soon items', () => {
    const soonIso = new Date(FIXED_NOW + 5 * HOUR_MS).toISOString()
    const items = [makeItem({ stage: 'reporting', dueAt: soonIso, ownership: 'assigned_to_me' })]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    expect(bottlenecks.some((b) => b.stage === 'reporting')).toBe(true)
  })

  it('sets hasLaunchBlockers when item is launch-blocking', () => {
    const items = [
      makeItem({ stage: 'kyc_aml', status: 'blocked', isLaunchBlocking: true }),
    ]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    const kyc = bottlenecks.find((b) => b.stage === 'kyc_aml')
    expect(kyc?.hasLaunchBlockers).toBe(true)
  })

  it('does not set hasLaunchBlockers when item is not launch-blocking', () => {
    const items = [
      makeItem({ stage: 'kyc_aml', status: 'blocked', isLaunchBlocking: false }),
    ]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    const kyc = bottlenecks.find((b) => b.stage === 'kyc_aml')
    expect(kyc?.hasLaunchBlockers).toBe(false)
  })

  it('sorts by severity (blocked > due-soon > unassigned)', () => {
    const soonIso = new Date(FIXED_NOW + 5 * HOUR_MS).toISOString()
    const items = [
      makeItem({ id: 'a', stage: 'approval', ownership: 'unassigned' }),
      makeItem({ id: 'b', stage: 'reporting', dueAt: soonIso, ownership: 'assigned_to_me' }),
      makeItem({ id: 'c', stage: 'kyc_aml', status: 'blocked' }),
    ]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    expect(bottlenecks[0].stage).toBe('kyc_aml')
  })

  it('returns workspace path for each bottleneck', () => {
    const items = [makeItem({ stage: 'onboarding', status: 'blocked' })]
    const bottlenecks = deriveStageBottlenecks(items, FIXED_NOW)
    expect(bottlenecks[0].workspacePath).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// AC #4 — deriveHandoffReadiness
// ---------------------------------------------------------------------------

describe('deriveHandoffReadiness', () => {
  it('returns unknown when no items in the stage', () => {
    expect(deriveHandoffReadiness('approval', [], FIXED_NOW)).toBe('unknown')
  })

  it('returns unknown when all items in stage are complete', () => {
    const items = [makeItem({ stage: 'approval', status: 'complete' })]
    expect(deriveHandoffReadiness('approval', items, FIXED_NOW)).toBe('unknown')
  })

  it('returns not_ready when a blocked item exists in stage', () => {
    const items = [makeItem({ stage: 'approval', status: 'blocked' })]
    expect(deriveHandoffReadiness('approval', items, FIXED_NOW)).toBe('not_ready')
  })

  it('returns not_ready when a launch-blocking overdue item exists', () => {
    const past = new Date(FIXED_NOW - HOUR_MS).toISOString()
    const items = [
      makeItem({ stage: 'onboarding', status: 'overdue', dueAt: past, isLaunchBlocking: true }),
    ]
    expect(deriveHandoffReadiness('onboarding', items, FIXED_NOW)).toBe('not_ready')
  })

  it('returns has_warnings when an escalated item exists', () => {
    const items = [makeItem({ stage: 'kyc_aml', status: 'escalated' })]
    expect(deriveHandoffReadiness('kyc_aml', items, FIXED_NOW)).toBe('has_warnings')
  })

  it('returns has_warnings when a due-soon item exists', () => {
    const soonIso = new Date(FIXED_NOW + 5 * HOUR_MS).toISOString()
    const items = [makeItem({ stage: 'reporting', status: 'in_progress', dueAt: soonIso })]
    expect(deriveHandoffReadiness('reporting', items, FIXED_NOW)).toBe('has_warnings')
  })

  it('returns ready when items exist and none are blocked/escalated/overdue/due-soon', () => {
    const farFuture = new Date(FIXED_NOW + 72 * HOUR_MS).toISOString()
    const items = [makeItem({ stage: 'approval', status: 'pending_review', dueAt: farFuture })]
    expect(deriveHandoffReadiness('approval', items, FIXED_NOW)).toBe('ready')
  })
})

// ---------------------------------------------------------------------------
// AC #5 — deriveCockpitPosture
// ---------------------------------------------------------------------------

describe('deriveCockpitPosture', () => {
  const healthBase = {
    total: 5,
    overdue: 0,
    dueSoon: 0,
    blocked: 0,
    approvalReady: 0,
    unassigned: 0,
    assignedToMe: 2,
    escalated: 0,
  }

  it('returns degraded when isDataAvailable is false', () => {
    expect(deriveCockpitPosture(healthBase, false)).toBe('degraded')
  })

  it('returns critical when there are overdue items', () => {
    const health = { ...healthBase, overdue: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('critical')
  })

  it('returns critical when there are blocked items', () => {
    const health = { ...healthBase, blocked: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('critical')
  })

  it('returns attention_required when there are due-soon items', () => {
    const health = { ...healthBase, dueSoon: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('attention_required')
  })

  it('returns attention_required when there are unassigned items', () => {
    const health = { ...healthBase, unassigned: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('attention_required')
  })

  it('returns attention_required when there are escalated items', () => {
    const health = { ...healthBase, escalated: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('attention_required')
  })

  it('returns clear when data available and no issues', () => {
    expect(deriveCockpitPosture(healthBase, true)).toBe('clear')
  })

  it('critical takes priority over attention_required', () => {
    const health = { ...healthBase, overdue: 1, dueSoon: 1 }
    expect(deriveCockpitPosture(health, true)).toBe('critical')
  })
})

// ---------------------------------------------------------------------------
// AC #6 — buildDefaultHandoffs
// ---------------------------------------------------------------------------

describe('buildDefaultHandoffs', () => {
  it('returns exactly 3 handoff cards', () => {
    expect(buildDefaultHandoffs([], FIXED_NOW)).toHaveLength(3)
  })

  it('returns handoffs with correct ids', () => {
    const handoffs = buildDefaultHandoffs([], FIXED_NOW)
    const ids = handoffs.map((h) => h.id)
    expect(ids).toContain('handoff-onboarding')
    expect(ids).toContain('handoff-approval')
    expect(ids).toContain('handoff-reporting')
  })

  it('returns handoffs with non-empty paths', () => {
    const handoffs = buildDefaultHandoffs([], FIXED_NOW)
    handoffs.forEach((h) => {
      expect(h.path).toBeTruthy()
      expect(h.path.startsWith('/')).toBe(true)
    })
  })

  it('returns handoffs with non-empty labels and descriptions', () => {
    const handoffs = buildDefaultHandoffs([], FIXED_NOW)
    handoffs.forEach((h) => {
      expect(h.label).toBeTruthy()
      expect(h.description).toBeTruthy()
    })
  })

  it('approval handoff path points to /compliance/approval', () => {
    const handoffs = buildDefaultHandoffs([], FIXED_NOW)
    const approval = handoffs.find((h) => h.id === 'handoff-approval')
    expect(approval?.path).toBe('/compliance/approval')
  })

  it('reporting handoff path points to /compliance/reporting', () => {
    const handoffs = buildDefaultHandoffs([], FIXED_NOW)
    const reporting = handoffs.find((h) => h.id === 'handoff-reporting')
    expect(reporting?.path).toBe('/compliance/reporting')
  })

  it('handoffs reflect blocked items in the relevant stages', () => {
    const items = [
      makeItem({ stage: 'approval', status: 'blocked' }),
    ]
    const handoffs = buildDefaultHandoffs(items, FIXED_NOW)
    const approval = handoffs.find((h) => h.id === 'handoff-approval')
    expect(approval?.readiness).toBe('not_ready')
  })
})

// ---------------------------------------------------------------------------
// AC #7 — CSS helpers
// ---------------------------------------------------------------------------

describe('cockpitPostureBannerClass', () => {
  const postures: CockpitPosture[] = ['clear', 'attention_required', 'critical', 'degraded']
  postures.forEach((posture) => {
    it(`returns non-empty string for ${posture}`, () => {
      expect(cockpitPostureBannerClass(posture)).toBeTruthy()
    })
  })
})

describe('cockpitPostureIconClass', () => {
  const postures: CockpitPosture[] = ['clear', 'attention_required', 'critical', 'degraded']
  postures.forEach((posture) => {
    it(`returns non-empty string for ${posture}`, () => {
      expect(cockpitPostureIconClass(posture)).toBeTruthy()
    })
  })
})

describe('workItemStatusBadgeClass', () => {
  const statuses: WorkItemStatus[] = [
    'open', 'in_progress', 'pending_review', 'blocked',
    'approval_ready', 'overdue', 'escalated', 'complete',
  ]
  statuses.forEach((status) => {
    it(`returns non-empty string for ${status}`, () => {
      expect(workItemStatusBadgeClass(status)).toBeTruthy()
    })
  })
})

describe('ownershipBadgeClass', () => {
  const states: OwnershipState[] = [
    'assigned_to_me', 'assigned_to_team', 'unassigned',
    'blocked_by_external', 'escalated',
  ]
  states.forEach((state) => {
    it(`returns non-empty string for ${state}`, () => {
      expect(ownershipBadgeClass(state)).toBeTruthy()
    })
  })
})

describe('slaUrgencyBadgeClass', () => {
  const urgencies: SlaUrgency[] = ['overdue', 'due_soon', 'on_track', 'no_deadline']
  urgencies.forEach((urgency) => {
    it(`returns non-empty string for ${urgency}`, () => {
      expect(slaUrgencyBadgeClass(urgency)).toBeTruthy()
    })
  })
})

describe('handoffReadinessBadgeClass', () => {
  const readinesses: HandoffReadiness[] = ['ready', 'has_warnings', 'not_ready', 'unknown']
  readinesses.forEach((readiness) => {
    it(`returns non-empty string for ${readiness}`, () => {
      expect(handoffReadinessBadgeClass(readiness)).toBeTruthy()
    })
  })
})

// ---------------------------------------------------------------------------
// AC #8 — COCKPIT_TEST_IDS
// ---------------------------------------------------------------------------

describe('COCKPIT_TEST_IDS', () => {
  it('contains ROOT constant', () => {
    expect(COCKPIT_TEST_IDS.ROOT).toBe('compliance-operations-cockpit')
  })

  it('contains HEADING constant', () => {
    expect(COCKPIT_TEST_IDS.HEADING).toBe('cockpit-ops-heading')
  })

  it('contains POSTURE_BANNER constant', () => {
    expect(COCKPIT_TEST_IDS.POSTURE_BANNER).toBeTruthy()
  })

  it('contains QUEUE_HEALTH_PANEL constant', () => {
    expect(COCKPIT_TEST_IDS.QUEUE_HEALTH_PANEL).toBeTruthy()
  })

  it('contains WORKLIST_PANEL constant', () => {
    expect(COCKPIT_TEST_IDS.WORKLIST_PANEL).toBeTruthy()
  })

  it('contains BOTTLENECK_PANEL constant', () => {
    expect(COCKPIT_TEST_IDS.BOTTLENECK_PANEL).toBeTruthy()
  })

  it('contains HANDOFF_PANEL constant', () => {
    expect(COCKPIT_TEST_IDS.HANDOFF_PANEL).toBeTruthy()
  })

  it('contains DEGRADED_ALERT constant', () => {
    expect(COCKPIT_TEST_IDS.DEGRADED_ALERT).toBeTruthy()
  })

  it('all values are non-empty strings', () => {
    Object.values(COCKPIT_TEST_IDS).forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// AC #9 — Label maps cover all keys
// ---------------------------------------------------------------------------

describe('label maps', () => {
  it('OPERATOR_ROLE_LABELS covers all operator roles', () => {
    const roles = ['compliance_analyst', 'operations_lead', 'sign_off_approver', 'team_lead']
    roles.forEach((r) => expect(OPERATOR_ROLE_LABELS[r as keyof typeof OPERATOR_ROLE_LABELS]).toBeTruthy())
  })

  it('OWNERSHIP_STATE_LABELS covers all ownership states', () => {
    const states: OwnershipState[] = [
      'assigned_to_me', 'assigned_to_team', 'unassigned', 'blocked_by_external', 'escalated',
    ]
    states.forEach((s) => expect(OWNERSHIP_STATE_LABELS[s]).toBeTruthy())
  })

  it('SLA_URGENCY_LABELS covers all SLA urgency bands', () => {
    const urgencies: SlaUrgency[] = ['overdue', 'due_soon', 'on_track', 'no_deadline']
    urgencies.forEach((u) => expect(SLA_URGENCY_LABELS[u]).toBeTruthy())
  })

  it('WORK_ITEM_STATUS_LABELS covers all work item statuses', () => {
    const statuses: WorkItemStatus[] = [
      'open', 'in_progress', 'pending_review', 'blocked',
      'approval_ready', 'overdue', 'escalated', 'complete',
    ]
    statuses.forEach((s) => expect(WORK_ITEM_STATUS_LABELS[s]).toBeTruthy())
  })

  it('COCKPIT_POSTURE_LABELS covers all cockpit postures', () => {
    const postures: CockpitPosture[] = ['clear', 'attention_required', 'critical', 'degraded']
    postures.forEach((p) => expect(COCKPIT_POSTURE_LABELS[p]).toBeTruthy())
  })

  it('COCKPIT_STAGE_LABELS covers all cockpit workflow stages', () => {
    const stages: CockpitWorkflowStage[] = [
      'onboarding', 'document_review', 'kyc_aml', 'remediation', 'approval', 'reporting',
    ]
    stages.forEach((s) => expect(COCKPIT_STAGE_LABELS[s]).toBeTruthy())
  })

  it('HANDOFF_READINESS_LABELS covers all handoff readiness states', () => {
    const readinesses: HandoffReadiness[] = ['ready', 'has_warnings', 'not_ready', 'unknown']
    readinesses.forEach((r) => expect(HANDOFF_READINESS_LABELS[r]).toBeTruthy())
  })
})

// ---------------------------------------------------------------------------
// AC #9 — Mock fixtures
// ---------------------------------------------------------------------------

describe('MOCK_WORK_ITEMS_HEALTHY', () => {
  it('is a non-empty array', () => {
    expect(MOCK_WORK_ITEMS_HEALTHY.length).toBeGreaterThan(0)
  })

  it('every item has a non-empty id', () => {
    MOCK_WORK_ITEMS_HEALTHY.forEach((item) => {
      expect(item.id).toBeTruthy()
    })
  })

  it('every item has a valid stage', () => {
    const validStages: CockpitWorkflowStage[] = [
      'onboarding', 'document_review', 'kyc_aml', 'remediation', 'approval', 'reporting',
    ]
    MOCK_WORK_ITEMS_HEALTHY.forEach((item) => {
      expect(validStages).toContain(item.stage)
    })
  })
})

describe('MOCK_WORK_ITEMS_DEGRADED', () => {
  it('is a non-empty array', () => {
    expect(MOCK_WORK_ITEMS_DEGRADED.length).toBeGreaterThan(0)
  })

  it('contains at least one blocked item', () => {
    expect(MOCK_WORK_ITEMS_DEGRADED.some((i) => i.status === 'blocked' || i.status === 'overdue')).toBe(true)
  })

  it('contains at least one launch-blocking item', () => {
    expect(MOCK_WORK_ITEMS_DEGRADED.some((i) => i.isLaunchBlocking)).toBe(true)
  })

  it('every item has a workspace path starting with /', () => {
    MOCK_WORK_ITEMS_DEGRADED.forEach((item) => {
      expect(item.workspacePath.startsWith('/')).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// AC #10 — Fail-closed behaviour
// ---------------------------------------------------------------------------

describe('Fail-closed behaviour', () => {
  it('deriveCockpitPosture returns degraded when isDataAvailable is false, regardless of health', () => {
    const richHealth = {
      total: 100,
      overdue: 0,
      dueSoon: 0,
      blocked: 0,
      approvalReady: 50,
      unassigned: 0,
      assignedToMe: 50,
      escalated: 0,
    }
    expect(deriveCockpitPosture(richHealth, false)).toBe('degraded')
  })

  it('deriveHandoffReadiness returns unknown for empty stage — not optimistically ready', () => {
    expect(deriveHandoffReadiness('onboarding', [], FIXED_NOW)).toBe('unknown')
  })

  it('deriveQueueHealth returns zero counts for empty list', () => {
    const health = deriveQueueHealth([], FIXED_NOW)
    expect(health.total).toBe(0)
    expect(health.overdue).toBe(0)
    expect(health.blocked).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// AC #5 — Role-aware summaries (deriveRoleSummaries)
// ---------------------------------------------------------------------------

describe('deriveRoleSummaries', () => {
  it('returns exactly three role summary cards', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    expect(summaries).toHaveLength(3)
  })

  it('returns cards for compliance_manager, operations_lead, and executive_sponsor', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    const personas = summaries.map((c) => c.persona)
    expect(personas).toContain('compliance_manager')
    expect(personas).toContain('operations_lead')
    expect(personas).toContain('executive_sponsor')
  })

  it('each card has a non-empty label and description', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    summaries.forEach((card) => {
      expect(card.label).toBeTruthy()
      expect(card.description).toBeTruthy()
    })
  })

  it('each card has at least two metrics', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    summaries.forEach((card) => {
      expect(card.metrics.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('compliance_manager card flags overdue items when they exist', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    const cmCard = summaries.find((c) => c.persona === 'compliance_manager')!
    const overdueMetric = cmCard.metrics.find((m) => m.label === 'Overdue')!
    // MOCK_WORK_ITEMS_DEGRADED has an overdue item (wi-101)
    expect(overdueMetric.severity).toBe('red')
    expect(cmCard.needsAttention).toBe(true)
  })

  it('operations_lead card flags unassigned items when they exist', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    const olCard = summaries.find((c) => c.persona === 'operations_lead')!
    const unassignedMetric = olCard.metrics.find((m) => m.label === 'Unassigned')!
    // wi-101 is unassigned
    expect(unassignedMetric.value).toBeGreaterThan(0)
    expect(unassignedMetric.severity).toBe('yellow')
    expect(olCard.needsAttention).toBe(true)
  })

  it('executive_sponsor card flags launch-blocking items when they exist', () => {
    const health = deriveQueueHealth(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const summaries = deriveRoleSummaries(MOCK_WORK_ITEMS_DEGRADED, health, FIXED_NOW)
    const esCard = summaries.find((c) => c.persona === 'executive_sponsor')!
    const launchMetric = esCard.metrics.find((m) => m.label === 'Launch Blocking')!
    expect(launchMetric.value).toBeGreaterThan(0)
    expect(launchMetric.severity).toBe('red')
    expect(esCard.needsAttention).toBe(true)
  })

  it('all cards return needsAttention=false when items are healthy', () => {
    const tenDaysMs = 10 * 24 * HOUR_MS
    const healthItems: WorkItem[] = [
      makeItem({ status: 'in_progress', ownership: 'assigned_to_me', dueAt: new Date(FIXED_NOW + tenDaysMs).toISOString(), isLaunchBlocking: false }),
    ]
    const health = deriveQueueHealth(healthItems, FIXED_NOW)
    const summaries = deriveRoleSummaries(healthItems, health, FIXED_NOW)
    // With healthy items, no overdue/blocked/launch-blocking → no attention needed
    const complianceCard = summaries.find((c) => c.persona === 'compliance_manager')!
    const executiveCard = summaries.find((c) => c.persona === 'executive_sponsor')!
    expect(complianceCard.needsAttention).toBe(false)
    expect(executiveCard.needsAttention).toBe(false)
  })

  it('returns sensible metrics for empty work item list', () => {
    const health = deriveQueueHealth([], FIXED_NOW)
    const summaries = deriveRoleSummaries([], health, FIXED_NOW)
    expect(summaries).toHaveLength(3)
    summaries.forEach((card) => {
      card.metrics.forEach((metric) => {
        expect(typeof metric.value).toBe('number')
        expect(metric.value).toBe(0)
      })
    })
  })

  it('COCKPIT_PERSONA_LABELS covers all three personas', () => {
    expect(COCKPIT_PERSONA_LABELS.compliance_manager).toBeTruthy()
    expect(COCKPIT_PERSONA_LABELS.operations_lead).toBeTruthy()
    expect(COCKPIT_PERSONA_LABELS.executive_sponsor).toBeTruthy()
  })

  it('COCKPIT_TEST_IDS includes ROLE_SUMMARY_PANEL and ROLE_SUMMARY_CARD', () => {
    expect(COCKPIT_TEST_IDS.ROLE_SUMMARY_PANEL).toBe('role-summary-panel')
    expect(COCKPIT_TEST_IDS.ROLE_SUMMARY_CARD).toBe('role-summary-card')
  })
})

// ---------------------------------------------------------------------------
// classifyItemAge (aging bucket analysis)
// ---------------------------------------------------------------------------

const DAY_MS = 24 * HOUR_MS

describe('classifyItemAge', () => {
  it('returns critical when lastActionAt is null', () => {
    expect(classifyItemAge(null, FIXED_NOW)).toBe('critical')
  })

  it('returns fresh when last action was less than 24h ago', () => {
    const recent = new Date(FIXED_NOW - 12 * HOUR_MS).toISOString()
    expect(classifyItemAge(recent, FIXED_NOW)).toBe('fresh')
  })

  it('returns fresh when last action was exactly 23h 59m ago', () => {
    const nearThreshold = new Date(FIXED_NOW - (24 * HOUR_MS - 60000)).toISOString()
    expect(classifyItemAge(nearThreshold, FIXED_NOW)).toBe('fresh')
  })

  it('returns aging when last action was between 24h and 72h ago', () => {
    const twoDaysAgo = new Date(FIXED_NOW - 2 * DAY_MS).toISOString()
    expect(classifyItemAge(twoDaysAgo, FIXED_NOW)).toBe('aging')
  })

  it('returns aging when last action was exactly 48h ago', () => {
    const exactly48h = new Date(FIXED_NOW - 48 * HOUR_MS).toISOString()
    expect(classifyItemAge(exactly48h, FIXED_NOW)).toBe('aging')
  })

  it('returns stale when last action was between 3 and 7 days ago', () => {
    const fiveDaysAgo = new Date(FIXED_NOW - 5 * DAY_MS).toISOString()
    expect(classifyItemAge(fiveDaysAgo, FIXED_NOW)).toBe('stale')
  })

  it('returns critical when last action was more than 7 days ago', () => {
    const tenDaysAgo = new Date(FIXED_NOW - 10 * DAY_MS).toISOString()
    expect(classifyItemAge(tenDaysAgo, FIXED_NOW)).toBe('critical')
  })

  it('returns critical when last action was exactly 7 days ago (boundary → critical)', () => {
    const exactlySevenDays = new Date(FIXED_NOW - 7 * DAY_MS).toISOString()
    expect(classifyItemAge(exactlySevenDays, FIXED_NOW)).toBe('critical')
  })

  it('returns fresh when lastActionAt is in the future (future timestamps → fresh)', () => {
    const future = new Date(FIXED_NOW + DAY_MS).toISOString()
    expect(classifyItemAge(future, FIXED_NOW)).toBe('fresh')
  })

  it('uses Date.now() as fallback when no time provided', () => {
    const recent = new Date(Date.now() - 60000).toISOString()
    expect(classifyItemAge(recent)).toBe('fresh')
  })
})

// ---------------------------------------------------------------------------
// deriveAgingBuckets
// ---------------------------------------------------------------------------

describe('deriveAgingBuckets', () => {
  function makeAgedItem(daysAgo: number, overrides: Partial<WorkItem> = {}): WorkItem {
    return makeItem({
      lastActionAt: new Date(FIXED_NOW - daysAgo * DAY_MS).toISOString(),
      ...overrides,
    })
  }

  it('returns all zeros for empty list', () => {
    const result = deriveAgingBuckets([], FIXED_NOW)
    expect(result.fresh).toBe(0)
    expect(result.aging).toBe(0)
    expect(result.stale).toBe(0)
    expect(result.critical).toBe(0)
    expect(result.averageDaysOpen).toBe(0)
    expect(result.oldestItemDays).toBe(0)
  })

  it('excludes complete items from aging analysis', () => {
    const items = [makeAgedItem(3), makeAgedItem(3, { status: 'complete' })]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.stale).toBe(1)
    expect(result.fresh + result.aging + result.stale + result.critical).toBe(1)
  })

  it('classifies a fresh item (< 24h)', () => {
    const items = [makeItem({ lastActionAt: new Date(FIXED_NOW - 6 * HOUR_MS).toISOString() })]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.fresh).toBe(1)
    expect(result.aging).toBe(0)
  })

  it('classifies an aging item (1-3 days)', () => {
    const items = [makeAgedItem(2)]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.aging).toBe(1)
  })

  it('classifies a stale item (3-7 days)', () => {
    const items = [makeAgedItem(5)]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.stale).toBe(1)
  })

  it('classifies a critical item (> 7 days)', () => {
    const items = [makeAgedItem(10)]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.critical).toBe(1)
  })

  it('places item with null lastActionAt in critical bucket', () => {
    const items = [makeItem({ lastActionAt: null })]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.critical).toBe(1)
  })

  it('computes averageDaysOpen across multiple items', () => {
    const items = [makeAgedItem(1), makeAgedItem(3)]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.averageDaysOpen).toBeCloseTo(2, 0)
  })

  it('ignores null lastActionAt in average calculation', () => {
    const items = [
      makeItem({ lastActionAt: new Date(FIXED_NOW - 4 * DAY_MS).toISOString() }),
      makeItem({ lastActionAt: null }),
    ]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    // null item goes to critical bucket but is excluded from average calc
    expect(result.averageDaysOpen).toBeCloseTo(4, 0)
    expect(result.critical).toBe(1) // null → critical
  })

  it('tracks the oldest item in oldestItemDays', () => {
    const items = [makeAgedItem(2), makeAgedItem(8)]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.oldestItemDays).toBeCloseTo(8, 0)
  })

  it('returns 0 for oldestItemDays when all items have null lastActionAt', () => {
    const items = [makeItem({ lastActionAt: null })]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.oldestItemDays).toBe(0)
  })

  it('mixed buckets are counted correctly', () => {
    const items = [
      makeItem({ lastActionAt: new Date(FIXED_NOW - 2 * HOUR_MS).toISOString() }),  // fresh
      makeAgedItem(2),    // aging
      makeAgedItem(5),    // stale
      makeAgedItem(10),   // critical
    ]
    const result = deriveAgingBuckets(items, FIXED_NOW)
    expect(result.fresh).toBe(1)
    expect(result.aging).toBe(1)
    expect(result.stale).toBe(1)
    expect(result.critical).toBe(1)
  })

  it('MOCK_WORK_ITEMS_DEGRADED produces non-zero aging buckets', () => {
    const result = deriveAgingBuckets(MOCK_WORK_ITEMS_DEGRADED, FIXED_NOW)
    const total = result.fresh + result.aging + result.stale + result.critical
    expect(total).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// agingBucketBadgeClass and agingBucketCellClass
// ---------------------------------------------------------------------------

describe('agingBucketBadgeClass', () => {
  const buckets: AgingBucket[] = ['fresh', 'aging', 'stale', 'critical']

  it('returns a non-empty string for every AgingBucket value', () => {
    for (const bucket of buckets) {
      expect(agingBucketBadgeClass(bucket).length).toBeGreaterThan(0)
    }
  })

  it('returns green classes for fresh', () => {
    expect(agingBucketBadgeClass('fresh')).toContain('green')
  })

  it('returns red classes for critical', () => {
    expect(agingBucketBadgeClass('critical')).toContain('red')
  })
})

describe('agingBucketCellClass', () => {
  it('returns bg-gray-700 when count is 0', () => {
    expect(agingBucketCellClass('stale', 0)).toBe('bg-gray-700')
  })

  it('returns colored class when count > 0', () => {
    expect(agingBucketCellClass('critical', 2)).toContain('red')
    expect(agingBucketCellClass('fresh', 1)).toContain('green')
  })
})

// ---------------------------------------------------------------------------
// AGING_BUCKET constants
// ---------------------------------------------------------------------------

describe('AGING_BUCKET_LABELS', () => {
  it('has labels for all four aging buckets', () => {
    expect(AGING_BUCKET_LABELS.fresh).toBeTruthy()
    expect(AGING_BUCKET_LABELS.aging).toBeTruthy()
    expect(AGING_BUCKET_LABELS.stale).toBeTruthy()
    expect(AGING_BUCKET_LABELS.critical).toBeTruthy()
  })
})

describe('AGING_BUCKET_THRESHOLDS', () => {
  it('freshHours < agingHours < staleHours', () => {
    expect(AGING_BUCKET_THRESHOLDS.freshHours).toBeLessThan(AGING_BUCKET_THRESHOLDS.agingHours)
    expect(AGING_BUCKET_THRESHOLDS.agingHours).toBeLessThan(AGING_BUCKET_THRESHOLDS.staleHours)
  })
})

// ---------------------------------------------------------------------------
// COCKPIT_TEST_IDS — aging panel IDs
// ---------------------------------------------------------------------------

describe('COCKPIT_TEST_IDS aging panel entries', () => {
  it('includes AGING_PANEL', () => {
    expect(COCKPIT_TEST_IDS.AGING_PANEL).toBe('aging-analysis-panel')
  })

  it('includes AGING_FRESH, AGING_AGING, AGING_STALE, AGING_CRITICAL', () => {
    expect(COCKPIT_TEST_IDS.AGING_FRESH).toBe('aging-fresh')
    expect(COCKPIT_TEST_IDS.AGING_AGING).toBe('aging-aging')
    expect(COCKPIT_TEST_IDS.AGING_STALE).toBe('aging-stale')
    expect(COCKPIT_TEST_IDS.AGING_CRITICAL).toBe('aging-critical')
  })

  it('includes AGING_AVERAGE', () => {
    expect(COCKPIT_TEST_IDS.AGING_AVERAGE).toBe('aging-average-days')
  })

  it('includes PERSONA_SELECTOR and PERSONA_TAB', () => {
    expect(COCKPIT_TEST_IDS.PERSONA_SELECTOR).toBe('persona-selector')
    expect(COCKPIT_TEST_IDS.PERSONA_TAB).toBe('persona-tab')
  })

  it('includes WORK_ITEM_HANDOFF_CONTEXT', () => {
    expect(COCKPIT_TEST_IDS.WORK_ITEM_HANDOFF_CONTEXT).toBe('work-item-handoff-context')
  })
})

// ---------------------------------------------------------------------------
// filterWorkItemsByPersona (AC #3 — role-aware filtering)
// ---------------------------------------------------------------------------

import {
  filterWorkItemsByPersona,
  OPERATOR_ROLE_FILTER_LABELS,
  OPERATOR_ROLE_FILTER_DESCRIPTIONS,
  deriveWorkItemHandoffContext,
  type OperatorRole,
} from '../../utils/complianceOperationsCockpit'

describe('filterWorkItemsByPersona', () => {
  const now = new Date('2026-03-16T12:00:00.000Z').getTime()

  const makeItem = (
    id: string,
    status: WorkItemStatus,
    ownership: OwnershipState,
    isLaunchBlocking = false,
  ): WorkItem => ({
    id,
    title: `Item ${id}`,
    stage: 'kyc_aml',
    status,
    ownership,
    lastActionAt: null,
    dueAt: null,
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking,
  })

  const items: WorkItem[] = [
    makeItem('a', 'in_progress', 'assigned_to_me'),
    makeItem('b', 'pending_review', 'assigned_to_team'),
    makeItem('c', 'overdue', 'unassigned', true),
    makeItem('d', 'blocked', 'unassigned'),
    makeItem('e', 'approval_ready', 'assigned_to_team', true),
    makeItem('f', 'escalated', 'escalated'),
    makeItem('g', 'complete', 'assigned_to_me'), // should never appear
  ]

  it('compliance_analyst sees assigned_to_me, pending_review, and overdue items', () => {
    const result = filterWorkItemsByPersona(items, 'compliance_analyst')
    const ids = result.map((i) => i.id)
    expect(ids).toContain('a') // assigned_to_me
    expect(ids).toContain('b') // pending_review
    expect(ids).toContain('c') // overdue
    expect(ids).not.toContain('g') // complete excluded
  })

  it('operations_lead sees unassigned, blocked, and escalated items', () => {
    const result = filterWorkItemsByPersona(items, 'operations_lead')
    const ids = result.map((i) => i.id)
    expect(ids).toContain('c') // unassigned
    expect(ids).toContain('d') // blocked
    expect(ids).toContain('f') // escalated
    expect(ids).not.toContain('g') // complete excluded
  })

  it('sign_off_approver sees approval_ready and launch-blocking items', () => {
    const result = filterWorkItemsByPersona(items, 'sign_off_approver')
    const ids = result.map((i) => i.id)
    expect(ids).toContain('e') // approval_ready + launch-blocking
    expect(ids).toContain('c') // launch-blocking (overdue)
    expect(ids).not.toContain('a') // in_progress, not launch-blocking
    expect(ids).not.toContain('g') // complete excluded
  })

  it('team_lead sees escalated, blocked, and launch-blocking items', () => {
    const result = filterWorkItemsByPersona(items, 'team_lead')
    const ids = result.map((i) => i.id)
    expect(ids).toContain('f') // escalated
    expect(ids).toContain('d') // blocked
    expect(ids).toContain('c') // launch-blocking
    expect(ids).toContain('e') // launch-blocking
    expect(ids).not.toContain('g') // complete excluded
  })

  it('never returns completed items for any persona', () => {
    const roles: OperatorRole[] = ['compliance_analyst', 'operations_lead', 'sign_off_approver', 'team_lead']
    roles.forEach((role) => {
      const result = filterWorkItemsByPersona(items, role)
      expect(result.find((i) => i.id === 'g')).toBeUndefined()
    })
  })

  it('returns empty array when no items match the persona', () => {
    const onlyComplete: WorkItem[] = [makeItem('z', 'complete', 'assigned_to_me')]
    const result = filterWorkItemsByPersona(onlyComplete, 'compliance_analyst')
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// OPERATOR_ROLE_FILTER_LABELS and OPERATOR_ROLE_FILTER_DESCRIPTIONS
// ---------------------------------------------------------------------------

describe('OPERATOR_ROLE_FILTER_LABELS', () => {
  const roles: OperatorRole[] = ['compliance_analyst', 'operations_lead', 'sign_off_approver', 'team_lead']

  it('provides a non-empty label for every OperatorRole', () => {
    roles.forEach((role) => {
      expect(OPERATOR_ROLE_FILTER_LABELS[role].length).toBeGreaterThan(0)
    })
  })

  it('compliance_analyst maps to Analyst', () => {
    expect(OPERATOR_ROLE_FILTER_LABELS.compliance_analyst).toBe('Analyst')
  })

  it('sign_off_approver maps to Approver', () => {
    expect(OPERATOR_ROLE_FILTER_LABELS.sign_off_approver).toBe('Approver')
  })
})

describe('OPERATOR_ROLE_FILTER_DESCRIPTIONS', () => {
  const roles: OperatorRole[] = ['compliance_analyst', 'operations_lead', 'sign_off_approver', 'team_lead']

  it('provides a non-empty description for every OperatorRole', () => {
    roles.forEach((role) => {
      expect(OPERATOR_ROLE_FILTER_DESCRIPTIONS[role].length).toBeGreaterThan(10)
    })
  })
})

// ---------------------------------------------------------------------------
// deriveWorkItemHandoffContext (AC #5 — handoff context)
// ---------------------------------------------------------------------------

describe('deriveWorkItemHandoffContext', () => {
  const now = new Date('2026-03-16T12:00:00.000Z').getTime()

  const makeItem = (
    stage: CockpitWorkflowStage,
    status: WorkItemStatus,
    ownership: OwnershipState = 'assigned_to_me',
    isLaunchBlocking = false,
    dueAt: string | null = null,
  ): WorkItem => ({
    id: 'ctx-test',
    title: 'Context test item',
    stage,
    status,
    ownership,
    lastActionAt: null,
    dueAt,
    workspacePath: '/compliance/onboarding',
    note: null,
    isLaunchBlocking,
  })

  it('returns a previousStage for stages after the first', () => {
    const item = makeItem('kyc_aml', 'pending_review')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.previousStage).toBe('document_review')
  })

  it('returns null previousStage for the first stage (onboarding)', () => {
    const item = makeItem('onboarding', 'open')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.previousStage).toBeNull()
  })

  it('nextAction is non-empty for every status value', () => {
    const statuses: WorkItemStatus[] = [
      'open', 'in_progress', 'pending_review', 'blocked', 'approval_ready', 'overdue', 'escalated', 'complete',
    ]
    statuses.forEach((status) => {
      const item = makeItem('kyc_aml', status)
      const ctx = deriveWorkItemHandoffContext(item, now)
      expect(ctx.nextAction.length).toBeGreaterThan(0)
    })
  })

  it('blocked items with external ownership suggest follow-up with external party', () => {
    const item = makeItem('kyc_aml', 'blocked', 'blocked_by_external')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.nextAction.toLowerCase()).toContain('external')
  })

  it('approval_ready items suggest proceeding to sign-off', () => {
    const item = makeItem('approval', 'approval_ready')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.nextAction.toLowerCase()).toContain('sign-off')
  })

  it('isUrgent is true for overdue items', () => {
    const item = makeItem('kyc_aml', 'overdue')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.isUrgent).toBe(true)
  })

  it('isUrgent is true for launch-blocking items', () => {
    const item = makeItem('kyc_aml', 'pending_review', 'assigned_to_team', true)
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.isUrgent).toBe(true)
  })

  it('isUrgent is true when dueAt is in the past (SLA overdue)', () => {
    const item = makeItem('kyc_aml', 'in_progress', 'assigned_to_me', false, '2026-03-15T09:00:00.000Z')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.isUrgent).toBe(true)
  })

  it('isUrgent is false for on-track items with no deadline', () => {
    const item = makeItem('document_review', 'in_progress')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.isUrgent).toBe(false)
  })

  it('missingEvidence is populated for blocked kyc_aml items', () => {
    const item = makeItem('kyc_aml', 'blocked')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.missingEvidence.length).toBeGreaterThan(0)
    expect(ctx.missingEvidence[0].toLowerCase()).toContain('kyc')
  })

  it('missingEvidence is empty for in-progress items without blocking status', () => {
    const item = makeItem('kyc_aml', 'in_progress')
    const ctx = deriveWorkItemHandoffContext(item, now)
    expect(ctx.missingEvidence).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// WORKFLOW_STAGE_ORDER — shared constant (de-duplication AC)
// ---------------------------------------------------------------------------

describe('WORKFLOW_STAGE_ORDER', () => {
  it('starts with onboarding', () => {
    expect(WORKFLOW_STAGE_ORDER[0]).toBe('onboarding')
  })

  it('ends with reporting', () => {
    expect(WORKFLOW_STAGE_ORDER[WORKFLOW_STAGE_ORDER.length - 1]).toBe('reporting')
  })

  it('contains all 6 stages', () => {
    expect(WORKFLOW_STAGE_ORDER).toHaveLength(6)
  })

  it('every stage has a label in COCKPIT_STAGE_LABELS', () => {
    WORKFLOW_STAGE_ORDER.forEach((stage) => {
      expect(COCKPIT_STAGE_LABELS[stage].length).toBeGreaterThan(0)
    })
  })
})
