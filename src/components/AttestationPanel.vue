<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
            <i class="pi pi-file-check text-biatec-accent"></i>
            Compliance Attestation
          </h3>
          <p class="text-sm text-gray-400 mt-2">
            Generate signed attestation packages for MICA audits and regulatory submissions
          </p>
        </div>
      </div>

      <!-- Issuer Credentials Form -->
      <div class="space-y-4 mt-6">
        <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Issuer Credentials</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Issuer Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Issuer Name
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="issuerCredentials.name"
              type="text"
              placeholder="Company or Organization Name"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.name }"
            />
            <p v-if="validationErrors.name" class="text-xs text-red-400 mt-1">
              {{ validationErrors.name }}
            </p>
          </div>

          <!-- Registration Number -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Registration Number
            </label>
            <input
              v-model="issuerCredentials.registrationNumber"
              type="text"
              placeholder="Company registration number"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
            />
          </div>

          <!-- Jurisdiction -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Jurisdiction
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="issuerCredentials.jurisdiction"
              type="text"
              placeholder="e.g., EU, USA, Singapore"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.jurisdiction }"
            />
            <p v-if="validationErrors.jurisdiction" class="text-xs text-red-400 mt-1">
              {{ validationErrors.jurisdiction }}
            </p>
          </div>

          <!-- Regulatory License -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Regulatory License
            </label>
            <input
              v-model="issuerCredentials.regulatoryLicense"
              type="text"
              placeholder="License number (if applicable)"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
            />
          </div>

          <!-- Contact Email -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Contact Email
            </label>
            <input
              v-model="issuerCredentials.contactEmail"
              type="email"
              placeholder="contact@example.com"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.contactEmail }"
            />
            <p v-if="validationErrors.contactEmail" class="text-xs text-red-400 mt-1">
              {{ validationErrors.contactEmail }}
            </p>
          </div>

          <!-- Wallet Address -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="issuerCredentials.walletAddress"
              type="text"
              placeholder="Algorand wallet address"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
              :class="{ 'border-red-500': validationErrors.walletAddress }"
            />
            <p v-if="validationErrors.walletAddress" class="text-xs text-red-400 mt-1">
              {{ validationErrors.walletAddress }}
            </p>
          </div>
        </div>

        <!-- Export Options -->
        <div class="pt-4 border-t border-white/10">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Export Options</h4>
          
          <div class="space-y-3">
            <!-- Include Compliance Status -->
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="exportOptions.includeComplianceStatus"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-biatec-accent focus:ring-biatec-accent"
              />
              <span class="text-sm text-gray-300">Include current compliance status</span>
            </label>

            <!-- Include Whitelist Policy -->
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="exportOptions.includeWhitelistPolicy"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-biatec-accent focus:ring-biatec-accent"
              />
              <span class="text-sm text-gray-300">Include whitelist policy details</span>
            </label>

            <!-- Export Format -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Export Format
                <span class="text-red-400">*</span>
              </label>
              <select
                v-model="exportOptions.format"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
              >
                <option value="pdf">PDF only</option>
                <option value="json">JSON only</option>
                <option value="both">Both (PDF + JSON)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            @click="resetForm"
            class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <i class="pi pi-times mr-2"></i>
            Reset Form
          </button>
          <button
            @click="generateAttestation"
            :disabled="isGenerating"
            class="btn-primary px-6 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <i :class="isGenerating ? 'pi pi-spin pi-spinner' : 'pi pi-file-check'"></i>
            {{ isGenerating ? 'Generating...' : 'Generate Attestation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Information Panel -->
    <div class="glass-effect rounded-xl p-6 border border-biatec-accent/30">
      <h4 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <i class="pi pi-info-circle text-biatec-accent"></i>
        What is Included?
      </h4>
      <div class="space-y-2 text-sm text-gray-300">
        <p>The attestation package includes the following audit-ready information:</p>
        <ul class="list-disc list-inside space-y-1 ml-4 text-gray-400">
          <li><strong class="text-gray-300">Token Information:</strong> Token ID, network, and metadata</li>
          <li><strong class="text-gray-300">Issuer Credentials:</strong> Complete issuer details for verification</li>
          <li><strong class="text-gray-300">Compliance Status:</strong> Current whitelist count, compliance score, and compliance issues (optional)</li>
          <li><strong class="text-gray-300">Whitelist Policy:</strong> KYC requirements and jurisdiction restrictions (optional)</li>
          <li><strong class="text-gray-300">Digital Signature:</strong> Cryptographic hash for document integrity verification</li>
          <li><strong class="text-gray-300">Audit Timestamp:</strong> ISO 8601 formatted generation timestamp</li>
        </ul>
        <p class="pt-2 text-biatec-accent">
          <i class="pi pi-shield-check mr-1"></i>
          All attestations are digitally signed and include a unique identifier for audit trail purposes.
        </p>
      </div>
    </div>

    <!-- Download History -->
    <div class="glass-effect rounded-xl p-6">
      <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i class="pi pi-history text-biatec-accent"></i>
        Recent Attestations
      </h4>
      
      <div v-if="downloadHistory.length === 0" class="text-center py-8">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
        <p class="text-gray-400 text-sm">No attestations generated yet</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in downloadHistory"
          :key="item.id"
          class="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-file-check text-biatec-accent text-2xl"></i>
            <div>
              <div class="text-sm font-medium text-white">
                Attestation for {{ item.tokenId }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                {{ formatDate(item.timestamp) }} • {{ item.network }} • {{ formatType(item.format) }}
              </div>
              <div v-if="item.fileSize" class="text-xs text-gray-500 mt-1">
                {{ item.fileSize }}
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

    <!-- Success Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50"
    >
      <i class="pi pi-check-circle text-2xl"></i>
      <div>
        <div class="font-semibold">Attestation Generated</div>
        <div class="text-sm text-green-100">{{ successMessage }}</div>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="showErrorToast"
      class="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50"
    >
      <i class="pi pi-times-circle text-2xl"></i>
      <div>
        <div class="font-semibold">Generation Failed</div>
        <div class="text-sm text-red-100">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { attestationService } from '../services/AttestationService';
import type {
  IssuerCredentials,
  AttestationExportRequest,
  AttestationHistoryItem,
} from '../types/compliance';

const ALGORAND_ADDRESS_LENGTH = 58;

interface ValidationErrors {
  name?: string;
  jurisdiction?: string;
  walletAddress?: string;
  contactEmail?: string;
}

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

// State
const issuerCredentials = ref<IssuerCredentials>({
  name: '',
  registrationNumber: '',
  jurisdiction: '',
  regulatoryLicense: '',
  contactEmail: '',
  walletAddress: '',
});

const exportOptions = ref({
  includeComplianceStatus: true,
  includeWhitelistPolicy: true,
  format: 'both' as 'pdf' | 'json' | 'both',
});

const validationErrors = ref<ValidationErrors>({});
const isGenerating = ref(false);
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const downloadHistory = ref<AttestationHistoryItem[]>([]);

// Methods
const validateForm = (): boolean => {
  validationErrors.value = {};

  if (!issuerCredentials.value.name.trim()) {
    validationErrors.value.name = 'Issuer name is required';
  }

  if (!issuerCredentials.value.jurisdiction.trim()) {
    validationErrors.value.jurisdiction = 'Jurisdiction is required';
  }

  if (!issuerCredentials.value.walletAddress.trim()) {
    validationErrors.value.walletAddress = 'Wallet address is required';
  } else if (issuerCredentials.value.walletAddress.length !== ALGORAND_ADDRESS_LENGTH) {
    validationErrors.value.walletAddress = `Invalid Algorand wallet address (must be ${ALGORAND_ADDRESS_LENGTH} characters)`;
  }

  if (issuerCredentials.value.contactEmail && issuerCredentials.value.contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(issuerCredentials.value.contactEmail)) {
      validationErrors.value.contactEmail = 'Invalid email address';
    }
  }

  return Object.keys(validationErrors.value).length === 0;
};

const resetForm = () => {
  issuerCredentials.value = {
    name: '',
    registrationNumber: '',
    jurisdiction: '',
    regulatoryLicense: '',
    contactEmail: '',
    walletAddress: '',
  };
  exportOptions.value = {
    includeComplianceStatus: true,
    includeWhitelistPolicy: true,
    format: 'both',
  };
  validationErrors.value = {};
};

const generateAttestation = async () => {
  if (!validateForm()) {
    return;
  }

  if (!props.tokenId) {
    errorMessage.value = 'Token ID is required';
    showErrorToast.value = true;
    setTimeout(() => {
      showErrorToast.value = false;
    }, 5000);
    return;
  }

  isGenerating.value = true;

  try {
    const request: AttestationExportRequest = {
      tokenId: props.tokenId,
      network: (props.network || 'VOI') as 'VOI' | 'Aramid',
      issuerCredentials: issuerCredentials.value,
      includeWhitelistPolicy: exportOptions.value.includeWhitelistPolicy,
      includeComplianceStatus: exportOptions.value.includeComplianceStatus,
      format: exportOptions.value.format,
    };

    const attestation = await attestationService.generateAttestation(request);

    // Download files based on format
    let fileSize = '';
    if (exportOptions.value.format === 'pdf' || exportOptions.value.format === 'both') {
      const pdfBlob = await attestationService.downloadAsPDF(attestation);
      downloadBlob(pdfBlob, `attestation-${props.tokenId}-${Date.now()}.pdf`);
      fileSize = `${(pdfBlob.size / 1024).toFixed(2)} KB`;
    }

    if (exportOptions.value.format === 'json' || exportOptions.value.format === 'both') {
      const jsonBlob = await attestationService.downloadAsJSON(attestation);
      downloadBlob(jsonBlob, `attestation-${props.tokenId}-${Date.now()}.json`);
      if (fileSize) {
        fileSize += ` + ${(jsonBlob.size / 1024).toFixed(2)} KB`;
      } else {
        fileSize = `${(jsonBlob.size / 1024).toFixed(2)} KB`;
      }
    }

    // Add to download history
    const historyItem: AttestationHistoryItem = {
      id: attestation.id,
      timestamp: attestation.generatedAt,
      tokenId: props.tokenId,
      network: (props.network || 'VOI') as 'VOI' | 'Aramid',
      format: exportOptions.value.format,
      fileSize,
      status: 'success',
    };

    try {
      await attestationService.saveToHistory(historyItem);
    } catch (historyError) {
      console.error('Failed to save to history:', historyError);
      // Continue anyway - history save failure shouldn't break the flow
    }
    downloadHistory.value.unshift(historyItem);

    successMessage.value = `Attestation package downloaded successfully (${exportOptions.value.format.toUpperCase()})`;
    showSuccessToast.value = true;
    setTimeout(() => {
      showSuccessToast.value = false;
    }, 5000);
  } catch (error) {
    console.error('Failed to generate attestation:', error);
    
    const historyItem: AttestationHistoryItem = {
      id: `attestation-failed-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tokenId: props.tokenId || 'unknown',
      network: (props.network || 'VOI') as 'VOI' | 'Aramid',
      format: exportOptions.value.format,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };

    try {
      await attestationService.saveToHistory(historyItem);
    } catch (historyError) {
      console.error('Failed to save failed attestation to history:', historyError);
      // Continue anyway
    }
    downloadHistory.value.unshift(historyItem);

    errorMessage.value = 'Failed to generate attestation package';
    showErrorToast.value = true;
    setTimeout(() => {
      showErrorToast.value = false;
    }, 5000);
  } finally {
    isGenerating.value = false;
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

const formatType = (format: string): string => {
  switch (format) {
    case 'pdf':
      return 'PDF';
    case 'json':
      return 'JSON';
    case 'both':
      return 'PDF + JSON';
    default:
      return format.toUpperCase();
  }
};

const loadHistory = async () => {
  try {
    downloadHistory.value = await attestationService.getAttestationHistory(props.tokenId);
  } catch (error) {
    console.error('Failed to load attestation history:', error);
    downloadHistory.value = [];
  }
};

// Initialize
onMounted(() => {
  loadHistory();
});
</script>
