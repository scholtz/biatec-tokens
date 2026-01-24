import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Network } from '../types/compliance'

/**
 * Compliance dashboard filter interface
 * Defines filters for enterprise wallet compliance view
 */
export interface ComplianceDashboardFilters {
  micaReady: boolean | null // null = show all, true = only MICA ready, false = only non-MICA
  whitelistRequired: boolean | null
  kycRequired: boolean | null
  jurisdictionRestricted: boolean | null
  transferRestricted: boolean | null
  network: Network | 'all' // Filter by specific network
}

/**
 * Network metrics for compliance summary
 */
export interface NetworkComplianceMetrics {
  network: Network
  totalAssets: number
  compliantAssets: number
  restrictedAssets: number
  micaReadyAssets: number
  whitelistedAssets: number
}

const STORAGE_KEY = 'biatec_compliance_dashboard_filters'

export const useComplianceDashboardStore = defineStore('complianceDashboard', () => {
  // Load filters from localStorage on initialization
  const loadFiltersFromStorage = (): ComplianceDashboardFilters => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load filters from storage:', error)
    }
    return getDefaultFilters()
  }

  const getDefaultFilters = (): ComplianceDashboardFilters => ({
    micaReady: null,
    whitelistRequired: null,
    kycRequired: null,
    jurisdictionRestricted: null,
    transferRestricted: null,
    network: 'all'
  })

  // State
  const filters = ref<ComplianceDashboardFilters>(loadFiltersFromStorage())
  const isFilterPanelExpanded = ref(true)

  // Computed: Check if any filters are active
  const hasActiveFilters = computed(() => {
    return filters.value.micaReady !== null ||
           filters.value.whitelistRequired !== null ||
           filters.value.kycRequired !== null ||
           filters.value.jurisdictionRestricted !== null ||
           filters.value.transferRestricted !== null ||
           filters.value.network !== 'all'
  })

  // Computed: Count of active filters
  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.micaReady !== null) count++
    if (filters.value.whitelistRequired !== null) count++
    if (filters.value.kycRequired !== null) count++
    if (filters.value.jurisdictionRestricted !== null) count++
    if (filters.value.transferRestricted !== null) count++
    if (filters.value.network !== 'all') count++
    return count
  })

  // Methods
  const setFilter = <K extends keyof ComplianceDashboardFilters>(
    key: K, 
    value: ComplianceDashboardFilters[K]
  ) => {
    filters.value[key] = value
    persistFilters()
  }

  const setFilters = (newFilters: Partial<ComplianceDashboardFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    persistFilters()
  }

  const resetFilters = () => {
    filters.value = getDefaultFilters()
    persistFilters()
  }

  const toggleFilterPanel = () => {
    isFilterPanelExpanded.value = !isFilterPanelExpanded.value
  }

  const persistFilters = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value))
    } catch (error) {
      console.error('Failed to persist filters to storage:', error)
    }
  }

  /**
   * Determines if an asset matches the current filters
   * Used to filter token lists in wallet views
   */
  const matchesFilters = (asset: {
    network?: Network
    complianceFlags?: {
      micaReady?: boolean
      whitelistRequired?: boolean
      kycRequired?: boolean
      jurisdictionRestricted?: boolean
      transferRestricted?: boolean
    }
  }): boolean => {
    // Network filter
    if (filters.value.network !== 'all' && asset.network !== filters.value.network) {
      return false
    }

    const flags = asset.complianceFlags || {}

    // MICA Ready filter
    if (filters.value.micaReady !== null) {
      if (filters.value.micaReady && !flags.micaReady) return false
      if (!filters.value.micaReady && flags.micaReady) return false
    }

    // Whitelist Required filter
    if (filters.value.whitelistRequired !== null) {
      if (filters.value.whitelistRequired && !flags.whitelistRequired) return false
      if (!filters.value.whitelistRequired && flags.whitelistRequired) return false
    }

    // KYC Required filter
    if (filters.value.kycRequired !== null) {
      if (filters.value.kycRequired && !flags.kycRequired) return false
      if (!filters.value.kycRequired && flags.kycRequired) return false
    }

    // Jurisdiction Restricted filter
    if (filters.value.jurisdictionRestricted !== null) {
      if (filters.value.jurisdictionRestricted && !flags.jurisdictionRestricted) return false
      if (!filters.value.jurisdictionRestricted && flags.jurisdictionRestricted) return false
    }

    // Transfer Restricted filter
    if (filters.value.transferRestricted !== null) {
      if (filters.value.transferRestricted && !flags.transferRestricted) return false
      if (!filters.value.transferRestricted && flags.transferRestricted) return false
    }

    return true
  }

  /**
   * Calculate network-specific compliance metrics
   * Used for summary displays
   */
  const calculateNetworkMetrics = (assets: Array<{
    network: Network
    complianceFlags?: {
      micaReady?: boolean
      whitelistRequired?: boolean
      kycRequired?: boolean
      jurisdictionRestricted?: boolean
      transferRestricted?: boolean
    }
  }>): NetworkComplianceMetrics[] => {
    const voiAssets = assets.filter(a => a.network === 'VOI')
    const aramidAssets = assets.filter(a => a.network === 'Aramid')

    const calculateMetrics = (networkAssets: typeof assets, network: Network): NetworkComplianceMetrics => {
      return {
        network,
        totalAssets: networkAssets.length,
        compliantAssets: networkAssets.filter(a => {
          // An asset is compliant if:
          // 1. It is explicitly MICA ready, OR
          // 2. It has compliance metadata and no explicit restrictions
          // 
          // Note: Assets without compliance metadata are treated as non-compliant
          // to ensure a conservative compliance stance. This can be adjusted based
          // on business requirements.
          const flags = a.complianceFlags
          if (!flags) return false // No compliance metadata = assume not compliant (conservative approach)
          
          // Explicitly MICA ready = compliant
          if (flags.micaReady) return true
          
          // Has metadata with no restrictions = compliant
          return !flags.whitelistRequired && 
                 !flags.jurisdictionRestricted && 
                 !flags.transferRestricted
        }).length,
        restrictedAssets: networkAssets.filter(a => 
          a.complianceFlags?.whitelistRequired || 
          a.complianceFlags?.jurisdictionRestricted ||
          a.complianceFlags?.transferRestricted
        ).length,
        micaReadyAssets: networkAssets.filter(a => a.complianceFlags?.micaReady === true).length,
        whitelistedAssets: networkAssets.filter(a => a.complianceFlags?.whitelistRequired === true).length
      }
    }

    return [
      calculateMetrics(voiAssets, 'VOI'),
      calculateMetrics(aramidAssets, 'Aramid')
    ]
  }

  return {
    // State
    filters: computed(() => filters.value),
    isFilterPanelExpanded: computed(() => isFilterPanelExpanded.value),
    hasActiveFilters,
    activeFilterCount,

    // Methods
    setFilter,
    setFilters,
    resetFilters,
    toggleFilterPanel,
    matchesFilters,
    calculateNetworkMetrics
  }
})
