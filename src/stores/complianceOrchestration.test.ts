import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceOrchestrationStore } from './complianceOrchestration'

describe('complianceOrchestration store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with null user compliance state', () => {
      const store = useComplianceOrchestrationStore()
      
      expect(store.userComplianceState).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should initialize compliance state for user', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user-id', 'test@example.com')
      
      expect(store.userComplianceState).not.toBeNull()
      expect(store.userComplianceState?.userId).toBe('test-user-id')
      expect(store.userComplianceState?.email).toBe('test@example.com')
      expect(store.userComplianceState?.status).toBe('not_started')
    })
  })

  describe('computed properties', () => {
    it('should compute isEligibleForIssuance correctly', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      // Initially not eligible
      expect(store.isEligibleForIssuance).toBe(false)
      
      // Set to approved status
      if (store.userComplianceState) {
        store.userComplianceState.status = 'approved'
        store.userComplianceState.canIssueTokens = true
      }
      
      expect(store.isEligibleForIssuance).toBe(true)
    })

    it('should compute complianceStatus correctly', async () => {
      const store = useComplianceOrchestrationStore()
      
      expect(store.complianceStatus).toBe('not_started')
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      expect(store.complianceStatus).toBe('not_started')
      
      if (store.userComplianceState) {
        store.userComplianceState.status = 'pending_review'
      }
      
      expect(store.complianceStatus).toBe('pending_review')
    })

    it('should compute pendingDocuments correctly', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      const pending = store.pendingDocuments
      
      // Should have required documents not uploaded
      expect(pending.length).toBeGreaterThan(0)
      expect(pending.every(doc => doc.required)).toBe(true)
      expect(pending.every(doc => ['not_uploaded', 'rejected'].includes(doc.status))).toBe(true)
    })

    it('should compute documentCompletionPercentage correctly', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      // Initially 0%
      expect(store.documentCompletionPercentage).toBe(0)
      
      // Approve first required document
      if (store.userComplianceState) {
        const firstRequired = store.userComplianceState.kycDocuments.find(doc => doc.required)
        if (firstRequired) {
          firstRequired.status = 'approved'
        }
      }
      
      // Should be > 0%
      expect(store.documentCompletionPercentage).toBeGreaterThan(0)
    })
  })

  describe('KYC document upload', () => {
    it('should upload KYC document successfully', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      await store.uploadKYCDocument('government_id', file)
      
      const governmentId = store.userComplianceState?.kycDocuments.find(
        doc => doc.type === 'government_id'
      )
      
      expect(governmentId?.status).toBe('uploaded')
      expect(governmentId?.uploadedAt).toBeDefined()
    })

    it('should add event when document is uploaded', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      await store.uploadKYCDocument('proof_of_address', file)
      
      const events = store.userComplianceState?.events || []
      const uploadEvent = events.find(e => e.type === 'document_uploaded')
      
      expect(uploadEvent).toBeDefined()
      expect(uploadEvent?.visible).toBe(true)
    })
  })

  describe('issuance eligibility check', () => {
    it('should return not eligible when state is not initialized', () => {
      const store = useComplianceOrchestrationStore()
      
      const eligibility = store.checkIssuanceEligibility()
      
      expect(eligibility.eligible).toBe(false)
      expect(eligibility.status).toBe('not_started')
      expect(eligibility.reasons.length).toBeGreaterThan(0)
    })

    it('should return eligible when status is approved', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      if (store.userComplianceState) {
        store.userComplianceState.status = 'approved'
        store.userComplianceState.canIssueTokens = true
      }
      
      const eligibility = store.checkIssuanceEligibility()
      
      expect(eligibility.eligible).toBe(true)
      expect(eligibility.reasons.length).toBe(0)
    })

    it('should return reasons when not eligible', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      const eligibility = store.checkIssuanceEligibility()
      
      expect(eligibility.eligible).toBe(false)
      expect(eligibility.reasons.length).toBeGreaterThan(0)
      expect(eligibility.reasons[0]).toContain('Compliance verification not started')
    })
  })

  describe('AML screening', () => {
    it('should start AML screening', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      await store.startAMLScreening()
      
      expect(store.userComplianceState?.amlScreening.verdict).toBe('in_progress')
      expect(store.userComplianceState?.amlScreening.screenedAt).toBeDefined()
    })

    it('should add event when AML screening starts', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      await store.startAMLScreening()
      
      const events = store.userComplianceState?.events || []
      const amlEvent = events.find(e => e.type === 'aml_screening_started')
      
      expect(amlEvent).toBeDefined()
      expect(amlEvent?.actor).toBe('system')
    })
  })

  describe('admin functionality', () => {
    it('should fetch admin compliance list', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.fetchAdminComplianceList({
        limit: 50,
        offset: 0,
      })
      
      expect(store.adminComplianceList).not.toBeNull()
      expect(store.adminComplianceList?.items).toBeDefined()
      expect(store.adminFilters.limit).toBe(50)
    })
  })

  describe('reset', () => {
    it('should reset store state', async () => {
      const store = useComplianceOrchestrationStore()
      
      await store.initializeComplianceState('test-user', 'test@example.com')
      
      expect(store.userComplianceState).not.toBeNull()
      
      store.reset()
      
      expect(store.userComplianceState).toBeNull()
      expect(store.adminComplianceList).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
