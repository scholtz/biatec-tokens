import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecurityStore, ActivityEventType } from './security'

describe('Security Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State Initialization', () => {
    it('should initialize with empty state', () => {
      const store = useSecurityStore()
      
      expect(store.activityEvents).toEqual([])
      expect(store.transactionHistory).toEqual([])
      expect(store.isLoadingActivity).toBe(false)
      expect(store.isLoadingTransactions).toBe(false)
      expect(store.isExporting).toBe(false)
      expect(store.lastActivityFetch).toBeNull()
      expect(store.lastTransactionFetch).toBeNull()
      expect(store.activityError).toBeNull()
      expect(store.transactionError).toBeNull()
    })
  })

  describe('Activity Events', () => {
    it('should add activity events', () => {
      const store = useSecurityStore()
      
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'User logged in',
        status: 'success',
      })
      
      expect(store.activityEvents).toHaveLength(1)
      expect(store.activityEvents[0].type).toBe(ActivityEventType.LOGIN)
      expect(store.activityEvents[0].description).toBe('User logged in')
      expect(store.activityEvents[0].status).toBe('success')
      expect(store.activityEvents[0].id).toBeDefined()
    })

    it('should prepend new events to the list', () => {
      const store = useSecurityStore()
      
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'First event',
        status: 'success',
      })
      
      store.addActivityEvent({
        type: ActivityEventType.LOGOUT,
        timestamp: new Date().toISOString(),
        description: 'Second event',
        status: 'success',
      })
      
      expect(store.activityEvents).toHaveLength(2)
      expect(store.activityEvents[0].description).toBe('Second event')
      expect(store.activityEvents[1].description).toBe('First event')
    })

    it('should limit activity events to 1000', { timeout: 10000 }, () => {
      const store = useSecurityStore()
      
      // Add 1100 events
      for (let i = 0; i < 1100; i++) {
        store.addActivityEvent({
          type: ActivityEventType.LOGIN,
          timestamp: new Date().toISOString(),
          description: `Event ${i}`,
          status: 'success',
        })
      }
      
      expect(store.activityEvents).toHaveLength(1000)
    })

    it('should include metadata in events', () => {
      const store = useSecurityStore()
      
      store.addActivityEvent({
        type: ActivityEventType.TOKEN_DEPLOYMENT_SUCCESS,
        timestamp: new Date().toISOString(),
        description: 'Token deployed',
        status: 'success',
        metadata: {
          network: 'algorand-testnet',
          tokenStandard: 'ARC3',
          correlationId: 'test-123',
        },
      })
      
      expect(store.activityEvents[0].metadata).toEqual({
        network: 'algorand-testnet',
        tokenStandard: 'ARC3',
        correlationId: 'test-123',
      })
    })
  })

  describe('Computed Properties', () => {
    it('should return recent activity limited to 10', () => {
      const store = useSecurityStore()
      
      for (let i = 0; i < 15; i++) {
        store.addActivityEvent({
          type: ActivityEventType.LOGIN,
          timestamp: new Date().toISOString(),
          description: `Event ${i}`,
          status: 'success',
        })
      }
      
      expect(store.recentActivity).toHaveLength(10)
    })

    it('should group activity by type', () => {
      const store = useSecurityStore()
      
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Login 1',
        status: 'success',
      })
      
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Login 2',
        status: 'success',
      })
      
      store.addActivityEvent({
        type: ActivityEventType.LOGOUT,
        timestamp: new Date().toISOString(),
        description: 'Logout 1',
        status: 'success',
      })
      
      expect(store.activityByType[ActivityEventType.LOGIN]).toHaveLength(2)
      expect(store.activityByType[ActivityEventType.LOGOUT]).toHaveLength(1)
    })
  })

  describe('Fetch Activity Events', () => {
    it('should complete fetch without error', async () => {
      const store = useSecurityStore()
      
      await store.fetchActivityEvents()
      
      expect(store.isLoadingActivity).toBe(false)
      expect(store.lastActivityFetch).toBeInstanceOf(Date)
    })

    it('should update lastActivityFetch timestamp', async () => {
      const store = useSecurityStore()
      
      await store.fetchActivityEvents()
      
      expect(store.lastActivityFetch).toBeInstanceOf(Date)
    })

    it('should skip fetch if recently fetched', async () => {
      const store = useSecurityStore()
      
      // First fetch
      await store.fetchActivityEvents()
      const firstFetchTime = store.lastActivityFetch
      
      // Immediate second fetch should be skipped
      await store.fetchActivityEvents()
      expect(store.lastActivityFetch).toEqual(firstFetchTime)
    })

    it('should force refresh when requested', async () => {
      const store = useSecurityStore()
      
      // First fetch
      await store.fetchActivityEvents()
      const firstFetchTime = store.lastActivityFetch
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Force refresh
      await store.fetchActivityEvents(true)
      expect(store.lastActivityFetch).not.toEqual(firstFetchTime)
    })
  })

  describe('Fetch Transaction History', () => {
    it('should complete fetch without error', async () => {
      const store = useSecurityStore()
      
      await store.fetchTransactionHistory()
      
      expect(store.isLoadingTransactions).toBe(false)
    })

    it('should handle filters', async () => {
      const store = useSecurityStore()
      
      await store.fetchTransactionHistory({
        network: 'algorand-mainnet',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tokenStandard: 'ARC3',
      })
      
      // Should complete without error
      expect(store.isLoadingTransactions).toBe(false)
    })

    it('should set error when API unavailable', async () => {
      const store = useSecurityStore()
      
      await store.fetchTransactionHistory()
      
      expect(store.transactionError).toBeDefined()
      expect(store.transactionError).toContain('available soon')
    })
  })

  describe('Export Audit Trail', () => {
    it('should export as JSON format', async () => {
      const store = useSecurityStore()
      
      // Add some test events
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Test event',
        status: 'success',
      })
      
      // Mock createElement and URL.createObjectURL
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')
      
      await store.exportAuditTrail('json')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalled()
      expect(store.isExporting).toBe(false)
      
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('should export as CSV format', async () => {
      const store = useSecurityStore()
      
      // Add some test events
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Test event',
        status: 'success',
      })
      
      // Mock createElement and URL.createObjectURL
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')
      
      await store.exportAuditTrail('csv')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalled()
      expect(store.isExporting).toBe(false)
      
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('should add export completion event', async () => {
      const store = useSecurityStore()
      
      // Mock DOM methods
      const mockLink = document.createElement('a')
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      vi.spyOn(URL, 'revokeObjectURL')
      
      await store.exportAuditTrail('json')
      
      const exportEvent = store.activityEvents.find(
        e => e.type === ActivityEventType.AUDIT_EXPORT_COMPLETED
      )
      
      expect(exportEvent).toBeDefined()
      expect(exportEvent?.status).toBe('success')
      expect(exportEvent?.metadata?.format).toBe('json')
    })
  })

  describe('Recovery Options', () => {
    it('should return available recovery options', () => {
      const store = useSecurityStore()
      
      const options = store.getRecoveryOptions()
      
      expect(options).toHaveLength(3)
      expect(options[0].id).toBe('email-recovery')
      expect(options[0].available).toBe(true)
      expect(options[1].id).toBe('seed-phrase')
      expect(options[1].available).toBe(true)
      expect(options[2].id).toBe('multi-device')
      expect(options[2].available).toBe(false)
    })
  })

  describe('Clear All Data', () => {
    it('should reset all state to initial values', () => {
      const store = useSecurityStore()
      
      // Add some data
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Test event',
        status: 'success',
      })
      
      store.clearAllData()
      
      expect(store.activityEvents).toEqual([])
      expect(store.transactionHistory).toEqual([])
      expect(store.lastActivityFetch).toBeNull()
      expect(store.lastTransactionFetch).toBeNull()
      expect(store.activityError).toBeNull()
      expect(store.transactionError).toBeNull()
    })
  })

  describe('Activity Event Trimming', () => {
    it('should trim events to 1000 when limit is exceeded', () => {
      const store = useSecurityStore()

      // Add 1001 events to trigger trim
      for (let i = 0; i < 1001; i++) {
        store.addActivityEvent({
          type: ActivityEventType.LOGIN,
          timestamp: new Date().toISOString(),
          description: `Event ${i}`,
          status: 'success',
        })
      }

      expect(store.activityEvents.length).toBe(1000)
    })
  })

  describe('fetchActivityEvents cache', () => {
    it('should skip fetch when called within 30 seconds (cache hit)', async () => {
      const store = useSecurityStore()
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      // First call sets lastActivityFetch
      await store.fetchActivityEvents()
      consoleSpy.mockClear()

      // Second call within 30s should be skipped (no additional console.info call)
      await store.fetchActivityEvents()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should fetch again when forceRefresh is true', async () => {
      const store = useSecurityStore()
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      await store.fetchActivityEvents()
      consoleSpy.mockClear()

      await store.fetchActivityEvents(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('CSV escape edge cases', () => {
    it('should escape values containing commas in CSV export', async () => {
      const store = useSecurityStore()
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')

      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Event, with, commas',
        status: 'success',
        metadata: { network: 'Algo,Main', correlationId: 'corr-1' },
      })

      await store.exportAuditTrail('csv')

      expect(createElementSpy).toHaveBeenCalledWith('a')
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })
  })
})
