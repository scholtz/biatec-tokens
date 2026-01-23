<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
            <i class="pi pi-verified text-biatec-accent"></i>
            Compliance Attestations
          </h3>
          <p class="text-sm text-gray-400 mt-2">
            Manage and verify MICA compliance attestations for wallets and assets
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleRefresh"
            :disabled="isLoading"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <i class="pi pi-refresh" :class="{ 'animate-spin': isLoading }"></i>
            Refresh
          </button>
          <button
            @click="showExportMenu = !showExportMenu"
            class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-download"></i>
            Export
          </button>
        </div>
      </div>

      <!-- Export Menu -->
      <div
        v-if="showExportMenu"
        class="mb-6 p-4 bg-white/5 rounded-lg border border-white/10"
      >
        <h4 class="text-sm font-semibold text-gray-300 mb-3">Export Options</h4>
        <div class="flex gap-3">
          <button
            @click="handleExportCSV"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-file"></i>
            Export as CSV
          </button>
          <button
            @click="handleExportJSON"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-code"></i>
            Export as JSON
          </button>
        </div>
      </div>

      <!-- Status Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          v-for="(count, status) in statusCounts"
          :key="status"
          class="p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          :class="{ 'border-biatec-accent': filters.status === status }"
          @click="setFilters({ status: status as any })"
        >
          <div class="text-2xl font-bold text-white">{{ count }}</div>
          <div class="text-sm text-gray-400 capitalize">{{ status }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Filters
          </h4>
          <button
            @click="handleResetFilters"
            class="text-sm text-biatec-accent hover:text-biatec-accent/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              Search
            </label>
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Wallet, Asset, Issuer..."
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent text-sm"
            />
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              Type
            </label>
            <select
              v-model="filters.type"
              @change="handleFilterChange"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent text-sm"
            >
              <option value="all">All Types</option>
              <option :value="AttestationType.KYC_AML">KYC/AML</option>
              <option :value="AttestationType.ACCREDITED_INVESTOR">Accredited Investor</option>
              <option :value="AttestationType.JURISDICTION">Jurisdiction</option>
              <option :value="AttestationType.ISSUER_VERIFICATION">Issuer Verification</option>
              <option :value="AttestationType.OTHER">Other</option>
            </select>
          </div>

          <!-- Network Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              Network
            </label>
            <select
              v-model="filters.network"
              @change="handleFilterChange"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent text-sm"
            >
              <option value="all">All Networks</option>
              <option value="VOI">VOI</option>
              <option value="Aramid">Aramid</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              Status
            </label>
            <select
              v-model="filters.status"
              @change="handleFilterChange"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              Start Date
            </label>
            <input
              v-model="filters.startDate"
              @change="handleFilterChange"
              type="date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2">
              End Date
            </label>
            <input
              v-model="filters.endDate"
              @change="handleFilterChange"
              type="date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-spin pi-spinner text-biatec-accent text-4xl mb-4"></i>
      <p class="text-gray-400">Loading attestations...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-exclamation-triangle text-red-400 text-4xl mb-4"></i>
      <p class="text-white font-semibold mb-2">Failed to load attestations</p>
      <p class="text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="handleRefresh"
        class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="totalCount === 0"
      class="glass-effect rounded-xl p-12 text-center"
    >
      <i class="pi pi-inbox text-gray-500 text-4xl mb-4"></i>
      <p class="text-white font-semibold mb-2">No attestations found</p>
      <p class="text-gray-400">
        {{ filters.status !== 'all' || filters.type !== 'all' || filters.network !== 'all' || searchQuery
          ? 'Try adjusting your filters'
          : 'No attestations have been created yet'
        }}
      </p>
    </div>

    <!-- Attestations Table -->
    <div v-else class="glass-effect rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Wallet Address
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Asset ID
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Network
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Issuer
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            <tr
              v-for="attestation in paginatedAttestations"
              :key="attestation.id"
              class="hover:bg-white/5 transition-colors cursor-pointer"
              @click="handleSelectAttestation(attestation)"
            >
              <td class="px-6 py-4 text-sm text-white font-mono">
                {{ truncateAddress(attestation.walletAddress) }}
              </td>
              <td class="px-6 py-4 text-sm text-white font-mono">
                {{ truncateAddress(attestation.assetId) }}
              </td>
              <td class="px-6 py-4 text-sm text-white">
                <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {{ getAttestationTypeLabel(attestation.type) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span
                  :class="getStatusClass(attestation.status)"
                  class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ attestation.status.toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-white">
                <span :class="getNetworkClass(attestation.network)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ attestation.network }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-400">
                {{ attestation.issuerName }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-400">
                {{ formatDate(attestation.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm">
                <button
                  @click.stop="handleSelectAttestation(attestation)"
                  class="text-biatec-accent hover:text-biatec-accent/80 transition-colors"
                >
                  <i class="pi pi-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-white/10 flex items-center justify-between">
        <div class="text-sm text-gray-400">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to 
          {{ Math.min(currentPage * itemsPerPage, totalCount) }} of {{ totalCount }} results
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="setPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          <span class="text-sm text-gray-400">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="setPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Attestation Detail Modal -->
    <AttestationDetailModal
      v-if="selectedAttestation"
      :attestation="selectedAttestation"
      @close="handleCloseDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttestationsStore } from '../stores/attestations'
import { AttestationType } from '../types/compliance'
import { getAttestationTypeLabel } from '../utils/attestation'
import AttestationDetailModal from './AttestationDetailModal.vue'

interface Props {
  tokenId?: string
  network?: 'VOI' | 'Aramid'
}

const props = defineProps<Props>()

const store = useAttestationsStore()
const {
  filters,
  isLoading,
  error,
  paginatedAttestations,
  totalCount,
  totalPages,
  currentPage,
  itemsPerPage,
  statusCounts,
  selectedAttestation
} = storeToRefs(store)

const { setFilters, resetFilters, setPage, loadAttestations, downloadCSV, downloadJSON, selectAttestation } = store

const showExportMenu = ref(false)
const searchQuery = ref('')
const searchDebounceTimer = ref<number | null>(null)

const debouncedSearch = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  searchDebounceTimer.value = window.setTimeout(() => {
    setFilters({ search: searchQuery.value })
  }, 300)
}

const handleFilterChange = () => {
  // Filters are already bound to v-model, just trigger the reactive update
  setFilters({})
}

const handleResetFilters = () => {
  resetFilters()
  searchQuery.value = ''
}

const handleRefresh = () => {
  loadAttestations(props.tokenId, props.network)
}

const handleExportCSV = () => {
  downloadCSV()
  showExportMenu.value = false
}

const handleExportJSON = () => {
  downloadJSON()
  showExportMenu.value = false
}

const handleSelectAttestation = (attestation: any) => {
  selectAttestation(attestation)
}

const handleCloseDetail = () => {
  selectAttestation(null)
}

const truncateAddress = (address: string) => {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-green-500/20 text-green-400'
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'rejected':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const getNetworkClass = (network: string) => {
  switch (network) {
    case 'VOI':
      return 'bg-purple-500/20 text-purple-400'
    case 'Aramid':
      return 'bg-cyan-500/20 text-cyan-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

onMounted(() => {
  loadAttestations(props.tokenId, props.network)
})
</script>
