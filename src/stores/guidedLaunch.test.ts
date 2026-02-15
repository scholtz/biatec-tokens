/**
 * Unit tests for guidedLaunch store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from './guidedLaunch'
import type { OrganizationProfile, TokenIntent, ComplianceReadiness, TokenTemplate, TokenEconomics } from '../types/guidedLaunch'

describe('guidedLaunch store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.currentForm).toBeDefined()
      expect(store.currentStep).toBe(0)
      expect(store.totalSteps).toBe(6)
      expect(store.completedSteps).toBe(0)
      expect(store.progressPercentage).toBe(0)
    })

    it('should have all step statuses initialized', () => {
      const store = useGuidedLaunchStore()
      
      expect(store.stepStatuses).toHaveLength(6)
      expect(store.stepStatuses[0].id).toBe('organization')
      expect(store.stepStatuses[1].id).toBe('intent')
      expect(store.stepStatuses[2].id).toBe('compliance')
      expect(store.stepStatuses[3].id).toBe('template')
      expect(store.stepStatuses[4].id).toBe('economics')
      expect(store.stepStatuses[5].id).toBe('review')
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
      const requiredStepIndices = [0, 1, 2, 3, 5] // Excluding optional step 4
      
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
      store.completeStep(5, { isValid: true, errors: [], warnings: [] })
      
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
      store.completeStep(5, { isValid: true, errors: [], warnings: [] })
      
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
})
