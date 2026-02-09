import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnterpriseOnboardingStore } from './enterpriseOnboarding'

describe('Enterprise Onboarding Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      expect(store.steps.length).toBe(7)
      expect(store.isOnboardingComplete).toBe(false)
      expect(store.completedStepsCount).toBe(0)
    })

    it('should create steps in correct order', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const orders = store.steps.map(s => s.order)
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('should include required step properties', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const firstStep = store.steps[0]
      expect(firstStep).toHaveProperty('id')
      expect(firstStep).toHaveProperty('title')
      expect(firstStep).toHaveProperty('description')
      expect(firstStep).toHaveProperty('guidance')
      expect(firstStep).toHaveProperty('status')
      expect(firstStep.status).toBe('not_started')
    })
  })

  describe('Step Status Updates', () => {
    it('should update step status to in_progress', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      store.updateStepStatus(stepId, 'in_progress')

      const step = store.steps.find(s => s.id === stepId)
      expect(step?.status).toBe('in_progress')
    })

    it('should update step status to completed', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      store.updateStepStatus(stepId, 'completed')

      const step = store.steps.find(s => s.id === stepId)
      expect(step?.status).toBe('completed')
      expect(step?.completedAt).toBeDefined()
      expect(step?.completedBy).toBe('Current User')
    })

    it('should update step status to needs_action with error', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      const error = {
        message: 'Document verification failed',
        remediation: 'Please upload a valid document',
        code: 'DOC_INVALID',
      }

      store.updateStepStatus(stepId, 'needs_action', error)

      const step = store.steps.find(s => s.id === stepId)
      expect(step?.status).toBe('needs_action')
      expect(step?.error).toEqual(error)
    })

    it('should track completed steps count', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      expect(store.completedStepsCount).toBe(0)

      store.updateStepStatus(store.steps[0].id, 'completed')
      expect(store.completedStepsCount).toBe(1)

      store.updateStepStatus(store.steps[1].id, 'completed')
      expect(store.completedStepsCount).toBe(2)
    })
  })

  describe('Activity Tracking', () => {
    it('should add activity when step is started', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      store.updateStepStatus(stepId, 'in_progress')

      expect(store.recentActivities.length).toBeGreaterThan(0)
      const activity = store.recentActivities.find(a => a.stepId === stepId)
      expect(activity?.type).toBe('started')
    })

    it('should add activity when step is completed', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      store.updateStepStatus(stepId, 'completed')

      const activity = store.recentActivities.find(a => a.stepId === stepId)
      expect(activity?.type).toBe('completed')
    })

    it('should add activity when step fails', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const stepId = store.steps[0].id
      const error = { message: 'Test error' }
      store.updateStepStatus(stepId, 'needs_action', error)

      const activity = store.recentActivities.find(a => a.stepId === stepId)
      expect(activity?.type).toBe('failed')
    })

    it('should sort activities by timestamp descending', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      // Complete multiple steps
      store.updateStepStatus(store.steps[0].id, 'completed')
      await new Promise(resolve => setTimeout(resolve, 10))
      store.updateStepStatus(store.steps[1].id, 'completed')
      await new Promise(resolve => setTimeout(resolve, 10))
      store.updateStepStatus(store.steps[2].id, 'completed')

      const activities = store.recentActivities
      expect(activities.length).toBeGreaterThan(0)

      // Verify descending order
      for (let i = 0; i < activities.length - 1; i++) {
        const current = new Date(activities[i].timestamp).getTime()
        const next = new Date(activities[i + 1].timestamp).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    it('should limit activities to 20 recent items', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      // Add many activities
      for (let i = 0; i < 25; i++) {
        store.addActivity({
          message: `Test activity ${i}`,
          type: 'updated',
        })
      }

      expect(store.recentActivities.length).toBeLessThanOrEqual(20)
    })
  })

  describe('Persistence', () => {
    it('should save state to localStorage', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')
      store.persist()

      const stored = localStorage.getItem('biatec_enterprise_onboarding_state')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.steps[0].status).toBe('completed')
    })

    it('should load state from localStorage', async () => {
      // Setup initial state
      const store1 = useEnterpriseOnboardingStore()
      await store1.initialize()
      store1.updateStepStatus(store1.steps[0].id, 'completed')
      store1.persist()

      // Create new store instance and load
      setActivePinia(createPinia())
      const store2 = useEnterpriseOnboardingStore()
      store2.loadFromStorage()

      expect(store2.steps[0]?.status).toBe('completed')
    })
  })

  describe('Onboarding Completion', () => {
    it('should mark all steps as completed', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.completeOnboarding()

      expect(store.steps.every(s => s.status === 'completed')).toBe(true)
      expect(store.isOnboardingComplete).toBe(true)
    })

    it('should add completion activity', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.completeOnboarding()

      const activity = store.recentActivities.find(a => 
        a.message.includes('completed successfully')
      )
      expect(activity).toBeDefined()
      expect(activity?.type).toBe('completed')
    })
  })

  describe('Reset', () => {
    it('should reset all steps to not_started', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      // Complete some steps
      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[1].id, 'completed')

      // Reset
      store.resetOnboarding()

      expect(store.steps.every(s => s.status === 'not_started')).toBe(true)
      expect(store.completedStepsCount).toBe(0)
    })

    it('should clear activities on reset', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')
      expect(store.recentActivities.length).toBeGreaterThan(0)

      store.resetOnboarding()
      expect(store.recentActivities.length).toBe(0)
    })
  })

  describe('Step Properties', () => {
    it('should include compliance information for all steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.steps.forEach(step => {
        expect(step.complianceInfo).toBeDefined()
        expect(typeof step.complianceInfo).toBe('string')
        expect(step.complianceInfo!.length).toBeGreaterThan(0)
      })
    })

    it('should have unique step IDs', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const ids = store.steps.map(s => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have guidance text for all steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.steps.forEach(step => {
        expect(step.guidance).toBeDefined()
        expect(typeof step.guidance).toBe('string')
        expect(step.guidance.length).toBeGreaterThan(0)
      })
    })
  })
})
