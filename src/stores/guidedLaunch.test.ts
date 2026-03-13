/**
 * Unit tests for guidedLaunch store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from './guidedLaunch'
import { launchTelemetryService } from '../services/launchTelemetry'
import type { OrganizationProfile, TokenIntent, ComplianceReadiness, TokenTemplate, TokenEconomics } from '../types/guidedLaunch'

describe('guidedLaunch store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.currentForm).toBeDefined()
      expect(store.currentStep).toBe(0)
      expect(store.totalSteps).toBe(7)
      expect(store.completedSteps).toBe(0)
      expect(store.progressPercentage).toBe(0)
    })

    it('should have all step statuses initialized', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.stepStatuses).toHaveLength(7)
      expect(store.stepStatuses[0].id).toBe('organization')
      expect(store.stepStatuses[1].id).toBe('intent')
      expect(store.stepStatuses[2].id).toBe('compliance')
      expect(store.stepStatuses[3].id).toBe('whitelist')
      expect(store.stepStatuses[4].id).toBe('template')
      expect(store.stepStatuses[5].id).toBe('economics')
      expect(store.stepStatuses[6].id).toBe('review')
    })

    it('should identify optional steps correctly', () => {
      const store = useGuidedLaunchStore()
      
      const economicsStep = store.stepStatuses.find(s => s.id === 'economics')
      expect(economicsStep?.isOptional).toBe(true)
      
      const orgStep = store.stepStatuses.find(s => s.id === 'organization')
      expect(orgStep?.isOptional).toBe(false)
    })
  })

  describe('draft persistence', () => {
    it('should save draft to localStorage', () => {
      const store = useGuidedLaunchStore()
      
      const result = store.saveDraft()
      
      expect(result).toBe(true)
      const stored = localStorage.getItem('biatec_guided_launch_draft')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.version).toBe('1.0')
      expect(parsed.form).toBeDefined()
    })

    it('should load draft from localStorage', () => {
      const store = useGuidedLaunchStore()
      
      // Save a draft
      store.currentForm.currentStep = 2
      store.saveDraft()
      
      // Create new store instance
      setActivePinia(createPinia())
      const newStore = useGuidedLaunchStore()
      
      // Load draft
      const loaded = newStore.loadDraft()
      
      expect(loaded).toBe(true)
      expect(newStore.currentForm.currentStep).toBe(2)
      expect(newStore.hasDraftLoaded).toBe(true)
    })

    it('should generate draft ID on first save', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.currentForm.draftId).toBeUndefined()
      
      store.saveDraft()
      
      expect(store.currentForm.draftId).toBeTruthy()
      expect(store.currentForm.draftId).toMatch(/^draft_/)
    })

    it('should clear draft from localStorage', () => {
      const store = useGuidedLaunchStore()
      
      store.saveDraft()
      expect(localStorage.getItem('biatec_guided_launch_draft')).toBeTruthy()
      
      store.clearDraft()
      
      expect(localStorage.getItem('biatec_guided_launch_draft')).toBeNull()
      expect(store.currentStep).toBe(0)
      expect(store.currentForm.completedSteps).toHaveLength(0)
    })
  })

  describe('form data setters', () => {
    it('should set organization profile', () => {
      const store = useGuidedLaunchStore()
      
      const profile: OrganizationProfile = {
        organizationName: 'Test Corp',
        organizationType: 'company',
        jurisdiction: 'US',
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        role: 'business_owner',
      }
      
      store.setOrganizationProfile(profile)
      
      expect(store.currentForm.organizationProfile).toEqual(profile)
    })

    it('should set token intent', () => {
      const store = useGuidedLaunchStore()
      
      const intent: TokenIntent = {
        tokenPurpose: 'Loyalty rewards',
        utilityType: 'loyalty_rewards',
        targetAudience: 'b2c',
        expectedHolders: '1000_10000',
        geographicScope: 'global',
      }
      
      store.setTokenIntent(intent)
      
      expect(store.currentForm.tokenIntent).toEqual(intent)
    })

    it('should set compliance readiness', () => {
      const store = useGuidedLaunchStore()
      
      const compliance: ComplianceReadiness = {
        requiresMICA: true,
        requiresKYC: true,
        requiresAML: true,
        hasLegalReview: true,
        hasRiskAssessment: false,
        restrictedJurisdictions: ['CN', 'KP'],
        whitelistRequired: true,
      }
      
      store.setComplianceReadiness(compliance)
      
      expect(store.currentForm.complianceReadiness).toEqual(compliance)
    })

    it('should auto-save after setting data', () => {
      const store = useGuidedLaunchStore()
      
      const profile: OrganizationProfile = {
        organizationName: 'Test Corp',
        organizationType: 'company',
        jurisdiction: 'US',
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        role: 'business_owner',
      }
      
      store.setOrganizationProfile(profile)
      
      const stored = localStorage.getItem('biatec_guided_launch_draft')
      expect(stored).toBeTruthy()
    })
  })

  describe('step navigation', () => {
    it('should navigate to step', () => {
      const store = useGuidedLaunchStore()
      
      store.goToStep(2)
      
      expect(store.currentStep).toBe(2)
    })

    it('should not navigate to invalid step index', () => {
      const store = useGuidedLaunchStore()
      
      store.goToStep(-1)
      expect(store.currentStep).toBe(0)
      
      store.goToStep(10)
      expect(store.currentStep).toBe(0)
    })

    it('should complete step with validation', () => {
      const store = useGuidedLaunchStore()
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
      }
      
      store.completeStep(0, validation)
      
      expect(store.stepStatuses[0].isComplete).toBe(true)
      expect(store.stepStatuses[0].isValid).toBe(true)
      expect(store.currentForm.completedSteps).toContain('organization')
    })

    it('should not mark step complete if validation fails', () => {
      const store = useGuidedLaunchStore()
      
      const validation = {
        isValid: false,
        errors: ['Missing required field'],
        warnings: [],
      }
      
      store.completeStep(0, validation)
      
      expect(store.stepStatuses[0].isComplete).toBe(false)
      expect(store.stepStatuses[0].isValid).toBe(false)
    })
  })

  describe('readiness score', () => {
    it('should calculate initial readiness score as 0', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.readinessScore.overallScore).toBeLessThanOrEqual(20) // Only completion matters initially
      expect(store.readinessScore.requiredStepsComplete).toBe(0)
      expect(store.readinessScore.blockers.length).toBeGreaterThan(0)
    })

    it('should increase score as steps complete', () => {
      const store = useGuidedLaunchStore()
      
      const initialScore = store.readinessScore.overallScore
      
      // Complete first step
      store.completeStep(0, { isValid: true, errors: [], warnings: [] })
      
      expect(store.readinessScore.overallScore).toBeGreaterThan(initialScore)
      expect(store.readinessScore.requiredStepsComplete).toBe(1)
    })

    it('should identify blockers for incomplete required steps', () => {
      const store = useGuidedLaunchStore()
      
      const blockers = store.readinessScore.blockers
      
      expect(blockers.length).toBeGreaterThan(0)
      expect(blockers.some(b => b.includes('Organization Profile'))).toBe(true)
    })

    it('should add warnings for MICA without legal review', () => {
      const store = useGuidedLaunchStore()
      
      store.setComplianceReadiness({
        requiresMICA: true,
        requiresKYC: false,
        requiresAML: false,
        hasLegalReview: false,
        hasRiskAssessment: false,
        restrictedJurisdictions: [],
        whitelistRequired: false,
      })
      
      const warnings = store.readinessScore.warnings
      
      expect(warnings.some(w => w.includes('MICA'))).toBe(true)
    })

    it('should mark as ready when all required steps complete', () => {
      const store = useGuidedLaunchStore()
      
      // Complete all required steps
      const requiredStepIndices = [0, 1, 2, 3, 4, 6] // Excluding optional step 5 (economics)
      
      requiredStepIndices.forEach(index => {
        store.completeStep(index, { isValid: true, errors: [], warnings: [] })
      })
      
      // Set minimal data to avoid warnings
      store.setOrganizationProfile({
        organizationName: 'Test',
        organizationType: 'company',
        jurisdiction: 'US',
        contactName: 'John',
        contactEmail: 'john@test.com',
        role: 'business_owner',
        registrationNumber: '123',
        website: 'https://test.com',
      })
      
      store.setComplianceReadiness({
        requiresMICA: false,
        requiresKYC: false,
        requiresAML: false,
        hasLegalReview: true,
        hasRiskAssessment: true,
        restrictedJurisdictions: [],
        whitelistRequired: false,
      })
      
      expect(store.readinessScore.blockers.length).toBe(0)
      expect(store.canSubmit).toBe(true)
    })
  })

  describe('template selection', () => {
    it('should return available templates', () => {
      const store = useGuidedLaunchStore()
      
      const templates = store.getTemplates()
      
      expect(templates.length).toBeGreaterThan(0)
      expect(templates[0]).toHaveProperty('id')
      expect(templates[0]).toHaveProperty('name')
      expect(templates[0]).toHaveProperty('standard')
    })

    it('should set selected template', () => {
      const store = useGuidedLaunchStore()
      
      const templates = store.getTemplates()
      const template = templates[0]
      
      store.setSelectedTemplate(template)
      
      expect(store.currentForm.selectedTemplate).toEqual(template)
    })
  })

  describe('launch submission', () => {
    it('should fail submission if form incomplete', async () => {
      const store = useGuidedLaunchStore()
      
      await expect(store.submitLaunch('user@test.com')).rejects.toThrow()
    })

    it('should submit successfully with complete form', async () => {
      const store = useGuidedLaunchStore()
      
      // Set up complete form
      store.setOrganizationProfile({
        organizationName: 'Test Corp',
        organizationType: 'company',
        jurisdiction: 'US',
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        role: 'business_owner',
      })
      
      store.setTokenIntent({
        tokenPurpose: 'Test',
        utilityType: 'loyalty_rewards',
        targetAudience: 'b2c',
        expectedHolders: '100_1000',
        geographicScope: 'national',
      })
      
      store.setComplianceReadiness({
        requiresMICA: false,
        requiresKYC: false,
        requiresAML: false,
        hasLegalReview: true,
        hasRiskAssessment: true,
        restrictedJurisdictions: [],
        whitelistRequired: false,
      })
      
      const templates = store.getTemplates()
      store.setSelectedTemplate(templates[0])
      
      store.setTokenEconomics({
        totalSupply: '1000000',
        decimals: 6,
        initialDistribution: {
          team: 25,
          investors: 25,
          community: 25,
          reserve: 25,
        },
        burnMechanism: false,
        mintingAllowed: false,
      })
      
      // Mark all required steps complete
      store.completeStep(0, { isValid: true, errors: [], warnings: [] })
      store.completeStep(1, { isValid: true, errors: [], warnings: [] })
      store.completeStep(2, { isValid: true, errors: [], warnings: [] })
      store.completeStep(3, { isValid: true, errors: [], warnings: [] })
      store.completeStep(4, { isValid: true, errors: [], warnings: [] })
      store.completeStep(6, { isValid: true, errors: [], warnings: [] })
      
      const response = await store.submitLaunch('user@test.com')
      
      expect(response.success).toBe(true)
      expect(response.submissionId).toBeTruthy()
      expect(store.currentForm.isSubmitted).toBe(true)
    })

    it('should set isSubmitting flag during submission', async () => {
      const store = useGuidedLaunchStore()
      
      // Set up complete form (abbreviated)
      store.setOrganizationProfile({
        organizationName: 'Test',
        organizationType: 'company',
        jurisdiction: 'US',
        contactName: 'John',
        contactEmail: 'john@test.com',
        role: 'business_owner',
      })
      store.setTokenIntent({
        tokenPurpose: 'Test',
        utilityType: 'loyalty_rewards',
        targetAudience: 'b2c',
        expectedHolders: '100_1000',
        geographicScope: 'national',
      })
      store.setComplianceReadiness({
        requiresMICA: false,
        requiresKYC: false,
        requiresAML: false,
        hasLegalReview: true,
        hasRiskAssessment: true,
        restrictedJurisdictions: [],
        whitelistRequired: false,
      })
      const templates = store.getTemplates()
      store.setSelectedTemplate(templates[0])
      store.setTokenEconomics({
        totalSupply: '1000000',
        decimals: 6,
        initialDistribution: { team: 25, investors: 25, community: 25, reserve: 25 },
        burnMechanism: false,
        mintingAllowed: false,
      })
      store.completeStep(0, { isValid: true, errors: [], warnings: [] })
      store.completeStep(1, { isValid: true, errors: [], warnings: [] })
      store.completeStep(2, { isValid: true, errors: [], warnings: [] })
      store.completeStep(3, { isValid: true, errors: [], warnings: [] })
      store.completeStep(4, { isValid: true, errors: [], warnings: [] })
      store.completeStep(6, { isValid: true, errors: [], warnings: [] })
      
      expect(store.isSubmitting).toBe(false)
      
      await store.submitLaunch('user@test.com')
      
      expect(store.isSubmitting).toBe(false)
    })
  })

  describe('telemetry', () => {
    it('should initialize telemetry with user ID', () => {
      const store = useGuidedLaunchStore()
      
      expect(() => {
        store.initializeTelemetry('user123')
      }).not.toThrow()
    })

    it('should track flow start', () => {
      const store = useGuidedLaunchStore()
      
      expect(() => {
        store.startFlow('https://example.com', 'direct')
      }).not.toThrow()
    })
  })

  describe('readiness score edge cases', () => {
    it('should add blocker when step is complete but invalid', () => {
      const store = useGuidedLaunchStore()

      // Directly set step as complete=true but isValid=false (edge case for defensive path)
      store.stepStatuses[0].isComplete = true
      store.stepStatuses[0].isValid = false

      const score = store.readinessScore
      expect(score.blockers.some(b => b.includes('Organization Profile'))).toBe(true)
    })

    it('should add KYC warning when KYC required but no whitelist', () => {
      const store = useGuidedLaunchStore()

      store.setComplianceReadiness({
        requiresMICA: false,
        requiresKYC: true,
        requiresAML: false,
        hasLegalReview: true,
        hasRiskAssessment: true,
        restrictedJurisdictions: [],
        whitelistRequired: false,
      })

      const score = store.readinessScore
      expect(score.warnings.some(w => w.includes('KYC'))).toBe(true)
    })
  })

  describe('draft persistence edge cases', () => {
    it('should return false from loadDraft when no draft in localStorage', () => {
      const store = useGuidedLaunchStore()

      // localStorage is empty (cleared in beforeEach)
      const loaded = store.loadDraft()
      expect(loaded).toBe(false)
      expect(store.hasDraftLoaded).toBe(false)
    })

    it('should return false and clear draft on version mismatch', () => {
      const store = useGuidedLaunchStore()

      // Manually store a draft with a wrong version
      localStorage.setItem('biatec_guided_launch_draft', JSON.stringify({
        version: 'OLD_VERSION_9.9',
        form: { currentStep: 3, createdAt: new Date(), lastModified: new Date(), completedSteps: [] },
        stepStatuses: [],
      }))

      const loaded = store.loadDraft()
      expect(loaded).toBe(false)
      // Draft should be cleared
      expect(localStorage.getItem('biatec_guided_launch_draft')).toBeNull()
    })

    it('should return false and not crash when loadDraft encounters invalid JSON', () => {
      const store = useGuidedLaunchStore()

      // Store invalid JSON to trigger the catch block
      localStorage.setItem('biatec_guided_launch_draft', 'NOT_VALID_JSON{{{')

      const loaded = store.loadDraft()
      expect(loaded).toBe(false)
    })

    it('should return false from saveDraft when localStorage.setItem throws', () => {
      const store = useGuidedLaunchStore()

      // Mock localStorage.setItem to throw (e.g., storage quota exceeded)
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError')
      })

      const saved = store.saveDraft()
      expect(saved).toBe(false)

      setItemSpy.mockRestore()
    })
  })

  describe('launch submission edge cases', () => {
    it('should throw when canSubmit is false on empty form', async () => {
      const store = useGuidedLaunchStore()

      // Empty form has blockers → canSubmit = false
      await expect(store.submitLaunch('user@test.com')).rejects.toThrow(
        'Cannot submit: validation errors present'
      )
    })

    it('should throw required data missing when canSubmit is true but form data is null', async () => {
      const store = useGuidedLaunchStore()

      // Mark all required steps as complete so canSubmit = true
      store.stepStatuses.forEach(s => {
        if (!s.isOptional) {
          s.isComplete = true
          s.isValid = true
        }
      })

      // But don't set any form data (organizationProfile etc. are null)
      await expect(store.submitLaunch('user@test.com')).rejects.toThrow(
        'Cannot submit: required data missing'
      )
    })

    it('should handle error in submitLaunch catch block', async () => {
      const store = useGuidedLaunchStore()

      // Set all required steps complete
      store.stepStatuses.forEach(s => {
        s.isComplete = true
        s.isValid = true
      })

      // Set required form data so it passes the data missing check
      const templates = store.getTemplates()
      store.setOrganizationProfile({ name: 'Test Corp', type: 'company', website: '', description: '', country: 'US', regulatoryStatus: 'registered', contactEmail: 'test@test.com' })
      store.setTokenIntent({ primaryUseCase: 'loyalty_rewards', tokenName: 'TestToken', tokenSymbol: 'TST', targetAudience: 'consumer', estimatedHolders: '100', revenueModel: 'direct', problemStatement: 'test', valueProposition: 'test' })
      store.setComplianceReadiness({ requiresMICA: false, requiresKYC: false, requiresAML: false, hasLegalReview: true, hasRiskAssessment: true, restrictedJurisdictions: [], whitelistRequired: false })
      store.setSelectedTemplate(templates[0])
      store.setTokenEconomics({ totalSupply: '1000000', decimals: 6, initialDistribution: { team: 25, investors: 25, community: 25, reserve: 25 }, burnMechanism: false, mintingAllowed: false })

      // Mock telemetry to throw — this triggers the catch block in submitLaunch's try
      vi.spyOn(launchTelemetryService, 'trackLaunchSubmitted').mockImplementationOnce(() => {
        throw new Error('telemetry error')
      })

      await expect(store.submitLaunch('user@test.com')).rejects.toThrow()

      // After error, submissionStatus should be 'failed'
      expect(store.currentForm.submissionStatus).toBe('failed')
    })
  })
})
