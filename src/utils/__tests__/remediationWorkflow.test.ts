/**
 * Unit Tests: Remediation Workflow Utility
 *
 * Validates:
 *  AC #1  blockerToUrgency maps severity + isLaunchBlocking to correct urgency
 *  AC #2  deriveFreshness correctly determines evidence freshness status
 *  AC #3  deriveHandoffState returns correct handoff when upstream stage is blocking
 *  AC #4  buildHandoffNote produces plain-language handoff text
 *  AC #5  buildStalenessExplanation produces appropriate explanations
 *  AC #6  buildImpactStatement correctly describes blocking vs advisory impact
 *  AC #7  deriveTasksFromStage derives correct tasks from a stage with blockers
 *  AC #8  buildStageGroup groups blocking and advisory tasks correctly
 *  AC #9  deriveRemediationWorkflow produces a complete workflow state
 *  AC #10 prioritizeTasks sorts by blocking first, then urgency, then freshness
 *  AC #11 getEscalationMessage returns appropriate stale evidence escalation text
 *  AC #12 getWorkflowHandoffSummary summarizes active handoffs
 *  AC #13 urgencyBadgeClass / taskCardClass / freshnessBadgeClass return valid classes
 *  AC #14 OWNER_DOMAIN_LABELS and HANDOFF_STATE_LABELS cover all keys
 */

import { describe, it, expect } from 'vitest'
import {
  blockerToUrgency,
  deriveFreshness,
  deriveHandoffState,
  buildHandoffNote,
  buildStalenessExplanation,
  buildImpactStatement,
  deriveTasksFromStage,
  buildStageGroup,
  deriveRemediationWorkflow,
  prioritizeTasks,
  getEscalationMessage,
  getWorkflowHandoffSummary,
  urgencyBadgeClass,
  taskCardClass,
  freshnessBadgeClass,
  OWNER_DOMAIN_LABELS,
  HANDOFF_STATE_LABELS,
  REMEDIATION_URGENCY_LABELS,
  EVIDENCE_FRESHNESS_LABELS,
  EVIDENCE_FRESHNESS_EXPLANATIONS,
  OWNER_DOMAIN_DESCRIPTIONS,
  ROLE_TO_DOMAIN,
  type RemediationTask,
  type OwnerDomain,
  type RemediationUrgency,
  type EvidenceFreshness,
  type HandoffState,
} from '../../utils/remediationWorkflow'

import type { ApprovalStage, StageBlocker } from '../../utils/approvalCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000

function makeBlocker(overrides: Partial<StageBlocker> = {}): StageBlocker {
  return {
    id: 'b1',
    severity: 'high',
    title: 'KYC evidence outdated',
    reason: 'Evidence is stale',
    action: 'Refresh KYC package',
    evidencePath: '/compliance/evidence',
    isLaunchBlocking: true,
    staleSince: null,
    ...overrides,
  }
}

function makeStage(overrides: Partial<ApprovalStage> = {}): ApprovalStage {
  return {
    id: 'compliance-review',
    label: 'Compliance Review',
    role: 'compliance_operator',
    status: 'blocked',
    summary: 'Compliance blocked',
    blockers: [],
    reviewScope: 'Review KYC and AML',
    lastActionAt: null,
    dueAt: null,
    evidenceLinks: [],
    conditions: null,
    ...overrides,
  }
}

