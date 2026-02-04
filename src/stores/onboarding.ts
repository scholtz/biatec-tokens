import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  optional: boolean
}

export interface OnboardingState {
  hasSeenWelcome: boolean
  hasConnectedWallet: boolean
  hasSelectedStandards: boolean
  hasSavedFilters: boolean
  hasViewedToken: boolean
  completedAt: string | null
  preferredStandards: string[]
  preferredChains: string[]
}

const ONBOARDING_STORAGE_KEY = 'biatec_onboarding_state'

export const useOnboardingStore = defineStore('onboarding', () => {
  // State
  const state = ref<OnboardingState>({
    hasSeenWelcome: false,
    hasConnectedWallet: false,
    hasSelectedStandards: false,
    hasSavedFilters: false,
    hasViewedToken: false,
    completedAt: null,
    preferredStandards: [],
    preferredChains: [],
  })

  const isOnboardingVisible = ref(false)

  // Computed
  const steps = computed<OnboardingStep[]>(() => [
    {
      id: 'welcome',
      title: 'Welcome to Biatec',
      description: 'Learn about the platform and what you can do',
      completed: state.value.hasSeenWelcome,
      optional: false,
    },
    {
      id: 'connect-wallet',
      title: 'Connect Your Wallet',
      description: 'Authenticate with your preferred wallet provider',
      completed: state.value.hasConnectedWallet,
      optional: true,
    },
    {
      id: 'select-standards',
      title: 'Choose Token Standards',
      description: 'Select the token standards you are interested in',
      completed: state.value.hasSelectedStandards,
      optional: false,
    },
    {
      id: 'save-filters',
      title: 'Save Your Preferences',
      description: 'Set up filters to find tokens that match your criteria',
      completed: state.value.hasSavedFilters,
      optional: false,
    },
    {
      id: 'explore-tokens',
      title: 'Explore the Marketplace',
      description: 'View token details and discover opportunities',
      completed: state.value.hasViewedToken,
      optional: false,
    },
  ])

  const completedSteps = computed(() => steps.value.filter(s => s.completed).length)
  const totalSteps = computed(() => steps.value.length)
  const progressPercentage = computed(() => 
    Math.round((completedSteps.value / totalSteps.value) * 100)
  )
  const isOnboardingComplete = computed(() => state.value.completedAt !== null)
  const shouldShowOnboarding = computed(() => 
    !isOnboardingComplete.value && !state.value.hasSeenWelcome
  )

  // Actions
  const initialize = () => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        state.value = { ...state.value, ...parsed }
      } catch (error) {
        console.error('Failed to parse onboarding state:', error)
      }
    }
  }

  const persist = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state.value))
  }

  const markStepComplete = (stepId: string) => {
    switch (stepId) {
      case 'welcome':
        state.value.hasSeenWelcome = true
        break
      case 'connect-wallet':
        state.value.hasConnectedWallet = true
        break
      case 'select-standards':
        state.value.hasSelectedStandards = true
        break
      case 'save-filters':
        state.value.hasSavedFilters = true
        break
      case 'explore-tokens':
        state.value.hasViewedToken = true
        break
    }
    persist()
  }

  const setPreferredStandards = (standards: string[]) => {
    state.value.preferredStandards = standards
    state.value.hasSelectedStandards = standards.length > 0
    persist()
  }

  const setPreferredChains = (chains: string[]) => {
    state.value.preferredChains = chains
    persist()
  }

  const completeOnboarding = () => {
    state.value.completedAt = new Date().toISOString()
    isOnboardingVisible.value = false
    persist()
  }

  const resetOnboarding = () => {
    state.value = {
      hasSeenWelcome: false,
      hasConnectedWallet: false,
      hasSelectedStandards: false,
      hasSavedFilters: false,
      hasViewedToken: false,
      completedAt: null,
      preferredStandards: [],
      preferredChains: [],
    }
    persist()
  }

  const showOnboarding = () => {
    isOnboardingVisible.value = true
  }

  const hideOnboarding = () => {
    isOnboardingVisible.value = false
  }

  return {
    state,
    isOnboardingVisible,
    steps,
    completedSteps,
    totalSteps,
    progressPercentage,
    isOnboardingComplete,
    shouldShowOnboarding,
    initialize,
    persist,
    markStepComplete,
    setPreferredStandards,
    setPreferredChains,
    completeOnboarding,
    resetOnboarding,
    showOnboarding,
    hideOnboarding,
  }
})
