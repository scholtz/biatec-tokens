/**
 * ComplianceNotificationCenterWiring.integration.test.ts
 *
 * Integration tests proving that the utility functions in
 * complianceNotificationCenter.ts correctly flow into
 * ComplianceNotificationCenter.vue's rendered output.
 *
 * Per section 7f of copilot instructions: utility + component pairs
 * must have integration tests proving wiring correctness.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import ComplianceNotificationCenter from '../../views/ComplianceNotificationCenter.vue'
import {
  NOTIFICATION_CENTER_TEST_IDS as TEST_IDS,
  SEVERITY_LABELS,
  MOCK_EVENTS_MIXED,
  deriveNotificationCenterState,
  deriveQueueSummary,
  filterEvents,
  sortEventsByPriority,
  severityBadgeClass,
  DEFAULT_FILTERS,
  type NotificationFilters,
} from '../../utils/complianceNotificationCenter'

// ---------------------------------------------------------------------------
// Router & stubs
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

async function mountCenter() {
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
// Integration tests
// ---------------------------------------------------------------------------

describe('ComplianceNotificationCenter — utility→view wiring', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // Queue summary values match utility derivation
  // =========================================================================
  describe('queue summary wiring', () => {
    it('total events rendered matches deriveQueueSummary output', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.total).toBe(utilSummary.total)
      const totalEl = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_TOTAL}"]`)
      expect(Number(totalEl.find('dd').text().trim())).toBe(utilSummary.total)
    })

    it('blocked count in view matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.blocked).toBe(utilSummary.blocked)
    })

    it('unread count in view matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.unread).toBe(utilSummary.unread)
    })

    it('actionNeeded count in view matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.actionNeeded).toBe(utilSummary.actionNeeded)
    })

    it('waitingOnProvider count in view matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.waitingOnProvider).toBe(utilSummary.waitingOnProvider)
    })
  })

  // =========================================================================
  // Event list wiring — utility filterEvents → rendered items
  // =========================================================================
  describe('event list wiring', () => {
    it('default filter renders all events from utility filterEvents', async () => {
      const wrapper = await mountCenter()
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, DEFAULT_FILTERS)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
    })

    it('severity filter produces same count as utility filterEvents', async () => {
      const wrapper = await mountCenter()
      const severitySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await severitySelect.setValue('blocked')
      await nextTick()

      const blockedFilter: NotificationFilters = { ...DEFAULT_FILTERS, severity: 'blocked' }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, blockedFilter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
    })

    it('category filter produces same count as utility filterEvents', async () => {
      const wrapper = await mountCenter()
      const categorySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await categorySelect.setValue('kyc_review')
      await nextTick()

      const catFilter: NotificationFilters = { ...DEFAULT_FILTERS, category: 'kyc_review' }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, catFilter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
    })
  })

  // =========================================================================
  // Severity badge classes from utility → rendered badge
  // =========================================================================
  describe('severity badge class wiring', () => {
    it('severity badges use classes from severityBadgeClass utility', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      // Events are rendered in priority-sorted order
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      expect(badges.length).toBe(sorted.length)
      for (let i = 0; i < sorted.length; i++) {
        const expectedClass = severityBadgeClass(sorted[i].severity)
        const badgeClasses = badges[i].classes().join(' ')
        const expectedParts = expectedClass.split(' ')
        for (const part of expectedParts) {
          expect(badgeClasses).toContain(part)
        }
      }
    })
  })

  // =========================================================================
  // Severity labels from utility → rendered badge text
  // =========================================================================
  describe('severity label wiring', () => {
    it('severity badge text matches SEVERITY_LABELS from utility', async () => {
      const wrapper = await mountCenter()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      for (let i = 0; i < sorted.length; i++) {
        const expectedLabel = SEVERITY_LABELS[sorted[i].severity]
        expect(badges[i].text().trim()).toBe(expectedLabel)
      }
    })
  })

  // =========================================================================
  // Feed health derivation wiring
  // =========================================================================
  describe('feed health wiring', () => {
    it('centerState feedHealth matches utility deriveNotificationCenterState', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const freshRefresh = vm.lastRefreshedAt
      const utilState = deriveNotificationCenterState(MOCK_EVENTS_MIXED, freshRefresh)
      expect(vm.centerState.feedHealth).toBe(utilState.feedHealth)
    })

    it('centerState feedHealthMessage matches utility output', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const freshRefresh = vm.lastRefreshedAt
      const utilState = deriveNotificationCenterState(MOCK_EVENTS_MIXED, freshRefresh)
      expect(vm.centerState.feedHealthMessage).toBe(utilState.feedHealthMessage)
    })
  })

  // =========================================================================
  // Drill-down paths wiring — events with drillDownPath render links
  // =========================================================================
  describe('drill-down path wiring', () => {
    it('only events with non-null drillDownPath get drill-down links', async () => {
      const wrapper = await mountCenter()
      const drillLinks = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter(e => e.drillDownPath !== null)
      expect(drillLinks.length).toBe(eventsWithPath.length)
    })

    it('drill-down link destinations match event drillDownPath', async () => {
      const wrapper = await mountCenter()
      const drillLinks = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter(e => e.drillDownPath !== null)
      for (let i = 0; i < eventsWithPath.length; i++) {
        const href = drillLinks[i].attributes('href') || drillLinks[i].attributes('to')
        expect(href).toBe(eventsWithPath[i].drillDownPath)
      }
    })
  })

  // =========================================================================
  // Event order follows utility priority sort
  // =========================================================================
  describe('event ordering', () => {
    it('rendered events follow priority-sorted order from utility', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // First item should be blocked severity (highest priority)
      const firstItemText = items[0].text()
      expect(firstItemText).toContain(SEVERITY_LABELS['blocked'])
    })
  })
})
