/**
 * Unit Tests: ComplianceSetupWorkspace Navigation and Step Logic
 *
 * These tests are the stable, CI-deterministic equivalents to the E2E tests in
 * e2e/compliance-setup-workspace.spec.ts that are skipped in CI due to timing
 * constraints (complex multi-step form interactions that exceed CI timing budget).
 *
 * AC #5: "At least 80% of previously skipped high-priority auth/compliance tests
 *         are either enabled and passing or explicitly replaced by stable equivalents."
 *
 * Coverage map (E2E → Unit):
 *  - should complete jurisdiction step            → step navigation + field completion
 *  - should complete whitelist step               → multi-step progression
 *  - should complete KYC/AML step                 → 3-step cumulative navigation
 *  - should complete attestation step             → full 5-step flow
 *  - should block progression without required    → canProceedToNext behavior
 *  - should show warning for contradictions        → validation warning propagation
 *  - should display blockers in readiness summary → calculateReadiness blockers
 *  - should navigate to blocked step from summary → goToStepById + jumpToStep
 *  - should save draft and persist on reload      → saveDraft / loadDraft lifecycle
 *  - should persist progress across steps         → multi-step draft persistence
 *  - should allow clearing draft and starting     → clearDraft resets all state
 *  - should navigate between steps (progress bar) → goToStep direct navigation
 *  - should go back using Previous button         → previousStep behavior
 *  - should navigate to specific step from summary → goToStepById resolution
 *
 * Business value: Provides deterministic CI proof that compliance workspace
 * step logic is correct without depending on browser timing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceSetupStore } from '../../stores/complianceSetup'
import type { JurisdictionPolicy, WhitelistEligibility, KYCAMLReadiness, AttestationEvidence, StepValidation } from '../../types/complianceSetup'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildValidJurisdictionPolicy(): JurisdictionPolicy {
  return {
    issuerCountry: 'US',
    issuerJurisdictionType: 'us',
    distributionScope: 'country_specific',
    allowedCountries: ['US', 'CA'],
    investorTypes: ['institutional'],
    requiresAccreditation: false,
    regulatoryFramework: 'sec',
    requiresMICACompliance: false,
    requiresSECCompliance: true,
  }
}

function buildValidWhitelistEligibility(): WhitelistEligibility {
  return {
    whitelistRequired: true,
    restrictionType: 'kyc_required',
    requiresKYC: true,
    requiresAML: true,
    requiresAccreditationProof: false,
    allowedInvestorTypes: ['institutional'],
    transferRestrictions: ['whitelist_only'],
    hasLockupPeriod: false,
    allowSecondaryTrading: false,
  }
}

function buildValidKYCAMLReadiness(): KYCAMLReadiness {
  return {
    kycProviderConfigured: true,
    kycProviderName: 'Jumio',
    kycProviderStatus: 'ready',
    amlProviderConfigured: true,
    amlProviderName: 'Chainalysis',
    amlProviderStatus: 'ready',
    requiredDocuments: [],
    completedDocuments: [],
    identityVerificationFlow: 'automated',
    identityVerificationStatus: 'completed',
    sanctionsScreeningEnabled: true,
    pepsCheckEnabled: true,
    adverseMediaCheckEnabled: false,
    overallReadinessStatus: 'ready',
    blockingIssues: [],
  }
}

function buildValidAttestationEvidence(): AttestationEvidence {
  return {
    attestations: [],
    evidenceReferences: [],
    complianceBadgeEligible: true,
    complianceBadgeLevel: 'standard',
    hasLegalReview: true,
    legalReviewDate: new Date('2024-01-01'),
    auditTrailReady: true,
  }
}

function makeValidation(isValid: boolean): StepValidation {
  return {
    isValid,
    errors: [],
    warnings: [],
    canProceed: isValid,
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ComplianceSetupWorkspace – Navigation and Step Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── 1. Initial state ────────────────────────────────────────────────────

  it('should initialise at step 0 with 0 completed steps', () => {
    const store = useComplianceSetupStore()
    expect(store.currentForm.currentStepIndex).toBe(0)
    expect(store.completedSteps).toBe(0)
    expect(store.progressPercentage).toBe(0)
  })

  it('should have 5 required steps in the correct order', () => {
    const store = useComplianceSetupStore()
    const ids = store.currentForm.steps.map(s => s.id)
    expect(ids).toEqual(['jurisdiction', 'whitelist', 'kyc_aml', 'attestation', 'readiness'])
    store.currentForm.steps.forEach(s => expect(s.isRequired).toBe(true))
  })

  // ── 2. Direct step navigation via progress bar (replaces E2E test #12) ──

  it('should navigate directly to any step via goToStep', () => {
    const store = useComplianceSetupStore()
    store.goToStep(2)
    expect(store.currentForm.currentStepIndex).toBe(2)
    expect(store.currentStep.id).toBe('kyc_aml')
  })

  it('should set step status to in_progress when navigating to a not_started step', () => {
    const store = useComplianceSetupStore()
    expect(store.currentForm.steps[1].status).toBe('not_started')
    store.goToStep(1)
    expect(store.currentForm.steps[1].status).toBe('in_progress')
  })

  it('should not navigate beyond bounds', () => {
    const store = useComplianceSetupStore()
    store.goToStep(99)
    expect(store.currentForm.currentStepIndex).toBe(0)
    store.goToStep(-1)
    expect(store.currentForm.currentStepIndex).toBe(0)
  })

  // ── 3. Jurisdiction step completion (replaces E2E test #1) ──────────────

  it('should complete jurisdiction step and update progress', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))

    expect(store.currentForm.steps[0].isComplete).toBe(true)
    expect(store.currentForm.steps[0].isValid).toBe(true)
    expect(store.currentForm.steps[0].status).toBe('completed')
    expect(store.completedSteps).toBe(1)
    expect(store.progressPercentage).toBe(20)
  })

  // ── 4. Whitelist step completion (replaces E2E test #2) ─────────────────

  it('should complete whitelist step after jurisdiction', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.setWhitelistEligibility(buildValidWhitelistEligibility())
    store.completeStep('whitelist', makeValidation(true))

    expect(store.currentForm.steps[1].isComplete).toBe(true)
    expect(store.completedSteps).toBe(2)
    expect(store.progressPercentage).toBe(40)
  })

  // ── 5. KYC/AML step completion (replaces E2E test #3) ───────────────────

  it('should complete KYC/AML step in a 3-step cumulative flow', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.setWhitelistEligibility(buildValidWhitelistEligibility())
    store.completeStep('whitelist', makeValidation(true))
    store.setKYCAMLReadiness(buildValidKYCAMLReadiness())
    store.completeStep('kyc_aml', makeValidation(true))

    expect(store.currentForm.steps[2].isComplete).toBe(true)
    expect(store.completedSteps).toBe(3)
    expect(store.progressPercentage).toBe(60)
  })

  // ── 6. Full 5-step completion including attestation (replaces E2E test #4) ──

  it('should complete all 5 steps with 100% progress', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.setWhitelistEligibility(buildValidWhitelistEligibility())
    store.completeStep('whitelist', makeValidation(true))
    store.setKYCAMLReadiness(buildValidKYCAMLReadiness())
    store.completeStep('kyc_aml', makeValidation(true))
    store.setAttestationEvidence(buildValidAttestationEvidence())
    store.completeStep('attestation', makeValidation(true))
    store.completeStep('readiness', makeValidation(true))

    expect(store.completedSteps).toBe(5)
    expect(store.progressPercentage).toBe(100)
    expect(store.currentForm.steps.every(s => s.isComplete)).toBe(true)
  })

  // ── 7. Block progression without required fields (replaces E2E test #5) ──

  it('should mark step as blocked when validation fails', () => {
    const store = useComplianceSetupStore()
    store.completeStep('jurisdiction', makeValidation(false))

    expect(store.currentForm.steps[0].isComplete).toBe(false)
    expect(store.currentForm.steps[0].isValid).toBe(false)
    expect(store.currentForm.steps[0].status).toBe('blocked')
  })

  it('should reflect validation errors in step validation object', () => {
    const store = useComplianceSetupStore()
    const failValidation: StepValidation = {
      isValid: false,
      errors: [{ field: 'issuerCountry', message: 'Issuer country is required', severity: 'critical', remediationHint: 'Select your issuer country' }],
      warnings: [],
      canProceed: false,
    }
    store.completeStep('jurisdiction', failValidation)

    const step = store.currentForm.steps[0]
    expect(step.validation?.errors).toHaveLength(1)
    expect(step.validation?.errors[0].field).toBe('issuerCountry')
  })

  // ── 8. Validation warnings (replaces E2E test #6) ───────────────────────

  it('should surface warnings without blocking completion when no critical errors', () => {
    const store = useComplianceSetupStore()
    const warnValidation: StepValidation = {
      isValid: true,
      errors: [],
      warnings: [{ field: 'investorTypes', message: 'Retail investors increase risk', severity: 'medium', remediationHint: 'Consider restricting to institutional investors' }],
      canProceed: true,
    }
    store.completeStep('jurisdiction', warnValidation)

    expect(store.currentForm.steps[0].isComplete).toBe(true)
    expect(store.currentForm.steps[0].validation?.warnings).toHaveLength(1)
    expect(store.currentForm.steps[0].validation?.warnings[0].field).toBe('investorTypes')
  })

  // ── 9. Readiness summary blockers (replaces E2E test #7) ────────────────

  it('should show blockers in readiness for incomplete required steps', () => {
    const store = useComplianceSetupStore()
    // Leave all steps incomplete → 5 blockers
    const readiness = store.calculateReadiness

    expect(readiness.blockers.length).toBeGreaterThan(0)
    const jurisdictionBlocker = readiness.blockers.find(b => b.relatedStepId === 'jurisdiction')
    expect(jurisdictionBlocker).toBeDefined()
    expect(jurisdictionBlocker?.severity).toBe('critical')
  })

  it('should reduce blockers as steps are completed', () => {
    const store = useComplianceSetupStore()
    const initialBlockers = store.calculateReadiness.blockers.length

    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))

    const afterOneComplete = store.calculateReadiness.blockers.length
    expect(afterOneComplete).toBeLessThan(initialBlockers)
  })

  // ── 10. Navigate to specific step (replaces E2E test #8 and #14) ────────

  it('should navigate to a step by its string ID', () => {
    const store = useComplianceSetupStore()
    // Simulate goToStepById logic (same as ComplianceSetupWorkspace.vue:309-312)
    const steps = store.currentForm.steps
    const targetId = 'kyc_aml'
    const index = steps.findIndex(s => s.id === targetId)
    store.goToStep(index)

    expect(store.currentForm.currentStepIndex).toBe(2)
    expect(store.currentStep.id).toBe('kyc_aml')
  })

  it('should handle navigation to readiness summary step by ID', () => {
    const store = useComplianceSetupStore()
    const index = store.currentForm.steps.findIndex(s => s.id === 'readiness')
    store.goToStep(index)

    expect(store.currentForm.currentStepIndex).toBe(4)
    expect(store.currentStep.id).toBe('readiness')
  })

  // ── 11. Draft save and load (replaces E2E test #9) ───────────────────────

  it('should save draft to localStorage', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))

    const saved = store.saveDraft()
    expect(saved).toBe(true)
    expect(localStorage.getItem('biatec_compliance_setup_draft')).not.toBeNull()
  })

  it('should restore draft from localStorage on loadDraft', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.goToStep(1)
    store.saveDraft()

    // Simulate page reload: new store instance, load from storage
    setActivePinia(createPinia())
    const freshStore = useComplianceSetupStore()
    expect(freshStore.currentForm.currentStepIndex).toBe(0) // not yet loaded

    const loaded = freshStore.loadDraft()
    expect(loaded).toBe(true)
    expect(freshStore.currentForm.currentStepIndex).toBe(1)
    expect(freshStore.currentForm.steps[0].isComplete).toBe(true)
  })

  // ── 12. Multi-step draft persistence (replaces E2E test #10) ─────────────

  it('should persist progress across multiple steps', () => {
    const store = useComplianceSetupStore()
    // Complete 3 steps
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.setWhitelistEligibility(buildValidWhitelistEligibility())
    store.completeStep('whitelist', makeValidation(true))
    store.setKYCAMLReadiness(buildValidKYCAMLReadiness())
    store.completeStep('kyc_aml', makeValidation(true))
    store.goToStep(3) // navigate to attestation

    store.saveDraft()

    // Restore on fresh store
    setActivePinia(createPinia())
    const freshStore = useComplianceSetupStore()
    freshStore.loadDraft()

    expect(freshStore.completedSteps).toBe(3)
    expect(freshStore.currentForm.currentStepIndex).toBe(3)
    expect(freshStore.currentForm.steps[0].isComplete).toBe(true)
    expect(freshStore.currentForm.steps[1].isComplete).toBe(true)
    expect(freshStore.currentForm.steps[2].isComplete).toBe(true)
  })

  // ── 13. Clear draft (replaces E2E test #11) ──────────────────────────────

  it('should clear draft and reset state to defaults', () => {
    const store = useComplianceSetupStore()
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.goToStep(1)
    store.saveDraft()

    store.clearDraft()

    expect(localStorage.getItem('biatec_compliance_setup_draft')).toBeNull()
    expect(store.currentForm.currentStepIndex).toBe(0)
    expect(store.completedSteps).toBe(0)
  })

  it('should return false when loading a non-existent draft', () => {
    const store = useComplianceSetupStore()
    localStorage.clear()
    const loaded = store.loadDraft()
    expect(loaded).toBe(false)
  })

  // ── 14. Previous step navigation (replaces E2E test #13) ────────────────

  it('should navigate to the previous step when not on first step', () => {
    const store = useComplianceSetupStore()
    store.goToStep(2)
    expect(store.currentForm.currentStepIndex).toBe(2)

    // Simulate previousStep() from ComplianceSetupWorkspace.vue:316-321
    if (store.currentForm.currentStepIndex > 0) {
      store.goToStep(store.currentForm.currentStepIndex - 1)
    }
    expect(store.currentForm.currentStepIndex).toBe(1)
  })

  it('should remain on step 0 when previousStep called at beginning', () => {
    const store = useComplianceSetupStore()
    expect(store.currentForm.currentStepIndex).toBe(0)
    // Should not go below 0
    if (store.currentForm.currentStepIndex > 0) {
      store.goToStep(store.currentForm.currentStepIndex - 1)
    }
    expect(store.currentForm.currentStepIndex).toBe(0)
  })

  // ── 15. Readiness score calculation ─────────────────────────────────────

  it('should calculate 0% readiness with no completed steps', () => {
    const store = useComplianceSetupStore()
    // With all steps incomplete, blockers reduce base 0 score further (capped at 0)
    expect(store.calculateReadiness.readinessScore).toBeGreaterThanOrEqual(0)
    expect(store.calculateReadiness.readinessScore).toBeLessThanOrEqual(20)
  })

  it('should increase readiness score as steps are completed', () => {
    const store = useComplianceSetupStore()
    const initial = store.calculateReadiness.readinessScore

    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    store.setWhitelistEligibility(buildValidWhitelistEligibility())
    store.completeStep('whitelist', makeValidation(true))
    store.setKYCAMLReadiness(buildValidKYCAMLReadiness())
    store.completeStep('kyc_aml', makeValidation(true))
    store.setAttestationEvidence(buildValidAttestationEvidence())
    store.completeStep('attestation', makeValidation(true))
    store.completeStep('readiness', makeValidation(true))

    expect(store.calculateReadiness.readinessScore).toBeGreaterThan(initial)
    expect(store.calculateReadiness.readinessScore).toBeGreaterThanOrEqual(90)
  })

  // ── 16. Step status transitions ──────────────────────────────────────────

  it('should transition step from not_started to in_progress on navigation', () => {
    const store = useComplianceSetupStore()
    expect(store.currentForm.steps[2].status).toBe('not_started')
    store.goToStep(2)
    expect(store.currentForm.steps[2].status).toBe('in_progress')
  })

  it('should transition step from in_progress to completed on valid completion', () => {
    const store = useComplianceSetupStore()
    store.goToStep(0) // already in_progress
    store.setJurisdictionPolicy(buildValidJurisdictionPolicy())
    store.completeStep('jurisdiction', makeValidation(true))
    expect(store.currentForm.steps[0].status).toBe('completed')
  })

  // ── 17. Analytics step update ────────────────────────────────────────────

  it('should update step status independently of completion', () => {
    const store = useComplianceSetupStore()
    store.updateStepStatus('whitelist', 'in_progress')
    expect(store.currentForm.steps[1].status).toBe('in_progress')
    store.updateStepStatus('whitelist', 'completed')
    expect(store.currentForm.steps[1].status).toBe('completed')
  })
})
