import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenComplianceStore } from './tokenCompliance'

describe('Token Compliance Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with empty compliance data', () => {
      const store = useTokenComplianceStore()
      expect(store.complianceData).toEqual({})
    })

    it('should load existing data from localStorage', () => {
      const mockData = {
        'token-1': {
          tokenId: 'token-1',
          checklist: [
            { id: 'whitepaper', label: 'Token whitepaper published', completed: true }
          ],
          lastUpdated: new Date().toISOString()
        }
      }
      localStorage.setItem('biatec_token_compliance', JSON.stringify(mockData))

      setActivePinia(createPinia())
      const store = useTokenComplianceStore()

      expect(store.complianceData['token-1']).toBeDefined()
      expect(store.complianceData['token-1'].tokenId).toBe('token-1')
      expect(store.complianceData['token-1'].checklist[0].completed).toBe(true)
    })
  })

  describe('Get Token Compliance', () => {
    it('should create default checklist for new token', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      expect(compliance.tokenId).toBe('token-1')
      expect(compliance.checklist.length).toBeGreaterThan(0)
      expect(compliance.checklist.every(item => !item.completed)).toBe(true)
      expect(compliance.lastUpdated).toBeInstanceOf(Date)
    })

    it('should return existing compliance data', () => {
      const store = useTokenComplianceStore()
      const compliance1 = store.getTokenCompliance('token-1')
      compliance1.checklist[0].completed = true

      const compliance2 = store.getTokenCompliance('token-1')
      expect(compliance2.checklist[0].completed).toBe(true)
    })
  })

  describe('Toggle Checklist Item', () => {
    it('should toggle item completion status', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')
      const itemId = compliance.checklist[0].id

      expect(compliance.checklist[0].completed).toBe(false)

      store.toggleChecklistItem('token-1', itemId)
      expect(compliance.checklist[0].completed).toBe(true)

      store.toggleChecklistItem('token-1', itemId)
      expect(compliance.checklist[0].completed).toBe(false)
    })

    it('should update lastUpdated timestamp', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')
      const itemId = compliance.checklist[0].id
      const initialDate = compliance.lastUpdated

      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      store.toggleChecklistItem('token-1', itemId)
      expect(compliance.lastUpdated.getTime()).toBeGreaterThan(initialDate.getTime())

      vi.useRealTimers()
    })

    it('should persist changes to localStorage', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')
      const itemId = compliance.checklist[0].id

      store.toggleChecklistItem('token-1', itemId)

      const stored = localStorage.getItem('biatec_token_compliance')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed['token-1'].checklist[0].completed).toBe(true)
    })
  })

  describe('Get Completion Percentage', () => {
    it('should return 0 for new token', () => {
      const store = useTokenComplianceStore()
      const percentage = store.getCompletionPercentage('token-1')
      expect(percentage).toBe(0)
    })

    it('should calculate correct percentage', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')
      const total = compliance.checklist.length

      // Complete 2 items
      store.toggleChecklistItem('token-1', compliance.checklist[0].id)
      store.toggleChecklistItem('token-1', compliance.checklist[1].id)

      const expectedPercentage = Math.round((2 / total) * 100)
      const percentage = store.getCompletionPercentage('token-1')
      expect(percentage).toBe(expectedPercentage)
    })

    it('should return 100 when all items completed', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete all items
      compliance.checklist.forEach(item => {
        store.toggleChecklistItem('token-1', item.id)
      })

      const percentage = store.getCompletionPercentage('token-1')
      expect(percentage).toBe(100)
    })
  })

  describe('Get Readiness Status', () => {
    it('should return "Incomplete" for 0-39% completion', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete 0 items (0%)
      let status = store.getReadinessStatus('token-1')
      expect(status).toBe('Incomplete')

      // Complete 1 item (20% with 5 items)
      store.toggleChecklistItem('token-1', compliance.checklist[0].id)
      status = store.getReadinessStatus('token-1')
      expect(status).toBe('Incomplete')
    })

    it('should return "At Risk" for 40-79% completion', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete 2 items (40% with 5 items)
      store.toggleChecklistItem('token-1', compliance.checklist[0].id)
      store.toggleChecklistItem('token-1', compliance.checklist[1].id)

      const status = store.getReadinessStatus('token-1')
      expect(status).toBe('At Risk')
    })

    it('should return "Ready" for 80-100% completion', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete 4 items (80% with 5 items)
      store.toggleChecklistItem('token-1', compliance.checklist[0].id)
      store.toggleChecklistItem('token-1', compliance.checklist[1].id)
      store.toggleChecklistItem('token-1', compliance.checklist[2].id)
      store.toggleChecklistItem('token-1', compliance.checklist[3].id)

      const status = store.getReadinessStatus('token-1')
      expect(status).toBe('Ready')
    })

    it('should return "Ready" for 100% completion', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete all items
      compliance.checklist.forEach(item => {
        store.toggleChecklistItem('token-1', item.id)
      })

      const status = store.getReadinessStatus('token-1')
      expect(status).toBe('Ready')
    })
  })

  describe('Get Readiness Badge Variant', () => {
    it('should return correct badge variant for each status', () => {
      const store = useTokenComplianceStore()

      expect(store.getReadinessBadgeVariant('Ready')).toBe('success')
      expect(store.getReadinessBadgeVariant('At Risk')).toBe('warning')
      expect(store.getReadinessBadgeVariant('Incomplete')).toBe('error')
    })
  })

  describe('Reset Token Compliance', () => {
    it('should reset all checklist items', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')

      // Complete some items
      store.toggleChecklistItem('token-1', compliance.checklist[0].id)
      store.toggleChecklistItem('token-1', compliance.checklist[1].id)

      expect(compliance.checklist[0].completed).toBe(true)
      expect(compliance.checklist[1].completed).toBe(true)

      store.resetTokenCompliance('token-1')

      expect(compliance.checklist[0].completed).toBe(false)
      expect(compliance.checklist[1].completed).toBe(false)
      expect(compliance.checklist.every(item => !item.completed)).toBe(true)
    })

    it('should update lastUpdated timestamp', () => {
      const store = useTokenComplianceStore()
      const compliance = store.getTokenCompliance('token-1')
      const initialDate = compliance.lastUpdated

      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      store.resetTokenCompliance('token-1')
      expect(compliance.lastUpdated.getTime()).toBeGreaterThan(initialDate.getTime())

      vi.useRealTimers()
    })
  })

  describe('Delete Token Compliance', () => {
    it('should delete compliance data for a token', () => {
      const store = useTokenComplianceStore()
      store.getTokenCompliance('token-1')

      expect(store.complianceData['token-1']).toBeDefined()

      store.deleteTokenCompliance('token-1')

      expect(store.complianceData['token-1']).toBeUndefined()
    })

    it('should persist deletion to localStorage', () => {
      const store = useTokenComplianceStore()
      store.getTokenCompliance('token-1')
      store.deleteTokenCompliance('token-1')

      const stored = localStorage.getItem('biatec_token_compliance')
      const parsed = JSON.parse(stored!)
      expect(parsed['token-1']).toBeUndefined()
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should persist state across store instances', () => {
      const store1 = useTokenComplianceStore()
      const compliance = store1.getTokenCompliance('token-1')
      store1.toggleChecklistItem('token-1', compliance.checklist[0].id)

      // Create new pinia instance (simulating app reload)
      setActivePinia(createPinia())
      const store2 = useTokenComplianceStore()

      const reloadedCompliance = store2.getTokenCompliance('token-1')
      expect(reloadedCompliance.checklist[0].completed).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('biatec_token_compliance', 'invalid-json-{')

      const store = useTokenComplianceStore()
      expect(store.complianceData).toEqual({})
    })
  })

  describe('Multiple Tokens', () => {
    it('should maintain separate compliance data for multiple tokens', () => {
      const store = useTokenComplianceStore()

      const compliance1 = store.getTokenCompliance('token-1')
      const compliance2 = store.getTokenCompliance('token-2')

      // Complete all items for token-1 to make it "Ready"
      compliance1.checklist.forEach(item => {
        store.toggleChecklistItem('token-1', item.id)
      })

      expect(compliance1.checklist.every(item => item.completed)).toBe(true)
      expect(compliance2.checklist.every(item => !item.completed)).toBe(true)

      expect(store.getReadinessStatus('token-1')).toBe('Ready')
      expect(store.getReadinessStatus('token-2')).toBe('Incomplete')
      expect(store.getReadinessStatus('token-1')).not.toBe(store.getReadinessStatus('token-2'))
    })
  })
})
