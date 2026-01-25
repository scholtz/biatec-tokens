<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <button
            @click="$router.back()"
            class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <i class="pi pi-arrow-left"></i>
            <span>Back</span>
          </button>

          <div class="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i class="pi pi-chart-line text-biatec-accent"></i>
                Compliance Monitoring Dashboard
              </h1>
              <p class="text-gray-400">
                Enterprise-grade compliance observability for VOI/Aramid networks
              </p>
            </div>

            <!-- Export Button -->
            <button
              @click="handleExport"
              :disabled="isExporting"
              class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
              <span>{{ isExporting ? 'Exporting...' : 'Export CSV' }}</span>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="mb-8 glass-effect rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-white flex items-center gap-2">
              <i class="pi pi-filter"></i>
              Filters
            </h2>
            <button
              v-if="hasActiveFilters"
              @click="resetFilters"
              class="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Network Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Network</label>
              <select
                v-model="filters.network"
                @change="updateUrlAndFetch"
                class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
              >
                <option value="all">All Networks</option>
                <option value="VOI">VOI Mainnet</option>
                <option value="Aramid">Aramid Mainnet</option>
              </select>
            </div>

            <!-- Asset ID Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Asset ID</label>
              <input
                v-model="filters.assetId"
                @change="updateUrlAndFetch"
                type="text"
                placeholder="Optional asset ID"
                class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-biatec-accent"
              />
            </div>

            <!-- Start Date Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
              <input
                v-model="filters.startDate"
                @change="updateUrlAndFetch"
                type="date"
                class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
              />
            </div>

            <!-- End Date Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">End Date</label>
              <input
                v-model="filters.endDate"
                @change="updateUrlAndFetch"
                type="date"
                class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
              />
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center py-16">
          <div class="text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
            <p class="text-gray-400">Loading compliance metrics...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="glass-effect rounded-xl p-8 text-center">
          <i class="pi pi-exclamation-triangle text-5xl text-red-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-white mb-2">Failed to Load Compliance Data</h3>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <button
            @click="loadData"
            class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="!metrics" class="glass-effect rounded-xl p-8 text-center">
          <i class="pi pi-inbox text-5xl text-gray-500 mb-4"></i>
          <h3 class="text-xl font-semibold text-white mb-2">No Compliance Data Available</h3>
          <p class="text-gray-400 mb-6">
            There is no compliance monitoring data for the selected filters.
          </p>
          <button
            @click="resetFilters"
            class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
          <!-- Overall Compliance Score -->
          <div class="mb-8 glass-effect rounded-xl p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-400 mb-1">Overall Compliance Score</h2>
                <div class="flex items-baseline gap-3">
                  <span class="text-5xl font-bold text-white">{{ metrics.overallComplianceScore }}</span>
                  <span class="text-2xl text-gray-400">/100</span>
                </div>
              </div>
              <div
                :class="[
                  'w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold',
                  getScoreColor(metrics.overallComplianceScore)
                ]"
              >
                {{ getScoreGrade(metrics.overallComplianceScore) }}
              </div>
            </div>
          </div>

          <!-- Metrics Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Whitelist Enforcement Card -->
            <div class="glass-effect rounded-xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <i class="pi pi-shield-check text-biatec-accent"></i>
                  Whitelist Enforcement
                </h3>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Total Addresses</span>
                  <span class="text-lg font-semibold text-white">
                    {{ metrics.whitelistEnforcement.totalAddresses }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Active</span>
                  <span class="text-lg font-semibold text-green-400">
                    {{ metrics.whitelistEnforcement.activeAddresses }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Pending</span>
                  <span class="text-lg font-semibold text-yellow-400">
                    {{ metrics.whitelistEnforcement.pendingAddresses }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Removed</span>
                  <span class="text-lg font-semibold text-red-400">
                    {{ metrics.whitelistEnforcement.removedAddresses }}
                  </span>
                </div>

                <div class="pt-3 border-t border-gray-700">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-400">Enforcement Rate</span>
                    <span class="text-lg font-bold text-biatec-accent">
                      {{ metrics.whitelistEnforcement.enforcementRate.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-biatec-accent rounded-full h-2 transition-all"
                      :style="{ width: `${metrics.whitelistEnforcement.enforcementRate}%` }"
                    ></div>
                  </div>
                </div>

                <div v-if="metrics.whitelistEnforcement.recentViolations > 0" class="pt-3 border-t border-gray-700">
                  <div class="flex items-center gap-2 text-red-400">
                    <i class="pi pi-exclamation-circle"></i>
                    <span class="text-sm">
                      {{ metrics.whitelistEnforcement.recentViolations }} recent violation(s)
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-4 text-xs text-gray-500">
                Last updated: {{ formatTimestamp(metrics.whitelistEnforcement.lastUpdated) }}
              </div>
            </div>

            <!-- Audit Health Card -->
            <div class="glass-effect rounded-xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <i class="pi pi-list text-biatec-accent"></i>
                  Audit Health
                </h3>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Total Entries</span>
                  <span class="text-lg font-semibold text-white">
                    {{ metrics.auditHealth.totalAuditEntries }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Successful</span>
                  <span class="text-lg font-semibold text-green-400">
                    {{ metrics.auditHealth.successfulActions }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Failed</span>
                  <span class="text-lg font-semibold text-red-400">
                    {{ metrics.auditHealth.failedActions }}
                  </span>
                </div>

                <div class="pt-3 border-t border-gray-700">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-400">Audit Coverage</span>
                    <span class="text-lg font-bold text-biatec-accent">
                      {{ metrics.auditHealth.auditCoverage.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-biatec-accent rounded-full h-2 transition-all"
                      :style="{ width: `${metrics.auditHealth.auditCoverage}%` }"
                    ></div>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-700 space-y-2">
                  <div v-if="metrics.auditHealth.criticalIssues > 0" class="flex items-center gap-2 text-red-400">
                    <i class="pi pi-times-circle"></i>
                    <span class="text-sm">{{ metrics.auditHealth.criticalIssues }} critical issue(s)</span>
                  </div>
                  <div v-if="metrics.auditHealth.warningIssues > 0" class="flex items-center gap-2 text-yellow-400">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="text-sm">{{ metrics.auditHealth.warningIssues }} warning(s)</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 text-xs text-gray-500">
                Last audit: {{ formatTimestamp(metrics.auditHealth.lastAuditTimestamp) }}
              </div>
            </div>

            <!-- Retention Status Card -->
            <div class="glass-effect rounded-xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <i class="pi pi-database text-biatec-accent"></i>
                  Retention Status
                </h3>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Total Records</span>
                  <span class="text-lg font-semibold text-white">
                    {{ metrics.retentionStatus.totalRecords }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Active</span>
                  <span class="text-lg font-semibold text-green-400">
                    {{ metrics.retentionStatus.activeRecords }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Archived</span>
                  <span class="text-lg font-semibold text-blue-400">
                    {{ metrics.retentionStatus.archivedRecords }}
                  </span>
                </div>

                <div class="pt-3 border-t border-gray-700">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-400">Retention Compliance</span>
                    <span class="text-lg font-bold text-biatec-accent">
                      {{ metrics.retentionStatus.retentionCompliance.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-biatec-accent rounded-full h-2 transition-all"
                      :style="{ width: `${metrics.retentionStatus.retentionCompliance}%` }"
                    ></div>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-700 space-y-2">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400">Retention Policy</span>
                    <span class="text-white">{{ metrics.retentionStatus.retentionPolicyDays }} days</span>
                  </div>
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400">Oldest Record</span>
                    <span class="text-white">{{ formatDate(metrics.retentionStatus.oldestRecord) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 text-xs text-gray-500">
                Last updated: {{ formatTimestamp(metrics.retentionStatus.lastUpdated) }}
              </div>
            </div>
          </div>

          <!-- MICA Compliance Information -->
          <div class="glass-effect rounded-xl p-6">
            <div class="flex items-start gap-4">
              <i class="pi pi-info-circle text-biatec-accent text-2xl"></i>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">MICA Compliance</h3>
                <p class="text-gray-400 text-sm leading-relaxed">
                  This dashboard provides enterprise-grade compliance observability aligned with the Markets in 
                  Crypto-Assets (MICA) regulation. All metrics are designed to support regulatory reporting, 
                  internal audits, and Real-World Asset (RWA) token management on VOI and Aramid networks.
                </p>
                <p class="text-gray-400 text-sm leading-relaxed mt-3">
                  Use the filters above to customize the view and the Export CSV button to generate reports 
                  for regulators and internal compliance teams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '../layout/MainLayout.vue';
import { complianceService } from '../services/ComplianceService';
import type {
  ComplianceMonitoringMetrics,
  ComplianceMonitoringFilters,
  Network,
} from '../types/compliance';

const route = useRoute();
const router = useRouter();

// Type guard for Network
const isNetwork = (value: string): value is Network => {
  return value === 'VOI' || value === 'Aramid';
};

// Utility function for CSV filename
const generateCsvFilename = (): string => {
  return `compliance-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
};

// State
const metrics = ref<ComplianceMonitoringMetrics | null>(null);
const isLoading = ref(false);
const isExporting = ref(false);
const error = ref<string | null>(null);

// Filters from URL params with type safety
const filters = ref<ComplianceMonitoringFilters>({
  network: (route.query.network && isNetwork(route.query.network as string))
    ? route.query.network as Network
    : (route.query.network === 'all' ? 'all' : 'all'),
  assetId: route.query.assetId as string,
  startDate: route.query.startDate as string,
  endDate: route.query.endDate as string,
});

// Computed
const hasActiveFilters = computed(() => {
  return (
    (filters.value.network && filters.value.network !== 'all') ||
    !!filters.value.assetId ||
    !!filters.value.startDate ||
    !!filters.value.endDate
  );
});

// Methods
const loadData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    metrics.value = await complianceService.getMonitoringMetrics(filters.value);
  } catch (err: any) {
    console.error('Failed to load monitoring metrics:', err);
    
    // Provide specific error messages
    if (err.response?.status === 401) {
      error.value = 'Unauthorized access. Please ensure you are logged in.';
    } else if (err.response?.status === 403) {
      error.value = 'Access denied. You do not have permission to view compliance data.';
    } else if (err.response?.status === 404) {
      error.value = 'Compliance monitoring endpoint not found. Please contact support.';
    } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
      error.value = 'Cannot connect to the server. Please check your network connection.';
    } else {
      error.value = err.message || 'An unexpected error occurred while loading compliance data.';
    }
    
    // Set mock data for development/demo purposes when API fails
    if (process.env.NODE_ENV === 'development') {
      metrics.value = getMockMetrics();
    }
  } finally {
    isLoading.value = false;
  }
};

const updateUrlAndFetch = () => {
  // Update URL with current filters
  const query: any = {};
  if (filters.value.network && filters.value.network !== 'all') {
    query.network = filters.value.network;
  }
  if (filters.value.assetId) query.assetId = filters.value.assetId;
  if (filters.value.startDate) query.startDate = filters.value.startDate;
  if (filters.value.endDate) query.endDate = filters.value.endDate;

  router.push({ query });
  loadData();
};

const resetFilters = () => {
  filters.value = {
    network: 'all',
    assetId: undefined,
    startDate: undefined,
    endDate: undefined,
  };
  updateUrlAndFetch();
};

const handleExport = async () => {
  isExporting.value = true;

  try {
    const csvData = await complianceService.exportMonitoringData(filters.value);
    
    // Create a blob and download
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateCsvFilename());
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    console.error('Failed to export monitoring data:', err);
    error.value = 'Failed to export data. Please try again.';
  } finally {
    isExporting.value = false;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-yellow-500/20 text-yellow-400';
  if (score >= 50) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
};

const getScoreGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Mock data for development
const getMockMetrics = (): ComplianceMonitoringMetrics => {
  const networkValue = filters.value.network;
  const network: Network = (networkValue === 'all' || !networkValue || !isNetwork(networkValue)) ? 'VOI' : networkValue;
  
  return {
    network,
    assetId: filters.value.assetId,
    whitelistEnforcement: {
      totalAddresses: 1247,
      activeAddresses: 1182,
      pendingAddresses: 43,
      removedAddresses: 22,
      enforcementRate: 94.8,
      recentViolations: 3,
      lastUpdated: new Date().toISOString(),
    },
    auditHealth: {
      totalAuditEntries: 8924,
      successfulActions: 8756,
      failedActions: 168,
      criticalIssues: 2,
      warningIssues: 15,
      auditCoverage: 98.1,
      lastAuditTimestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    retentionStatus: {
      totalRecords: 15832,
      activeRecords: 12456,
      archivedRecords: 3376,
      retentionCompliance: 99.2,
      oldestRecord: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
      retentionPolicyDays: 730,
      lastUpdated: new Date().toISOString(),
    },
    overallComplianceScore: 92,
    lastUpdated: new Date().toISOString(),
  };
};

// Lifecycle
onMounted(() => {
  loadData();
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      network: (newQuery.network && isNetwork(newQuery.network as string))
        ? newQuery.network as Network
        : (newQuery.network === 'all' ? 'all' : 'all'),
      assetId: newQuery.assetId as string,
      startDate: newQuery.startDate as string,
      endDate: newQuery.endDate as string,
    };
    loadData();
  }
);
</script>
