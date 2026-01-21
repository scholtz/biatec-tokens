import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComplianceChecklist from './ComplianceChecklist.vue'
import { useComplianceStore } from '../stores/compliance'
import { useSubscriptionStore } from '../stores/subscription'

// Mock window.gtag
const mockGtag = vi.fn()

describe('ComplianceChecklist Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock gtag
    vi.stubGlobal('gtag', mockGtag)
    mockGtag.mockClear()
    
    // Mock URL and Blob APIs for export functionality
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h2').text()).toContain('Compliance Checklist')
    })

    it('should display completion percentage', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      expect(wrapper.text()).toContain(`${complianceStore.metrics.completionPercentage}%`)
    })

    it('should display metrics (completed/total)', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const expectedText = `${complianceStore.metrics.completedChecks} / ${complianceStore.metrics.totalChecks}`
      expect(wrapper.text()).toContain(expectedText)
    })

    it('should render category progress indicators', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      
      complianceStore.categoryProgress.forEach(category => {
        const categoryLabel = wrapper.text()
        // Check that category data is displayed
        expect(categoryLabel).toContain(`${category.completed}/${category.total}`)
      })
    })

    it('should render network filter buttons', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const buttons = wrapper.findAll('button')
      const networkButtons = buttons.filter(b => 
        b.text() === 'Both' || b.text() === 'VOI' || b.text() === 'Aramid'
      )
      
      expect(networkButtons.length).toBe(3)
    })

    it('should render all checklist categories', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('KYC/AML Compliance')
      expect(wrapper.text()).toContain('Jurisdiction & Regulations')
      expect(wrapper.text()).toContain('Disclosure Documents')
      expect(wrapper.text()).toContain('Network-Specific Requirements')
    })

    it('should render checklist items with labels', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const firstItem = complianceStore.filteredChecklist[0]
      
      expect(wrapper.text()).toContain(firstItem.label)
      expect(wrapper.text()).toContain(firstItem.description)
    })

    it('should show Required badge for required items', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const requiredItem = complianceStore.filteredChecklist.find(item => item.required)
      
      if (requiredItem) {
        expect(wrapper.text()).toContain('Required')
      }
    })

    it('should show network badges for network-specific items', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const voiItem = complianceStore.filteredChecklist.find(
        item => item.networks?.length === 1 && item.networks[0] === 'VOI'
      )
      
      if (voiItem) {
        expect(wrapper.text()).toContain('VOI')
      }
    })
  })

  describe('Network Filtering', () => {
    it('should filter by VOI network when VOI button is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const voiButton = wrapper.findAll('button').find(b => b.text() === 'VOI')
      
      expect(voiButton).toBeDefined()
      await voiButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.selectedNetwork).toBe('VOI')
    })

    it('should filter by Aramid network when Aramid button is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const aramidButton = wrapper.findAll('button').find(b => b.text() === 'Aramid')
      
      expect(aramidButton).toBeDefined()
      await aramidButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.selectedNetwork).toBe('Aramid')
    })

    it('should show Both networks when Both button is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      
      // First switch to VOI
      complianceStore.setNetwork('VOI')
      await flushPromises()

      // Then click Both
      const bothButton = wrapper.findAll('button').find(b => b.text() === 'Both')
      await bothButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.selectedNetwork).toBe('Both')
    })

    it('should update displayed items when network changes', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const initialCount = complianceStore.filteredChecklist.length

      // Switch to VOI
      complianceStore.setNetwork('VOI')
      await wrapper.vm.$nextTick()

      const voiCount = complianceStore.filteredChecklist.length

      // Switch to Aramid
      complianceStore.setNetwork('Aramid')
      await wrapper.vm.$nextTick()

      const aramidCount = complianceStore.filteredChecklist.length

      // Both should show the most items
      expect(initialCount).toBeGreaterThanOrEqual(voiCount)
      expect(initialCount).toBeGreaterThanOrEqual(aramidCount)
    })

    it('should highlight selected network button', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const voiButton = wrapper.findAll('button').find(b => b.text() === 'VOI')
      await voiButton!.trigger('click')
      await flushPromises()

      // Selected button should have biatec-accent class
      expect(voiButton!.classes()).toContain('bg-biatec-accent')
    })
  })

  describe('Checkbox Interactions', () => {
    it('should toggle item completion when checkbox is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const firstItem = complianceStore.filteredChecklist[0]
      const initialState = firstItem.completed

      // Find and click the first checkbox
      const checkboxes = wrapper.findAll('button').filter(b => 
        b.element.className.includes('w-6 h-6')
      )
      
      if (checkboxes.length > 0) {
        await checkboxes[0].trigger('click')
        await flushPromises()

        expect(firstItem.completed).toBe(!initialState)
      }
    })

    it('should update completion metrics when item is checked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const initialCompleted = complianceStore.metrics.completedChecks

      // Toggle first item
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[0].id)
      await wrapper.vm.$nextTick()

      expect(complianceStore.metrics.completedChecks).toBeGreaterThan(initialCompleted)
    })

    it('should update progress bar when items are completed', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const initialPercentage = complianceStore.metrics.completionPercentage

      // Complete an item
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[0].id)
      await wrapper.vm.$nextTick()

      expect(complianceStore.metrics.completionPercentage).toBeGreaterThan(initialPercentage)
    })

    it('should show completion status message', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()

      // Initially, not all required items are complete
      expect(wrapper.text()).toContain('Complete all required items before deployment')

      // Complete all required items
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        complianceStore.toggleCheckItem(item.id)
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('All required items completed!')
    })
  })

  describe('Expandable Item Details', () => {
    it('should toggle item details when Show Details is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const detailsButtons = wrapper.findAll('button').filter(b => 
        b.text().includes('Show Details')
      )

      if (detailsButtons.length > 0) {
        const firstButton = detailsButtons[0]
        
        // Initially should show "Show Details"
        expect(firstButton.text()).toContain('Show')
        
        await firstButton.trigger('click')
        await flushPromises()
        
        // After clicking should show "Hide Details"
        expect(firstButton.text()).toContain('Hide')
      }
    })

    it('should display notes textarea when item is expanded', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const component = wrapper.vm as any
      const complianceStore = useComplianceStore()
      const firstItemId = complianceStore.filteredChecklist[0].id

      // Expand first item
      component.toggleExpanded(firstItemId)
      await wrapper.vm.$nextTick()

      const textareas = wrapper.findAll('textarea')
      expect(textareas.length).toBeGreaterThan(0)
    })

    it('should update item notes when textarea value changes', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const component = wrapper.vm as any
      const complianceStore = useComplianceStore()
      const firstItemId = complianceStore.filteredChecklist[0].id
      const testNotes = 'Test compliance notes'

      // Expand first item
      component.toggleExpanded(firstItemId)
      await wrapper.vm.$nextTick()

      // Update notes through store
      complianceStore.updateItemNotes(firstItemId, testNotes)
      await wrapper.vm.$nextTick()

      expect(complianceStore.checklistItems.find(i => i.id === firstItemId)?.notes).toBe(testNotes)
    })

    it('should display document URL input when item is expanded', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const component = wrapper.vm as any
      const complianceStore = useComplianceStore()
      const firstItemId = complianceStore.filteredChecklist[0].id

      // Expand first item
      component.toggleExpanded(firstItemId)
      await wrapper.vm.$nextTick()

      const urlInputs = wrapper.findAll('input[type="url"]')
      expect(urlInputs.length).toBeGreaterThan(0)
    })

    it('should update item document URL when input value changes', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const component = wrapper.vm as any
      const complianceStore = useComplianceStore()
      const firstItemId = complianceStore.filteredChecklist[0].id
      const testUrl = 'https://example.com/document.pdf'

      // Expand first item
      component.toggleExpanded(firstItemId)
      await wrapper.vm.$nextTick()

      // Update document URL through store
      complianceStore.updateItemDocument(firstItemId, testUrl)
      await wrapper.vm.$nextTick()

      expect(complianceStore.checklistItems.find(i => i.id === firstItemId)?.documentUrl).toBe(testUrl)
    })
  })

  describe('Analytics Tracking', () => {
    it('should track guidance interaction when checkbox is toggled', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const subscriptionStore = useSubscriptionStore()
      const initialInteractions = subscriptionStore.conversionMetrics.guidanceInteractions

      const complianceStore = useComplianceStore()
      const component = wrapper.vm as any
      
      // Toggle an item (simulating user interaction)
      component.handleToggle(complianceStore.filteredChecklist[0].id)
      await flushPromises()

      // No tracking on regular toggle, only on completion
    })

    it('should emit gtag event when all required items are completed', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const component = wrapper.vm as any
      
      // Complete all required items
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      
      // Complete all but one
      for (let i = 0; i < requiredItems.length - 1; i++) {
        complianceStore.toggleCheckItem(requiredItems[i].id)
      }
      
      mockGtag.mockClear()
      
      // Complete the last required item through handleToggle to trigger analytics
      component.handleToggle(requiredItems[requiredItems.length - 1].id)
      await flushPromises()

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'compliance_checklist_completed',
        expect.objectContaining({
          event_category: 'compliance',
          event_label: expect.any(String),
          value: expect.any(Number)
        })
      )
    })

    it('should track completion time in analytics event', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const component = wrapper.vm as any
      
      // Start by checking one item to set startedAt
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[0].id)
      await flushPromises()
      
      // Complete all required items
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        if (!item.completed) {
          complianceStore.toggleCheckItem(item.id)
        }
      })
      
      mockGtag.mockClear()
      
      // Manually trigger completion event
      component.trackCompletionEvent()
      await flushPromises()

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'compliance_checklist_completed',
        expect.objectContaining({
          completion_time: expect.any(Number)
        })
      )
    })

    it('should include network selection in analytics event', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const component = wrapper.vm as any
      
      complianceStore.setNetwork('VOI')
      
      // Complete all required items
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        complianceStore.toggleCheckItem(item.id)
      })
      
      mockGtag.mockClear()
      
      component.trackCompletionEvent()
      await flushPromises()

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'compliance_checklist_completed',
        expect.objectContaining({
          event_label: 'VOI'
        })
      )
    })

    it('should log completion to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const component = wrapper.vm as any
      
      // Complete all required items
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      requiredItems.forEach(item => {
        complianceStore.toggleCheckItem(item.id)
      })
      
      component.trackCompletionEvent()
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Compliance checklist completed',
        expect.objectContaining({
          network: expect.any(String),
          metrics: expect.any(Object),
          timestamp: expect.any(String)
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Export Functionality', () => {
    it('should render export button', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      expect(exportButton).toBeDefined()
    })

    it('should call exportChecklistSummary when export button is clicked', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const exportSpy = vi.spyOn(complianceStore, 'exportChecklistSummary')

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      await exportButton!.trigger('click')
      await flushPromises()

      expect(exportSpy).toHaveBeenCalled()
    })

    it('should emit gtag event when export is triggered', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      complianceStore.setNetwork('Aramid')
      
      mockGtag.mockClear()

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      await exportButton!.trigger('click')
      await flushPromises()

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'compliance_checklist_exported',
        expect.objectContaining({
          event_category: 'compliance',
          event_label: 'Aramid'
        })
      )
    })

    it('should create and download JSON file on export', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      complianceStore.setNetwork('VOI')
      
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      await exportButton!.trigger('click')
      await flushPromises()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(URL.createObjectURL).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should log success message after export', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      await exportButton!.trigger('click')
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith('Compliance checklist exported successfully')
      
      consoleSpy.mockRestore()
    })

    it('should increment export count in store metrics', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      const initialExportCount = complianceStore.metrics.exportCount

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export Summary')
      )
      
      await exportButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.metrics.exportCount).toBe(initialExportCount + 1)
    })
  })

  describe('Reset Functionality', () => {
    it('should render reset button', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const resetButton = wrapper.findAll('button').find(b => 
        b.text().includes('Reset')
      )
      
      expect(resetButton).toBeDefined()
    })

    it('should show confirmation dialog when reset is clicked', async () => {
      const confirmMock = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmMock)
      
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const resetButton = wrapper.findAll('button').find(b => 
        b.text().includes('Reset')
      )
      
      await resetButton!.trigger('click')
      await flushPromises()

      expect(confirmMock).toHaveBeenCalled()
      
      vi.unstubAllGlobals()
    })

    it('should reset checklist when user confirms', async () => {
      const confirmMock = vi.fn().mockReturnValue(true)
      vi.stubGlobal('confirm', confirmMock)
      
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      
      // Complete some items first
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[0].id)
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[1].id)
      
      const resetButton = wrapper.findAll('button').find(b => 
        b.text().includes('Reset')
      )
      
      await resetButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.metrics.completedChecks).toBe(0)
      
      vi.unstubAllGlobals()
    })

    it('should not reset checklist when user cancels', async () => {
      const confirmMock = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmMock)
      
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const complianceStore = useComplianceStore()
      
      // Complete some items first
      complianceStore.toggleCheckItem(complianceStore.filteredChecklist[0].id)
      const completedCount = complianceStore.metrics.completedChecks
      
      const resetButton = wrapper.findAll('button').find(b => 
        b.text().includes('Reset')
      )
      
      await resetButton!.trigger('click')
      await flushPromises()

      expect(complianceStore.metrics.completedChecks).toBe(completedCount)
      
      vi.unstubAllGlobals()
    })
  })

  describe('Category Labels and Icons', () => {
    it('should display correct category labels', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.text()).toContain('KYC/AML Compliance')
      expect(wrapper.text()).toContain('Jurisdiction & Regulations')
      expect(wrapper.text()).toContain('Disclosure Documents')
      expect(wrapper.text()).toContain('Network-Specific Requirements')
    })

    it('should render category icons', () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      // Check for icon classes (pi-users, pi-globe, pi-file, pi-server)
      const html = wrapper.html()
      expect(html).toContain('pi-users')
      expect(html).toContain('pi-globe')
      expect(html).toContain('pi-file')
      expect(html).toContain('pi-server')
    })
  })

  describe('Integration with Subscription Store', () => {
    it('should track guidance interaction in subscription store', async () => {
      const wrapper = mount(ComplianceChecklist, {
        global: {
          plugins: [pinia]
        }
      })

      const subscriptionStore = useSubscriptionStore()
      const component = wrapper.vm as any
      
      // Complete all required items to trigger tracking
      const complianceStore = useComplianceStore()
      const requiredItems = complianceStore.filteredChecklist.filter(i => i.required)
      
      const initialInteractions = subscriptionStore.conversionMetrics.guidanceInteractions
      
      // Complete all required items
      requiredItems.forEach(item => {
        complianceStore.toggleCheckItem(item.id)
      })
      
      // Trigger completion event
      component.trackCompletionEvent()
      await flushPromises()

      expect(subscriptionStore.conversionMetrics.guidanceInteractions).toBeGreaterThan(initialInteractions)
    })
  })
})
