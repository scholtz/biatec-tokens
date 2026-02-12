<template>
  <div class="glass-effect rounded-xl p-6">
    <!-- Filters and Search -->
    <div class="mb-6 space-y-4">
      <!-- Search Bar -->
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, or organization..."
              class="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
              @input="debouncedSearch"
            />
          </div>
        </div>
        <button
          @click="showFilters = !showFilters"
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <i class="pi pi-filter"></i>
          <span>Filters</span>
          <span v-if="activeFilterCount > 0" class="px-2 py-0.5 bg-biatec-accent rounded-full text-xs">{{ activeFilterCount }}</span>
        </button>
      </div>

      <!-- Filter Panel -->
      <div v-if="showFilters" class="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              v-model="selectedStatus"
              multiple
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <!-- Entity Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Entity Type</label>
            <select
              v-model="selectedEntityType"
              multiple
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
            >
              <option value="individual">Individual</option>
              <option value="institutional">Institutional</option>
              <option value="corporate">Corporate</option>
              <option value="trust">Trust</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Risk Level Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
            <select
              v-model="selectedRiskLevel"
              multiple
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex justify-end gap-2">
          <button
            @click="clearFilters"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Clear Filters
          </button>
          <button
            @click="applyFilters"
            class="px-4 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="px-4 py-3 text-left">
              <button
                @click="sort('name')"
                class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Name
                <i :class="getSortIcon('name')"></i>
              </button>
            </th>
            <th class="px-4 py-3 text-left">
              <span class="text-sm font-medium text-gray-300">Organization</span>
            </th>
            <th class="px-4 py-3 text-left">
              <button
                @click="sort('status')"
                class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Status
                <i :class="getSortIcon('status')"></i>
              </button>
            </th>
            <th class="px-4 py-3 text-left">
              <span class="text-sm font-medium text-gray-300">Jurisdiction</span>
            </th>
            <th class="px-4 py-3 text-left">
              <button
                @click="sort('riskLevel')"
                class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Risk Level
                <i :class="getSortIcon('riskLevel')"></i>
              </button>
            </th>
            <th class="px-4 py-3 text-left">
              <button
                @click="sort('updatedAt')"
                class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Last Updated
                <i :class="getSortIcon('updatedAt')"></i>
              </button>
            </th>
            <th class="px-4 py-3 text-right">
              <span class="text-sm font-medium text-gray-300">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading" class="border-b border-gray-800">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
              <p class="mt-2">Loading whitelist entries...</p>
            </td>
          </tr>
          <tr v-else-if="entries.length === 0" class="border-b border-gray-800">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p>No whitelist entries found</p>
              <p class="text-sm mt-1">Try adjusting your filters or add a new entry</p>
            </td>
          </tr>
          <tr
            v-else
            v-for="entry in entries"
            :key="entry.id"
            class="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex flex-col">
                <span class="text-white font-medium">{{ entry.name }}</span>
                <span class="text-xs text-gray-400">{{ entry.email }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-gray-300">{{ entry.organizationName || '-' }}</span>
            </td>
            <td class="px-4 py-3">
              <Badge :variant="getStatusVariant(entry.status)">
                {{ formatStatus(entry.status) }}
              </Badge>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-gray-300">{{ entry.jurisdictionName }}</span>
                <Badge v-if="hasConflict(entry.id)" variant="error" class="text-xs">
                  <i class="pi pi-exclamation-triangle"></i>
                </Badge>
              </div>
            </td>
            <td class="px-4 py-3">
              <Badge :variant="getRiskVariant(entry.riskLevel)">
                {{ formatRiskLevel(entry.riskLevel) }}
              </Badge>
            </td>
            <td class="px-4 py-3">
              <span class="text-gray-400 text-sm">{{ formatDate(entry.updatedAt) }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  @click="$emit('view-details', entry)"
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Details"
                >
                  <i class="pi pi-eye"></i>
                </button>
                <button
                  v-if="entry.status === 'pending' || entry.status === 'under_review'"
                  @click="$emit('approve', entry)"
                  class="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Approve"
                >
                  <i class="pi pi-check"></i>
                </button>
                <button
                  v-if="entry.status === 'pending' || entry.status === 'under_review'"
                  @click="$emit('reject', entry)"
                  class="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Reject"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
      <div class="text-sm text-gray-400">
        Showing {{ (pagination.page - 1) * pagination.perPage + 1 }} to
        {{ Math.min(pagination.page * pagination.perPage, pagination.total) }} of {{ pagination.total }} entries
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <span class="text-white px-4">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWhitelistStore } from '../../stores/whitelist';
import Badge from '../ui/Badge.vue';
import type { WhitelistEntry, WhitelistEntryStatus, RiskLevel, EntityType } from '../../types/whitelist';

interface Props {
  conflicts?: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'view-details': [entry: WhitelistEntry];
  'approve': [entry: WhitelistEntry];
  'reject': [entry: WhitelistEntry];
}>();

const whitelistStore = useWhitelistStore();

const searchQuery = ref('');
const showFilters = ref(false);
const selectedStatus = ref<WhitelistEntryStatus[]>([]);
const selectedEntityType = ref<EntityType[]>([]);
const selectedRiskLevel = ref<RiskLevel[]>([]);

const entries = computed(() => whitelistStore.entries);
const isLoading = computed(() => whitelistStore.isLoading);
const pagination = computed(() => whitelistStore.pagination);

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedStatus.value.length > 0) count++;
  if (selectedEntityType.value.length > 0) count++;
  if (selectedRiskLevel.value.length > 0) count++;
  if (searchQuery.value) count++;
  return count;
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
};

