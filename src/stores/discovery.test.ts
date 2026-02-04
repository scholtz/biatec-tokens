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
})
