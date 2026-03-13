/**
 * Logic Tests: TeamWorkspaceView
 *
 * Tests interaction logic: retry, approve/request-changes actions,
 * collapse/expand toggle, summary count reactivity, store integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import TeamWorkspaceView from '../TeamWorkspaceView.vue'
import type { WorkItem } from '../../types/approvalWorkflow'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/team/workspace', name: 'TeamWorkspace', component: { template: '<div />' } },
      { path: '/compliance', name: 'ComplianceDashboard', component: { template: '<div />' } },
    ],
  })

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: `li-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Logic Test Item',
  description: 'Description',
  category: 'issuance_approval',
  priority: 'high',
  state: 'in_review',
  assignee: 'a@example.com',
  reviewer: 'r@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  evidenceLinks: [],
  contextPath: '/launch/guided',
  businessConsequence: 'Blocks deployment',
  notes: [],
  ...overrides,
})

const mountView = async (workItems: WorkItem[] = [], extra: Record<string, unknown> = {}): Promise<VueWrapper> => {
  const router = makeRouter()
  await router.push('/team/workspace')
  await router.isReady()

  const wrapper = mount(TeamWorkspaceView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            approvalWorkflow: {
              workItems,
              loading: false,
              error: null,
              ...extra,
            },
            team: {
              members: [{ id: '1', email: 'test@example.com', role: 'owner', status: 'active' }],
              loading: false,
            },
            auth: {
              user: { address: 'ADDR', email: 'test@example.com' },
              isConnected: true,
            },
          },
        }),
        router,
      ],
      stubs: {
        'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] },
        ApprovalStatusBadge: {
          template: '<span class="mock-badge">{{ state }}</span>',
          props: ['state', 'size'],
        },
        WorkItemCard: {
          template: `
            <div class="mock-work-item-card" :data-item-id="item?.id">
              <button class="mock-approve-btn" @click="$emit('approve', item.id)">Approve</button>
              <button class="mock-rc-btn" @click="$emit('requestChanges', item.id)">RC</button>
            </div>
          `,
          props: ['item', 'currentUserEmail', 'canApprove', 'canAssign'],
          emits: ['approve', 'requestChanges', 'assign'],
        },
      },
    },
  })
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Retry action
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView logic — retry', () => {
  it('retry button click calls store.initialize', async () => {
    const w = await mountView([], { error: 'Something went wrong' })
    const { useApprovalWorkflowStore } = await import('../../stores/approvalWorkflow')
    const store = useApprovalWorkflowStore()

    await w.find('[data-testid="retry-button"]').trigger('click')
    expect(store.initialize).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Approve / Request changes propagation
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView logic — approve action', () => {
  it('approve event from WorkItemCard calls updateItemState with approved', async () => {
    const item = makeItem({ id: 'approve-target', state: 'in_review' })
    const w = await mountView([item])
    const { useApprovalWorkflowStore } = await import('../../stores/approvalWorkflow')
    const store = useApprovalWorkflowStore()

    // Trigger approve on the stubbed card
    const card = w.find('[data-item-id="approve-target"]')
    await card.find('.mock-approve-btn').trigger('click')

    expect(store.updateItemState).toHaveBeenCalledWith('approve-target', 'approved')
  })

  it('requestChanges event from WorkItemCard calls updateItemState with needs_changes', async () => {
    const item = makeItem({ id: 'rc-target', state: 'in_review' })
    const w = await mountView([item])
    const { useApprovalWorkflowStore } = await import('../../stores/approvalWorkflow')
    const store = useApprovalWorkflowStore()

    const card = w.find('[data-item-id="rc-target"]')
    await card.find('.mock-rc-btn').trigger('click')

    expect(store.updateItemState).toHaveBeenCalledWith('rc-target', 'needs_changes')
  })
})

// ---------------------------------------------------------------------------
// Completed section collapse / expand
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView logic — collapse/expand', () => {
  it('recently completed section starts collapsed (content hidden)', async () => {
    const item = makeItem({ id: 'cmp-1', state: 'approved', updatedAt: new Date().toISOString() })
    const w = await mountView([item])
    // Content list should not be visible initially
    expect(w.find('#completed-items-list').exists()).toBe(false)
  })

  it('clicking the completed section toggle expands the section', async () => {
    const item = makeItem({ id: 'cmp-2', state: 'approved', updatedAt: new Date().toISOString() })
    const w = await mountView([item])
    const toggle = w.find('[data-testid="completed-section-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    expect(w.find('#completed-items-list').exists()).toBe(true)
  })

  it('clicking the toggle twice collapses the section again', async () => {
    const item = makeItem({ id: 'cmp-3', state: 'approved', updatedAt: new Date().toISOString() })
    const w = await mountView([item])
    const toggle = w.find('[data-testid="completed-section-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    await toggle.trigger('click')
    await nextTick()
    expect(w.find('#completed-items-list').exists()).toBe(false)
  })

  it('toggle button aria-expanded=false when section is collapsed', async () => {
    const w = await mountView()
    const toggle = w.find('[data-testid="completed-section-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('toggle button aria-expanded=true when section is expanded', async () => {
    const w = await mountView()
    const toggle = w.find('[data-testid="completed-section-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// Summary counts reflect store state
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView logic — summary counts', () => {
  it('pending count reflects number of pending items', async () => {
    const items = [
      makeItem({ state: 'pending' }),
      makeItem({ state: 'pending' }),
      makeItem({ state: 'in_review' }),
    ]
    const w = await mountView(items)
    const badge = w.find('[data-testid="pending-count-badge"]')
    expect(badge.text()).toContain('2')
  })

  it('in-review count reflects in_review items', async () => {
    const items = [makeItem({ state: 'in_review' }), makeItem({ state: 'in_review' })]
    const w = await mountView(items)
    const badge = w.find('[data-testid="in-review-count-badge"]')
    expect(badge.text()).toContain('2')
  })

  it('completed count reflects approved + completed items', async () => {
    const items = [
      makeItem({ state: 'approved' }),
      makeItem({ state: 'completed' }),
      makeItem({ state: 'pending' }),
    ]
    const w = await mountView(items)
    const badge = w.find('[data-testid="completed-count-badge"]')
    expect(badge.text()).toContain('2')
  })

  it('all counts are 0 when workItems is empty', async () => {
    const w = await mountView([])
    expect(w.find('[data-testid="pending-count-badge"]').text()).toContain('0')
    expect(w.find('[data-testid="in-review-count-badge"]').text()).toContain('0')
    expect(w.find('[data-testid="completed-count-badge"]').text()).toContain('0')
  })
})

// ---------------------------------------------------------------------------
// Store state drives rendering
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView logic — store integration', () => {
  it('shows loading skeleton when store.loading is true', async () => {
    const w = await mountView([], { loading: true })
    expect(w.find('[data-testid="loading-state"]').exists()).toBe(true)
  })

  it('shows error state when store.error is set', async () => {
    const w = await mountView([], { error: 'Connection refused' })
    expect(w.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(w.text()).toContain('Connection refused')
  })

  it('hides error state when store.error is null', async () => {
    const w = await mountView([])
    expect(w.find('[data-testid="error-state"]').exists()).toBe(false)
  })

  it('WorkItemCard count in ready-for-approval matches in_review items', async () => {
    const items = [
      makeItem({ id: 'r1', state: 'in_review' }),
      makeItem({ id: 'r2', state: 'in_review' }),
      makeItem({ id: 'r3', state: 'pending' }),
    ]
    const w = await mountView(items)
    const section = w.find('[data-testid="ready-approval-section"]')
    const cards = section.findAll('.mock-work-item-card')
    expect(cards).toHaveLength(2)
  })

  it('empty state for ready-for-approval shown when no in_review items', async () => {
    const items = [makeItem({ state: 'pending' })]
    const w = await mountView(items)
    expect(w.find('[data-testid="empty-state-ready"]').exists()).toBe(true)
  })

  it('empty state for assigned section shown when no assigned items', async () => {
    const w = await mountView([makeItem({ assignee: undefined })])
    expect(w.find('[data-testid="empty-state-assigned"]').exists()).toBe(true)
  })

  it('WorkItemCard count in assigned section matches items with assignee and active states', async () => {
    const items = [
      makeItem({ id: 'a1', state: 'pending', assignee: 'a@b.com' }),
      makeItem({ id: 'a2', state: 'in_review', assignee: 'b@c.com' }),
      makeItem({ id: 'a3', state: 'approved', assignee: 'd@e.com' }), // excluded from active (terminal)
      makeItem({ id: 'a4', state: 'pending', assignee: undefined }), // no assignee — excluded
    ]
    const w = await mountView(items)
    const section = w.find('[data-testid="assigned-section"]')
    const cards = section.findAll('.mock-work-item-card')
    // a1 (pending+assignee) and a2 (in_review+assignee) are the active assigned items
    // a3 (approved) and a4 (no assignee) are excluded — count must be exactly 2
    expect(cards.length).toBe(2)
  })
})
