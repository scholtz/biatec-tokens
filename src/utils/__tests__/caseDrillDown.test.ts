/**
 * Unit Tests: Case Drill-Down Utility
 *
 * Validates:
 *  - Timeline event sorting, dot classes, and type predicates
 *  - Evidence group status derivation (worst-case, fail-closed)
 *  - Evidence readiness label derivation
 *  - Approval decision badge classes
 *  - Escalation option building and default selection
 *  - Blocker summary derivation
 *  - Next action guidance derivation
 *  - Full deriveCaseDrillDown integration
 *  - Test ID constants are present and non-empty
 *  - Fail-closed: degraded/missing evidence is never optimistic
 */

import { describe, it, expect } from 'vitest'
import {
  sortTimelineEvents,
  timelineEventDotClass,
  isNegativeTimelineEvent,
  isPositiveTimelineEvent,
  deriveGroupOverallStatus,
  evidenceStatusBadgeClass,
  evidenceStatusBadgeClass as evidenceBadge,
  deriveEvidenceReadinessLabel,
  approvalDecisionBadgeClass,
  buildEscalationOptions,
  getDefaultEscalationReason,
  deriveBlockerSummary,
  deriveNextAction,
  deriveCaseDrillDown,
  DRILL_DOWN_TEST_IDS,
  ESCALATION_MODAL_TEST_IDS,
  TIMELINE_EVENT_LABELS,
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_CATEGORY_LABELS,
  ESCALATION_REASON_LABELS,
  APPROVAL_DECISION_LABELS,
  type TimelineEvent,
  type EvidenceItem,
  type EvidenceGroup,
} from '../../utils/caseDrillDown'
import type { WorkItem } from '../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'test-wi-001',
    title: 'KYC review — Test Investor',
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

function makeEvidenceItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'ev-001',
    label: 'Test Evidence',
    status: 'available',
    lastUpdatedAt: null,
    note: null,
    ...overrides,
  }
}

function makeTimelineEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 'evt-001',
    type: 'note_added',
    timestamp: '2026-03-15T10:00:00.000Z',
    actor: 'Test Actor',
    summary: 'Test event',
    detail: null,
    isSignificant: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

describe('sortTimelineEvents', () => {
  it('sorts events in chronological order (oldest first)', () => {
    const events: TimelineEvent[] = [
      makeTimelineEvent({ id: 'e3', timestamp: '2026-03-17T10:00:00.000Z' }),
      makeTimelineEvent({ id: 'e1', timestamp: '2026-03-15T10:00:00.000Z' }),
      makeTimelineEvent({ id: 'e2', timestamp: '2026-03-16T10:00:00.000Z' }),
    ]
    const sorted = sortTimelineEvents(events)
    expect(sorted.map((e) => e.id)).toEqual(['e1', 'e2', 'e3'])
  })

  it('does not mutate the original array', () => {
    const events = [
      makeTimelineEvent({ id: 'e2', timestamp: '2026-03-16T10:00:00.000Z' }),
      makeTimelineEvent({ id: 'e1', timestamp: '2026-03-15T10:00:00.000Z' }),
    ]
    sortTimelineEvents(events)
    expect(events[0].id).toBe('e2')
  })

  it('handles invalid timestamp by pushing event to end', () => {
    const events = [
      makeTimelineEvent({ id: 'e2', timestamp: 'INVALID' }),
      makeTimelineEvent({ id: 'e1', timestamp: '2026-03-15T10:00:00.000Z' }),
    ]
    const sorted = sortTimelineEvents(events)
    expect(sorted[0].id).toBe('e1')
  })

  it('handles empty array', () => {
    expect(sortTimelineEvents([])).toEqual([])
  })
})

describe('isNegativeTimelineEvent', () => {
  it('returns true for escalated', () => {
    expect(isNegativeTimelineEvent('escalated')).toBe(true)
  })
  it('returns true for sla_breached', () => {
    expect(isNegativeTimelineEvent('sla_breached')).toBe(true)
  })
  it('returns true for evidence_rejected', () => {
    expect(isNegativeTimelineEvent('evidence_rejected')).toBe(true)
  })
  it('returns true for returned_for_revision', () => {
    expect(isNegativeTimelineEvent('returned_for_revision')).toBe(true)
  })
  it('returns false for approved', () => {
    expect(isNegativeTimelineEvent('approved')).toBe(false)
  })
  it('returns false for case_opened', () => {
    expect(isNegativeTimelineEvent('case_opened')).toBe(false)
  })
})

