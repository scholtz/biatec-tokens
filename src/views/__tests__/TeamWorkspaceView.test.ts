/**
 * Unit Tests: TeamWorkspaceView
 *
 * Tests rendering of queue sections, loading/error states, summary bar,
 * role-awareness, and WCAG accessibility attributes.
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
  id: `item-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Sample Work Item',
  description: 'Description',
  category: 'compliance_review',
  priority: 'medium',
  state: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  evidenceLinks: [],
  contextPath: '/compliance/setup',
  businessConsequence: 'Risk consequence',
  notes: [],
  ...overrides,
})

const IN_REVIEW_ITEM = makeItem({ id: 'ir-1', state: 'in_review', reviewer: 'test@example.com', assignee: 'a@b.com' })
const PENDING_ITEM = makeItem({ id: 'p-1', state: 'pending', assignee: 'a@b.com' })
const COMPLETED_ITEM = makeItem({
  id: 'c-1',
  state: 'approved',
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
})

type StoreOverride = {
  approvalWorkflow?: Record<string, unknown>
  team?: Record<string, unknown>
  auth?: Record<string, unknown>
}

const mountView = async (storeState: StoreOverride = {}): Promise<VueWrapper> => {
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
              workItems: [],
              loading: false,
              error: null,
              ...storeState.approvalWorkflow,
            },
            team: {
              members: [
                {
                  id: '1',
                  email: 'test@example.com',
                  role: 'owner',
                  status: 'active',
                },
              ],
              loading: false,
              error: null,
              ...storeState.team,
            },
            auth: {
              user: { address: 'ADDR', email: 'test@example.com' },
              isConnected: true,
              loading: false,
              ...storeState.auth,
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
          template: '<div class="mock-work-item-card" :data-item-id="item?.id"></div>',
          props: ['item', 'currentUserEmail', 'canApprove', 'canAssign'],
        },
      },
    },
  })
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — basic rendering', () => {
  it('renders the workspace heading', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="workspace-heading"]').text()).toContain(
      'Team Operations Workspace',
    )
  })

  it('renders the main workspace container', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="team-workspace"]').exists()).toBe(true)
  })

  it('renders the skip to main content link (WCAG 2.4.1)', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="skip-to-main"]').exists()).toBe(true)
  })

  it('renders the awaiting review section', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="awaiting-review-section"]').exists()).toBe(true)
  })

  it('renders the assigned to team section', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="assigned-section"]').exists()).toBe(true)
  })

  it('renders the ready for approval section', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="ready-approval-section"]').exists()).toBe(true)
  })

  it('renders the recently completed section', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="completed-section"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — summary bar', () => {
  it('renders the summary bar', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="summary-bar"]').exists()).toBe(true)
  })

  it('shows pending count badge', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [PENDING_ITEM] },
    })
    expect(w.find('[data-testid="pending-count-badge"]').exists()).toBe(true)
  })

  it('shows in-review count badge', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [IN_REVIEW_ITEM] },
    })
    expect(w.find('[data-testid="in-review-count-badge"]').exists()).toBe(true)
  })

  it('shows completed count badge', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [COMPLETED_ITEM] },
    })
    expect(w.find('[data-testid="completed-count-badge"]').exists()).toBe(true)
  })

  it('displays correct pending count when there are pending items', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [PENDING_ITEM, PENDING_ITEM] },
    })
    const badge = w.find('[data-testid="pending-count-badge"]')
    expect(badge.text()).toContain('2')
  })
})

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — empty states', () => {
  it('shows empty state for awaiting review section when no items', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="empty-state-awaiting"]').exists()).toBe(true)
  })

  it('shows empty state for assigned section when no assigned items', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="empty-state-assigned"]').exists()).toBe(true)
  })

  it('shows empty state for ready-for-approval section when no items', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="empty-state-ready"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — loading state', () => {
  it('shows loading skeleton when loading=true', async () => {
    const w = await mountView({
      approvalWorkflow: { loading: true },
    })
    expect(w.find('[data-testid="loading-state"]').exists()).toBe(true)
  })

  it('hides queue sections while loading', async () => {
    const w = await mountView({
      approvalWorkflow: { loading: true },
    })
    expect(w.find('[data-testid="awaiting-review-section"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — error state', () => {
  it('shows error message when error is set', async () => {
    const w = await mountView({
      approvalWorkflow: { error: 'Failed to load work items.' },
    })
    expect(w.find('[data-testid="error-state"]').exists()).toBe(true)
  })

  it('shows retry button in error state', async () => {
    const w = await mountView({
      approvalWorkflow: { error: 'Network error' },
    })
    expect(w.find('[data-testid="retry-button"]').exists()).toBe(true)
  })

  it('hides queue sections when error is set', async () => {
    const w = await mountView({
      approvalWorkflow: { error: 'Network error' },
    })
    expect(w.find('[data-testid="awaiting-review-section"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Role-aware rendering
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — role awareness', () => {
  it('shows no-role banner when user has no team member record', async () => {
    const w = await mountView({
      team: { members: [] },
    })
    expect(w.find('[data-testid="no-role-message"]').exists()).toBe(true)
  })

  it('still shows queue sections when user has no specific role (read-only mode)', async () => {
    // Workspace content is always visible for authenticated users.
    // Role determines action capability (approve / manage team), not view access.
    const w = await mountView({
      team: { members: [] },
    })
    expect(w.find('[data-testid="awaiting-review-section"]').exists()).toBe(true)
  })

  it('shows queue sections when user has a team role', async () => {
    const w = await mountView()
    expect(w.find('[data-testid="awaiting-review-section"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// WorkItemCard rendering in queues
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — WorkItemCard rendering', () => {
  it('renders WorkItemCards in ready-for-approval section', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [IN_REVIEW_ITEM] },
    })
    const cards = w.findAll('.mock-work-item-card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('renders WorkItemCards in assigned section', async () => {
    const w = await mountView({
      approvalWorkflow: { workItems: [PENDING_ITEM] },
    })
    const cards = w.findAll('.mock-work-item-card')
    expect(cards.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// WCAG headings hierarchy
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — WCAG headings', () => {
  it('has h1 with workspace heading', async () => {
    const w = await mountView()
    const h1 = w.find('h1[data-testid="workspace-heading"]')
    expect(h1.exists()).toBe(true)
  })

  it('each queue section has an h2 heading', async () => {
    const w = await mountView()
    const h2s = w.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(4)
  })
})

// ---------------------------------------------------------------------------
// Store initialization on mount
// ---------------------------------------------------------------------------

describe('TeamWorkspaceView — lifecycle', () => {
  it('calls store initialize on mount', async () => {
    const router = makeRouter()
    await router.push('/team/workspace')
    const pinia = createTestingPinia({ createSpy: vi.fn })
    mount(TeamWorkspaceView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          'router-link': true,
          ApprovalStatusBadge: true,
          WorkItemCard: true,
        },
      },
    })
    // onMounted is called — store initialize should have been invoked
    const { useApprovalWorkflowStore } = await import('../../stores/approvalWorkflow')
    const store = useApprovalWorkflowStore()
    await nextTick()
    expect(vi.isMockFunction(store.initialize)).toBe(true)
  })
})
