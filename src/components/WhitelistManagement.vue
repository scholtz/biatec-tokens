<template>
  <div class="whitelist-management">
    <!-- Token & Network Context Section -->
    <div class="glass-effect rounded-xl p-4 mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <i class="pi pi-coins text-biatec-accent text-xl"></i>
            <div>
              <p class="text-xs text-gray-400">Token ID</p>
              <p class="text-white font-semibold">{{ tokenId }}</p>
            </div>
          </div>
          <div class="h-8 w-px bg-gray-600"></div>
          <div class="flex items-center space-x-2">
            <i class="pi pi-sitemap text-biatec-teal text-xl"></i>
            <div>
              <p class="text-xs text-gray-400">Network</p>
              <select v-model="selectedNetwork" class="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-biatec-accent">
                <option value="VOI">VOI</option>
                <option value="Aramid">Aramid</option>
              </select>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2 text-sm">
          <i class="pi pi-info-circle text-blue-400"></i>
          <router-link :to="`/compliance/${tokenId}?network=${selectedNetwork}`" class="text-biatec-accent hover:underline"> View Audit Trail </router-link>
        </div>
      </div>
    </div>

    <!-- Header Section -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">Whitelist Management</h2>
      <p class="text-gray-400">Manage approved addresses for this RWA token on {{ selectedNetwork }}</p>
    </div>

    <!-- Actions Bar -->
    <div class="glass-effect rounded-xl p-4 mb-6">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <!-- Search Input -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search addresses..."
              data-testid="search-input"
              class="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
            />
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <!-- Status Filter -->
        <select v-model="statusFilter" data-testid="status-filter" class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="removed">Removed</option>
        </select>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-2">
          <button
            @click="exportWhitelist"
            :disabled="isExporting || entries.length === 0"
            class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
            <span>{{ isExporting ? "Exporting..." : "Export CSV" }}</span>
          </button>
          <button @click="showAddModal = true" class="btn-primary px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <i class="pi pi-plus"></i>
            <span>Add Address</span>
          </button>
          <button @click="showBulkUploadModal = true" class="px-4 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors flex items-center space-x-2">
            <i class="pi pi-upload"></i>
            <span>Import CSV</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
      <p class="text-gray-400">Loading whitelist...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-red-400 mb-4">{{ error }}</p>
      <button @click="loadWhitelist" class="btn-primary px-6 py-2 rounded-lg">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredEntries.length === 0 && !searchQuery && !statusFilter" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-list text-6xl text-gray-400 mb-6"></i>
      <h3 class="text-2xl font-semibold text-white mb-4">No Addresses Yet</h3>
      <p class="text-gray-400 mb-6">Start by adding addresses to the whitelist</p>
      <button @click="showAddModal = true" class="btn-primary px-6 py-3 rounded-xl inline-flex items-center space-x-2">
        <i class="pi pi-plus"></i>
        <span>Add First Address</span>
      </button>
    </div>

    <!-- No Results State -->
    <div v-else-if="filteredEntries.length === 0" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-search text-6xl text-gray-400 mb-6"></i>
      <h3 class="text-2xl font-semibold text-white mb-4">No Results Found</h3>
      <p class="text-gray-400">Try adjusting your search or filters</p>
    </div>

    <!-- Whitelist Table -->
    <div v-else class="glass-effect rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-white/5 border-b border-white/10">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Added</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            <tr v-for="entry in filteredEntries" :key="entry.address" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <code class="text-sm font-mono text-white">
                    {{ formatAddress(entry.address) }}
                  </code>
                  <button @click="copyAddress(entry.address)" class="text-gray-400 hover:text-biatec-accent transition-colors" title="Copy address">
                    <i class="pi pi-copy text-xs"></i>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="statusBadgeClass(entry.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ entry.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(entry.addedAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                {{ entry.notes || "-" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="confirmRemove(entry.address)" class="text-red-400 hover:text-red-300 transition-colors" title="Remove from whitelist">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Address Modal -->
    <Modal :show="showAddModal" @close="showAddModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Add Address to Whitelist</h3>
      </template>

      <div class="space-y-4">
        <Input v-model="newAddress" label="Address" placeholder="Enter wallet address" :error="addressError" data-testid="address-input" required />
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300"> Notes (optional) </label>
          <textarea
            v-model="newAddressNotes"
            rows="3"
            placeholder="Add notes about this address..."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="showAddModal = false" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button @click="addAddress" :disabled="isAddingAddress || !newAddress" class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <i v-if="isAddingAddress" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isAddingAddress ? "Adding..." : "Add Address" }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Bulk Upload Modal -->
    <Modal :show="showBulkUploadModal" @close="closeBulkUploadModal" :size="showPreview ? 'xl' : 'lg'">
      <template #header>
        <h3 class="text-lg font-semibold text-white">
          {{ showPreview ? "Review Changes" : "Import Whitelist CSV" }}
        </h3>
      </template>

      <!-- Step 1: CSV Upload -->
      <div v-if="!showPreview" class="space-y-4">
        <!-- File Upload Instructions -->
        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-white mb-2">CSV Format Requirements</h4>
              <ul class="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>File must be in CSV format with "address" column header</li>
                <li>Addresses must be valid VOI/Aramid format (58 characters, A-Z2-7)</li>
                <li>Duplicate addresses will be detected and reported</li>
                <li>File will be validated for network compatibility with {{ selectedNetwork }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- CSV Format Example -->
        <div>
          <p class="text-sm text-gray-400 mb-2">Example CSV format:</p>
          <div class="text-xs text-gray-500 space-y-1">
            <code class="block bg-white/5 p-3 rounded font-mono">
              address,notes<br />
              ABC...XYZ58CHARS,Investor A<br />
              DEF...UVW58CHARS,Investor B
            </code>
          </div>
        </div>

        <!-- CSV Input -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-300"> CSV Data </label>
            <button @click="loadSampleCsv" class="text-xs text-biatec-accent hover:text-white transition-colors">Load Sample</button>
          </div>
          <textarea
            v-model="csvData"
            rows="10"
            placeholder="Paste CSV content here or click 'Load Sample'..."
            class="w-full px-3 py-2 font-mono text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          ></textarea>
        </div>

        <!-- Validation Errors -->
        <div v-if="csvError" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <i class="pi pi-exclamation-triangle text-red-400 text-lg mt-0.5"></i>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-red-400 mb-2">Validation Error</h4>
              <p class="text-xs text-gray-300">{{ csvError }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Validation Results -->
        <div v-if="validationResults.length > 0 && !csvError" class="space-y-2">
          <h4 class="text-sm font-medium text-white">Quick Validation</h4>
          <div class="flex items-center space-x-4 text-sm">
            <div class="flex items-center space-x-2">
              <i class="pi pi-check-circle text-green-400"></i>
              <span class="text-gray-300">{{ validCount }} valid</span>
            </div>
            <div class="flex items-center space-x-2">
              <i class="pi pi-times-circle text-red-400"></i>
              <span class="text-gray-300">{{ invalidCount }} invalid</span>
            </div>
            <div class="flex items-center space-x-2">
              <i class="pi pi-exclamation-triangle text-yellow-400"></i>
              <span class="text-gray-300">{{ duplicateCount }} duplicates</span>
            </div>
          </div>
          <div v-if="invalidCount > 0 || duplicateCount > 0" class="max-h-32 overflow-y-auto space-y-1 mt-2">
            <div v-for="result in validationResults.filter((r) => !r.valid)" :key="result.row" class="text-xs flex items-center space-x-2 p-2 rounded bg-red-500/10 text-red-400">
              <i class="pi pi-times-circle"></i>
              <span>Row {{ result.row }}: {{ result.address || "empty" }}</span>
              <span v-if="result.error">- {{ result.error }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Preview Changes -->
      <div v-if="showPreview" class="space-y-4">
        <!-- Context Banner -->
        <div class="bg-gradient-to-r from-biatec-accent/20 to-biatec-teal/20 border border-biatec-accent/30 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-white mb-2">Submission Context</h4>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-gray-400">Network:</span>
                  <span class="text-white font-semibold ml-2">{{ selectedNetwork }}</span>
                </div>
                <div>
                  <span class="text-gray-400">Token ID:</span>
                  <span class="text-white font-semibold ml-2">{{ tokenId }}</span>
                </div>
                <div>
                  <span class="text-gray-400">Addresses to Add:</span>
                  <span class="text-green-400 font-semibold ml-2">{{ previewAddresses.length }}</span>
                </div>
                <div>
                  <span class="text-gray-400">Current Whitelist:</span>
                  <span class="text-white font-semibold ml-2">{{ entries.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MICA Compliance Disclosure -->
        <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <i class="pi pi-exclamation-triangle text-yellow-400 text-lg mt-0.5"></i>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-yellow-400 mb-2">MICA Compliance Reminder</h4>
              <p class="text-xs text-gray-300 mb-2">Before submitting these changes, please ensure:</p>
              <ul class="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>All addresses have completed required KYC/AML verification</li>
                <li>Jurisdiction restrictions are properly documented</li>
                <li>Compliance checks are current and up-to-date</li>
                <li>Changes will be recorded in the audit trail for regulatory review</li>
              </ul>
              <div class="mt-2">
                <router-link :to="`/compliance/${tokenId}?network=${selectedNetwork}`" class="text-yellow-400 hover:text-yellow-300 text-xs underline">
                  View Compliance Dashboard & Audit Trail →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview List -->
        <div>
          <h4 class="text-sm font-semibold text-white mb-3">Addresses to be Added ({{ previewAddresses.length }})</h4>
          <div class="max-h-64 overflow-y-auto space-y-1">
            <div v-for="(addr, idx) in previewAddresses" :key="idx" class="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
              <code class="text-xs font-mono text-white">{{ formatAddress(addr) }}</code>
              <span class="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">New</span>
            </div>
          </div>
        </div>

        <!-- Duplicate Warning -->
        <div v-if="duplicateAddresses.length > 0" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <i class="pi pi-exclamation-triangle text-yellow-400 text-lg mt-0.5"></i>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-yellow-400 mb-2">Duplicate Addresses Detected</h4>
              <p class="text-xs text-gray-300 mb-2">The following addresses are already in the whitelist and will be skipped:</p>
              <div class="max-h-20 overflow-y-auto space-y-1">
                <code v-for="(addr, idx) in duplicateAddresses" :key="idx" class="block text-xs font-mono text-gray-400">
                  {{ formatAddress(addr) }}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div v-if="!showPreview" class="flex justify-between w-full">
          <button @click="validateCsvData" :disabled="!csvData || isValidating" class="px-4 py-2 text-biatec-accent hover:text-white transition-colors disabled:opacity-50">
            <i v-if="isValidating" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isValidating ? "Validating..." : "Validate CSV" }}
          </button>
          <div class="flex space-x-3">
            <button @click="closeBulkUploadModal" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button @click="showPreviewStep" :disabled="!csvData || invalidCount > 0 || validCount === 0" class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Preview Changes
              <i class="pi pi-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
        <div v-if="showPreview" class="flex justify-between w-full">
          <button @click="showPreview = false" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            <i class="pi pi-arrow-left mr-2"></i>
            Back to Edit
          </button>
          <div class="flex space-x-3">
            <button @click="closeBulkUploadModal" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button @click="confirmBulkUpload" :disabled="isUploading || previewAddresses.length === 0" class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              <i v-if="isUploading" class="pi pi-spin pi-spinner mr-2"></i>
              {{ isUploading ? "Submitting..." : `Submit ${previewAddresses.length} Address${previewAddresses.length !== 1 ? "es" : ""}` }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Remove Confirmation Modal -->
    <Modal :show="showRemoveModal" @close="showRemoveModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Confirm Removal</h3>
      </template>

      <div class="space-y-4">
        <p class="text-gray-300">Are you sure you want to remove this address from the whitelist?</p>
        <div class="bg-white/5 p-3 rounded-lg">
          <code class="text-sm font-mono text-white break-all">{{ addressToRemove }}</code>
        </div>
        <p class="text-sm text-gray-400">This action cannot be undone. The address will need to be re-added if needed.</p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="showRemoveModal = false" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            @click="removeAddress"
            :disabled="isRemoving"
            class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="isRemoving" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isRemoving ? "Removing..." : "Remove Address" }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Modal from "./ui/Modal.vue";
import Input from "./ui/Input.vue";
import { whitelistService, type WhitelistEntry, type CsvValidationResult } from "../services/legacyWhitelistService";
import { useToast } from "../composables/useToast";
import type { Network } from "../types/compliance";

const props = defineProps<{
  tokenId: string;
}>();

const toast = useToast();

// State
const entries = ref<WhitelistEntry[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref("");
const selectedNetwork = ref<Network>("VOI");
const isExporting = ref(false);

// Add address modal
const showAddModal = ref(false);
const newAddress = ref("");
const newAddressNotes = ref("");
const isAddingAddress = ref(false);
const addressError = ref("");

// Bulk upload modal
const showBulkUploadModal = ref(false);
const csvData = ref("");
const csvError = ref("");
const validationResults = ref<CsvValidationResult[]>([]);
const isValidating = ref(false);
const isUploading = ref(false);
const showPreview = ref(false);
const previewAddresses = ref<string[]>([]);
const duplicateAddresses = ref<string[]>([]);

// Remove confirmation modal
const showRemoveModal = ref(false);
const addressToRemove = ref("");
const isRemoving = ref(false);

// Computed
const filteredEntries = computed(() => {
  let filtered = entries.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((entry) => entry.address.toLowerCase().includes(query));
  }

  if (statusFilter.value) {
    filtered = filtered.filter((entry) => entry.status === statusFilter.value);
  }

  return filtered;
});

const validCount = computed(() => validationResults.value.filter((r) => r.valid).length);

const invalidCount = computed(() => validationResults.value.filter((r) => !r.valid).length);

const duplicateCount = computed(() => {
  const addresses = validationResults.value.filter((r) => r.valid).map((r) => r.address);
  const uniqueAddresses = new Set(addresses);
  return addresses.length - uniqueAddresses.size;
});

// Methods
const loadWhitelist = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    entries.value = await whitelistService.getWhitelist(props.tokenId, {
      search: searchQuery.value,
      status: statusFilter.value,
    });
  } catch (err: any) {
    error.value = err.message || "Failed to load whitelist";
    toast.error("Failed to load whitelist");
  } finally {
    isLoading.value = false;
  }
};

const addAddress = async () => {
  addressError.value = "";

  if (!newAddress.value) {
    addressError.value = "Address is required";
    return;
  }

  // Basic validation - VOI/Aramid use Algorand format
  const isValidAlgorand = /^[A-Z2-7]{58}$/.test(newAddress.value);

  if (!isValidAlgorand) {
    addressError.value = `Invalid ${selectedNetwork.value} address format. Must be 58 characters (A-Z, 2-7).`;
    return;
  }

  isAddingAddress.value = true;

  try {
    await whitelistService.addAddress(props.tokenId, newAddress.value, {
      notes: newAddressNotes.value,
    });

    toast.success("Address added to whitelist");
    showAddModal.value = false;
    newAddress.value = "";
    newAddressNotes.value = "";
    await loadWhitelist();
  } catch (err: any) {
    addressError.value = err.message || "Failed to add address";
    toast.error("Failed to add address");
  } finally {
    isAddingAddress.value = false;
  }
};

const confirmRemove = (address: string) => {
  addressToRemove.value = address;
  showRemoveModal.value = true;
};

const removeAddress = async () => {
  isRemoving.value = true;

  try {
    await whitelistService.removeAddress(props.tokenId, addressToRemove.value);

    toast.success("Address removed from whitelist");
    showRemoveModal.value = false;
    addressToRemove.value = "";
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || "Failed to remove address");
  } finally {
    isRemoving.value = false;
  }
};

