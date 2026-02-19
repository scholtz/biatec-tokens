/**
 * TimelineWidget Component Tests
 *
 * Tests for rendering states: loading, empty, populated, truncated.
 * Validates accessibility attributes, actor display, and navigation events.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineWidget from '../TimelineWidget.vue'
import type { TimelineData } from '../../../types/lifecycleCockpit'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTimeline(overrides: Partial<TimelineData> = {}): TimelineData {
  const now = new Date()
  return {
    entries: [
      {
        id: 'tl-1',
        category: 'compliance',
        title: 'KYC Configuration Updated',
        impactSummary: 'KYC provider settings updated.',
        actor: 'compliance@example.com',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        deepLink: '/compliance/setup',
      },
      {
        id: 'tl-2',
        category: 'deployment',
        title: 'Token Deployed',
        impactSummary: 'Token successfully deployed.',
        actor: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN', // 40-char base32-like address
        timestamp: new Date(now.getTime() - 25 * 60 * 60 * 1000), // yesterday
      },
    ],
    lastUpdated: now,
    isTruncated: false,
    totalCount: 2,
    ...overrides,
  }
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('TimelineWidget - loading state', () => {
  it('shows loading text when timeline is null', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: null } })
    expect(wrapper.text()).toContain('Loading timeline')
  })

  it('has aria-live="polite" on loading container', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: null } })
    const liveRegion = wrapper.find('[aria-live="polite"]')
    expect(liveRegion.exists()).toBe(true)
  })

  it('does not render feed region while loading', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: null } })
    expect(wrapper.find('[role="feed"]').exists()).toBe(false)
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('TimelineWidget - empty state', () => {
  it('shows empty-state message when there are no entries', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ entries: [], totalCount: 0 }),
      },
    })
    expect(wrapper.text()).toContain('No activity recorded yet')
  })

  it('shows guidance text in empty state', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ entries: [], totalCount: 0 }),
      },
    })
    expect(wrapper.text()).toContain('Actions will appear here after token operations begin')
  })

  it('does not render feed region in empty state', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ entries: [], totalCount: 0 }),
      },
    })
    expect(wrapper.find('[role="feed"]').exists()).toBe(false)
  })
})

// ─── Populated state ──────────────────────────────────────────────────────────

describe('TimelineWidget - populated state', () => {
  it('renders Activity Timeline heading', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    expect(wrapper.text()).toContain('Activity Timeline')
  })

  it('renders feed region with accessible label', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    const feed = wrapper.find('[role="feed"]')
    expect(feed.exists()).toBe(true)
    expect(feed.attributes('aria-label')).toMatch(/timeline/i)
  })

  it('renders one article per timeline entry', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    const articles = wrapper.findAll('article')
    expect(articles.length).toBe(2)
  })

  it('renders entry titles', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    expect(wrapper.text()).toContain('KYC Configuration Updated')
    expect(wrapper.text()).toContain('Token Deployed')
  })

  it('renders entry impact summaries', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    expect(wrapper.text()).toContain('KYC provider settings updated.')
    expect(wrapper.text()).toContain('Token successfully deployed.')
  })

  it('renders <time> element with datetime attribute for each entry', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    const timeElements = wrapper.findAll('time')
    expect(timeElements.length).toBeGreaterThanOrEqual(2)
    for (const el of timeElements) {
      expect(el.attributes('datetime')).toBeTruthy()
    }
  })

  it('truncates blockchain address actor to XXXX…XXXX', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    // The 40-char base32 address should be displayed truncated
    expect(wrapper.text()).toContain('…')
    expect(wrapper.text()).not.toContain('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN')
  })

  it('shows email local part for email actor', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    expect(wrapper.text()).toContain('compliance')
    // Full email should not appear
    expect(wrapper.text()).not.toContain('@example.com')
  })

  it('shows event count badge', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    // totalCount = 2, so badge should show "2 events"
    expect(wrapper.text()).toContain('2 events')
  })

  it('renders last updated footer', () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })
    expect(wrapper.text()).toContain('Last updated:')
  })
})

// ─── Truncation state ─────────────────────────────────────────────────────────

describe('TimelineWidget - truncated state', () => {
  it('shows truncation notice when isTruncated is true', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ isTruncated: true, totalCount: 50 }),
      },
    })
    expect(wrapper.text()).toContain('Showing')
    expect(wrapper.text()).toContain('50')
  })

  it('does not show truncation notice when isTruncated is false', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ isTruncated: false }),
      },
    })
    expect(wrapper.text()).not.toContain('Showing')
  })
})

// ─── Navigation events ────────────────────────────────────────────────────────

describe('TimelineWidget - navigation events', () => {
  it('emits navigate event when a deep-linked entry is clicked', async () => {
    const wrapper = mount(TimelineWidget, { props: { timeline: makeTimeline() } })

    // Find the first article (KYC entry has a deepLink)
    const firstArticle = wrapper.find('article')
    await firstArticle.trigger('click')

    const emitted = wrapper.emitted('navigate') as string[][]
    expect(emitted).toBeDefined()
    expect(emitted[0][0]).toBe('/compliance/setup')
  })

  it('does not emit navigate event for entries without deepLink', async () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({
          entries: [
            {
              id: 'no-link',
              category: 'transfer',
              title: 'Transfer',
              impactSummary: 'Transfer occurred.',
              actor: 'alice@example.com',
              timestamp: new Date(),
              // no deepLink
            },
          ],
          totalCount: 1,
        }),
      },
    })

    const article = wrapper.find('article')
    await article.trigger('click')
    // No navigate should be emitted (entry has no deepLink)
    const emitted = wrapper.emitted('navigate')
    expect(emitted).toBeUndefined()
  })
})

// ─── Singular/plural badge ────────────────────────────────────────────────────

describe('TimelineWidget - event count badge', () => {
  it('uses singular "event" for totalCount=1', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({
          entries: [makeTimeline().entries[0]],
          totalCount: 1,
        }),
      },
    })
    expect(wrapper.text()).toContain('1 event')
    expect(wrapper.text()).not.toContain('1 events')
  })

  it('uses plural "events" for totalCount=5', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ totalCount: 5 }),
      },
    })
    expect(wrapper.text()).toContain('5 events')
  })

  it('does not show badge when there are no events', () => {
    const wrapper = mount(TimelineWidget, {
      props: {
        timeline: makeTimeline({ entries: [], totalCount: 0 }),
      },
    })
    expect(wrapper.text()).not.toContain('event')
  })
})
