import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  UserComplianceState,
  UserComplianceStatus,
  KYCDocument,
  KYCDocumentType,
  ComplianceEvent,
  RemediationAction,
  IssuanceEligibility,
  AdminComplianceFilters,
  AdminComplianceListResponse,
} from '../types/compliance'

/**
 * Compliance Orchestration Store
 * 
 * Manages end-to-end KYC + AML compliance workflow for token issuance gating.
 * Provides centralized state for user compliance status, document tracking,
 * AML screening results, and issuance eligibility.
 */
export const useComplianceOrchestrationStore = defineStore('complianceOrchestration', () => {
  // Core state
  const userComplianceState = ref<UserComplianceState | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Admin state (for compliance operators)
  const adminComplianceList = ref<AdminComplianceListResponse | null>(null)
  const adminFilters = ref<AdminComplianceFilters>({})

  /**
   * Computed: Is user eligible to issue tokens?
   */
  const isEligibleForIssuance = computed(() => {
    if (!userComplianceState.value) return false
    return userComplianceState.value.canIssueTokens
  })

  /**
   * Computed: Current compliance status
   */
  const complianceStatus = computed<UserComplianceStatus>(() => {
    return userComplianceState.value?.status || 'not_started'
  })

  /**
   * Computed: Pending document uploads
   */
  const pendingDocuments = computed<KYCDocument[]>(() => {
    if (!userComplianceState.value) return []
    return userComplianceState.value.kycDocuments.filter(
      doc => doc.required && ['not_uploaded', 'rejected'].includes(doc.status)
    )
  })

  /**
   * Computed: Completed required documents
   */
  const completedDocuments = computed<KYCDocument[]>(() => {
    if (!userComplianceState.value) return []
    return userComplianceState.value.kycDocuments.filter(
      doc => doc.required && doc.status === 'approved'
    )
  })

  /**
   * Computed: Document completion percentage
   */
  const documentCompletionPercentage = computed(() => {
    if (!userComplianceState.value) return 0
    const requiredDocs = userComplianceState.value.kycDocuments.filter(doc => doc.required)
    if (requiredDocs.length === 0) return 0
    const completed = requiredDocs.filter(doc => doc.status === 'approved').length
    return Math.round((completed / requiredDocs.length) * 100)
  })

  /**
   * Computed: Active remediation actions
   */
  const activeRemediationActions = computed<RemediationAction[]>(() => {
    if (!userComplianceState.value) return []
    return userComplianceState.value.remediationActions.filter(
      action => action.priority === 'high' || action.priority === 'medium'
    )
  })

  /**
   * Computed: Recent compliance events (visible to user)
   */
  const recentEvents = computed<ComplianceEvent[]>(() => {
    if (!userComplianceState.value) return []
    return userComplianceState.value.events
      .filter(event => event.visible)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  })

  /**
   * Initialize compliance state for current user
   */
  const initializeComplianceState = async (userId: string, email: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call to backend
      // const response = await complianceOrchestrationService.getUserComplianceState(userId)
      
      // Mock implementation for now
      const mockState: UserComplianceState = {
        userId,
        email,
        status: 'not_started',
        kycDocuments: getDefaultKYCDocuments(),
        amlScreening: {
          verdict: 'not_started',
        },
        events: [],
        remediationActions: [],
        canIssueTokens: false,
        lastUpdated: new Date().toISOString(),
      }

      userComplianceState.value = mockState
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize compliance state'
      console.error('Error initializing compliance state:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get default KYC document checklist
   */
  const getDefaultKYCDocuments = (): KYCDocument[] => {
    return [
      {
        type: 'government_id',
        label: 'Government-Issued ID',
        description: 'Passport, driver\'s license, or national ID card',
        required: true,
        status: 'not_uploaded',
      },
      {
        type: 'proof_of_address',
        label: 'Proof of Address',
        description: 'Utility bill or bank statement (within 3 months)',
        required: true,
        status: 'not_uploaded',
      },
      {
        type: 'business_registration',
        label: 'Business Registration',
        description: 'Certificate of incorporation or business license',
        required: false,
        status: 'not_uploaded',
      },
      {
        type: 'tax_id',
        label: 'Tax Identification',
        description: 'Tax ID number or EIN documentation',
        required: false,
        status: 'not_uploaded',
      },
      {
        type: 'beneficial_ownership',
        label: 'Beneficial Ownership Declaration',
        description: 'UBO declaration for institutional entities',
        required: false,
        status: 'not_uploaded',
      },
    ]
  }

  /**
   * Upload KYC document
   */
  const uploadKYCDocument = async (
    documentType: KYCDocumentType,
    _file: File
  ): Promise<void> => {
    if (!userComplianceState.value) {
      throw new Error('Compliance state not initialized')
    }

    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await complianceOrchestrationService.uploadDocument(
      //   userComplianceState.value.userId,
      //   documentType,
      //   file
      // )

      // Mock update
      const docIndex = userComplianceState.value.kycDocuments.findIndex(
        doc => doc.type === documentType
      )
      
      if (docIndex !== -1) {
        userComplianceState.value.kycDocuments[docIndex].status = 'uploaded'
        userComplianceState.value.kycDocuments[docIndex].uploadedAt = new Date().toISOString()
      }

      // Add event
      const event: ComplianceEvent = {
        id: `event_${Date.now()}`,
        type: 'document_uploaded',
        timestamp: new Date().toISOString(),
        actor: 'user',
        actorId: userComplianceState.value.email,
        description: `Uploaded ${userComplianceState.value.kycDocuments[docIndex]?.label}`,
        visible: true,
      }
      userComplianceState.value.events.push(event)

      // Update status if all required docs uploaded
      await checkAndUpdateStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload document'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check and update compliance status based on current state
   */
  const checkAndUpdateStatus = async (): Promise<void> => {
    if (!userComplianceState.value) return

    const allRequiredUploaded = userComplianceState.value.kycDocuments
      .filter(doc => doc.required)
      .every(doc => doc.status !== 'not_uploaded')

    if (allRequiredUploaded && userComplianceState.value.status === 'not_started') {
      userComplianceState.value.status = 'pending_review'
    }
  }

  /**
   * Check issuance eligibility for current user
   */
  const checkIssuanceEligibility = (): IssuanceEligibility => {
    if (!userComplianceState.value) {
      return {
        eligible: false,
        status: 'not_started',
        reasons: ['Compliance state not initialized'],
        nextActions: [],
        canRetry: false,
      }
    }

    const state = userComplianceState.value
    const eligible = state.canIssueTokens
    const reasons: string[] = state.blockedReasons || []

    // Generate reasons if blocked
    if (!eligible) {
      switch (state.status) {
        case 'not_started':
          reasons.push('Compliance verification not started')
          break
        case 'pending_documents':
          reasons.push(`${pendingDocuments.value.length} required document(s) pending upload`)
          break
        case 'pending_review':
          reasons.push('Documents under review by compliance team')
          break
        case 'rejected':
          reasons.push('Compliance verification rejected - remediation required')
          break
        case 'escalated':
          reasons.push('Case escalated for manual review')
          break
        case 'blocked_by_aml':
          reasons.push('AML screening detected potential sanctions match')
          break
        case 'expired':
          reasons.push('Compliance approval expired - re-verification required')
          break
      }
    }

    return {
      eligible,
      status: state.status,
      reasons,
      nextActions: state.remediationActions,
      canRetry: ['rejected', 'expired'].includes(state.status),
    }
  }

  /**
   * Start AML screening for user
   */
  const startAMLScreening = async (): Promise<void> => {
    if (!userComplianceState.value) {
      throw new Error('Compliance state not initialized')
    }

    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await complianceOrchestrationService.startAMLScreening(
      //   userComplianceState.value.userId
      // )

      // Mock update
      userComplianceState.value.amlScreening = {
        verdict: 'in_progress',
        screenedAt: new Date().toISOString(),
        provider: 'Mock Provider',
      }

      // Add event
      const event: ComplianceEvent = {
        id: `event_${Date.now()}`,
        type: 'aml_screening_started',
        timestamp: new Date().toISOString(),
        actor: 'system',
        description: 'AML screening initiated',
        visible: true,
      }
      userComplianceState.value.events.push(event)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start AML screening'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch admin compliance list (for compliance operators)
   */
  const fetchAdminComplianceList = async (
    filters: AdminComplianceFilters = {}
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await complianceOrchestrationService.getAdminComplianceList(filters)

      // Mock implementation
      adminComplianceList.value = {
        items: [],
        total: 0,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        hasMore: false,
      }
      
      adminFilters.value = filters
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch compliance list'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset store state
   */
  const reset = () => {
    userComplianceState.value = null
    adminComplianceList.value = null
    adminFilters.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // State
    userComplianceState,
    loading,
    error,
    adminComplianceList,
    adminFilters,
    
    // Computed
    isEligibleForIssuance,
    complianceStatus,
    pendingDocuments,
    completedDocuments,
    documentCompletionPercentage,
    activeRemediationActions,
    recentEvents,
    
    // Actions
    initializeComplianceState,
    uploadKYCDocument,
    checkIssuanceEligibility,
    startAMLScreening,
    fetchAdminComplianceList,
    reset,
  }
})