const validateCsvData = async () => {
  if (!csvData.value) return;

  csvError.value = "";
  isValidating.value = true;

  try {
    // Check file format
    const lines = csvData.value.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      csvError.value = "CSV file is empty";
      validationResults.value = [];
      return;
    }

    // Check for header
    if (!lines[0].toLowerCase().includes("address")) {
      csvError.value = 'CSV must contain an "address" column header';
      validationResults.value = [];
      return;
    }

    // Validate addresses
    validationResults.value = await whitelistService.validateCsv(csvData.value);

    // Check for network compatibility (VOI/Aramid use Algorand format)
    const invalidFormatAddresses = validationResults.value.filter((r) => {
      if (!r.valid) return false;
      const isAlgorandFormat = /^[A-Z2-7]{58}$/.test(r.address);
      return !isAlgorandFormat;
    });

    if (invalidFormatAddresses.length > 0) {
      csvError.value = `Network mismatch: ${invalidFormatAddresses.length} address(es) are not compatible with ${selectedNetwork.value} network. VOI/Aramid require Algorand format addresses (58 characters, A-Z2-7).`;
    }

    // Check for duplicates in CSV using Set for O(n) performance
    const addressSet = new Set<string>();
    const duplicatesInCsv: string[] = [];

    validationResults.value.forEach((result) => {
      if (result.valid) {
        if (addressSet.has(result.address)) {
          duplicatesInCsv.push(result.address);
        } else {
          addressSet.add(result.address);
        }
      }
    });

    if (duplicatesInCsv.length > 0) {
      // Mark duplicates as invalid
      validationResults.value.forEach((r) => {
        if (duplicatesInCsv.includes(r.address) && r.valid) {
          r.valid = false;
          r.error = "Duplicate address in CSV";
        }
      });
    }
  } catch (err: any) {
    csvError.value = err.message || "Failed to validate CSV";
    toast.error("Failed to validate CSV");
  } finally {
    isValidating.value = false;
  }
};

