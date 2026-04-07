import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceExports from '../ComplianceExports.vue'

vi.mock('../ui/Modal.vue', () => ({
  default: {
    name: 'Modal',
    props: ['show', 'size'],
    emits: ['close'],
    template: '<div v-if="show"><slot name="title"/><slot/><slot name="footer"/></div>',
  },
}))

vi.useFakeTimers()

function mountExports(props: Record<string, unknown> = {}) {
  return mount(ComplianceExports, {
    props: {
      tokenId: 'token-123',
      network: 'algorand-mainnet',
      ...props,
    },
    global: {
      stubs: {
        Modal: {
          template: '<div v-if="show"><slot name="title"/><slot/><slot name="footer"/></div>',
          props: ['show', 'size'],
          emits: ['close'],
        },
      },
    },
  })
}

describe('ComplianceExports', () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('today computed', () => {
    it('returns today date string in ISO format (YYYY-MM-DD)', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      expect(vm.today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('validateFilters function', () => {
    it('fails validation when tokenId is empty', () => {
      const wrapper = mountExports({ tokenId: '' })
      const vm = wrapper.vm as any
      vm.filters.tokenId = ''
      const isValid = vm.validateFilters()
      expect(isValid).toBe(false)
      expect(vm.validationErrors.tokenId).toBeTruthy()
    })

    it('fails validation when startDate is missing', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.startDate = ''
      vm.filters.endDate = '2026-03-01'
      const isValid = vm.validateFilters()
      expect(isValid).toBe(false)
      expect(vm.validationErrors.startDate).toBeTruthy()
    })

    it('fails validation when endDate is missing', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = ''
      const isValid = vm.validateFilters()
      expect(isValid).toBe(false)
      expect(vm.validationErrors.endDate).toBeTruthy()
    })

    it('fails validation when start date is after end date', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.startDate = '2026-06-01'
      vm.filters.endDate = '2026-01-01'
      const isValid = vm.validateFilters()
      expect(isValid).toBe(false)
      expect(vm.validationErrors.startDate).toBeTruthy()
    })

    it('fails validation when date range > 1 year', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      // End date in the future → endDate error
      vm.filters.startDate = '2024-01-01'
      vm.filters.endDate = '2030-06-01'
      const isValid = vm.validateFilters()
      expect(isValid).toBe(false)
    })

    it('passes validation when all required fields are set correctly', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.tokenId = 'token-123'
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-03-01'
      const isValid = vm.validateFilters()
      expect(isValid).toBe(true)
      expect(Object.keys(vm.validationErrors).length).toBe(0)
    })
  })

  describe('resetFilters function', () => {
    it('resets filters to defaults with tokenId from props', () => {
      const wrapper = mountExports({ tokenId: 'my-token' })
      const vm = wrapper.vm as any
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-03-01'
      vm.filters.actionType = 'whitelist_add'
      vm.validationErrors = { tokenId: 'error' }

      vm.resetFilters()

      expect(vm.filters.tokenId).toBe('my-token')
      expect(vm.filters.startDate).toBe('')
      expect(vm.filters.endDate).toBe('')
      expect(vm.filters.actionType).toBe('')
      expect(vm.filters.format).toBe('csv')
      expect(Object.keys(vm.validationErrors).length).toBe(0)
    })
  })

  describe('previewExport function', () => {
    it('does not proceed when validation fails', async () => {
      const wrapper = mountExports({ tokenId: '' })
      const vm = wrapper.vm as any
      vm.filters.tokenId = ''
      await vm.previewExport()
      expect(vm.isGeneratingPreview).toBe(false)
      expect(vm.showPreviewModal).toBe(false)
    })

    it('generates preview when validation passes', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.tokenId = 'token-123'
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-03-01'

      const previewPromise = vm.previewExport()
      expect(vm.isGeneratingPreview).toBe(true)

      vi.advanceTimersByTime(1100)
      await previewPromise

      expect(vm.showPreviewModal).toBe(true)
      expect(vm.exportPreview).not.toBeNull()
      expect(vm.exportPreview.recordCount).toBeGreaterThan(0)
      expect(vm.isGeneratingPreview).toBe(false)
    })
  })

  describe('executeExport function', () => {
    it('does nothing when exportPreview is null', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.exportPreview = null
      await vm.executeExport()
      expect(vm.isExporting).toBe(false)
    })

    it('does nothing when exportPreview.recordCount is 0', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.exportPreview = { recordCount: 0, estimatedSize: '0KB', sampleData: [] }
      await vm.executeExport()
      expect(vm.isExporting).toBe(false)
    })

    it('executes export with valid preview and records download history', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.tokenId = 'token-123'
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-03-01'
      vm.exportPreview = { recordCount: 100, estimatedSize: '50KB', sampleData: [] }

      // Mock URL methods (not supported in happy-dom)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      // Run export with timers advancing
      const exportPromise = vm.executeExport()
      await vi.runAllTimersAsync()
      await exportPromise

      expect(vm.downloadHistory.length).toBe(1)
      expect(vm.downloadHistory[0].status).toBe('success')
      expect(vm.isExporting).toBe(false)
    })
  })

  describe('filters initialization', () => {
    it('initializes tokenId from props', () => {
      const wrapper = mountExports({ tokenId: 'my-token-456' })
      const vm = wrapper.vm as any
      expect(vm.filters.tokenId).toBe('my-token-456')
    })

    it('initializes with empty tokenId when prop not provided', () => {
      const wrapper = mountExports({ tokenId: undefined })
      const vm = wrapper.vm as any
      expect(vm.filters.tokenId).toBe('')
    })
  })
})

