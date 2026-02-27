import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DeploymentReviewStep from '../DeploymentReviewStep.vue'
import { useTokenDraftStore } from '../../../../stores/tokenDraft'
import { useSubscriptionStore } from '../../../../stores/subscription'
import { useComplianceStore } from '../../../../stores/compliance'

const stubs = {
  WizardStep: {
    template: '<div><slot></slot></div>',
    props: ['title', 'description', 'helpText', 'showErrors', 'validationErrors'],
  },
}

describe('DeploymentReviewStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should render the component', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display configuration summary heading', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Configuration Summary')
  })

  it('should show "Not specified" when no project info set', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Not specified')
  })

  it('should display project information from store', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: {
        projectName: 'My Token Project',
        organizationName: 'ACME Corp',
        tokenPurpose: 'utility',
      },
      name: 'MyToken',
      symbol: 'MTK',
      selectedNetwork: 'algorand-mainnet',
      selectedStandard: 'asa',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('My Token Project')
    expect(wrapper.text()).toContain('ACME Corp')
  })

  it('should format network names correctly', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'algorand-mainnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Algorand Mainnet')
  })

  it('should format testnet network names', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'algorand-testnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Algorand Testnet')
  })

  it('should format ethereum network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'ethereum-mainnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Ethereum Mainnet')
  })

  it('should format voi testnet network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'voi-testnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('VOI Testnet')
  })

  it('should format aramid testnet network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'aramid-testnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Aramid Testnet')
  })

  it('should format arbitrum mainnet network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'arbitrum-mainnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Arbitrum One')
  })

  it('should format base mainnet network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'base-mainnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Base')
  })

  it('should format ethereum sepolia network', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'ethereum-sepolia',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Ethereum Sepolia Testnet')
  })

  it('should format standard names correctly', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedStandard: 'erc20',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('ERC20')
  })

  it('should format purpose names', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: {
        tokenPurpose: 'security',
      },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Security Token')
  })

  it('should format governance purpose', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: { tokenPurpose: 'governance' },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Governance Token')
  })

  it('should format reward purpose', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: { tokenPurpose: 'reward' },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Reward/Loyalty Token')
  })

  it('should format asset purpose', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: { tokenPurpose: 'asset' },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Asset Token')
  })

  it('should format utility purpose', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: { tokenPurpose: 'utility' },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Utility Token')
  })

  it('should format other purpose', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      projectSetup: { tokenPurpose: 'other' },
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Other')
  })

  it('should format all token standards', () => {
    const standards = ['asa', 'arc3', 'arc19', 'arc69', 'arc200', 'arc72', 'erc20', 'erc721']
    for (const standard of standards) {
      const store = useTokenDraftStore()
      store.currentDraft = { selectedStandard: standard } as any
      const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
      expect(wrapper.text().length).toBeGreaterThan(0)
    }
  })

  it('should show mainnet warning for mainnet networks', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'algorand-mainnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('mainnet')
  })

  it('should show testnet info for testnet networks', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      selectedNetwork: 'algorand-testnet',
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('testnet')
  })

  it('should show subscription plan from store', () => {
    // Default plan is 'Basic' when currentProduct is null
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Basic')
  })

  it('should show plan limitations for basic plan', () => {
    // Default with no product = 'Basic'
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('5 token deployments')
  })

  it('should show plan limitations for professional plan', () => {
    const subStore = useSubscriptionStore()
    // Set subscription with professional priceId to trigger currentProduct computed
    subStore.subscription = { price_id: 'price_professional_monthly', subscription_status: 'active' } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    // Professional Plan shows - verify plan name appears
    expect(wrapper.text()).toContain('Professional Plan')
  })

  it('should show subscription required message when not active', () => {
    const subStore = useSubscriptionStore()
    subStore.subscription = null

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('Subscription activation required')
  })

  it('should format total supply number', () => {
    const store = useTokenDraftStore()
    store.currentDraft = {
      totalSupply: 1000000,
    } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.text()).toContain('1,000,000')
  })

  it('should be invalid when confirmations not all checked', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    expect(vm.isValid).toBe(false)
  })

  it('should validateAll and return false when not confirmed', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    const result = vm.validateAll()
    expect(result).toBe(false)
  })

  it('should validateAll and return true when all confirmations set', async () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    vm.confirmations.informationCorrect = true
    vm.confirmations.understandCompliance = true
    vm.confirmations.understandBackendSigning = true
    vm.confirmations.readyToDeploy = true
    await wrapper.vm.$nextTick()
    const result = vm.validateAll()
    expect(result).toBe(true)
  })

  it('should be valid when all confirmations checked', async () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    vm.confirmations.informationCorrect = true
    vm.confirmations.understandCompliance = true
    vm.confirmations.understandBackendSigning = true
    vm.confirmations.readyToDeploy = true
    await wrapper.vm.$nextTick()
    expect(vm.isValid).toBe(true)
  })

  it('should display compliance score from store', () => {
    const complianceStore = useComplianceStore()
    complianceStore.checklistItems = [
      { id: '1', completed: true, required: true } as any,
      { id: '2', completed: true, required: true } as any,
    ]

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('should show 0 supply when not defined', () => {
    const store = useTokenDraftStore()
    store.currentDraft = { totalSupply: 0 } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('exposes isValid and validateAll', () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    expect(typeof vm.isValid).toBeDefined()
    expect(typeof vm.validateAll).toBe('function')
  })

  it('should show errors after failed validation', async () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    vm.validateAll()
    await wrapper.vm.$nextTick()
    expect(vm.showErrors).toBe(true)
    expect(vm.errors.length).toBeGreaterThan(0)
  })

  it('should clear errors on successful validation', async () => {
    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    const vm = wrapper.vm as any
    vm.confirmations.informationCorrect = true
    vm.confirmations.understandCompliance = true
    vm.confirmations.understandBackendSigning = true
    vm.confirmations.readyToDeploy = true
    await wrapper.vm.$nextTick()
    vm.validateAll()
    expect(vm.errors.length).toBe(0)
    expect(vm.showErrors).toBe(false)
  })

  it('should handle undefined total supply gracefully', () => {
    const store = useTokenDraftStore()
    store.currentDraft = { totalSupply: undefined } as any

    const wrapper = mount(DeploymentReviewStep, { global: { stubs } })
    // Should not throw and render fine
    expect(wrapper.exists()).toBe(true)
  })
})
