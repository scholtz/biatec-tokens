/**
 * Compliance Setup Store
 * 
 * Manages state for the guided compliance setup workspace.
 * Supports draft persistence, step validation, readiness scoring,
 * and analytics tracking.
 * 
 * Email/password authentication only - no wallet connectors.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ComplianceSetupForm,
  ComplianceSetupStep,
  JurisdictionPolicy,
  WhitelistEligibility,
  KYCAMLReadiness,
  AttestationEvidence,
  ReadinessAssessment,
  ReadinessBlocker,
  NextAction,
  StepValidation,
  ValidationError,
  ValidationWarning,
  RiskLevel,
  SetupStepStatus,
} from '../types/complianceSetup'

const STORAGE_KEY = 'biatec_compliance_setup_draft'
const STORAGE_VERSION = '1.0'

export const useComplianceSetupStore = defineStore('complianceSetup', () => {
  // State
  const currentForm = ref<ComplianceSetupForm>({
    createdAt: new Date(),
    lastModified: new Date(),
    currentStepIndex: 0,
    steps: initializeSteps(),
    isComplete: false,
    isSubmitted: false,
  })

  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const hasDraftLoaded = ref(false)

  // Computed
  const currentStep = computed(() => currentForm.value.steps[currentForm.value.currentStepIndex])
  const totalSteps = computed(() => currentForm.value.steps.length)
  const completedSteps = computed(() => currentForm.value.steps.filter(s => s.isComplete).length)
  const progressPercentage = computed(() => Math.round((completedSteps.value / totalSteps.value) * 100))

  /**
   * Initialize default steps
   */
  function initializeSteps(): ComplianceSetupStep[] {
    return [
      {
        id: 'jurisdiction',
        title: 'Jurisdiction & Policy',
        description: 'Configure issuer jurisdiction, distribution geography, and investor constraints',
        status: 'not_started',
        isRequired: true,
        isComplete: false,
        isValid: false,
      },
      {
        id: 'whitelist',
        title: 'Whitelist & Eligibility',
        description: 'Set up investor eligibility and access restrictions',
        status: 'not_started',
        isRequired: true,
        isComplete: false,
        isValid: false,
      },
      {
        id: 'kyc_aml',
        title: 'KYC/AML Readiness',
        description: 'Configure KYC provider and document requirements',
        status: 'not_started',
        isRequired: true,
        isComplete: false,
        isValid: false,
      },
      {
        id: 'attestation',
        title: 'Attestation & Evidence',
        description: 'Provide issuer attestations and compliance evidence',
        status: 'not_started',
        isRequired: true,
        isComplete: false,
        isValid: false,
      },
      {
        id: 'readiness',
        title: 'Readiness Summary',
        description: 'Review compliance readiness and resolve blockers',
        status: 'not_started',
        isRequired: true,
        isComplete: false,
        isValid: false,
        dependencies: ['jurisdiction', 'whitelist', 'kyc_aml', 'attestation'],
      },
    ]
  }

  /**
   * Load draft from localStorage
   */
  const loadDraft = (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const parsed = JSON.parse(stored)
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Draft version mismatch, clearing old draft')
        clearDraft()
        return false
      }

      // Restore dates
      if (parsed.form.createdAt) parsed.form.createdAt = new Date(parsed.form.createdAt)
      if (parsed.form.lastModified) parsed.form.lastModified = new Date(parsed.form.lastModified)
      if (parsed.form.submittedAt) parsed.form.submittedAt = new Date(parsed.form.submittedAt)
      
      // Restore step dates
      parsed.form.steps.forEach((step: ComplianceSetupStep) => {
        if (step.lastModified) step.lastModified = new Date(step.lastModified)
      })

      currentForm.value = parsed.form
      hasDraftLoaded.value = true

      return true
    } catch (error) {
      console.error('Failed to load draft:', error)
      clearDraft()
      return false
    }
  }

  /**
   * Save draft to localStorage
   */
  const saveDraft = (): boolean => {
    try {
      currentForm.value.lastModified = new Date()
      if (!currentForm.value.setupId) {
        currentForm.value.setupId = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      }

      const toSave = {
        version: STORAGE_VERSION,
        form: currentForm.value,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      return true
    } catch (error) {
      console.error('Failed to save draft:', error)
      return false
    }
  }

  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
    currentForm.value = {
      createdAt: new Date(),
      lastModified: new Date(),
      currentStepIndex: 0,
      steps: initializeSteps(),
      isComplete: false,
      isSubmitted: false,
    }
    hasDraftLoaded.value = false
  }

  /**
   * Navigate to step
   */
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps.value) {
      currentForm.value.currentStepIndex = stepIndex
      const step = currentForm.value.steps[stepIndex]
      if (step.status === 'not_started') {
        step.status = 'in_progress'
      }
      saveDraft()
    }
  }

  /**
   * Update step status
   */
  const updateStepStatus = (stepId: string, status: SetupStepStatus) => {
    const step = currentForm.value.steps.find(s => s.id === stepId)
    if (step) {
      step.status = status
      step.lastModified = new Date()
      saveDraft()
    }
  }

  /**
   * Complete step with validation
   */
  const completeStep = (stepId: string, validation: StepValidation) => {
    const step = currentForm.value.steps.find(s => s.id === stepId)
    if (step) {
      step.isComplete = validation.isValid
      step.isValid = validation.isValid
      step.validation = validation
      step.status = validation.isValid ? 'completed' : 'blocked'
      step.lastModified = new Date()
      saveDraft()
    }
  }

  /**
   * Set jurisdiction policy
   */
  const setJurisdictionPolicy = (policy: JurisdictionPolicy) => {
    currentForm.value.jurisdictionPolicy = policy
    currentForm.value.lastModified = new Date()
    
    // Generate policy summary
    policy.policySummaryText = generatePolicySummary(policy)
    
    // Validate
    const validation = validateJurisdictionPolicy(policy)
    completeStep('jurisdiction', validation)
  }

  /**
   * Generate human-readable policy summary
   */
  const generatePolicySummary = (policy: JurisdictionPolicy): string => {
    const parts: string[] = []
    
    parts.push(`This token will be issued from ${policy.issuerCountry}`)
    
    if (policy.distributionScope === 'global') {
      parts.push('and available globally')
    } else if (policy.distributionScope === 'regional') {
      parts.push(`and available in selected regions`)
    } else {
      parts.push(`and available in specific countries`)
    }
    
    if (policy.blockedCountries && policy.blockedCountries.length > 0) {
      parts.push(`excluding ${policy.blockedCountries.length} restricted jurisdiction(s)`)
    }
    
    const investorTypesText = policy.investorTypes.join(', ')
    parts.push(`Target investors: ${investorTypesText}`)
    
    if (policy.requiresAccreditation) {
      parts.push('Accreditation required')
    }
    
    if (policy.requiresMICACompliance) {
      parts.push('MICA compliant')
    }
    
    return parts.join('. ') + '.'
  }

  /**
   * Validate jurisdiction policy
   */
  const validateJurisdictionPolicy = (policy: JurisdictionPolicy): StepValidation => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!policy.issuerCountry) {
      errors.push({
        field: 'issuerCountry',
        message: 'Issuer country is required',
        severity: 'critical',
        remediationHint: 'Select the country where your organization is legally registered',
      })
    }

    if (!policy.distributionScope) {
      errors.push({
        field: 'distributionScope',
        message: 'Distribution scope is required',
        severity: 'critical',
        remediationHint: 'Specify whether you want global, regional, or country-specific distribution',
      })
    }

    if (!policy.investorTypes || policy.investorTypes.length === 0) {
      errors.push({
        field: 'investorTypes',
        message: 'At least one investor type must be selected',
        severity: 'critical',
        remediationHint: 'Select the types of investors who can purchase this token',
      })
    }

    // Contradictory selections
    if (policy.distributionScope === 'country_specific' && (!policy.allowedCountries || policy.allowedCountries.length === 0)) {
      errors.push({
        field: 'allowedCountries',
        message: 'Country-specific distribution requires allowed countries',
        severity: 'high',
        remediationHint: 'Specify which countries are allowed, or change distribution scope',
      })
    }

    // Warnings
    if (policy.investorTypes.includes('retail') && policy.requiresAccreditation) {
      warnings.push({
        field: 'investorTypes',
        message: 'Retail investors typically do not require accreditation',
        recommendation: 'Consider removing accreditation requirement for retail investors, or restrict to accredited/institutional only',
      })
    }

    if (policy.requiresMICACompliance && policy.issuerJurisdictionType !== 'eu') {
      warnings.push({
        field: 'requiresMICACompliance',
        message: 'MICA compliance is primarily for EU-based issuers',
        recommendation: 'Verify that MICA compliance is necessary for your jurisdiction',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    }
  }

  /**
   * Set whitelist eligibility
   */
  const setWhitelistEligibility = (eligibility: WhitelistEligibility) => {
    currentForm.value.whitelistEligibility = eligibility
    currentForm.value.lastModified = new Date()
    
    const validation = validateWhitelistEligibility(eligibility)
    completeStep('whitelist', validation)
  }

  /**
   * Validate whitelist eligibility
   */
  const validateWhitelistEligibility = (eligibility: WhitelistEligibility): StepValidation => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check consistency
    if (eligibility.whitelistRequired && !eligibility.whitelistId) {
      errors.push({
        field: 'whitelistId',
        message: 'Whitelist is required but not selected',
        severity: 'critical',
        remediationHint: 'Create or select a whitelist to continue',
      })
    }

    if (eligibility.restrictionType === 'whitelist_only' && !eligibility.whitelistRequired) {
      errors.push({
        field: 'restrictionType',
        message: 'Whitelist-only restriction requires whitelist to be enabled',
        severity: 'high',
        remediationHint: 'Enable whitelist requirement or change restriction type',
      })
    }

    // Warnings
    if (eligibility.requiresKYC && !eligibility.whitelistRequired) {
      warnings.push({
        field: 'whitelistRequired',
        message: 'KYC requirements typically work best with a whitelist',
        recommendation: 'Consider enabling whitelist to manage KYC-verified investors',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    }
  }

  /**
   * Set KYC/AML readiness
   */
  const setKYCAMLReadiness = (readiness: KYCAMLReadiness) => {
    currentForm.value.kycAMLReadiness = readiness
    currentForm.value.lastModified = new Date()
    
    const validation = validateKYCAMLReadiness(readiness)
    completeStep('kyc_aml', validation)
  }

  /**
   * Validate KYC/AML readiness
   */
  const validateKYCAMLReadiness = (readiness: KYCAMLReadiness): StepValidation => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check if KYC is required based on whitelist settings
    const whitelistEligibility = currentForm.value.whitelistEligibility
    if (whitelistEligibility?.requiresKYC && !readiness.kycProviderConfigured) {
      errors.push({
        field: 'kycProviderConfigured',
        message: 'KYC provider must be configured (required by whitelist settings)',
        severity: 'critical',
        remediationHint: 'Configure a KYC provider or remove KYC requirement from whitelist',
      })
    }

    // Check required documents
    const requiredDocs = readiness.requiredDocuments.filter(d => d.isRequired)
    const incompleteDocs = requiredDocs.filter(d => !d.isCompleted)
    if (incompleteDocs.length > 0) {
      warnings.push({
        field: 'requiredDocuments',
        message: `${incompleteDocs.length} required document(s) not completed`,
        recommendation: 'Complete all required documents before launching',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: true, // Allow proceeding with warnings
    }
  }

  /**
   * Set attestation evidence
   */
  const setAttestationEvidence = (evidence: AttestationEvidence) => {
    currentForm.value.attestationEvidence = evidence
    currentForm.value.lastModified = new Date()
    
    const validation = validateAttestationEvidence(evidence)
    completeStep('attestation', validation)
  }

  /**
   * Validate attestation evidence
   */
  const validateAttestationEvidence = (evidence: AttestationEvidence): StepValidation => {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check required attestations
    const requiredAttestations = evidence.attestations.filter(a => a.isRequired)
    const incompleteAttestations = requiredAttestations.filter(a => !a.isAttested)
    
    if (incompleteAttestations.length > 0) {
      errors.push({
        field: 'attestations',
        message: `${incompleteAttestations.length} required attestation(s) not completed`,
        severity: 'critical',
        remediationHint: 'Complete all required attestations to proceed',
      })
    }

    // Check legal review for MICA compliance
    const jurisdictionPolicy = currentForm.value.jurisdictionPolicy
    if (jurisdictionPolicy?.requiresMICACompliance && !evidence.hasLegalReview) {
      warnings.push({
        field: 'hasLegalReview',
        message: 'MICA compliance typically requires legal review',
        recommendation: 'Obtain legal review of your compliance setup',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    }
  }

  /**
   * Calculate readiness assessment
   */
  const calculateReadiness = computed<ReadinessAssessment>(() => {
    const blockers: ReadinessBlocker[] = []
    const warnings: ValidationWarning[] = []
    const recommendations: string[] = []

    // Check each step
    currentForm.value.steps.forEach(step => {
      if (step.isRequired && !step.isComplete) {
        blockers.push({
          id: `blocker_${step.id}_incomplete`,
          severity: 'critical',
          category: step.id as any,
          title: `${step.title} not completed`,
          description: `This required step must be completed before deployment`,
          remediationSteps: [
            `Navigate to ${step.title} step`,
            'Complete all required fields',
            'Resolve any validation errors',
          ],
          relatedStepId: step.id,
          canAutoResolve: false,
        })
      }

      if (step.validation) {
        step.validation.errors.forEach(error => {
          if (error.severity === 'critical' || error.severity === 'high') {
            blockers.push({
              id: `blocker_${step.id}_${error.field}`,
              severity: error.severity,
              category: step.id as any,
              title: error.message,
              description: error.remediationHint,
              remediationSteps: [error.remediationHint],
              relatedStepId: step.id,
              canAutoResolve: false,
            })
          }
        })

        warnings.push(...step.validation.warnings)
      }
    })

    // Calculate readiness score
    const requiredSteps = currentForm.value.steps.filter(s => s.isRequired)
    const completedRequired = requiredSteps.filter(s => s.isComplete).length
    const baseScore = Math.round((completedRequired / requiredSteps.length) * 100)
    
    // Reduce score for blockers
    const blockerPenalty = Math.min(blockers.length * 10, 50)
    const readinessScore = Math.max(0, baseScore - blockerPenalty)

    // Determine overall risk
    let overallRisk: RiskLevel
    if (blockers.some(b => b.severity === 'critical')) {
      overallRisk = 'critical'
    } else if (blockers.length > 3) {
      overallRisk = 'high'
    } else if (blockers.length > 0 || warnings.length > 3) {
      overallRisk = 'medium'
    } else if (warnings.length > 0) {
      overallRisk = 'low'
    } else {
      overallRisk = 'none'
    }

    // Check readiness by category
    const jurisdictionReady = currentForm.value.steps.find(s => s.id === 'jurisdiction')?.isComplete || false
    const whitelistReady = currentForm.value.steps.find(s => s.id === 'whitelist')?.isComplete || false
    const kycAMLReady = currentForm.value.steps.find(s => s.id === 'kyc_aml')?.isComplete || false
    const attestationReady = currentForm.value.steps.find(s => s.id === 'attestation')?.isComplete || false

    const isReadyForDeploy = blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length === 0

    // Generate next actions from blockers
    const nextActions: NextAction[] = blockers
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .slice(0, 5) // Top 5 actions
      .map(blocker => ({
        id: blocker.id,
        priority: blocker.severity === 'critical' ? 'critical' : blocker.severity === 'high' ? 'high' : 'medium',
        title: blocker.title,
        description: blocker.description,
        actionType: 'configure',
        deepLink: blocker.relatedStepId ? `/compliance/setup?step=${blocker.relatedStepId}` : undefined,
        estimatedMinutes: 10,
      }))

    // Add recommendations
    if (!jurisdictionReady) {
      recommendations.push('Complete jurisdiction and policy configuration')
    }
    if (!whitelistReady) {
      recommendations.push('Set up whitelist and investor eligibility')
    }
    if (!kycAMLReady) {
      recommendations.push('Configure KYC/AML providers')
    }
    if (!attestationReady) {
      recommendations.push('Provide required attestations and evidence')
    }

    return {
      overallRisk,
      readinessScore,
      isReadyForDeploy,
      blockers,
      warnings,
      recommendations,
      jurisdictionReady,
      whitelistReady,
      kycAMLReady,
      attestationReady,
      nextActions,
      estimatedTimeToReady: isReadyForDeploy ? undefined : `${blockers.length * 15} minutes`,
    }
  })

  /**
   * Submit compliance setup
   */
  const submitSetup = async (): Promise<void> => {
    const readiness = calculateReadiness.value
    
    if (!readiness.isReadyForDeploy) {
      throw new Error('Cannot submit: compliance setup has blocking issues')
    }

    isSubmitting.value = true

    try {
      // TODO: Replace with actual API call
      // await complianceSetupAPI.submit(currentForm.value)

      currentForm.value.isComplete = true
      currentForm.value.isSubmitted = true
      currentForm.value.submittedAt = new Date()
      currentForm.value.readinessAssessment = readiness
      
      saveDraft()
    } catch (error) {
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Reset store
   */
  const reset = () => {
    clearDraft()
    isLoading.value = false
    isSubmitting.value = false
    hasDraftLoaded.value = false
  }

  return {
    // State
    currentForm,
    isLoading,
    isSubmitting,
    hasDraftLoaded,

    // Computed
    currentStep,
    totalSteps,
    completedSteps,
    progressPercentage,
    calculateReadiness,

    // Actions
    loadDraft,
    saveDraft,
    clearDraft,
    goToStep,
    updateStepStatus,
    completeStep,
    setJurisdictionPolicy,
    setWhitelistEligibility,
    setKYCAMLReadiness,
    setAttestationEvidence,
    submitSetup,
    reset,
  }
})
