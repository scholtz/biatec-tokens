import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceStore } from './compliance'

describe('Compliance Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initialization', () => {
    it('should initialize with default checklist items', () => {
      const store = useComplianceStore()
      
      expect(store.checklistItems.length).toBeGreaterThan(0)
      expect(store.selectedNetwork).toBe('Both')
      expect(store.metrics.completionPercentage).toBe(0)
    })

    it('should have items in all categories', () => {
      const store = useComplianceStore()
      
      const kycItems = store.checklistItems.filter(i => i.category === 'kyc-aml')
      const jurisdictionItems = store.checklistItems.filter(i => i.category === 'jurisdiction')
      const disclosureItems = store.checklistItems.filter(i => i.category === 'disclosure')
      const networkItems = store.checklistItems.filter(i => i.category === 'network-specific')
      
      expect(kycItems.length).toBeGreaterThan(0)
      expect(jurisdictionItems.length).toBeGreaterThan(0)
      expect(disclosureItems.length).toBeGreaterThan(0)
      expect(networkItems.length).toBeGreaterThan(0)
    })

    it('should have both required and optional items', () => {
      const store = useComplianceStore()
      
      const requiredItems = store.checklistItems.filter(i => i.required)
      const optionalItems = store.checklistItems.filter(i => !i.required)
      
      expect(requiredItems.length).toBeGreaterThan(0)
      expect(optionalItems.length).toBeGreaterThan(0)
    })
  })

  describe('Network Filtering', () => {
    it('should filter items by VOI network', () => {
      const store = useComplianceStore()
      
      store.setNetwork('VOI')
      
      expect(store.selectedNetwork).toBe('VOI')
      const filtered = store.filteredChecklist
      
      // Should include VOI-specific and Both network items
      filtered.forEach(item => {
        if (item.networks) {
          expect(
            item.networks.includes('VOI') || item.networks.includes('Both')
          ).toBe(true)
        }
      })
    })

    it('should filter items by Aramid network', () => {
      const store = useComplianceStore()
      
      store.setNetwork('Aramid')
      
      expect(store.selectedNetwork).toBe('Aramid')
      const filtered = store.filteredChecklist
      
      // Should include Aramid-specific and Both network items
      filtered.forEach(item => {
        if (item.networks) {
          expect(
            item.networks.includes('Aramid') || item.networks.includes('Both')
          ).toBe(true)
        }
      })
    })

    it('should show all items when network is Both', () => {
      const store = useComplianceStore()
      
      store.setNetwork('Both')
      
      expect(store.filteredChecklist.length).toBe(store.checklistItems.length)
    })
  })

  describe('Checklist Interactions', () => {
    it('should toggle item completion', () => {
      const store = useComplianceStore()
      
      const item = store.checklistItems[0]
      const initialState = item.completed
      
      store.toggleCheckItem(item.id)
      
      expect(item.completed).toBe(!initialState)
      
      store.toggleCheckItem(item.id)
      
      expect(item.completed).toBe(initialState)
    })

    it('should update item notes', () => {
      const store = useComplianceStore()
      
      const item = store.checklistItems[0]
      const testNotes = 'Test compliance notes'
      
      store.updateItemNotes(item.id, testNotes)
      
      expect(item.notes).toBe(testNotes)
    })

    it('should update item document URL', () => {
      const store = useComplianceStore()
      
      const item = store.checklistItems[0]
      const testUrl = 'https://example.com/document.pdf'
      
      store.updateItemDocument(item.id, testUrl)
      
      expect(item.documentUrl).toBe(testUrl)
    })

    it('should track checklist start time', () => {
      const store = useComplianceStore()
      
      expect(store.checklistStartedAt).toBeNull()
      
      const item = store.checklistItems[0]
      store.toggleCheckItem(item.id)
      
      expect(store.checklistStartedAt).not.toBeNull()
      expect(store.checklistStartedAt).toBeInstanceOf(Date)
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate completion percentage', () => {
      const store = useComplianceStore()
      
      expect(store.metrics.completionPercentage).toBe(0)
      
      // Complete first item
      store.toggleCheckItem(store.filteredChecklist[0].id)
      
      const expectedPercentage = Math.round((1 / store.filteredChecklist.length) * 100)
      expect(store.metrics.completionPercentage).toBe(expectedPercentage)
    })

    it('should track completed vs total checks', () => {
      const store = useComplianceStore()
      
      expect(store.metrics.completedChecks).toBe(0)
      expect(store.metrics.totalChecks).toBe(store.filteredChecklist.length)
      
      store.toggleCheckItem(store.filteredChecklist[0].id)
      store.toggleCheckItem(store.filteredChecklist[1].id)
      
      expect(store.metrics.completedChecks).toBe(2)
    })

    it('should calculate category progress', () => {
      const store = useComplianceStore()
      
      const categoryProgress = store.categoryProgress
      
      expect(categoryProgress.length).toBe(4) // 4 categories
      
      categoryProgress.forEach(cat => {
        expect(cat.category).toBeDefined()
        expect(cat.total).toBeGreaterThanOrEqual(0)
        expect(cat.completed).toBeGreaterThanOrEqual(0)
        expect(cat.percentage).toBeGreaterThanOrEqual(0)
        expect(cat.percentage).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('Required Items Completion', () => {
    it('should track required items completion', () => {
      const store = useComplianceStore()
      
      expect(store.requiredItemsComplete).toBe(false)
      
      // Complete all required items
      const requiredItems = store.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        store.toggleCheckItem(item.id)
      })
      
      expect(store.requiredItemsComplete).toBe(true)
    })

    it('should mark completion timestamp when all required items done', () => {
      const store = useComplianceStore()
      
      expect(store.checklistCompletedAt).toBeNull()
      
      // Complete all required items
      const requiredItems = store.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        store.toggleCheckItem(item.id)
      })
      
      expect(store.checklistCompletedAt).not.toBeNull()
      expect(store.checklistCompletedAt).toBeInstanceOf(Date)
    })

    it('should reset completion timestamp if required item unchecked', () => {
      const store = useComplianceStore()
      
      // Complete all required items
      const requiredItems = store.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        store.toggleCheckItem(item.id)
      })
      
      expect(store.checklistCompletedAt).not.toBeNull()
      
      // Uncheck one required item
      store.toggleCheckItem(requiredItems[0].id)
      
      expect(store.checklistCompletedAt).toBeNull()
    })
  })

  describe('Export Functionality', () => {
    it('should export checklist summary', () => {
      const store = useComplianceStore()
      
      const initialExportCount = store.metrics.exportCount
      
      const summary = store.exportChecklistSummary()
      
      expect(summary).toBeDefined()
      expect(summary.exportDate).toBeDefined()
      expect(summary.network).toBe(store.selectedNetwork)
      expect(summary.metrics).toBeDefined()
      expect(summary.categoryProgress).toBeDefined()
      expect(summary.checklist).toBeInstanceOf(Array)
      expect(store.metrics.exportCount).toBe(initialExportCount + 1)
    })

    it('should include all checklist items in export', () => {
      const store = useComplianceStore()
      
      const summary = store.exportChecklistSummary()
      
      expect(summary.checklist.length).toBe(store.filteredChecklist.length)
      
      summary.checklist.forEach(item => {
        expect(item.id).toBeDefined()
        expect(item.category).toBeDefined()
        expect(item.label).toBeDefined()
        expect(item.description).toBeDefined()
        expect(typeof item.required).toBe('boolean')
        expect(typeof item.completed).toBe('boolean')
      })
    })

    it('should include completion status in export', () => {
      const store = useComplianceStore()
      
      // Complete some items
      store.toggleCheckItem(store.filteredChecklist[0].id)
      store.toggleCheckItem(store.filteredChecklist[1].id)
      
      const summary = store.exportChecklistSummary()
      
      expect(summary.allRequiredComplete).toBeDefined()
      expect(typeof summary.allRequiredComplete).toBe('boolean')
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all checklist items', () => {
      const store = useComplianceStore()
      
      // Complete and modify some items
      store.toggleCheckItem(store.checklistItems[0].id)
      store.toggleCheckItem(store.checklistItems[1].id)
      store.updateItemNotes(store.checklistItems[0].id, 'Test notes')
      store.updateItemDocument(store.checklistItems[1].id, 'https://test.com')
      
      store.resetChecklist()
      
      // All items should be unchecked and cleared
      store.checklistItems.forEach(item => {
        expect(item.completed).toBe(false)
        expect(item.notes).toBeUndefined()
        expect(item.documentUrl).toBeUndefined()
      })
    })

    it('should reset timestamps', () => {
      const store = useComplianceStore()
      
      // Trigger timestamps
      store.toggleCheckItem(store.checklistItems[0].id)
      
      expect(store.checklistStartedAt).not.toBeNull()
      
      store.resetChecklist()
      
      expect(store.checklistStartedAt).toBeNull()
      expect(store.checklistCompletedAt).toBeNull()
    })
  })

  describe('MICA Compliance', () => {
    it('should include MICA-specific items', () => {
      const store = useComplianceStore()
      
      const micaItems = store.checklistItems.filter(item => 
        item.label.toLowerCase().includes('mica') ||
        item.description.toLowerCase().includes('mica')
      )
      
      expect(micaItems.length).toBeGreaterThan(0)
    })

    it('should include KYC/AML requirements', () => {
      const store = useComplianceStore()
      
      const kycAmlItems = store.checklistItems.filter(item => item.category === 'kyc-aml')
      
      expect(kycAmlItems.length).toBeGreaterThan(2)
      
      const kycItem = kycAmlItems.find(i => i.label.includes('KYC'))
      const amlItem = kycAmlItems.find(i => i.label.includes('AML'))
      
      expect(kycItem).toBeDefined()
      expect(amlItem).toBeDefined()
    })

    it('should include disclosure requirements', () => {
      const store = useComplianceStore()
      
      const disclosureItems = store.checklistItems.filter(item => item.category === 'disclosure')
      
      expect(disclosureItems.length).toBeGreaterThan(3)
      
      const whitepaperItem = disclosureItems.find(i => i.label.includes('Whitepaper'))
      const riskItem = disclosureItems.find(i => i.label.includes('Risk'))
      
      expect(whitepaperItem).toBeDefined()
      expect(riskItem).toBeDefined()
    })
  })

  describe('Network-Specific Requirements', () => {
    it('should have VOI-specific requirements', () => {
      const store = useComplianceStore()
      
      const voiItems = store.checklistItems.filter(item => 
        item.networks?.includes('VOI') && !item.networks.includes('Both')
      )
      
      expect(voiItems.length).toBeGreaterThan(0)
    })

    it('should have Aramid-specific requirements', () => {
      const store = useComplianceStore()
      
      const aramidItems = store.checklistItems.filter(item => 
        item.networks?.includes('Aramid') && !item.networks.includes('Both')
      )
      
      expect(aramidItems.length).toBeGreaterThan(0)
    })

    it('should filter correctly by network selection', () => {
      const store = useComplianceStore()
      
      store.setNetwork('VOI')
      const voiFiltered = store.filteredChecklist.length
      
      store.setNetwork('Aramid')
      const aramidFiltered = store.filteredChecklist.length
      
      store.setNetwork('Both')
      const bothFiltered = store.filteredChecklist.length
      
      // Both should show the most items
      expect(bothFiltered).toBeGreaterThanOrEqual(voiFiltered)
      expect(bothFiltered).toBeGreaterThanOrEqual(aramidFiltered)
    })
  })

  describe('Edge cases — uncovered branches', () => {
    it('should return 0 completionPercentage when no items match filter (total = 0)', () => {
      // Use a network that filters to zero items by using a non-existing scenario
      // We achieve this by mocking filteredChecklist to be empty via setting a specific network
      // The easiest way: override checklistItems to be empty
      const store = useComplianceStore()
      // @ts-expect-error internal state manipulation for coverage
      store.$patch({ checklistItems: [] })
      expect(store.metrics.completionPercentage).toBe(0)
    })

    it('should reset completedAt when required item unchecked after completion (else if branch)', () => {
      const store = useComplianceStore()
      // Complete ALL required items so checklistCompletedAt is set
      const requiredItems = store.filteredChecklist.filter(i => i.required)
      for (const item of requiredItems) {
        store.toggleCheckItem(item.id)
      }
      expect(store.metrics.completedAt).not.toBeNull()

      // Now uncheck one required item — should reset completedAt
      store.toggleCheckItem(requiredItems[0].id)
      expect(store.metrics.completedAt).toBeNull()
    })

    it('should not update notes when item id does not exist', () => {
      const store = useComplianceStore()
      // Should not throw; nothing changes
      expect(() => store.updateItemNotes('non-existent-id', 'notes')).not.toThrow()
    })

    it('should not update document URL when item id does not exist', () => {
      const store = useComplianceStore()
      expect(() => store.updateItemDocument('non-existent-id', 'https://example.com')).not.toThrow()
    })

    it('should not advance checklistStartedAt on second check (already set branch)', () => {
      const store = useComplianceStore()
      const items = store.filteredChecklist
      // Check first item → starts the clock
      store.toggleCheckItem(items[0].id)
      const firstStartedAt = store.checklistStartedAt
      // Check second item → clock should NOT change
      store.toggleCheckItem(items[1].id)
      expect(store.checklistStartedAt).toBe(firstStartedAt)
    })
  })
})
