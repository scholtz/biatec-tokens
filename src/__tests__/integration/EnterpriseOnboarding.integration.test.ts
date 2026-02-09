import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnterpriseOnboardingStore } from '../../stores/enterpriseOnboarding'
import { TelemetryService } from '../../services/TelemetryService'

describe('Enterprise Onboarding Integration', () => {
  let store: ReturnType<typeof useEnterpriseOnboardingStore>
  let telemetry: TelemetryService

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    
    store = useEnterpriseOnboardingStore()
    telemetry = TelemetryService.getInstance()
  })

  describe('Complete Onboarding Flow (Happy Path)', () => {
    it('should complete full onboarding journey', async () => {
      // Initialize onboarding
      await store.initialize()
      expect(store.steps.length).toBe(7)
      expect(store.completedStepsCount).toBe(0)
      expect(store.isOnboardingComplete).toBe(false)

      // Step 1: Create Organization Profile
      store.updateStepStatus(store.steps[0].id, 'in_progress')
      expect(store.steps[0].status).toBe('in_progress')
      
      store.updateStepStatus(store.steps[0].id, 'completed')
      expect(store.steps[0].status).toBe('completed')
      expect(store.steps[0].completedAt).toBeDefined()
      expect(store.completedStepsCount).toBe(1)

      // Step 2: Upload Corporate Documents
      store.updateStepStatus(store.steps[1].id, 'in_progress')
      store.updateStepStatus(store.steps[1].id, 'completed')
      expect(store.completedStepsCount).toBe(2)

      // Step 3: Identify Authorized Signatories
      store.updateStepStatus(store.steps[2].id, 'in_progress')
      store.updateStepStatus(store.steps[2].id, 'completed')
      expect(store.completedStepsCount).toBe(3)

      // Step 4: Verify Compliance Profile
      store.updateStepStatus(store.steps[3].id, 'in_progress')
      store.updateStepStatus(store.steps[3].id, 'completed')
      expect(store.completedStepsCount).toBe(4)

      // Step 5: Configure Token Issuance Parameters
      store.updateStepStatus(store.steps[4].id, 'in_progress')
      store.updateStepStatus(store.steps[4].id, 'completed')
      expect(store.completedStepsCount).toBe(5)

      // Step 6: Review and Accept Terms
      store.updateStepStatus(store.steps[5].id, 'in_progress')
      store.updateStepStatus(store.steps[5].id, 'completed')
      expect(store.completedStepsCount).toBe(6)

      // Step 7: Request Token Issuance
      store.updateStepStatus(store.steps[6].id, 'in_progress')
      store.updateStepStatus(store.steps[6].id, 'completed')
      expect(store.completedStepsCount).toBe(7)

      // Verify completion
      expect(store.isOnboardingComplete).toBe(true)
      expect(store.steps.every(s => s.status === 'completed')).toBe(true)

      // Verify activities were tracked
      expect(store.recentActivities.length).toBeGreaterThan(0)
      const completedActivities = store.recentActivities.filter(a => a.type === 'completed')
      expect(completedActivities.length).toBeGreaterThanOrEqual(7)
    })
  })

  describe('Onboarding with Errors (Failure Path)', () => {
    it('should handle step failures and recovery', async () => {
      await store.initialize()

      // Start step 1
      store.updateStepStatus(store.steps[0].id, 'in_progress')
      expect(store.steps[0].status).toBe('in_progress')

      // Fail step 1
      const error = {
        message: 'Organization name validation failed',
        remediation: 'Please provide a valid registered business name',
        code: 'ORG_VALIDATION_FAILED',
      }
      store.updateStepStatus(store.steps[0].id, 'needs_action', error)
      
      expect(store.steps[0].status).toBe('needs_action')
      expect(store.steps[0].error).toEqual(error)
      
      // Verify failure activity
      const failureActivity = store.recentActivities.find(
        a => a.type === 'failed' && a.stepId === store.steps[0].id
      )
      expect(failureActivity).toBeDefined()

      // Fix and retry
      store.updateStepStatus(store.steps[0].id, 'in_progress')
      expect(store.steps[0].status).toBe('in_progress')
      expect(store.steps[0].error).toBeUndefined()

      // Complete successfully
      store.updateStepStatus(store.steps[0].id, 'completed')
      expect(store.steps[0].status).toBe('completed')
      expect(store.completedStepsCount).toBe(1)
    })

    it('should handle multiple step failures', async () => {
      await store.initialize()

      // Fail multiple steps
      store.updateStepStatus(store.steps[0].id, 'needs_action', {
        message: 'Document missing',
      })
      store.updateStepStatus(store.steps[1].id, 'needs_action', {
        message: 'Verification failed',
      })

      const failedSteps = store.steps.filter(s => s.status === 'needs_action')
      expect(failedSteps.length).toBe(2)

      // Verify both errors are tracked
      const failureActivities = store.recentActivities.filter(a => a.type === 'failed')
      expect(failureActivities.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('State Persistence', () => {
    it('should persist and restore onboarding state', async () => {
      // Initialize and complete some steps
      await store.initialize()
      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[1].id, 'in_progress')
      store.updateStepStatus(store.steps[2].id, 'needs_action', {
        message: 'Test error',
      })

      // Persist state
      store.persist()

      // Create new store instance
      setActivePinia(createPinia())
      const newStore = useEnterpriseOnboardingStore()
      newStore.loadFromStorage()

      // Verify state was restored
      expect(newStore.steps[0].status).toBe('completed')
      expect(newStore.steps[1].status).toBe('in_progress')
      expect(newStore.steps[2].status).toBe('needs_action')
      expect(newStore.steps[2].error?.message).toBe('Test error')
    })

    it('should persist activities across sessions', async () => {
      await store.initialize()
      
      // Add multiple activities
      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[1].id, 'completed')
      store.addActivity({
        message: 'Custom activity',
        type: 'updated',
      })

      const originalActivityCount = store.recentActivities.length

      // Persist and reload
      store.persist()
      setActivePinia(createPinia())
      const newStore = useEnterpriseOnboardingStore()
      newStore.loadFromStorage()

      expect(newStore.recentActivities.length).toBe(originalActivityCount)
    })
  })

  describe('Analytics Tracking', () => {
    it('should track all key onboarding events', async () => {
      const trackSpy = vi.spyOn(telemetry, 'track')

      await store.initialize()
      expect(trackSpy).toHaveBeenCalledWith(
        'enterprise_onboarding_initialized',
        expect.any(Object)
      )

      // Track step start
      store.updateStepStatus(store.steps[0].id, 'in_progress')
      expect(trackSpy).toHaveBeenCalledWith(
        'onboarding_step_started',
        expect.objectContaining({
          step_id: store.steps[0].id,
          step_order: 1,
        })
      )

      // Track step completion
      store.updateStepStatus(store.steps[0].id, 'completed')
      expect(trackSpy).toHaveBeenCalledWith(
        'onboarding_step_completed',
        expect.objectContaining({
          step_id: store.steps[0].id,
        })
      )

      // Track step failure
      store.updateStepStatus(store.steps[1].id, 'needs_action', {
        message: 'Test error',
        code: 'TEST_ERROR',
      })
      expect(trackSpy).toHaveBeenCalledWith(
        'onboarding_step_failed',
        expect.objectContaining({
          step_id: store.steps[1].id,
          error_message: 'Test error',
          error_code: 'TEST_ERROR',
        })
      )

      // Track onboarding completion
      store.completeOnboarding()
      expect(trackSpy).toHaveBeenCalledWith(
        'enterprise_onboarding_completed',
        expect.objectContaining({
          total_steps: 7,
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent step updates', async () => {
      await store.initialize()

      // Update multiple steps quickly
      store.updateStepStatus(store.steps[0].id, 'in_progress')
      store.updateStepStatus(store.steps[1].id, 'in_progress')
      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[2].id, 'in_progress')
      store.updateStepStatus(store.steps[1].id, 'completed')

      expect(store.steps[0].status).toBe('completed')
      expect(store.steps[1].status).toBe('completed')
      expect(store.steps[2].status).toBe('in_progress')
    })

    it('should handle invalid step IDs gracefully', async () => {
      await store.initialize()

      // Try to update non-existent step
      store.updateStepStatus('invalid-step-id', 'completed')

      // Should not throw error and state should be unchanged
      expect(store.completedStepsCount).toBe(0)
    })

    it('should maintain activity limit', async () => {
      await store.initialize()

      // Add more than 50 activities
      for (let i = 0; i < 60; i++) {
        store.addActivity({
          message: `Activity ${i}`,
          type: 'updated',
        })
      }

      // Should keep only last 50
      expect(store.state.activities.length).toBeLessThanOrEqual(50)
    })
  })
})
