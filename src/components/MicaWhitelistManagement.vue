<template>
  <div class="mica-whitelist-management">
    <!-- Header Section with Export -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white mb-2">MICA Whitelist Management</h2>
        <p class="text-gray-400">Manage approved addresses with full MICA compliance tracking</p>
      </div>
      <div class="flex space-x-2">
        <button @click="exportReport('json')" :disabled="isExporting" class="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2">
          <i class="pi pi-download"></i>
          <span>Export JSON</span>
        </button>
        <button @click="exportReport('csv')" :disabled="isExporting" class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2">
          <i class="pi pi-file-excel"></i>
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="glass-effect rounded-xl p-4">
        <div class="text-2xl font-bold text-white">{{ statistics.total }}</div>
        <div class="text-sm text-gray-400">Total Addresses</div>
      </div>
      <div class="glass-effect rounded-xl p-4">
        <div class="text-2xl font-bold text-green-400">{{ statistics.active }}</div>
        <div class="text-sm text-gray-400">Active</div>
      </div>
      <div class="glass-effect rounded-xl p-4">
        <div class="text-2xl font-bold text-blue-400">{{ statistics.kycVerified }}</div>
        <div class="text-sm text-gray-400">KYC Verified</div>
      </div>
      <div class="glass-effect rounded-xl p-4">
        <div class="text-2xl font-bold text-purple-400">{{ statistics.complianceScore }}%</div>
        <div class="text-sm text-gray-400">Compliance Score</div>
      </div>
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
        <select v-model="statusFilter" class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent" data-testid="status-filter">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="removed">Removed</option>
        </select>

        <!-- KYC Filter -->
        <select v-model="kycFilter" class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-biatec-accent" data-testid="kyc-filter">
          <option value="">All KYC Status</option>
          <option value="verified">KYC Verified</option>
          <option value="not-verified">Not Verified</option>
        </select>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <button @click="showAddModal = true" class="btn-primary px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <i class="pi pi-plus"></i>
            <span>Add Address</span>
          </button>
          <button @click="showImportModal = true" class="px-4 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors flex items-center space-x-2">
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
    <div v-else-if="filteredEntries.length === 0 && !searchQuery && !statusFilter && !kycFilter" class="glass-effect rounded-xl p-12 text-center">
      <i class="pi pi-list text-6xl text-gray-400 mb-6"></i>
      <h3 class="text-2xl font-semibold text-white mb-4">No Addresses Yet</h3>
      <p class="text-gray-400 mb-6">Start by adding addresses to the whitelist with MICA compliance metadata</p>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">KYC</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Requester</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Added</th>
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
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="entry.kycVerified" class="text-green-400 flex items-center space-x-1">
                  <i class="pi pi-check-circle"></i>
                  <span class="text-xs">Verified</span>
                </span>
                <span v-else class="text-gray-400 text-xs">Not Verified</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                {{ entry.reason || "-" }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                {{ entry.requester || "-" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(entry.addedAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button @click="viewDetails(entry)" class="text-blue-400 hover:text-blue-300 transition-colors" title="View details">
                  <i class="pi pi-eye"></i>
                </button>
                <button @click="confirmRemove(entry.address)" class="text-red-400 hover:text-red-300 transition-colors" title="Remove from whitelist">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Address Modal with MICA Fields -->
    <Modal :show="showAddModal" @close="closeAddModal">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Add Address to Whitelist</h3>
        <p class="text-sm text-gray-400 mt-1">Include MICA compliance metadata for audit trail</p>
      </template>

      <div class="space-y-4">
        <Input v-model="newAddress" label="Address" placeholder="Enter wallet address" :error="addressError" required />

        <Input v-model="newAddressReason" label="Reason (Required for MICA)" placeholder="e.g., Passed KYC/AML verification" required />

        <Input v-model="newAddressRequester" label="Requester" placeholder="Who requested this whitelist entry?" />

        <Input v-model="newAddressJurisdiction" label="Jurisdiction Code" placeholder="e.g., US, EU, UK" />

        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm text-gray-300">
            <input v-model="newAddressKycVerified" type="checkbox" class="rounded border-white/20 bg-white/10 text-biatec-accent focus:ring-biatec-accent" />
            <span>KYC Verified</span>
          </label>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-300"> Compliance Checks </label>
          <div class="space-y-2 pl-4">
            <label class="flex items-center space-x-2 text-sm text-gray-300">
              <input v-model="newAddressComplianceChecks.sanctionsScreening" type="checkbox" class="rounded border-white/20 bg-white/10 text-biatec-accent focus:ring-biatec-accent" />
              <span>Sanctions Screening Passed</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-gray-300">
              <input v-model="newAddressComplianceChecks.amlVerification" type="checkbox" class="rounded border-white/20 bg-white/10 text-biatec-accent focus:ring-biatec-accent" />
              <span>AML Verification Completed</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-gray-300">
              <input v-model="newAddressComplianceChecks.accreditedInvestor" type="checkbox" class="rounded border-white/20 bg-white/10 text-biatec-accent focus:ring-biatec-accent" />
              <span>Accredited Investor</span>
            </label>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300"> Notes (optional) </label>
          <textarea
            v-model="newAddressNotes"
            rows="3"
            placeholder="Additional notes or documentation references..."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          ></textarea>
        </div>

        <div v-if="!isEnterpriseSubscriber" class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-start space-x-3">
            <i class="pi pi-info-circle text-yellow-400 mt-1"></i>
            <div class="text-sm text-yellow-300">
              <p class="font-medium mb-1">Enterprise Feature</p>
              <p class="text-yellow-400">Full MICA compliance tracking requires an Enterprise subscription. Upgrade to unlock all features.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="closeAddModal" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button @click="addAddress" :disabled="isAddingAddress || !newAddress || !newAddressReason" class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <i v-if="isAddingAddress" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isAddingAddress ? "Adding..." : "Add Address" }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Import CSV Modal -->
    <Modal :show="showImportModal" @close="closeImportModal">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Import Addresses from CSV</h3>
        <p class="text-sm text-gray-400 mt-1">Import addresses with MICA compliance metadata</p>
      </template>

      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-400 mb-2">Upload a CSV file with MICA compliance columns:</p>
          <div class="text-xs text-gray-500 space-y-1 mb-4">
            <p>Required columns:</p>
            <code class="block bg-white/5 p-3 rounded font-mono">
              address,reason,requester,kyc_verified,jurisdiction,notes<br />
              AAAA...BBBB,"KYC Verified","John Doe",true,US,"Accredited investor"<br />
              CCCC...DDDD,"AML Check Passed","Jane Smith",true,EU,"Institutional client"
            </code>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300"> CSV Data </label>
          <textarea
            v-model="csvData"
            rows="10"
            placeholder="Paste CSV content here..."
            class="w-full px-3 py-2 font-mono text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          ></textarea>
        </div>

        <!-- Validation Results -->
        <div v-if="validationResults.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-white">Validation Results</h4>
          <div class="max-h-48 overflow-y-auto space-y-1">
            <div v-for="result in validationResults" :key="result.row" :class="result.valid ? 'text-green-400' : 'text-red-400'" class="text-xs flex items-center space-x-2 p-2 rounded bg-white/5">
              <i :class="result.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
              <span>Row {{ result.row }}: {{ result.address || "empty" }}</span>
              <span v-if="result.error" class="text-red-400">- {{ result.error }}</span>
            </div>
          </div>
          <div class="text-sm">
            <span class="text-green-400">{{ validCount }} valid</span>
            <span class="text-gray-400"> / </span>
            <span class="text-red-400">{{ invalidCount }} invalid</span>
          </div>
        </div>

        <div v-if="!isEnterpriseSubscriber" class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-start space-x-3">
            <i class="pi pi-info-circle text-yellow-400 mt-1"></i>
            <div class="text-sm text-yellow-300">
              <p class="font-medium mb-1">Enterprise Feature</p>
              <p class="text-yellow-400">Bulk import with MICA metadata requires an Enterprise subscription.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <button @click="validateCsvData" :disabled="!csvData || isValidating" class="px-4 py-2 text-biatec-accent hover:text-white transition-colors disabled:opacity-50">
            <i v-if="isValidating" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isValidating ? "Validating..." : "Validate" }}
          </button>
          <div class="flex space-x-3">
            <button @click="closeImportModal" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button
              @click="importCsv"
              :disabled="isImporting || !csvData || invalidCount > 0 || !isEnterpriseSubscriber"
              class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="isImporting" class="pi pi-spin pi-spinner mr-2"></i>
              {{ isImporting ? "Importing..." : "Import" }}
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

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300"> Reason for Removal (Required for MICA Audit) </label>
          <textarea
            v-model="removeReason"
            rows="3"
            placeholder="e.g., Compliance violation, User request, etc."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
            required
          ></textarea>
        </div>

        <p class="text-sm text-gray-400">This action will be recorded in the audit trail. The address will need to be re-added if needed.</p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="showRemoveModal = false" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            @click="removeAddress"
            :disabled="isRemoving || !removeReason"
            class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="isRemoving" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isRemoving ? "Removing..." : "Remove Address" }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- View Details Modal -->
    <Modal :show="showDetailsModal" @close="showDetailsModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-white">Address Details</h3>
      </template>

      <div v-if="selectedEntry" class="space-y-4">
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-400 uppercase">Address</label>
              <code class="block mt-1 text-sm font-mono text-white break-all">{{ selectedEntry.address }}</code>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Status</label>
              <div class="mt-1">
                <span :class="statusBadgeClass(selectedEntry.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ selectedEntry.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-400 uppercase">KYC Verified</label>
              <div class="mt-1 text-sm text-white">
                {{ selectedEntry.kycVerified ? "Yes" : "No" }}
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Jurisdiction</label>
              <div class="mt-1 text-sm text-white">
                {{ selectedEntry.jurisdictionCode || "Not specified" }}
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-400 uppercase">Reason</label>
            <div class="mt-1 text-sm text-white">
              {{ selectedEntry.reason || "Not specified" }}
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-400 uppercase">Requester</label>
            <div class="mt-1 text-sm text-white">
              {{ selectedEntry.requester || "Not specified" }}
            </div>
          </div>

          <div v-if="selectedEntry.complianceChecks">
            <label class="text-xs text-gray-400 uppercase">Compliance Checks</label>
            <div class="mt-2 space-y-2">
              <div class="flex items-center space-x-2">
                <i :class="selectedEntry.complianceChecks.sanctionsScreening ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-gray-400'"></i>
                <span class="text-sm text-white">Sanctions Screening</span>
              </div>
              <div class="flex items-center space-x-2">
                <i :class="selectedEntry.complianceChecks.amlVerification ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-gray-400'"></i>
                <span class="text-sm text-white">AML Verification</span>
              </div>
              <div class="flex items-center space-x-2">
                <i :class="selectedEntry.complianceChecks.accreditedInvestor ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-gray-400'"></i>
                <span class="text-sm text-white">Accredited Investor</span>
              </div>
            </div>
          </div>

          <div v-if="selectedEntry.notes">
            <label class="text-xs text-gray-400 uppercase">Notes</label>
            <div class="mt-1 text-sm text-white whitespace-pre-wrap">
              {{ selectedEntry.notes }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-400 uppercase">Added At</label>
              <div class="mt-1 text-sm text-white">
                {{ formatDate(selectedEntry.addedAt) }}
              </div>
            </div>
            <div v-if="selectedEntry.updatedAt">
              <label class="text-xs text-gray-400 uppercase">Updated At</label>
              <div class="mt-1 text-sm text-white">
                {{ formatDate(selectedEntry.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button @click="showDetailsModal = false" class="px-4 py-2 btn-primary rounded-lg">Close</button>
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
import { useSubscriptionStore } from "../stores/subscription";

const props = defineProps<{
  tokenId: string;
  network?: string;
}>();

const toast = useToast();
const subscriptionStore = useSubscriptionStore();

// Check if user has enterprise subscription
const isEnterpriseSubscriber = computed(() => {
  // For now, we'll check if the user has an active subscription
  // In production, this should check for specific enterprise tier
  return subscriptionStore.isActive;
});

// State
const entries = ref<WhitelistEntry[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref("");
const kycFilter = ref("");

// Add address modal
const showAddModal = ref(false);
const newAddress = ref("");
const newAddressReason = ref("");
const newAddressRequester = ref("");
const newAddressJurisdiction = ref("");
const newAddressKycVerified = ref(false);
const newAddressComplianceChecks = ref({
  sanctionsScreening: false,
  amlVerification: false,
  accreditedInvestor: false,
});
const newAddressNotes = ref("");
const isAddingAddress = ref(false);
const addressError = ref("");

// Import modal
const showImportModal = ref(false);
const csvData = ref("");
const validationResults = ref<CsvValidationResult[]>([]);
const isValidating = ref(false);
const isImporting = ref(false);

// Remove confirmation modal
const showRemoveModal = ref(false);
const addressToRemove = ref("");
const removeReason = ref("");
const isRemoving = ref(false);

// Details modal
const showDetailsModal = ref(false);
const selectedEntry = ref<WhitelistEntry | null>(null);

// Export
const isExporting = ref(false);

// Computed
const filteredEntries = computed(() => {
  let filtered = entries.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((entry) => entry.address.toLowerCase().includes(query) || entry.reason?.toLowerCase().includes(query) || entry.requester?.toLowerCase().includes(query));
  }

  if (statusFilter.value) {
    filtered = filtered.filter((entry) => entry.status === statusFilter.value);
  }

  if (kycFilter.value === "verified") {
    filtered = filtered.filter((entry) => entry.kycVerified === true);
  } else if (kycFilter.value === "not-verified") {
    filtered = filtered.filter((entry) => entry.kycVerified !== true);
  }

  return filtered;
});

const statistics = computed(() => {
  const total = entries.value.length;
  const active = entries.value.filter((e) => e.status === "active").length;
  const kycVerified = entries.value.filter((e) => e.kycVerified).length;

  // Calculate compliance score based on various factors
  let score = 0;
  if (total > 0) {
    score = Math.round(
      (kycVerified / total) * 40 + // 40% weight for KYC
        (active / total) * 30 + // 30% weight for active addresses
        (entries.value.filter((e) => e.reason).length / total) * 20 + // 20% weight for documented reasons
        (entries.value.filter((e) => e.complianceChecks?.sanctionsScreening).length / total) * 10, // 10% weight for sanctions screening
    );
  }

  return {
    total,
    active,
    kycVerified,
    complianceScore: score,
  };
});

const validCount = computed(() => validationResults.value.filter((r) => r.valid).length);

const invalidCount = computed(() => validationResults.value.filter((r) => !r.valid).length);

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

  if (!newAddressReason.value) {
    addressError.value = "Reason is required for MICA compliance";
    return;
  }

  // Basic validation
  const isValidAlgorand = /^[A-Z2-7]{58}$/.test(newAddress.value);
  const isValidEthereum = /^0x[a-fA-F0-9]{40}$/.test(newAddress.value);

  if (!isValidAlgorand && !isValidEthereum) {
    addressError.value = "Invalid address format";
    return;
  }

  isAddingAddress.value = true;

  try {
    await whitelistService.addAddress(props.tokenId, newAddress.value, {
      reason: newAddressReason.value,
      requester: newAddressRequester.value,
      jurisdictionCode: newAddressJurisdiction.value,
      kycVerified: newAddressKycVerified.value,
      complianceChecks: newAddressComplianceChecks.value,
      notes: newAddressNotes.value,
    });

    toast.success("Address added to whitelist with MICA metadata");
    closeAddModal();
    await loadWhitelist();
  } catch (err: any) {
    addressError.value = err.message || "Failed to add address";
    toast.error("Failed to add address");
  } finally {
    isAddingAddress.value = false;
  }
};

const closeAddModal = () => {
  showAddModal.value = false;
  newAddress.value = "";
  newAddressReason.value = "";
  newAddressRequester.value = "";
  newAddressJurisdiction.value = "";
  newAddressKycVerified.value = false;
  newAddressComplianceChecks.value = {
    sanctionsScreening: false,
    amlVerification: false,
    accreditedInvestor: false,
  };
  newAddressNotes.value = "";
  addressError.value = "";
};

const confirmRemove = (address: string) => {
  addressToRemove.value = address;
  removeReason.value = "";
  showRemoveModal.value = true;
};

const removeAddress = async () => {
  if (!removeReason.value) {
    toast.error("Please provide a reason for removal");
    return;
  }

  isRemoving.value = true;

  try {
    await whitelistService.removeAddress(props.tokenId, addressToRemove.value);

    toast.success("Address removed from whitelist");
    showRemoveModal.value = false;
    addressToRemove.value = "";
    removeReason.value = "";
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || "Failed to remove address");
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
    toast.error("Failed to validate CSV");
  } finally {
    isValidating.value = false;
  }
};

const importCsv = async () => {
  if (!csvData.value) return;

  if (!isEnterpriseSubscriber.value) {
    toast.error("Enterprise subscription required for bulk import with MICA metadata");
    return;
  }

  isImporting.value = true;

  try {
    const result = await whitelistService.importFromCsv(props.tokenId, csvData.value);

    toast.success(`Imported ${result.success} addresses with MICA metadata`);

    if (result.failed > 0) {
      toast.warning(`${result.failed} addresses failed to import`);
    }

    closeImportModal();
    await loadWhitelist();
  } catch (err: any) {
    toast.error(err.message || "Failed to import addresses");
  } finally {
    isImporting.value = false;
  }
};

const closeImportModal = () => {
  showImportModal.value = false;
  csvData.value = "";
  validationResults.value = [];
};

const exportReport = async (format: "json" | "csv") => {
  if (!isEnterpriseSubscriber.value) {
    toast.error("Enterprise subscription required for MICA compliance reports");
    return;
  }

  isExporting.value = true;

  try {
    const report = await whitelistService.exportComplianceReport(props.tokenId, props.network || "VOI", format);

    // Create download
    const filename = `mica-whitelist-report-${props.tokenId}-${Date.now()}.${format}`;
    const content = format === "json" ? JSON.stringify(report, null, 2) : typeof report === "string" ? report : JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`MICA compliance report exported as ${format.toUpperCase()}`);
  } catch (err: any) {
    toast.error(err.message || "Failed to export report");
  } finally {
    isExporting.value = false;
  }
};

const viewDetails = (entry: WhitelistEntry) => {
  selectedEntry.value = entry;
  showDetailsModal.value = true;
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
