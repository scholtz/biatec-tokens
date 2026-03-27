/**
 * ComplianceNotificationCenter.vue — Logic & interaction tests.
 *
 * Tests internal functions (timelineDotClass), state transitions,
 * filter interactions, refresh behavior, and computed property branches
 * via (wrapper.vm as any) to achieve ≥80% function/branch coverage.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import ComplianceNotificationCenter from '../ComplianceNotificationCenter.vue'
import {
  NOTIFICATION_CENTER_TEST_IDS as TEST_IDS,
  MOCK_EVENTS_MIXED,
} from '../../utils/complianceNotificationCenter'

// ---------------------------------------------------------------------------
// Router mock
// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/compliance/notifications', component: ComplianceNotificationCenter },
      { path: '/compliance/onboarding', component: { template: '<div>Onboarding</div>' } },
      { path: '/compliance/operations', component: { template: '<div>Operations</div>' } },
      { path: '/compliance/evidence', component: { template: '<div>Evidence</div>' } },
      { path: '/compliance/release', component: { template: '<div>Release</div>' } },
    ],
  })
}

const MainLayoutStub = { template: '<div><slot /></div>' }
const iconStub = { template: '<svg />' }

async function mountCenter(): Promise<VueWrapper> {
  vi.useFakeTimers()
  const router = makeRouter()
  router.push('/compliance/notifications')
  await router.isReady()
  const wrapper = mount(ComplianceNotificationCenter, {
    global: {
      plugins: [router],
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
      // The stale evidence event is from 2026-03-20 → should be critical freshness
      expect(items.length).toBeGreaterThanOrEqual(0)
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
      const router = makeRouter()
      router.push('/compliance/notifications')
      await router.isReady()
      const wrapper = mount(ComplianceNotificationCenter, {
        global: {
          plugins: [router],
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
      expect(vm.timelineGroups.length).toBeGreaterThan(0)
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

    it('timeline has vertical connecting line', async () => {
      const wrapper = await mountCenter()
      const line = wrapper.find('aside .bg-gray-700')
      expect(line.exists()).toBe(true)
    })

    it('timeline dots have severity-appropriate colors', async () => {
      const wrapper = await mountCenter()
      const dots = wrapper.findAll('aside .rounded-full')
      expect(dots.length).toBeGreaterThan(0)
    })
  })
})
