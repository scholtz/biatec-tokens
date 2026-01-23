import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAttestationsStore } from './attestations'
import { AttestationType } from '../types/compliance'

describe('Attestations Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('should initialize with empty attestations', () => {
      const store = useAttestationsStore()
      expect(store.attestations).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should initialize with default filters', () => {
      const store = useAttestationsStore()
      expect(store.filters.status).toBe('all')
      expect(store.filters.type).toBe('all')
      expect(store.filters.network).toBe('all')
    })

    it('should initialize with pagination defaults', () => {
      const store = useAttestationsStore()
      expect(store.currentPage).toBe(1)
      expect(store.itemsPerPage).toBe(10)
    })
  })

  describe('Load Attestations', () => {
    it('should load mock attestations', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
      
      expect(store.attestations.length).toBeGreaterThan(0)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading state while loading', async () => {
      const store = useAttestationsStore()
      const loadPromise = store.loadAttestations()
      
      expect(store.isLoading).toBe(true)
      await loadPromise
      expect(store.isLoading).toBe(false)
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
    })

    it('should filter by status', () => {
      const store = useAttestationsStore()
      store.setFilters({ status: 'verified' })
      
      expect(store.filteredAttestations.every(a => a.status === 'verified')).toBe(true)
    })

    it('should filter by type', () => {
      const store = useAttestationsStore()
      store.setFilters({ type: AttestationType.KYC_AML })
      
      expect(store.filteredAttestations.every(a => a.type === AttestationType.KYC_AML)).toBe(true)
    })

    it('should filter by network', () => {
      const store = useAttestationsStore()
      store.setFilters({ network: 'VOI' })
      
      expect(store.filteredAttestations.every(a => a.network === 'VOI')).toBe(true)
    })

    it('should filter by search query', () => {
      const store = useAttestationsStore()
      store.setFilters({ search: 'ADDR123' })
      
      expect(store.filteredAttestations.length).toBeGreaterThan(0)
      expect(store.filteredAttestations.every(a => 
        a.walletAddress.includes('ADDR123') || 
        a.assetId.includes('ADDR123')
      )).toBe(true)
    })

    it('should reset filters', () => {
      const store = useAttestationsStore()
      store.setFilters({ status: 'verified', type: AttestationType.KYC_AML })
      store.resetFilters()
      
      expect(store.filters.status).toBe('all')
      expect(store.filters.type).toBe('all')
      expect(store.filters.network).toBe('all')
    })
  })

  describe('Pagination', () => {
    beforeEach(async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
    })

    it('should paginate results', () => {
      const store = useAttestationsStore()
      expect(store.paginatedAttestations.length).toBeLessThanOrEqual(store.itemsPerPage)
    })

    it('should calculate total pages correctly', () => {
      const store = useAttestationsStore()
      const expectedPages = Math.ceil(store.totalCount / store.itemsPerPage)
      expect(store.totalPages).toBe(expectedPages)
    })

    it('should change page', () => {
      const store = useAttestationsStore()
      if (store.totalPages > 1) {
        store.setPage(2)
        expect(store.currentPage).toBe(2)
      } else {
        // If only 1 page, test that current page stays at 1
        store.setPage(2)
        expect(store.currentPage).toBe(1)
      }
    })

    it('should not go below page 1', () => {
      const store = useAttestationsStore()
      store.setPage(0)
      expect(store.currentPage).toBe(1)
    })

    it('should change items per page', () => {
      const store = useAttestationsStore()
      store.setItemsPerPage(20)
      expect(store.itemsPerPage).toBe(20)
      expect(store.currentPage).toBe(1) // Should reset to page 1
    })
  })

  describe('Status Counts', () => {
    beforeEach(async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
    })

    it('should calculate status counts correctly', () => {
      const store = useAttestationsStore()
      const counts = store.statusCounts
      
      expect(counts.all).toBe(store.attestations.length)
      expect(counts.verified + counts.pending + counts.rejected).toBeLessThanOrEqual(counts.all)
    })
  })

  describe('Export Functions', () => {
    beforeEach(async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
    })

    it('should export to CSV format', () => {
      const store = useAttestationsStore()
      const csv = store.exportToCSV()
      
      expect(csv).toContain('ID,Type,Status')
      expect(csv.split('\n').length).toBeGreaterThan(1)
    })

    it('should export to JSON format', () => {
      const store = useAttestationsStore()
      const json = store.exportToJSON()
      
      const parsed = JSON.parse(json)
      expect(Array.isArray(parsed)).toBe(true)
    })

    it('should download CSV file', () => {
      const store = useAttestationsStore()
      
      // Mock createElement and click
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const clickSpy = vi.spyOn(mockLink, 'click').mockImplementation(() => {})
      
      store.downloadCSV()
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
      clickSpy.mockRestore()
    })

    it('should download JSON file', () => {
      const store = useAttestationsStore()
      
      // Mock createElement and click
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const clickSpy = vi.spyOn(mockLink, 'click').mockImplementation(() => {})
      
      store.downloadJSON()
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
      clickSpy.mockRestore()
    })
  })

  describe('Attestation Selection', () => {
    beforeEach(async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()
    })

    it('should select an attestation', () => {
      const store = useAttestationsStore()
      const attestation = store.attestations[0]
      
      store.selectAttestation(attestation)
      expect(store.selectedAttestation).toEqual(attestation)
    })

    it('should deselect attestation', () => {
      const store = useAttestationsStore()
      const attestation = store.attestations[0]
      
      store.selectAttestation(attestation)
      store.selectAttestation(null)
      expect(store.selectedAttestation).toBeNull()
    })
  })
})
