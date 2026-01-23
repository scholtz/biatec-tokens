<template>
  <div class="whitelist-management">
    <!-- Header Section -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">Whitelist Management</h2>
      <p class="text-gray-400">Manage approved addresses for this RWA token</p>
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
              class="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
            />
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <!-- Status Filter -->
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="removed">Removed</option>
        </select>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <button
            @click="showAddModal = true"
            class="btn-primary px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <i class="pi pi-plus"></i>
            <span>Add Address</span>
          </button>
          <button
            @click="showBulkUploadModal = true"
            class="px-4 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors flex items-center space-x-2"
          >
            <i class="pi pi-upload"></i>
            <span>Bulk Upload</span>
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
      <button @click="loadWhitelist" class="btn-primary px-6 py-2 rounded-lg">
        Retry
      </button>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Address
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Added
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Notes
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            <tr v-for="entry in filteredEntries" :key="entry.address" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <code class="text-sm font-mono text-white">
                    {{ formatAddress(entry.address) }}
                  </code>
                  <button
                    @click="copyAddress(entry.address)"
                    class="text-gray-400 hover:text-biatec-accent transition-colors"
                    title="Copy address"
                  >
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
                {{ entry.notes || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="confirmRemove(entry.address)"
                  class="text-red-400 hover:text-red-300 transition-colors"
                  title="Remove from whitelist"
                >
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
        <Input
          v-model="newAddress"
          label="Address"
          placeholder="Enter wallet address"
          :error="addressError"
          required
        />
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300">
            Notes (optional)
          </label>
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
          <button
            @click="showAddModal = false"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="addAddress"
            :disabled="isAddingAddress || !newAddress"
            class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="isAddingAddress" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isAddingAddress ? 'Adding...' : 'Add Address' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Bulk Upload Modal -->
    <Modal :show="showBulkUploadModal" @close="showBulkUploadModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Bulk Upload Addresses</h3>
      </template>

      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-400 mb-2">
            Upload a CSV file with addresses. Format: one address per line or with header "address".
          </p>
          <div class="text-xs text-gray-500 space-y-1 mb-4">
            <p>Example:</p>
            <code class="block bg-white/5 p-2 rounded">
              address<br />
              AAAA...BBBB<br />
              CCCC...DDDD
            </code>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300">
            CSV Data
          </label>
          <textarea
            v-model="csvData"
            rows="8"
            placeholder="Paste CSV content here..."
            class="w-full px-3 py-2 font-mono text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          ></textarea>
        </div>

        <!-- Validation Results -->
        <div v-if="validationResults.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-white">Validation Results</h4>
          <div class="max-h-48 overflow-y-auto space-y-1">
            <div
              v-for="result in validationResults"
              :key="result.row"
              :class="result.valid ? 'text-green-400' : 'text-red-400'"
              class="text-xs flex items-center space-x-2 p-2 rounded bg-white/5"
            >
              <i :class="result.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
              <span>Row {{ result.row }}: {{ result.address || 'empty' }}</span>
              <span v-if="result.error" class="text-red-400">- {{ result.error }}</span>
            </div>
          </div>
          <div class="text-sm">
            <span class="text-green-400">{{ validCount }} valid</span>
            <span class="text-gray-400"> / </span>
            <span class="text-red-400">{{ invalidCount }} invalid</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <button
            @click="validateCsvData"
            :disabled="!csvData || isValidating"
            class="px-4 py-2 text-biatec-accent hover:text-white transition-colors disabled:opacity-50"
          >
            <i v-if="isValidating" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isValidating ? 'Validating...' : 'Validate' }}
          </button>
          <div class="flex space-x-3">
            <button
              @click="showBulkUploadModal = false"
              class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              @click="bulkUpload"
              :disabled="isUploading || !csvData || invalidCount > 0"
              class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="isUploading" class="pi pi-spin pi-spinner mr-2"></i>
              {{ isUploading ? 'Uploading...' : 'Upload' }}
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
        <p class="text-gray-300">
          Are you sure you want to remove this address from the whitelist?
        </p>
        <div class="bg-white/5 p-3 rounded-lg">
          <code class="text-sm font-mono text-white break-all">{{ addressToRemove }}</code>
        </div>
        <p class="text-sm text-gray-400">
          This action cannot be undone. The address will need to be re-added if needed.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showRemoveModal = false"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="removeAddress"
            :disabled="isRemoving"
            class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="isRemoving" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isRemoving ? 'Removing...' : 'Remove Address' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Modal from './ui/Modal.vue';
