import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LaunchReadinessPanel from '../LaunchReadinessPanel.vue'
import type { ReadinessItem } from '../../utils/launchReadiness'

function makeItem(overrides: Partial<ReadinessItem> & { id: string }): ReadinessItem {
  return {
    label: `Item ${overrides.id}`,
    description: 'A test readiness item',
    status: 'not_started',
    isRequired: true,
    order: parseInt(overrides.id, 10) || 1,
    estimatedMinutes: 10,
    actionLabel: 'Start',
    actionRoute: '/test',
    ...overrides,
  }
}

const defaultItems: ReadinessItem[] = [
  makeItem({ id: '1', label: 'Organization Profile', status: 'ready', order: 1 }),
  makeItem({ id: '2', label: 'Legal Documents', status: 'in_progress', order: 2 }),
  makeItem({ id: '3', label: 'Identity Verification', status: 'not_started', order: 3 }),
]

describe('LaunchReadinessPanel', () => {
  it('renders without errors with empty items', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: [] },
    })
    expect(wrapper.find('[data-testid="launch-readiness-panel"]').exists()).toBe(true)
  })

  it('renders panel title', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: [] },
    })
    expect(wrapper.find('[data-testid="panel-title"]').text()).toBe('Launch Readiness')
  })

  it('renders all items in the list', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: defaultItems },
    })
    const listItems = wrapper.findAll('[data-testid^="readiness-item-"]')
    expect(listItems).toHaveLength(defaultItems.length)
  })

  it('renders item labels correctly', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: defaultItems },
    })
    const html = wrapper.html()
    expect(html).toContain('Organization Profile')
    expect(html).toContain('Legal Documents')
    expect(html).toContain('Identity Verification')
  })

  it('shows CheckCircleIcon for ready items', () => {
    const items = [makeItem({ id: '1', status: 'ready' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const readyItem = wrapper.find('[data-testid="readiness-item-1"]')
    // Should have status icon area
    expect(readyItem.find('[data-testid="status-icon"]').exists()).toBe(true)
  })

  it('shows ClockIcon for in_progress items', () => {
    const items = [makeItem({ id: '1', status: 'in_progress' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const item = wrapper.find('[data-testid="readiness-item-1"]')
    expect(item.find('[data-testid="status-icon"]').exists()).toBe(true)
  })

  it('shows ExclamationTriangleIcon for needs_attention items', () => {
    const items = [makeItem({ id: '1', status: 'needs_attention' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const item = wrapper.find('[data-testid="readiness-item-1"]')
    expect(item.find('[data-testid="status-icon"]').exists()).toBe(true)
  })

  it('shows XCircleIcon for blocked items', () => {
    const items = [makeItem({ id: '1', status: 'blocked' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const item = wrapper.find('[data-testid="readiness-item-1"]')
    expect(item.find('[data-testid="status-icon"]').exists()).toBe(true)
  })

  it('highlights the next action item with a badge', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', order: 1 }),
      makeItem({ id: '2', status: 'not_started', order: 2 }),
    ]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const badge = wrapper.find('[data-testid="next-action-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('Next step')
  })

  it('shows readiness score', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'not_started' }),
    ]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const score = wrapper.find('[data-testid="readiness-score"]')
    expect(score.exists()).toBe(true)
    // 1/2 items complete = 50
    expect(score.text()).toContain('50')
  })

  it('shows 100 readiness score when all items are complete', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'ready' }),
    ]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const score = wrapper.find('[data-testid="readiness-score"]')
    expect(score.text()).toContain('100')
  })

  it('shows estimated time remaining when items are not complete', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', estimatedMinutes: 10 }),
      makeItem({ id: '2', status: 'not_started', estimatedMinutes: 20 }),
    ]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const timeEl = wrapper.find('[data-testid="time-remaining"]')
    expect(timeEl.exists()).toBe(true)
    expect(timeEl.text()).toContain('20')
  })

  it('shows "Request Token Launch" CTA when all required items are complete', () => {
    const items = [makeItem({ id: '1', status: 'ready', isRequired: true })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const cta = wrapper.find('[data-testid="cta-button"]')
    expect(cta.text()).toContain('Request Token Launch')
  })

  it('shows "Begin Setup" CTA when no items are started', () => {
    const items = [makeItem({ id: '1', status: 'not_started' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const cta = wrapper.find('[data-testid="cta-button"]')
    expect(cta.text()).toContain('Begin Setup')
  })

  it('shows "Fix Issues to Continue" CTA when items need attention', () => {
    const items = [makeItem({ id: '1', status: 'needs_attention' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const cta = wrapper.find('[data-testid="cta-button"]')
    expect(cta.text()).toContain('Fix Issues to Continue')
  })

  it('shows "Continue Setup" CTA when items are in progress', () => {
    const items = [makeItem({ id: '1', status: 'in_progress' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const cta = wrapper.find('[data-testid="cta-button"]')
    expect(cta.text()).toContain('Continue Setup')
  })

  it('emits launch event when CTA clicked in ready state', async () => {
    const items = [makeItem({ id: '1', status: 'ready', isRequired: true })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    await wrapper.find('[data-testid="cta-button"]').trigger('click')
    expect(wrapper.emitted('launch')).toBeTruthy()
  })

  it('emits action event when item action button clicked', async () => {
    const items = [makeItem({ id: '1', status: 'not_started' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    await wrapper.find('[data-testid="item-action-button"]').trigger('click')
    const emitted = wrapper.emitted('action')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ id: '1' })
  })

  it('hides progress bar and item descriptions in compact mode', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: defaultItems, compact: true },
    })
    expect(wrapper.find('[data-testid="progress-bar-container"]').exists()).toBe(false)
  })

  it('shows progress bar in non-compact mode', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: defaultItems, compact: false },
    })
    expect(wrapper.find('[data-testid="progress-bar-container"]').exists()).toBe(true)
  })

  it('has data-testid on key container elements', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: defaultItems },
    })
    expect(wrapper.find('[data-testid="launch-readiness-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="panel-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readiness-score"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="readiness-items-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cta-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cta-button"]').exists()).toBe(true)
  })

  it('does not show action button for ready items', () => {
    const items = [makeItem({ id: '1', status: 'ready' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const item = wrapper.find('[data-testid="readiness-item-1"]')
    expect(item.find('[data-testid="item-action-button"]').exists()).toBe(false)
  })

  it('emits action with next action item when CTA clicked in not-ready state', async () => {
    const items = [
      makeItem({ id: '1', status: 'ready', order: 1, isRequired: false }),
      makeItem({ id: '2', status: 'not_started', order: 2 }),
    ]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    await nextTick()
    await wrapper.find('[data-testid="cta-button"]').trigger('click')
    const emitted = wrapper.emitted('action')
    expect(emitted).toBeTruthy()
  })

  it('does not show CTA section when items are empty', () => {
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items: [] },
    })
    expect(wrapper.find('[data-testid="cta-section"]').exists()).toBe(false)
  })

  it('shows progress bar with correct aria attributes', () => {
    const items = [makeItem({ id: '1', status: 'ready' }), makeItem({ id: '2', status: 'not_started' })]
    const wrapper = mount(LaunchReadinessPanel, {
      props: { items },
    })
    const bar = wrapper.find('[data-testid="progress-bar"]')
    expect(bar.attributes('role')).toBe('progressbar')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-valuenow')).toBe('50')
  })
})
