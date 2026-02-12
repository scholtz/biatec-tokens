<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <i class="pi pi-shield text-biatec-accent"></i>
          Whitelist & Jurisdiction Management
        </h2>
        <p class="text-gray-400 mt-1">Manage approved investors and jurisdiction rules for MICA compliance</p>
      </div>
      <div class="flex gap-3">
        <Button @click="showImportDialog = true" variant="secondary">
          <i class="pi pi-upload mr-2"></i>
          Import CSV
        </Button>
        <Button @click="showEntryForm = true" variant="primary">
          <i class="pi pi-plus mr-2"></i>
          Add Entry
        </Button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="glass-effect rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <i class="pi pi-check-circle text-green-400 text-2xl"></i>
        </div>
        <div class="text-2xl font-bold text-white">{{ summary?.approvedCount || 0 }}</div>
        <div class="text-sm text-gray-400">Approved</div>
      </div>

      <div class="glass-effect rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <i class="pi pi-clock text-yellow-400 text-2xl"></i>
        </div>
        <div class="text-2xl font-bold text-white">{{ summary?.pendingCount || 0 }}</div>
        <div class="text-sm text-gray-400">Pending Review</div>
      </div>

      <div class="glass-effect rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <i class="pi pi-times-circle text-red-400 text-2xl"></i>
        </div>
        <div class="text-2xl font-bold text-white">{{ summary?.rejectedCount || 0 }}</div>
        <div class="text-sm text-gray-400">Rejected</div>
      </div>

      <div class="glass-effect rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <i class="pi pi-globe text-biatec-accent text-2xl"></i>
        </div>
        <div class="text-2xl font-bold text-white">{{ summary?.jurisdictionsCovered || 0 }}</div>
        <div class="text-sm text-gray-400">Jurisdictions</div>
      </div>
    </div>

    <!-- Conflict Alert -->
    <div v-if="criticalConflicts.length > 0" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
      <h3 class="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
        <i class="pi pi-exclamation-triangle"></i>
        Jurisdiction Conflicts Detected
      </h3>
      <div class="space-y-2">
        <div v-for="conflict in criticalConflicts" :key="conflict.entryId" class="p-3 bg-white/5 rounded-lg">
          <div class="flex items-start gap-3">
            <Badge variant="error" class="shrink-0">{{ conflict.severity.toUpperCase() }}</Badge>
            <div class="flex-1">
              <div class="text-sm text-white font-medium mb-1">{{ conflict.entryName }}</div>
              <div class="text-xs text-gray-400">{{ conflict.message }}</div>
              <div class="text-xs text-gray-500 mt-1">Jurisdiction: {{ conflict.jurisdictionCode }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6">
      <div class="border-b border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'whitelist'"
            :class="[
              activeTab === 'whitelist' ? 'border-biatec-accent text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2',
            ]"
          >
            <i class="pi pi-users"></i>
            <span>Whitelist Entries</span>
            <span v-if="summary?.totalEntries" class="px-2 py-0.5 bg-gray-700 rounded-full text-xs">{{ summary.totalEntries }}</span>
          </button>
          <button
            @click="activeTab = 'jurisdictions'"
            :class="[
              activeTab === 'jurisdictions' ? 'border-biatec-accent text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2',
            ]"
          >
            <i class="pi pi-map"></i>
            <span>Jurisdiction Rules</span>
            <span v-if="jurisdictionCoverage?.totalJurisdictions" class="px-2 py-0.5 bg-gray-700 rounded-full text-xs">{{ jurisdictionCoverage.totalJurisdictions }}</span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div>
      <!-- Whitelist Tab -->
      <div v-if="activeTab === 'whitelist'">
        <WhitelistTable
          :conflicts="conflictIds"
          @view-details="handleViewDetails"
          @approve="handleApprove"
          @reject="handleReject"
        />
      </div>

      <!-- Jurisdictions Tab -->
      <div v-if="activeTab === 'jurisdictions'">
        <JurisdictionRulesEditor />
      </div>
    </div>

    <!-- Whitelist Detail Panel (Drawer) -->
    <Modal :show="!!selectedEntry" @close="selectedEntry = null" :title="selectedEntry?.name || 'Entry Details'" size="lg">
      <WhitelistDetailPanel
        v-if="selectedEntry"
        :entry="selectedEntry"
        @close="selectedEntry = null"
        @approved="handleEntryApproved"
        @rejected="handleEntryRejected"
      />
    </Modal>

    <!-- Whitelist Entry Form (Modal) -->
    <Modal :show="showEntryForm" @close="showEntryForm = false" title="Add Whitelist Entry">
      <WhitelistEntryForm
        @submit="handleCreateEntry"
        @cancel="showEntryForm = false"
      />
    </Modal>

    <!-- CSV Import Dialog -->
    <CSVImportDialog
      :show="showImportDialog"
      @close="showImportDialog = false"
      @imported="handleImported"
    />

    <!-- Approve Confirmation Dialog -->
    <Modal :show="showApproveDialog" @close="showApproveDialog = false" title="Approve Whitelist Entry">
      <div v-if="pendingApprovalEntry" class="space-y-4">
        <p class="text-gray-300">Are you sure you want to approve this entry?</p>
        <div class="p-4 bg-gray-800/50 rounded-lg">
          <div class="text-sm text-gray-400 mb-1">Name</div>
          <div class="text-white font-medium">{{ pendingApprovalEntry.name }}</div>
          <div class="text-sm text-gray-400 mt-2 mb-1">Email</div>
          <div class="text-white">{{ pendingApprovalEntry.email }}</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
          <textarea
            v-model="approvalNotes"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
            rows="3"
            placeholder="Add any notes about this approval..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <Button @click="showApproveDialog = false" variant="secondary">Cancel</Button>
          <Button @click="confirmApprove" variant="primary">Approve Entry</Button>
        </div>
      </div>
    </Modal>

    <!-- Reject Confirmation Dialog -->
    <Modal :show="showRejectDialog" @close="showRejectDialog = false" title="Reject Whitelist Entry">
      <div v-if="pendingRejectionEntry" class="space-y-4">
        <p class="text-gray-300">Please provide a reason for rejecting this entry:</p>
        <div class="p-4 bg-gray-800/50 rounded-lg">
          <div class="text-sm text-gray-400 mb-1">Name</div>
          <div class="text-white font-medium">{{ pendingRejectionEntry.name }}</div>
          <div class="text-sm text-gray-400 mt-2 mb-1">Email</div>
          <div class="text-white">{{ pendingRejectionEntry.email }}</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Rejection Reason *</label>
          <textarea
            v-model="rejectionReason"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
            rows="3"
            placeholder="Explain why this entry is being rejected..."
            required
          ></textarea>
          <div v-if="rejectionError" class="text-red-400 text-sm mt-1">{{ rejectionError }}</div>
        </div>
        <div class="flex justify-end gap-3">
          <Button @click="showRejectDialog = false" variant="secondary">Cancel</Button>
          <Button @click="confirmReject" variant="primary" :disabled="!rejectionReason.trim()">Reject Entry</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWhitelistStore } from '../../stores/whitelist';