import Input from './ui/Input.vue';
import { whitelistService, type WhitelistEntry, type CsvValidationResult } from '../services/WhitelistService';
import { useToast } from '../composables/useToast';

const props = defineProps<{
  tokenId: string;
}>();

const toast = useToast();

// State
const entries = ref<WhitelistEntry[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref('');

// Add address modal
const showAddModal = ref(false);
const newAddress = ref('');
const newAddressNotes = ref('');
const isAddingAddress = ref(false);
const addressError = ref('');

// Bulk upload modal
const showBulkUploadModal = ref(false);
const csvData = ref('');
const validationResults = ref<CsvValidationResult[]>([]);
const isValidating = ref(false);
const isUploading = ref(false);

// Remove confirmation modal
const showRemoveModal = ref(false);
const addressToRemove = ref('');
const isRemoving = ref(false);

// Computed
const filteredEntries = computed(() => {
  let filtered = entries.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((entry) =>
      entry.address.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value) {
    filtered = filtered.filter((entry) => entry.status === statusFilter.value);
  }

  return filtered;
});

const validCount = computed(() =>
  validationResults.value.filter((r) => r.valid).length
);

const invalidCount = computed(() =>
  validationResults.value.filter((r) => !r.valid).length
);

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
    error.value = err.message || 'Failed to load whitelist';
    toast.error('Failed to load whitelist');
  } finally {
    isLoading.value = false;
  }
};

const addAddress = async () => {
  addressError.value = '';
  
  if (!newAddress.value) {
    addressError.value = 'Address is required';
    return;
  }

  // Basic validation
  const isValidAlgorand = /^[A-Z2-7]{58}$/.test(newAddress.value);
  const isValidEthereum = /^0x[a-fA-F0-9]{40}$/.test(newAddress.value);
  
  if (!isValidAlgorand && !isValidEthereum) {
    addressError.value = 'Invalid address format';
    return;
  }

  isAddingAddress.value = true;

  try {
    await whitelistService.addAddress(
      props.tokenId,
      newAddress.value,
      {
        notes: newAddressNotes.value
      }
    );
    
    toast.success('Address added to whitelist');
    showAddModal.value = false;
    newAddress.value = '';
    newAddressNotes.value = '';
    await loadWhitelist();
  } catch (err: any) {
    addressError.value = err.message || 'Failed to add address';
    toast.error('Failed to add address');
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
    
    toast.success('Address removed from whitelist');
    showRemoveModal.value = false;
    addressToRemove.value = '';
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || 'Failed to remove address');
  } finally {
    isRemoving.value = false;
  }
};

const validateCsvData = async () => {
  if (!csvData.value) return;

  isValidating.value = true;

  try {
    validationResults.value = await whitelistService.validateCsv(csvData.value);
  } catch (err: any) {
    toast.error('Failed to validate CSV');
  } finally {
    isValidating.value = false;
  }
};

const bulkUpload = async () => {
  if (!csvData.value) return;

  isUploading.value = true;

  try {
    const result = await whitelistService.bulkUpload(props.tokenId, csvData.value);
    
    toast.success(`Uploaded ${result.success} addresses successfully`);
    
    if (result.failed > 0) {
      toast.warning(`${result.failed} addresses failed to upload`);
    }
    
    showBulkUploadModal.value = false;
    csvData.value = '';
    validationResults.value = [];
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || 'Failed to upload addresses');
  } finally {
    isUploading.value = false;
  }
};

const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  } catch (err) {
    toast.error('Failed to copy address');
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'removed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
};

// Lifecycle
onMounted(() => {
  loadWhitelist();
});
</script>
