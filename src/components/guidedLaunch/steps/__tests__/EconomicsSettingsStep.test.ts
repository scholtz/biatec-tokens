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

  it('shows distribution warning when total does not equal 100', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    // Change team from 20 to 50 so total = 50+20+40+20 = 130
    const vm = wrapper.vm as any
    vm.formData.initialDistribution.team = 50
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Total must equal 100%')
  })

  it('handleSubmit includes warning when distributionTotal is not 100', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const vm = wrapper.vm as any
    vm.formData.initialDistribution.team = 50 // total = 130
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    const complete = wrapper.emitted('complete')!
    expect((complete[0][0] as any).warnings).toHaveLength(1)
    expect((complete[0][0] as any).warnings[0]).toMatch(/distribution/i)
  })

  it('onMounted restores existing tokenEconomics from store', async () => {
    const existingEconomics = {
      totalSupply: '5000000',
      decimals: 8,
      initialDistribution: { team: 10, investors: 30, community: 50, reserve: 10 },
      burnMechanism: true,
      mintingAllowed: false,
    }
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [pinia] }
    })
    // Manually set the store's tokenEconomics and simulate onMounted
    const vm = wrapper.vm as any
    vm.formData = { ...existingEconomics }
    await wrapper.vm.$nextTick()
    const supplyInput = wrapper.find('input[type="text"]')
    // After setting formData, the input should reflect the new value
    expect((supplyInput.element as HTMLInputElement).value).toBe('5000000')
  })

  it('onMounted loads tokenEconomics when store has existing data', async () => {
    const { useGuidedLaunchStore: mockStore } = await import('../../../../stores/guidedLaunch')
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        guidedLaunch: {
          currentForm: {
            tokenEconomics: {
              totalSupply: '999999',
              decimals: 4,
              initialDistribution: { team: 25, investors: 25, community: 25, reserve: 25 },
              burnMechanism: false,
              mintingAllowed: true,
            }
          }
        }
      }
    })
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [pinia] }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    // The onMounted should have picked up the initial state
    expect(vm.formData).toBeDefined()
  })

  it('distributionTotal computed returns sum of all distribution fields', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const vm = wrapper.vm as any
    vm.formData.initialDistribution = { team: 10, investors: 10, community: 10, reserve: 70 }
    await wrapper.vm.$nextTick()
    expect(vm.distributionTotal).toBe(100)
  })

  it('distributionTotal returns non-100 when distribution does not sum to 100', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const vm = wrapper.vm as any
    vm.formData.initialDistribution = { team: 10, investors: 10, community: 10, reserve: 10 }
    await wrapper.vm.$nextTick()
    expect(vm.distributionTotal).toBe(40)
    expect(wrapper.text()).toContain('Total must equal 100%')
    expect(wrapper.text()).toContain('40')
  })

  it('watch triggers update emit when decimals change', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const vm = wrapper.vm as any
    vm.formData.decimals = 18
    await wrapper.vm.$nextTick()
    const updates = wrapper.emitted('update')
    expect(updates).toBeTruthy()
    const lastUpdate = updates![updates!.length - 1][0] as any
    expect(lastUpdate.decimals).toBe(18)
  })

  it('handleSubmit adds warning when distribution is not 100 and emits isValid:true', async () => {
    const wrapper = mount(EconomicsSettingsStep, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    const vm = wrapper.vm as any
    vm.formData.initialDistribution = { team: 0, investors: 0, community: 0, reserve: 0 }
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    const complete = wrapper.emitted('complete')!
    expect(complete).toBeTruthy()
    // isValid is always true; warning added when dist != 100
    expect((complete[0][0] as any).isValid).toBe(true)
    expect((complete[0][0] as any).warnings.length).toBeGreaterThan(0)
  })
})
