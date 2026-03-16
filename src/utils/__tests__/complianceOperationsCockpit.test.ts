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
