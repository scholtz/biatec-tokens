/**
 * ComplianceNotificationCenter.emptyTimeline.test.ts
 *
 * Dedicated test covering the v-if="timelineGroups.length === 0" branch
 * in ComplianceNotificationCenter.vue by mocking MOCK_TIMELINE_ENTRIES
 * to be empty. This ensures the empty-state message renders correctly.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock the utility to return empty timeline entries
vi.mock('../../utils/complianceNotificationCenter', async () => {
  const actual = await vi.importActual<typeof import('../../utils/complianceNotificationCenter')>(
    '../../utils/complianceNotificationCenter',
  )
  return {
    ...actual,
    MOCK_TIMELINE_ENTRIES: [], // empty timeline (backward compat)
    buildMockTimelineEntries: () => [], // view now uses this function
  }
})

import ComplianceNotificationCenter from '../ComplianceNotificationCenter.vue'
import { NOTIFICATION_CENTER_TEST_IDS as TEST_IDS } from '../../utils/complianceNotificationCenter'

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

describe('ComplianceNotificationCenter.vue — empty timeline branch', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "No timeline events available" when timeline entries are empty', async () => {
    const wrapper = await mountCenter()
    const vm = wrapper.vm as any
    // With mocked empty MOCK_TIMELINE_ENTRIES, timelineGroups should be empty
    expect(vm.timelineGroups.length).toBe(0)
    // The empty-state message should be visible
    const aside = wrapper.find('aside')
    expect(aside.text()).toContain('No timeline events available')
  })

  it('does not render timeline groups when entries are empty', async () => {
    const wrapper = await mountCenter()
    const groups = wrapper.findAll(`[data-testid="${TEST_IDS.TIMELINE_GROUP}"]`)
    expect(groups.length).toBe(0)
  })

  it('still renders the Event Timeline heading', async () => {
    const wrapper = await mountCenter()
    const heading = wrapper.find(`[data-testid="${TEST_IDS.TIMELINE_ROOT}"]`)
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Event Timeline')
  })
})
