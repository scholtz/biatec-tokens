import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WalletAttestation, Network } from '../types/compliance'
import { AttestationType } from '../types/compliance'

export interface AttestationFilters {
  wallet?: string
  asset?: string
  issuer?: string
  status?: 'pending' | 'verified' | 'rejected' | 'all'
  type?: AttestationType | 'all'
  network?: Network | 'all'
  startDate?: string
  endDate?: string
  search?: string
}

export interface AttestationListItem extends WalletAttestation {
  walletAddress: string
  assetId: string
  issuerName: string
  network: Network
  createdAt: string
}

export const useAttestationsStore = defineStore('attestations', () => {
  const attestations = ref<AttestationListItem[]>([])
  const filters = ref<AttestationFilters>({
    status: 'all',
    type: 'all',
    network: 'all'
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedAttestation = ref<AttestationListItem | null>(null)

  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  const filteredAttestations = computed(() => {
    let filtered = attestations.value

    // Filter by wallet address
    if (filters.value.wallet) {
      const walletLower = filters.value.wallet.toLowerCase()
      filtered = filtered.filter(a => 
        a.walletAddress.toLowerCase().includes(walletLower)
      )
    }

    // Filter by asset ID
    if (filters.value.asset) {
      const assetLower = filters.value.asset.toLowerCase()
      filtered = filtered.filter(a => 
        a.assetId.toLowerCase().includes(assetLower)
      )
    }

    // Filter by issuer
    if (filters.value.issuer) {
      const issuerLower = filters.value.issuer.toLowerCase()
      filtered = filtered.filter(a => 
        a.issuerName.toLowerCase().includes(issuerLower)
      )
    }

    // Filter by status
    if (filters.value.status && filters.value.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.value.status)
    }

    // Filter by type
    if (filters.value.type && filters.value.type !== 'all') {
      filtered = filtered.filter(a => a.type === filters.value.type)
    }

    // Filter by network
    if (filters.value.network && filters.value.network !== 'all') {
      filtered = filtered.filter(a => a.network === filters.value.network)
    }

    // Filter by date range
    if (filters.value.startDate) {
      const startDate = new Date(filters.value.startDate)
      filtered = filtered.filter(a => new Date(a.createdAt) >= startDate)
    }

    if (filters.value.endDate) {
      const endDate = new Date(filters.value.endDate)
      filtered = filtered.filter(a => new Date(a.createdAt) <= endDate)
    }

    // Search across multiple fields
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      filtered = filtered.filter(a => 
        a.walletAddress.toLowerCase().includes(searchLower) ||
        a.assetId.toLowerCase().includes(searchLower) ||
        a.issuerName.toLowerCase().includes(searchLower) ||
        (a.notes && a.notes.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  })

  const paginatedAttestations = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredAttestations.value.slice(start, end)
  })

  const totalPages = computed(() => 
    Math.ceil(filteredAttestations.value.length / itemsPerPage.value)
  )

  const totalCount = computed(() => filteredAttestations.value.length)

  const statusCounts = computed(() => ({
    all: attestations.value.length,
    pending: attestations.value.filter(a => a.status === 'pending').length,
    verified: attestations.value.filter(a => a.status === 'verified').length,
    rejected: attestations.value.filter(a => a.status === 'rejected').length
  }))

  const setFilters = (newFilters: Partial<AttestationFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1 // Reset to first page when filters change
  }

  const resetFilters = () => {
    filters.value = {
      status: 'all',
      type: 'all',
      network: 'all'
    }
    currentPage.value = 1
  }

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const setItemsPerPage = (count: number) => {
    itemsPerPage.value = count
    currentPage.value = 1
  }

  const selectAttestation = (attestation: AttestationListItem | null) => {
    selectedAttestation.value = attestation
  }

  const loadAttestations = async (tokenId?: string, network?: Network) => {
    isLoading.value = true
    error.value = null

    try {
      // TODO: Replace with actual backend API call
      // Expected endpoint: GET /api/v1/attestations?tokenId={tokenId}&network={network}
      // Backend should return AttestationListItem[] with proper pagination support
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock data for demonstration
      const mockAttestations: AttestationListItem[] = [
        {
          id: 'att-001',
          type: AttestationType.KYC_AML,
          status: 'verified',
          walletAddress: 'ADDR123...XYZ',
          assetId: tokenId || 'ASA-12345',
          issuerName: 'Acme Compliance Inc.',
          network: network || 'VOI',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          verifiedBy: 'compliance@acme.com',
          proofHash: '0x1234567890abcdef',
          notes: 'KYC verification completed successfully'
        },
        {
          id: 'att-002',
          type: AttestationType.ACCREDITED_INVESTOR,
          status: 'pending',
          walletAddress: 'ADDR456...ABC',
          assetId: tokenId || 'ASA-12345',
          issuerName: 'RegTech Solutions',
          network: network || 'Aramid',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Awaiting document verification'
        },
        {
          id: 'att-003',
          type: AttestationType.JURISDICTION,
          status: 'verified',
          walletAddress: 'ADDR789...DEF',
          assetId: tokenId || 'ASA-67890',
          issuerName: 'Global Compliance Ltd.',
          network: 'VOI',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          verifiedBy: 'admin@globalcompliance.com',
          proofHash: '0xabcdef1234567890',
          notes: 'Jurisdiction compliance verified for EU'
        }
      ]

      attestations.value = mockAttestations
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load attestations'
      console.error('Error loading attestations:', err)
    } finally {
      isLoading.value = false
    }
  }

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Type',
      'Status',
      'Wallet Address',
      'Asset ID',
      'Issuer',
      'Network',
      'Created At',
      'Verified At',
      'Verified By',
      'Proof Hash',
      'Notes'
    ]

    // Helper function to escape CSV values
    const escapeCsvValue = (value: string) => {
      if (value.includes('"') || value.includes(',') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return `"${value}"`
    }

    const rows = filteredAttestations.value.map(a => [
      a.id,
      a.type,
      a.status,
      a.walletAddress,
      a.assetId,
      a.issuerName,
      a.network,
      a.createdAt,
      a.verifiedAt || '',
      a.verifiedBy || '',
      a.proofHash || '',
      a.notes || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => escapeCsvValue(cell)).join(','))
    ].join('\n')

    return csv
  }

  const exportToJSON = () => {
    return JSON.stringify(filteredAttestations.value, null, 2)
  }

  const downloadCSV = () => {
    const csv = exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attestations-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadJSON = () => {
    const json = exportToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attestations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    attestations,
    filters,
    isLoading,
    error,
    selectedAttestation,
    currentPage,
    itemsPerPage,
    filteredAttestations,
    paginatedAttestations,
    totalPages,
    totalCount,
    statusCounts,
    setFilters,
    resetFilters,
    setPage,
    setItemsPerPage,
    selectAttestation,
    loadAttestations,
    exportToCSV,
    exportToJSON,
    downloadCSV,
    downloadJSON
  }
})
