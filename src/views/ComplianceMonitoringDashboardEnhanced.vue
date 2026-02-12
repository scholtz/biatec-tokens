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
                Enterprise-grade compliance observability and audit-ready reporting
              </p>
            </div>
          </div>
        </div>

        <!-- View Toggle Tabs -->
        <div class="mb-8 flex gap-2">
          <button
            @click="activeView = 'tokens'"
            class="px-4 py-2 rounded-lg transition-colors"
            :class="activeView === 'tokens'
              ? 'bg-biatec-accent text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'"
          >
            <i class="pi pi-shield-check mr-2"></i>
            Token Compliance
          </button>
          <button
            @click="activeView = 'metrics'"
            class="px-4 py-2 rounded-lg transition-colors"
            :class="activeView === 'metrics'
              ? 'bg-biatec-accent text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'"
          >
            <i class="pi pi-chart-bar mr-2"></i>
            Network Metrics
          </button>
          <button
            @click="activeView === 'gaps'"
            class="px-4 py-2 rounded-lg transition-colors"
            :class="activeView === 'gaps'
              ? 'bg-biatec-accent text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'"
          >
            <i class="pi pi-exclamation-triangle mr-2"></i>
            Compliance Gaps
          </button>
          <button
            @click="activeView = 'export'"
            class="px-4 py-2 rounded-lg transition-colors"
            :class="activeView === 'export'
              ? 'bg-biatec-accent text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'"
          >
            <i class="pi pi-download mr-2"></i>
            Export Evidence
          </button>
        </div>

        <!-- Token Compliance View -->
        <div v-if="activeView === 'tokens'">
          <div class="mb-6">
            <h2 class="text-2xl font-semibold text-white mb-4">Token Compliance Summary</h2>
            <p class="text-gray-400 mb-6">
              Review MICA readiness, attestation coverage, and audit trail status for each token.
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingTokens" class="flex justify-center items-center py-16">
            <div class="text-center">
              <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
              <p class="text-gray-400">Loading token compliance data...</p>
            </div>
          </div>

          <!-- Token Cards Grid -->
          <div v-else-if="tokens.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TokenComplianceSummaryCard
              v-for="token in tokens"
              :key="token.id"
              :token="token"
              :gaps="tokenGaps[token.id] || {}"
              :audit-entry-count="tokenAuditCounts[token.id] || 0"
              @view-details="handleViewTokenDetails"
              @export-evidence="handleExportTokenEvidence"
            />
          </div>

          <!-- Empty State -->
          <div v-else class="glass-effect rounded-xl p-8 text-center">
            <i class="pi pi-inbox text-5xl text-gray-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-white mb-2">No Tokens Found</h3>
            <p class="text-gray-400 mb-6">
              Create your first token to start monitoring compliance.
            </p>
            <router-link
              to="/create/wizard"
              class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <i class="pi pi-plus"></i>
              Create Token
            </router-link>
          </div>
        </div>

        <!-- Network Metrics View (Original Dashboard Content) -->
        <div v-if="activeView === 'metrics'">
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
              @click="loadMetricsData"
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

            <!-- Export Button -->
            <div class="mb-8 flex justify-center">
              <button
                @click="handleMetricsExport"
                :disabled="isExporting"
                class="px-6 py-3 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
                <span>{{ isExporting ? 'Exporting...' : 'Export Network Metrics (CSV)' }}</span>
              </button>
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
                    Use the filters above to customize the view and the Export button to generate reports 
                    for regulators and internal compliance teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Gaps View -->
        <div v-if="activeView === 'gaps'">
          <ComplianceGapList
            :gaps="allComplianceGaps"
            :token-name-map="tokenNameMap"
          />
        </div>

        <!-- Export Evidence View -->
        <div v-if="activeView === 'export'">
          <AuditEvidenceExport
            :available-tokens="tokens"
            @export="handleAuditExport"
          />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '../layout/MainLayout.vue';
import TokenComplianceSummaryCard from '../components/compliance/TokenComplianceSummaryCard.vue';
import ComplianceGapList, { type ComplianceGap } from '../components/compliance/ComplianceGapList.vue';
import AuditEvidenceExport from '../components/compliance/AuditEvidenceExport.vue';
import { complianceService } from '../services/ComplianceService';
import { useTokenStore } from '../stores/tokens';
import type {
  ComplianceMonitoringMetrics,
  ComplianceMonitoringFilters,
  Network,
} from '../types/compliance';
import type { ComplianceGaps } from '../components/compliance/TokenComplianceSummaryCard.vue';

const route = useRoute();
const router = useRouter();
const tokenStore = useTokenStore();

// Type guard for Network
const isNetwork = (value: string): value is Network => {
  return value === 'VOI' || value === 'Aramid';
};