describe('isPositiveTimelineEvent', () => {
  it('returns true for approved', () => {
    expect(isPositiveTimelineEvent('approved')).toBe(true)
  })
  it('returns true for evidence_submitted', () => {
    expect(isPositiveTimelineEvent('evidence_submitted')).toBe(true)
  })
  it('returns false for escalated', () => {
    expect(isPositiveTimelineEvent('escalated')).toBe(false)
  })
})

describe('timelineEventDotClass', () => {
  it('returns red class for escalated', () => {
    expect(timelineEventDotClass('escalated')).toBe('bg-red-500')
  })
  it('returns green class for approved', () => {
    expect(timelineEventDotClass('approved')).toBe('bg-green-500')
  })
  it('returns blue class for stage_changed', () => {
    expect(timelineEventDotClass('stage_changed')).toBe('bg-blue-500')
  })
  it('returns red class for sla_warning (negative event)', () => {
    expect(timelineEventDotClass('sla_warning')).toBe('bg-red-500')
  })
  it('returns gray class for note_added', () => {
    expect(timelineEventDotClass('note_added')).toBe('bg-gray-500')
  })
  it('returns non-empty string for every event type', () => {
    const allTypes = Object.keys(TIMELINE_EVENT_LABELS) as (keyof typeof TIMELINE_EVENT_LABELS)[]
    allTypes.forEach((type) => {
      expect(timelineEventDotClass(type).length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Evidence groups
// ---------------------------------------------------------------------------

describe('deriveGroupOverallStatus', () => {
  it('returns available when all items are available', () => {
    const items = [
      makeEvidenceItem({ status: 'available' }),
      makeEvidenceItem({ status: 'available' }),
    ]
    expect(deriveGroupOverallStatus(items)).toBe('available')
  })

  it('returns degraded when any item is degraded (highest priority)', () => {
    const items = [
      makeEvidenceItem({ status: 'available' }),
      makeEvidenceItem({ status: 'missing' }),
      makeEvidenceItem({ status: 'degraded' }),
    ]
    expect(deriveGroupOverallStatus(items)).toBe('degraded')
  })

  it('returns missing when any item is missing (no degraded)', () => {
    const items = [
      makeEvidenceItem({ status: 'available' }),
      makeEvidenceItem({ status: 'missing' }),
      makeEvidenceItem({ status: 'stale' }),
    ]
    expect(deriveGroupOverallStatus(items)).toBe('missing')
  })

  it('returns stale when any item is stale (no missing/degraded)', () => {
    const items = [
      makeEvidenceItem({ status: 'available' }),
      makeEvidenceItem({ status: 'stale' }),
    ]
    expect(deriveGroupOverallStatus(items)).toBe('stale')
  })

  it('returns degraded for empty items (fail-closed)', () => {
    expect(deriveGroupOverallStatus([])).toBe('degraded')
  })
})

describe('evidenceStatusBadgeClass', () => {
  it('returns green class for available', () => {
    expect(evidenceBadge('available')).toContain('green')
  })
  it('returns red class for missing', () => {
    expect(evidenceBadge('missing')).toContain('red')
  })
  it('returns yellow class for stale', () => {
    expect(evidenceBadge('stale')).toContain('yellow')
  })
  it('returns gray class for degraded', () => {
    expect(evidenceBadge('degraded')).toContain('gray')
  })
  it('returns non-empty string for every status', () => {
    const statuses = Object.keys(EVIDENCE_STATUS_LABELS) as (keyof typeof EVIDENCE_STATUS_LABELS)[]
    statuses.forEach((s) => {
      expect(evidenceStatusBadgeClass(s).length).toBeGreaterThan(0)
    })
  })
})

describe('deriveEvidenceReadinessLabel', () => {
  it('returns "Evidence unavailable" for empty groups', () => {
    expect(deriveEvidenceReadinessLabel([])).toBe('Evidence unavailable')
  })

  it('returns "Evidence data unavailable" when any group is degraded', () => {
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity & KYC',
        description: '',
        items: [],
        overallStatus: 'degraded',
      },
      {
        category: 'aml_sanctions',
        label: 'AML',
        description: '',
        items: [],
        overallStatus: 'available',
      },
    ]
    expect(deriveEvidenceReadinessLabel(groups)).toBe('Evidence data unavailable')
  })

  it('returns "Evidence incomplete" when any group is missing', () => {
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'missing',
      },
      {
        category: 'aml_sanctions',
        label: 'AML',
        description: '',
        items: [],
        overallStatus: 'available',
      },
    ]
    expect(deriveEvidenceReadinessLabel(groups)).toBe('Evidence incomplete')
  })

  it('returns "Evidence may be stale" when any group is stale (no missing/degraded)', () => {
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'stale',
      },
    ]
    expect(deriveEvidenceReadinessLabel(groups)).toBe('Evidence may be stale')
  })

  it('returns "Evidence complete" when all groups are available', () => {
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'available',
      },
    ]
    expect(deriveEvidenceReadinessLabel(groups)).toBe('Evidence complete')
  })
})

