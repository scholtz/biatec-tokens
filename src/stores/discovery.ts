import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MarketplaceToken } from './marketplace'

export interface DiscoveryFilters {
  standards: string[]
  complianceStatus: string[]
  chains: string[]
  issuerTypes: string[]
  liquidityMin: number | null
  search: string
}

const DISCOVERY_FILTERS_STORAGE_KEY = 'biatec_discovery_filters'

export const useDiscoveryStore = defineStore('discovery', () => {
  // State
  const filters = ref<DiscoveryFilters>({
    standards: [],
    complianceStatus: [],
    chains: [],
    issuerTypes: [],
    liquidityMin: null,
    search: '',
  })

  const savedFilters = ref<DiscoveryFilters | null>(null)
  const tokens = ref<MarketplaceToken[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasActiveFilters = computed(() => {
    return (
      filters.value.standards.length > 0 ||
      filters.value.complianceStatus.length > 0 ||
      filters.value.chains.length > 0 ||
      filters.value.issuerTypes.length > 0 ||
      filters.value.liquidityMin !== null ||
      filters.value.search.length > 0
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.standards.length > 0) count++
    if (filters.value.complianceStatus.length > 0) count++
    if (filters.value.chains.length > 0) count++
    if (filters.value.issuerTypes.length > 0) count++
    if (filters.value.liquidityMin !== null) count++
    if (filters.value.search.length > 0) count++
    return count
  })

  const filteredTokens = computed(() => {
    let result = [...tokens.value]

    // Apply standards filter
    if (filters.value.standards.length > 0) {
      result = result.filter(token => 
        filters.value.standards.includes(token.standard || '')
      )
    }

    // Apply compliance status filter
    if (filters.value.complianceStatus.length > 0) {
      result = result.filter(token => {
        const status = token.complianceStatus || 'unknown'
        return filters.value.complianceStatus.includes(status)
      })
    }

    // Apply chain filter
    if (filters.value.chains.length > 0) {
      result = result.filter(token =>
        filters.value.chains.includes(token.network || '')
      )
    }

    // Apply issuer type filter
    if (filters.value.issuerTypes.length > 0) {
      result = result.filter(token => {
        const issuerType = token.issuerType || 'individual'
        return filters.value.issuerTypes.includes(issuerType)
      })
    }

    // Apply liquidity minimum filter
    if (filters.value.liquidityMin !== null) {
      result = result.filter(token => {
        const liquidity = token.liquidity || 0
        return liquidity >= (filters.value.liquidityMin || 0)
      })
    }

    // Apply search filter
    if (filters.value.search.length > 0) {
      const searchLower = filters.value.search.toLowerCase()
      result = result.filter(token =>
        token.name.toLowerCase().includes(searchLower) ||
        token.symbol.toLowerCase().includes(searchLower) ||
        token.description?.toLowerCase().includes(searchLower)
      )
    }

    return result
  })

  // Actions
  const initialize = () => {
    const stored = localStorage.getItem(DISCOVERY_FILTERS_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        savedFilters.value = parsed
        filters.value = { ...filters.value, ...parsed }
      } catch (error) {
        console.error('Failed to parse discovery filters:', error)
      }
    }
  }

  const updateFilters = (updates: Partial<DiscoveryFilters>) => {
    filters.value = { ...filters.value, ...updates }
  }

  const saveFilters = () => {
    savedFilters.value = { ...filters.value }
    localStorage.setItem(DISCOVERY_FILTERS_STORAGE_KEY, JSON.stringify(filters.value))
  }

  const loadSavedFilters = () => {
    if (savedFilters.value) {
      filters.value = { ...savedFilters.value }
    } else {
      initialize()
    }
  }

  const resetFilters = () => {
    filters.value = {
      standards: [],
      complianceStatus: [],
      chains: [],
      issuerTypes: [],
      liquidityMin: null,
      search: '',
    }
  }

  const clearSavedFilters = () => {
    savedFilters.value = null
    localStorage.removeItem(DISCOVERY_FILTERS_STORAGE_KEY)
    resetFilters()
  }

  const setTokens = (newTokens: MarketplaceToken[]) => {
    tokens.value = newTokens
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (value: string | null) => {
    error.value = value
  }

  return {
    filters,
    savedFilters,
    tokens,
    loading,
    error,
    hasActiveFilters,
    activeFilterCount,
    filteredTokens,
    initialize,
    updateFilters,
    saveFilters,
    loadSavedFilters,
    resetFilters,
    clearSavedFilters,
    setTokens,
    setLoading,
    setError,
  }
})
