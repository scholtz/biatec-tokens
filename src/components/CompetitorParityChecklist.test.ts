import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CompetitorParityChecklist from './CompetitorParityChecklist.vue'

describe('CompetitorParityChecklist Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Competitor Parity Tracker')
    })

    it('should display all three competitors', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('Pera Wallet')
      expect(wrapper.text()).toContain('Defly Wallet')
      expect(wrapper.text()).toContain('Folks Finance')
    })

    it('should display competitor descriptions', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('Self-custody wallet for Algorand assets')
      expect(wrapper.text()).toContain('DeFi-focused trading wallet')
      expect(wrapper.text()).toContain('Leading Algorand DeFi protocol')
    })

    it('should display completion percentage', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Initially should be 0%
      expect(wrapper.text()).toContain('0%')
    })
  })

  describe('Feature Management', () => {
    it('should start with all features unchecked', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      const checkboxes = wrapper.findAll('button[class*="border-2"]')
      expect(checkboxes.length).toBeGreaterThan(0)
      
      // Check that none have the completed class
      const completedCheckboxes = wrapper.findAll('button[class*="bg-purple-500"]')
      expect(completedCheckboxes.length).toBe(0)
    })

    it('should toggle feature completion on click', async () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Find the first checkbox
      const firstCheckbox = wrapper.findAll('button[class*="border-2"]')[0]
      expect(firstCheckbox).toBeDefined()
      
      // Click to complete
      await firstCheckbox.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Check that completion percentage increased
      expect(wrapper.text()).not.toContain('0%')
      
      // Click again to uncheck
      await firstCheckbox.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should be back to 0%
      expect(wrapper.text()).toContain('0%')
    })

    it('should update completion count when features are checked', async () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Get initial count text
      const initialText = wrapper.text()
      expect(initialText).toContain('0 / ')
      
      // Click first checkbox
      const checkboxes = wrapper.findAll('button[class*="border-2"]')
      await checkboxes[0].trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should show 1 completed
      expect(wrapper.text()).toContain('1 / ')
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should save state to localStorage when feature is toggled', async () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Click a checkbox
      const firstCheckbox = wrapper.findAll('button[class*="border-2"]')[0]
      await firstCheckbox.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Check that localStorage was updated
      const stored = localStorage.getItem('biatec_competitor_parity_checklist')
      expect(stored).toBeTruthy()
      
      const data = JSON.parse(stored!)
      expect(data).toBeInstanceOf(Array)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should load state from localStorage on mount', async () => {
      // Set up localStorage with some completed features
      const mockData = [
        {
          name: 'Pera Wallet',
          features: [
            { id: 'pera-asa-support', completed: true },
            { id: 'pera-nft-gallery', completed: false }
          ]
        }
      ]
      localStorage.setItem('biatec_competitor_parity_checklist', JSON.stringify(mockData))
      
      // Mount component
      const wrapper = mount(CompetitorParityChecklist)
      await wrapper.vm.$nextTick()
      
      // Should show non-zero completion
      expect(wrapper.text()).not.toContain('0%')
    })

    it('should preserve state across remounts', async () => {
      // First mount - toggle a feature
      let wrapper = mount(CompetitorParityChecklist)
      const firstCheckbox = wrapper.findAll('button[class*="border-2"]')[0]
      await firstCheckbox.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Get the completion percentage
      const firstCompletionText = wrapper.text().match(/(\d+)%/)?.[1]
      
      // Unmount
      wrapper.unmount()
      
      // Second mount - should restore state
      wrapper = mount(CompetitorParityChecklist)
      await wrapper.vm.$nextTick()
      
      const secondCompletionText = wrapper.text().match(/(\d+)%/)?.[1]
      expect(secondCompletionText).toBe(firstCompletionText)
      expect(secondCompletionText).not.toBe('0')
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate completion percentage correctly', async () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Get all checkboxes
      const checkboxes = wrapper.findAll('button[class*="border-2"]')
      const totalFeatures = checkboxes.length
      
      // Complete half of them
      const halfCount = Math.floor(totalFeatures / 2)
      for (let i = 0; i < halfCount; i++) {
        await checkboxes[i].trigger('click')
      }
      await wrapper.vm.$nextTick()
      
      // Calculate expected percentage
      const expectedPercentage = Math.round((halfCount / totalFeatures) * 100)
      
      // Check that the displayed percentage matches
      expect(wrapper.text()).toContain(`${expectedPercentage}%`)
    })

    it('should show 100% when all features are completed', async () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Complete all checkboxes
      const checkboxes = wrapper.findAll('button[class*="border-2"]')
      for (const checkbox of checkboxes) {
        await checkbox.trigger('click')
      }
      await wrapper.vm.$nextTick()
      
      // Should show 100%
      expect(wrapper.text()).toContain('100%')
    })
  })

  describe('Competitor-specific Features', () => {
    it('should display Pera Wallet features', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('Full ASA management')
      expect(wrapper.text()).toContain('NFT gallery view')
      expect(wrapper.text()).toContain('WalletConnect dApp integration')
      expect(wrapper.text()).toContain('ARC-3 metadata display')
      expect(wrapper.text()).toContain('ARC-19 mutable NFT support')
      expect(wrapper.text()).toContain('ARC-69 on-chain metadata support')
    })

    it('should display Defly Wallet features', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('DEX aggregator')
      expect(wrapper.text()).toContain('portfolio analytics')
      expect(wrapper.text()).toContain('ASA trading interface')
      expect(wrapper.text()).toContain('price charts')
    })

    it('should display Folks Finance features', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('lending/borrowing')
      expect(wrapper.text()).toContain('staking')
      expect(wrapper.text()).toContain('Liquidity pool')
      expect(wrapper.text()).toContain('Cross-chain lending')
    })
  })

  describe('UI Elements', () => {
    it('should display competitor icons', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('👛') // Pera Wallet
      expect(wrapper.text()).toContain('🦋') // Defly
      expect(wrapper.text()).toContain('🏦') // Folks Finance
    })

    it('should show informational summary', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      expect(wrapper.text()).toContain('Why track competitor parity?')
      expect(wrapper.text()).toContain('Biatec Tokens')
      expect(wrapper.text()).toContain('Algorand ecosystem')
    })

    it('should display progress bar', () => {
      const wrapper = mount(CompetitorParityChecklist)
      
      // Check for progress bar element
      const progressBar = wrapper.find('.bg-gradient-to-r.from-purple-500.to-pink-500')
      expect(progressBar.exists()).toBe(true)
    })
  })
})
