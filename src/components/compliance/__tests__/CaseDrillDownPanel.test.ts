/**
 * Component Tests: CaseDrillDownPanel.vue
 *
 * Uses document.body queries for Teleport-rendered content (per section 7r/7s patterns).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import CaseDrillDownPanel from '../CaseDrillDownPanel.vue'
import { DRILL_DOWN_TEST_IDS } from '../../../utils/caseDrillDown'
import type { WorkItem } from '../../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/compliance/onboarding', component: { template: '<div>Onboarding</div>' } },
      { path: '/compliance/approval', component: { template: '<div>Approval</div>' } },
    ],
  })
}

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'wi-test-001',
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

async function mountPanel(
  modelValue = true,
  item: WorkItem | null = makeWorkItem(),
): Promise<VueWrapper> {
  const router = makeRouter()
  await router.isReady()
  const wrapper = mount(CaseDrillDownPanel, {
    props: { modelValue, item },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

/** Query the Teleport-rendered panel from document.body */
function bodyQuery(testId: string): Element | null {
  return document.body.querySelector(`[data-testid="${testId}"]`)
}

function bodyQueryAll(testId: string): NodeListOf<Element> {
  return document.body.querySelectorAll(`[data-testid="${testId}"]`)
}

// Cleanup stale Teleport elements after each test
afterEach(() => {
  const stale = document.body.querySelector(`[data-testid="${DRILL_DOWN_TEST_IDS.PANEL}"]`)
  if (stale) stale.remove()
})

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — visibility', () => {
  it('renders the panel when modelValue is true', async () => {
    const wrapper = await mountPanel(true)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.PANEL)).not.toBeNull()
    wrapper.unmount()
  })

  it('does not render the panel when modelValue is false', async () => {
    const wrapper = await mountPanel(false)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.PANEL)).toBeNull()
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Header content
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — header', () => {
  it('shows the case headline with the work item title', async () => {
    const item = makeWorkItem({ title: 'AML Screening — Investor X' })
    const wrapper = await mountPanel(true, item)
    const headline = bodyQuery(DRILL_DOWN_TEST_IDS.CASE_HEADLINE)
    expect(headline).not.toBeNull()
    expect(headline!.textContent).toContain('AML Screening — Investor X')
    wrapper.unmount()
  })

  it('renders stage badge with stage label', async () => {
    const wrapper = await mountPanel(true, makeWorkItem({ stage: 'kyc_aml' }))
    const badge = bodyQuery(DRILL_DOWN_TEST_IDS.CASE_STAGE_BADGE)
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toContain('KYC')
    wrapper.unmount()
  })

  it('renders status badge', async () => {
    const wrapper = await mountPanel(true, makeWorkItem({ status: 'blocked' }))
    const badge = bodyQuery(DRILL_DOWN_TEST_IDS.CASE_STATUS_BADGE)
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toContain('Blocked')
    wrapper.unmount()
  })

  it('renders ownership badge', async () => {
    const wrapper = await mountPanel(true, makeWorkItem({ ownership: 'assigned_to_me' }))
    const badge = bodyQuery(DRILL_DOWN_TEST_IDS.CASE_OWNERSHIP_BADGE)
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toContain('Assigned')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Next action
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — next action', () => {
  it('renders the next action box with non-empty guidance text', async () => {
    const wrapper = await mountPanel(true)
    const box = bodyQuery(DRILL_DOWN_TEST_IDS.NEXT_ACTION_BOX)
    expect(box).not.toBeNull()
    expect(box!.textContent!.trim().length).toBeGreaterThan(10)
    wrapper.unmount()
  })

  it('shows overdue-specific guidance for overdue items', async () => {
    const item = makeWorkItem({ status: 'overdue', dueAt: '2026-01-01T00:00:00.000Z' })
    const wrapper = await mountPanel(true, item)
    const box = bodyQuery(DRILL_DOWN_TEST_IDS.NEXT_ACTION_BOX)
    expect(box!.textContent!.toLowerCase()).toContain('overdue')
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Blocker list
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — blockers', () => {
  it('renders blocker items for a blocked work item', async () => {
    const item = makeWorkItem({ status: 'blocked', stage: 'kyc_aml', note: 'Awaiting legal opinion' })
    const wrapper = await mountPanel(true, item)
    const list = bodyQuery(DRILL_DOWN_TEST_IDS.BLOCKER_LIST)
    expect(list).not.toBeNull()
    const items = bodyQueryAll(DRILL_DOWN_TEST_IDS.BLOCKER_ITEM)
    expect(items.length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — timeline', () => {
  it('renders the timeline section', async () => {
    const wrapper = await mountPanel(true)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.TIMELINE_SECTION)).not.toBeNull()
    wrapper.unmount()
  })

  it('renders at least one timeline event', async () => {
    const wrapper = await mountPanel(true)
    const events = bodyQueryAll(DRILL_DOWN_TEST_IDS.TIMELINE_EVENT)
    expect(events.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('each timeline event has a data-event-type attribute', async () => {
    const wrapper = await mountPanel(true)
    const events = bodyQueryAll(DRILL_DOWN_TEST_IDS.TIMELINE_EVENT)
    events.forEach((ev) => {
      const type = ev.getAttribute('data-event-type')
      expect(type).toBeTruthy()
    })
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Evidence groups
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — evidence groups', () => {
  it('renders the evidence section', async () => {
    const wrapper = await mountPanel(true)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.EVIDENCE_SECTION)).not.toBeNull()
    wrapper.unmount()
  })

  it('renders 5 evidence groups', async () => {
    const wrapper = await mountPanel(true)
    const groups = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP)
    expect(groups.length).toBe(5)
    wrapper.unmount()
  })

  it('each evidence group has a data-category attribute', async () => {
    const wrapper = await mountPanel(true)
    const groups = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP)
    groups.forEach((g) => {
      expect(g.getAttribute('data-category')).toBeTruthy()
    })
    wrapper.unmount()
  })

  it('each group toggle has aria-expanded attribute', async () => {
    const wrapper = await mountPanel(true)
    const toggles = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP_TOGGLE)
    toggles.forEach((t) => {
      const expanded = t.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(expanded)
    })
    wrapper.unmount()
  })

  it('expanded groups show evidence items', async () => {
    const wrapper = await mountPanel(true)
    // identity_kyc and aml_sanctions groups start expanded
    const items = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_ITEM)
    expect(items.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('each evidence item has a data-status attribute', async () => {
    const wrapper = await mountPanel(true)
    const items = bodyQueryAll(DRILL_DOWN_TEST_IDS.EVIDENCE_ITEM)
    items.forEach((item) => {
      const status = item.getAttribute('data-status')
      expect(['available', 'missing', 'stale', 'degraded']).toContain(status)
    })
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Approval history
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — approval history', () => {
  it('renders the approval history section', async () => {
    const wrapper = await mountPanel(true)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.APPROVAL_HISTORY_SECTION)).not.toBeNull()
    wrapper.unmount()
  })

  it('shows approval records for items at approval stage', async () => {
    const item = makeWorkItem({ stage: 'approval', status: 'pending_review' })
    const wrapper = await mountPanel(true, item)
    const records = bodyQueryAll(DRILL_DOWN_TEST_IDS.APPROVAL_RECORD)
    expect(records.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('each approval record has a data-decision attribute', async () => {
    const item = makeWorkItem({ stage: 'approval', status: 'approval_ready' })
    const wrapper = await mountPanel(true, item)
    const records = bodyQueryAll(DRILL_DOWN_TEST_IDS.APPROVAL_RECORD)
    records.forEach((r) => {
      expect(r.getAttribute('data-decision')).toBeTruthy()
    })
    wrapper.unmount()
  })

  it('shows empty state for first-stage items with no history', async () => {
    const item = makeWorkItem({ stage: 'onboarding', status: 'open' })
    const wrapper = await mountPanel(true, item)
    const empty = bodyQuery(DRILL_DOWN_TEST_IDS.APPROVAL_HISTORY_EMPTY)
    expect(empty).not.toBeNull()
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — close action', () => {
  it('emits update:modelValue=false when close button clicked', async () => {
    const wrapper = await mountPanel(true)
    const btn = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL_CLOSE_BTN) as HTMLButtonElement | null
    expect(btn).not.toBeNull()
    btn!.click()
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([false])
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Escalate action
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — escalate action', () => {
  it('renders the escalate button', async () => {
    const wrapper = await mountPanel(true)
    expect(bodyQuery(DRILL_DOWN_TEST_IDS.ESCALATE_BTN)).not.toBeNull()
    wrapper.unmount()
  })

  it('emits escalate event with work item when escalate button clicked', async () => {
    const item = makeWorkItem()
    const wrapper = await mountPanel(true, item)
    const btn = bodyQuery(DRILL_DOWN_TEST_IDS.ESCALATE_BTN) as HTMLButtonElement | null
    expect(btn).not.toBeNull()
    btn!.click()
    await nextTick()
    const emitted = wrapper.emitted('escalate')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ id: 'wi-test-001' })
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('CaseDrillDownPanel — accessibility', () => {
  it('panel has role=dialog', async () => {
    const wrapper = await mountPanel(true)
    const panel = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL)
    expect(panel!.getAttribute('role')).toBe('dialog')
    wrapper.unmount()
  })

  it('panel has aria-modal=true', async () => {
    const wrapper = await mountPanel(true)
    const panel = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL)
    expect(panel!.getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })

  it('panel has a non-empty aria-label', async () => {
    const wrapper = await mountPanel(true)
    const panel = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL)
    const label = panel!.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(5)
    wrapper.unmount()
  })

  it('close button has a descriptive aria-label', async () => {
    const wrapper = await mountPanel(true)
    const btn = bodyQuery(DRILL_DOWN_TEST_IDS.PANEL_CLOSE_BTN)
    const label = btn!.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.toLowerCase()).toContain('close')
    wrapper.unmount()
  })

  it('escalate button has a descriptive aria-label', async () => {
    const wrapper = await mountPanel(true)
    const btn = bodyQuery(DRILL_DOWN_TEST_IDS.ESCALATE_BTN)
    const label = btn!.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.toLowerCase()).toContain('escalat')
    wrapper.unmount()
  })
})