// Utility function for CSV filename
const generateCsvFilename = (): string => {
  return `compliance-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
};

// State
const activeView = ref<'tokens' | 'metrics' | 'gaps' | 'export'>('tokens');
const metrics = ref<ComplianceMonitoringMetrics | null>(null);
const isLoading = ref(false);
const isLoadingTokens = ref(false);
const isExporting = ref(false);
const error = ref<string | null>(null);

// Token data
const tokens = computed(() => tokenStore.tokens);
const tokenGaps = ref<Record<string, ComplianceGaps>>({});
const tokenAuditCounts = ref<Record<string, number>>({});

// Token name map for gap list
const tokenNameMap = computed(() => {
  const map: Record<string, string> = {};
  tokens.value.forEach(token => {
    map[token.id] = token.name;
  });
  return map;
});

// Filters from URL params with type safety
const filters = ref<ComplianceMonitoringFilters>({
  network: (() => {
    const networkValue = Array.isArray(route.query.network) ? route.query.network[0] : route.query.network;
    return (networkValue && isNetwork(networkValue))
      ? networkValue as Network
      : (networkValue === 'all' ? 'all' : 'all');
  })(),
  assetId: (Array.isArray(route.query.assetId) ? route.query.assetId[0] : route.query.assetId) || '',
  startDate: (Array.isArray(route.query.startDate) ? route.query.startDate[0] : route.query.startDate) || '',
  endDate: (Array.isArray(route.query.endDate) ? route.query.endDate[0] : route.query.endDate) || '',
});

// Watch for route query changes
watch(
  () => route.query,
  (newQuery) => {
    const networkValue = Array.isArray(newQuery.network) ? newQuery.network[0] : newQuery.network;
    const assetIdValue = Array.isArray(newQuery.assetId) ? newQuery.assetId[0] : newQuery.assetId;
    const startDateValue = Array.isArray(newQuery.startDate) ? newQuery.startDate[0] : newQuery.startDate;
    const endDateValue = Array.isArray(newQuery.endDate) ? newQuery.endDate[0] : newQuery.endDate;
    
    filters.value = {
      network: (networkValue && isNetwork(networkValue))
        ? networkValue as Network
        : (networkValue === 'all' ? 'all' : 'all'),
      assetId: assetIdValue || '',
      startDate: startDateValue || '',
      endDate: endDateValue || '',
    };
  },
  { immediate: false }
);

// Computed
const hasActiveFilters = computed(() => {
  return (
    (filters.value.network && filters.value.network !== 'all') ||
    !!filters.value.assetId ||
    !!filters.value.startDate ||
    !!filters.value.endDate
  );
});

// All compliance gaps aggregated
const allComplianceGaps = computed((): ComplianceGap[] => {
  const gaps: ComplianceGap[] = [];
  
  // Aggregate gaps from all tokens
  tokens.value.forEach(token => {
    const tokenGap = tokenGaps.value[token.id];
    if (!tokenGap) return;
    
    // Missing attestations
    if (tokenGap.missingAttestations && tokenGap.missingAttestations.length > 0) {
      const existing = gaps.find(g => g.title === 'Missing Required Attestations');
      if (existing) {
        existing.affectedTokens = [...(existing.affectedTokens || []), token.id];
      } else {
        gaps.push({
          severity: 'high',
          title: 'Missing Required Attestations',
          description: 'Some tokens are missing required attestation documentation for regulatory compliance.',
          remediation: 'Complete the attestation process for each token. Go to the token detail page and click "Manage Attestations" to upload KYC/AML verification, jurisdiction approvals, and issuer verification documents.',
          affectedTokens: [token.id],
          actionUrl: `/tokens/${token.id}`,
          actionLabel: 'Manage Attestations',
          detectedAt: new Date().toISOString(),
        });
      }
    }
    
    // Incomplete jurisdiction
    if (tokenGap.incompleteJurisdiction) {
      const existing = gaps.find(g => g.title === 'Incomplete Jurisdiction Configuration');
      if (existing) {
        existing.affectedTokens = [...(existing.affectedTokens || []), token.id];
      } else {
        gaps.push({
          severity: 'medium',
          title: 'Incomplete Jurisdiction Configuration',
          description: 'Jurisdiction restrictions are not fully configured for MICA compliance.',
          remediation: 'Define restricted jurisdictions for your tokens. Navigate to token compliance settings and specify which countries or regions are restricted from holding or trading your token.',
          affectedTokens: [token.id],
          actionUrl: `/compliance/${token.id}`,
          actionLabel: 'Configure Jurisdiction',
          detectedAt: new Date().toISOString(),
        });
      }
    }
    
    // Expired evidence
    if (tokenGap.expiredEvidence) {
      const existing = gaps.find(g => g.title === 'Expired Attestation Evidence');
      if (existing) {
        existing.affectedTokens = [...(existing.affectedTokens || []), token.id];
      } else {
        gaps.push({
          severity: 'critical',
          title: 'Expired Attestation Evidence',
          description: 'Some attestation documents have expired and need renewal for continued compliance.',
          remediation: 'Review and renew expired attestations. Contact your KYC provider to update verification documents. Upload new evidence to maintain compliance status.',
          affectedTokens: [token.id],
          actionUrl: `/tokens/${token.id}`,
          actionLabel: 'Renew Attestations',
          detectedAt: new Date().toISOString(),
        });
      }
    }
    
    // Failed validations
    if (tokenGap.failedValidations && tokenGap.failedValidations.length > 0) {
      const existing = gaps.find(g => g.title === 'Failed Compliance Validations');
      if (existing) {
        existing.affectedTokens = [...(existing.affectedTokens || []), token.id];
      } else {
        gaps.push({
          severity: 'high',
          title: 'Failed Compliance Validations',
          description: 'Some compliance validation checks have failed. This may block token operations.',
          remediation: 'Review validation errors in the audit log. Common issues include whitelist mismatches, KYC verification failures, or jurisdiction conflicts. Contact support if you need assistance resolving validation errors.',
          affectedTokens: [token.id],
          actionUrl: `/compliance/${token.id}`,
          actionLabel: 'View Validation Errors',
          detectedAt: new Date().toISOString(),
        });
      }
    }
  });
  
  // Add network-wide gaps from metrics
  if (metrics.value) {
    if (metrics.value.whitelistEnforcement.recentViolations > 0) {
      gaps.push({
        severity: 'high',
        title: 'Recent Whitelist Violations Detected',
        description: `${metrics.value.whitelistEnforcement.recentViolations} whitelist policy violations have been detected across the network.`,
        remediation: 'Review recent transfer attempts in the audit log. Identify addresses that violated whitelist policy and take corrective action: update whitelist rules, notify token holders, or report violations to compliance officer.',
        detectedAt: new Date().toISOString(),
        actionUrl: '/compliance-monitoring?view=metrics',
        actionLabel: 'View Audit Log',
      });
    }
    
    if (metrics.value.auditHealth.criticalIssues > 0) {
      gaps.push({
        severity: 'critical',
        title: 'Critical Audit Issues Detected',
        description: `${metrics.value.auditHealth.criticalIssues} critical issues found in audit health checks.`,
        remediation: 'Immediate action required. Review critical audit issues to identify system failures, security breaches, or compliance violations. Escalate to technical team and compliance officer.',
        detectedAt: new Date().toISOString(),
        actionUrl: '/compliance-monitoring?view=metrics',
        actionLabel: 'View Critical Issues',
      });
    }
  }
  
  return gaps;
});

// Methods
const loadTokenData = async () => {
  isLoadingTokens.value = true;
  try {
    // Tokens are already available from tokenStore
    // In production, you might want to refresh them here
    
    // Load compliance data for each token
    for (const token of tokens.value) {
      // Simulate gap detection (in production, this would come from backend)
      tokenGaps.value[token.id] = {
        missingAttestations: [],
        incompleteJurisdiction: !token.complianceMetadata?.jurisdictionRestrictions?.length,
        expiredEvidence: false,
        failedValidations: [],
      };
      
      // Simulate audit count (in production, this would come from backend)
      tokenAuditCounts.value[token.id] = Math.floor(Math.random() * 20) + 5;
    }
  } catch (err) {
    console.error('Failed to load token data:', err);
  } finally {
    isLoadingTokens.value = false;
  }
};

const loadMetricsData = async () => {
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
  loadMetricsData();
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

const handleMetricsExport = async () => {
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

const handleViewTokenDetails = (tokenId: string) => {
  router.push(`/tokens/${tokenId}`);
};

const handleExportTokenEvidence = (_tokenId: string) => {
  // Switch to export view with token pre-selected
  activeView.value = 'export';
  // The export component will handle the actual export
  // TODO: Pre-select token in export view
};

const handleAuditExport = async (format: 'csv' | 'json', exportFilters: any) => {
  try {
    // Build export data
    const exportData: any = {
      exportDate: new Date().toISOString(),
      filters: exportFilters,
      tokens: [],
    };
    
    // Filter tokens based on exportFilters.tokenId
    const tokensToExport = exportFilters.tokenId 
      ? tokens.value.filter(t => t.id === exportFilters.tokenId)
      : tokens.value;
    
    // Build export data for each token
    for (const token of tokensToExport) {
      exportData.tokens.push({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        assetId: token.assetId,
        compliance: {
          micaReady: token.complianceMetadata?.micaReady || false,
          attestations: token.attestationMetadata?.attestations || [],
          gaps: tokenGaps.value[token.id] || {},
        },
        auditEntries: tokenAuditCounts.value[token.id] || 0,
      });
    }
    
    if (format === 'csv') {
      // Convert to CSV
      const csvRows = [];
      csvRows.push('Token Name,Symbol,Asset ID,MICA Ready,Attestation Count,Audit Entries,Gaps');
      
      for (const tokenData of exportData.tokens) {
        const row = [
          tokenData.name,
          tokenData.symbol,
          tokenData.assetId || 'N/A',
          tokenData.compliance.micaReady ? 'Yes' : 'No',
          tokenData.compliance.attestations.length,
          tokenData.auditEntries,
          Object.keys(tokenData.compliance.gaps).filter(k => tokenData.compliance.gaps[k]).length,
        ];
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-evidence-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // JSON export
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-evidence-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Failed to export audit evidence:', err);
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

// Lifecycle
onMounted(() => {
  loadTokenData();
  loadMetricsData();
});

// Watch for route query changes to load data
watch(
  () => route.query,
  () => {
    loadMetricsData();
  },
  { immediate: false }
);
</script>
