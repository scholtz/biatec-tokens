<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Token Permissions
              </h1>
              <p class="text-gray-600 dark:text-gray-300 text-lg">
                Manage token access permissions and minimize security risks
              </p>
            </div>

            <Button
              v-if="isConnected"
              @click="handleDiscover"
              :disabled="isDiscovering"
              variant="primary"
              size="lg"
            >
              <template #icon>
                <i :class="['pi', isDiscovering ? 'pi-spin pi-spinner' : 'pi-refresh', 'mr-2']"></i>
              </template>
              {{ isDiscovering ? 'Scanning...' : 'Scan Permissions' }}
            </Button>
          </div>

          <!-- Educational Banner -->
          <Card variant="glass" class="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <i class="pi pi-info-circle text-3xl text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  What are token permissions?
                </h3>
                <p class="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                  When you interact with third-party applications, you may grant them permission
                  to access your tokens. These permissions remain active even after you stop using the application.
                  Unlimited permissions can be risky if a service is compromised. Regularly reviewing and
                  revoking unused permissions is a key security practice.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <!-- Not Connected State -->
        <div v-if="!isConnected" class="text-center py-16">
          <Card variant="glass">
            <div class="py-12">
              <i class="pi pi-shield text-6xl text-gray-400 mb-6"></i>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Sign In to Your Account
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Sign in to discover and manage token permissions across your networks.
              </p>
              <Button @click="handleConnect" variant="primary" size="lg">
                <template #icon>
                  <i class="pi pi-user mr-2"></i>
                </template>
                Sign In
              </Button>
            </div>
          </Card>
        </div>

        <!-- Connected State -->
        <div v-else class="space-y-6">
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card variant="glass">
              <div class="text-center">
                <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ statistics.totalAllowances }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Total Permissions
                </div>
              </div>
            </Card>

            <Card variant="glass" class="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div class="text-center">
                <div class="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {{ statistics.unlimitedAllowances }}
                </div>
                <div class="text-sm text-red-700 dark:text-red-300 font-medium">
                  Unlimited Access
                </div>
              </div>
            </Card>

            <Card variant="glass" class="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <div class="text-center">
                <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {{ statistics.highRiskAllowances }}
                </div>
                <div class="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  High Risk
                </div>
              </div>
            </Card>

            <Card variant="glass" class="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div class="text-center">
                <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {{ statistics.dormantAllowances }}
                </div>
                <div class="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Dormant (>90 days)
                </div>
              </div>
            </Card>
          </div>

          <!-- Filters -->
          <Card variant="glass">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>

              <div class="flex flex-wrap gap-2">
                <button
                  @click="toggleFilter('unlimited')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    filters.showUnlimitedOnly
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  ]"
                >
                  <i class="pi pi-exclamation-triangle mr-2"></i>
                  Unlimited Only
                </button>

                <button
                  @click="toggleRiskFilter(AllowanceRiskLevel.CRITICAL)"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    filters.riskLevels.includes(AllowanceRiskLevel.CRITICAL)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  ]"
                >
                  Critical Risk
                </button>

                <button
                  @click="toggleRiskFilter(AllowanceRiskLevel.HIGH)"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    filters.riskLevels.includes(AllowanceRiskLevel.HIGH)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  ]"
                >
                  High Risk
                </button>

                <button
                  @click="toggleActivityFilter(AllowanceActivityStatus.DORMANT)"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    filters.activityStatuses.includes(AllowanceActivityStatus.DORMANT)
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  ]"
                >
                  Inactive >90 days
                </button>

                <button
                  v-if="hasActiveFilters"
                  @click="handleResetFilters"
                  class="px-4 py-2 rounded-lg font-medium text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  <i class="pi pi-times mr-2"></i>
                  Clear Filters
                </button>
              </div>

              <!-- Search -->
              <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by token name, symbol, or spender..."
                  class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>

          <!-- Allowances List -->
          <Card variant="glass">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Token Approvals ({{ allowances.length }})
                </h3>

                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
                  <select
                    v-model="sortField"
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="risk">Risk Level</option>
                    <option value="value">Value</option>
                    <option value="tokenName">Token Name</option>
                    <option value="spenderName">Spender</option>
                    <option value="lastInteraction">Last Used</option>
                  </select>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="allowances.length === 0 && !isLoading" class="text-center py-12">
                <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Permissions Found
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ hasActiveFilters ? 'Try adjusting your filters' : 'Click "Scan Permissions" to discover token permissions' }}
                </p>
              </div>

              <!-- Loading State -->
              <div v-else-if="isLoading" class="text-center py-12">
                <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400">Loading permissions...</p>
              </div>

              <!-- Allowances -->
              <div v-else class="space-y-3">
                <AllowanceListItem
                  v-for="allowance in allowances"
                  :key="allowance.id"
                  :allowance="allowance"
                  @revoke="handleRevoke"
                  @reduce="handleReduce"
                />
              </div>
            </div>
          </Card>

          <!-- Audit Trail -->
          <Card variant="glass">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>

                <div class="flex gap-2">
                  <Button
                    @click="downloadAuditTrail('csv')"
                    variant="outline"
                    size="sm"
                  >
                    <i class="pi pi-download mr-2"></i>
                    Export CSV
                  </Button>
                  <Button
                    @click="downloadAuditTrail('json')"
                    variant="outline"
                    size="sm"
                  >
                    <i class="pi pi-download mr-2"></i>
                    Export JSON
                  </Button>
                </div>
              </div>

              <div v-if="auditTrail.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No activity yet
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="entry in auditTrail.slice(0, 5)"
                  :key="entry.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <div
                      :class="[
                        'w-2 h-2 rounded-full',
                        entry.status === 'success' ? 'bg-green-500' :
                        entry.status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      ]"
                    ></div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ entry.actionType === 'revoke' ? 'Revoked' : entry.actionType === 'reduce' ? 'Reduced' : 'Discovered' }}
                        {{ entry.tokenSymbol }} approval
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(entry.timestamp) }}
                      </div>
                    </div>
                  </div>

                  <Badge
                    :variant="entry.status === 'success' ? 'success' : entry.status === 'failed' ? 'error' : 'warning'"
                  >
                    {{ entry.status }}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- Action Dialog -->
    <AllowanceActionDialog
      v-if="selectedAllowance"
      :is-open="showActionDialog"
      :allowance="selectedAllowance"
      :action="actionType"
      @close="showActionDialog = false"
      @confirm="handleConfirmAction"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import MainLayout from '../layout/MainLayout.vue';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Badge from '../components/ui/Badge.vue';
