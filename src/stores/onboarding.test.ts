import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOnboardingStore } from './onboarding'

describe('Onboarding Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const store = useOnboardingStore()
      
      expect(store.state.hasSeenWelcome).toBe(false)
      expect(store.state.hasConnectedWallet).toBe(false)
      expect(store.state.hasSelectedStandards).toBe(false)
      expect(store.state.hasSavedFilters).toBe(false)
      expect(store.state.hasViewedToken).toBe(false)
      expect(store.state.completedAt).toBeNull()
      expect(store.state.preferredStandards).toEqual([])
      expect(store.state.preferredChains).toEqual([])
    })

    it('should load state from localStorage', () => {
      const savedState = {
        hasSeenWelcome: true,
        hasConnectedWallet: false,
        hasSelectedStandards: true,
        hasSavedFilters: false,
        hasViewedToken: false,
        completedAt: null,
        preferredStandards: ['ARC200', 'ERC20'],
        preferredChains: ['voi-mainnet'],
      }
      localStorage.setItem('biatec_onboarding_state', JSON.stringify(savedState))
      
      const store = useOnboardingStore()
      store.initialize()
      
      expect(store.state.hasSeenWelcome).toBe(true)
      expect(store.state.hasSelectedStandards).toBe(true)
      expect(store.state.preferredStandards).toEqual(['ARC200', 'ERC20'])
      expect(store.state.preferredChains).toEqual(['voi-mainnet'])
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('biatec_onboarding_state', 'invalid-json')
      
      const store = useOnboardingStore()
      store.initialize()
      
      // Should fall back to default state
      expect(store.state.hasSeenWelcome).toBe(false)
    })
  })

  describe('Steps', () => {
    it('should return correct steps array', () => {
      const store = useOnboardingStore()
      
      expect(store.steps).toHaveLength(5)
      expect(store.steps[0].id).toBe('welcome')
      expect(store.steps[1].id).toBe('connect-wallet')
      expect(store.steps[2].id).toBe('select-standards')
      expect(store.steps[3].id).toBe('save-filters')
      expect(store.steps[4].id).toBe('explore-tokens')
    })

    it('should mark steps as completed correctly', () => {
      const store = useOnboardingStore()
      store.markStepComplete('welcome')
      
      expect(store.steps[0].completed).toBe(true)
      expect(store.steps[1].completed).toBe(false)
    })
  })

  describe('Progress Tracking', () => {
    it('should calculate completed steps correctly', () => {
      const store = useOnboardingStore()
      
      expect(store.completedSteps).toBe(0)
      
      store.markStepComplete('welcome')
      expect(store.completedSteps).toBe(1)
      
      store.markStepComplete('connect-wallet')
      expect(store.completedSteps).toBe(2)
    })

    it('should calculate progress percentage correctly', () => {
      const store = useOnboardingStore()
      
      expect(store.progressPercentage).toBe(0)
      
      store.markStepComplete('welcome')
      expect(store.progressPercentage).toBe(20) // 1 of 5 steps
      
      store.markStepComplete('select-standards')
      expect(store.progressPercentage).toBe(40) // 2 of 5 steps
    })

    it('should track total steps correctly', () => {
      const store = useOnboardingStore()
      
      expect(store.totalSteps).toBe(5)
    })
  })

  describe('Step Completion', () => {
    it('should mark welcome step as complete', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('welcome')
      
      expect(store.state.hasSeenWelcome).toBe(true)
    })

    it('should mark wallet connect step as complete', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('connect-wallet')
      
      expect(store.state.hasConnectedWallet).toBe(true)
    })

    it('should mark standards selection step as complete', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('select-standards')
      
      expect(store.state.hasSelectedStandards).toBe(true)
    })

    it('should mark save filters step as complete', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('save-filters')
      
      expect(store.state.hasSavedFilters).toBe(true)
    })

    it('should mark explore tokens step as complete', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('explore-tokens')
      
      expect(store.state.hasViewedToken).toBe(true)
    })
  })

  describe('Preferences', () => {
    it('should set preferred standards', () => {
      const store = useOnboardingStore()
      const standards = ['ARC200', 'ERC20', 'ARC72']
      
      store.setPreferredStandards(standards)
      
      expect(store.state.preferredStandards).toEqual(standards)
      expect(store.state.hasSelectedStandards).toBe(true)
    })

    it('should set preferred chains', () => {
      const store = useOnboardingStore()
      const chains = ['voi-mainnet', 'algorand-mainnet']
      
      store.setPreferredChains(chains)
      
      expect(store.state.preferredChains).toEqual(chains)
    })

    it('should mark standards as not selected when empty array provided', () => {
      const store = useOnboardingStore()
      
      store.setPreferredStandards(['ARC200'])
      expect(store.state.hasSelectedStandards).toBe(true)
      
      store.setPreferredStandards([])
      expect(store.state.hasSelectedStandards).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist state to localStorage on step completion', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('welcome')
      
      const saved = localStorage.getItem('biatec_onboarding_state')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.hasSeenWelcome).toBe(true)
    })

    it('should persist preferred standards', () => {
      const store = useOnboardingStore()
      const standards = ['ARC200', 'ERC20']
      
      store.setPreferredStandards(standards)
      
      const saved = localStorage.getItem('biatec_onboarding_state')
      const parsed = JSON.parse(saved!)
      expect(parsed.preferredStandards).toEqual(standards)
    })
  })

  describe('Completion', () => {
    it('should mark onboarding as complete', () => {
      const store = useOnboardingStore()
      
      store.completeOnboarding()
      
      expect(store.state.completedAt).toBeTruthy()
      expect(store.isOnboardingComplete).toBe(true)
      expect(store.isOnboardingVisible).toBe(false)
    })

    it('should not show onboarding after completion', () => {
      const store = useOnboardingStore()
      
      store.completeOnboarding()
      
      expect(store.shouldShowOnboarding).toBe(false)
    })

    it('should persist completion state', () => {
      const store = useOnboardingStore()
      
      store.completeOnboarding()
      
      const saved = localStorage.getItem('biatec_onboarding_state')
      const parsed = JSON.parse(saved!)
      expect(parsed.completedAt).toBeTruthy()
    })
  })

  describe('Reset', () => {
    it('should reset onboarding state', () => {
      const store = useOnboardingStore()
      
      // Complete some steps
      store.markStepComplete('welcome')
      store.markStepComplete('connect-wallet')
      store.setPreferredStandards(['ARC200'])
      
      // Reset
      store.resetOnboarding()
      
      expect(store.state.hasSeenWelcome).toBe(false)
      expect(store.state.hasConnectedWallet).toBe(false)
      expect(store.state.preferredStandards).toEqual([])
      expect(store.state.completedAt).toBeNull()
    })

    it('should persist reset state to localStorage', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('welcome')
      store.resetOnboarding()
      
      const saved = localStorage.getItem('biatec_onboarding_state')
      const parsed = JSON.parse(saved!)
      expect(parsed.hasSeenWelcome).toBe(false)
    })
  })

  describe('Visibility Control', () => {
    it('should show onboarding', () => {
      const store = useOnboardingStore()
      
      store.showOnboarding()
      
      expect(store.isOnboardingVisible).toBe(true)
    })

    it('should hide onboarding', () => {
      const store = useOnboardingStore()
      
      store.showOnboarding()
      store.hideOnboarding()
      
      expect(store.isOnboardingVisible).toBe(false)
    })
  })

  describe('Edge Cases - Reconnection Scenarios', () => {
    it('should handle reconnection after partial completion', () => {
      const store = useOnboardingStore()
      
      // Simulate partial completion
      store.markStepComplete('welcome')
      store.markStepComplete('connect-wallet')
      
      // Simulate page reload by creating new store instance
      setActivePinia(createPinia())
      const newStore = useOnboardingStore()
      newStore.initialize()
      
      expect(newStore.state.hasSeenWelcome).toBe(true)
      expect(newStore.state.hasConnectedWallet).toBe(true)
      expect(newStore.completedSteps).toBe(2)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('biatec_onboarding_state', 'invalid json')
      
      const store = useOnboardingStore()
      store.initialize()
      
      // Should fall back to default state
      expect(store.state.hasSeenWelcome).toBe(false)
      expect(store.completedSteps).toBe(0)
    })

    it('should handle missing localStorage', () => {
      // localStorage is cleared
      const store = useOnboardingStore()
      store.initialize()
      
      expect(store.state.hasSeenWelcome).toBe(false)
      expect(store.isOnboardingComplete).toBe(false)
    })
  })

  describe('Edge Cases - Skipped Steps', () => {
    it('should allow completing later steps without earlier ones', () => {
      const store = useOnboardingStore()
      
      // Skip welcome and connect directly
      store.markStepComplete('connect-wallet')
      
      expect(store.state.hasConnectedWallet).toBe(true)
      expect(store.state.hasSeenWelcome).toBe(false)
      expect(store.completedSteps).toBe(1)
    })

    it('should handle out-of-order step completion', () => {
      const store = useOnboardingStore()
      
      // Complete steps in reverse order
      store.markStepComplete('explore-tokens')
      store.markStepComplete('save-filters')
      
      expect(store.completedSteps).toBe(2)
      expect(store.state.hasViewedToken).toBe(true)
      expect(store.state.hasSavedFilters).toBe(true)
    })

    it('should not mark onboarding as complete if steps are skipped', () => {
      const store = useOnboardingStore()
      
      // Complete only 2 steps
      store.markStepComplete('welcome')
      store.markStepComplete('connect-wallet')
      
      expect(store.isOnboardingComplete).toBe(false)
      expect(store.completedSteps).toBe(2)
    })
  })

  describe('Edge Cases - Invalid State', () => {
    it('should handle empty preferredStandards array', () => {
      const store = useOnboardingStore()
      
      store.setPreferredStandards([])
      
      expect(store.state.preferredStandards).toEqual([])
    })

    it('should handle null values in localStorage', () => {
      const invalidState = {
        hasSeenWelcome: null,
        preferredStandards: null,
        completedAt: 'invalid-date'
      }
      localStorage.setItem('biatec_onboarding_state', JSON.stringify(invalidState))
      
      const store = useOnboardingStore()
      store.initialize()
      
      // Should handle gracefully - store may leave nulls or convert to defaults
      // Just verify it doesn't crash
      expect(store.state).toBeTruthy()
    })
  })

  describe('Edge Cases - First Launch', () => {
    it('should properly initialize on first launch', () => {
      const store = useOnboardingStore()
      
      expect(store.shouldShowOnboarding).toBe(true)
      expect(store.completedSteps).toBe(0)
      expect(store.totalSteps).toBe(5)
      expect(store.progressPercentage).toBe(0)
    })

    it('should save state after first interaction', () => {
      const store = useOnboardingStore()
      
      store.markStepComplete('welcome')
      
      const saved = localStorage.getItem('biatec_onboarding_state')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.hasSeenWelcome).toBe(true)
    })
  })
})
