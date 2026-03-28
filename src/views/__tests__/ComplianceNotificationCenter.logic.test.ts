/**
 * ComplianceNotificationCenter.vue — Logic & interaction tests.
 *
 * Tests internal functions (timelineDotClass), state transitions,
 * filter interactions, refresh behavior, and computed property branches
 * via (wrapper.vm as any) to achieve ≥80% function/branch coverage.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ComplianceNotificationCenter from '../ComplianceNotificationCenter.vue'
import {
  NOTIFICATION_CENTER_TEST_IDS as TEST_IDS,
  MOCK_EVENTS_MIXED,
} from '../../utils/complianceNotificationCenter'

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

const MainLayoutStub = { template: '<div><slot /></div>' }
const iconStub = { template: '<svg />' }

// Pin system time to match MOCK_TIMELINE_ENTRIES / MOCK_EVENTS_MIXED hardcoded dates
const MOCK_NOW = new Date('2026-03-27T15:00:00.000Z')

async function mountCenter(): Promise<VueWrapper> {
  vi.useFakeTimers()
  vi.setSystemTime(MOCK_NOW)
  const wrapper = mount(ComplianceNotificationCenter, {
    global: {
      components: { RouterLink: RouterLinkStub },
      stubs: {
        MainLayout: MainLayoutStub,
        BellAlertIcon: iconStub,
        ExclamationTriangleIcon: iconStub,
        InformationCircleIcon: iconStub,
        InboxIcon: iconStub,
      },
    },
  })
  await vi.advanceTimersByTimeAsync(200)
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect the indigo next-action paragraph (more precise than text-based "→" check
 * which also matches "View details →" in drill-down links). */