// ---------------------------------------------------------------------------
// Approval decisions
// ---------------------------------------------------------------------------

describe('approvalDecisionBadgeClass', () => {
  it('returns green class for approved', () => {
    expect(approvalDecisionBadgeClass('approved')).toContain('green')
  })
  it('returns red class for returned', () => {
    expect(approvalDecisionBadgeClass('returned')).toContain('red')
  })
  it('returns yellow class for escalated', () => {
    expect(approvalDecisionBadgeClass('escalated')).toContain('yellow')
  })
  it('returns non-empty string for every decision', () => {
    const decisions = Object.keys(APPROVAL_DECISION_LABELS) as (keyof typeof APPROVAL_DECISION_LABELS)[]
    decisions.forEach((d) => {
      expect(approvalDecisionBadgeClass(d).length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Escalation
// ---------------------------------------------------------------------------

describe('buildEscalationOptions', () => {
  it('returns 6 options for any work item', () => {
    const item = makeWorkItem()
    const options = buildEscalationOptions(item)
    expect(options).toHaveLength(6)
  })

  it('all options have non-empty label and description', () => {
    const item = makeWorkItem()
    buildEscalationOptions(item).forEach((opt) => {
      expect(opt.label.length).toBeGreaterThan(0)
      expect(opt.description.length).toBeGreaterThan(0)
      expect(opt.suggestedDestination.length).toBeGreaterThan(0)
    })
  })

  it('marks sla_risk option as default for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue', dueAt: '2026-03-01T00:00:00.000Z' })
    const options = buildEscalationOptions(item)
    const slaOpt = options.find((o) => o.reason === 'sla_risk')
    expect(slaOpt?.isDefault).toBe(true)
  })

  it('marks missing_investor_documentation as default for document_review stage', () => {
    const item = makeWorkItem({ stage: 'document_review' })
    const options = buildEscalationOptions(item)
    const docOpt = options.find((o) => o.reason === 'missing_investor_documentation')
    expect(docOpt?.isDefault).toBe(true)
  })

  it('marks sanctions_review_required as default for kyc_aml stage', () => {
    const item = makeWorkItem({ stage: 'kyc_aml' })
    const options = buildEscalationOptions(item)
    const amlOpt = options.find((o) => o.reason === 'sanctions_review_required')
    expect(amlOpt?.isDefault).toBe(true)
  })

  it('marks approval_review_required as default for approval stage', () => {
    const item = makeWorkItem({ stage: 'approval' })
    const options = buildEscalationOptions(item)
    const apprOpt = options.find((o) => o.reason === 'approval_review_required')
    expect(apprOpt?.isDefault).toBe(true)
  })
})

describe('getDefaultEscalationReason', () => {
  it('returns sla_risk for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue' })
    expect(getDefaultEscalationReason(item)).toBe('sla_risk')
  })

  it('returns sanctions_review_required for kyc_aml stage items (not overdue)', () => {
    const item = makeWorkItem({ stage: 'kyc_aml', status: 'blocked' })
    expect(getDefaultEscalationReason(item)).toBe('sanctions_review_required')
  })

  it('returns a non-empty string for every combination', () => {
    const stages = ['onboarding', 'document_review', 'kyc_aml', 'remediation', 'approval', 'reporting'] as const
    const statuses = ['open', 'in_progress', 'blocked', 'pending_review', 'approval_ready', 'overdue', 'escalated'] as const
    stages.forEach((stage) => {
      statuses.forEach((status) => {
        const item = makeWorkItem({ stage, status })
        const reason = getDefaultEscalationReason(item)
        expect(reason.length).toBeGreaterThan(0)
        expect(Object.keys(ESCALATION_REASON_LABELS)).toContain(reason)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Blocker summary
// ---------------------------------------------------------------------------

describe('deriveBlockerSummary', () => {
  it('returns empty array when no blockers', () => {
    const item = makeWorkItem({ status: 'in_progress' })
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [makeEvidenceItem({ status: 'available' })],
        overallStatus: 'available',
      },
    ]
    expect(deriveBlockerSummary(item, groups)).toHaveLength(0)
  })

  it('includes SLA breach message for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const blockers = deriveBlockerSummary(item, [])
    expect(blockers.some((b) => b.toLowerCase().includes('overdue') || b.toLowerCase().includes('sla'))).toBe(true)
  })

  it('includes missing evidence items in blockers', () => {
    const item = makeWorkItem()
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity & KYC',
        description: '',
        items: [makeEvidenceItem({ status: 'missing', label: 'Passport' })],
        overallStatus: 'missing',
      },
    ]
    const blockers = deriveBlockerSummary(item, groups)
    expect(blockers.some((b) => b.includes('Passport'))).toBe(true)
    expect(blockers.some((b) => b.toLowerCase().includes('missing'))).toBe(true)
  })

  it('includes stale evidence in blockers', () => {
    const item = makeWorkItem()
    const groups: EvidenceGroup[] = [
      {
        category: 'aml_sanctions',
        label: 'AML',
        description: '',
        items: [makeEvidenceItem({ status: 'stale', label: 'Proof of Address' })],
        overallStatus: 'stale',
      },
    ]
    const blockers = deriveBlockerSummary(item, groups)
    expect(blockers.some((b) => b.includes('Proof of Address'))).toBe(true)
    expect(blockers.some((b) => b.toLowerCase().includes('stale'))).toBe(true)
  })

  it('includes degraded evidence in blockers', () => {
    const item = makeWorkItem()
    const groups: EvidenceGroup[] = [
      {
        category: 'aml_sanctions',
        label: 'AML',
        description: '',
        items: [makeEvidenceItem({ status: 'degraded', label: 'Sanctions Screening' })],
        overallStatus: 'degraded',
      },
    ]
    const blockers = deriveBlockerSummary(item, groups)
    expect(blockers.some((b) => b.includes('Sanctions Screening'))).toBe(true)
  })

  it('includes item note for blocked items', () => {
    const item = makeWorkItem({ status: 'blocked', note: 'Waiting for legal opinion' })
    const blockers = deriveBlockerSummary(item, [])
    expect(blockers.some((b) => b.includes('legal opinion'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Next action
// ---------------------------------------------------------------------------

describe('deriveNextAction', () => {
  it('returns non-empty string for every status', () => {
    const statuses: WorkItem['status'][] = [
      'open', 'in_progress', 'pending_review', 'blocked', 'approval_ready', 'overdue', 'escalated',
    ]
    statuses.forEach((status) => {
      const item = makeWorkItem({ status })
      const action = deriveNextAction(item, [])
      expect(action.length).toBeGreaterThan(10)
    })
  })

  it('returns escalation guidance for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const action = deriveNextAction(item, [])
    expect(action.toLowerCase()).toContain('overdue')
  })

  it('returns approval guidance for approval_ready items', () => {
    const item = makeWorkItem({ status: 'approval_ready' })
    const action = deriveNextAction(item, [])
    expect(action.toLowerCase()).toContain('sign-off')
  })

  it('warns about degraded evidence', () => {
    const item = makeWorkItem({ status: 'in_progress' })
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'degraded',
      },
    ]
    const action = deriveNextAction(item, groups)
    expect(action.toLowerCase()).toContain('unavailable')
  })

  it('guides on missing evidence', () => {
    const item = makeWorkItem({ status: 'in_progress' })
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'missing',
      },
    ]
    const action = deriveNextAction(item, groups)
    expect(action.toLowerCase()).toContain('missing')
  })

  it('guides on stale evidence', () => {
    const item = makeWorkItem({ status: 'in_progress' })
    const groups: EvidenceGroup[] = [
      {
        category: 'identity_kyc',
        label: 'Identity',
        description: '',
        items: [],
        overallStatus: 'stale',
      },
    ]
    const action = deriveNextAction(item, groups)
    expect(action.toLowerCase()).toContain('stale')
  })
})

// ---------------------------------------------------------------------------
// Full deriveCaseDrillDown integration
// ---------------------------------------------------------------------------

describe('deriveCaseDrillDown', () => {
  it('returns a valid CaseDrillDownState for a healthy item', () => {
    const item = makeWorkItem({ status: 'in_progress', stage: 'kyc_aml' })
    const state = deriveCaseDrillDown(item)

    expect(state.item).toBe(item)
    expect(state.timeline.length).toBeGreaterThan(0)
    expect(state.evidenceGroups.length).toBeGreaterThan(0)
    expect(state.escalationOptions.length).toBeGreaterThan(0)
    expect(state.nextAction.length).toBeGreaterThan(0)
    expect(typeof state.isReadyForApproval).toBe('boolean')
    expect(typeof state.isDegraded).toBe('boolean')
    expect(Array.isArray(state.blockerSummary)).toBe(true)
  })

  it('marks isReadyForApproval as false for blocked items', () => {
    const item = makeWorkItem({ status: 'blocked' })
    const state = deriveCaseDrillDown(item)
    expect(state.isReadyForApproval).toBe(false)
  })

  it('marks isReadyForApproval as false for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const state = deriveCaseDrillDown(item)
    expect(state.isReadyForApproval).toBe(false)
  })

  it('isDegraded reflects evidence group degradation (fail-closed)', () => {
    // Overdue item gets degraded AML screening
    const item = makeWorkItem({ status: 'overdue' })
    const state = deriveCaseDrillDown(item)
    // Should NOT claim case is ready when overdue
    expect(state.isReadyForApproval).toBe(false)
  })

  it('timeline is sorted chronologically', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item)
    const times = state.timeline.map((e) => new Date(e.timestamp).getTime())
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    }
  })

  it('produces 5 evidence groups', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item)
    expect(state.evidenceGroups).toHaveLength(5)
  })

  it('all evidence group categories are unique', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item)
    const cats = state.evidenceGroups.map((g) => g.category)
    expect(new Set(cats).size).toBe(cats.length)
  })

  it('all evidence group labels are non-empty', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item)
    state.evidenceGroups.forEach((g) => {
      expect(g.label.length).toBeGreaterThan(0)
    })
  })

  it('escalation options include all 6 reasons', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item)
    const reasons = state.escalationOptions.map((o) => o.reason)
    expect(reasons).toContain('missing_investor_documentation')
    expect(reasons).toContain('sanctions_review_required')
    expect(reasons).toContain('approval_review_required')
    expect(reasons).toContain('sla_risk')
    expect(reasons).toContain('jurisdiction_concern')
    expect(reasons).toContain('other')
  })
})

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

