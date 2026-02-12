<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-list text-biatec-accent"></i>
          Audit Trail
        </h2>
        <p class="text-sm text-gray-400 mt-1">Complete activity log for regulatory compliance</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
        <p class="text-gray-400">Loading audit trail data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
      <h3 class="text-lg font-semibold text-red-400 mb-2">Failed to Load Audit Data</h3>
      <p class="text-sm text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="loadAuditData"
        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Success State -->
    <div v-else-if="auditSummary">
      <!-- Summary Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="pi pi-database text-2xl text-blue-400"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-white">{{ auditSummary.totalEvents.toLocaleString() }}</div>
              <div class="text-sm text-gray-400">Total Events</div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-2xl text-green-400"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-white">{{ auditSummary.successfulEvents.toLocaleString() }}</div>
              <div class="text-sm text-gray-400">Successful</div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <i class="pi pi-times-circle text-2xl text-red-400"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-white">{{ auditSummary.failedEvents.toLocaleString() }}</div>
              <div class="text-sm text-gray-400">Failed</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Last Event Info -->
      <div class="bg-white/5 rounded-lg p-4 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-400 mb-1">Last Audit Event</div>
            <div v-if="auditSummary.lastEventTime" class="text-white font-medium">
              {{ formatTimestamp(auditSummary.lastEventTime) }}
            </div>
            <div v-else class="text-gray-500">No events recorded</div>
            <div v-if="auditSummary.lastEventAction" class="text-sm text-gray-400 mt-1">
              Action: <span class="text-white">{{ auditSummary.lastEventAction }}</span>
            </div>
          </div>
          <div v-if="isDataStale" class="flex items-center gap-2 text-yellow-400 text-sm">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Data may be stale</span>
          </div>
        </div>
      </div>

      <!-- Missing Data Warnings -->
      <div v-if="auditSummary.warnings.length > 0" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          Data Gaps Detected
        </h3>
        <ul class="space-y-2">
          <li v-for="(warning, index) in auditSummary.warnings" :key="index" class="text-sm text-gray-300 flex items-start gap-2">
            <i class="pi pi-angle-right text-yellow-400 text-xs mt-1"></i>
            <span>{{ warning }}</span>
          </li>
        </ul>
      </div>

      <!-- Export Controls -->
      <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i class="pi pi-download"></i>
          Export Audit Trail
        </h3>
        <p class="text-sm text-gray-400 mb-4">
          Download complete audit trail for regulatory compliance, internal audits, or archival purposes.
          All exports include cryptographic signatures for integrity verification.
        </p>
        
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportAudit('csv')"
            :disabled="!!exporting"
            class="flex-1 min-w-[120px] px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            aria-label="Export audit trail as CSV"
          >
            <i :class="['pi', exporting === 'csv' ? 'pi-spin pi-spinner' : 'pi-file-excel']"></i>
            <span>Export CSV</span>
          </button>

          <button
            @click="exportAudit('json')"
            :disabled="!!exporting"
            class="flex-1 min-w-[120px] px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            aria-label="Export audit trail as JSON"
          >
            <i :class="['pi', exporting === 'json' ? 'pi-spin pi-spinner' : 'pi-file']"></i>
            <span>Export JSON</span>
          </button>

          <button
            @click="viewFullAudit"
            class="flex-1 min-w-[120px] px-4 py-3 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
            aria-label="View full audit log"
          >
            <i class="pi pi-eye"></i>
            <span>View Full Log</span>
          </button>
        </div>

        <!-- Export Success Message -->
        <div v-if="exportSuccess" class="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
          <i class="pi pi-check-circle text-green-400"></i>
          <span class="text-sm text-green-400">Export completed successfully!</span>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
          <div class="text-sm text-gray-300">
            <strong class="text-blue-400">Audit Trail Purpose</strong>
            <p class="mt-1">
              The audit trail maintains a complete, tamper-evident record of all compliance-related actions.
              This includes whitelist modifications, token operations, and administrative changes. Regulators
              can use this trail to verify your compliance procedures and demonstrate due diligence.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <i class="pi pi-file-excel text-4xl text-gray-500 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-400 mb-2">No Audit Data</h3>
      <p class="text-sm text-gray-500">Audit trail will appear here once compliance events are recorded.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface AuditSummary {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  lastEventTime: string | null;
  lastEventAction: string | null;
  warnings: string[];
}

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

const emit = defineEmits<{
  viewFullAudit: [];
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const auditSummary = ref<AuditSummary | null>(null);
const exporting = ref<'csv' | 'json' | false>(false);
const exportSuccess = ref(false);

const loadAuditData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock audit summary data
    auditSummary.value = {
      totalEvents: 1247,
      successfulEvents: 1198,
      failedEvents: 49,
      lastEventTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      lastEventAction: 'WHITELIST_ADD',
      warnings: [
        'Some events from January 2026 may have incomplete metadata due to system migration',
        'Audit retention period set to 7 years - older data will be archived',
      ],
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load audit trail summary';
    console.error('Error loading audit summary:', err);
  } finally {
    loading.value = false;
  }
};

const exportAudit = async (format: 'csv' | 'json') => {
  exporting.value = format;
  exportSuccess.value = false;

  try {
    // Simulate export operation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In real implementation, this would call the audit trail service export method
    // const result = await auditTrailService.downloadAuditReport(props.tokenId, format);
    
    // For now, show success message
    exportSuccess.value = true;
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      exportSuccess.value = false;
    }, 3000);

    console.log(`Exported audit trail as ${format.toUpperCase()}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : `Failed to export audit trail as ${format.toUpperCase()}`;
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
};

const viewFullAudit = () => {
  emit('viewFullAudit');
};

const isDataStale = computed(() => {
  if (!auditSummary.value?.lastEventTime) return false;
  const lastEvent = new Date(auditSummary.value.lastEventTime);
  const hoursSinceLastEvent = (Date.now() - lastEvent.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastEvent > 24; // Consider stale if no events in 24 hours
});

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
};

onMounted(() => {
  loadAuditData();
});
</script>
