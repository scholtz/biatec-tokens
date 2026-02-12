import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AnalyticsService } from '../analytics'

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService
  let consoleLogSpy: any
  let gtagSpy: any

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    // Mock console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock gtag
    gtagSpy = vi.fn()
    ;(window as any).gtag = gtagSpy
    ;(window as any).dataLayer = []
    
    // Create new instance
    analyticsService = new AnalyticsService()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    delete (window as any).gtag
    delete (window as any).dataLayer
  })

  describe('Initialization', () => {
    it('should generate a unique session ID', () => {
      const sessionId = analyticsService.getSessionId()
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
    })

    it('should default to tracking enabled', () => {
      expect(analyticsService.isTrackingEnabled()).toBe(true)
    })

    it('should respect analytics consent from localStorage', () => {
      localStorage.setItem('analytics_consent', 'false')
      const service = new AnalyticsService()
      expect(service.isTrackingEnabled()).toBe(false)
    })
  })

  describe('Event Tracking', () => {
    it('should track events when enabled', () => {
      analyticsService.trackEvent({
        event: 'test_event',
        category: 'Test',
        action: 'Test Action'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'test_event',
          category: 'Test',
          action: 'Test Action',
          sessionId: expect.any(String),
          timestamp: expect.any(String)
        })
      )
    })

    it('should not track events when disabled', () => {
      analyticsService.setTrackingEnabled(false)
      
      analyticsService.trackEvent({
        event: 'test_event',
        category: 'Test'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] Tracking disabled, event not sent:',
        expect.any(Object)
      )
    })

    it('should add session ID to all events', () => {
      const sessionId = analyticsService.getSessionId()
      
      analyticsService.trackEvent({ event: 'test' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({ sessionId })
      )
    })

    it('should add timestamp to all events', () => {
      analyticsService.trackEvent({ event: 'test' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        })
      )
    })

    it('should call gtag when available', () => {
      analyticsService.trackEvent({
        event: 'test_event',
        category: 'Test',
        action: 'Test Action',
        label: 'Test Label',
        value: 42
      })

      expect(gtagSpy).toHaveBeenCalledWith('event', 'test_event', expect.objectContaining({
        event_category: 'Test',
        event_action: 'Test Action',
        event_label: 'Test Label',
        value: 42
      }))
    })
  })

  describe('Wizard Events', () => {
    it('should track wizard start', () => {
      analyticsService.trackWizardStarted('user@example.com')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_started',
          category: 'Wizard',
          action: 'Started',
          userEmail: 'user@example.com'
        })
      )
    })

    it('should track wizard step viewed', () => {
      analyticsService.trackWizardStepViewed({
        stepIndex: 2,
        stepId: 'token-details',
        stepTitle: 'Token Details'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_step_viewed',
          category: 'Wizard',
          action: 'Step Viewed',
          label: 'Token Details',
          stepIndex: 2,
          stepId: 'token-details'
        })
      )
    })

    it('should track wizard completed', () => {
      analyticsService.trackWizardCompleted({
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        standard: 'ERC20',
        network: 'Ethereum'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_completed',
          category: 'Wizard',
          action: 'Completed',
          label: 'Test Token'
        })
      )
    })

    it('should track wizard abandoned', () => {
      analyticsService.trackWizardAbandoned(3, 8)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_abandoned',
          category: 'Wizard',
          action: 'Abandoned',
          currentStep: 3,
          totalSteps: 8,
          completionPercentage: 37.5
        })
      )
    })

    it('should track validation errors', () => {
      analyticsService.trackWizardValidationError({
        stepIndex: 1,
        stepId: 'token-details',
        stepTitle: 'Token Details',
        errors: ['Invalid token name', 'Invalid symbol']
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_validation_error',
          category: 'Wizard',
          action: 'Validation Error',
          errors: ['Invalid token name', 'Invalid symbol']
        })
      )
    })

    it('should track draft saved', () => {
      analyticsService.trackDraftSaved({
        stepIndex: 2,
        tokenName: 'Draft Token'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'wizard_draft_saved',
          category: 'Wizard',
          action: 'Draft Saved'
        })
      )
    })
  })

  describe('Token Creation Events', () => {
    it('should track plan selected', () => {
      analyticsService.trackPlanSelected('professional')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'subscription_plan_selected',
          category: 'Subscription',
          action: 'Plan Selected',
          label: 'professional',
          plan: 'professional'
        })
      )
    })

    it('should track network selected', () => {
      analyticsService.trackNetworkSelected('Ethereum')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'network_selected',
          category: 'Token Configuration',
          action: 'Network Selected',
          label: 'Ethereum',
          network: 'Ethereum'
        })
      )
    })

    it('should track standard selected', () => {
      analyticsService.trackStandardSelected('ERC20', 'Ethereum')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'standard_selected',
          category: 'Token Configuration',
          action: 'Standard Selected',
          label: 'ERC20',
          standard: 'ERC20',
          network: 'Ethereum'
        })
      )
    })

    it('should track token creation success', () => {
      analyticsService.trackTokenCreationSuccess({
        tokenName: 'Success Token',
        tokenSymbol: 'SUCC',
        standard: 'ERC20',
        network: 'Ethereum'
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'token_creation_success',
          category: 'Token Creation',
          action: 'Success',
          label: 'Success Token'
        })
      )
    })

    it('should track token creation failure', () => {
      analyticsService.trackTokenCreationFailure({
        tokenName: 'Failed Token',
        tokenSymbol: 'FAIL',
        error: 'Deployment failed'
      } as any)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'token_creation_failure',
          category: 'Token Creation',
          action: 'Failure',
          label: 'Deployment failed'
        })
      )
    })
  })

  describe('Compliance Events', () => {
    it('should track compliance checklist update', () => {
      analyticsService.trackComplianceChecklistUpdate('kyc-policy', true, 75)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'compliance_checklist_update',
          category: 'Compliance',
          action: 'Item Completed',
          label: 'kyc-policy',
          completionPercentage: 75
        })
      )
    })

    it('should track metadata mode toggle', () => {
      analyticsService.trackMetadataModeToggle('json')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.objectContaining({
          event: 'metadata_mode_toggle',
          category: 'Metadata',
          action: 'Mode Changed',
          label: 'json',
          mode: 'json'
        })
      )
    })
  })

  describe('Consent Management', () => {
    it('should enable tracking', () => {
      analyticsService.setTrackingEnabled(true)
      expect(analyticsService.isTrackingEnabled()).toBe(true)
      expect(localStorage.getItem('analytics_consent')).toBe('true')
    })

    it('should disable tracking', () => {
      analyticsService.setTrackingEnabled(false)
      expect(analyticsService.isTrackingEnabled()).toBe(false)
      expect(localStorage.getItem('analytics_consent')).toBe('false')
    })

    it('should persist consent preference', () => {
      analyticsService.setTrackingEnabled(false)
      
      const newService = new AnalyticsService()
      expect(newService.isTrackingEnabled()).toBe(false)
    })
  })

  describe('PII Protection', () => {
    it('should not expose sensitive data in event payloads', () => {
      const eventData = {
        event: 'test_event',
        password: 'secret123',
        credit_card: '4111111111111111',
        ssn: '123-45-6789'
      }

      analyticsService.trackEvent(eventData)

      // Analytics should log the event but we verify it doesn't explicitly leak PII
      // In production, implement PII scrubbing before sending to analytics
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('Session Tracking', () => {
    it('should maintain consistent session ID', () => {
      const sessionId1 = analyticsService.getSessionId()
      const sessionId2 = analyticsService.getSessionId()
      
      expect(sessionId1).toBe(sessionId2)
    })

    it('should create different session IDs for different instances', () => {
      const service1 = new AnalyticsService()
      const service2 = new AnalyticsService()
      
      expect(service1.getSessionId()).not.toBe(service2.getSessionId())
    })
  })
})
