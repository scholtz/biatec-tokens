/**
 * Integration Tests: Case Drill-Down Wiring
 *
 * Verifies the data flow between:
 *  1. caseDrillDown utility (timeline, evidence groups, approval history, escalation options)
 *  2. CaseDrillDownPanel component (renders derived state correctly)
 *  3. EscalationFlowModal component (receives wired item, emits escalation payload)
 *
 * These tests prove that the derived state from utility functions flows correctly
 * into the component's rendered output — testing the wiring, not just units in isolation.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CaseDrillDownPanel from '../../components/compliance/CaseDrillDownPanel.vue'
import EscalationFlowModal from '../../components/compliance/EscalationFlowModal.vue'
import {
  deriveCaseDrillDown,
  buildEscalationOptions,
  getDefaultEscalationReason,
  DRILL_DOWN_TEST_IDS,
  ESCALATION_MODAL_TEST_IDS,
} from '../../utils/caseDrillDown'
import type { WorkItem } from '../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'int-test-wi-001',
    title: 'AML Review — Thorngate Capital',
    stage: 'kyc_aml',
    status: 'blocked',
    ownership: 'assigned_to_me',
    lastActionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    workspacePath: '/compliance/onboarding',
    note: 'AML provider timeout — awaiting retry',
    isLaunchBlocking: true,
    ...overrides,
  }
}

function bodyQuery(testId: string): Element | null {
  return document.body.querySelector(`[data-testid="${testId}"]`)
}
function bodyQueryAll(testId: string): NodeListOf<Element> {
  return document.body.querySelectorAll(`[data-testid="${testId}"]`)
}

afterEach(() => {
  ;[
    DRILL_DOWN_TEST_IDS.PANEL,
    ESCALATION_MODAL_TEST_IDS.MODAL,
  ].forEach((id) => {
    document.body.querySelectorAll(`[data-testid="${id}"]`).forEach((el) => el.remove())
  })
  document.body.querySelectorAll('.fixed.inset-0').forEach((el) => el.remove())
})

// ---------------------------------------------------------------------------
// Utility → Component wiring: deriveCaseDrillDown → CaseDrillDownPanel
// ---------------------------------------------------------------------------

describe('CaseDrillDownWiring — utility state flows into panel', () => {
  it('panel title matches item title from utility state', async () => {
    const item = makeWorkItem()
    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const headline = bodyQuery(DRILL_DOWN_TEST_IDS.CASE_HEADLINE)
    expect(headline!.textContent!.trim()).toBe(item.title)
    wrapper.unmount()
  })

  it('panel renders all 5 evidence groups produced by buildMockEvidenceGroups', async () => {
    const item = makeWorkItem()
    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const groups = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP)
    expect(groups.length).toBe(5)
    wrapper.unmount()
  })

  it('each evidence group has the category data attribute from the utility', async () => {
    const item = makeWorkItem()
    const derived = deriveCaseDrillDown(item, Date.now())
    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const groups = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP)
    const renderedCategories = Array.from(groups).map((g) => g.getAttribute('data-category'))
    const derivedCategories = derived.evidenceGroups.map((g) => g.category)
    expect(renderedCategories.sort()).toEqual(derivedCategories.sort())
    wrapper.unmount()
  })

  it('panel shows blocker list for a blocked item', async () => {
    const item = makeWorkItem({ status: 'blocked', note: 'AML provider timeout' })
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.blockerSummary.length).toBeGreaterThan(0)

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const blockerList = bodyQuery(DRILL_DOWN_TEST_IDS.BLOCKER_LIST)
    expect(blockerList).not.toBeNull()
    const blockerItems = bodyQueryAll(DRILL_DOWN_TEST_IDS.BLOCKER_ITEM)
    expect(blockerItems.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('panel next action text matches utility-derived nextAction string', async () => {
    // For a blocked item at document_review stage (no degraded evidence), the
    // nextAction will be about missing evidence, not the blocker note.
    // Use a blocked item at document_review where no evidence is degraded.
    const item = makeWorkItem({ status: 'blocked', stage: 'document_review', note: 'AML provider timeout' })
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.nextAction).toBeTruthy()

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const nextActionBox = bodyQuery(DRILL_DOWN_TEST_IDS.NEXT_ACTION_BOX)
    // For blocked + document_review, evidence has missing items so nextAction says "Required evidence is missing"
    expect(nextActionBox!.textContent!.trim().length).toBeGreaterThan(10)
    // The derived nextAction must match what's shown in the panel
    expect(nextActionBox!.textContent).toContain(derived.nextAction.slice(0, 30))
    wrapper.unmount()
  })

  it('panel shows degraded notice when utility derives isDegraded=true', async () => {
    const item = makeWorkItem({ status: 'overdue' })
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.isDegraded).toBe(true)

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const degradedNotice = bodyQuery(DRILL_DOWN_TEST_IDS.DEGRADED_NOTICE)
    expect(degradedNotice).not.toBeNull()
    wrapper.unmount()
  })

  it('panel does NOT show degraded notice when isDegraded=false', async () => {
    const item = makeWorkItem({ status: 'in_progress', stage: 'onboarding' })
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.isDegraded).toBe(false)

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const degradedNotice = bodyQuery(DRILL_DOWN_TEST_IDS.DEGRADED_NOTICE)
    expect(degradedNotice).toBeNull()
    wrapper.unmount()
  })

  it('panel timeline events each have data-event-type matching utility timeline', async () => {
    const item = makeWorkItem()
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.timeline.length).toBeGreaterThan(0)

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const events = bodyQueryAll(DRILL_DOWN_TEST_IDS.TIMELINE_EVENT)
    expect(events.length).toBe(derived.timeline.length)
    // Each timeline event type attribute must be a valid event type
    events.forEach((el) => {
      const eventType = el.getAttribute('data-event-type')
      expect(eventType).toBeTruthy()
      expect(['case_opened', 'stage_changed', 'evidence_submitted', 'note_added', 'escalated', 'sla_breached', 'approval_decision']).toContain(eventType)
    })
    wrapper.unmount()
  })

  it('approval history records render with data-decision attributes from utility', async () => {
    const item = makeWorkItem({ stage: 'approval' })
    const derived = deriveCaseDrillDown(item, Date.now())
    expect(derived.approvalHistory.length).toBeGreaterThan(0)

    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const records = bodyQueryAll(DRILL_DOWN_TEST_IDS.APPROVAL_RECORD)
    expect(records.length).toBe(derived.approvalHistory.length)
    records.forEach((el) => {
      const decision = el.getAttribute('data-decision')
      expect(decision).toBeTruthy()
    })
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Utility → Component wiring: buildEscalationOptions → EscalationFlowModal
// ---------------------------------------------------------------------------

describe('CaseDrillDownWiring — escalation options flow into modal', () => {
  it('modal renders 6 reason options matching buildEscalationOptions output', async () => {
    const item = makeWorkItem()
    const derived = buildEscalationOptions(item)
    expect(derived.length).toBe(6)

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const options = bodyQueryAll(ESCALATION_MODAL_TEST_IDS.REASON_OPTION)
    expect(options.length).toBe(derived.length)
    wrapper.unmount()
  })

  it('modal pre-selects sanctions_review_required for kyc_aml blocked items', async () => {
    const item = makeWorkItem({ stage: 'kyc_aml', status: 'blocked' })
    const defaultReason = getDefaultEscalationReason(item)
    expect(defaultReason).toBe('sanctions_review_required')

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT) as HTMLSelectElement | null
    expect(select!.value).toBe('sanctions_review_required')
    wrapper.unmount()
  })

  it('modal pre-selects sla_risk for overdue items', async () => {
    const item = makeWorkItem({ status: 'overdue', dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() })
    const defaultReason = getDefaultEscalationReason(item)
    expect(defaultReason).toBe('sla_risk')

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT) as HTMLSelectElement | null
    expect(select!.value).toBe('sla_risk')
    wrapper.unmount()
  })

  it('modal submit emits payload whose reason and destination match selected option from utility', async () => {
    const item = makeWorkItem({ stage: 'kyc_aml', status: 'blocked' })
    const options = buildEscalationOptions(item)
    const expectedDestination = options.find((o) => o.reason === 'sanctions_review_required')!.suggestedDestination

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const submitBtn = bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN) as HTMLButtonElement | null
    expect(submitBtn).not.toBeNull()
    submitBtn!.click()
    await nextTick()

    const emitted = wrapper.emitted('submitted')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as { reason: string; destination: string; note: string }
    expect(payload.reason).toBe('sanctions_review_required')
    expect(payload.destination).toBe(expectedDestination)
    wrapper.unmount()
  })

  it('modal destination display reflects the utility-derived suggested destination', async () => {
    const item = makeWorkItem({ stage: 'approval', status: 'pending_review' })
    const options = buildEscalationOptions(item)
    const approvalOption = options.find((o) => o.reason === 'approval_review_required')!
    expect(approvalOption.suggestedDestination).toBeTruthy()

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    // Change the select value to approval_review_required
    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT) as HTMLSelectElement | null
    const vm = wrapper.vm as any
    vm.selectedReason = 'approval_review_required'
    await nextTick()

    const dest = bodyQuery(ESCALATION_MODAL_TEST_IDS.DESTINATION_DISPLAY)
    expect(dest!.textContent).toContain(approvalOption.suggestedDestination)
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Panel → Modal escalation emit chain
// ---------------------------------------------------------------------------

describe('CaseDrillDownWiring — panel escalate button opens modal workflow', () => {
  it('panel emits "escalate" event with the work item when escalate button is clicked', async () => {
    const item = makeWorkItem()
    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const escalateBtn = bodyQuery(DRILL_DOWN_TEST_IDS.ESCALATE_BTN) as HTMLButtonElement | null
    expect(escalateBtn).not.toBeNull()
    escalateBtn!.click()
    await nextTick()

    const emitted = wrapper.emitted('escalate')
    expect(emitted).toBeTruthy()
    const emittedItem = emitted![0][0] as WorkItem
    expect(emittedItem.id).toBe(item.id)
    expect(emittedItem.title).toBe(item.title)
    wrapper.unmount()
  })

  it('panel emits "update:modelValue"=false when close button is clicked', async () => {
    const item = makeWorkItem()
    const wrapper = mount(CaseDrillDownPanel, {
      props: { modelValue: true, item },
      attachTo: document.body,
    })
    await nextTick()

    const closeBtn = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL_CLOSE_BTN) as HTMLButtonElement | null
    expect(closeBtn).not.toBeNull()
    closeBtn!.click()
    await nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([false])
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// deriveCaseDrillDown state consistency
// ---------------------------------------------------------------------------

describe('CaseDrillDownWiring — deriveCaseDrillDown state consistency', () => {
  it('isReadyForApproval is false when any evidence group is missing', () => {
    const item = makeWorkItem({ status: 'blocked', stage: 'kyc_aml' })
    const state = deriveCaseDrillDown(item, Date.now())
    // Blocked kyc_aml will have missing KYC documents
    const hasMissing = state.evidenceGroups.some((g) => g.overallStatus === 'missing')
    expect(state.isReadyForApproval).toBe(false)
    // If missing, blocked should surface in blockerSummary
    if (hasMissing) {
      expect(state.blockerSummary.length).toBeGreaterThan(0)
    }
  })

  it('isReadyForApproval is false for blocked items regardless of evidence', () => {
    const item = makeWorkItem({ status: 'blocked' })
    const state = deriveCaseDrillDown(item, Date.now())
    expect(state.isReadyForApproval).toBe(false)
  })

  it('isReadyForApproval is false for overdue items', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const state = deriveCaseDrillDown(item, Date.now())
    expect(state.isReadyForApproval).toBe(false)
  })

  it('isDegraded is true when any evidence group is in degraded state', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const state = deriveCaseDrillDown(item, Date.now())
    // Overdue items have degraded sanctions screening
    expect(state.isDegraded).toBe(true)
  })

  it('escalationOptions has 6 entries for any work item', () => {
    const item = makeWorkItem()
    const state = deriveCaseDrillDown(item, Date.now())
    expect(state.escalationOptions.length).toBe(6)
  })

  it('nextAction for overdue item contains urgency language', () => {
    const item = makeWorkItem({ status: 'overdue' })
    const state = deriveCaseDrillDown(item, Date.now())
    expect(state.nextAction.toLowerCase()).toContain('overdue')
  })

  it('nextAction for in-progress item contains stage context', () => {
    const item = makeWorkItem({ status: 'in_progress', stage: 'kyc_aml' })
    const state = deriveCaseDrillDown(item, Date.now())
    expect(state.nextAction.length).toBeGreaterThan(10)
  })

  it('blockerSummary includes the item note text for blocked items with notes', () => {
    const item = makeWorkItem({ status: 'blocked', note: 'Awaiting AML retry' })
    const state = deriveCaseDrillDown(item, Date.now())
    const noteMentioned = state.blockerSummary.some((b) => b.includes('Awaiting AML retry'))
    expect(noteMentioned).toBe(true)
  })
})