import AllowanceListItem from '../components/AllowanceListItem.vue';
import AllowanceActionDialog from '../components/AllowanceActionDialog.vue';
import { useAllowances } from '../composables/useAllowances';
import { useUnifiedWallet } from '../composables/useUnifiedWallet';
import type { Allowance } from '../types/allowances';
import { AllowanceSortField, SortDirection, AllowanceRiskLevel, AllowanceActivityStatus } from '../types/allowances';

const { isConnected, connect } = useUnifiedWallet();
const {
  allowances,
  statistics,
  auditTrail,
  isDiscovering,
  isLoading,
  discoverAllowances,
  revokeAllowance,
  reduceAllowance,
  setFilters,
  resetFilters,
  setSortOptions,
  downloadAuditTrail,
} = useAllowances();

// Local state
const searchQuery = ref('');
const sortField = ref<AllowanceSortField>(AllowanceSortField.RISK);
const filters = ref({
  showUnlimitedOnly: false,
  riskLevels: [] as AllowanceRiskLevel[],
  activityStatuses: [] as AllowanceActivityStatus[],
});

const showActionDialog = ref(false);
const selectedAllowance = ref<Allowance | null>(null);
const actionType = ref<'revoke' | 'reduce'>('revoke');

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.value.showUnlimitedOnly ||
    filters.value.riskLevels.length > 0 ||
    filters.value.activityStatuses.length > 0 ||
    searchQuery.value.trim().length > 0
  );
});

// Watch for filter changes
watch(
  [searchQuery, () => filters.value, sortField],
  () => {
    setFilters({
      searchQuery: searchQuery.value,
      showUnlimitedOnly: filters.value.showUnlimitedOnly,
      riskLevels: filters.value.riskLevels,
      activityStatuses: filters.value.activityStatuses,
    });

    setSortOptions({
      field: sortField.value,
      direction: SortDirection.DESC,
    });
  },
  { deep: true }
);

// Methods
const handleConnect = () => {
  connect();
};

const handleDiscover = async () => {
  await discoverAllowances();
};

const toggleFilter = (filter: string) => {
  if (filter === 'unlimited') {
    filters.value.showUnlimitedOnly = !filters.value.showUnlimitedOnly;
  }
};

const toggleRiskFilter = (risk: AllowanceRiskLevel) => {
  const index = filters.value.riskLevels.indexOf(risk);
  if (index >= 0) {
    filters.value.riskLevels.splice(index, 1);
  } else {
    filters.value.riskLevels.push(risk);
  }
};

const toggleActivityFilter = (status: AllowanceActivityStatus) => {
  const index = filters.value.activityStatuses.indexOf(status);
  if (index >= 0) {
    filters.value.activityStatuses.splice(index, 1);
  } else {
    filters.value.activityStatuses.push(status);
  }
};

const handleResetFilters = () => {
  filters.value = {
    showUnlimitedOnly: false,
    riskLevels: [],
    activityStatuses: [],
  };
  searchQuery.value = '';
  resetFilters();
};

const handleRevoke = (allowance: Allowance) => {
  selectedAllowance.value = allowance;
  actionType.value = 'revoke';
  showActionDialog.value = true;
};

const handleReduce = (allowance: Allowance) => {
  selectedAllowance.value = allowance;
  actionType.value = 'reduce';
  showActionDialog.value = true;
};

const handleConfirmAction = async (data: { allowanceId: string; newAmount?: string }) => {
  try {
    if (actionType.value === 'revoke') {
      await revokeAllowance(data.allowanceId);
    } else if (data.newAmount) {
      await reduceAllowance(data.allowanceId, data.newAmount);
    }

    showActionDialog.value = false;
    selectedAllowance.value = null;
  } catch (error) {
    console.error('Failed to execute action:', error);
    // Error handling is done in the composable
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};
</script>