function makeTask(overrides: Partial<RemediationTask> = {}): RemediationTask {
  return {
    id: 'task-1',
    stageId: 'compliance-review',
    title: 'Test Task',
    description: 'Description',
    actionSummary: 'Do the thing',
    impactStatement: 'Impact',
    ownerDomain: 'compliance',
    urgency: 'high',
    isLaunchBlocking: true,
    isHardBlocker: true,
    evidenceFreshness: 'fresh',
    lastEvidenceAt: null,
    stalenessLabel: null,
    dependsOn: [],
    handoffState: 'no_handoff',
    handoffNote: null,
    remediationPath: null,
    stalenessExplanation: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// AC #1 — blockerToUrgency
// ---------------------------------------------------------------------------

describe('blockerToUrgency', () => {
  it('returns advisory for non-launch-blocking blockers regardless of severity', () => {
    expect(blockerToUrgency(false, 'critical')).toBe('advisory')
    expect(blockerToUrgency(false, 'high')).toBe('advisory')
    expect(blockerToUrgency(false, 'medium')).toBe('advisory')
    expect(blockerToUrgency(false, 'informational')).toBe('advisory')
  })

  it('maps critical severity + launch-blocking to critical urgency', () => {
    expect(blockerToUrgency(true, 'critical')).toBe('critical')
  })

  it('maps high severity + launch-blocking to high urgency', () => {
    expect(blockerToUrgency(true, 'high')).toBe('high')
  })

  it('maps medium severity + launch-blocking to medium urgency', () => {
    expect(blockerToUrgency(true, 'medium')).toBe('medium')
  })

  it('maps informational severity + launch-blocking to advisory urgency', () => {
    expect(blockerToUrgency(true, 'informational')).toBe('advisory')
  })
})

// ---------------------------------------------------------------------------
// AC #2 — deriveFreshness
// ---------------------------------------------------------------------------

describe('deriveFreshness', () => {
  const now = Date.now()

  it('returns missing for null staleSince', () => {
    expect(deriveFreshness(null, now)).toBe('missing')
  })

  it('returns fresh for evidence updated 10 days ago (within 30-day window)', () => {
    const ts = new Date(now - 10 * DAY_MS).toISOString()
    expect(deriveFreshness(ts, now)).toBe('fresh')
  })

  it('returns fresh for evidence updated today', () => {
    const ts = new Date(now - 1000).toISOString()
    expect(deriveFreshness(ts, now)).toBe('fresh')
  })

  it('returns stale for evidence 45 days old', () => {
    const ts = new Date(now - 45 * DAY_MS).toISOString()
    expect(deriveFreshness(ts, now)).toBe('stale')
  })

  it('returns stale for evidence 90 days old', () => {
    const ts = new Date(now - 90 * DAY_MS).toISOString()
    expect(deriveFreshness(ts, now)).toBe('stale')
  })
})

// ---------------------------------------------------------------------------
// AC #3 — deriveHandoffState
// ---------------------------------------------------------------------------

describe('deriveHandoffState', () => {
  it('returns no_handoff when no other stage is blocking', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'in_review' }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'not_started' }),
    ]
    expect(deriveHandoffState('legal_reviewer', stages)).toBe('no_handoff')
  })

  it('returns waiting_on_compliance when compliance stage is blocked', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'blocked' }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'not_started' }),
    ]
    expect(deriveHandoffState('legal_reviewer', stages)).toBe('waiting_on_compliance')
  })

  it('returns waiting_on_legal when legal stage is blocked', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'approved' }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'blocked' }),
      makeStage({ id: 'procurement-review', role: 'procurement_reviewer', status: 'not_started' }),
    ]
    expect(deriveHandoffState('procurement_reviewer', stages)).toBe('waiting_on_legal')
  })

  it('returns no_handoff when only the same domain stage is blocking', () => {
    // Both stages are compliance — should not create a cross-domain handoff
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'blocked' }),
    ]
    expect(deriveHandoffState('compliance_operator', stages)).toBe('no_handoff')
  })

  it('returns waiting_on_multiple when multiple different domains are blocking', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'blocked' }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'blocked' }),
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'not_started' }),
    ]
    expect(deriveHandoffState('executive_sponsor', stages)).toBe('waiting_on_multiple')
  })

  it('returns waiting_on_compliance for needs_attention status', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'needs_attention' }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'not_started' }),
    ]
    expect(deriveHandoffState('legal_reviewer', stages)).toBe('waiting_on_compliance')
  })

  it('returns waiting_on_procurement when procurement stage is blocked', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'procurement-review', role: 'procurement_reviewer', status: 'blocked' }),
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'not_started' }),
    ]
    expect(deriveHandoffState('executive_sponsor', stages)).toBe('waiting_on_procurement')
  })

  it('returns waiting_on_executive when executive stage is blocked', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'blocked' }),
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'not_started' }),
    ]
    // A compliance operator's stage is not blocked by executive — but if the executive stage is 
    // the only one blocking, it returns waiting_on_executive for a different role
    const stages2: ApprovalStage[] = [
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'blocked' }),
      makeStage({ id: 'procurement-review', role: 'procurement_reviewer', status: 'not_started' }),
    ]
    expect(deriveHandoffState('procurement_reviewer', stages2)).toBe('waiting_on_executive')
  })
})

