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

          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i class="pi pi-users text-biatec-accent"></i>
                Whitelist Management
              </h1>
              <p class="text-gray-400">
                MICA-compliant investor whitelist and jurisdiction management for regulated token issuance
              </p>
            </div>
            <div class="flex gap-3">
              <button
                @click="showImportModal = true"
                class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-upload"></i>
                <span>Import CSV</span>
              </button>
              <button
                @click="showCreateModal = true"
                class="px-4 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-plus"></i>
                <span>Add Entry</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-list text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">{{ summary?.totalEntries || 0 }}</div>
            <div class="text-sm text-gray-400">Total Entries</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-check-circle text-green-400 text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-green-400">{{ summary?.approvedCount || 0 }}</div>
            <div class="text-sm text-gray-400">Approved</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-clock text-yellow-400 text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-yellow-400">{{ summary?.pendingCount || 0 }}</div>
            <div class="text-sm text-gray-400">Pending Review</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-globe text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">{{ summary?.jurisdictionsCovered || 0 }}</div>
            <div class="text-sm text-gray-400">Jurisdictions</div>
          </div>
        </div>

        <!-- Conflicts Alert -->
        <div
          v-if="criticalConflicts.length > 0"
          class="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <h3 class="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            Jurisdiction Conflicts Detected
          </h3>
          <div class="space-y-2">
            <div
              v-for="conflict in criticalConflicts"
              :key="conflict.entryId"
              class="p-3 bg-white/5 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/50">
                  ERROR
                </span>
                <div class="flex-1">
                  <div class="text-sm text-white font-medium mb-1">{{ conflict.message }}</div>
                  <div class="text-xs text-gray-400">Entry: {{ conflict.entryName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && !hasEntries" class="glass-effect rounded-xl p-12 text-center">
          <i class="pi pi-users text-6xl text-gray-600 mb-4"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No Whitelist Entries Yet</h2>
          <p class="text-gray-400 mb-6 max-w-md mx-auto">
            Start building your MICA-compliant investor whitelist by adding individual entries or importing from CSV.
            Whitelist management is essential for regulated token issuance and jurisdiction compliance.
          </p>
          <div class="flex gap-3 justify-center">
            <button
              @click="showImportModal = true"
              class="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-upload"></i>
              <span>Import from CSV</span>
            </button>
            <button
              @click="showCreateModal = true"
              class="px-6 py-3 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-plus"></i>
              <span>Add First Entry</span>
            </button>
          </div>
          
          <!-- Help Section -->
          <div class="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left max-w-2xl mx-auto">
            <h3 class="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <i class="pi pi-info-circle"></i>
              Getting Started with Whitelist Management
            </h3>
            <ul class="space-y-2 text-sm text-gray-300">
              <li class="flex items-start gap-2">
                <i class="pi pi-check text-green-400 mt-1"></i>
                <span>
                  <strong>Individual Entries:</strong> Add investors one by one with full KYC and accreditation details
                </span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-check text-green-400 mt-1"></i>
                <span>
                  <strong>Bulk Import:</strong> Upload CSV files with multiple entries for faster onboarding
                </span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-check text-green-400 mt-1"></i>
                <span>
                  <strong>Jurisdiction Rules:</strong> Define allowed, restricted, and blocked jurisdictions for compliance
                </span>
              </li>
              <li class="flex items-start gap-2">
                <i class="pi pi-check text-green-400 mt-1"></i>
                <span>
                  <strong>Audit Trail:</strong> Every change is logged for regulatory reporting and compliance verification
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Whitelist Table -->
        <div v-else>
          <WhitelistTable
            :conflicts="conflictIds"
            @view-details="viewDetails"
            @approve="approveEntry"
            @reject="rejectEntry"
          />
        </div>
      </div>
    </div>

    <!-- Entry Detail Modal -->
    <Modal :show="showDetailModal" @close="showDetailModal = false" size="xl">
      <WhitelistDetailPanel
        v-if="selectedEntry"
        :entry="selectedEntry"
        @close="showDetailModal = false"
        @updated="handleEntryUpdated"
      />
    </Modal>

    <!-- Create Entry Modal -->
    <Modal :show="showCreateModal" @close="showCreateModal = false" size="lg">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Whitelist Entry</h3>
      </template>
      <WhitelistEntryForm @submit="handleCreateEntry" @cancel="showCreateModal = false" />
    </Modal>

    <!-- CSV Import Modal -->
    <CSVImportDialog :show="showImportModal" @close="handleImportClose" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '../layout/MainLayout.vue';
import WhitelistTable from '../components/whitelist/WhitelistTable.vue';
import WhitelistDetailPanel from '../components/whitelist/WhitelistDetailPanel.vue';
import WhitelistEntryForm from '../components/whitelist/WhitelistEntryForm.vue';
import CSVImportDialog from '../components/whitelist/CSVImportDialog.vue';
import Modal from '../components/ui/Modal.vue';
import { useWhitelistStore } from '../stores/whitelist';
import type { WhitelistEntry, CreateWhitelistEntryRequest } from '../types/whitelist';

const whitelistStore = useWhitelistStore();

const showDetailModal = ref(false);
const showCreateModal = ref(false);
const showImportModal = ref(false);
const selectedEntry = ref<WhitelistEntry | null>(null);

const summary = computed(() => whitelistStore.summary);
const hasEntries = computed(() => whitelistStore.hasEntries);
const isLoading = computed(() => whitelistStore.isLoading);
const criticalConflicts = computed(() => whitelistStore.criticalConflicts);
const conflictIds = computed(() => criticalConflicts.value.map(c => c.entryId));

function viewDetails(entry: WhitelistEntry) {
  selectedEntry.value = entry;
  showDetailModal.value = true;
}

function approveEntry(entry: WhitelistEntry) {
  selectedEntry.value = entry;
  showDetailModal.value = true;
}

function rejectEntry(entry: WhitelistEntry) {
  selectedEntry.value = entry;
  showDetailModal.value = true;
}

async function handleCreateEntry(request: CreateWhitelistEntryRequest) {
  const newEntry = await whitelistStore.createWhitelistEntry(request);
  if (newEntry) {
    showCreateModal.value = false;
    // Refresh data
    await whitelistStore.fetchWhitelistSummary();
  }
}

function handleEntryUpdated() {
  // Refresh the list after entry update
  whitelistStore.fetchWhitelistEntries();
  whitelistStore.fetchWhitelistSummary();
}

function handleImportClose() {
  showImportModal.value = false;
  // Refresh data after import
  whitelistStore.fetchWhitelistEntries();
  whitelistStore.fetchWhitelistSummary();
}

onMounted(async () => {
  await Promise.all([
    whitelistStore.fetchWhitelistEntries(),
    whitelistStore.fetchWhitelistSummary(),
    whitelistStore.checkJurisdictionConflicts(),
  ]);
});
</script>
