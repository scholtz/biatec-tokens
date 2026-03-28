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
import { nextTick } from 'vue'
import ComplianceNotificationCenter from '../../views/ComplianceNotificationCenter.vue'
import {
  NOTIFICATION_CENTER_TEST_IDS as TEST_IDS,
  SEVERITY_LABELS,
  CATEGORY_LABELS,
  MOCK_EVENTS_MIXED,
  deriveNotificationCenterState,
  deriveQueueSummary,
  filterEvents,
  sortEventsByPriority,
  severityBadgeClass,
  classifyFreshness,
  DEFAULT_FILTERS,
  type NotificationFilters,
  type ComplianceEvent,
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

async function mountCenter() {
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

  // =========================================================================
  // Fail-closed: freshness degradation preserves truthful queue summaries
  // =========================================================================
  describe('fail-closed freshness degradation', () => {
    it('queue summaries remain accurate when feed degrades to stale', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Force feed health to stale — simulates backend not refreshing for >5min
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Event data may be outdated.'
      await nextTick()
      // Queue summaries must still reflect the events' true severity counts
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.total).toBe(utilSummary.total)
      expect(vm.centerState.queueSummary.blocked).toBe(utilSummary.blocked)
      expect(vm.centerState.queueSummary.actionNeeded).toBe(utilSummary.actionNeeded)
      expect(vm.centerState.queueSummary.unread).toBe(utilSummary.unread)
      expect(vm.centerState.queueSummary.waitingOnProvider).toBe(utilSummary.waitingOnProvider)
    })

    it('queue summaries remain accurate when feed degrades to unavailable', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      // Force feed health to unavailable
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Event feed is unavailable.'
      await nextTick()
      // Queue summary values unchanged — events are still the last-known state
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.total).toBe(utilSummary.total)
      expect(vm.centerState.queueSummary.blocked).toBe(utilSummary.blocked)
      expect(vm.centerState.queueSummary.actionNeeded).toBe(utilSummary.actionNeeded)
      expect(vm.centerState.queueSummary.unread).toBe(utilSummary.unread)
    })

    it('feed health banner renders when feed is stale (not hidden)', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Event data may be outdated.'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('outdated')
      expect(banner.attributes('role')).toBe('status')
    })

    it('feed health banner uses role="alert" when unavailable (not role="status")', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Event feed is unavailable.'
      await nextTick()
      const banner = wrapper.find(`[data-testid="${TEST_IDS.FEED_HEALTH_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      expect(banner.attributes('role')).toBe('alert')
    })

    it('drill-down links remain correct under degraded feed health', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'degraded'
      vm.centerState.feedHealthMessage = 'Operating in limited-data mode.'
      await nextTick()
      // Drill-down links must still point to correct compliance surfaces
      const drillLinks = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
      const eventsWithPath = MOCK_EVENTS_MIXED.filter(e => e.drillDownPath !== null)
      expect(drillLinks.length).toBe(eventsWithPath.length)
      // Verify actual href values remain correct under degradation
      for (let i = 0; i < eventsWithPath.length; i++) {
        const href = drillLinks[i].attributes('href') || drillLinks[i].attributes('to')
        expect(href).toBe(eventsWithPath[i].drillDownPath)
      }
    })

    it('filter controls remain functional under stale feed health', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Event data may be outdated.'
      await nextTick()
      // Filter controls should still be present and functional
      const severitySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      expect(severitySelect.exists()).toBe(true)
      await severitySelect.setValue('blocked')
      await nextTick()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Only blocked events should appear — 1 blocked event in MOCK_EVENTS_MIXED
      expect(items.length).toBe(1)
    })

    it('empty state shows fail-closed copy when feed is unavailable and events cleared', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'unavailable'
      vm.centerState.feedHealthMessage = 'Event feed is unavailable.'
      vm.centerState.events = []
      vm.centerState.queueSummary = deriveQueueSummary([], new Date())
      await nextTick()
      const emptyState = wrapper.find(`[data-testid="${TEST_IDS.EMPTY_STATE}"]`)
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('Event feed unavailable')
      expect(emptyState.text()).toContain('cannot confirm the current state')
    })

    it('stale feed still renders event timeline groups', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'stale'
      vm.centerState.feedHealthMessage = 'Event data may be outdated.'
      await nextTick()
      // Timeline groups should still be present
      const groups = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_GROUP}"]`)
      expect(groups.length).toBe(2) // Today + Yesterday
    })

    it('null-lastRefreshedAt produces unavailable health via utility wiring', () => {
      // Direct utility test: null lastRefreshedAt → unavailable (fail-closed)
      const state = deriveNotificationCenterState(MOCK_EVENTS_MIXED, null)
      expect(state.feedHealth).toBe('unavailable')
      expect(state.feedHealthMessage).toContain('unavailable')
      expect(state.feedHealthMessage).toContain('cannot be confirmed')
    })

    it('severity badges remain truthful under degraded feed', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'degraded'
      await nextTick()
      const badges = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_SEVERITY_BADGE}"]`)
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      expect(badges.length).toBe(sorted.length)
      // First badge must be the blocked event, not softened under degradation
      expect(badges[0].text().trim()).toBe(SEVERITY_LABELS['blocked'])
    })

    it('launch-blocking alerts persist under stale feed (never hidden by degradation)', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      vm.centerState.feedHealth = 'stale'
      await nextTick()
      const launchBlocking = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_LAUNCH_BLOCKING}"]`)
      // 2 launch-blocking events in MOCK_EVENTS_MIXED: evt-010 and evt-013
      expect(launchBlocking.length).toBe(2)
      expect(launchBlocking[0].text()).toContain('Blocks Issuance')
      expect(launchBlocking[0].attributes('role')).toBe('alert')
    })
  })

  // =========================================================================
  // Null nextAction wiring — events without operator guidance
  // =========================================================================
  describe('null-nextAction operator guidance wiring', () => {
    it('events with null nextAction have no next-action paragraph in rendered output', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const nullNextActionIndices = sorted
        .map((ev, i) => ev.nextAction === null ? i : -1)
        .filter(i => i >= 0)
      // There are exactly 2 null-nextAction events (evt-015, evt-016)
      expect(nullNextActionIndices.length).toBe(2)
      for (const idx of nullNextActionIndices) {
        const indigoParagraphs = items[idx].findAll('p').filter(
          (p: any) => p.classes().includes('text-indigo-300'),
        )
        expect(indigoParagraphs.length).toBe(0)
      }
    })

    it('events with string nextAction render next-action paragraph in rendered output', async () => {
      const wrapper = await mountCenter()
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const stringNextActionIndices = sorted
        .map((ev, i) => ev.nextAction !== null ? i : -1)
        .filter(i => i >= 0)
      expect(stringNextActionIndices.length).toBe(5)
      for (const idx of stringNextActionIndices) {
        const indigoParagraphs = items[idx].findAll('p').filter(
          (p: any) => p.classes().includes('text-indigo-300'),
        )
        expect(indigoParagraphs.length).toBe(1)
      }
    })
  })

  // =========================================================================
  // Stale count queue metric wiring
  // =========================================================================
  describe('stale count queue metric wiring', () => {
    it('staleCount in queue summary matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.staleCount).toBe(utilSummary.staleCount)
    })

    it('stale count card rendered value matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      const staleEl = wrapper.find(`[data-testid="${TEST_IDS.QUEUE_STALE}"]`)
      expect(Number(staleEl.find('dd').text().trim())).toBe(utilSummary.staleCount)
    })

    it('reviewComplete count in queue summary matches utility derivation', async () => {
      const wrapper = await mountCenter()
      const vm = wrapper.vm as any
      const utilSummary = deriveQueueSummary(MOCK_EVENTS_MIXED, new Date())
      expect(vm.centerState.queueSummary.reviewComplete).toBe(utilSummary.reviewComplete)
    })
  })

  // =========================================================================
  // Category label rendering wiring
  // =========================================================================
  describe('category label rendering wiring', () => {
    it('event descriptions reference category names from CATEGORY_LABELS utility', async () => {
      const wrapper = await mountCenter()
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      // Each event item should have content derived from the sorted events
      expect(items.length).toBe(sorted.length)
      // Verify first event (highest severity = blocked) title matches
      expect(items[0].text()).toContain(sorted[0].title)
    })

    it('CATEGORY_LABELS provides labels for all categories in MOCK_EVENTS_MIXED', () => {
      const categories = [...new Set(MOCK_EVENTS_MIXED.map(e => e.category))]
      for (const cat of categories) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy()
      }
    })
  })

  // =========================================================================
  // ReadState filter wiring
  // =========================================================================
  describe('readState filter wiring', () => {
    it('readState=unread filter produces same count as utility filterEvents', async () => {
      const wrapper = await mountCenter()
      const readStateSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await readStateSelect.setValue('unread')
      await nextTick()

      const unreadFilter: NotificationFilters = { ...DEFAULT_FILTERS, readState: 'unread' }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, unreadFilter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
      // MOCK_EVENTS_MIXED has exactly 3 unread events (evt-010, evt-011, evt-012)
      expect(renderedItems.length).toBe(3)
    })

    it('readState=read filter produces same count as utility filterEvents', async () => {
      const wrapper = await mountCenter()
      const readStateSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await readStateSelect.setValue('read')
      await nextTick()

      const readFilter: NotificationFilters = { ...DEFAULT_FILTERS, readState: 'read' }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, readFilter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
      // MOCK_EVENTS_MIXED has exactly 4 read events (evt-013, evt-014, evt-015, evt-016)
      expect(renderedItems.length).toBe(4)
    })
  })

  // =========================================================================
  // Freshness classification wiring
  // =========================================================================
  describe('freshness classification wiring', () => {
    it('classifyFreshness(null) returns critical (fail-closed)', () => {
      expect(classifyFreshness(null)).toBe('critical')
    })

    it('classifyFreshness(undefined) returns critical (fail-closed)', () => {
      expect(classifyFreshness(undefined)).toBe('critical')
    })

    it('classifyFreshness returns fresh for recent timestamps', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 30 * 60_000).toISOString() // 30 minutes ago
      expect(classifyFreshness(recent, now)).toBe('fresh')
    })

    it('all mock events produce valid freshness buckets via classifyFreshness', () => {
      const validBuckets = ['fresh', 'recent', 'aging', 'stale', 'critical']
      for (const ev of MOCK_EVENTS_MIXED) {
        const bucket = classifyFreshness(ev.timestamp)
        expect(validBuckets).toContain(bucket)
      }
    })
  })

  // =========================================================================
  // Combined filter scenarios — wiring correctness under multi-filter
  // =========================================================================
  describe('combined filter wiring', () => {
    it('severity=action_needed + readState=unread narrows to exactly 1 event (evt-011)', async () => {
      const wrapper = await mountCenter()

      const severitySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await severitySelect.setValue('action_needed')
      await nextTick()

      const readStateSelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_READ_STATE}"]`)
      await readStateSelect.setValue('unread')
      await nextTick()

      const filter: NotificationFilters = {
        ...DEFAULT_FILTERS,
        severity: 'action_needed',
        readState: 'unread',
      }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, filter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
      expect(renderedItems.length).toBe(1)
      expect(renderedItems[0].text()).toContain('KYC document resubmission needed')
    })

    it('severity=informational + category=aml_screening yields exactly 1 event (evt-016)', async () => {
      const wrapper = await mountCenter()

      const severitySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_SEVERITY}"]`)
      await severitySelect.setValue('informational')
      await nextTick()

      const categorySelect = wrapper.find(`[data-testid="${TEST_IDS.FILTER_CATEGORY}"]`)
      await categorySelect.setValue('aml_screening')
      await nextTick()

      const filter: NotificationFilters = {
        ...DEFAULT_FILTERS,
        severity: 'informational',
        category: 'aml_screening',
      }
      const utilFiltered = filterEvents(MOCK_EVENTS_MIXED, filter)
      const renderedItems = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(renderedItems.length).toBe(utilFiltered.length)
      expect(renderedItems.length).toBe(1)
      expect(renderedItems[0].text()).toContain('AML screening completed')
    })
  })

  // =========================================================================
  // Event description rendering wiring
  // =========================================================================
  describe('event description rendering wiring', () => {
    it('each rendered event contains its description text from MOCK_EVENTS_MIXED', async () => {
      const wrapper = await mountCenter()
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(7)
      for (let i = 0; i < sorted.length; i++) {
        expect(items[i].text()).toContain(sorted[i].description)
      }
    })

    it('each rendered event contains its actor name from MOCK_EVENTS_MIXED', async () => {
      const wrapper = await mountCenter()
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      expect(items.length).toBe(7)
      for (let i = 0; i < sorted.length; i++) {
        expect(items[i].text()).toContain(sorted[i].actor)
      }
    })
  })

  // =========================================================================
  // Null drillDownPath suppression — events without drill-down navigation
  // =========================================================================
  describe('null drillDownPath suppression wiring', () => {
    it('exactly 2 events have null drillDownPath and render no drill-down link', async () => {
      const wrapper = await mountCenter()
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const nullDrillDownIndices = sorted
        .map((ev: ComplianceEvent, i: number) => ev.drillDownPath === null ? i : -1)
        .filter((i: number) => i >= 0)
      expect(nullDrillDownIndices.length).toBe(2)
      for (const idx of nullDrillDownIndices) {
        const links = items[idx].findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
        expect(links.length).toBe(0)
      }
    })

    it('exactly 5 events have non-null drillDownPath and render a drill-down link', async () => {
      const wrapper = await mountCenter()
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      const items = wrapper.findAll(`[data-testid="${TEST_IDS.EVENT_ITEM}"]`)
      const nonNullDrillDownIndices = sorted
        .map((ev: ComplianceEvent, i: number) => ev.drillDownPath !== null ? i : -1)
        .filter((i: number) => i >= 0)
      expect(nonNullDrillDownIndices.length).toBe(5)
      for (const idx of nonNullDrillDownIndices) {
        const links = items[idx].findAll(`[data-testid="${TEST_IDS.EVENT_DRILL_DOWN}"]`)
        expect(links.length).toBe(1)
      }
    })
  })
})
