import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenDraftStore } from '../../../../stores/tokenDraft'
import { useTokenStore } from '../../../../stores/tokens'
import { useSubscriptionStore } from '../../../../stores/subscription'
import TokenDetailsStep from '../TokenDetailsStep.vue'
import WizardStep from '../../WizardStep.vue'
import Input from '../../../ui/Input.vue'

describe('TokenDetailsStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    
    // Initialize token store with mock data
    const tokenStore = useTokenStore()
    tokenStore.networkGuidance = [
      {
        name: 'VOI',
        displayName: 'VOI Network',
        description: 'Fast and eco-friendly blockchain',
        fees: { creation: '$0.01' },
        bestFor: ['NFTs', 'Tokens'],
      },
      {
        name: 'Ethereum',
        displayName: 'Ethereum',
        description: 'Leading smart contract platform',
        fees: { creation: '$50-200' },
        bestFor: ['DeFi', 'Tokens'],
      },
    ]
    
    // Mock subscription store to allow all access in tests
    const subscriptionStore = useSubscriptionStore()
    subscriptionStore.subscription = {
      customer_id: 'test_customer',
      subscription_id: 'test_sub',
      subscription_status: 'active',
      price_id: 'price_enterprise_monthly',
      current_period_start: Date.now() / 1000,
      current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
      cancel_at_period_end: false,
      payment_method_brand: 'visa',
      payment_method_last4: '4242'
    }
    subscriptionStore.fetchSubscription = vi.fn().mockResolvedValue(undefined)
  })

  describe('Form Rendering', () => {
    it('should render network selection section', () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      expect(wrapper.text()).toContain('Choose Your Network')
    })

    it('should not show token standard section initially', () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.formData.selectedNetwork).toBeNull()
    })

    it('should show token standard section after network selection', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Choose Token Type')
    })

    it('should show token details form after standard selection', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Token Information')
    })
  })

  describe('Network Selection', () => {
    it('should select network when clicked', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')

      expect(vm.formData.selectedNetwork).toBe('VOI')
    })

    it('should reset standard when network changes', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')
      await vm.selectNetwork('Ethereum')

      expect(vm.formData.selectedStandard).toBe('')
    })

    it('should clear validation error when network selected', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.fieldErrors.selectedNetwork = 'Please select a network'
      await vm.selectNetwork('VOI')

      // After selecting network, error should be cleared or undefined
      expect(vm.fieldErrors.selectedNetwork).toBeFalsy()
    })
  })

  describe('Token Standard Selection', () => {
    it('should show AVM standards for AVM networks', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await wrapper.vm.$nextTick()

      const standards = vm.availableStandards
      const standardNames = standards.map((s: any) => s.value)
      expect(standardNames).toContain('ASA')
      expect(standardNames).toContain('ARC3FT')
      expect(standardNames).toContain('ARC200')
    })

    it('should show EVM standards for Ethereum', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('Ethereum')
      await wrapper.vm.$nextTick()

      const standards = vm.availableStandards
      const standardNames = standards.map((s: any) => s.value)
      expect(standardNames).toContain('ERC20')
      expect(standardNames).toContain('ERC721')
    })

    it('should set decimals to 0 for NFT standards', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ARC3NFT')

      expect(vm.formData.decimals).toBe(0)
    })

    it('should set default decimals for fungible tokens', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.decimals = 0
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')

      expect(vm.formData.decimals).toBe(6)
    })
  })

  describe('Field Validation', () => {
    it('should validate token name is required', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.name = ''
      await vm.validateField('name')

      expect(vm.fieldErrors.name).toBe('Token name is required')
    })

    it('should validate token name length', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.name = 'A'.repeat(51)
      await vm.validateField('name')

      expect(vm.fieldErrors.name).toBe('Token name must be 50 characters or less')
    })

    it('should validate token symbol is required', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.symbol = ''
      await vm.validateField('symbol')

      expect(vm.fieldErrors.symbol).toBe('Token symbol is required')
    })

    it('should validate description minimum length', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.description = 'short'
      await vm.validateField('description')

      expect(vm.fieldErrors.description).toBe('Description must be at least 10 characters')
    })

    it('should validate supply is greater than 0', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.supply = '0'
      await vm.validateField('supply')

      expect(vm.fieldErrors.supply).toBe('Supply must be greater than 0')
    })

    it('should validate decimals range', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.decimals = 19
      await vm.validateField('decimals')

      expect(vm.fieldErrors.decimals).toBe('Decimals must be between 0 and 18')
    })
  })

  describe('TokenDraft Store Integration', () => {
    it('should save form data to draft store on change', async () => {
      const tokenDraftStore = useTokenDraftStore()
      
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      vm.formData.name = 'Test Token'
      vm.formData.symbol = 'TEST'
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(tokenDraftStore.currentDraft?.name).toBe('Test Token')
      expect(tokenDraftStore.currentDraft?.symbol).toBe('TEST')
    })

    it('should load draft data on mount', async () => {
      const tokenDraftStore = useTokenDraftStore()
      tokenDraftStore.initializeDraft()
      tokenDraftStore.updateDraft({
        name: 'Loaded Token',
        symbol: 'LOAD',
        description: 'Test description',
        supply: 1000000,
        decimals: 6,
        selectedNetwork: 'voi-mainnet',
        selectedStandard: 'ASA',
      })

      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.formData.name).toBe('Loaded Token')
      expect(vm.formData.symbol).toBe('LOAD')
      expect(vm.formData.selectedNetwork).toBe('VOI')
    })
  })

  describe('Validation State', () => {
    it('should be invalid when form is incomplete', () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.isValid).toBe(false)
    })

    it('should be valid when all required fields are filled', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')
      vm.formData.name = 'Test Token'
      vm.formData.symbol = 'TEST'
      vm.formData.description = 'This is a test token description'
      vm.formData.supply = '1000000'
      vm.formData.decimals = 6
      await wrapper.vm.$nextTick()

      expect(vm.isValid).toBe(true)
    })
  })

  describe('Summary Preview', () => {
    it('should show summary when form is complete', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')
      vm.formData.name = 'Test Token'
      vm.formData.symbol = 'TEST'
      vm.formData.description = 'This is a test token'
      vm.formData.supply = '1000000'
      vm.formData.decimals = 6
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Summary')
      expect(wrapper.text()).toContain('Test Token')
      expect(wrapper.text()).toContain('TEST')
    })

    it('should format supply with commas in summary', async () => {
      const wrapper = mount(TokenDetailsStep, {
        global: {
          components: { WizardStep, Input },
        },
      })

      const vm = wrapper.vm as any
      await vm.selectNetwork('VOI')
      await vm.selectStandard('ASA')
      vm.formData.name = 'Test'
      vm.formData.symbol = 'T'
      vm.formData.description = 'Test description'
      vm.formData.supply = '1000000'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('1,000,000')
    })
  })
})
