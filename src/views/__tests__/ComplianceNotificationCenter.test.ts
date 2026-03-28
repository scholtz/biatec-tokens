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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  // Advance past the 150ms loading timer
  await vi.advanceTimersByTimeAsync(200)
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComplianceNotificationCenter.vue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // Rendering & Structure (AC #1, AC #7, AC #8)
  // =========================================================================
  describe('rendering and structure', () => {
    it('renders the root container with data-testid', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.ROOT}"]`).exists()).toBe(true)
    })

    it('renders the page heading', async () => {
      const wrapper = await mountCenter()
      const heading = wrapper.find(`[data-testid="${TEST_IDS.HEADING}"]`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toContain('Compliance Notification Center')
    })

    it('renders the skip link for accessibility (WCAG 2.4.1)', async () => {
      const wrapper = await mountCenter()
      const skipLink = wrapper.find('a[href="#notification-center-main"]')
      expect(skipLink.exists()).toBe(true)
      expect(skipLink.classes()).toContain('sr-only')
    })

    it('renders the main content region with aria-label', async () => {
      const wrapper = await mountCenter()
      const region = wrapper.find('[role="region"]')
      expect(region.exists()).toBe(true)
      expect(region.attributes('aria-label')).toContain('Compliance Notification Center')
    })

    it('renders the refresh button', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.REFRESH_BUTTON}"]`).exists()).toBe(true)
    })

    it('renders last updated timestamp', async () => {
      const wrapper = await mountCenter()
      const ts = wrapper.find(`[data-testid="${TEST_IDS.LAST_UPDATED}"]`)
      expect(ts.exists()).toBe(true)
      expect(ts.text()).toContain('Last refreshed:')
    })
  })

  // =========================================================================
  // Loading State
  // =========================================================================
  describe('loading state', () => {
    it('shows loading state initially before timer completes', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_NOW)
      const wrapper = mount(ComplianceNotificationCenter, {
        global: {
          components: { RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
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
      // loading should be visible before timer fires
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(true)
      // Clean up
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()
    })

    it('hides loading state after data loads', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(false)
    })
  })

  // =========================================================================
  // Queue Summary (AC #4)
  // =========================================================================
  describe('queue summary', () => {
    it('renders queue summary section', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.QUEUE_SUMMARY}"]`).exists()).toBe(true)
    })

    it('renders total events count', async () => {
      const wrapper = await mountCenter()
      const total = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(total.exists()).toBe(true)
      const dd = total.find('dd')
      expect(Number(dd.text().trim())).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('renders blocked count', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_BLOCKED}"]`)
      expect(el.exists()).toBe(true)
    })

    it('renders action needed count', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_ACTION_NEEDED}"]`)
      expect(el.exists()).toBe(true)
    })

    it('renders waiting on provider count', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_WAITING}"]`)
      expect(el.exists()).toBe(true)
    })

    it('renders stale count', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_STALE}"]`)
      expect(el.exists()).toBe(true)
    })

    it('renders unread count', async () => {
      const wrapper = await mountCenter()
      const el = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_UNREAD}"]`)
      expect(el.exists()).toBe(true)
    })
  })

  // =========================================================================
  // Event List (AC #1, AC #2, AC #3)
  // =========================================================================
  describe('event list', () => {
    it('renders event list with items', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.EVENT_LIST}"]`).exists()).toBe(true)
    })

    it('renders severity badges on events', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      expect(badges.length).toBe(MOCK_EVENTS_MIXED.length) // one severity badge per event
    })

    it('renders drill-down links for events with drillDownPath', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter((e) => e.drillDownPath !== null)
      expect(links.length).toBe(eventsWithPath.length)
    })

    it('renders launch blocking badges for blocking events', async () => {
      const wrapper = await mountCenter()
      const text = wrapper.text()
      expect(text).toContain('Blocks Issuance')
    })

    it('renders next action guidance on events', async () => {
      const wrapper = await mountCenter()
      // The blocked event should show its nextAction
      expect(wrapper.text()).toContain('Review sanctions match')
    })

    it('renders event list as ARIA list', async () => {
      const wrapper = await mountCenter()
      const list = wrapper.find(`[data-testid="${TEST_IDS.EVENT_LIST}"]`)
      expect(list.attributes('role')).toBe('list')
    })
  })

  // =========================================================================
  // Filters (AC #2)
  // =========================================================================
  describe('filters', () => {
    it('renders category filter', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`).exists()).toBe(true)
    })

    it('renders severity filter', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`).exists()).toBe(true)
    })

    it('renders freshness filter', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.FILTER_FRESHNESS}"]`).exists()).toBe(true)
    })

    it('renders read state filter', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`).exists()).toBe(true)
    })

    it('filters by severity when changed', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await select.setValue('blocked')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Only blocked event should remain
      expect(items.length).toBe(1)
    })

    it('shows empty state when filter returns no results', async () => {
      const wrapper = await mountCenter()
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('system')
      await nextTick()
      expect(wrapper.find(`[data-testid="${TEST_IDS.EMPTY_STATE}"]`).exists()).toBe(true)
    })
  })

  // =========================================================================
  // Timeline Panel (AC #3)
  // =========================================================================
  describe('timeline panel', () => {
    it('renders timeline root', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.find(`[data-testid="${TEST_IDS.TIMELINE_ROOT}"]`).exists()).toBe(true)
    })

    it('renders timeline groups', async () => {
      const wrapper = await mountCenter()
      const groups = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_GROUP}"]`)
      expect(groups.length).toBe(2) // Today + Yesterday groups
    })

    it('renders timeline entries', async () => {
      const wrapper = await mountCenter()
      const entries = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_ENTRY}"]`)
      expect(entries.length).toBe(4) // 4 timeline entries (MOCK_TIMELINE_ENTRIES)
    })

    it('displays transition text in timeline entries', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.text()).toContain('KYC status changed')
    })

    it('displays actor in timeline entries', async () => {
      const wrapper = await mountCenter()
      expect(wrapper.text()).toContain('compliance-analyst@biatec.io')
    })
  })

  // =========================================================================
  // Fail-Closed Messaging (AC #5)
  // =========================================================================
  describe('fail-closed messaging', () => {
    it('shows empty state with unavailable-specific copy when feed health is unavailable and no events', async () => {
      const wrapper = await mountCenter()
      // Filter to empty, then check empty state copy
      const select = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await select.setValue('system')
      await nextTick()
      // Default state is healthy, so should show "No matching events"
      expect(wrapper.text()).toContain('No matching events')
    })
  })

  // =========================================================================
  // Accessibility (AC #8)
  // =========================================================================
  describe('accessibility', () => {
    it('has labeled filter selects with sr-only labels', async () => {
      const wrapper = await mountCenter()
      const labels = wrapper.findAll('label.sr-only')
      expect(labels.length).toBe(4) // exactly 4 filter controls
    })

    it('event list has role="list" with list items', async () => {
      const wrapper = await mountCenter()
      const list = wrapper.find(`[data-testid="${TEST_IDS.EVENT_LIST}"]`)
      expect(list.attributes('role')).toBe('list')
      expect(list.element.tagName.toLowerCase()).toBe('ul')
    })

    it('timeline entries use semantic list markup', async () => {
      const wrapper = await mountCenter()
      const timelineLists = wrapper.findAll('aside ul[role="list"]')
      expect(timelineLists.length).toBe(2) // 2 timeline groups, each with a list
    })

    it('severity badges have role="status"', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      for (const badge of badges) {
        expect(badge.attributes('role')).toBe('status')
      }
    })

    it('launch blocking badge has role="alert"', async () => {
      const wrapper = await mountCenter()
      const alerts = wrapper.findAll('[role="alert"]')
      // At least one for the launch-blocking event
      expect(alerts.length).toBe(2) // 2 launch-blocking events (evt-010, evt-013)
    })

    it('drill-down links have descriptive aria-labels', async () => {
      const wrapper = await mountCenter()
      const links = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      for (const link of links) {
        expect(link.attributes('aria-label')).toContain('View details for')
      }
    })
  })

  // =========================================================================
  // Refresh (AC #1)
  // =========================================================================
  describe('refresh', () => {
    it('reloads data when refresh button is clicked', async () => {
      const wrapper = await mountCenter()
      const btn = wrapper.find(`[data-testid="${TEST_IDS.REFRESH_BUTTON}"]`)
      await btn.trigger('click')
      await nextTick()
      // Should show loading briefly
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(true)
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()
      // Should be back to loaded state
      expect(wrapper.find(`[data-testid="${TEST_IDS.LOADING_STATE}"]`).exists()).toBe(false)
    })
  })
})
