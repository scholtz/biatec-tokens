import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TelemetryService } from '../services/TelemetryService'

export type OnboardingStepStatus = 'not_started' | 'in_progress' | 'needs_action' | 'completed'

export interface OnboardingError {
  message: string
  remediation?: string
  code?: string
}

export interface OnboardingStep {
  id: string
  order: number
  title: string
  description: string
  guidance: string
  complianceInfo?: string
  status: OnboardingStepStatus
  owner?: string
  completedAt?: string
  completedBy?: string
  error?: OnboardingError
}

export interface OnboardingActivity {
  id: string
  message: string
  actor: string
  timestamp: string
  type: 'started' | 'completed' | 'failed' | 'updated'
  stepId?: string
}

export interface EnterpriseOnboardingState {
  steps: OnboardingStep[]
  activities: OnboardingActivity[]
  isInitialized: boolean
  lastSyncedAt: string | null
}

const STORAGE_KEY = 'biatec_enterprise_onboarding_state'

export const useEnterpriseOnboardingStore = defineStore('enterpriseOnboarding', () => {
  const telemetry = TelemetryService.getInstance()

  // State
  const state = ref<EnterpriseOnboardingState>({
    steps: [],
    activities: [],
    isInitialized: false,
    lastSyncedAt: null,
  })

  // Computed
  const steps = computed(() => state.value.steps)
  const recentActivities = computed(() => 
    state.value.activities.slice(0, 20).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  )
  const completedStepsCount = computed(() => 
    state.value.steps.filter(s => s.status === 'completed').length
  )
  const isOnboardingComplete = computed(() => 
    state.value.steps.every(s => s.status === 'completed')
  )

  // Actions
  const initialize = async () => {
    // Load from localStorage first
    loadFromStorage()

    // Initialize default steps if not already initialized
    if (state.value.steps.length === 0) {
      state.value.steps = createDefaultSteps()
    }

    // In production, this would sync with backend API
    // For now, we'll use mock data and localStorage
    state.value.isInitialized = true
    state.value.lastSyncedAt = new Date().toISOString()
    
    persist()

    // Track initialization
    telemetry.track('enterprise_onboarding_initialized', {
      steps_count: state.value.steps.length,
      completed_steps: completedStepsCount.value,
    })
  }

  const createDefaultSteps = (): OnboardingStep[] => {
    return [
      {
        id: 'organization-profile',
        order: 1,
        title: 'Create Organization Profile',
        description: 'Provide basic information about your company including legal name, jurisdiction, and business structure.',
        guidance: 'This information is required for regulatory compliance. Ensure all details match your official company registration documents.',
        complianceInfo: 'Required under MICA Article 17 - Asset-referenced tokens must have clear issuer identification.',
        status: 'not_started',
      },
      {
        id: 'upload-documents',
        order: 2,
        title: 'Upload Corporate Documents',
        description: 'Upload required documents such as articles of incorporation, business licenses, and proof of address.',
        guidance: 'Accepted formats: PDF, PNG, JPG. Maximum file size: 10MB per document. All documents must be recent (within 6 months).',
        complianceInfo: 'Document verification is essential for KYC/AML compliance and regulatory reporting.',
        status: 'not_started',
      },
      {
        id: 'identify-signatories',
        order: 3,
        title: 'Identify Authorized Signatories',
        description: 'Designate individuals authorized to approve token issuance and manage compliance requirements.',
        guidance: 'Signatories must be officers or directors with legal authority. Identity verification will be required.',
        complianceInfo: 'MICA requires clear identification of persons responsible for token issuance decisions.',
        status: 'not_started',
      },
      {
        id: 'verify-compliance-profile',
        order: 4,
        title: 'Verify Compliance Profile',
        description: 'Complete compliance questionnaire and undergo automated regulatory checks.',
        guidance: 'This step includes sanctions screening, jurisdiction verification, and risk assessment. Processing typically takes 24-48 hours.',
        complianceInfo: 'Automated compliance checks ensure your organization meets baseline regulatory requirements.',
        status: 'not_started',
      },
      {
        id: 'configure-token-parameters',
        order: 5,
        title: 'Configure Token Issuance Parameters',
        description: 'Define token properties including supply, transferability rules, and compliance constraints.',
        guidance: 'Choose parameters carefully as some cannot be changed after deployment. Consider regulatory requirements for your jurisdiction.',
        complianceInfo: 'Token parameters must align with your intended use case and regulatory classification.',
        status: 'not_started',
      },
      {
        id: 'review-terms',
        order: 6,
        title: 'Review and Accept Terms',
        description: 'Review platform terms of service, compliance responsibilities, and liability disclaimers.',
        guidance: 'Ensure you understand your ongoing compliance obligations. Legal review is recommended for enterprise deployments.',
        complianceInfo: 'Platform terms define responsibilities for regulatory compliance and reporting.',
        status: 'not_started',
      },
      {
        id: 'request-issuance',
        order: 7,
        title: 'Request Token Issuance',
        description: 'Submit your token issuance request for final review and blockchain deployment.',
        guidance: 'Once submitted, your request will be reviewed by our compliance team. Approval typically takes 2-5 business days.',
        complianceInfo: 'Final review ensures all regulatory requirements are met before blockchain deployment.',
        status: 'not_started',
      },
    ]
  }

  const updateStepStatus = (stepId: string, status: OnboardingStepStatus, error?: OnboardingError) => {
    const step = state.value.steps.find(s => s.id === stepId)
    if (!step) return

    const previousStatus = step.status
    step.status = status
    step.error = error

    if (status === 'completed' && !step.completedAt) {
      step.completedAt = new Date().toISOString()
      // In production, this would come from the backend
      step.completedBy = 'Current User'

      // Add activity
      addActivity({
        message: `Completed: ${step.title}`,
        type: 'completed',
        stepId: step.id,
      })

      // Track completion
      telemetry.track('onboarding_step_completed', {
        step_id: step.id,
        step_title: step.title,
        step_order: step.order,
      })
    } else if (status === 'needs_action' && error) {
      // Add activity
      addActivity({
        message: `Action required for: ${step.title}`,
        type: 'failed',
        stepId: step.id,
      })

      // Track failure
      telemetry.track('onboarding_step_failed', {
        step_id: step.id,
        step_title: step.title,
        error_message: error.message,
        error_code: error.code,
      })
    } else if (status === 'in_progress' && previousStatus === 'not_started') {
      // Add activity
      addActivity({
        message: `Started: ${step.title}`,
        type: 'started',
        stepId: step.id,
      })

      // Track start
      telemetry.track('onboarding_step_started', {
        step_id: step.id,
        step_title: step.title,
        step_order: step.order,
      })
    }

    persist()

    // In production, this would sync with backend API
    syncWithBackend()
  }

  const addActivity = (activity: Omit<OnboardingActivity, 'id' | 'timestamp' | 'actor'>) => {
    const newActivity: OnboardingActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actor: 'Current User', // In production, this would be the actual user name
      timestamp: new Date().toISOString(),
    }

    state.value.activities.unshift(newActivity)

    // Keep only last 50 activities
    if (state.value.activities.length > 50) {
      state.value.activities = state.value.activities.slice(0, 50)
    }

    persist()
  }

  const syncWithBackend = async () => {
    // In production, this would make an API call to sync state
    // For now, we just update the last synced timestamp
    state.value.lastSyncedAt = new Date().toISOString()
    persist()
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        state.value = { ...state.value, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load onboarding state from storage:', error)
    }
  }

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    } catch (error) {
      console.error('Failed to persist onboarding state:', error)
    }
  }

  const resetOnboarding = () => {
    state.value = {
      steps: createDefaultSteps(),
      activities: [],
      isInitialized: false,
      lastSyncedAt: null,
    }
    persist()

    // Track reset
    telemetry.track('enterprise_onboarding_reset', {})
  }

  const completeOnboarding = () => {
    // Mark all steps as completed
    state.value.steps.forEach(step => {
      if (step.status !== 'completed') {
        updateStepStatus(step.id, 'completed')
      }
    })

    // Add final activity
    addActivity({
      message: 'Enterprise onboarding completed successfully',
      type: 'completed',
    })

    // Track completion
    telemetry.track('enterprise_onboarding_completed', {
      total_steps: state.value.steps.length,
      duration_days: calculateOnboardingDuration(),
    })

    persist()
  }

  const calculateOnboardingDuration = (): number => {
    const firstActivity = state.value.activities[state.value.activities.length - 1]
    if (!firstActivity) return 0

    const start = new Date(firstActivity.timestamp)
    const end = new Date()
    const diffMs = end.getTime() - start.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  return {
    // State
    state,
    
    // Computed
    steps,
    recentActivities,
    completedStepsCount,
    isOnboardingComplete,
    
    // Actions
    initialize,
    updateStepStatus,
    addActivity,
    syncWithBackend,
    resetOnboarding,
    completeOnboarding,
    loadFromStorage,
    persist,
  }
})