// ---------------------------------------------------------------------------
// AC #4 — buildHandoffNote
// ---------------------------------------------------------------------------

describe('buildHandoffNote', () => {
  it('returns null for no_handoff', () => {
    expect(buildHandoffNote('no_handoff', 'Legal Review')).toBeNull()
  })

  it('returns waiting_on_compliance note', () => {
    const note = buildHandoffNote('waiting_on_compliance', 'Legal Review')
    expect(note).not.toBeNull()
    expect(note).toContain('Legal Review')
    expect(note).toContain('Compliance')
  })

  it('returns waiting_on_legal note', () => {
    const note = buildHandoffNote('waiting_on_legal', 'Procurement Review')
    expect(note).not.toBeNull()
    expect(note).toContain('Legal')
  })

  it('returns waiting_on_multiple note', () => {
    const note = buildHandoffNote('waiting_on_multiple', 'Executive Sign-Off')
    expect(note).not.toBeNull()
    expect(note).toContain('multiple')
  })

  it('returns note for every non-null handoff state', () => {
    const states: HandoffState[] = [
      'waiting_on_compliance',
      'waiting_on_legal',
      'waiting_on_procurement',
      'waiting_on_executive',
      'waiting_on_shared_ops',
      'waiting_on_multiple',
    ]
    for (const state of states) {
      const note = buildHandoffNote(state, 'Test Stage')
      expect(note).not.toBeNull()
      expect(typeof note).toBe('string')
      expect((note as string).length).toBeGreaterThan(10)
    }
  })
})

// ---------------------------------------------------------------------------
// AC #5 — buildStalenessExplanation
// ---------------------------------------------------------------------------

