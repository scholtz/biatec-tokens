/**
 * Guided Token Launch Store
 * 
 * Manages state for the guided token launch onboarding flow.
 * Supports draft persistence, step validation, and readiness scoring.
 * 
 * Email/password authentication only - no wallet connectors.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GuidedLaunchForm,
  OrganizationProfile,
  TokenIntent,
  ComplianceReadiness,
  TokenTemplate,
  TokenEconomics,
  StepStatus,
  ValidationResult,
  ReadinessScore,
  LaunchSubmission,
  LaunchSubmissionResponse,
} from '../types/guidedLaunch'
import { launchTelemetryService } from '../services/launchTelemetry'
import {
  deriveIdempotencyKey,
  checkIdempotency,
  recordSubmissionAttempt,
  markSubmissionSuccess,
  markSubmissionFailed,
} from '../utils/issuanceIdempotency'
import { runPolicyGuardrails } from '../utils/policyGuardrails'
import {
  startLifecycleSession,
  emitLifecycleEvent,
  buildStepEnteredMeta,
  buildValidationFailedMeta,
  buildSubmissionFailedMeta,
} from '../utils/launchLifecycleObserver'

const DRAFT_STORAGE_KEY = 'biatec_guided_launch_draft'
const DRAFT_VERSION = '1.0'
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Mock token templates (TODO: Replace with backend API)
 */
const MOCK_TEMPLATES: TokenTemplate[] = [
  {
    id: 'loyalty-arc200',
    name: 'Loyalty & Rewards Token',
    description: 'Customer loyalty program with points and rewards',
    standard: 'ARC200',
    network: 'algorand_mainnet',
    useCase: 'loyalty_rewards',
    complianceLevel: 'standard',
    recommendedFor: ['B2C businesses', 'Retail', 'E-commerce'],
    features: ['Transferable', 'Fungible', 'Standard wallet support'],
  },
  {
    id: 'access-arc3',
    name: 'Access Rights NFT',
    description: 'NFT-based access rights and memberships',
    standard: 'ARC3',
    network: 'algorand_mainnet',
    useCase: 'access_rights',
    complianceLevel: 'basic',
    recommendedFor: ['SaaS', 'Events', 'Premium content'],
    features: ['Non-fungible', 'Metadata support', 'IPFS integration'],
  },
  {
    id: 'security-mica',
    name: 'MICA-Compliant Security Token',
    description: 'Regulated security token with MICA compliance',
    standard: 'ARC200',
    network: 'algorand_mainnet',
    useCase: 'asset_backed',
    complianceLevel: 'mica_compliant',
    recommendedFor: ['Real-world assets', 'Securities', 'Regulated entities'],
    features: ['MICA compliant', 'KYC/AML ready', 'Whitelist support', 'Transfer restrictions'],
  },
  {
    id: 'utility-erc20',
    name: 'Utility Token (ERC-20)',
    description: 'Standard utility token for Ethereum ecosystem',
    standard: 'ERC20',
    network: 'ethereum_mainnet',
    useCase: 'payment',
    complianceLevel: 'standard',
    recommendedFor: ['DeFi', 'DAOs', 'Platform tokens'],
    features: ['ERC-20 standard', 'Wide wallet support', 'DeFi compatible'],
  },
]

