import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrustPanel from '../TrustPanel.vue'

// Mock the telemetry service
vi.mock('../../services/executionTimelineTelemetry', () => ({
  trackTrustPanelInteraction: vi.fn(),
}))

// Mock Heroicons or other icon components
const stubs = {
  BuildingOfficeIcon: { template: '<span class="building-icon" />' },
  CheckBadgeIcon: { template: '<span class="check-badge-icon" />' },
  InformationCircleIcon: { template: '<span class="info-icon" />' },
  ShieldCheckIcon: { template: '<span class="shield-icon" />' },
}

describe('TrustPanel', () => {
  it('renders with default props', () => {
    const wrapper = mount(TrustPanel, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the title', () => {
    const wrapper = mount(TrustPanel, {
      props: { title: 'Custom Trust Title' },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Custom Trust Title')
  })

  it('renders the default title when no props passed', () => {
    const wrapper = mount(TrustPanel, { global: { stubs } })
    expect(wrapper.text()).toContain('Simplified')
  })

  it('renders description', () => {
    const wrapper = mount(TrustPanel, {
      props: { description: 'Test description here' },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Test description here')
  })

  it('renders benefits list', () => {
    const wrapper = mount(TrustPanel, {
      props: {
        benefits: [
          { title: 'Benefit One', description: 'First benefit' },
          { title: 'Benefit Two', description: 'Second benefit' },
        ],
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Benefit One')
    expect(wrapper.text()).toContain('Benefit Two')
  })

  it('shows comparison toggle when showComparison is true', () => {
    const wrapper = mount(TrustPanel, {
      props: { showComparison: true },
      global: { stubs },
    })
    const toggle = wrapper.find('.comparison-toggle')
    expect(toggle.exists()).toBe(true)
  })

  it('hides comparison section when showComparison is false', () => {
    const wrapper = mount(TrustPanel, {
      props: { showComparison: false },
      global: { stubs },
    })
    const toggle = wrapper.find('.comparison-toggle')
    expect(toggle.exists()).toBe(false)
  })

  it('expands comparison on toggle click', async () => {
    const wrapper = mount(TrustPanel, {
      props: { showComparison: true },
      global: { stubs },
    })
    const toggle = wrapper.find('.comparison-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })

  it('collapses comparison on second toggle click', async () => {
    const wrapper = mount(TrustPanel, {
      props: { showComparison: true },
      global: { stubs },
    })
    const toggle = wrapper.find('.comparison-toggle')
    await toggle.trigger('click')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('has complementary role for accessibility', () => {
    const wrapper = mount(TrustPanel, { global: { stubs } })
    const panel = wrapper.find('[role="complementary"]')
    expect(panel.exists()).toBe(true)
  })

  it('renders comparison items in table when expanded', async () => {
    const wrapper = mount(TrustPanel, {
      props: {
        showComparison: true,
        comparisonItems: [
          { feature: 'Auth', biatec: 'Email', wallet: 'Browser Wallet', biatecAdvantage: true },
        ],
      },
      global: { stubs },
    })
    const toggle = wrapper.find('.comparison-toggle')
    await toggle.trigger('click')
    expect(wrapper.text()).toContain('Auth')
  })
})
