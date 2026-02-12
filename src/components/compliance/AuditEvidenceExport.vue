<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-white flex items-center gap-2">
        <i class="pi pi-download text-biatec-accent"></i>
        Audit Evidence Export
      </h2>
    </div>

    <p class="text-gray-400 mb-6">
      Export compliance data and audit evidence for regulatory submissions and internal audits.
      Select your filters and format below.
    </p>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Token Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Token</label>
        <select
          v-model="filters.tokenId"
          class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
        >
          <option value="">All Tokens</option>
          <option v-for="token in availableTokens" :key="token.id" :value="token.id">
            {{ token.name }} ({{ token.symbol }})
          </option>
        </select>
      </div>

      <!-- Compliance Category Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Compliance Category</label>
        <select
          v-model="filters.category"
          class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
        >
          <option value="">All Categories</option>
          <option value="kyc_aml">KYC/AML</option>
          <option value="accredited_investor">Accredited Investor</option>
          <option value="jurisdiction">Jurisdiction</option>
          <option value="issuer_verification">Issuer Verification</option>
          <option value="whitelist">Whitelist</option>
          <option value="audit">Audit Logs</option>
        </select>
      </div>

      <!-- Start Date -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
        <input
          v-model="filters.startDate"
          type="date"
          class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
        />
      </div>

      <!-- End Date -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">End Date</label>
        <input
          v-model="filters.endDate"
          type="date"
          class="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
        />
      </div>
    </div>

    <!-- Export Format Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-400 mb-3">Export Format</label>
      <div class="flex gap-3">
        <button
          @click="selectedFormat = 'csv'"
          class="flex-1 px-4 py-3 rounded-lg border transition-all"
          :class="selectedFormat === 'csv'
            ? 'bg-biatec-accent/20 border-biatec-accent text-biatec-accent'
            : 'bg-white/5 border-gray-700 text-gray-400 hover:border-gray-600'"
        >
          <i class="pi pi-file text-2xl mb-2"></i>
          <div class="text-sm font-semibold">CSV</div>
          <div class="text-xs opacity-75">Excel-compatible spreadsheet</div>
        </button>
        <button
          @click="selectedFormat = 'json'"
          class="flex-1 px-4 py-3 rounded-lg border transition-all"
          :class="selectedFormat === 'json'
            ? 'bg-biatec-accent/20 border-biatec-accent text-biatec-accent'
            : 'bg-white/5 border-gray-700 text-gray-400 hover:border-gray-600'"
        >
          <i class="pi pi-code text-2xl mb-2"></i>
          <div class="text-sm font-semibold">JSON</div>
          <div class="text-xs opacity-75">Machine-readable data</div>
        </button>
      </div>
    </div>

    <!-- Validation Messages -->
    <div v-if="validationError" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div class="flex items-center gap-2 text-red-400">
        <i class="pi pi-exclamation-triangle"></i>
        <span class="text-sm">{{ validationError }}</span>
      </div>
    </div>

    <!-- Export Preview -->
    <div v-if="showPreview" class="mb-6 p-4 bg-white/5 rounded-lg">
      <h3 class="text-sm font-semibold text-white mb-2">Export Preview</h3>
      <div class="space-y-1 text-sm text-gray-400">
        <div class="flex justify-between">
          <span>Tokens:</span>
          <span class="text-white">{{ previewData.tokenCount }}</span>
        </div>
        <div class="flex justify-between">
          <span>Attestations:</span>
          <span class="text-white">{{ previewData.attestationCount }}</span>
        </div>
        <div class="flex justify-between">
          <span>Audit Entries:</span>
          <span class="text-white">{{ previewData.auditEntryCount }}</span>
        </div>
        <div class="flex justify-between">
          <span>Date Range:</span>
          <span class="text-white">{{ previewData.dateRange }}</span>
        </div>
        <div class="flex justify-between">
          <span>Estimated File Size:</span>
          <span class="text-white">{{ previewData.estimatedSize }}</span>
        </div>
      </div>
    </div>

    <!-- Export Actions -->
    <div class="flex gap-3">
      <button
        @click="handleExport"
        :disabled="isExporting || !isValid"
        class="flex-1 px-6 py-3 bg-biatec-accent hover:bg-biatec-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
        <span>{{ isExporting ? 'Exporting...' : 'Export Evidence Package' }}</span>
      </button>
      <button
        @click="handlePreview"
        :disabled="!isValid"
        class="px-6 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Preview
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
      <div class="flex items-center gap-2 text-green-400">
        <i class="pi pi-check-circle"></i>
        <span class="text-sm">{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Token } from '../../stores/tokens';

interface ExportFilters {
  tokenId: string;
  category: string;
  startDate: string;
  endDate: string;
}

interface PreviewData {
  tokenCount: number;
  attestationCount: number;
  auditEntryCount: number;
  dateRange: string;
  estimatedSize: string;
}

interface Props {
  availableTokens: Token[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'export', format: 'csv' | 'json', filters: ExportFilters): void;
}>();

const filters = ref<ExportFilters>({
  tokenId: '',
  category: '',
  startDate: '',
  endDate: '',
});

const selectedFormat = ref<'csv' | 'json'>('csv');
const isExporting = ref(false);
const validationError = ref('');
const successMessage = ref('');
const showPreview = ref(false);
const previewData = ref<PreviewData>({
  tokenCount: 0,
  attestationCount: 0,
  auditEntryCount: 0,
  dateRange: '',
  estimatedSize: '',
});

const isValid = computed(() => {
  validationError.value = '';
  
  if (filters.value.startDate && filters.value.endDate) {
    const start = new Date(filters.value.startDate);
    const end = new Date(filters.value.endDate);
    if (start > end) {
      validationError.value = 'Start date must be before end date';
      return false;
    }
  }
  
  return true;
});

watch(() => filters.value, () => {
  showPreview.value = false;
  successMessage.value = '';
}, { deep: true });

const handlePreview = () => {
  if (!isValid.value) return;
  
  // Calculate preview data
  const tokenCount = filters.value.tokenId ? 1 : props.availableTokens.length;
  const attestationCount = tokenCount * 3; // Estimate 3 attestations per token
  const auditEntryCount = tokenCount * 15; // Estimate 15 audit entries per token
  
  const startDate = filters.value.startDate || 'All time';
  const endDate = filters.value.endDate || 'Now';
  const dateRange = `${startDate} - ${endDate}`;
  
  const estimatedRecords = attestationCount + auditEntryCount;
  const estimatedKB = Math.ceil(estimatedRecords * 0.5); // Estimate 0.5 KB per record
  const estimatedSize = estimatedKB > 1024 
    ? `${(estimatedKB / 1024).toFixed(1)} MB`
    : `${estimatedKB} KB`;
  
  previewData.value = {
    tokenCount,
    attestationCount,
    auditEntryCount,
    dateRange,
    estimatedSize,
  };
  
  showPreview.value = true;
};

const handleExport = async () => {
  if (!isValid.value) return;
  
  isExporting.value = true;
  successMessage.value = '';
  
  try {
    emit('export', selectedFormat.value, filters.value);
    
    // Simulate export completion
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    successMessage.value = `Evidence package exported successfully as ${selectedFormat.value.toUpperCase()}`;
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
  } catch (error) {
    validationError.value = 'Failed to export evidence package. Please try again.';
  } finally {
    isExporting.value = false;
  }
};
</script>