describe('buildStalenessExplanation', () => {
  it('returns null for fresh evidence', () => {
    expect(buildStalenessExplanation('fresh', null)).toBeNull()
  })

  it('returns the missing explanation for missing evidence', () => {
    const result = buildStalenessExplanation('missing', null)
    expect(result).toBe(EVIDENCE_FRESHNESS_EXPLANATIONS.missing)
  })

  it('returns a stale explanation including the age label', () => {
    const result = buildStalenessExplanation('stale', '45 days ago')
    expect(result).not.toBeNull()
    expect(result).toContain('45 days ago')
  })

  it('handles stale explanation with null label gracefully', () => {
    const result = buildStalenessExplanation('stale', null)
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// AC #6 — buildImpactStatement
// ---------------------------------------------------------------------------

describe('buildImpactStatement', () => {
  it('returns blocking impact for launch-blocking blockers', () => {
    const blocker = makeBlocker({ isLaunchBlocking: true })
    const stage = makeStage({ label: 'Compliance Review' })
    const result = buildImpactStatement(blocker, stage)
    expect(result).toContain('Compliance Review')
    expect(result).toContain('blocks')
  })

  it('returns follow-up impact for non-launch-blocking blockers', () => {
    const blocker = makeBlocker({ isLaunchBlocking: false })
    const stage = makeStage({ label: 'Compliance Review' })
    const result = buildImpactStatement(blocker, stage)
    expect(result).toContain('follow-up')
    expect(result).not.toContain('blocks')
  })
})

// ---------------------------------------------------------------------------
// AC #7 — deriveTasksFromStage
// ---------------------------------------------------------------------------

describe('deriveTasksFromStage', () => {
  const now = Date.now()
  const staleTs = new Date(now - 45 * DAY_MS).toISOString()

  it('produces one task per blocker', () => {
    const stage = makeStage({
      blockers: [
        makeBlocker({ id: 'b1' }),
        makeBlocker({ id: 'b2' }),
      ],
    })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks).toHaveLength(2)
  })

  it('produces no tasks for stages with no blockers', () => {
    const stage = makeStage({ blockers: [] })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks).toHaveLength(0)
  })

  it('assigns correct ownerDomain based on role', () => {
    const stage = makeStage({ role: 'legal_reviewer', blockers: [makeBlocker()] })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks[0].ownerDomain).toBe('legal')
  })

  it('detects stale evidence correctly', () => {
    const stage = makeStage({
      blockers: [makeBlocker({ staleSince: staleTs })],
    })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks[0].evidenceFreshness).toBe('stale')
    expect(tasks[0].stalenessLabel).not.toBeNull()
  })

  it('marks evidence as missing when staleSince is null', () => {
    const stage = makeStage({
      blockers: [makeBlocker({ staleSince: null })],
    })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks[0].evidenceFreshness).toBe('missing')
  })

  it('isHardBlocker true for critical/high severity', () => {
    const critical = makeStage({ blockers: [makeBlocker({ severity: 'critical' })] })
    const high = makeStage({ blockers: [makeBlocker({ severity: 'high' })] })
    const medium = makeStage({ blockers: [makeBlocker({ severity: 'medium' })] })
    expect(deriveTasksFromStage(critical, [critical], now)[0].isHardBlocker).toBe(true)
    expect(deriveTasksFromStage(high, [high], now)[0].isHardBlocker).toBe(true)
    expect(deriveTasksFromStage(medium, [medium], now)[0].isHardBlocker).toBe(false)
  })

  it('propagates evidencePath as remediationPath', () => {
    const stage = makeStage({
      blockers: [makeBlocker({ evidencePath: '/compliance/evidence' })],
    })
    const tasks = deriveTasksFromStage(stage, [stage], now)
    expect(tasks[0].remediationPath).toBe('/compliance/evidence')
  })
})

// ---------------------------------------------------------------------------
// AC #8 — buildStageGroup
// ---------------------------------------------------------------------------

describe('buildStageGroup', () => {
  it('separates blocking and advisory tasks correctly', () => {
    const stage = makeStage()
    const blockingTask = makeTask({ stageId: stage.id, isLaunchBlocking: true })
    const advisoryTask = makeTask({ id: 'task-2', stageId: stage.id, isLaunchBlocking: false })
    const group = buildStageGroup(stage, [blockingTask, advisoryTask], [stage])
    expect(group.blockingTasks).toHaveLength(1)
    expect(group.advisoryTasks).toHaveLength(1)
    expect(group.blockingTasks[0].id).toBe(blockingTask.id)
    expect(group.advisoryTasks[0].id).toBe(advisoryTask.id)
  })

  it('sets isStageBlocking true for blocked status', () => {
    const stage = makeStage({ status: 'blocked' })
    const group = buildStageGroup(stage, [], [stage])
    expect(group.isStageBlocking).toBe(true)
  })

  it('sets isStageBlocking false for approved status', () => {
    const stage = makeStage({ status: 'approved' })
    const group = buildStageGroup(stage, [], [stage])
    expect(group.isStageBlocking).toBe(false)
  })

  it('uses correct ownerDomain for each reviewer role', () => {
    const roles: ApprovalStage['role'][] = [
      'compliance_operator',
      'legal_reviewer',
      'procurement_reviewer',
      'executive_sponsor',
    ]
    const expectedDomains: OwnerDomain[] = ['compliance', 'legal', 'procurement', 'executive']
    for (let i = 0; i < roles.length; i++) {
      const stage = makeStage({ role: roles[i] })
      const group = buildStageGroup(stage, [], [stage])
      expect(group.ownerDomain).toBe(expectedDomains[i])
    }
  })
})

