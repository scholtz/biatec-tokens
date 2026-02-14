import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInsightsStore } from './insights'

describe('useInsightsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with default filters', () => {
      const store = useInsightsStore()
      
      expect(store.filters).toEqual({
        timeframe: '30d',
        networks: [],
        tokenIds: [],
        walletSegment: 'all',
      })
    })

    it('should load saved filters from localStorage', () => {
      const savedFilters = {
        timeframe: '7d' as const,
        networks: ['algorand'],
        tokenIds: ['token-1'],
        walletSegment: 'whales' as const,
      }
      localStorage.setItem('biatec_insights_filters', JSON.stringify(savedFilters))

      const store = useInsightsStore()
      store.loadFiltersFromStorage()

      expect(store.filters).toEqual(savedFilters)
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('biatec_insights_filters', 'invalid-json')

      const store = useInsightsStore()
      store.loadFiltersFromStorage()

      // Should fall back to default filters
      expect(store.filters.timeframe).toBe('30d')
    })
  })

  describe('filter management', () => {
    it('should update filters correctly', () => {
      const store = useInsightsStore()
      
      store.updateFilters({
        networks: ['algorand', 'ethereum'],
        walletSegment: 'institutional',
      })

      expect(store.filters.networks).toEqual(['algorand', 'ethereum'])
      expect(store.filters.walletSegment).toBe('institutional')
      expect(store.filters.timeframe).toBe('30d') // Unchanged
    })

    it('should reset filters to defaults', () => {
      const store = useInsightsStore()
      
      store.updateFilters({
        networks: ['algorand'],
        tokenIds: ['token-1'],
        walletSegment: 'whales',
      })

      store.resetFilters()

      expect(store.filters).toEqual({
        timeframe: '30d',
        networks: [],
        tokenIds: [],
        walletSegment: 'all',
      })
    })

    it('should save filters to localStorage', () => {
      const store = useInsightsStore()
      
      store.updateFilters({
        timeframe: '90d',
        networks: ['algorand'],
      })

      const saved = localStorage.getItem('biatec_insights_filters')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.timeframe).toBe('90d')
      expect(parsed.networks).toEqual(['algorand'])
    })
  })

  describe('computed properties', () => {
    it('should calculate hasActiveFilters correctly', () => {
      const store = useInsightsStore()
      
      expect(store.hasActiveFilters).toBe(false)

      store.updateFilters({ networks: ['algorand'] })
      expect(store.hasActiveFilters).toBe(true)

      store.resetFilters()
      expect(store.hasActiveFilters).toBe(false)

      store.updateFilters({ walletSegment: 'whales' })
      expect(store.hasActiveFilters).toBe(true)
    })

    it('should calculate activeFilterCount correctly', () => {
      const store = useInsightsStore()
      
      expect(store.activeFilterCount).toBe(0)

      store.updateFilters({ networks: ['algorand'] })
      expect(store.activeFilterCount).toBe(1)

      store.updateFilters({ tokenIds: ['token-1'] })
      expect(store.activeFilterCount).toBe(2)

      store.updateFilters({ walletSegment: 'institutional' })
      expect(store.activeFilterCount).toBe(3)
    })

    it('should filter core metrics correctly', async () => {
      const store = useInsightsStore()
      
      // Trigger metrics fetch to populate mock data
      await store.fetchMetrics()

      const coreMetrics = store.coreMetrics
      expect(coreMetrics.length).toBe(5)
      
      const metricIds = coreMetrics.map(m => m.id)
      expect(metricIds).toContain('adoption')
      expect(metricIds).toContain('retention')
      expect(metricIds).toContain('txQuality')
      expect(metricIds).toContain('liquidityHealth')
      expect(metricIds).toContain('concentrationRisk')
    })
  })

  describe('data fetching', () => {
    it('should fetch metrics and update state', async () => {
      const store = useInsightsStore()
      
      expect(store.loading).toBe(false)
      expect(store.metrics.length).toBe(0)

      await store.fetchMetrics()

      expect(store.loading).toBe(false)
      expect(store.metrics.length).toBeGreaterThan(0)
      expect(store.error).toBeNull()
    })

    it('should fetch trend data for specific metric', async () => {
      const store = useInsightsStore()
      
      await store.fetchTrendData('adoption')

      expect(store.trendData['adoption']).toBeDefined()
      expect(store.trendData['adoption'].length).toBeGreaterThan(0)
    })

    it('should fetch benchmarks', async () => {
      const store = useInsightsStore()
      
      await store.fetchBenchmarks()

      expect(store.benchmarks.length).toBeGreaterThan(0)
      expect(store.benchmarks[0]).toHaveProperty('id')
      expect(store.benchmarks[0]).toHaveProperty('name')
      expect(store.benchmarks[0]).toHaveProperty('metrics')
    })
  })

  describe('scenario planning', () => {
    it('should run scenario and calculate outputs', async () => {
      const store = useInsightsStore()
      
      const inputs = {
        campaignLift: 15,
        liquidityContribution: 10000,
        retentionChange: 5,
      }

      await store.runScenario(inputs)

      expect(store.scenarioInputs).toEqual(inputs)
      expect(store.scenarioOutputs).toBeDefined()
      expect(store.scenarioOutputs!.projectedAdoption).toBeGreaterThan(0)
      expect(store.scenarioOutputs!.confidenceRange).toHaveProperty('low')
      expect(store.scenarioOutputs!.confidenceRange).toHaveProperty('high')
    })

    it('should calculate scenario with positive campaign lift', async () => {
      const store = useInsightsStore()
      
      await store.runScenario({
        campaignLift: 20,
        liquidityContribution: 0,
        retentionChange: 0,
      })

      // Should increase adoption by approximately 20%
      expect(store.scenarioOutputs!.projectedAdoption).toBeGreaterThan(1247)
      expect(store.scenarioOutputs!.projectedAdoption).toBeLessThan(1247 * 1.25)
    })
  })

  describe('data export', () => {
    it('should export data as JSON', async () => {
      const store = useInsightsStore()
      await store.fetchMetrics()
      
      // Mock URL.createObjectURL and document methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()
      const mockClick = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      
      document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      })) as any
      document.body.appendChild = mockAppendChild
      document.body.removeChild = mockRemoveChild

      store.exportData('json')

      expect(mockClick).toHaveBeenCalled()
    })

    it('should export data as CSV', async () => {
      const store = useInsightsStore()
      await store.fetchMetrics()
      
      // Mock URL.createObjectURL and document methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()
      const mockClick = vi.fn()
      
      document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      })) as any

      store.exportData('csv')

      expect(mockClick).toHaveBeenCalled()
    })
  })

  describe('mock data generation', () => {
    it('should generate correct number of trend data points based on timeframe', async () => {
      const store = useInsightsStore()
      
      store.updateFilters({ timeframe: '7d' })
      await store.fetchTrendData('adoption')
      expect(store.trendData['adoption'].length).toBe(8) // 7 days + today

      store.updateFilters({ timeframe: '30d' })
      await store.fetchTrendData('retention')
      expect(store.trendData['retention'].length).toBe(31) // 30 days + today
    })

    it('should generate valid metric structure', async () => {
      const store = useInsightsStore()
      await store.fetchMetrics()

      const metric = store.metrics[0]
      expect(metric).toHaveProperty('id')
      expect(metric).toHaveProperty('label')
      expect(metric).toHaveProperty('value')
      expect(metric).toHaveProperty('change')
      expect(metric).toHaveProperty('trend')
      expect(metric).toHaveProperty('definition')
      expect(metric).toHaveProperty('timestamp')
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const store = useInsightsStore()
      
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      // Should not throw
      expect(() => {
        store.updateFilters({ networks: ['algorand'] })
      }).not.toThrow()

      // Restore
      Storage.prototype.setItem = originalSetItem
    })
  })
})
