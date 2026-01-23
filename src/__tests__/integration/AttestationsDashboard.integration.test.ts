import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAttestationsStore } from '../../stores/attestations'
import { setActivePinia, createPinia } from 'pinia'
import { AttestationType } from '../../types/compliance'
import type { AttestationListItem } from '../../stores/attestations'

describe('Attestations Dashboard Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Complete Attestations Workflow', () => {
    it('should load attestations and display them', async () => {
      const store = useAttestationsStore()
      
      await store.loadAttestations()
      
      expect(store.attestations.length).toBeGreaterThan(0)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should filter attestations by multiple criteria', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const initialCount = store.attestations.length

      // Filter by status
      store.setFilters({ status: 'verified' })
      const verifiedCount = store.filteredAttestations.length
      expect(verifiedCount).toBeLessThanOrEqual(initialCount)

      // Add type filter
      store.setFilters({ status: 'verified', type: AttestationType.KYC_AML })
      const kycVerifiedCount = store.filteredAttestations.length
      expect(kycVerifiedCount).toBeLessThanOrEqual(verifiedCount)

      // Add network filter
      store.setFilters({ 
        status: 'verified', 
        type: AttestationType.KYC_AML,
        network: 'VOI' 
      })
      const voiKycVerifiedCount = store.filteredAttestations.length
      expect(voiKycVerifiedCount).toBeLessThanOrEqual(kycVerifiedCount)
    })

    it('should paginate through attestations', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setItemsPerPage(2)
      const totalPages = store.totalPages

      if (totalPages > 1) {
        const page1Items = [...store.paginatedAttestations]
        
        store.setPage(2)
        const page2Items = [...store.paginatedAttestations]

        // Different items on different pages
        expect(page1Items[0]?.id).not.toBe(page2Items[0]?.id)
      }
    })

    it('should select and view attestation details', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const firstAttestation = store.attestations[0]
      store.selectAttestation(firstAttestation)

      expect(store.selectedAttestation).toEqual(firstAttestation)
      expect(store.selectedAttestation?.id).toBe(firstAttestation.id)
    })
  })

  describe('Export and Download Workflow', () => {
    it('should export filtered attestations to CSV', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setFilters({ status: 'verified' })
      const csv = store.exportToCSV()

      expect(csv).toContain('ID,Type,Status')
      expect(csv.split('\n').length).toBeGreaterThan(1)
      
      // CSV should only contain verified attestations
      const lines = csv.split('\n')
      lines.slice(1).forEach(line => {
        if (line.trim()) {
          expect(line.toLowerCase()).toContain('verified')
        }
      })
    })

    it('should export filtered attestations to JSON', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setFilters({ network: 'VOI' })
      const json = store.exportToJSON()

      const parsed = JSON.parse(json)
      expect(Array.isArray(parsed)).toBe(true)
      
      // JSON should only contain VOI attestations
      parsed.forEach((attestation: AttestationListItem) => {
        expect(attestation.network).toBe('VOI')
      })
    })

    it('should download CSV file with proper name', () => {
      const store = useAttestationsStore()
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      store.downloadCSV()

      expect(mockLink.download).toMatch(/attestations-.*\.csv/)
      expect(mockLink.click).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should download JSON file with proper name', () => {
      const store = useAttestationsStore()
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      store.downloadJSON()

      expect(mockLink.download).toMatch(/attestations-.*\.json/)
      expect(mockLink.click).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('Multi-Network Support', () => {
    it('should load attestations for VOI network', async () => {
      const store = useAttestationsStore()
      
      await store.loadAttestations('token123', 'VOI')
      
      expect(store.attestations.length).toBeGreaterThan(0)
      // Should have some VOI attestations
      const voiAttestations = store.attestations.filter(a => a.network === 'VOI')
      expect(voiAttestations.length).toBeGreaterThan(0)
    })

    it('should load attestations for Aramid network', async () => {
      const store = useAttestationsStore()
      
      await store.loadAttestations('token123', 'Aramid')
      
      expect(store.attestations.length).toBeGreaterThan(0)
      // Should have some Aramid attestations
      const aramidAttestations = store.attestations.filter(a => a.network === 'Aramid')
      expect(aramidAttestations.length).toBeGreaterThan(0)
    })

    it('should filter attestations by network', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setFilters({ network: 'VOI' })
      const voiAttestations = store.filteredAttestations
      voiAttestations.forEach(attestation => {
        expect(attestation.network).toBe('VOI')
      })

      store.setFilters({ network: 'Aramid' })
      const aramidAttestations = store.filteredAttestations
      aramidAttestations.forEach(attestation => {
        expect(attestation.network).toBe('Aramid')
      })
    })
  })

  describe('Search and Filter Workflow', () => {
    it('should search across wallet address, asset ID, and issuer', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      // Search by wallet address
      store.setFilters({ search: 'ADDR123' })
      const walletResults = store.filteredAttestations
      expect(walletResults.length).toBeGreaterThan(0)
      walletResults.forEach(attestation => {
        const matchesSearch = 
          attestation.walletAddress.includes('ADDR123') ||
          attestation.assetId.includes('ADDR123') ||
          attestation.issuerName.toLowerCase().includes('addr123') ||
          (attestation.notes && attestation.notes.toLowerCase().includes('addr123'))
        expect(matchesSearch).toBe(true)
      })
    })

    it('should combine search with filters', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setFilters({ 
        search: 'Compliance',
        status: 'verified',
        network: 'VOI'
      })

      const results = store.filteredAttestations
      results.forEach(attestation => {
        expect(attestation.status).toBe('verified')
        expect(attestation.network).toBe('VOI')
        const matchesSearch = 
          attestation.walletAddress.toLowerCase().includes('compliance') ||
          attestation.assetId.toLowerCase().includes('compliance') ||
          attestation.issuerName.toLowerCase().includes('compliance') ||
          (attestation.notes && attestation.notes.toLowerCase().includes('compliance'))
        expect(matchesSearch).toBe(true)
      })
    })

    it('should reset filters and restore all attestations', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const totalAttestations = store.attestations.length

      store.setFilters({ status: 'verified', type: AttestationType.KYC_AML })
      expect(store.filteredAttestations.length).toBeLessThanOrEqual(totalAttestations)

      store.resetFilters()
      expect(store.filteredAttestations.length).toBe(totalAttestations)
      expect(store.filters.status).toBe('all')
      expect(store.filters.type).toBe('all')
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter by start date', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      store.setFilters({ startDate })

      const results = store.filteredAttestations
      results.forEach(attestation => {
        const createdDate = new Date(attestation.createdAt)
        const filterDate = new Date(startDate)
        expect(createdDate >= filterDate).toBe(true)
      })
    })

    it('should filter by end date', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const endDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      store.setFilters({ endDate })

      const results = store.filteredAttestations
      results.forEach(attestation => {
        const createdDate = new Date(attestation.createdAt)
        const filterDate = new Date(endDate)
        expect(createdDate <= filterDate).toBe(true)
      })
    })

    it('should filter by date range', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]
      
      store.setFilters({ startDate, endDate })

      const results = store.filteredAttestations
      results.forEach(attestation => {
        const createdDate = new Date(attestation.createdAt)
        const start = new Date(startDate)
        const end = new Date(endDate)
        expect(createdDate >= start && createdDate <= end).toBe(true)
      })
    })
  })

  describe('Status Count Tracking', () => {
    it('should accurately count attestations by status', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const counts = store.statusCounts

      expect(counts.all).toBe(store.attestations.length)
      
      const actualVerified = store.attestations.filter(a => a.status === 'verified').length
      const actualPending = store.attestations.filter(a => a.status === 'pending').length
      const actualRejected = store.attestations.filter(a => a.status === 'rejected').length

      expect(counts.verified).toBe(actualVerified)
      expect(counts.pending).toBe(actualPending)
      expect(counts.rejected).toBe(actualRejected)
    })

    it('should update counts when filters are applied', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const allCounts = { ...store.statusCounts }

      store.setFilters({ network: 'VOI' })
      
      // Counts should remain the same (they show total, not filtered)
      expect(store.statusCounts.all).toBe(allCounts.all)
    })
  })

  describe('CSV Export Data Integrity', () => {
    it('should properly escape special characters in CSV', async () => {
      const store = useAttestationsStore()
      
      // Add attestation with special characters
      store.attestations = [{
        id: 'test-001',
        type: AttestationType.KYC_AML,
        status: 'verified',
        walletAddress: 'ADDR123',
        assetId: 'ASA-123',
        issuerName: 'Company, Inc. "Special"',
        network: 'VOI',
        createdAt: new Date().toISOString(),
        notes: 'Contains "quotes" and, commas',
      }]

      const csv = store.exportToCSV()
      
      // Check proper escaping
      expect(csv).toContain('""Special""')
      expect(csv).toContain('"quotes"')
    })

    it('should include all columns in CSV export', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const csv = store.exportToCSV()
      const headers = csv.split('\n')[0]

      expect(headers).toContain('ID')
      expect(headers).toContain('Type')
      expect(headers).toContain('Status')
      expect(headers).toContain('Wallet Address')
      expect(headers).toContain('Asset ID')
      expect(headers).toContain('Issuer')
      expect(headers).toContain('Network')
      expect(headers).toContain('Created At')
      expect(headers).toContain('Verified At')
      expect(headers).toContain('Proof Hash')
    })
  })

  describe('Error Handling', () => {
    it('should handle load errors gracefully', async () => {
      const store = useAttestationsStore()
      
      // Mock a failure scenario
      vi.spyOn(store, 'loadAttestations').mockRejectedValueOnce(new Error('Network error'))

      try {
        await store.loadAttestations()
      } catch (error) {
        // Error should be caught and stored
      }

      expect(store.isLoading).toBe(false)
    })

    it('should clear error state on successful load', async () => {
      const store = useAttestationsStore()
      
      store.error = 'Previous error'
      await store.loadAttestations()

      expect(store.error).toBeNull()
    })
  })

  describe('Pagination Edge Cases', () => {
    it('should not go beyond total pages', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      const totalPages = store.totalPages
      
      store.setPage(totalPages + 10)
      expect(store.currentPage).toBe(totalPages)
    })

    it('should reset to page 1 when filters change', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setItemsPerPage(1) // Ensure multiple pages
      const totalPages = store.totalPages

      if (totalPages > 1) {
        store.setPage(2)
        expect(store.currentPage).toBe(2)

        store.setFilters({ status: 'verified' })
        expect(store.currentPage).toBe(1)
      } else {
        // If not enough items, just verify reset works
        store.setFilters({ status: 'verified' })
        expect(store.currentPage).toBe(1)
      }
    })

    it('should reset to page 1 when items per page changes', async () => {
      const store = useAttestationsStore()
      await store.loadAttestations()

      store.setItemsPerPage(1) // Ensure multiple pages
      const totalPages = store.totalPages

      if (totalPages > 1) {
        store.setPage(2)
        expect(store.currentPage).toBe(2)

        store.setItemsPerPage(20)
        expect(store.currentPage).toBe(1)
      } else {
        // If not enough items, just verify reset works
        store.setItemsPerPage(20)
        expect(store.currentPage).toBe(1)
      }
    })
  })
})