import WhitelistTable from './WhitelistTable.vue';
import WhitelistDetailPanel from './WhitelistDetailPanel.vue';
import WhitelistEntryForm from './WhitelistEntryForm.vue';
import JurisdictionRulesEditor from './JurisdictionRulesEditor.vue';
import CSVImportDialog from './CSVImportDialog.vue';
import Modal from '../ui/Modal.vue';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';
import type { WhitelistEntry, CreateWhitelistEntryRequest } from '../../types/whitelist';

const whitelistStore = useWhitelistStore();

const activeTab = ref<'whitelist' | 'jurisdictions'>('whitelist');
const selectedEntry = ref<WhitelistEntry | null>(null);
const showEntryForm = ref(false);
const showImportDialog = ref(false);
const showApproveDialog = ref(false);
const showRejectDialog = ref(false);
const pendingApprovalEntry = ref<WhitelistEntry | null>(null);
const pendingRejectionEntry = ref<WhitelistEntry | null>(null);
const approvalNotes = ref('');
const rejectionReason = ref('');
const rejectionError = ref('');

const summary = computed(() => whitelistStore.summary);
const jurisdictionCoverage = computed(() => whitelistStore.jurisdictionCoverage);
const criticalConflicts = computed(() => whitelistStore.criticalConflicts);
const conflictIds = computed(() => whitelistStore.conflicts.map(c => c.entryId));

const handleViewDetails = (entry: WhitelistEntry) => {
  selectedEntry.value = entry;
  whitelistStore.selectEntry(entry);
};

const handleApprove = (entry: WhitelistEntry) => {
  pendingApprovalEntry.value = entry;
  approvalNotes.value = '';
  showApproveDialog.value = true;
};

const handleReject = (entry: WhitelistEntry) => {
  pendingRejectionEntry.value = entry;
  rejectionReason.value = '';
  rejectionError.value = '';
  showRejectDialog.value = true;
};

const confirmApprove = async () => {
  if (!pendingApprovalEntry.value) return;

  const success = await whitelistStore.approveWhitelistEntry({
    id: pendingApprovalEntry.value.id,
    notes: approvalNotes.value || undefined,
  });

  if (success) {
    showApproveDialog.value = false;
    pendingApprovalEntry.value = null;
    approvalNotes.value = '';
  }
};

const confirmReject = async () => {
  if (!pendingRejectionEntry.value) return;
  
  if (!rejectionReason.value.trim()) {
    rejectionError.value = 'Rejection reason is required';
    return;
  }

  const success = await whitelistStore.rejectWhitelistEntry({
    id: pendingRejectionEntry.value.id,
    reason: rejectionReason.value,
  });

  if (success) {
    showRejectDialog.value = false;
    pendingRejectionEntry.value = null;
    rejectionReason.value = '';
    rejectionError.value = '';
  }
};

const handleCreateEntry = async (data: CreateWhitelistEntryRequest) => {
  const created = await whitelistStore.createWhitelistEntry(data);
  if (created) {
    showEntryForm.value = false;
  }
};

const handleEntryApproved = () => {
  selectedEntry.value = null;
  whitelistStore.fetchWhitelistEntries();
  whitelistStore.fetchWhitelistSummary();
};

const handleEntryRejected = () => {
  selectedEntry.value = null;
  whitelistStore.fetchWhitelistEntries();
  whitelistStore.fetchWhitelistSummary();
};

const handleImported = () => {
  showImportDialog.value = false;
  whitelistStore.fetchWhitelistEntries();
  whitelistStore.fetchWhitelistSummary();
};

onMounted(() => {
  whitelistStore.fetchWhitelistSummary();
  whitelistStore.fetchJurisdictionCoverage();
  whitelistStore.checkJurisdictionConflicts();
});
</script>
