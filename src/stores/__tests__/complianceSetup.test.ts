import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceSetupStore } from '../complianceSetup'
import type {
  JurisdictionPolicy,
  WhitelistEligibility,
  KYCAMLReadiness,
  AttestationEvidence,
} from '../../types/complianceSetup'

describe('Compliance Setup Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const store = useComplianceSetupStore()

      expect(store.currentForm).toBeDefined()
      expect(store.currentForm.steps.length).toBe(5)
      expect(store.currentForm.currentStepIndex).toBe(0)
      expect(store.currentForm.isComplete).toBe(false)
      expect(store.currentForm.isSubmitted).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.isSubmitting).toBe(false)
      expect(store.hasDraftLoaded).toBe(false)
    })

    it('should initialize with 5 steps in correct order', () => {
      const store = useComplianceSetupStore()

      expect(store.currentForm.steps[0].id).toBe('jurisdiction')
      expect(store.currentForm.steps[1].id).toBe('whitelist')
      expect(store.currentForm.steps[2].id).toBe('kyc_aml')
      expect(store.currentForm.steps[3].id).toBe('attestation')
      expect(store.currentForm.steps[4].id).toBe('readiness')
    })

    it('should mark all steps as required', () => {
      const store = useComplianceSetupStore()

      store.currentForm.steps.forEach(step => {
        expect(step.isRequired).toBe(true)
      })
    })

    it('should mark readiness step with dependencies', () => {
      const store = useComplianceSetupStore()

      const readinessStep = store.currentForm.steps.find(s => s.id === 'readiness')
      expect(readinessStep?.dependencies).toEqual(['jurisdiction', 'whitelist', 'kyc_aml', 'attestation'])
    })
  })

  describe('Computed Properties', () => {
    it('should compute currentStep correctly', () => {
      const store = useComplianceSetupStore()

      expect(store.currentStep.id).toBe('jurisdiction')

      store.currentForm.currentStepIndex = 2
      expect(store.currentStep.id).toBe('kyc_aml')
    })

    it('should compute totalSteps correctly', () => {
      const store = useComplianceSetupStore()

      expect(store.totalSteps).toBe(5)
    })

    it('should compute completedSteps correctly', () => {
      const store = useComplianceSetupStore()

      expect(store.completedSteps).toBe(0)

      store.currentForm.steps[0].isComplete = true
      expect(store.completedSteps).toBe(1)

      store.currentForm.steps[1].isComplete = true
      expect(store.completedSteps).toBe(2)
    })

    it('should compute progressPercentage correctly', () => {
      const store = useComplianceSetupStore()

      expect(store.progressPercentage).toBe(0)

      store.currentForm.steps[0].isComplete = true
      expect(store.progressPercentage).toBe(20) // 1/5 = 20%

      store.currentForm.steps.forEach(step => step.isComplete = true)
      expect(store.progressPercentage).toBe(100)
    })
  })

  describe('Draft Management', () => {
    it('should save draft to localStorage', () => {
      const store = useComplianceSetupStore()

      const result = store.saveDraft()

      expect(result).toBe(true)
      expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeTruthy()
    })

    it('should generate setupId on first save', () => {
      const store = useComplianceSetupStore()

      expect(store.currentForm.setupId).toBeUndefined()

      store.saveDraft()

      expect(store.currentForm.setupId).toBeDefined()
      expect(store.currentForm.setupId).toMatch(/^setup_\d+_[a-z0-9]+$/)
    })

    it('should update lastModified on save', () => {
      const store = useComplianceSetupStore()
      const initialModified = store.currentForm.lastModified

      // Wait a bit to ensure time difference
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      store.saveDraft()

      expect(store.currentForm.lastModified.getTime()).toBeGreaterThan(initialModified.getTime())
      vi.useRealTimers()
    })

    it('should load draft from localStorage', () => {
      const store = useComplianceSetupStore()

      // Save initial state
      store.currentForm.currentStepIndex = 2
      store.currentForm.steps[0].isComplete = true
      store.saveDraft()

      // Clear and reload
      store.currentForm.currentStepIndex = 0
      store.currentForm.steps[0].isComplete = false

      // Load draft
      const loaded = store.loadDraft()

      expect(loaded).toBe(true)
      expect(store.hasDraftLoaded).toBe(true)
      expect(store.currentForm.currentStepIndex).toBe(2)
      expect(store.currentForm.steps[0].isComplete).toBe(true)
    })

    it('should handle missing draft gracefully', () => {
      const store = useComplianceSetupStore()

      localStorage.clear()

      const loaded = store.loadDraft()

      expect(loaded).toBe(false)
      expect(store.hasDraftLoaded).toBe(false)
    })

    it('should handle version mismatch and clear old draft', () => {
      const store = useComplianceSetupStore()

      // Save draft with wrong version
      localStorage.setItem('biatec_compliance_setup_draft', JSON.stringify({
        version: '0.9',
        form: store.currentForm,
      }))

      const loaded = store.loadDraft()

      expect(loaded).toBe(false)
      expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeNull()
    })

    it('should handle corrupted localStorage data', () => {
      const store = useComplianceSetupStore()

      // Save invalid JSON
      localStorage.setItem('biatec_compliance_setup_draft', 'invalid json {')

      const loaded = store.loadDraft()

      expect(loaded).toBe(false)
      expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeNull()
    })

    it('should clear draft and reset state', () => {
      const store = useComplianceSetupStore()

      // Modify state
      store.currentForm.currentStepIndex = 3
      store.currentForm.steps[0].isComplete = true
      store.saveDraft()

      // Clear draft
      store.clearDraft()

      expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeNull()
      expect(store.currentForm.currentStepIndex).toBe(0)
      expect(store.currentForm.steps[0].isComplete).toBe(false)
      expect(store.hasDraftLoaded).toBe(false)
    })

    it('should restore dates correctly when loading draft', () => {
      const store = useComplianceSetupStore()

      const testDate = new Date('2024-01-15T10:30:00Z')
      const originalDate = store.currentForm.createdAt
      store.currentForm.createdAt = testDate
      store.saveDraft()

      // Modify in memory
      store.currentForm.createdAt = originalDate

      // Reload
      store.loadDraft()

      expect(store.currentForm.createdAt).toBeInstanceOf(Date)
      expect(store.currentForm.createdAt.toISOString()).toBe(testDate.toISOString())
    })
  })

  describe('Step Navigation', () => {
    it('should navigate to valid step index', () => {
      const store = useComplianceSetupStore()

      store.goToStep(2)

      expect(store.currentForm.currentStepIndex).toBe(2)
      expect(store.currentStep.id).toBe('kyc_aml')
    })

    it('should change step status to in_progress on first visit', () => {
      const store = useComplianceSetupStore()

      expect(store.currentForm.steps[2].status).toBe('not_started')

      store.goToStep(2)

      expect(store.currentForm.steps[2].status).toBe('in_progress')
    })

    it('should not change status if step already started', () => {
      const store = useComplianceSetupStore()

      store.currentForm.steps[2].status = 'completed'
      store.goToStep(2)

      expect(store.currentForm.steps[2].status).toBe('completed')
    })

    it('should ignore invalid step indices', () => {
      const store = useComplianceSetupStore()

      const initialIndex = store.currentForm.currentStepIndex

      store.goToStep(-1)
      expect(store.currentForm.currentStepIndex).toBe(initialIndex)

      store.goToStep(10)
      expect(store.currentForm.currentStepIndex).toBe(initialIndex)
    })

    it('should save draft when navigating', () => {
      const store = useComplianceSetupStore()
      
      // Check that localStorage was updated
      const beforeNav = localStorage.getItem('biatec_compliance_setup_draft')
      store.goToStep(1)
      const afterNav = localStorage.getItem('biatec_compliance_setup_draft')

      expect(afterNav).toBeTruthy()
      expect(afterNav).not.toBe(beforeNav)
    })

    it('should update step status', () => {
      const store = useComplianceSetupStore()

      store.updateStepStatus('jurisdiction', 'completed')

      expect(store.currentForm.steps[0].status).toBe('completed')
      expect(store.currentForm.steps[0].lastModified).toBeInstanceOf(Date)
    })
  })

  describe('Jurisdiction Policy Validation', () => {
    it('should validate required fields', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: '',
        issuerJurisdictionType: 'other',
        distributionScope: 'global',
        investorTypes: [],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      const step = store.currentForm.steps[0]
      expect(step.isValid).toBe(false)
      expect(step.validation?.errors.length).toBeGreaterThan(0)
      expect(step.validation?.errors.some(e => e.field === 'issuerCountry')).toBe(true)
      expect(step.validation?.errors.some(e => e.field === 'investorTypes')).toBe(true)
    })

    it('should mark step complete when valid', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['retail', 'accredited'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      const step = store.currentForm.steps[0]
      expect(step.isValid).toBe(true)
      expect(step.isComplete).toBe(true)
      expect(step.status).toBe('completed')
    })

    it('should detect country_specific without allowed countries', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'country_specific',
        investorTypes: ['retail'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      const step = store.currentForm.steps[0]
      expect(step.validation?.errors.some(e => e.field === 'allowedCountries')).toBe(true)
    })

    it('should warn about retail + accreditation', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['retail'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      const step = store.currentForm.steps[0]
      expect(step.validation?.warnings.length).toBeGreaterThan(0)
      expect(step.validation?.warnings.some(w => w.field === 'investorTypes')).toBe(true)
    })

    it('should warn about MICA for non-EU', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'mica',
        requiresMICACompliance: true,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      const step = store.currentForm.steps[0]
      expect(step.validation?.warnings.some(w => w.field === 'requiresMICACompliance')).toBe(true)
    })

    it('should generate policy summary', () => {
      const store = useComplianceSetupStore()

      const policy: JurisdictionPolicy = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['accredited', 'institutional'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }

      store.setJurisdictionPolicy(policy)

      expect(policy.policySummaryText).toBeDefined()
      expect(policy.policySummaryText).toContain('US')
      expect(policy.policySummaryText).toContain('globally')
      expect(policy.policySummaryText).toContain('accredited')
    })
  })

  describe('Whitelist Eligibility Validation', () => {
    it('should error when whitelist required but not selected', () => {
      const store = useComplianceSetupStore()

      const eligibility: WhitelistEligibility = {
        whitelistRequired: true,
        whitelistId: undefined,
        restrictionType: 'whitelist_only',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['retail'],
        transferRestrictions: ['no_restrictions'],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      }

      store.setWhitelistEligibility(eligibility)

      const step = store.currentForm.steps[1]
      expect(step.validation?.errors.some(e => e.field === 'whitelistId')).toBe(true)
    })

    it('should error when whitelist_only without whitelist', () => {
      const store = useComplianceSetupStore()

      const eligibility: WhitelistEligibility = {
        whitelistRequired: false,
        restrictionType: 'whitelist_only',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['retail'],
        transferRestrictions: ['no_restrictions'],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      }

      store.setWhitelistEligibility(eligibility)

      const step = store.currentForm.steps[1]
      expect(step.validation?.errors.some(e => e.field === 'restrictionType')).toBe(true)
    })

    it('should warn about KYC without whitelist', () => {
      const store = useComplianceSetupStore()

      const eligibility: WhitelistEligibility = {
        whitelistRequired: false,
        restrictionType: 'kyc_required',
        requiresKYC: true,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['retail'],
        transferRestrictions: ['no_restrictions'],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      }

      store.setWhitelistEligibility(eligibility)

      const step = store.currentForm.steps[1]
      expect(step.validation?.warnings.some(w => w.field === 'whitelistRequired')).toBe(true)
    })

    it('should mark step complete when valid', () => {
      const store = useComplianceSetupStore()

      const eligibility: WhitelistEligibility = {
        whitelistRequired: false,
        restrictionType: 'none',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['retail'],
        transferRestrictions: ['no_restrictions'],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      }

      store.setWhitelistEligibility(eligibility)

      const step = store.currentForm.steps[1]
      expect(step.isValid).toBe(true)
      expect(step.isComplete).toBe(true)
    })
  })

  describe('KYC/AML Readiness Validation', () => {
    it('should error when KYC required but not configured', () => {
      const store = useComplianceSetupStore()

      // Set whitelist with KYC requirement
      store.setWhitelistEligibility({
        whitelistRequired: true,
        whitelistId: 'test-whitelist',
        restrictionType: 'kyc_required',
        requiresKYC: true,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['retail'],
        transferRestrictions: [],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      })

      const readiness: KYCAMLReadiness = {
        kycProviderConfigured: false,
        kycProviderStatus: 'not_configured',
        amlProviderConfigured: false,
        amlProviderStatus: 'not_configured',
        requiredDocuments: [],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'not_started',
        sanctionsScreeningEnabled: false,
        pepsCheckEnabled: false,
        adverseMediaCheckEnabled: false,
        overallReadinessStatus: 'not_ready',
        blockingIssues: [],
      }

      store.setKYCAMLReadiness(readiness)

      const step = store.currentForm.steps[2]
      expect(step.validation?.errors.some(e => e.field === 'kycProviderConfigured')).toBe(true)
    })

    it('should warn about incomplete required documents', () => {
      const store = useComplianceSetupStore()

      const readiness: KYCAMLReadiness = {
        kycProviderConfigured: true,
        kycProviderName: 'Test KYC',
        kycProviderStatus: 'ready',
        amlProviderConfigured: false,
        amlProviderStatus: 'not_configured',
        requiredDocuments: [
          {
            id: 'doc1',
            type: 'government_id',
            label: 'Government ID',
            description: 'Valid government-issued ID',
            isRequired: true,
            isCompleted: false,
          }
        ],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'not_started',
        sanctionsScreeningEnabled: false,
        pepsCheckEnabled: false,
        adverseMediaCheckEnabled: false,
        overallReadinessStatus: 'not_ready',
        blockingIssues: [],
      }

      store.setKYCAMLReadiness(readiness)

      const step = store.currentForm.steps[2]
      expect(step.validation?.warnings.some(w => w.field === 'requiredDocuments')).toBe(true)
    })

    it('should mark step complete when valid', () => {
      const store = useComplianceSetupStore()

      const readiness: KYCAMLReadiness = {
        kycProviderConfigured: true,
        kycProviderName: 'Test KYC',
        kycProviderStatus: 'ready',
        amlProviderConfigured: true,
        amlProviderName: 'Test AML',
        amlProviderStatus: 'ready',
        requiredDocuments: [],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'completed',
        sanctionsScreeningEnabled: true,
        pepsCheckEnabled: true,
        adverseMediaCheckEnabled: true,
        overallReadinessStatus: 'ready',
        blockingIssues: [],
      }

      store.setKYCAMLReadiness(readiness)

      const step = store.currentForm.steps[2]
      expect(step.isValid).toBe(true)
      expect(step.isComplete).toBe(true)
    })
  })

  describe('Attestation Evidence Validation', () => {
    it('should error when required attestations not completed', () => {
      const store = useComplianceSetupStore()

      const evidence: AttestationEvidence = {
        attestations: [
          {
            id: 'att1',
            type: 'jurisdiction_declaration',
            statement: 'I declare jurisdiction',
            isRequired: true,
            isAttested: false,
          }
        ],
        evidenceReferences: [],
        complianceBadgeEligible: false,
        hasLegalReview: false,
        auditTrailReady: false,
      }

      store.setAttestationEvidence(evidence)

      const step = store.currentForm.steps[3]
      expect(step.validation?.errors.some(e => e.field === 'attestations')).toBe(true)
    })

    it('should warn about MICA without legal review', () => {
      const store = useComplianceSetupStore()

      // Set MICA compliance
      store.setJurisdictionPolicy({
        issuerCountry: 'DE',
        issuerJurisdictionType: 'eu',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'mica',
        requiresMICACompliance: true,
        requiresSECCompliance: false,
      })

      const evidence: AttestationEvidence = {
        attestations: [],
        evidenceReferences: [],
        complianceBadgeEligible: false,
        hasLegalReview: false,
        auditTrailReady: false,
      }

      store.setAttestationEvidence(evidence)

      const step = store.currentForm.steps[3]
      expect(step.validation?.warnings.some(w => w.field === 'hasLegalReview')).toBe(true)
    })

    it('should mark step complete when attestations completed', () => {
      const store = useComplianceSetupStore()

      const evidence: AttestationEvidence = {
        attestations: [
          {
            id: 'att1',
            type: 'jurisdiction_declaration',
            statement: 'I declare jurisdiction',
            isRequired: true,
            isAttested: true,
            attestedAt: new Date(),
            attestedBy: 'user@example.com',
          }
        ],
        evidenceReferences: [],
        complianceBadgeEligible: true,
        complianceBadgeLevel: 'standard',
        hasLegalReview: true,
        legalReviewDate: new Date(),
        auditTrailReady: true,
      }

      store.setAttestationEvidence(evidence)

      const step = store.currentForm.steps[3]
      expect(step.isValid).toBe(true)
      expect(step.isComplete).toBe(true)
    })
  })

  describe('Readiness Calculation', () => {
    it('should calculate readiness with no completed steps', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      expect(readiness.readinessScore).toBe(0)
      expect(readiness.isReadyForDeploy).toBe(false)
      expect(readiness.blockers.length).toBeGreaterThan(0)
      expect(readiness.overallRisk).toBe('critical')
    })

    it('should generate blockers for incomplete required steps', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      const stepIds = ['jurisdiction', 'whitelist', 'kyc_aml', 'attestation']
      stepIds.forEach(stepId => {
        const hasBlocker = readiness.blockers.some(b => b.relatedStepId === stepId)
        expect(hasBlocker).toBe(true)
      })
    })

    it('should calculate readiness with all data steps complete', () => {
      const store = useComplianceSetupStore()

      // Complete all data steps (not readiness step)
      store.setJurisdictionPolicy({
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      })

      store.setWhitelistEligibility({
        whitelistRequired: false,
        restrictionType: 'none',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['institutional'],
        transferRestrictions: [],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      })

      store.setKYCAMLReadiness({
        kycProviderConfigured: true,
        kycProviderStatus: 'ready',
        amlProviderConfigured: true,
        amlProviderStatus: 'ready',
        requiredDocuments: [],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'completed',
        sanctionsScreeningEnabled: true,
        pepsCheckEnabled: true,
        adverseMediaCheckEnabled: true,
        overallReadinessStatus: 'ready',
        blockingIssues: [],
      })

      store.setAttestationEvidence({
        attestations: [],
        evidenceReferences: [],
        complianceBadgeEligible: true,
        hasLegalReview: true,
        auditTrailReady: true,
      })

      const readiness = store.calculateReadiness

      // With 4 data steps complete, score should be 80% before blocker penalty
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(60)
      expect(readiness.jurisdictionReady).toBe(true)
      expect(readiness.whitelistReady).toBe(true)
      expect(readiness.kycAMLReady).toBe(true)
      expect(readiness.attestationReady).toBe(true)
      
      // Will have readiness step incomplete blocker (critical)
      const readinessBlocker = readiness.blockers.find(b => b.relatedStepId === 'readiness')
      expect(readinessBlocker).toBeDefined()
      expect(readinessBlocker?.severity).toBe('critical')
      
      // Should not be ready for deploy due to readiness step incomplete
      expect(readiness.isReadyForDeploy).toBe(false)
      expect(readiness.overallRisk).toBe('critical')
    })

    it('should reduce score for blockers', () => {
      const store = useComplianceSetupStore()

      // Complete some steps
      store.setJurisdictionPolicy({
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      })

      const readiness = store.calculateReadiness

      // Score should be > 0 but < 100 due to incomplete steps
      // With 1 of 5 steps complete, base score is 20%, but blockers reduce it
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(0)
      expect(readiness.readinessScore).toBeLessThan(100)
      expect(readiness.blockers.length).toBeGreaterThan(0)
    })

    it('should prioritize critical blockers in next actions', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      if (readiness.nextActions.length > 0) {
        expect(readiness.nextActions[0].priority).toBe('critical')
      }
    })

    it('should include deep links in next actions', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      readiness.nextActions.forEach(action => {
        if (action.deepLink) {
          expect(action.deepLink).toContain('/compliance/setup')
        }
      })
    })

    it('should limit next actions to 5', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      expect(readiness.nextActions.length).toBeLessThanOrEqual(5)
    })

    it('should calculate estimated time to ready', () => {
      const store = useComplianceSetupStore()

      const readiness = store.calculateReadiness

      if (!readiness.isReadyForDeploy) {
        expect(readiness.estimatedTimeToReady).toBeDefined()
        expect(readiness.estimatedTimeToReady).toContain('minutes')
      }
    })
  })

  describe('Submit Setup', () => {
    it('should throw error when not ready', async () => {
      const store = useComplianceSetupStore()

      await expect(store.submitSetup()).rejects.toThrow('Cannot submit: compliance setup has blocking issues')
    })

    it('should set submitting flag during submission', async () => {
      const store = useComplianceSetupStore()

      // Complete all steps including readiness
      store.setJurisdictionPolicy({
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      })

      store.setWhitelistEligibility({
        whitelistRequired: false,
        restrictionType: 'none',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['institutional'],
        transferRestrictions: [],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      })

      store.setKYCAMLReadiness({
        kycProviderConfigured: true,
        kycProviderStatus: 'ready',
        amlProviderConfigured: true,
        amlProviderStatus: 'ready',
        requiredDocuments: [],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'completed',
        sanctionsScreeningEnabled: true,
        pepsCheckEnabled: true,
        adverseMediaCheckEnabled: true,
        overallReadinessStatus: 'ready',
        blockingIssues: [],
      })

      store.setAttestationEvidence({
        attestations: [],
        evidenceReferences: [],
        complianceBadgeEligible: true,
        hasLegalReview: true,
        auditTrailReady: true,
      })

      // Mark readiness step as complete manually
      store.completeStep('readiness', {
        isValid: true,
        errors: [],
        warnings: [],
        canProceed: true,
      })

      expect(store.isSubmitting).toBe(false)

      await store.submitSetup()

      // After completion, flag should be reset
      expect(store.isSubmitting).toBe(false)
      expect(store.currentForm.isSubmitted).toBe(true)
    })

    it('should mark form as complete and submitted', async () => {
      const store = useComplianceSetupStore()

      // Complete all data steps
      store.setJurisdictionPolicy({
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      })

      store.setWhitelistEligibility({
        whitelistRequired: false,
        restrictionType: 'none',
        requiresKYC: false,
        requiresAML: false,
        requiresAccreditationProof: false,
        allowedInvestorTypes: ['institutional'],
        transferRestrictions: [],
        hasLockupPeriod: false,
        allowSecondaryTrading: true,
      })

      store.setKYCAMLReadiness({
        kycProviderConfigured: true,
        kycProviderStatus: 'ready',
        amlProviderConfigured: true,
        amlProviderStatus: 'ready',
        requiredDocuments: [],
        completedDocuments: [],
        identityVerificationFlow: 'automated',
        identityVerificationStatus: 'completed',
        sanctionsScreeningEnabled: true,
        pepsCheckEnabled: true,
        adverseMediaCheckEnabled: true,
        overallReadinessStatus: 'ready',
        blockingIssues: [],
      })

      store.setAttestationEvidence({
        attestations: [],
        evidenceReferences: [],
        complianceBadgeEligible: true,
        hasLegalReview: true,
        auditTrailReady: true,
      })

      // Mark readiness step as complete
      store.completeStep('readiness', {
        isValid: true,
        errors: [],
        warnings: [],
        canProceed: true,
      })

      await store.submitSetup()

      expect(store.currentForm.isComplete).toBe(true)
      expect(store.currentForm.isSubmitted).toBe(true)
      expect(store.currentForm.submittedAt).toBeInstanceOf(Date)
      expect(store.currentForm.readinessAssessment).toBeDefined()
    })
  })

  describe('Reset', () => {
    it('should reset all state', () => {
      const store = useComplianceSetupStore()

      // Modify state
      store.currentForm.currentStepIndex = 3
      store.isLoading = true
      store.isSubmitting = true
      store.hasDraftLoaded = true
      store.saveDraft()

      // Reset
      store.reset()

      expect(store.currentForm.currentStepIndex).toBe(0)
      expect(store.isLoading).toBe(false)
      expect(store.isSubmitting).toBe(false)
      expect(store.hasDraftLoaded).toBe(false)
      expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeNull()
    })
  })
})