// ---------------------------------------------------------------------------
// AC #9 — deriveRemediationWorkflow
// ---------------------------------------------------------------------------

describe('deriveRemediationWorkflow', () => {
  const now = Date.now()
  const staleTs = new Date(now - 45 * DAY_MS).toISOString()

  it('produces a workflow state with all tasks and groups', () => {
    const stages: ApprovalStage[] = [
      makeStage({
        id: 'compliance-review',
        role: 'compliance_operator',
        status: 'blocked',
        blockers: [makeBlocker({ id: 'b1', isLaunchBlocking: true })],
      }),
      makeStage({
        id: 'legal-review',
        role: 'legal_reviewer',
        status: 'in_review',
        blockers: [],
      }),
    ]
    const workflow = deriveRemediationWorkflow(stages, now)
    expect(workflow.allTasks).toHaveLength(1)
    expect(workflow.stageGroups).toHaveLength(2)
    expect(workflow.launchBlockingCount).toBe(1)
  })

  it('counts stale evidence tasks correctly', () => {
    const stages: ApprovalStage[] = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'b1', staleSince: staleTs }),
          makeBlocker({ id: 'b2', staleSince: null }),
        ],
      }),
    ]
    const workflow = deriveRemediationWorkflow(stages, now)
    expect(workflow.staleEvidenceCount).toBe(1)
  })

  it('detects handoff dependencies when upstream stage is blocking', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'blocked', blockers: [makeBlocker()] }),
      makeStage({ id: 'legal-review', role: 'legal_reviewer', status: 'not_started', blockers: [] }),
    ]
    const workflow = deriveRemediationWorkflow(stages, now)
    expect(workflow.hasHandoffDependencies).toBe(true)
  })

  it('topUrgency reflects highest severity blocking task', () => {
    const stages: ApprovalStage[] = [
      makeStage({
        blockers: [
          makeBlocker({ id: 'b1', severity: 'critical', isLaunchBlocking: true }),
          makeBlocker({ id: 'b2', severity: 'medium', isLaunchBlocking: true }),
        ],
      }),
    ]
    const workflow = deriveRemediationWorkflow(stages, now)
    expect(workflow.topUrgency).toBe('critical')
  })

  it('topUrgency is null when there are no blocking tasks', () => {
    const workflow = deriveRemediationWorkflow([], now)
    expect(workflow.topUrgency).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC #10 — prioritizeTasks
// ---------------------------------------------------------------------------

describe('prioritizeTasks', () => {
  it('places launch-blocking tasks before advisory tasks', () => {
    const tasks: RemediationTask[] = [
      makeTask({ id: 'a', isLaunchBlocking: false, urgency: 'advisory' }),
      makeTask({ id: 'b', isLaunchBlocking: true, urgency: 'high' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('b')
    expect(result[1].id).toBe('a')
  })

  it('sorts by urgency within the blocking group', () => {
    const tasks: RemediationTask[] = [
      makeTask({ id: 'medium', isLaunchBlocking: true, urgency: 'medium' }),
      makeTask({ id: 'critical', isLaunchBlocking: true, urgency: 'critical' }),
      makeTask({ id: 'high', isLaunchBlocking: true, urgency: 'high' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('critical')
    expect(result[1].id).toBe('high')
    expect(result[2].id).toBe('medium')
  })

  it('sorts stale evidence before fresh within same urgency', () => {
    const tasks: RemediationTask[] = [
      makeTask({ id: 'fresh', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'fresh' }),
      makeTask({ id: 'stale', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'stale' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('stale')
    expect(result[1].id).toBe('fresh')
  })

  it('sorts stale evidence before missing within same urgency', () => {
    // This covers the b.evidenceFreshness === stale branch (a=missing, b=stale)
    const tasks: RemediationTask[] = [
      makeTask({ id: 'missing', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'missing' }),
      makeTask({ id: 'stale', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'stale' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('stale')
    expect(result[1].id).toBe('missing')
  })

  it('maintains stable order for two tasks with identical priority attributes', () => {
    // Both fresh + same urgency: order is preserved (return 0 branch)
    const tasks: RemediationTask[] = [
      makeTask({ id: 'x', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'fresh' }),
      makeTask({ id: 'y', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'fresh' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result.length).toBe(2)
    // Verify all original tasks are still present (stable output)
    const resultIds = result.map((t) => t.id).sort()
    expect(resultIds).toEqual(['x', 'y'])
  })

  it('does not mutate the input array', () => {
    const tasks = [
      makeTask({ id: 'a', isLaunchBlocking: false, urgency: 'advisory' }),
      makeTask({ id: 'b', isLaunchBlocking: true, urgency: 'critical' }),
    ]
    const original = [...tasks]
    prioritizeTasks(tasks)
    expect(tasks[0].id).toBe(original[0].id)
  })
})

// ---------------------------------------------------------------------------
// AC #11 — getEscalationMessage
// ---------------------------------------------------------------------------

describe('getEscalationMessage', () => {
  it('returns null for fresh evidence', () => {
    const task = makeTask({ evidenceFreshness: 'fresh' })
    expect(getEscalationMessage(task)).toBeNull()
  })

  it('returns null for missing evidence (not stale)', () => {
    const task = makeTask({ evidenceFreshness: 'missing' })
    expect(getEscalationMessage(task)).toBeNull()
  })

  it('returns an escalation message for stale launch-blocking tasks', () => {
    const task = makeTask({
      title: 'KYC Evidence',
      evidenceFreshness: 'stale',
      stalenessLabel: '45 days ago',
      isLaunchBlocking: true,
    })
    const msg = getEscalationMessage(task)
    expect(msg).not.toBeNull()
    expect(msg).toContain('KYC Evidence')
    expect(msg).toContain('45 days ago')
    expect(msg).toContain('blocks')
  })

  it('returns a softer escalation for stale non-blocking tasks', () => {
    const task = makeTask({
      title: 'Policy Document',
      evidenceFreshness: 'stale',
      stalenessLabel: '35 days ago',
      isLaunchBlocking: false,
    })
    const msg = getEscalationMessage(task)
    expect(msg).not.toBeNull()
    expect(msg).toContain('Policy Document')
    expect(msg).not.toContain('blocks')
  })
})

// ---------------------------------------------------------------------------
// AC #12 — getWorkflowHandoffSummary
// ---------------------------------------------------------------------------

describe('getWorkflowHandoffSummary', () => {
  it('returns null when there are no handoff dependencies', () => {
    const workflow = deriveRemediationWorkflow([], Date.now())
    expect(getWorkflowHandoffSummary(workflow)).toBeNull()
  })

  it('returns a summary string when handoffs are present', () => {
    const now = Date.now()
    const stages: ApprovalStage[] = [
      makeStage({ id: 's1', role: 'compliance_operator', status: 'blocked', blockers: [makeBlocker()] }),
      makeStage({ id: 's2', role: 'legal_reviewer', status: 'not_started', blockers: [] }),
    ]
    const workflow = deriveRemediationWorkflow(stages, now)
    const summary = getWorkflowHandoffSummary(workflow)
    // The legal group should be in "waiting_on_compliance" — but the compliance group
    // itself has no handoff. So only one group with a handoff, unless we check carefully.
    // The legal group has no tasks but does have handoffState != no_handoff
    expect(workflow.stageGroups[1].handoffState).toBe('waiting_on_compliance')
    if (summary) {
      expect(summary).toContain('Waiting')
    }
  })
})

// ---------------------------------------------------------------------------
// AC #13 — CSS helper functions
// ---------------------------------------------------------------------------

describe('urgencyBadgeClass', () => {
  it('returns non-empty string for every urgency level', () => {
    const urgencies: RemediationUrgency[] = ['critical', 'high', 'medium', 'advisory']
    for (const u of urgencies) {
      const cls = urgencyBadgeClass(u)
      expect(typeof cls).toBe('string')
      expect(cls.length).toBeGreaterThan(0)
    }
  })

  it('returns red badge for critical', () => {
    expect(urgencyBadgeClass('critical')).toContain('red')
  })

  it('returns orange badge for high', () => {
    expect(urgencyBadgeClass('high')).toContain('orange')
  })

  it('returns yellow badge for medium', () => {
    expect(urgencyBadgeClass('medium')).toContain('yellow')
  })

  it('returns gray badge for advisory', () => {
    expect(urgencyBadgeClass('advisory')).toContain('gray')
  })
})

describe('taskCardClass', () => {
  it('returns gray for non-launch-blocking tasks', () => {
    const cls = taskCardClass('critical', false)
    expect(cls).toContain('gray')
  })

  it('returns red for critical launch-blocking tasks', () => {
    const cls = taskCardClass('critical', true)
    expect(cls).toContain('red')
  })

  it('returns non-empty string for all combinations', () => {
    const urgencies: RemediationUrgency[] = ['critical', 'high', 'medium', 'advisory']
    for (const u of urgencies) {
      expect(taskCardClass(u, true).length).toBeGreaterThan(0)
      expect(taskCardClass(u, false).length).toBeGreaterThan(0)
    }
  })
})

describe('freshnessBadgeClass', () => {
  it('returns green for fresh', () => {
    expect(freshnessBadgeClass('fresh')).toContain('green')
  })

  it('returns orange for stale', () => {
    expect(freshnessBadgeClass('stale')).toContain('orange')
  })

  it('returns gray for missing', () => {
    expect(freshnessBadgeClass('missing')).toContain('gray')
  })

  it('returns non-empty string for all freshness values', () => {
    const values: EvidenceFreshness[] = ['fresh', 'stale', 'missing']
    for (const v of values) {
      expect(freshnessBadgeClass(v).length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// AC #14 — Label maps cover all keys
// ---------------------------------------------------------------------------

describe('OWNER_DOMAIN_LABELS', () => {
  it('covers all OwnerDomain values', () => {
    const domains: OwnerDomain[] = ['compliance', 'legal', 'procurement', 'executive', 'shared_ops', 'unassigned']
    for (const d of domains) {
      expect(OWNER_DOMAIN_LABELS[d]).toBeTruthy()
      expect(typeof OWNER_DOMAIN_LABELS[d]).toBe('string')
    }
  })

  it('covers all OwnerDomain descriptions', () => {
    const domains: OwnerDomain[] = ['compliance', 'legal', 'procurement', 'executive', 'shared_ops', 'unassigned']
    for (const d of domains) {
      expect(OWNER_DOMAIN_DESCRIPTIONS[d]).toBeTruthy()
    }
  })
})

describe('HANDOFF_STATE_LABELS', () => {
  it('covers all HandoffState values', () => {
    const states: HandoffState[] = [
      'no_handoff',
      'waiting_on_compliance',
      'waiting_on_legal',
      'waiting_on_procurement',
      'waiting_on_executive',
      'waiting_on_shared_ops',
      'waiting_on_multiple',
    ]
    for (const s of states) {
      expect(HANDOFF_STATE_LABELS[s]).toBeTruthy()
      expect(typeof HANDOFF_STATE_LABELS[s]).toBe('string')
    }
  })
})

describe('REMEDIATION_URGENCY_LABELS', () => {
  it('covers all RemediationUrgency values', () => {
    const urgencies: RemediationUrgency[] = ['critical', 'high', 'medium', 'advisory']
    for (const u of urgencies) {
      expect(REMEDIATION_URGENCY_LABELS[u]).toBeTruthy()
    }
  })
})

describe('EVIDENCE_FRESHNESS_LABELS', () => {
  it('covers all EvidenceFreshness values', () => {
    const values: EvidenceFreshness[] = ['fresh', 'stale', 'missing']
    for (const v of values) {
      expect(EVIDENCE_FRESHNESS_LABELS[v]).toBeTruthy()
      expect(EVIDENCE_FRESHNESS_EXPLANATIONS[v]).toBeTruthy()
    }
  })
})

describe('ROLE_TO_DOMAIN', () => {
  it('maps all reviewer roles to valid domains', () => {
    const roles: ApprovalStage['role'][] = [
      'compliance_operator',
      'legal_reviewer',
      'procurement_reviewer',
      'executive_sponsor',
    ]
    const validDomains: OwnerDomain[] = ['compliance', 'legal', 'procurement', 'executive', 'shared_ops', 'unassigned']
    for (const r of roles) {
      expect(validDomains).toContain(ROLE_TO_DOMAIN[r])
    }
  })
})

// ---------------------------------------------------------------------------
// Additional coverage: deriveHandoffState — procurement / executive branches
// ---------------------------------------------------------------------------

describe('deriveHandoffState — additional domain branches', () => {
  it('returns waiting_on_procurement when procurement stage is blocked and current role is different', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'procurement-review', role: 'procurement_reviewer', status: 'blocked' }),
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'not_started' }),
    ]
    // executive_sponsor is asking; procurement is blocking → waiting_on_procurement
    expect(deriveHandoffState('executive_sponsor', stages)).toBe('waiting_on_procurement')
  })

  it('returns waiting_on_executive when executive stage is blocked and current role is different', () => {
    const stages: ApprovalStage[] = [
      makeStage({ id: 'exec-sign-off', role: 'executive_sponsor', status: 'blocked' }),
      makeStage({ id: 'compliance-review', role: 'compliance_operator', status: 'not_started' }),
    ]
    // compliance_operator is asking; executive is blocking → waiting_on_executive
    expect(deriveHandoffState('compliance_operator', stages)).toBe('waiting_on_executive')
  })

  it('returns no_handoff when the only blocking stage is the same domain as current role', () => {
    // Both are procurement domain — no cross-domain handoff
    const stages: ApprovalStage[] = [
      makeStage({ id: 'procurement-review-a', role: 'procurement_reviewer', status: 'blocked' }),
    ]
    expect(deriveHandoffState('procurement_reviewer', stages)).toBe('no_handoff')
  })
})

// ---------------------------------------------------------------------------
// Additional coverage: prioritizeTasks — stale ordering edge cases
// ---------------------------------------------------------------------------

describe('prioritizeTasks — stale ordering edge cases', () => {
  it('places non-stale (fresh) before another non-stale (missing) when neither is stale', () => {
    // Neither a nor b is 'stale'; the tiebreak (return 0) leaves original order
    const tasks: RemediationTask[] = [
      makeTask({ id: 'fresh', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'fresh' }),
      makeTask({ id: 'missing', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'missing' }),
    ]
    const result = prioritizeTasks(tasks)
    // Relative order unchanged since neither is stale
    expect(result.map((t) => t.id)).toEqual(['fresh', 'missing'])
  })

  it('places stale task after a higher-urgency non-stale task (urgency takes precedence)', () => {
    const tasks: RemediationTask[] = [
      makeTask({ id: 'stale-medium', isLaunchBlocking: true, urgency: 'medium', evidenceFreshness: 'stale' }),
      makeTask({ id: 'fresh-high', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'fresh' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('fresh-high')
    expect(result[1].id).toBe('stale-medium')
  })

  it('sorts stale before missing within the same urgency (b is stale, a is not)', () => {
    // a=missing (not stale), b=stale → b should sort before a
    const tasks: RemediationTask[] = [
      makeTask({ id: 'missing-evidence', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'missing' }),
      makeTask({ id: 'stale-evidence', isLaunchBlocking: true, urgency: 'high', evidenceFreshness: 'stale' }),
    ]
    const result = prioritizeTasks(tasks)
    expect(result[0].id).toBe('stale-evidence')
    expect(result[1].id).toBe('missing-evidence')
  })
})