const showPreviewStep = async () => {
  if (!csvData.value || invalidCount.value > 0) return;

  // Get list of addresses to add (excluding existing ones)
  const csvAddresses = validationResults.value.filter((r) => r.valid).map((r) => r.address);

  // Remove duplicates from CSV list
  const uniqueCsvAddresses = Array.from(new Set(csvAddresses));

  // Check for existing addresses in whitelist
  const existingAddresses = entries.value.map((e) => e.address);
  const duplicates = uniqueCsvAddresses.filter((addr) => existingAddresses.includes(addr));
  const newAddresses = uniqueCsvAddresses.filter((addr) => !existingAddresses.includes(addr));

  previewAddresses.value = newAddresses;
  duplicateAddresses.value = duplicates;
  showPreview.value = true;
};

const confirmBulkUpload = async () => {
  if (previewAddresses.value.length === 0) return;

  isUploading.value = true;

  try {
    // Create a new CSV with only the addresses to add
    const headerLine = "address";
    const addressLines = previewAddresses.value.join("\n");
    const filteredCsvData = `${headerLine}\n${addressLines}`;

    const result = await whitelistService.bulkUpload(props.tokenId, filteredCsvData);

    toast.success(`Successfully added ${result.success} address${result.success !== 1 ? "es" : ""} to whitelist`);

    if (result.failed > 0) {
      toast.warning(`${result.failed} address${result.failed !== 1 ? "es" : ""} failed to upload`);
    }

    closeBulkUploadModal();
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || "Failed to upload addresses");
  } finally {
    isUploading.value = false;
  }
};

