import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useComplianceDashboardStore } from '../complianceDashboard'
import type { Network } from '../../types/compliance'

describe('useComplianceDashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // ── Initial state ────────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with all filters as null/all', () => {
      const store = useComplianceDashboardStore()
      expect(store.filters.micaReady).toBeNull()
      expect(store.filters.whitelistRequired).toBeNull()
      expect(store.filters.kycRequired).toBeNull()
      expect(store.filters.jurisdictionRestricted).toBeNull()
      expect(store.filters.transferRestricted).toBeNull()
      expect(store.filters.network).toBe('all')
    })

    it('starts with no active filters', () => {
      const store = useComplianceDashboardStore()
      expect(store.hasActiveFilters).toBe(false)
    })

    it('starts with activeFilterCount = 0', () => {
      const store = useComplianceDashboardStore()
      expect(store.activeFilterCount).toBe(0)
    })

    it('starts with filter panel expanded', () => {
      const store = useComplianceDashboardStore()
      expect(store.isFilterPanelExpanded).toBe(true)
    })
  })

  // ── setFilter ────────────────────────────────────────────────────────────────

  describe('setFilter', () => {
    it('sets micaReady filter to true', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      expect(store.filters.micaReady).toBe(true)
    })

    it('sets micaReady filter to false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', false)
      expect(store.filters.micaReady).toBe(false)
    })

    it('sets network filter', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('network', 'VOI')
      expect(store.filters.network).toBe('VOI')
    })

    it('persists filters to localStorage', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      const stored = JSON.parse(localStorage.getItem('biatec_compliance_dashboard_filters') || '{}')
      expect(stored.micaReady).toBe(true)
    })
  })

  // ── setFilters ───────────────────────────────────────────────────────────────

  describe('setFilters', () => {
    it('updates multiple filters at once', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({ micaReady: true, network: 'Aramid' })
      expect(store.filters.micaReady).toBe(true)
      expect(store.filters.network).toBe('Aramid')
    })

    it('does not overwrite unspecified filters', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('kycRequired', true)
      store.setFilters({ micaReady: true })
      expect(store.filters.kycRequired).toBe(true)
    })

    it('persists to localStorage', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({ whitelistRequired: false })
      const stored = JSON.parse(localStorage.getItem('biatec_compliance_dashboard_filters') || '{}')
      expect(stored.whitelistRequired).toBe(false)
    })
  })

  // ── resetFilters ─────────────────────────────────────────────────────────────

  describe('resetFilters', () => {
    it('resets all filters to defaults', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({ micaReady: true, kycRequired: false, network: 'VOI' })
      store.resetFilters()
      expect(store.filters.micaReady).toBeNull()
      expect(store.filters.kycRequired).toBeNull()
      expect(store.filters.network).toBe('all')
    })

    it('sets hasActiveFilters back to false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      store.resetFilters()
      expect(store.hasActiveFilters).toBe(false)
    })

    it('sets activeFilterCount back to 0', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({ micaReady: true, kycRequired: false })
      store.resetFilters()
      expect(store.activeFilterCount).toBe(0)
    })
  })

  // ── toggleFilterPanel ────────────────────────────────────────────────────────

  describe('toggleFilterPanel', () => {
    it('toggles from expanded to collapsed', () => {
      const store = useComplianceDashboardStore()
      expect(store.isFilterPanelExpanded).toBe(true)
      store.toggleFilterPanel()
      expect(store.isFilterPanelExpanded).toBe(false)
    })

    it('toggles from collapsed to expanded', () => {
      const store = useComplianceDashboardStore()
      store.toggleFilterPanel()
      store.toggleFilterPanel()
      expect(store.isFilterPanelExpanded).toBe(true)
    })
  })

  // ── hasActiveFilters computed ────────────────────────────────────────────────

  describe('hasActiveFilters', () => {
    it('returns true when micaReady is set', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      expect(store.hasActiveFilters).toBe(true)
    })

    it('returns true when kycRequired is false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('kycRequired', false)
      expect(store.hasActiveFilters).toBe(true)
    })

    it('returns true when network filter is set', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('network', 'VOI')
      expect(store.hasActiveFilters).toBe(true)
    })

    it('returns false after reset', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      store.resetFilters()
      expect(store.hasActiveFilters).toBe(false)
    })
  })

  // ── activeFilterCount computed ───────────────────────────────────────────────

  describe('activeFilterCount', () => {
    it('counts each active filter correctly', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({
        micaReady: true,
        whitelistRequired: false,
        kycRequired: true,
        jurisdictionRestricted: false,
        transferRestricted: true,
        network: 'VOI',
      })
      expect(store.activeFilterCount).toBe(6)
    })

    it('does not count null filters', () => {
      const store = useComplianceDashboardStore()
      store.setFilters({ micaReady: true, kycRequired: null })
      expect(store.activeFilterCount).toBe(1)
    })

    it('does not count network=all', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('network', 'all')
      expect(store.activeFilterCount).toBe(0)
    })
  })

  // ── matchesFilters ───────────────────────────────────────────────────────────

  describe('matchesFilters', () => {
    it('returns true for empty filters and any asset', () => {
      const store = useComplianceDashboardStore()
      expect(store.matchesFilters({ network: 'VOI' })).toBe(true)
    })

    it('filters by network correctly', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('network', 'VOI')
      expect(store.matchesFilters({ network: 'VOI' })).toBe(true)
      expect(store.matchesFilters({ network: 'Aramid' })).toBe(false)
    })

    it('filters micaReady = true', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      expect(store.matchesFilters({ complianceFlags: { micaReady: true } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { micaReady: false } })).toBe(false)
    })

    it('filters micaReady = false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', false)
      expect(store.matchesFilters({ complianceFlags: { micaReady: false } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { micaReady: true } })).toBe(false)
    })

    it('filters whitelistRequired = true', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('whitelistRequired', true)
      expect(store.matchesFilters({ complianceFlags: { whitelistRequired: true } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { whitelistRequired: false } })).toBe(false)
    })

    it('filters kycRequired = false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('kycRequired', false)
      expect(store.matchesFilters({ complianceFlags: { kycRequired: false } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { kycRequired: true } })).toBe(false)
    })

    it('filters jurisdictionRestricted = true', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('jurisdictionRestricted', true)
      expect(store.matchesFilters({ complianceFlags: { jurisdictionRestricted: true } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { jurisdictionRestricted: false } })).toBe(false)
    })

    it('filters transferRestricted = false', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('transferRestricted', false)
      expect(store.matchesFilters({ complianceFlags: { transferRestricted: false } })).toBe(true)
      expect(store.matchesFilters({ complianceFlags: { transferRestricted: true } })).toBe(false)
    })

    it('asset without complianceFlags matches null filters', () => {
      const store = useComplianceDashboardStore()
      expect(store.matchesFilters({})).toBe(true)
    })
  })

  // ── calculateNetworkMetrics ──────────────────────────────────────────────────

  describe('calculateNetworkMetrics', () => {
    const assets = [
      { network: 'VOI' as Network, complianceFlags: { micaReady: true } },
      { network: 'VOI' as Network, complianceFlags: { whitelistRequired: true } },
      { network: 'VOI' as Network, complianceFlags: {} },
      { network: 'Aramid' as Network, complianceFlags: { micaReady: false, kycRequired: false } },
      { network: 'Aramid' as Network, complianceFlags: { jurisdictionRestricted: true } },
    ]

    it('returns metrics for both VOI and Aramid', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics(assets)
      expect(metrics).toHaveLength(2)
      expect(metrics.map(m => m.network)).toEqual(['VOI', 'Aramid'])
    })

    it('counts total assets per network', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics(assets)
      const voi = metrics.find(m => m.network === 'VOI')!
      const aramid = metrics.find(m => m.network === 'Aramid')!
      expect(voi.totalAssets).toBe(3)
      expect(aramid.totalAssets).toBe(2)
    })

    it('counts micaReady assets correctly', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics(assets)
      const voi = metrics.find(m => m.network === 'VOI')!
      expect(voi.micaReadyAssets).toBe(1)
    })

    it('counts restricted assets correctly', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics(assets)
      const voi = metrics.find(m => m.network === 'VOI')!
      expect(voi.restrictedAssets).toBe(1) // whitelistRequired
    })

    it('counts whitelistedAssets correctly', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics(assets)
      const voi = metrics.find(m => m.network === 'VOI')!
      expect(voi.whitelistedAssets).toBe(1)
    })

    it('handles empty asset list', () => {
      const store = useComplianceDashboardStore()
      const metrics = store.calculateNetworkMetrics([])
      expect(metrics[0].totalAssets).toBe(0)
      expect(metrics[1].totalAssets).toBe(0)
    })

    it('assets without complianceFlags are not compliant', () => {
      const store = useComplianceDashboardStore()
      const noFlagsAssets = [{ network: 'VOI' as Network }]
      const metrics = store.calculateNetworkMetrics(noFlagsAssets)
      expect(metrics[0].compliantAssets).toBe(0)
    })
  })

  // ── localStorage persistence ─────────────────────────────────────────────────

  describe('localStorage persistence', () => {
    it('restores filters from localStorage on init', () => {
      localStorage.setItem('biatec_compliance_dashboard_filters', JSON.stringify({
        micaReady: true,
        whitelistRequired: null,
        kycRequired: null,
        jurisdictionRestricted: null,
        transferRestricted: null,
        network: 'all',
      }))
      const store = useComplianceDashboardStore()
      expect(store.filters.micaReady).toBe(true)
    })

    it('falls back to defaults when localStorage has invalid JSON', () => {
      localStorage.setItem('biatec_compliance_dashboard_filters', 'NOT_VALID_JSON')
      expect(() => useComplianceDashboardStore()).not.toThrow()
      const store = useComplianceDashboardStore()
      expect(store.filters.micaReady).toBeNull()
    })

    it('persists filters to localStorage when setFilter is called', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('network', 'Aramid')
      const stored = JSON.parse(localStorage.getItem('biatec_compliance_dashboard_filters') || '{}')
      expect(stored.network).toBe('Aramid')
    })

    it('persists filters to localStorage when resetFilters is called', () => {
      const store = useComplianceDashboardStore()
      store.setFilter('micaReady', true)
      store.resetFilters()
      const stored = JSON.parse(localStorage.getItem('biatec_compliance_dashboard_filters') || '{}')
      expect(stored.micaReady).toBeNull()
    })
  })
})