export const useGuidedLaunchStore = defineStore('guidedLaunch', () => {
  // State
  const currentForm = ref<GuidedLaunchForm>({
    createdAt: new Date(),
    lastModified: new Date(),
    currentStep: 0,
    completedSteps: [],
    isSubmitted: false,
  })

  const stepStatuses = ref<StepStatus[]>([
    { id: 'organization', title: 'Organization Profile', isComplete: false, isValid: false, isOptional: false },
    { id: 'intent', title: 'Token Intent', isComplete: false, isValid: false, isOptional: false },
    { id: 'compliance', title: 'Compliance Readiness', isComplete: false, isValid: false, isOptional: false },
    { id: 'template', title: 'Template Selection', isComplete: false, isValid: false, isOptional: false },
    { id: 'economics', title: 'Economics Settings', isComplete: false, isValid: false, isOptional: true },
    { id: 'review', title: 'Review & Submit', isComplete: false, isValid: false, isOptional: false },
  ])

  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const hasDraftLoaded = ref(false)

  // Computed
  const currentStep = computed(() => currentForm.value.currentStep)
  const totalSteps = computed(() => stepStatuses.value.length)
  const completedSteps = computed(() => stepStatuses.value.filter(s => s.isComplete).length)
  const progressPercentage = computed(() => Math.round((completedSteps.value / totalSteps.value) * 100))
  
  const readinessScore = computed<ReadinessScore>(() => {
    const requiredSteps = stepStatuses.value.filter(s => !s.isOptional)
    const requiredComplete = requiredSteps.filter(s => s.isComplete).length
    const optionalSteps = stepStatuses.value.filter(s => s.isOptional)
    const optionalComplete = optionalSteps.filter(s => s.isComplete).length

    const blockers: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    // Check for blockers
    requiredSteps.forEach(step => {
      if (!step.isComplete) {
        blockers.push(`${step.title} is required but not complete`)
      } else if (!step.isValid) {
        blockers.push(`${step.title} has validation errors`)
      }
    })

    // Check for warnings
    if (currentForm.value.complianceReadiness?.requiresMICA && !currentForm.value.complianceReadiness?.hasLegalReview) {
      warnings.push('MICA compliance requires legal review')
    }
    if (currentForm.value.complianceReadiness?.requiresKYC && !currentForm.value.complianceReadiness?.whitelistRequired) {
      warnings.push('KYC requirements typically need a whitelist')
    }

    // Add recommendations
    if (!optionalSteps[0]?.isComplete) {
      recommendations.push('Complete economics settings for better token configuration')
    }
    if (!currentForm.value.organizationProfile?.website) {
      recommendations.push('Add organization website for better credibility')
    }

    const overallScore = Math.round(
      (requiredComplete / requiredSteps.length) * 70 + // Required steps worth 70%
      (optionalComplete / Math.max(optionalSteps.length, 1)) * 20 + // Optional steps worth 20%
      (warnings.length === 0 ? 10 : 0) // No warnings worth 10%
    )

    return {
      overallScore,
      requiredStepsComplete: requiredComplete,
      totalRequiredSteps: requiredSteps.length,
      optionalStepsComplete: optionalComplete,
      totalOptionalSteps: optionalSteps.length,
      blockers,
      warnings,
      recommendations,
    }
  })

  const canSubmit = computed(() => {
    return (
      readinessScore.value.blockers.length === 0 &&
      readinessScore.value.requiredStepsComplete === readinessScore.value.totalRequiredSteps
    )
  })

  // Actions
  const initializeTelemetry = (userId: string) => {
    launchTelemetryService.initialize(userId)
    startLifecycleSession()
  }

  const startFlow = (referrer?: string, source?: string) => {
    launchTelemetryService.trackFlowStarted({ referrer, source })
    emitLifecycleEvent('session_started', { metadata: { referrer, source } })
  }

  const loadDraft = (): boolean => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!stored) return false

      const parsed = JSON.parse(stored)
      if (parsed.version !== DRAFT_VERSION) {
        console.warn('Draft version mismatch, clearing old draft')
        clearDraft()
        return false
      }

      // Restore dates
      if (parsed.form.createdAt) parsed.form.createdAt = new Date(parsed.form.createdAt)
      if (parsed.form.lastModified) parsed.form.lastModified = new Date(parsed.form.lastModified)
      
      currentForm.value = parsed.form
      stepStatuses.value = parsed.stepStatuses || stepStatuses.value
      hasDraftLoaded.value = true

      // Track draft resumed
      const daysSince = Math.floor((Date.now() - parsed.form.lastModified.getTime()) / MILLISECONDS_PER_DAY)
      launchTelemetryService.trackDraftResumed(
        parsed.form.draftId || 'unknown',
        parsed.form.lastModified,
        daysSince
      )
      emitLifecycleEvent('draft_restored', {
        draftId: parsed.form.draftId,
        metadata: { daysSince },
      })

      return true
    } catch (error) {
      console.error('Failed to load draft:', error)
      clearDraft()
      return false
    }
  }

  const saveDraft = () => {
    try {
      currentForm.value.lastModified = new Date()
      if (!currentForm.value.draftId) {
        currentForm.value.draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      }

      const toSave = {
        version: DRAFT_VERSION,
        form: currentForm.value,
        stepStatuses: stepStatuses.value,
      }

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave))

      // Track draft saved
      launchTelemetryService.trackDraftSaved(
        currentForm.value.draftId,
        completedSteps.value,
        totalSteps.value
      )
      emitLifecycleEvent('draft_saved', { draftId: currentForm.value.draftId })

      return true
    } catch (error) {
      console.error('Failed to save draft:', error)
      return false
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    currentForm.value = {
      createdAt: new Date(),
      lastModified: new Date(),
      currentStep: 0,
      completedSteps: [],
      isSubmitted: false,
    }
    stepStatuses.value.forEach(s => {
      s.isComplete = false
      s.isValid = false
    })
  }

  const setOrganizationProfile = (profile: OrganizationProfile) => {
    currentForm.value.organizationProfile = profile
    currentForm.value.lastModified = new Date()
    saveDraft()
  }

  const setTokenIntent = (intent: TokenIntent) => {
    currentForm.value.tokenIntent = intent
    currentForm.value.lastModified = new Date()
    saveDraft()
  }

  const setComplianceReadiness = (compliance: ComplianceReadiness) => {
    currentForm.value.complianceReadiness = compliance
    currentForm.value.lastModified = new Date()
    saveDraft()
  }

  const setSelectedTemplate = (template: TokenTemplate) => {
    currentForm.value.selectedTemplate = template
    currentForm.value.lastModified = new Date()
    saveDraft()
  }

  const setTokenEconomics = (economics: TokenEconomics) => {
    currentForm.value.tokenEconomics = economics
    currentForm.value.lastModified = new Date()
    saveDraft()
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps.value) {
      currentForm.value.currentStep = stepIndex
      
      // Track step navigation
      const step = stepStatuses.value[stepIndex]
      if (step) {
        launchTelemetryService.trackStepStarted(step.id, step.title, stepIndex)
        emitLifecycleEvent('step_entered', {
          draftId: currentForm.value.draftId,
          stepId: step.id,
          metadata: buildStepEnteredMeta(stepIndex, totalSteps.value, hasDraftLoaded.value),
        })
      }
      
      saveDraft()
    }
  }

  const completeStep = (stepIndex: number, validation: ValidationResult) => {
    if (stepIndex >= 0 && stepIndex < stepStatuses.value.length) {
      const step = stepStatuses.value[stepIndex]
      step.isComplete = validation.isValid
      step.isValid = validation.isValid
      step.validation = validation
      step.lastModified = new Date()

      if (!currentForm.value.completedSteps.includes(step.id)) {
        currentForm.value.completedSteps.push(step.id)
      }

      // Track completion or validation failure
      if (validation.isValid) {
        // TODO: Implement actual time tracking - store step start timestamp and calculate duration
        const timeSpentSeconds = 0
        launchTelemetryService.trackStepCompleted(step.id, step.title, stepIndex, timeSpentSeconds)
        emitLifecycleEvent('step_validated', {
          draftId: currentForm.value.draftId,
          stepId: step.id,
        })
      } else {
        launchTelemetryService.trackValidationFailed(
          step.id,
          step.title,
          validation.errors,
          validation.warnings
        )
        emitLifecycleEvent('validation_failed', {
          draftId: currentForm.value.draftId,
          stepId: step.id,
          metadata: buildValidationFailedMeta(
            // Use the first 5 words of each error as a human-readable field
            // descriptor. The errors array contains plain strings (e.g.
            // "Organization name is required") — there are no structured
            // field IDs in the current ValidationResult type.
            validation.errors.map(e => e.slice(0, 40).replace(/\s+/g, '_').toLowerCase()),
            'VALIDATION_FAILED',
          ),
        })
      }

      saveDraft()
    }
  }

  const getTemplates = (): TokenTemplate[] => {
    // TODO: Replace with backend API call
    return MOCK_TEMPLATES
  }

  const submitLaunch = async (userEmail: string): Promise<LaunchSubmissionResponse> => {
    if (!canSubmit.value) {
      throw new Error('Cannot submit: validation errors present')
    }

    if (!currentForm.value.organizationProfile || !currentForm.value.tokenIntent || 
        !currentForm.value.complianceReadiness || !currentForm.value.selectedTemplate || 
        !currentForm.value.tokenEconomics) {
      throw new Error('Cannot submit: required data missing')
    }

    // Policy guardrails: enforce network/standard compatibility, decimal precision, and naming
    // before touching the idempotency or submission state.
    // Note: symbol is not collected separately in this wizard (template.name is used); symbol
    // validation is deferred to the backend parameter review step.
    const template = currentForm.value.selectedTemplate
    const economics = currentForm.value.tokenEconomics
    const policyResult = runPolicyGuardrails({
      standard: template.standard,
      network: template.network,
      decimals: typeof economics.decimals === 'number' ? economics.decimals : null,
      supply: economics.totalSupply != null ? Number(economics.totalSupply) : null,
      name: template.name,
      // symbol intentionally omitted — not yet collected in guided wizard (deferred to backend review)
    })
    if (!policyResult.isValid) {
      const firstError = policyResult.errors[0]
      throw new Error(
        `Policy violation (${firstError.code}): ${firstError.message}. ${firstError.suggestion}`,
      )
    }

    // Idempotency guard: prevent duplicate submissions for the same draft.
    // A missing draftId is a programming error — submission must always be anchored to a draft.
    const draftId = currentForm.value.draftId
    if (!draftId) {
      throw new Error('Cannot submit: draft identity is missing (draftId required for idempotency)')
    }
    const idempotencyKey = deriveIdempotencyKey(draftId, userEmail)
    const idempotencyCheck = checkIdempotency(idempotencyKey)
    if (!idempotencyCheck.isSafeToSubmit) {
      // Return the previously-stored successful submission without re-executing
      const existing = idempotencyCheck.existingRecord
      emitLifecycleEvent('idempotency_blocked', {
        draftId,
        metadata: { existingSubmissionId: existing?.serverSubmissionId },
      })
      return {
        success: true,
        submissionId: existing?.serverSubmissionId ?? currentForm.value.submissionId ?? '',
        deploymentStatus: 'queued',
        message: 'This token launch was already submitted successfully.',
        nextSteps: [
          'Review deployment status in your dashboard',
          'Complete any remaining compliance requirements',
          'Prepare for token distribution',
        ],
        estimatedCompletionTime: '15-30 minutes',
      }
    }

    isSubmitting.value = true

    // Record attempt before network call so partial failures are tracked
    recordSubmissionAttempt(idempotencyKey, draftId)
    emitLifecycleEvent('submission_started', { draftId })

    try {
      const submission: LaunchSubmission = {
        organizationProfile: currentForm.value.organizationProfile,
        tokenIntent: currentForm.value.tokenIntent,
        complianceReadiness: currentForm.value.complianceReadiness,
        tokenTemplate: currentForm.value.selectedTemplate,
        tokenEconomics: currentForm.value.tokenEconomics,
        metadata: {
          userEmail,
          submittedAt: new Date(),
          draftId: currentForm.value.draftId,
        },
      }

      // Track submission
      launchTelemetryService.trackLaunchSubmitted({
        templateId: submission.tokenTemplate.id,
        standard: submission.tokenTemplate.standard,
        network: submission.tokenTemplate.network,
        complianceLevel: submission.tokenTemplate.complianceLevel,
        hasMICA: submission.complianceReadiness.requiresMICA,
        hasKYC: submission.complianceReadiness.requiresKYC,
      })

      // TODO: Replace with actual backend API call
      // const response = await launchAPI.submit(submission)
      
      // Mock response for now
      const mockResponse: LaunchSubmissionResponse = {
        success: true,
        submissionId: `sub_${Date.now()}`,
        tokenId: `token_${Date.now()}`,
        deploymentStatus: 'queued',
        message: 'Your token launch has been queued for deployment',
        nextSteps: [
          'Review deployment status in your dashboard',
          'Complete any remaining compliance requirements',
          'Prepare for token distribution',
        ],
        estimatedCompletionTime: '15-30 minutes',
      }

      // Persist idempotency success record to prevent duplicate re-submission
      markSubmissionSuccess(idempotencyKey, mockResponse.submissionId)

      currentForm.value.isSubmitted = true
      currentForm.value.submissionId = mockResponse.submissionId
      currentForm.value.submissionStatus = 'success'
      saveDraft()

      // Track success
      // TODO: Implement flow timing - store flow start timestamp in initializeTelemetry and calculate duration
      const timeToCompleteSeconds = 0
      launchTelemetryService.trackLaunchSuccess(
        mockResponse.submissionId,
        mockResponse.tokenId || '',
        timeToCompleteSeconds
      )
      emitLifecycleEvent('submission_succeeded', {
        draftId,
        metadata: { submissionId: mockResponse.submissionId },
      })

      return mockResponse
    } catch (error) {
      currentForm.value.submissionStatus = 'failed'
      currentForm.value.submissionError = error instanceof Error ? error.message : 'Unknown error'
      saveDraft()

      // Mark idempotency record as failed so the user can retry safely
      markSubmissionFailed(idempotencyKey, currentForm.value.submissionError)

      // Track failure
      launchTelemetryService.trackLaunchFailed(
        currentForm.value.submissionId || 'unknown',
        currentForm.value.submissionError,
        true
      )
      emitLifecycleEvent('submission_failed', {
        draftId,
        metadata: buildSubmissionFailedMeta('SUBMISSION_FAILED', true, 1),
      })

      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // State
    currentForm,
    stepStatuses,
    isLoading,
    isSubmitting,
    hasDraftLoaded,

    // Computed
    currentStep,
    totalSteps,
    completedSteps,
    progressPercentage,
    readinessScore,
    canSubmit,

    // Actions
    initializeTelemetry,
    startFlow,
    loadDraft,
    saveDraft,
    clearDraft,
    setOrganizationProfile,
    setTokenIntent,
    setComplianceReadiness,
    setSelectedTemplate,
    setTokenEconomics,
    goToStep,
    completeStep,
    getTemplates,
    submitLaunch,
  }
})
