import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import EconomicsSettingsStep from '../EconomicsSettingsStep.vue'

vi.mock('../../ui/Button.vue', () => ({
  default: {
    name: 'Button',
    template: '<button type="submit" data-testid="submit-btn"><slot /></button>',
    props: ['type', 'variant', 'size', 'fullWidth']
  }
}))

vi.mock('../../ui/Badge.vue', () => ({
  default: {
    name: 'Badge',
    template: '<span data-testid="badge"><slot /></span>',
    props: ['variant']
  }
}))

describe('EconomicsSettingsStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the Economics Settings heading', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.text()).toContain('Economics Settings')
  })

  it('shows Optional Step badge', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.text()).toContain('Optional Step')
  })

  it('renders Total Supply input with default value', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('1000000')
  })

  it('renders Decimals input with default 6', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const input = wrapper.find('input[type="number"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('6')
  })

  it('shows distribution section heading', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.text()).toContain('Initial Distribution')
  })

  it('renders distribution inputs for team, investors, community, reserve', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.text()).toContain('Team')
    expect(wrapper.text()).toContain('Investors')
    expect(wrapper.text()).toContain('Community')
    expect(wrapper.text()).toContain('Reserve')
  })

  it('distributionTotal warning NOT shown when total equals 100 (default)', () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    // Default: 20+20+40+20 = 100, so warning should not appear
    expect(wrapper.text()).not.toContain('Total must equal 100%')
  })

  it('emits update event when form data changes', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const supplyInput = wrapper.find('input[type="text"]')
    await supplyInput.setValue('2000000')
    const updates = wrapper.emitted('update')
    expect(updates).toBeTruthy()
    expect((updates![0][0] as any).totalSupply).toBe('2000000')
  })

  it('emits complete and update on form submit', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('update')).toBeTruthy()
  })

  it('complete event has isValid: true when distribution = 100', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    await wrapper.find('form').trigger('submit')
    const complete = wrapper.emitted('complete')!
    expect((complete[0][0] as any).isValid).toBe(true)
    expect((complete[0][0] as any).warnings).toHaveLength(0)
  })
})
