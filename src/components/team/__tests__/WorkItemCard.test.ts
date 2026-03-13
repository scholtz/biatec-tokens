/**
 * Unit Tests: WorkItemCard
 *
 * Tests rendering, conditional action buttons, event emission, and WCAG
 * accessibility attributes for the WorkItemCard component.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkItemCard from '../WorkItemCard.vue'
import type { WorkItem } from '../../../types/approvalWorkflow'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_ITEM: WorkItem = {
  id: 'test-001',
  title: 'Review Whitelist Policy',
  description: 'Review the updated whitelist policy for institutional investors.',
  category: 'whitelist_policy',
  priority: 'high',
  state: 'in_review',
  assignee: 'assignee@example.com',
  reviewer: 'reviewer@example.com',
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  evidenceLinks: [],
  contextPath: '/compliance/policy',
  businessConsequence: 'Without approval, APAC investors cannot onboard.',
  notes: [],
}

const mountCard = (props: Partial<InstanceType<typeof WorkItemCard>['$props']> = {}) =>
  mount(WorkItemCard, {
    props: { item: BASE_ITEM, ...props } as Parameters<typeof WorkItemCard>[0],
    global: {
      stubs: {
        ApprovalStatusBadge: {
          template: '<span class="mock-status-badge">{{ state }}</span>',
          props: ['state', 'size'],
        },
      },
    },
  })

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WorkItemCard — rendering', () => {
  it('renders the item title', () => {
    const w = mountCard()
    expect(w.text()).toContain('Review Whitelist Policy')
  })

  it('renders the item description', () => {
    const w = mountCard()
    expect(w.text()).toContain('Review the updated whitelist policy')
  })

  it('renders a category badge with the correct label', () => {
    const w = mountCard()
    const badge = w.find('[data-testid="category-badge-test-001"]')
    expect(badge.text()).toContain('Whitelist Policy')
  })

  it('renders a priority badge with the correct label', () => {
    const w = mountCard()
    const badge = w.find('[data-testid="priority-badge-test-001"]')
    expect(badge.text()).toContain('High')
  })

  it('renders the approval status badge component', () => {
    const w = mountCard()
    expect(w.find('.mock-status-badge').exists()).toBe(true)
  })

  it('renders the assignee email', () => {
    const w = mountCard()
    expect(w.text()).toContain('assignee@example.com')
  })

  it('renders the reviewer email', () => {
    const w = mountCard()
    expect(w.text()).toContain('reviewer@example.com')
  })

  it('renders the due date', () => {
    const w = mountCard()
    expect(w.find(`[data-testid="due-date-test-001"]`).exists()).toBe(true)
  })

  it('renders the business consequence block', () => {
    const w = mountCard()
    const bc = w.find('[data-testid="business-consequence-test-001"]')
    expect(bc.exists()).toBe(true)
    expect(bc.text()).toContain('APAC investors')
  })

  it('always renders the View Details link', () => {
    const w = mountCard()
    const link = w.find('[data-testid="view-details-test-001"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/compliance/policy')
  })

  it('has role="article" on the card root element (WCAG)', () => {
    const w = mountCard()
    expect(w.find('[data-testid="work-item-card-test-001"]').attributes('role')).toBe('article')
  })

  it('has aria-labelledby pointing to the title element', () => {
    const w = mountCard()
    const card = w.find('[data-testid="work-item-card-test-001"]')
    expect(card.attributes('aria-labelledby')).toContain('work-item-title-test-001')
  })

  it('title element has the matching id', () => {
    const w = mountCard()
    expect(w.find('[data-testid="item-title-test-001"]').attributes('id')).toBe(
      'work-item-title-test-001',
    )
  })
})

// ---------------------------------------------------------------------------
// Approve / Request Changes buttons — conditional visibility
// ---------------------------------------------------------------------------

describe('WorkItemCard — action button visibility', () => {
  it('shows Approve button when canApprove=true AND state=in_review', () => {
    const w = mountCard({ canApprove: true })
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(true)
  })

  it('shows Request Changes button when canApprove=true AND state=in_review', () => {
    const w = mountCard({ canApprove: true })
    expect(w.find('[data-testid="request-changes-btn-test-001"]').exists()).toBe(true)
  })

  it('hides Approve button when canApprove=false', () => {
    const w = mountCard({ canApprove: false })
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(false)
  })

  it('hides Request Changes button when canApprove=false', () => {
    const w = mountCard({ canApprove: false })
    expect(w.find('[data-testid="request-changes-btn-test-001"]').exists()).toBe(false)
  })

  it('hides Approve button when state is not in_review (pending)', () => {
    const w = mount(WorkItemCard, {
      props: { item: { ...BASE_ITEM, state: 'pending' }, canApprove: true },
      global: { stubs: { ApprovalStatusBadge: true } },
    })
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(false)
  })

  it('hides Approve button when state is approved', () => {
    const w = mount(WorkItemCard, {
      props: { item: { ...BASE_ITEM, state: 'approved' }, canApprove: true },
      global: { stubs: { ApprovalStatusBadge: true } },
    })
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(false)
  })

  it('hides Approve button when state is blocked', () => {
    const w = mount(WorkItemCard, {
      props: { item: { ...BASE_ITEM, state: 'blocked' }, canApprove: true },
      global: { stubs: { ApprovalStatusBadge: true } },
    })
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(false)
  })

  it('shows Assign button when canAssign=true', () => {
    const w = mountCard({ canAssign: true })
    expect(w.find('[data-testid="assign-btn-test-001"]').exists()).toBe(true)
  })

  it('hides Assign button when canAssign=false (default)', () => {
    const w = mountCard()
    expect(w.find('[data-testid="assign-btn-test-001"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Event emission
// ---------------------------------------------------------------------------

describe('WorkItemCard — events', () => {
  it('emits approve event with itemId when Approve is clicked', async () => {
    const w = mountCard({ canApprove: true })
    await w.find('[data-testid="approve-btn-test-001"]').trigger('click')
    expect(w.emitted('approve')).toBeTruthy()
    expect(w.emitted('approve')?.[0]).toEqual(['test-001'])
  })

  it('emits requestChanges event with itemId when Request Changes is clicked', async () => {
    const w = mountCard({ canApprove: true })
    await w.find('[data-testid="request-changes-btn-test-001"]').trigger('click')
    expect(w.emitted('requestChanges')).toBeTruthy()
    expect(w.emitted('requestChanges')?.[0]).toEqual(['test-001'])
  })

  it('emits assign event with the full WorkItem when Assign is clicked', async () => {
    const w = mountCard({ canAssign: true })
    await w.find('[data-testid="assign-btn-test-001"]').trigger('click')
    expect(w.emitted('assign')).toBeTruthy()
    expect((w.emitted('assign')?.[0] as [WorkItem])[0].id).toBe('test-001')
  })
})

// ---------------------------------------------------------------------------
// WCAG aria-labels on action buttons
// ---------------------------------------------------------------------------

describe('WorkItemCard — WCAG aria-labels', () => {
  it('Approve button has aria-label including item title', () => {
    const w = mountCard({ canApprove: true })
    const btn = w.find('[data-testid="approve-btn-test-001"]')
    expect(btn.attributes('aria-label')).toContain('Review Whitelist Policy')
  })

  it('Request Changes button has aria-label including item title', () => {
    const w = mountCard({ canApprove: true })
    const btn = w.find('[data-testid="request-changes-btn-test-001"]')
    expect(btn.attributes('aria-label')).toContain('Review Whitelist Policy')
  })

  it('View Details link has aria-label including item title', () => {
    const w = mountCard()
    const link = w.find('[data-testid="view-details-test-001"]')
    expect(link.attributes('aria-label')).toContain('Review Whitelist Policy')
  })
})

// ---------------------------------------------------------------------------
// Read-only state (canApprove=false)
// ---------------------------------------------------------------------------

describe('WorkItemCard — read-only state', () => {
  it('renders without action buttons when canApprove=false and canAssign=false', () => {
    const w = mountCard()
    expect(w.find('[data-testid="approve-btn-test-001"]').exists()).toBe(false)
    expect(w.find('[data-testid="request-changes-btn-test-001"]').exists()).toBe(false)
    expect(w.find('[data-testid="assign-btn-test-001"]').exists()).toBe(false)
    // View Details is always present
    expect(w.find('[data-testid="view-details-test-001"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Missing optional fields
// ---------------------------------------------------------------------------

describe('WorkItemCard — optional fields', () => {
  it('does not render assignee section when assignee is absent', () => {
    const item: WorkItem = { ...BASE_ITEM, assignee: undefined }
    const w = mount(WorkItemCard, {
      props: { item },
      global: { stubs: { ApprovalStatusBadge: true } },
    })
    expect(w.find(`[data-testid="assignee-test-001"]`).exists()).toBe(false)
  })

  it('does not render reviewer section when reviewer is absent', () => {
    const item: WorkItem = { ...BASE_ITEM, reviewer: undefined }
    const w = mount(WorkItemCard, {
      props: { item },
      global: { stubs: { ApprovalStatusBadge: true } },
    })
    expect(w.find(`[data-testid="reviewer-test-001"]`).exists()).toBe(false)
  })

  it('emits no events when no buttons are rendered', () => {
    const w = mountCard()
    expect(w.emitted('approve')).toBeFalsy()
    expect(w.emitted('requestChanges')).toBeFalsy()
    expect(w.emitted('assign')).toBeFalsy()
  })
})
