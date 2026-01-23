<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
            <i class="pi pi-download text-biatec-accent"></i>
            Compliance Exports
          </h3>
          <p class="text-sm text-gray-400 mt-2">
            Export audit-ready compliance data for MICA reporting and regulatory submissions
          </p>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="space-y-4 mt-6">
        <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Export Filters</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Token Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Token
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="filters.tokenId"
              type="text"
              placeholder="Token ID"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.tokenId }"
            />
            <p v-if="validationErrors.tokenId" class="text-xs text-red-400 mt-1">
              {{ validationErrors.tokenId }}
            </p>
          </div>

          <!-- Date Range Start -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Start Date
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.startDate }"
              :max="filters.endDate || today || undefined"
            />
            <p v-if="validationErrors.startDate" class="text-xs text-red-400 mt-1">
              {{ validationErrors.startDate }}
            </p>
          </div>

          <!-- Date Range End -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              End Date
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.endDate }"
              :min="filters.startDate || undefined"
              :max="today || undefined"
            />
            <p v-if="validationErrors.endDate" class="text-xs text-red-400 mt-1">
              {{ validationErrors.endDate }}
            </p>
          </div>

          <!-- Action Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
            <select
              v-model="filters.actionType"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
            >
              <option value="">All Actions</option>
              <option value="whitelist_add">Whitelist Add</option>
              <option value="whitelist_remove">Whitelist Remove</option>
              <option value="whitelist_bulk_upload">Bulk Upload</option>
              <option value="transfer_validation">Transfer Validation</option>
              <option value="transfer_executed">Transfer Executed</option>
              <option value="transfer_blocked">Transfer Blocked</option>
              <option value="compliance_review">Compliance Review</option>
              <option value="kyc_verification">KYC Verification</option>
            </select>
          </div>

          <!-- Actor Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Actor Address</label>
            <input
              v-model="filters.actor"
              type="text"
              placeholder="Filter by actor address"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
            />
          </div>

          <!-- Export Format -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Export Format
              <span class="text-red-400">*</span>
            </label>
            <select
              v-model="filters.format"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="json">JSON (Machine Readable)</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center pt-4 border-t border-white/10">
          <button
            @click="resetFilters"
            class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <i class="pi pi-times mr-2"></i>
            Reset Filters
          </button>
          <button
            @click="previewExport"
            :disabled="isGeneratingPreview"
            class="btn-primary px-6 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <i :class="isGeneratingPreview ? 'pi pi-spin pi-spinner' : 'pi pi-eye'"></i>
            Preview Export
          </button>
        </div>
      </div>
    </div>

    <!-- Export Information Panel -->
    <div class="glass-effect rounded-xl p-6 border border-biatec-accent/30">
      <h4 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <i class="pi pi-info-circle text-biatec-accent"></i>
        What Gets Exported?
      </h4>
      <div class="space-y-2 text-sm text-gray-300">
        <p>The compliance export includes the following audit-ready fields:</p>
        <ul class="list-disc list-inside space-y-1 ml-4 text-gray-400">
          <li><strong class="text-gray-300">Timestamp:</strong> ISO 8601 formatted date and time of each action</li>
          <li><strong class="text-gray-300">Action Type:</strong> Category of compliance activity (whitelist, transfer, KYC)</li>
          <li><strong class="text-gray-300">Token ID:</strong> Unique identifier for the token</li>
          <li><strong class="text-gray-300">Network:</strong> Blockchain network (VOI or Aramid)</li>
          <li><strong class="text-gray-300">Actor:</strong> Wallet address that initiated the action</li>
          <li><strong class="text-gray-300">Target:</strong> Affected address (if applicable)</li>
          <li><strong class="text-gray-300">Result:</strong> Success or failure status</li>
          <li><strong class="text-gray-300">Details:</strong> Additional context and metadata</li>
        </ul>
        <p class="pt-2 text-biatec-accent">
          <i class="pi pi-shield-check mr-1"></i>
          All exports are timestamped and recorded for audit trail purposes.
        </p>
      </div>
    </div>

    <!-- Download History -->
    <div class="glass-effect rounded-xl p-6">
      <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i class="pi pi-history text-biatec-accent"></i>
        Recent Exports
      </h4>
      
      <div v-if="downloadHistory.length === 0" class="text-center py-8">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
        <p class="text-gray-400 text-sm">No exports yet</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in downloadHistory"
          :key="item.id"
          class="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-file text-biatec-accent text-2xl"></i>
            <div>
              <div class="text-sm font-medium text-white">{{ item.filename }}</div>
              <div class="text-xs text-gray-400 mt-1">
                {{ formatDate(item.timestamp) }} • {{ item.recordCount }} records • {{ item.format.toUpperCase() }}
              </div>
              <div v-if="item.filters" class="text-xs text-gray-500 mt-1">
                {{ formatFilterSummary(item.filters) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                item.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              ]"
            >
              {{ item.status === 'success' ? 'Success' : 'Failed' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <Modal
      :show="showPreviewModal"
      @close="showPreviewModal = false"
      title="Export Preview"
    >
      <div class="space-y-4">
        <!-- Preview Summary -->
        <div v-if="exportPreview" class="p-4 bg-white/5 rounded-lg">
          <h5 class="text-sm font-semibold text-white mb-3">Export Summary</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-400">Records to Export:</span>
              <span class="text-white font-medium ml-2">{{ exportPreview.recordCount }}</span>
            </div>
            <div>
              <span class="text-gray-400">Format:</span>
              <span class="text-white font-medium ml-2">{{ filters.format.toUpperCase() }}</span>
            </div>
            <div>
              <span class="text-gray-400">Date Range:</span>
              <span class="text-white font-medium ml-2">
                {{ formatShortDate(filters.startDate) }} - {{ formatShortDate(filters.endDate) }}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Estimated Size:</span>
              <span class="text-white font-medium ml-2">{{ exportPreview.estimatedSize }}</span>
            </div>
          </div>
        </div>

        <!-- Fields Included -->
        <div class="p-4 bg-white/5 rounded-lg">
          <h5 class="text-sm font-semibold text-white mb-2">Fields Included</h5>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="field in exportFields"
              :key="field"
              class="px-2 py-1 bg-biatec-accent/20 text-biatec-accent text-xs rounded"
            >
              {{ field }}
            </span>
          </div>
        </div>

        <!-- Preview Data Sample -->
        <div v-if="exportPreview && exportPreview.sampleData.length > 0" class="p-4 bg-white/5 rounded-lg max-h-64 overflow-auto">
          <h5 class="text-sm font-semibold text-white mb-2">Sample Data (First 5 records)</h5>
          <pre class="text-xs text-gray-300 font-mono">{{ JSON.stringify(exportPreview.sampleData, null, 2) }}</pre>
        </div>

        <!-- Warning if no data -->
        <div v-if="exportPreview && exportPreview.recordCount === 0" class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-400 mt-0.5"></i>
            <div class="text-sm">
              <div class="font-semibold text-yellow-400 mb-1">No Records Found</div>
              <div class="text-gray-300">No compliance data matches your selected filters. Try adjusting the date range or filters.</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            @click="showPreviewModal = false"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="executeExport"
            :disabled="isExporting || (exportPreview !== null && exportPreview.recordCount === 0)"
            class="btn-primary px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
            {{ isExporting ? 'Exporting...' : 'Download Export' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Success Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50"
    >
      <i class="pi pi-check-circle text-2xl"></i>
      <div>
        <div class="font-semibold">Export Successful</div>
        <div class="text-sm text-green-100">Your compliance data has been downloaded</div>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="showErrorToast"
      class="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50"
    >
      <i class="pi pi-times-circle text-2xl"></i>
      <div>
        <div class="font-semibold">Export Failed</div>
        <div class="text-sm text-red-100">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Modal from './ui/Modal.vue';

interface ExportFilters {
  tokenId: string;
  startDate: string;
  endDate: string;
  actionType: string;
  actor: string;
  format: 'csv' | 'json';
}

interface ExportPreview {
  recordCount: number;
  estimatedSize: string;
  sampleData: any[];
}

interface DownloadHistoryItem {
  id: string;
  timestamp: string;
  filename: string;
  format: 'csv' | 'json';
  recordCount: number;
  status: 'success' | 'failed';
  filters?: Partial<ExportFilters>;
}

interface ValidationErrors {
  tokenId?: string;
  startDate?: string;
  endDate?: string;
}

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

// State
const filters = ref<ExportFilters>({
  tokenId: props.tokenId || '',
  startDate: '',
  endDate: '',
  actionType: '',
  actor: '',
  format: 'csv',
});

const validationErrors = ref<ValidationErrors>({});
const isGeneratingPreview = ref(false);
const isExporting = ref(false);
const showPreviewModal = ref(false);
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const errorMessage = ref('');
const exportPreview = ref<ExportPreview | null>(null);
const downloadHistory = ref<DownloadHistoryItem[]>([]);

// Computed
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const exportFields = [
  'Timestamp',
  'Action Type',
  'Token ID',
  'Network',
  'Actor',
  'Target',
  'Result',
  'Details',
  'Reason',
];

// Methods
const validateFilters = (): boolean => {
  validationErrors.value = {};

  if (!filters.value.tokenId.trim()) {
    validationErrors.value.tokenId = 'Token ID is required';
  }

  if (!filters.value.startDate) {
    validationErrors.value.startDate = 'Start date is required';
  }

  if (!filters.value.endDate) {
    validationErrors.value.endDate = 'End date is required';
  }

  if (filters.value.startDate && filters.value.endDate) {
    const start = new Date(filters.value.startDate);
    const end = new Date(filters.value.endDate);
    
    if (start > end) {
      validationErrors.value.startDate = 'Start date must be before end date';
    }

    // Check if date range is not too far in the future
    const today = new Date();
    if (end > today) {
      validationErrors.value.endDate = 'End date cannot be in the future';
    }
  }

  return Object.keys(validationErrors.value).length === 0;
};

const resetFilters = () => {
  filters.value = {
    tokenId: props.tokenId || '',
    startDate: '',
    endDate: '',
    actionType: '',
    actor: '',
    format: 'csv',
  };
  validationErrors.value = {};
};

const previewExport = async () => {
  if (!validateFilters()) {
    return;
  }

  isGeneratingPreview.value = true;

  try {
    // Mock API call - in real implementation, this would call the backend
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock preview data
    const mockRecordCount = Math.floor(Math.random() * 500) + 50;
    exportPreview.value = {
      recordCount: mockRecordCount,
      estimatedSize: `${Math.ceil(mockRecordCount * 0.5)}KB`,
      sampleData: generateMockSampleData(),
    };

    showPreviewModal.value = true;
  } catch (error) {
    errorMessage.value = 'Failed to generate export preview';
    showErrorToast.value = true;
    setTimeout(() => {
      showErrorToast.value = false;
    }, 5000);
  } finally {
    isGeneratingPreview.value = false;
  }
};

const executeExport = async () => {
  if (!exportPreview.value || exportPreview.value.recordCount === 0) {
    return;
  }

  isExporting.value = true;

  try {
    // Mock API call - in real implementation, this would call the backend export endpoint
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `compliance-export-${filters.value.tokenId}-${timestamp}.${filters.value.format}`;

    // In real implementation, trigger download here
    // For now, we'll just simulate it
    downloadFile(filename, filters.value.format);

    // Add to download history
    const historyItem: DownloadHistoryItem = {
      id: `export-${Date.now()}`,
      timestamp: new Date().toISOString(),
      filename,
      format: filters.value.format,
      recordCount: exportPreview.value.recordCount,
      status: 'success',
      filters: { ...filters.value },
    };
    downloadHistory.value.unshift(historyItem);

    // Keep only last 10 items
    if (downloadHistory.value.length > 10) {
      downloadHistory.value = downloadHistory.value.slice(0, 10);
    }

    // Save to localStorage
    saveDownloadHistory();

    showPreviewModal.value = false;
    showSuccessToast.value = true;
    setTimeout(() => {
      showSuccessToast.value = false;
    }, 5000);
  } catch (error) {
    const historyItem: DownloadHistoryItem = {
      id: `export-${Date.now()}`,
      timestamp: new Date().toISOString(),
      filename: 'export-failed',
      format: filters.value.format,
      recordCount: 0,
      status: 'failed',
    };
    downloadHistory.value.unshift(historyItem);
    saveDownloadHistory();

    errorMessage.value = 'Failed to download export file';
    showErrorToast.value = true;
    setTimeout(() => {
      showErrorToast.value = false;
    }, 5000);
  } finally {
    isExporting.value = false;
  }
};

const downloadFile = (filename: string, format: string) => {
  // Mock download - in real implementation, this would download the actual file
  let content = '';
  
  if (format === 'csv') {
    content = 'Timestamp,Action,Token ID,Network,Actor,Target,Result,Details\n';
    content += '"2026-01-23T10:00:00Z","whitelist_add","token123","VOI","ADDR1...","ADDR2...","success","Added to whitelist"\n';
  } else {
    content = JSON.stringify([
      {
        timestamp: '2026-01-23T10:00:00Z',
        action: 'whitelist_add',
        tokenId: 'token123',
        network: 'VOI',
        actor: 'ADDR1...',
        target: 'ADDR2...',
        result: 'success',
        details: { reason: 'Added to whitelist' }
      }
    ], null, 2);
  }

  const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const generateMockSampleData = () => {
  return [
    {
      timestamp: '2026-01-23T10:00:00Z',
      action: 'whitelist_add',
      tokenId: filters.value.tokenId,
      network: props.network || 'VOI',
      actor: 'ADDR1ABC...XYZ',
      target: 'ADDR2DEF...UVW',
      result: 'success',
      details: { reason: 'KYC verified' }
    },
    {
      timestamp: '2026-01-23T09:30:00Z',
      action: 'transfer_validation',
      tokenId: filters.value.tokenId,
      network: props.network || 'VOI',
      actor: 'ADDR3GHI...RST',
      target: 'ADDR4JKL...OPQ',
      result: 'success',
      details: { amount: '1000', validated: true }
    }
  ];
};

const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatFilterSummary = (filters: Partial<ExportFilters>): string => {
  const parts: string[] = [];
  if (filters.actionType) parts.push(`Action: ${filters.actionType}`);
  if (filters.actor) parts.push(`Actor: ${filters.actor.substring(0, 10)}...`);
  return parts.join(' • ') || 'All filters';
};

const loadDownloadHistory = () => {
  try {
    const stored = localStorage.getItem('compliance-export-history');
    if (stored) {
      downloadHistory.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load download history:', error);
  }
};

const saveDownloadHistory = () => {
  try {
    localStorage.setItem('compliance-export-history', JSON.stringify(downloadHistory.value));
  } catch (error) {
    console.error('Failed to save download history:', error);
  }
};

// Initialize
onMounted(() => {
  // Set default date range (last 30 days)
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  filters.value.startDate = start.toISOString().split('T')[0];
  filters.value.endDate = end.toISOString().split('T')[0];

  loadDownloadHistory();
});
</script>