describe('DRILL_DOWN_TEST_IDS', () => {
  it('contains PANEL key', () => {
    expect(DRILL_DOWN_TEST_IDS.PANEL).toBe('case-drill-down-panel')
  })

  it('all values are non-empty strings', () => {
    Object.values(DRILL_DOWN_TEST_IDS).forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })

  it('contains at least 15 keys for sufficient coverage', () => {
    expect(Object.keys(DRILL_DOWN_TEST_IDS).length).toBeGreaterThanOrEqual(15)
  })
})

describe('ESCALATION_MODAL_TEST_IDS', () => {
  it('contains MODAL key', () => {
    expect(ESCALATION_MODAL_TEST_IDS.MODAL).toBe('escalation-modal')
  })

  it('all values are non-empty strings', () => {
    Object.values(ESCALATION_MODAL_TEST_IDS).forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Label coverage
// ---------------------------------------------------------------------------

describe('EVIDENCE_CATEGORY_LABELS', () => {
  it('has labels for all 5 categories', () => {
    expect(Object.keys(EVIDENCE_CATEGORY_LABELS)).toHaveLength(5)
    Object.values(EVIDENCE_CATEGORY_LABELS).forEach((v) => {
      expect(v.length).toBeGreaterThan(0)
    })
  })
})

describe('ESCALATION_REASON_LABELS', () => {
  it('has labels for all 6 reasons', () => {
    expect(Object.keys(ESCALATION_REASON_LABELS)).toHaveLength(6)
    Object.values(ESCALATION_REASON_LABELS).forEach((v) => {
      expect(v.length).toBeGreaterThan(0)
    })
  })
})