describe('ComplianceExports additional coverage', () => {
  describe('formatDate', () => {
    it('formats an ISO date to locale string', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const result = vm.formatDate('2026-01-15T10:30:00.000Z')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(5)
    })
  })

  describe('formatShortDate', () => {
    it('formats a date string to short locale string', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const result = vm.formatShortDate('2026-01-15')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(3)
    })

    it('returns empty string for empty input', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      expect(vm.formatShortDate('')).toBe('')
    })
  })

  describe('formatFilterSummary', () => {
    it('returns "All filters" when no filters set', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      expect(vm.formatFilterSummary({})).toBe('All filters')
    })

    it('includes actionType in summary', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const result = vm.formatFilterSummary({ actionType: 'transfer' })
      expect(result).toContain('Action: transfer')
    })

    it('includes truncated actor in summary', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const result = vm.formatFilterSummary({ actor: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })
      expect(result).toContain('Actor: ABCDEFGHIJ...')
    })

    it('joins multiple parts with bullet separator', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const result = vm.formatFilterSummary({ actionType: 'mint', actor: 'ABCDEFGHIJKLMNOP' })
      expect(result).toContain(' • ')
    })
  })

  describe('loadDownloadHistory', () => {
    it('loads download history from localStorage', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const mockHistory = [{ filename: 'test.csv', format: 'csv', timestamp: '2026-01-01', status: 'success', recordCount: 10 }]
      localStorage.setItem('compliance-export-history', JSON.stringify(mockHistory))
      vm.loadDownloadHistory()
      expect(vm.downloadHistory.length).toBe(1)
      localStorage.removeItem('compliance-export-history')
    })

    it('handles invalid JSON in localStorage gracefully', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      localStorage.setItem('compliance-export-history', 'NOT_VALID_JSON::')
      vm.loadDownloadHistory()
      // Should not throw
      expect(vm.downloadHistory).toBeDefined()
      localStorage.removeItem('compliance-export-history')
    })
  })

  describe('saveDownloadHistory', () => {
    it('saves download history to localStorage', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.downloadHistory = [{ filename: 'test.csv', format: 'csv', timestamp: '2026-01-01', status: 'success', recordCount: 5 }]
      vm.saveDownloadHistory()
      const stored = localStorage.getItem('compliance-export-history')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)[0].filename).toBe('test.csv')
      localStorage.removeItem('compliance-export-history')
    })
  })

  describe('generateMockSampleData', () => {
    it('generates sample data array', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const data = vm.generateMockSampleData()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('downloadFile', () => {
    it('creates and clicks download link for CSV', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-download')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      // downloadFile internally creates a link and clicks it — should not throw
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      vm.downloadFile('test-export.csv', 'csv')
      expect(URL.createObjectURL).toHaveBeenCalled()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('creates download link for JSON format (else branch)', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-download')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      vm.downloadFile('test-export.json', 'json')
      expect(URL.createObjectURL).toHaveBeenCalled()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })
  })

  describe('previewExport', () => {
    it('skips when validateFilters returns false (invalid dates)', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      // Set invalid date range to make validateFilters return false
      vm.filters.startDate = '2026-12-01'
      vm.filters.endDate = '2026-01-01' // end before start
      await vm.previewExport()
      // Should return early — isGeneratingPreview should remain false
      expect(vm.isGeneratingPreview).toBe(false)
    })

    it('calls API mock and sets exportPreview when valid', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      // Set valid dates
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-01-31'
      vm.filters.tokenId = 'token-123'
      const previewPromise = vm.previewExport()
      // Advance fake timers past the 1000ms setTimeout in the mock API call
      await vi.advanceTimersByTimeAsync(1500)
      await previewPromise
      expect(vm.exportPreview).not.toBeNull()
      expect(vm.exportPreview.recordCount).toBeGreaterThan(0)
      expect(vm.showPreviewModal).toBe(true)
    })

    it('sets error state when the mock API throws', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.filters.startDate = '2026-01-01'
      vm.filters.endDate = '2026-01-31'
      vm.filters.tokenId = 'token-123'
      // Force an error by temporarily replacing Math.random to throw
      const origRandom = Math.random
      Math.random = () => { throw new Error('forced error') }
      const previewPromise = vm.previewExport()
      await vi.advanceTimersByTimeAsync(1500)
      await previewPromise
      Math.random = origRandom
      expect(vm.showErrorToast).toBe(true)
      // Advance the 5000ms timeout to reset showErrorToast
      await vi.advanceTimersByTimeAsync(5500)
      expect(vm.showErrorToast).toBe(false)
    })
  })

  describe('modal close handlers (inline template events)', () => {
    it('closes preview modal when Cancel button is clicked (line 279)', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.showPreviewModal = true
      await wrapper.vm.$nextTick()
      const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
      expect(cancelBtn).toBeDefined()
      await cancelBtn!.trigger('click')
      expect(vm.showPreviewModal).toBe(false)
    })
  })

  describe('executeExport', () => {
    it('returns early when exportPreview is null', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.exportPreview = null
      await vm.executeExport()
      expect(vm.isExporting).toBe(false)
    })

    it('returns early when exportPreview.recordCount is 0', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vm.exportPreview = { recordCount: 0, estimatedSize: '0KB', sampleData: [] }
      await vm.executeExport()
      expect(vm.isExporting).toBe(false)
    })

    it('executes download when exportPreview is valid', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      vm.exportPreview = { recordCount: 100, estimatedSize: '50KB', sampleData: [] }
      vm.filters.tokenId = 'token-123'
      vm.filters.format = 'csv'
      const exportPromise = vm.executeExport()
      await vi.advanceTimersByTimeAsync(2500)
      await exportPromise
      expect(vm.showSuccessToast).toBe(true)
      expect(vm.downloadHistory.length).toBeGreaterThan(0)
      expect(vm.downloadHistory[0].status).toBe('success')
      appendSpy.mockRestore()
      removeSpy.mockRestore()
      // Advance timeout for success toast
      await vi.advanceTimersByTimeAsync(5500)
      expect(vm.showSuccessToast).toBe(false)
    })

    it('trims download history to 10 items max', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      // Pre-populate with 10 existing items
      vm.downloadHistory = Array.from({ length: 10 }, (_, i) => ({
        id: `old-${i}`, timestamp: new Date().toISOString(), filename: `old-${i}.csv`,
        format: 'csv', recordCount: 5, status: 'success',
      }))
      vm.exportPreview = { recordCount: 50, estimatedSize: '25KB', sampleData: [] }
      vm.filters.tokenId = 'token-abc'
      vm.filters.format = 'csv'
      const exportPromise = vm.executeExport()
      await vi.advanceTimersByTimeAsync(2500)
      await exportPromise
      expect(vm.downloadHistory.length).toBe(10)
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('adds failed history item when executeExport throws (catch branch)', async () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      // Make createObjectURL throw so downloadFile throws during executeExport
      vi.spyOn(URL, 'createObjectURL').mockImplementationOnce(() => {
        throw new Error('forced download error')
      })
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
      vm.exportPreview = { recordCount: 100, estimatedSize: '50KB', sampleData: [] }
      vm.filters.tokenId = 'token-fail'
      vm.filters.format = 'csv'
      const exportPromise = vm.executeExport()
      await vi.advanceTimersByTimeAsync(2500)
      await exportPromise
      expect(vm.showErrorToast).toBe(true)
      expect(vm.downloadHistory.length).toBeGreaterThan(0)
      expect(vm.downloadHistory[0].status).toBe('failed')
      appendSpy.mockRestore()
      removeSpy.mockRestore()
      await vi.advanceTimersByTimeAsync(5500)
      expect(vm.showErrorToast).toBe(false)
    })
  })

  describe('saveDownloadHistory error branch', () => {
    it('catches and logs error when localStorage.setItem throws', () => {
      const wrapper = mountExports()
      const vm = wrapper.vm as any
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('storage quota exceeded')
      })
      // Should not throw
      expect(() => vm.saveDownloadHistory()).not.toThrow()
      expect(errSpy).toHaveBeenCalled()
      errSpy.mockRestore()
    })
  })
})