const applyFilters = () => {
  whitelistStore.setFilters({
    searchQuery: searchQuery.value || undefined,
    status: selectedStatus.value.length > 0 ? selectedStatus.value : undefined,
    entityType: selectedEntityType.value.length > 0 ? selectedEntityType.value : undefined,
    riskLevel: selectedRiskLevel.value.length > 0 ? selectedRiskLevel.value : undefined,
    page: 1,
  });
  whitelistStore.fetchWhitelistEntries();
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedStatus.value = [];
  selectedEntityType.value = [];
  selectedRiskLevel.value = [];
  whitelistStore.resetFilters();
  whitelistStore.fetchWhitelistEntries();
};

const sort = (field: 'name' | 'status' | 'riskLevel' | 'updatedAt') => {
  const currentFilters = whitelistStore.filters;
  const newOrder =
    currentFilters.sortBy === field && currentFilters.sortOrder === 'asc' ? 'desc' : 'asc';
  
  whitelistStore.setFilters({
    sortBy: field,
    sortOrder: newOrder,
  });
  whitelistStore.fetchWhitelistEntries();
};

const getSortIcon = (field: string) => {
  const currentFilters = whitelistStore.filters;
  if (currentFilters.sortBy !== field) return 'pi pi-sort-alt text-gray-500';
  return currentFilters.sortOrder === 'asc' ? 'pi pi-sort-amount-up-alt text-biatec-accent' : 'pi pi-sort-amount-down text-biatec-accent';
};

const changePage = (page: number) => {
  whitelistStore.setFilters({ page });
  whitelistStore.fetchWhitelistEntries();
};

const getStatusVariant = (status: WhitelistEntryStatus): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
    case 'under_review':
      return 'warning';
    case 'rejected':
    case 'expired':
      return 'error';
    default:
      return 'default';
  }
};

const getRiskVariant = (risk: RiskLevel): 'success' | 'warning' | 'error' | 'default' => {
  switch (risk) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};

const formatStatus = (status: WhitelistEntryStatus): string => {
  const statusMap: Record<WhitelistEntryStatus, string> = {
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    under_review: 'Under Review',
    expired: 'Expired',
  };
  return statusMap[status] || status;
};

const formatRiskLevel = (risk: RiskLevel): string => {
  const riskMap: Record<RiskLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return riskMap[risk] || risk;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const hasConflict = (entryId: string): boolean => {
  return props.conflicts?.includes(entryId) || false;
};

onMounted(() => {
  whitelistStore.fetchWhitelistEntries();
});
</script>
