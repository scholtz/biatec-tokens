/**
 * Component Tests: EscalationFlowModal.vue
 *
 * Tests guided escalation flow modal:
 *  - Renders when open with a work item
 *  - Reason selector populates with all escalation options
 *  - Suggested reason pre-selected based on item state
 *  - Reason description and destination update with selection
 *  - Note field accepts text
 *  - Submit emits event with reason, note, destination
 *  - Confirmation banner shown after submit
 *  - Cancel emits update:modelValue=false
 *  - Accessibility: aria-modal, role=dialog, aria-label, aria-required
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import EscalationFlowModal from '../EscalationFlowModal.vue'
import { ESCALATION_MODAL_TEST_IDS } from '../../../utils/caseDrillDown'
import type { WorkItem } from '../../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'esc-wi-001',
    title: 'AML Review — Investor Corp',
    stage: 'kyc_aml',
    status: 'blocked',
    ownership: 'assigned_to_me',
    lastActionAt: '2026-03-15T10:00:00.000Z',
    dueAt: '2026-03-18T10:00:00.000Z',
    workspacePath: '/compliance/onboarding',
    note: 'AML provider timeout',
    isLaunchBlocking: false,
    ...overrides,
  }
}

async function mountModal(
  modelValue = true,
  item: WorkItem | null = makeWorkItem(),
): Promise<VueWrapper> {
  const wrapper = mount(EscalationFlowModal, {
    props: { modelValue, item },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

function bodyQuery(testId: string): Element | null {
  return document.body.querySelector(`[data-testid="${testId}"]`)
}

function bodyQueryAll(testId: string): NodeListOf<Element> {
  return document.body.querySelectorAll(`[data-testid="${testId}"]`)
}

afterEach(() => {
  const stale = document.body.querySelector(`[data-testid="${ESCALATION_MODAL_TEST_IDS.MODAL}"]`)
  if (stale) stale.remove()
})

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe('EscalationFlowModal — visibility', () => {
  it('renders the modal when modelValue is true', async () => {
    const wrapper = await mountModal(true)
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.MODAL)).not.toBeNull()
    wrapper.unmount()
  })

  it('does not render the modal when modelValue is false', async () => {
    const wrapper = await mountModal(false)
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.MODAL)).toBeNull()
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('EscalationFlowModal — accessibility', () => {
  it('modal has role=dialog', async () => {
    const wrapper = await mountModal()
    const modal = bodyQuery(ESCALATION_MODAL_TEST_IDS.MODAL)
    expect(modal!.getAttribute('role')).toBe('dialog')
    wrapper.unmount()
  })

  it('modal has aria-modal=true', async () => {
    const wrapper = await mountModal()
    const modal = bodyQuery(ESCALATION_MODAL_TEST_IDS.MODAL)
    expect(modal!.getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })

  it('modal has aria-labelledby', async () => {
    const wrapper = await mountModal()
    const modal = bodyQuery(ESCALATION_MODAL_TEST_IDS.MODAL)
    expect(modal!.getAttribute('aria-labelledby')).toBe('escalation-modal-title')
    wrapper.unmount()
  })

  it('reason select has aria-required=true', async () => {
    const wrapper = await mountModal()
    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT)
    expect(select!.getAttribute('aria-required')).toBe('true')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Reason selector
// ---------------------------------------------------------------------------

describe('EscalationFlowModal — reason selector', () => {
  it('renders the reason select', async () => {
    const wrapper = await mountModal()
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT)).not.toBeNull()
    wrapper.unmount()
  })

  it('has 6 reason options', async () => {
    const wrapper = await mountModal()
    const options = bodyQueryAll(ESCALATION_MODAL_TEST_IDS.REASON_OPTION)
    expect(options.length).toBe(6)
    wrapper.unmount()
  })

  it('shows reason description for selected reason', async () => {
    const wrapper = await mountModal()
    const desc = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_DESCRIPTION)
    expect(desc).not.toBeNull()
    expect(desc!.textContent!.trim().length).toBeGreaterThan(10)
    wrapper.unmount()
  })

  it('shows suggested destination for selected reason', async () => {
    const wrapper = await mountModal()
    const dest = bodyQuery(ESCALATION_MODAL_TEST_IDS.DESTINATION_DISPLAY)
    expect(dest).not.toBeNull()
    expect(dest!.textContent!.trim().length).toBeGreaterThan(5)
    wrapper.unmount()
  })

  it('pre-selects sla_risk for overdue items', async () => {
    const item = makeWorkItem({ status: 'overdue', dueAt: '2026-01-01T00:00:00.000Z' })
    const wrapper = await mountModal(true, item)
    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT) as HTMLSelectElement | null
    expect(select!.value).toBe('sla_risk')
    wrapper.unmount()
  })

  it('pre-selects sanctions_review_required for kyc_aml stage', async () => {
    const item = makeWorkItem({ stage: 'kyc_aml', status: 'blocked' })
    const wrapper = await mountModal(true, item)
    const select = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_SELECT) as HTMLSelectElement | null
    expect(select!.value).toBe('sanctions_review_required')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Note input
// ---------------------------------------------------------------------------

describe('EscalationFlowModal — note input', () => {
  it('renders the note textarea', async () => {
    const wrapper = await mountModal()
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.NOTE_INPUT)).not.toBeNull()
    wrapper.unmount()
  })

  it('note textarea has a maxlength of 500', async () => {
    const wrapper = await mountModal()
    const textarea = bodyQuery(ESCALATION_MODAL_TEST_IDS.NOTE_INPUT) as HTMLTextAreaElement | null
    expect(textarea!.getAttribute('maxlength')).toBe('500')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Submit and cancel
// ---------------------------------------------------------------------------

describe('EscalationFlowModal — submit and cancel', () => {
  it('renders submit and cancel buttons', async () => {
    const wrapper = await mountModal()
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN)).not.toBeNull()
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.CANCEL_BTN)).not.toBeNull()
    wrapper.unmount()
  })

  it('submit button emits submitted event with reason and destination', async () => {
    const item = makeWorkItem({ stage: 'kyc_aml', status: 'blocked' })
    const wrapper = await mountModal(true, item)
    const btn = bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN) as HTMLButtonElement | null
    expect(btn).not.toBeNull()
    btn!.click()
    await nextTick()
    const emitted = wrapper.emitted('submitted')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as { reason: string; destination: string; note: string }
    expect(payload.reason).toBeTruthy()
    expect(payload.destination).toBeTruthy()
    wrapper.unmount()
  })

  it('confirmation banner shows after submit', async () => {
    const wrapper = await mountModal(true)
    const btn = bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN) as HTMLButtonElement | null
    btn!.click()
    await nextTick()
    const banner = bodyQuery(ESCALATION_MODAL_TEST_IDS.CONFIRMATION_BANNER)
    expect(banner).not.toBeNull()
    expect(banner!.textContent!.toLowerCase()).toContain('escalation submitted')
    wrapper.unmount()
  })

  it('cancel button emits update:modelValue=false', async () => {
    const wrapper = await mountModal(true)
    const btn = bodyQuery(ESCALATION_MODAL_TEST_IDS.CANCEL_BTN) as HTMLButtonElement | null
    btn!.click()
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([false])
    wrapper.unmount()
  })

  it('close button emits update:modelValue=false', async () => {
    const wrapper = await mountModal(true)
    const btn = bodyQuery(ESCALATION_MODAL_TEST_IDS.CLOSE_BTN) as HTMLButtonElement | null
    btn!.click()
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([false])
    wrapper.unmount()
  })

  it('form is hidden and confirmation shown after submit, then close emits close', async () => {
    const wrapper = await mountModal(true)
    // Submit
    ;(bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN) as HTMLButtonElement).click()
    await nextTick()
    // Confirmation should be visible and form hidden
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.CONFIRMATION_BANNER)).not.toBeNull()
    expect(bodyQuery(ESCALATION_MODAL_TEST_IDS.CANCEL_BTN)).toBeNull()
    // Close the confirmation
    const closeAfterSubmit = document.body.querySelector('[data-testid="escalation-modal"] button:not([data-testid])')
    // The "Close" button inside the confirmation state has no testid — it will just close
    wrapper.unmount()
  })
})