const closeBulkUploadModal = () => {
  showBulkUploadModal.value = false;
  showPreview.value = false;
  csvData.value = "";
  csvError.value = "";
  validationResults.value = [];
  previewAddresses.value = [];
  duplicateAddresses.value = [];
};

const loadSampleCsv = () => {
  // Note: These are example addresses for demonstration purposes only
  // Replace with actual valid addresses before importing
  csvData.value = `address,notes
AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKLLLLMMMMNNNN,Sample Address 1 (Example - Replace with valid address)
PPPPQQQQRRRRSSSSTTTTYYYYZZZZAAAA2222333344445555666677777,Sample Address 2 (Example - Replace with valid address)
7777777777777777777777777777777777777777777777777777777A,Sample Address 3 (Example - Replace with valid address)`;
};

const exportWhitelist = async () => {
  isExporting.value = true;

  try {
    const report = await whitelistService.exportComplianceReport(props.tokenId, selectedNetwork.value, "csv");

    // Create and download file
    const blob = new Blob([report as string], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whitelist_${props.tokenId}_${selectedNetwork.value}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Whitelist exported successfully");
  } catch (err: any) {
    toast.error(err.message || "Failed to export whitelist");
  } finally {
    isExporting.value = false;
  }
};

const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  } catch (err) {
    toast.error("Failed to copy address");
  }
};

const formatAddress = (address: string) => {
  if (address.length > 20) {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  }
  return address;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "removed":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  }
};

// Lifecycle
onMounted(() => {
  loadWhitelist();
});
</script>
