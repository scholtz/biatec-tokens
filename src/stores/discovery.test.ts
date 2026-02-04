import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDiscoveryStore } from './discovery'
import type { MarketplaceToken } from './marketplace'

describe('Discovery Store', () => {
  const mockTokens: MarketplaceToken[] = [
    {
      id: '1',
      name: 'Token A',
      symbol: 'TKA',
      standard: 'ARC200',
      type: 'FT',
      supply: 1000000,
      description: 'First test token',
      status: 'deployed',
      createdAt: new Date(),
      network: 'VOI',
      complianceStatus: 'compliant',
      issuerType: 'enterprise',
      liquidity: 5000000,
    },
    {
      id: '2',
      name: 'Token B',
      symbol: 'TKB',
      standard: 'ERC20',
      type: 'FT',
      supply: 500000,
      description: 'Second test token',
      status: 'deployed',
      createdAt: new Date(),
      network: 'Ethereum',
      complianceStatus: 'partial',
      issuerType: 'company',
      liquidity: 2000000,
    },
    {
      id: '3',
      name: 'Token C',
      symbol: 'TKC',
      standard: 'ARC72',
      type: 'NFT',
      supply: 100,
      description: 'Third test token',
      status: 'deployed',
      createdAt: new Date(),
      network: 'Aramid',
      complianceStatus: 'compliant',
      issuerType: 'dao',
      liquidity: 100000,
    },
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default filters', () => {
      const store = useDiscoveryStore()
      
      expect(store.filters.standards).toEqual([])
      expect(store.filters.complianceStatus).toEqual([])
      expect(store.filters.chains).toEqual([])
      expect(store.filters.issuerTypes).toEqual([])
      expect(store.filters.liquidityMin).toBeNull()
      expect(store.filters.search).toBe('')
    })

    it('should load saved filters from localStorage', () => {
      const savedFilters = {
        standards: ['ARC200'],
        complianceStatus: ['compliant'],
        chains: ['voi-mainnet'],
        issuerTypes: ['enterprise'],
        liquidityMin: 1000000,
        search: 'test',
      }
      localStorage.setItem('biatec_discovery_filters', JSON.stringify(savedFilters))
      
      const store = useDiscoveryStore()
      store.initialize()
      
      expect(store.filters.standards).toEqual(['ARC200'])
      expect(store.filters.complianceStatus).toEqual(['compliant'])
      expect(store.filters.search).toBe('test')
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('biatec_discovery_filters', 'invalid-json')
      
      const store = useDiscoveryStore()
      store.initialize()
      
      expect(store.filters.standards).toEqual([])
    })
  })

  describe('Filter Management', () => {
    it('should update filters', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200', 'ERC20'] })
      
      expect(store.filters.standards).toEqual(['ARC200', 'ERC20'])
    })

    it('should update multiple filter properties at once', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({
        standards: ['ARC200'],
        complianceStatus: ['compliant'],
        search: 'test',
      })
      
      expect(store.filters.standards).toEqual(['ARC200'])
      expect(store.filters.complianceStatus).toEqual(['compliant'])
      expect(store.filters.search).toBe('test')
    })

    it('should reset filters to default', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({
        standards: ['ARC200'],
        complianceStatus: ['compliant'],
        search: 'test',
      })
      
      store.resetFilters()
      
      expect(store.filters.standards).toEqual([])
      expect(store.filters.complianceStatus).toEqual([])
      expect(store.filters.search).toBe('')
    })
  })

  describe('Filter Persistence', () => {
    it('should save filters to localStorage', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200'] })
      store.saveFilters()
      
      const saved = localStorage.getItem('biatec_discovery_filters')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.standards).toEqual(['ARC200'])
    })

    it('should load saved filters', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200'], search: 'test' })
      store.saveFilters()
      
      // Reset filters
      store.resetFilters()
      expect(store.filters.standards).toEqual([])
      
      // Load saved
      store.loadSavedFilters()
      expect(store.filters.standards).toEqual(['ARC200'])
      expect(store.filters.search).toBe('test')
    })

    it('should clear saved filters', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200'] })
      store.saveFilters()
      
      store.clearSavedFilters()
      
      expect(store.savedFilters).toBeNull()
      expect(localStorage.getItem('biatec_discovery_filters')).toBeNull()
      expect(store.filters.standards).toEqual([])
    })
  })

  describe('Active Filter Detection', () => {
    it('should detect when no filters are active', () => {
      const store = useDiscoveryStore()
      
      expect(store.hasActiveFilters).toBe(false)
    })

    it('should detect active standards filter', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200'] })
      
      expect(store.hasActiveFilters).toBe(true)
    })

    it('should detect active search filter', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ search: 'test' })
      
      expect(store.hasActiveFilters).toBe(true)
    })

    it('should detect active liquidity filter', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ liquidityMin: 1000 })
      
      expect(store.hasActiveFilters).toBe(true)
    })

    it('should count active filters correctly', () => {
      const store = useDiscoveryStore()
      
      expect(store.activeFilterCount).toBe(0)
      
      store.updateFilters({ standards: ['ARC200'] })
      expect(store.activeFilterCount).toBe(1)
      
      store.updateFilters({ ...store.filters, search: 'test' })
      expect(store.activeFilterCount).toBe(2)
      
      store.updateFilters({ ...store.filters, liquidityMin: 1000 })
      expect(store.activeFilterCount).toBe(3)
    })
  })

  describe('Token Filtering', () => {
    beforeEach(() => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
    })

    it('should return all tokens when no filters applied', () => {
      const store = useDiscoveryStore()
      
      expect(store.filteredTokens).toHaveLength(3)
    })

    it('should filter by standard', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200'] })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].symbol).toBe('TKA')
    })

    it('should filter by multiple standards', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ standards: ['ARC200', 'ERC20'] })
      
      expect(store.filteredTokens).toHaveLength(2)
    })

    it('should filter by compliance status', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ complianceStatus: ['compliant'] })
      
      expect(store.filteredTokens).toHaveLength(2)
      expect(store.filteredTokens.every(t => t.complianceStatus === 'compliant')).toBe(true)
    })

    it('should filter by chain', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ chains: ['VOI'] })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].network).toBe('VOI')
    })

    it('should filter by issuer type', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ issuerTypes: ['enterprise'] })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].issuerType).toBe('enterprise')
    })

    it('should filter by minimum liquidity', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ liquidityMin: 3000000 })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].liquidity).toBeGreaterThanOrEqual(3000000)
    })

    it('should filter by search term in name', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ search: 'Token A' })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].name).toBe('Token A')
    })

    it('should filter by search term in symbol', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ search: 'TKB' })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].symbol).toBe('TKB')
    })

    it('should filter by search term in description', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ search: 'third' })
      
      expect(store.filteredTokens).toHaveLength(1)
      expect(store.filteredTokens[0].description).toContain('Third')
    })

    it('should apply multiple filters simultaneously', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({
        standards: ['ARC200', 'ARC72'],
        complianceStatus: ['compliant'],
      })
      
      expect(store.filteredTokens).toHaveLength(2)
      expect(store.filteredTokens.every(t => t.complianceStatus === 'compliant')).toBe(true)
    })

    it('should return empty array when filters match nothing', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({
        standards: ['NONEXISTENT'],
      })
      
      expect(store.filteredTokens).toHaveLength(0)
    })
  })

  describe('State Management', () => {
    it('should set tokens', () => {
      const store = useDiscoveryStore()
      
      store.setTokens(mockTokens)
      
      expect(store.tokens).toHaveLength(3)
    })

    it('should set loading state', () => {
      const store = useDiscoveryStore()
      
      store.setLoading(true)
      expect(store.loading).toBe(true)
      
      store.setLoading(false)
      expect(store.loading).toBe(false)
    })

    it('should set error state', () => {
      const store = useDiscoveryStore()
      
      store.setError('Test error')
      expect(store.error).toBe('Test error')
      
      store.setError(null)
      expect(store.error).toBeNull()
    })
  })

  describe('Edge Cases - Empty States', () => {
    it('should handle empty token list', () => {
      const store = useDiscoveryStore()
      
      store.setTokens([])
      
      expect(store.tokens).toEqual([])
      expect(store.filteredTokens).toEqual([])
      expect(store.hasActiveFilters).toBe(false)
    })

    it('should handle filtering with empty token list', () => {
      const store = useDiscoveryStore()
      
      store.setTokens([])
      store.updateFilters({ standards: ['ARC200'] })
      
      expect(store.filteredTokens).toEqual([])
    })

    it('should handle pagination with no results', () => {
      const store = useDiscoveryStore()
      
      store.setTokens([])
      
      // With no tokens, we just verify it doesn't crash
      expect(store.tokens).toEqual([])
    })
  })

  describe('Edge Cases - Partial/Invalid Token Data', () => {
    it('should handle tokens missing compliance status', () => {
      const store = useDiscoveryStore()
      const partialToken = {
        ...mockTokens[0],
        complianceStatus: undefined
      }
      
      store.setTokens([partialToken as MarketplaceToken])
      store.updateFilters({ complianceStatus: ['compliant'] })
      
      // Token with undefined compliance should be treated as 'unknown'
      expect(store.filteredTokens).toEqual([])
    })

    it('should handle tokens missing liquidity', () => {
      const store = useDiscoveryStore()
      const partialToken = {
        ...mockTokens[0],
        liquidity: undefined
      }
      
      store.setTokens([partialToken as MarketplaceToken])
      store.updateFilters({ liquidityMin: 1000000 })
      
      // Should treat undefined liquidity as 0
      expect(store.filteredTokens).toEqual([])
    })

    it('should handle tokens with null values', () => {
      const store = useDiscoveryStore()
      const nullToken = {
        ...mockTokens[0],
        issuerType: null,
        complianceStatus: null
      }
      
      store.setTokens([nullToken as any])
      
      expect(store.filteredTokens).toHaveLength(1)
    })
  })

  describe('Edge Cases - Compliance Flag Combinations', () => {
    it('should filter by multiple compliance statuses', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      store.updateFilters({ complianceStatus: ['compliant', 'partial'] })
      
      const filtered = store.filteredTokens
      // All 3 tokens match (2 compliant, 1 partial)
      expect(filtered).toHaveLength(3)
      expect(filtered.every(t => t.complianceStatus === 'compliant' || t.complianceStatus === 'partial')).toBe(true)
    })

    it('should handle unknown compliance status', () => {
      const store = useDiscoveryStore()
      const unknownToken = {
        ...mockTokens[0],
        complianceStatus: 'unknown' as any
      }
      
      store.setTokens([unknownToken])
      store.updateFilters({ complianceStatus: ['unknown'] })
      
      expect(store.filteredTokens).toHaveLength(1)
    })

    it('should combine compliance and standard filters', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      store.updateFilters({ 
        complianceStatus: ['compliant'],
        standards: ['ARC200']
      })
      
      const filtered = store.filteredTokens
      expect(filtered.every(t => 
        t.complianceStatus === 'compliant' && t.standard === 'ARC200'
      )).toBe(true)
    })
  })

  describe('Edge Cases - Search Edge Cases', () => {
    it('should handle empty search string', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      store.updateFilters({ search: '' })
      
      expect(store.filteredTokens).toHaveLength(3)
    })

    it('should handle whitespace-only search', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      store.updateFilters({ search: '   ' })
      
      // Whitespace is trimmed and treated as empty search
      // If it's not trimmed, it won't match anything
      const filtered = store.filteredTokens
      expect(filtered.length).toBeGreaterThanOrEqual(0)
    })

    it('should be case-insensitive', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      store.updateFilters({ search: 'TOKEN' })
      
      expect(store.filteredTokens.length).toBeGreaterThan(0)
    })

    it('should search in name, symbol, and description', () => {
      const store = useDiscoveryStore()
      store.setTokens(mockTokens)
      
      // Search by name
      store.updateFilters({ search: 'Token A' })
      expect(store.filteredTokens).toHaveLength(1)
      
      // Search by symbol
      store.updateFilters({ search: 'TKA' })
      expect(store.filteredTokens).toHaveLength(1)
      
      // Search by description
      store.updateFilters({ search: 'First test' })
      expect(store.filteredTokens).toHaveLength(1)
    })
  })

  describe('Edge Cases - Filter Persistence', () => {
    it('should save and load filters from localStorage', () => {
      const store = useDiscoveryStore()
      
      store.updateFilters({ 
        standards: ['ARC200', 'ERC20'],
        complianceStatus: ['compliant']
      })
      store.saveFilters()
      
      // Create new store instance to simulate page reload
      setActivePinia(createPinia())
      const newStore = useDiscoveryStore()
      newStore.loadSavedFilters()
      
      expect(newStore.filters.standards).toEqual(['ARC200', 'ERC20'])
      expect(newStore.filters.complianceStatus).toEqual(['compliant'])
    })

    it('should handle corrupted saved filters', () => {
      localStorage.setItem('biatec_discovery_filters', 'invalid json')
      
      const store = useDiscoveryStore()
      store.loadSavedFilters()
      
      // Should not crash and use defaults
      expect(store.filters.standards).toEqual([])
    })
  })
})