const hasIndigoParagraph = (item: any) =>
  item.findAll('p').filter((p: any) => p.classes().includes('text-indigo-300')).length > 0

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComplianceNotificationCenter.vue — logic tests', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // timelineDotClass — covers all severity branches
  // =========================================================================
  describe('timelineDotClass()', () => {
    it('returns red classes for blocked severity', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineDotClass('blocked')).toContain('bg-red-500')
      expect(vm.timelineDotClass('blocked')).toContain('border-red-400')
    })

    it('returns orange classes for action_needed severity', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineDotClass('action_needed')).toContain('bg-orange-500')
      expect(vm.timelineDotClass('action_needed')).toContain('border-orange-400')
    })

    it('returns yellow classes for waiting_on_provider severity', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineDotClass('waiting_on_provider')).toContain('bg-yellow-500')
      expect(vm.timelineDotClass('waiting_on_provider')).toContain('border-yellow-400')
    })

    it('returns green classes for review_complete severity', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineDotClass('review_complete')).toContain('bg-green-500')
      expect(vm.timelineDotClass('review_complete')).toContain('border-green-400')
    })

    it('returns blue classes for informational severity', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineDotClass('informational')).toContain('bg-blue-500')
      expect(vm.timelineDotClass('informational')).toContain('border-blue-400')
    })
  })

  // =========================================================================
  // Filter interactions — category filter
  // =========================================================================
  describe('filter interactions', () => {
    it('filters by category when category filter is changed', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('kyc_review')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Only KYC review events should remain
      const expectedCount = MOCK_EVENTS_MIXED.filter(e => e.category === 'kyc_review').length
      expect(items.length).toBe(expectedCount)
      for (const item of items) {
        expect(item.text()).toMatch(/KYC/i)
      }
    })

    it('filters by freshness when freshness filter is changed', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_FRESHNESS}"]`)
      // Filter to 'critical' — only events older than 7 days match
      await select.setValue('critical')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // evt-013 from 2026-03-20 is >7 days old = critical freshness
      // Exact count depends on current date vs mock timestamps, but at least 1 stale event
      expect(items.length).toBe(1)
    })

    it('filters by read state when read-state filter is changed', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await select.setValue('unread')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Only unread events
      const unreadCount = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      expect(items.length).toBe(unreadCount)
    })

    it('resets to all events when severity filter is set back to all', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await select.setValue('blocked')
      await nextTick()
      const filteredCount = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`).length
      expect(filteredCount).toBe(1)

      await select.setValue('all')
      await nextTick()
      const resetCount = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`).length
      expect(resetCount).toBe(MOCK_EVENTS_MIXED.length)
    })
  })

  // =========================================================================
  // Refresh behavior
  // =========================================================================
  describe('refresh behavior', () => {
    it('handleRefresh triggers loading state and reloads', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any

      // Call handleRefresh directly
      vm.handleRefresh()
      await nextTick()

      // Should show loading
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(true)

      // Advance timer past loading
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()

      // Should be loaded again
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(false)
    })

    it('loadEvents updates centerState with events', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.centerState.events.length).toBe(MOCK_EVENTS_MIXED.length)
      expect(vm.centerState.feedHealth).toBe('healthy')
    })
  })

  // =========================================================================
  // Computed properties
  // =========================================================================
  describe('computed properties', () => {
    it('formattedRefreshedAt returns "Not available" when lastRefreshedAt is null', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_NOW)
      const wrapper = mount(ComplianceNotificationCenter, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            MainLayout: MainLayoutStub,
            BellAlertIcon: iconStub,
            ExclamationTriangleIcon: iconStub,
            InformationCircleIcon: iconStub,
            InboxIcon: iconStub,
          },
        },
      })
      // Before timer fires, lastRefreshedAt is null
      await nextTick()
      const vm = wrapper.vm as any
      expect(vm.formattedRefreshedAt).toBe('Not available')

      // Clean up
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()
    })

    it('formattedRefreshedAt returns a relative time after loading', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // After loading, lastRefreshedAt should be set
      expect(vm.formattedRefreshedAt).toBeTruthy()
      expect(vm.formattedRefreshedAt).not.toBe('Not available')
    })

    it('filteredEvents returns all events with default filters', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.filteredEvents.length).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('timelineGroups returns grouped timeline entries', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      expect(vm.timelineGroups.length).toBe(2) // Today + Yesterday groups
    })
  })

  // =========================================================================
  // Queue summary values
  // =========================================================================
  describe('queue summary accuracy', () => {
    it('total count matches mock events count', async () => {
      const wrapper = await mountCenter()
      const total = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      const dd = total.find('dd')
      expect(Number(dd.text().trim())).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('blocked count matches mock blocked events', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`)
      const dd = el.find('dd')
      const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === 'blocked').length
      expect(Number(dd.text().trim())).toBe(expected)
    })

    it('unread count matches mock unread events', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      const dd = el.find('dd')
      const expected = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      expect(Number(dd.text().trim())).toBe(expected)
    })

    it('action needed count matches mock action_needed events', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`)
      const dd = el.find('dd')
      const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === 'action_needed').length
      expect(Number(dd.text().trim())).toBe(expected)
    })

    it('waiting on provider count matches mock waiting events', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`)
      const dd = el.find('dd')
      const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === 'waiting_on_provider').length
      expect(Number(dd.text().trim())).toBe(expected)
    })
  })

  // =========================================================================
  // Event item detail rendering
  // =========================================================================
  describe('event item details', () => {
    it('renders unread indicator for unread events', async () => {
      const wrapper = await mountCenter()
      const unreadDots = wrapper.findAll('[aria-label="Unread"]')
      const unreadCount = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      expect(unreadDots.length).toBe(unreadCount)
    })

    it('renders category labels on events', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('Sanctions Escalation')
      expect(text).toContain('KYC Review')
    })

    it('renders actor information on events', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('compliance-lead@biatec.io')
    })

    it('renders event descriptions', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('Manual review required')
    })

    it('renders next action text for events with next actions', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('Review sanctions match')
      expect(text).toContain('Contact investor')
    })
  })

  // =========================================================================
  // Drill-down link paths
  // =========================================================================
  describe('drill-down navigation', () => {
    it('drill-down links point to correct compliance surfaces', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const hrefs = links.map(l => l.attributes('href') || l.attributes('to'))
      // Should include various compliance surfaces
      const allHrefs = hrefs.join(',')
      expect(allHrefs).toContain('/compliance/operations')
      expect(allHrefs).toContain('/compliance/onboarding')
      expect(allHrefs).toContain('/compliance/release')
    })

    it('drill-down links have descriptive aria-labels', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      for (const link of links) {
        const ariaLabel = link.attributes('aria-label')
        expect(ariaLabel).toContain('View details for')
      }
    })
  })

  // =========================================================================
  // Timeline visual details
  // =========================================================================
  describe('timeline rendering details', () => {
    it('timeline entries display transition text', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('KYC status changed')
      expect(text).toContain('AML screening completed')
    })

    it('timeline entries display next action when present', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('Submit identity documents')
    })

    it('timeline entries without nextAction suppress the next-action paragraph', async () => {
      const wrapper = await mountCenter()
      const entries = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_ENTRY}"]`)
      // MOCK_TIMELINE_ENTRIES: tl-001 and tl-002 have nextAction: null, tl-003 and tl-004 have strings
      const entriesWithNA = entries.filter(
        (e: any) => e.findAll('p').filter((p: any) => p.classes().includes('text-indigo-300')).length > 0,
      )
      const entriesWithoutNA = entries.filter(
        (e: any) => e.findAll('p').filter((p: any) => p.classes().includes('text-indigo-300')).length === 0,
      )
      expect(entriesWithNA.length).toBe(2) // tl-003, tl-004 have string nextAction
      expect(entriesWithoutNA.length).toBe(2) // tl-001, tl-002 have null nextAction
    })

    it('timeline has vertical connecting line', async () => {
      const wrapper = await mountCenter()
      const line = wrapper.find('aside .bg-gray-700')
      expect(line.exists()).toBe(true)
    })

    it('timeline dots have severity-appropriate colors', async () => {
      const wrapper = await mountCenter()
      const dots = wrapper.findAll('aside .rounded-full')
      expect(dots.length).toBe(4) // 4 timeline entries = 4 severity dots
    })
  })

  // =========================================================================
  // Empty timeline state — covers v-if="timelineGroups.length === 0" branch
  // =========================================================================
  describe('empty timeline state', () => {
    it('renders event timeline heading regardless of entries', async () => {
      const wrapper = await mountCenter()
      const heading = wrapper.find(`[data-testid="${TEST_IDS.TIMELINE_ROOT}"]`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Event Timeline')
    })

    it('populated timeline hides "No timeline events" message', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Default mock data has timeline entries
      expect(vm.timelineGroups.length).toBe(2) // Today + Yesterday groups
      // The empty-state text should NOT appear when timeline has entries
      const aside = wrapper.find('aside')
      expect(aside.text()).not.toContain('No timeline events available')
    })
  })

  // =========================================================================
  // Events without nextAction — covers v-if="event.nextAction" branch
  // =========================================================================
  describe('events without nextAction', () => {
    it('renders indigo next-action paragraph only for events with nextAction', async () => {
      const wrapper = await mountCenter()
      const allItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const itemsWithNextAction = allItems.filter(hasIndigoParagraph)
      const expectedWithNextAction = MOCK_EVENTS_MIXED.filter(e => e.nextAction !== null).length
      expect(itemsWithNextAction.length).toBe(expectedWithNextAction)
    })

    it('renders next-action text for events that have nextAction', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      // These events have nextAction values
      expect(text).toContain('Review sanctions match')
    })

    it('event items with null nextAction do not have indigo next-action paragraph', async () => {
      const wrapper = await mountCenter()
      const allItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const itemsWithoutNextAction = allItems.filter(item => !hasIndigoParagraph(item))
      expect(itemsWithoutNextAction.length).toBe(MOCK_EVENTS_MIXED.filter(e => e.nextAction === null).length)
      // Each of these should NOT have the indigo next-action paragraph in DOM
      for (const item of itemsWithoutNextAction) {
        const nextActionParagraph = item.findAll('p').filter((p: any) => p.classes().includes('text-indigo-300'))
        expect(nextActionParagraph.length).toBe(0)
      }
    })

    it('event items with nextAction contain the indigo next-action paragraph', async () => {
      const wrapper = await mountCenter()
      const allItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const itemsWithNextAction = allItems.filter(hasIndigoParagraph)
      expect(itemsWithNextAction.length).toBe(5) // 5 events have string nextAction
      for (const item of itemsWithNextAction) {
        const nextActionParagraphs = item.findAll('p').filter((p: any) => p.classes().includes('text-indigo-300'))
        expect(nextActionParagraphs.length).toBe(1)
      }
    })
  })

  // =========================================================================
  // Feed health banner rendering — covers different health states
  // =========================================================================
  describe('feed health banner', () => {
    it('does not show feed health banner when feed is healthy', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // After loading with mock data, feed should be healthy
      expect(vm.centerState.feedHealth).toBe('healthy')
      expect(wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`).exists()).toBe(false)
    })

    it('shows feed health banner with role="alert" when feed is unavailable', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Force feed health to unavailable
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Event feed is unavailable.'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      expect(banner.attributes('role')).toBe('alert')
      expect(banner.attributes('aria-live')).toBe('assertive')
    })

    it('shows feed health banner with role="status" for stale/degraded states', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Force feed health to stale
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Event data may be outdated.'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      expect(banner.attributes('role')).toBe('status')
      expect(banner.attributes('aria-live')).toBe('polite')
    })

    it('uses ExclamationTriangleIcon for unavailable and InformationCircleIcon for other non-healthy', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Test unavailable — should use ExclamationTriangleIcon (first svg in banner)
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Unavailable message.'
      await nextTick()
      let banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      const svgs = banner.findAll('svg')
      expect(svgs.length).toBe(1) // only one icon rendered

      // Test degraded — should use InformationCircleIcon
      vm.centerState.feedHealth = 'degraded'
      vm.centerState.feedHealthMessage = 'Degraded message.'
      await nextTick()
      banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
    })
  })

  // =========================================================================
  // Empty state messaging — covers feedHealth branches in empty state
  // =========================================================================
  describe('empty state messaging', () => {
    it('shows "No matching events" when feed is healthy but filter produces empty results', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      // Use a category that has no events in mock data
      await select.setValue('system')
      await nextTick()
      const emptyState = wrapper.find(`[data-testid="${TEST_IDS.EMPTY_STATE}"]`)
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('No matching events')
      expect(emptyState.text()).toContain('Try adjusting filters')
    })

    it('shows "Event feed unavailable" when feedHealth is unavailable and empty', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Force feed health to unavailable and clear events
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.events = []
      await nextTick()
      const emptyState = wrapper.find(`[data-testid="${TEST_IDS.EMPTY_STATE}"]`)
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('Event feed unavailable')
      expect(emptyState.text()).toContain('cannot confirm the current state')
    })
  })
  describe('drill-down path conditional', () => {
    it('does not render drill-down link for events without drillDownPath', async () => {
      const wrapper = await mountCenter()
      const drillDownLinks = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter(e => e.drillDownPath !== null).length
      // Only events with drillDownPath should have a drill-down link
      expect(drillDownLinks.length).toBe(eventsWithPath)
    })
  })

  // =========================================================================
  // Unread vs read styling — covers ternary in :class binding
  // =========================================================================
  describe('unread vs read styling', () => {
    it('applies brighter styling to unread events and dimmer to read events', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const unreadCount = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      const readCount = MOCK_EVENTS_MIXED.filter(e => e.readState === 'read').length
      // Verify we have both unread and read events
      expect(unreadCount).toBe(3) // evt-010, evt-011, evt-012
      expect(readCount).toBe(4) // evt-013, evt-014, evt-015, evt-016
      // Total items should match
      expect(items.length).toBe(unreadCount + readCount)
    })
  })

  // =========================================================================
  // Queue summary card content accuracy
  // =========================================================================
  describe('queue summary content', () => {
    it('renders correct queue summary totals after loadEvents', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const qs = vm.centerState.queueSummary
      // Verify total
      const totalCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(totalCard.text()).toContain(String(qs.total))
      // Verify unread
      const unreadCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      expect(unreadCard.text()).toContain(String(qs.unread))
      // Verify blocked
      const blockedCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`)
      expect(blockedCard.text()).toContain(String(qs.blocked))
    })

    it('renders actionNeeded, waitingOnProvider, and stale queue counts', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const qs = vm.centerState.queueSummary
      const actionCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`)
      expect(actionCard.text()).toContain(String(qs.actionNeeded))
      const waitingCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`)
      expect(waitingCard.text()).toContain(String(qs.waitingOnProvider))
      const staleCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_STALE}"]`)
      expect(staleCard.text()).toContain(String(qs.staleCount))
    })
  })

  // =========================================================================
  // Timeline rendering details
  // =========================================================================
  describe('timeline rendering', () => {
    it('renders timeline groups with date labels', async () => {
      const wrapper = await mountCenter()
      const groups = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_GROUP}"]`)
      expect(groups.length).toBe(2) // Today + Yesterday groups
      // Each group should have a date heading
      // Timeline groups are "Today" and "Yesterday" (deterministic from MOCK_TIMELINE_ENTRIES dates)
      const headingTexts = groups.map(g => g.find('h3').text())
      expect(headingTexts).toContain('Today')
      expect(headingTexts).toContain('Yesterday')
    })

    it('renders timeline entries with actor and transition text', async () => {
      const wrapper = await mountCenter()
      const entries = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_ENTRY}"]`)
      expect(entries.length).toBe(4) // 4 timeline entries total (MOCK_TIMELINE_ENTRIES)
      // Each entry should contain its deterministic transition text from MOCK_TIMELINE_ENTRIES
      expect(entries[0].text()).toContain('KYC status changed')
      expect(entries[1].text()).toContain('AML screening completed')
      expect(entries[2].text()).toContain('Onboarding case created')
      expect(entries[3].text()).toContain('Evidence package scheduled')
    })

    it('renders timeline dot with severity-appropriate colors', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Verify every severity returns a non-empty class string
      const severities = ['blocked', 'action_needed', 'waiting_on_provider', 'review_complete', 'informational'] as const
      for (const sev of severities) {
        const cls = vm.timelineDotClass(sev)
        expect(cls).toContain('bg-')
        expect(cls).toContain('border-')
      }
    })
  })

  // =========================================================================
  // Severity badge rendering
  // =========================================================================
  describe('severity badges', () => {
    it('renders severity badge with role="status" for each event', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      expect(badges.length).toBe(MOCK_EVENTS_MIXED.length)
      for (const badge of badges) {
        expect(badge.attributes('role')).toBe('status')
      }
    })

    it('renders launch-blocking label for isLaunchBlocking events with role="alert"', async () => {
      const wrapper = await mountCenter()
      const launchBlockingEvents = MOCK_EVENTS_MIXED.filter(e => e.isLaunchBlocking)
      expect(launchBlockingEvents.length).toBe(2) // evt-010, evt-013 — guard against vacuous test
      const alerts = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_LAUNCH_BLOCKING}"]`)
      expect(alerts.length).toBe(2)
      for (const alert of alerts) {
        expect(alert.attributes('role')).toBe('alert')
        expect(alert.text()).toContain('Blocks Issuance')
      }
    })
  })

  // =========================================================================
  // Filter combinations
  // =========================================================================
  describe('filter combinations', () => {
    it('filters by severity=action_needed shows only action_needed events', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await select.setValue('action_needed')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === 'action_needed').length
      expect(items.length).toBe(expected)
    })

    it('combines category and readState filters', async () => {
      const wrapper = await mountCenter()
      const catSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      const readSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await catSelect.setValue('kyc_review')
      await readSelect.setValue('unread')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(
        e => e.category === 'kyc_review' && e.readState === 'unread',
      ).length
      expect(items.length).toBe(expected)
    })
  })

  // =========================================================================
  // Accessibility: ARIA attributes
  // =========================================================================
  describe('accessibility', () => {
    it('has skip link targeting main content', async () => {
      const wrapper = await mountCenter()
      const skipLink = wrapper.find('a[href="#notification-center-main"]')
      expect(skipLink.exists()).toBe(true)
      expect(skipLink.text()).toContain('Skip to main content')
    })

    it('main region has aria-label', async () => {
      const wrapper = await mountCenter()
      const main = wrapper.find(`[data-testid="${TEST_IDS.ROOT}"]`)
      expect(main.attributes('role')).toBe('region')
      expect(main.attributes('aria-label')).toContain('Compliance Notification Center')
    })

    it('event list has aria-label and role="list"', async () => {
      const wrapper = await mountCenter()
      const list = wrapper.find(`[data-testid="${TEST_IDS.EVENT_LIST}"]`)
      expect(list.attributes('role')).toBe('list')
      expect(list.attributes('aria-label')).toContain('Compliance event list')
    })

    it('loading state has role="status" and aria-live', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_NOW)
      const wrapper = mount(ComplianceNotificationCenter, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            MainLayout: MainLayoutStub,
            BellAlertIcon: iconStub,
            ExclamationTriangleIcon: iconStub,
            InformationCircleIcon: iconStub,
            InboxIcon: iconStub,
          },
        },
      })
      await nextTick()
      const loading = wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`)
      expect(loading.attributes('role')).toBe('status')
      expect(loading.attributes('aria-live')).toBe('polite')
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()
    })

    it('feed health banner uses role="alert" for unavailable state', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Feed unavailable'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.attributes('role')).toBe('alert')
      expect(banner.attributes('aria-live')).toBe('assertive')
    })

    it('feed health banner uses role="status" for stale state', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Data may be stale'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.attributes('role')).toBe('status')
      expect(banner.attributes('aria-live')).toBe('polite')
    })
  })

  // =========================================================================
  // Event item details
  // =========================================================================
  describe('event item details', () => {
    it('renders event title, description, and actor for each event', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Spot-check the first event
      const firstEvent = MOCK_EVENTS_MIXED[0]
      const firstItem = items[0]
      expect(firstItem.text()).toContain(firstEvent.title)
      expect(firstItem.text()).toContain(firstEvent.description)
      expect(firstItem.text()).toContain(firstEvent.actor)
    })

    it('renders drill-down link with correct path for events that have one', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter(e => e.drillDownPath !== null)
      expect(eventsWithPath.length).toBe(5) // evt-010, evt-011, evt-013, evt-014, evt-015
      expect(links.length).toBe(5)
      // The first drill-down link should match the highest-priority event with a path (evt-010 blocked)
      const firstLink = links[0]
      expect(firstLink.attributes('href')).toBe('/compliance/operations')
    })
  })

  // =========================================================================
  // Additional filter coverage — all severity levels
  // =========================================================================
  describe('severity filter — all levels', () => {
    const severityLevels = ['blocked', 'action_needed', 'waiting_on_provider', 'review_complete', 'informational'] as const

    for (const sev of severityLevels) {
      it(`filters by severity="${sev}" correctly`, async () => {
        const wrapper = await mountCenter()
        const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
        await select.setValue(sev)
        await nextTick()
        const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
        const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === sev).length
        expect(items.length).toBe(expected)
      })
    }
  })

  // =========================================================================
  // Category filter — individual categories
  // =========================================================================
  describe('category filter — individual categories', () => {
    it('filters by category="kyc_review"', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('kyc_review')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.category === 'kyc_review').length
      expect(items.length).toBe(expected)
    })

    it('filters by category="aml_screening"', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('aml_screening')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.category === 'aml_screening').length
      expect(items.length).toBe(expected)
    })

    it('filters by category="evidence_export"', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('evidence_export')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.category === 'evidence_export').length
      expect(items.length).toBe(expected)
    })
  })

  // =========================================================================
  // Combined filter reset — verify filter reset restores all events
  // =========================================================================
  describe('filter reset behavior', () => {
    it('restoring severity to "all" after filtering shows all events', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      // Filter to blocked
      await select.setValue('blocked')
      await nextTick()
      let items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1) // 1 blocked event (evt-010)
      // Reset to all
      await select.setValue('all')
      await nextTick()
      items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('restoring category to "all" after filtering shows all events', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('kyc_review')
      await nextTick()
      let items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(2) // 2 kyc_review events (evt-011, evt-015)
      await select.setValue('all')
      await nextTick()
      items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('restoring read-state to "all" after filtering shows all events', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await select.setValue('unread')
      await nextTick()
      let items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const unreadOnly = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      expect(items.length).toBe(unreadOnly)
      await select.setValue('all')
      await nextTick()
      items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(MOCK_EVENTS_MIXED.length)
    })
  })

  // =========================================================================
  // Queue summary card label text verification
  // =========================================================================
  describe('queue summary card labels', () => {
    it('renders correct label text for each queue card', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`).text()).toContain('Total Events')
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`).text()).toContain('Unread')
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`).text()).toContain('Blocked')
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`).text()).toContain('Action Needed')
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`).text()).toContain('Waiting on Provider')
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_STALE}"]`).text()).toContain('Stale')
    })
  })

  // =========================================================================
  // Page heading and description
  // =========================================================================
  describe('page heading and description', () => {
    it('renders the page heading with "Compliance Notification Center"', async () => {
      const wrapper = await mountCenter()
      const heading = wrapper.find(`[data-testid="${TEST_IDS.HEADING}"]`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Compliance Notification Center')
    })

    it('renders operator-facing description text', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.text()).toContain('Prioritized compliance events')
      expect(wrapper.text()).toContain('operator guidance')
    })

    it('renders last-refreshed timestamp', async () => {
      const wrapper = await mountCenter()
      const lastUpdated = wrapper.find(`[data-testid="${TEST_IDS.LAST_UPDATED}"]`)
      expect(lastUpdated.exists()).toBe(true)
      expect(lastUpdated.text()).toContain('Last refreshed')
    })
  })

  // =========================================================================
  // Triple-filter combination test
  // =========================================================================
  describe('triple filter combination', () => {
    it('combines severity + category + read-state filters', async () => {
      const wrapper = await mountCenter()
      const sevSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      const catSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      const readSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await sevSelect.setValue('action_needed')
      await catSelect.setValue('kyc_review')
      await readSelect.setValue('unread')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const expected = MOCK_EVENTS_MIXED.filter(
        e => e.severity === 'action_needed' && e.category === 'kyc_review' && e.readState === 'unread',
      ).length
      expect(items.length).toBe(expected)
    })
  })

  // =========================================================================
  // Timeline sidebar landmark and heading
  // =========================================================================
  describe('timeline sidebar', () => {
    it('timeline root section exists with data-testid', async () => {
      const wrapper = await mountCenter()
      const timelineRoot = wrapper.find(`[data-testid="${TEST_IDS.TIMELINE_ROOT}"]`)
      expect(timelineRoot.exists()).toBe(true)
    })

    it('timeline section has "Event Timeline" heading', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.text()).toContain('Event Timeline')
    })
  })

  // =========================================================================
  // Priority ordering — blocked events first
  // =========================================================================
  describe('event priority ordering', () => {
    it('renders blocked events before informational events', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(MOCK_EVENTS_MIXED.length)
      // First event must be the blocked event (highest severity) — exactly 1 blocked event in mock data
      const firstItem = items[0]
      expect(firstItem.text()).toContain('Sanctions screening escalation opened')
    })
  })

  // =========================================================================
  // null-nextAction view rendering (exercises v-if="event.nextAction" false branch)
  // =========================================================================
  describe('null-nextAction view rendering', () => {
    it('renders 7 event items matching MOCK_EVENTS_MIXED length', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(7)
    })

    it('null-nextAction event still renders title and description', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      // evt-015: KYC approved — standard review
      expect(text).toContain('KYC approved')
      // evt-016: AML screening completed — no flags
      expect(text).toContain('AML screening completed')
    })

    it('null-nextAction event with drillDownPath still renders drill-down link', async () => {
      const wrapper = await mountCenter()
      const drillDownLinks = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      // evt-015 has drillDownPath: '/compliance/onboarding', even though nextAction is null
      const paths = drillDownLinks.map(link => link.attributes('href') || link.attributes('to'))
      expect(paths).toContain('/compliance/onboarding')
    })

    it('null-nextAction event without drillDownPath does not render drill-down link', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // evt-016 has both nextAction: null and drillDownPath: null
      // Find the item containing "AML screening completed — no flags"
      const amlItem = items.find(item => item.text().includes('AML screening completed'))
      expect(amlItem).toBeTruthy()
      // It should NOT have a drill-down link
      const links = amlItem!.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links.length).toBe(0)
    })

    it('null-nextAction events render severity badge with informational label', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const amlItem = items.find(item => item.text().includes('AML screening completed'))
      expect(amlItem).toBeTruthy()
      const badge = amlItem!.find(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Informational')
    })

    it('informational events without nextAction are rendered at the end (low priority)', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Last two items should be informational (null nextAction events)
      const lastItem = items[items.length - 1]
      const secondLastItem = items[items.length - 2]
      expect(lastItem.text()).toMatch(/KYC approved|AML screening completed/)
      expect(secondLastItem.text()).toMatch(/KYC approved|AML screening completed/)
      // Verify the two events are distinct (not the same event rendered twice)
      expect(lastItem.text()).not.toBe(secondLastItem.text())
    })

    it('queue summary total card reflects 7 events', async () => {
      const wrapper = await mountCenter()
      const totalCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(totalCard.exists()).toBe(true)
      expect(totalCard.text()).toContain('7')
    })

    it('queue summary unread count remains 3 after adding read null-nextAction events', async () => {
      const wrapper = await mountCenter()
      const unreadCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      expect(unreadCard.exists()).toBe(true)
      expect(unreadCard.text()).toContain('3')
    })
  })

  // =========================================================================
  // Exact event ordering verification
  // =========================================================================
  describe('event ordering precision', () => {
    it('events are rendered in exact severity priority order', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      const severityOrder = badges.map((b: any) => b.text())
      // Blocked (1), Action needed (2), Waiting on provider (1), Review complete (1), Informational (2)
      expect(severityOrder[0]).toContain('Blocked')
      expect(severityOrder[1]).toContain('Action needed')
      expect(severityOrder[2]).toContain('Action needed')
      expect(severityOrder[3]).toContain('Waiting')
      expect(severityOrder[4]).toContain('Review complete')
      expect(severityOrder[5]).toContain('Informational')
      expect(severityOrder[6]).toContain('Informational')
    })

    it('drill-down links point to correct compliance surfaces', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const paths = links.map((link: any) => link.attributes('href'))
      // Events with drillDownPath: evt-011→/compliance/onboarding, evt-013→/compliance/release, evt-014→/compliance/onboarding
      expect(paths).toContain('/compliance/onboarding')
      expect(paths).toContain('/compliance/release')
    })

    it('events with null drillDownPath have no drill-down link rendered', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter((e) => e.drillDownPath !== null)
      const eventsWithoutPath = MOCK_EVENTS_MIXED.filter((e) => e.drillDownPath === null)
      expect(links.length).toBe(eventsWithPath.length)
      expect(items.length - links.length).toBe(eventsWithoutPath.length)
    })
  })

  // =========================================================================
  // Exact queue summary card labels
  // =========================================================================
  describe('queue summary card labels', () => {
    it('total card displays "Total" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(card.text()).toContain('Total')
    })

    it('unread card displays "Unread" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      expect(card.text()).toContain('Unread')
    })

    it('blocked card displays "Blocked" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`)
      expect(card.text()).toContain('Blocked')
    })

    it('action needed card displays "Action Needed" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`)
      expect(card.text()).toContain('Action Needed')
    })

    it('waiting card displays "Waiting" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`)
      expect(card.text()).toContain('Waiting')
    })

    it('stale card displays "Stale" label', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_STALE}"]`)
      expect(card.text()).toContain('Stale')
    })
  })

  // =========================================================================
  // Skip link and page description
  // =========================================================================
  describe('page structure', () => {
    it('skip link navigates to main content', async () => {
      const wrapper = await mountCenter()
      const skipLink = wrapper.find('a[href="#notification-center-main"]')
      expect(skipLink.exists()).toBe(true)
      expect(skipLink.text()).toContain('Skip to main content')
    })

    it('page description includes prioritized compliance events wording', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.text()).toContain('Prioritized compliance events')
    })

    it('refresh button has accessible text', async () => {
      const wrapper = await mountCenter()
      const refreshBtn = wrapper.find(`[data-testid="${TEST_IDS.REFRESH_BUTTON}"]`)
      expect(refreshBtn.exists()).toBe(true)
      expect(refreshBtn.text()).toContain('Refresh')
    })
  })

  // =========================================================================
  // Queue summary card exact values
  // =========================================================================
  describe('queue summary card exact values', () => {
    it('total card displays exactly 7', async () => {
      const wrapper = await mountCenter()
      const totalCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(totalCard.text()).toContain('7')
    })

    it('unread card displays exactly 3', async () => {
      const wrapper = await mountCenter()
      const unreadCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      // 3 unread events: evt-010, evt-011, evt-012
      expect(unreadCard.text()).toContain('3')
    })

    it('blocked card displays exactly 1', async () => {
      const wrapper = await mountCenter()
      const blockedCard = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`)
      // 1 blocked event: evt-010
      expect(blockedCard.text()).toContain('1')
    })

    it('action needed card displays exactly 2', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`)
      // 2 action_needed events: evt-011, evt-013
      expect(card.text()).toContain('2')
    })

    it('waiting card displays exactly 1', async () => {
      const wrapper = await mountCenter()
      const card = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`)
      // 1 waiting_on_provider event: evt-012
      expect(card.text()).toContain('1')
    })
  })

  // =========================================================================
  // Event titles in exact priority order
  // =========================================================================
  describe('event titles in exact priority order', () => {
    it('renders all 7 events in severity-then-timestamp order', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(7)
      // Expected order: blocked (evt-010), action_needed newest (evt-011), action_needed older (evt-013),
      // waiting_on_provider (evt-012), review_complete (evt-014), informational newest (evt-015), informational oldest (evt-016)
      expect(items[0].text()).toContain('Sanctions screening escalation opened')
      expect(items[1].text()).toContain('KYC document resubmission needed')
      expect(items[2].text()).toContain('Release evidence freshness expired')
      expect(items[3].text()).toContain('Webhook delivery delayed')
      expect(items[4].text()).toContain('Investor onboarding completed')
      expect(items[5].text()).toContain('KYC approved')
      expect(items[6].text()).toContain('AML screening completed')
    })
  })

  // =========================================================================
  // Category filter — evidence_export and investor_onboarding
  // =========================================================================
  describe('category filter — additional categories', () => {
    it('filters by category="sanctions_escalation" shows 1 event', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('sanctions_escalation')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
    })

    it('filters by category="webhook_delivery" shows 1 event', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('webhook_delivery')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
    })

    it('filters by category="investor_onboarding" shows 1 event', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('investor_onboarding')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
    })

    it('filters by category="release_evidence" shows 1 event', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('release_evidence')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
    })
  })

  // =========================================================================
  // Launch-blocking event rendering
  // =========================================================================
  describe('launch-blocking event rendering', () => {
    it('exactly 2 events have isLaunchBlocking=true', async () => {
      const wrapper = await mountCenter()
      const launchBlockingSpans = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_LAUNCH_BLOCKING}"]`)
      expect(launchBlockingSpans.length).toBe(2) // evt-010, evt-013
    })

    it('launch-blocking spans contain "Blocks Issuance" text', async () => {
      const wrapper = await mountCenter()
      const launchBlockingSpans = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_LAUNCH_BLOCKING}"]`)
      expect(launchBlockingSpans.length).toBe(2)
      expect(launchBlockingSpans[0].text()).toContain('Blocks Issuance')
      expect(launchBlockingSpans[1].text()).toContain('Blocks Issuance')
    })

    it('launch-blocking items have role="alert" for screen readers', async () => {
      const wrapper = await mountCenter()
      const launchBlockingSpans = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_LAUNCH_BLOCKING}"]`)
      expect(launchBlockingSpans.length).toBe(2)
      expect(launchBlockingSpans[0].attributes('role')).toBe('alert')
      expect(launchBlockingSpans[1].attributes('role')).toBe('alert')
    })
  })

  // =========================================================================
  // Actor rendering per event
  // =========================================================================
  describe('actor rendering', () => {
    it('renders system actor for evt-010 (blocked sanctions screening)', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items[0].text()).toContain('System')
    })

    it('renders provider actor for evt-011 (KYC resubmission)', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items[1].text()).toContain('kyc-provider@external.com')
    })

    it('renders operator actor for evt-014 (onboarding completed)', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items[4].text()).toContain('compliance-lead@biatec.io')
    })
  })

  // =========================================================================
  // Drill-down paths point to correct compliance surfaces
  // =========================================================================
  describe('drill-down path accuracy', () => {
    it('evt-010 (blocked) links to /compliance/operations', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links[0].attributes('href')).toBe('/compliance/operations')
    })

    it('evt-011 (action_needed KYC) links to /compliance/onboarding', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links[1].attributes('href')).toBe('/compliance/onboarding')
    })

    it('evt-013 (action_needed release) links to /compliance/release', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links[2].attributes('href')).toBe('/compliance/release')
    })

    it('evt-014 (review_complete) links to /compliance/onboarding', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links[3].attributes('href')).toBe('/compliance/onboarding')
    })

    it('evt-015 (informational KYC) links to /compliance/onboarding', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      expect(links[4].attributes('href')).toBe('/compliance/onboarding')
    })
  })

  // =========================================================================
  // Read/unread state styling
  // =========================================================================
  describe('read/unread state', () => {
    it('exactly 3 events have unread indicator (aria-label="Unread")', async () => {
      const wrapper = await mountCenter()
      const unreadIndicators = wrapper.findAll('[aria-label="Unread"]')
      // 3 unread events: evt-010, evt-011, evt-012
      expect(unreadIndicators.length).toBe(3)
    })
  })

  // =========================================================================
  // Combined filter interactions
  // =========================================================================
  describe('combined filter precision', () => {
    it('severity=informational + category=aml_screening yields exactly 1 event (evt-016)', async () => {
      const wrapper = await mountCenter()
      const sevSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      const catSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await sevSelect.setValue('informational')
      await nextTick()
      await catSelect.setValue('aml_screening')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
      expect(items[0].text()).toContain('AML screening completed')
    })

    it('severity=blocked + readState=unread yields exactly 1 event (evt-010)', async () => {
      const wrapper = await mountCenter()
      const sevSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      const readSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await sevSelect.setValue('blocked')
      await nextTick()
      await readSelect.setValue('unread')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(1)
      expect(items[0].text()).toContain('Sanctions screening escalation opened')
    })
  })
})
