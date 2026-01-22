import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RwaPresetSelector from './RwaPresetSelector.vue'
import { useTokenStore } from '../stores/tokens'

describe('RwaPresetSelector Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('RWA Compliance Presets')
    })

    it('should display MICA Compliant badge', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('MICA Compliant')
    })

    it('should display description text', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('Pre-configured tokens with MICA-aligned compliance features')
    })

    it('should display legal disclaimer', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('Legal Disclaimer')
      expect(wrapper.text()).toContain('do not constitute legal advice')
    })
  })

  describe('RWA Presets Display', () => {
    it('should display all 5 RWA presets', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const tokenStore = useTokenStore()
      expect(tokenStore.rwaTokenTemplates).toHaveLength(5)

      // Check preset names are visible
      expect(wrapper.text()).toContain('RWA Security Token (Whitelisted)')
      expect(wrapper.text()).toContain('RWA Real Estate Token')
      expect(wrapper.text()).toContain('RWA E-Money Token')
      expect(wrapper.text()).toContain('RWA Carbon Credit Token')
      expect(wrapper.text()).toContain('RWA Supply Chain Asset Token')
    })

    it('should display feature badges for each preset', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      // Security token should show all features
      expect(wrapper.text()).toContain('Whitelist')
      expect(wrapper.text()).toContain('Transfer Restrictions')
      expect(wrapper.text()).toContain('Issuer Controls')
      expect(wrapper.text()).toContain('KYC Required')
    })

    it('should display network and standard for each preset', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('ARC200')
      expect(wrapper.text()).toContain('ARC3FT')
      expect(wrapper.text()).toContain('VOI')
      expect(wrapper.text()).toContain('Aramid')
      expect(wrapper.text()).toContain('Both')
    })
  })

  describe('Preset Selection', () => {
    it('should allow selecting a preset', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )

      expect(securityTokenButton).toBeDefined()
      await securityTokenButton!.trigger('click')
      await flushPromises()

      // Should display detailed information
      expect(wrapper.text()).toContain('Implementation Guidance')
      expect(wrapper.text()).toContain('Legal & Regulatory Compliance')
      expect(wrapper.text()).toContain('Compliance Implications & Requirements')
    })

    it('should show compliance implications when preset is selected', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )

      await securityTokenButton!.trigger('click')
      await flushPromises()

      // Should show specific compliance implications
      expect(wrapper.text()).toContain('KYC/AML verification')
      expect(wrapper.text()).toContain('whitelisted addresses')
      expect(wrapper.text()).toContain('regulatory authorities')
    })

    it('should display enabled features matrix when preset is selected', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )

      await securityTokenButton!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Enabled Features')
      expect(wrapper.text()).toContain('Whitelist Enabled')
      expect(wrapper.text()).toContain('Transfer Restrictions')
    })

    it('should display use cases when preset is selected', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )

      await securityTokenButton!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Recommended Use Cases')
      expect(wrapper.text()).toContain('Equity tokenization')
    })

    it('should show Apply and Clear buttons when preset is selected', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )

      await securityTokenButton!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Apply This Preset')
      expect(wrapper.text()).toContain('Clear Selection')
    })
  })

  describe('Preset Application', () => {
    it('should emit apply-preset event when Apply button is clicked', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      // Select a preset
      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )
      await securityTokenButton!.trigger('click')
      await flushPromises()

      // Click Apply button
      const applyButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Apply This Preset')
      )
      await applyButton!.trigger('click')
      await flushPromises()

      // Check if event was emitted
      expect(wrapper.emitted('apply-preset')).toBeTruthy()
      expect(wrapper.emitted('apply-preset')![0]).toEqual(['rwa-security-token'])
    })

    it('should clear selection when Clear button is clicked', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      // Select a preset
      const buttons = wrapper.findAll('button')
      const securityTokenButton = buttons.find(btn => 
        btn.text().includes('RWA Security Token (Whitelisted)')
      )
      await securityTokenButton!.trigger('click')
      await flushPromises()

      // Verify details are shown
      expect(wrapper.text()).toContain('Implementation Guidance')

      // Click Clear button
      const clearButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Clear Selection')
      )
      await clearButton!.trigger('click')
      await flushPromises()

      // Details should be hidden
      expect(wrapper.text()).not.toContain('Implementation Guidance')
    })
  })

  describe('RWA Feature Variations', () => {
    it('should show different features for different presets', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      // Check Carbon Credit token (no whitelist, no KYC)
      const buttons = wrapper.findAll('button')
      const carbonButton = buttons.find(btn => 
        btn.text().includes('RWA Carbon Credit Token')
      )

      // Carbon credit should NOT have all features
      const carbonText = carbonButton!.text()
      expect(carbonText).toContain('Transfer Restrictions')
      expect(carbonText).toContain('Issuer Controls')
      // Should not have these badges in the button
      expect(carbonText).not.toContain('Whitelist')
      expect(carbonText).not.toContain('KYC Required')
    })

    it('should display E-Money token without transfer restrictions', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const eMoneyButton = buttons.find(btn => 
        btn.text().includes('RWA E-Money Token')
      )

      const eMoneyText = eMoneyButton!.text()
      expect(eMoneyText).toContain('Whitelist')
      expect(eMoneyText).toContain('Issuer Controls')
      expect(eMoneyText).toContain('KYC Required')
      // E-Money should not have transfer restrictions
      expect(eMoneyText).not.toContain('Transfer Restrictions')
    })
  })

  describe('Compliance Information', () => {
    it('should display at least 7 compliance implications for Security Token', async () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const tokenStore = useTokenStore()
      const securityToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-security-token')
      
      expect(securityToken?.complianceImplications).toBeDefined()
      expect(securityToken?.complianceImplications!.length).toBeGreaterThanOrEqual(7)
    })

    it('should format feature names from camelCase to readable text', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const vm = wrapper.vm as any
      expect(vm.formatFeatureName('whitelistEnabled')).toBe('Whitelist Enabled')
      expect(vm.formatFeatureName('kycRequired')).toBe('Kyc Required')
      expect(vm.formatFeatureName('issuerControls')).toBe('Issuer Controls')
    })
  })

  describe('Network-Specific Presets', () => {
    it('should have Real Estate token for Aramid network', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const tokenStore = useTokenStore()
      const realEstateToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-real-estate-token')
      
      expect(realEstateToken?.network).toBe('Aramid')
    })

    it('should have Carbon Credit token for VOI network', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const tokenStore = useTokenStore()
      const carbonToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-carbon-credit')
      
      expect(carbonToken?.network).toBe('VOI')
    })

    it('should have Security token for Both networks', () => {
      const wrapper = mount(RwaPresetSelector, {
        global: {
          plugins: [pinia]
        }
      })

      const tokenStore = useTokenStore()
      const securityToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-security-token')
      
      expect(securityToken?.network).toBe('Both')
    })
  })
})
