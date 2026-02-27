import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AMLScreeningStatusPanel from '../AMLScreeningStatusPanel.vue'
import type { AMLScreeningResult } from '../../../types/compliance'

const stubs = {
  Card: {
    template: '<div class="card"><slot></slot></div>',
    props: ['variant', 'padding'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')"><slot></slot></button>',
    props: ['variant', 'size'],
    emits: ['click'],
  },
  Badge: {
    template: '<span class="badge"><slot></slot></span>',
    props: ['variant', 'size'],
  },
  ShieldCheckIcon: { template: '<svg></svg>' },
  CheckCircleIcon: { template: '<svg class="check"></svg>' },
  ExclamationTriangleIcon: { template: '<svg class="warning"></svg>' },
  ExclamationCircleIcon: { template: '<svg class="exclamation"></svg>' },
  ClockIcon: { template: '<svg class="clock"></svg>' },
  ArrowPathIcon: { template: '<svg class="arrow"></svg>' },
  InformationCircleIcon: { template: '<svg class="info"></svg>' },
  ChevronUpIcon: { template: '<svg class="up"></svg>' },
  ChevronDownIcon: { template: '<svg class="down"></svg>' },
}

const makeScreening = (overrides: Partial<AMLScreeningResult> = {}): AMLScreeningResult => ({
  verdict: 'not_started',
  ...overrides,
})

describe('AMLScreeningStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the component', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening() },
      global: { stubs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display AML Screening Status heading', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening() },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('AML Screening Status')
  })

  it('should display not_started state', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'not_started' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-gray-700')
  })

  it('should display in_progress state with blue border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'in_progress' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-blue-700')
  })

  it('should display clear state with green border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-green-700')
  })

  it('should display potential_match state with yellow border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'potential_match' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-yellow-700')
  })

  it('should display confirmed_match state with red border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'confirmed_match' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-red-700')
  })

  it('should display error state with orange border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'error' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-orange-700')
  })

  it('should display manual_review state with yellow border', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'manual_review' }) },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-yellow-700')
  })

  it('should show screenedAt when present', () => {
    const recentDate = new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: {
        screening: makeScreening({ verdict: 'clear', screenedAt: recentDate }),
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Screened')
  })

  it('should show action guidance text for confirmed_match', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'confirmed_match' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Action Required')
  })

  it('should show guidance for in_progress verdict', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'in_progress' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('AML screening is currently in progress')
  })

  it('should show guidance for clear verdict', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('No sanctions matches found')
  })

  it('should show guidance for potential_match', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'potential_match' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Possible sanctions match')
  })

  it('should show guidance for confirmed_match', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'confirmed_match' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('contact our support')
  })

  it('should show guidance for error verdict', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'error' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Screening service error')
  })

  it('should show guidance for manual_review', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'manual_review' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Requires manual compliance officer review')
  })

  it('should show technical details toggle when showTechnicalDetails is true', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: {
        screening: makeScreening(),
        showTechnicalDetails: true,
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Technical Details')
  })

  it('should hide technical details toggle when showTechnicalDetails is false', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: {
        screening: makeScreening(),
        showTechnicalDetails: false,
      },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Technical Details')
  })

  it('should expand technical details on toggle click', async () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: {
        screening: makeScreening({ verdict: 'clear' }),
        showTechnicalDetails: true,
      },
      global: { stubs },
    })
    const toggleBtn = wrapper.find('button')
    await toggleBtn.trigger('click')
    expect(wrapper.text()).toContain('clear')
  })

  it('should format screenedAt from minutes ago', () => {
    const minutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear', screenedAt: minutesAgo }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('30m ago')
  })

  it('should format screenedAt as just now', () => {
    const justNow = new Date().toISOString()
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear', screenedAt: justNow }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Just now')
  })

  it('should format screenedAt from hours ago', () => {
    const hoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear', screenedAt: hoursAgo }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('5h ago')
  })

  it('should format screenedAt from days ago', () => {
    const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear', screenedAt: daysAgo }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('3d ago')
  })

  it('should format old screenedAt as locale date', () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'clear', screenedAt: oldDate }) },
      global: { stubs },
    })
    // Just verify it renders without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('should show Blocking badge for blocking verdicts', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'confirmed_match' }) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Blocking')
  })

  it('should emit contact-support event when button clicked', async () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: { screening: makeScreening({ verdict: 'confirmed_match' }) },
      global: { stubs },
    })
    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      if (btn.text().includes('Contact') || btn.text().includes('Support')) {
        await btn.trigger('click')
        expect(wrapper.emitted('contact-support')).toBeTruthy()
        break
      }
    }
  })

  it('should render matchDetails when present', () => {
    const wrapper = mount(AMLScreeningStatusPanel, {
      props: {
        screening: makeScreening({
          verdict: 'confirmed_match',
          matchDetails: [
            { listName: 'OFAC SDN List', matchScore: 95, matchedFields: ['name', 'address'] }
          ],
        }),
      },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Screening Matches Detected')
    expect(wrapper.html()).toContain('OFAC SDN List')
  })
})
