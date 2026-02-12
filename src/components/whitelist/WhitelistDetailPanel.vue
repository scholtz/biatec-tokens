<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ entry.name }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ entry.email }}</p>
        </div>
        <Badge :variant="getStatusVariant(entry.status)">
          {{ formatStatus(entry.status) }}
        </Badge>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      <!-- Basic Information -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-user text-blue-600 dark:text-blue-400 mr-2"></i>
          Basic Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Entity Type</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">{{ formatEntityType(entry.entityType) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">{{ entry.organizationName || 'N/A' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Wallet Address</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">{{ entry.walletAddress || 'Not provided' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Jurisdiction</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">{{ entry.jurisdictionName }} ({{ entry.jurisdictionCode }})</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Level</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">
              <Badge :variant="getRiskLevelVariant(entry.riskLevel)">
                {{ entry.riskLevel.toUpperCase() }}
              </Badge>
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd class="text-sm text-gray-900 dark:text-white mt-1">{{ formatDate(entry.createdAt) }}</dd>
          </div>
        </div>
      </section>

      <!-- KYC and Accreditation Status -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-shield text-green-600 dark:text-green-400 mr-2"></i>
          Verification Status
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">KYC Status</span>
              <Badge :variant="getKycVariant(entry.kycStatus)">
                {{ formatKycStatus(entry.kycStatus) }}
              </Badge>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <i :class="[
                'pi mr-2',
                entry.kycStatus === 'verified' ? 'pi-check-circle text-green-600' : 
                entry.kycStatus === 'rejected' ? 'pi-times-circle text-red-600' : 
                'pi-clock text-yellow-600'
              ]"></i>
              {{ getKycDescription(entry.kycStatus) }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Accreditation Status</span>
              <Badge :variant="getAccreditationVariant(entry.accreditationStatus)">
                {{ formatAccreditationStatus(entry.accreditationStatus) }}
              </Badge>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <i :class="[
                'pi mr-2',
                entry.accreditationStatus === 'verified' ? 'pi-check-circle text-green-600' : 
                entry.accreditationStatus === 'rejected' ? 'pi-times-circle text-red-600' : 
                entry.accreditationStatus === 'not_required' ? 'pi-minus-circle text-gray-600' :
                'pi-clock text-yellow-600'
              ]"></i>
              {{ getAccreditationDescription(entry.accreditationStatus) }}
            </div>
          </div>
        </div>
      </section>

      <!-- Documentation Checklist -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-file text-purple-600 dark:text-purple-400 mr-2"></i>
          Documentation
        </h3>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Documentation Complete</span>
            <Badge :variant="entry.documentationComplete ? 'success' : 'warning'">
              {{ entry.documentationComplete ? 'Complete' : 'Incomplete' }}
            </Badge>
          </div>
          <div class="space-y-2">
            <div v-for="doc in entry.documentsUploaded" :key="doc" class="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle text-green-600 mr-2"></i>
              {{ doc }}
            </div>
            <div v-if="entry.documentsUploaded.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic">
              No documents uploaded yet
            </div>
          </div>
        </div>
      </section>

      <!-- Audit Trail -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-history text-indigo-600 dark:text-indigo-400 mr-2"></i>
          Audit Trail
        </h3>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="event in entry.auditTrail"
            :key="event.id"
            class="flex gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <i :class="getAuditIcon(event.action)" class="text-white text-sm"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatAuditAction(event.action) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(event.timestamp) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                By {{ event.actorName || event.actor }}
              </p>
              <p v-if="event.details" class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {{ event.details }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Notes -->
      <section v-if="entry.notes">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-comment text-gray-600 dark:text-gray-400 mr-2"></i>
          Notes
        </h3>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ entry.notes }}</p>
        </div>
      </section>
    </div>

    <!-- Action Buttons -->
    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-3">
      <Button
        v-if="entry.status === 'pending' || entry.status === 'under_review'"
        variant="primary"
        @click="handleApprove"
        :disabled="isLoading"
      >
        <i class="pi pi-check mr-2"></i>
        Approve
      </Button>
      <Button
        v-if="entry.status === 'pending' || entry.status === 'under_review'"
        variant="danger"
        @click="handleReject"
        :disabled="isLoading"
      >
        <i class="pi pi-times mr-2"></i>
        Reject
      </Button>
      <Button
        v-if="entry.status !== 'approved'"
        variant="secondary"
        @click="handleRequestInfo"
        :disabled="isLoading"
      >
        <i class="pi pi-question-circle mr-2"></i>
        Request More Info
      </Button>
      <Button
        variant="outline"
        @click="$emit('close')"
      >
        Close
      </Button>
    </div>

    <!-- Approve Modal -->
    <Modal :show="showApproveModal" @close="showApproveModal = false" size="md">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Approve Entry</h3>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to approve this whitelist entry for <strong>{{ entry.name }}</strong>?
        </p>
        <Input
          v-model="approveNotes"
          label="Notes (optional)"
          placeholder="Add approval notes..."
          type="text"
        />
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button variant="outline" @click="showApproveModal = false">Cancel</Button>
          <Button variant="primary" @click="confirmApprove" :loading="isLoading">Approve</Button>
        </div>
      </template>
    </Modal>

    <!-- Reject Modal -->
    <Modal :show="showRejectModal" @close="showRejectModal = false" size="md">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Reject Entry</h3>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for rejecting <strong>{{ entry.name }}</strong>'s whitelist entry.
        </p>
        <Input
          v-model="rejectReason"
          label="Rejection Reason"
          placeholder="Reason for rejection..."
          type="text"
          required
          :error="rejectError"
        />
        <Input
          v-model="rejectNotes"
          label="Additional Notes (optional)"
          placeholder="Add additional notes..."
          type="text"
        />
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button variant="outline" @click="showRejectModal = false">Cancel</Button>
          <Button variant="danger" @click="confirmReject" :loading="isLoading">Reject</Button>
        </div>
      </template>
    </Modal>

    <!-- Request Info Modal -->
    <Modal :show="showRequestInfoModal" @close="showRequestInfoModal = false" size="md">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Request More Information</h3>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Request additional information from <strong>{{ entry.name }}</strong>.
        </p>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Requested Information
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="requestedInfo"
                value="kyc_documents"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">KYC Documents</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="requestedInfo"
                value="accreditation_proof"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Accreditation Proof</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="requestedInfo"
                value="proof_of_address"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Proof of Address</span>
            </label>
          </div>
        </div>
        <Input
          v-model="requestInfoNotes"
          label="Additional Notes"
          placeholder="Specify additional information needed..."
          type="text"
        />
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button variant="outline" @click="showRequestInfoModal = false">Cancel</Button>
          <Button variant="primary" @click="confirmRequestInfo" :loading="isLoading">Send Request</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWhitelistStore } from '../../stores/whitelist';
import type { WhitelistEntry } from '../../types/whitelist';
import Badge from '../ui/Badge.vue';
import Button from '../ui/Button.vue';
import Modal from '../ui/Modal.vue';
import Input from '../ui/Input.vue';

interface Props {
  entry: WhitelistEntry;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const whitelistStore = useWhitelistStore();

const isLoading = computed(() => whitelistStore.isLoading);

const showApproveModal = ref(false);
const showRejectModal = ref(false);
const showRequestInfoModal = ref(false);

const approveNotes = ref('');
const rejectReason = ref('');
const rejectNotes = ref('');
const rejectError = ref('');
const requestedInfo = ref<string[]>([]);
const requestInfoNotes = ref('');

function handleApprove() {
  showApproveModal.value = true;
}

function handleReject() {
  showRejectModal.value = true;
  rejectReason.value = '';
  rejectNotes.value = '';
  rejectError.value = '';
}

function handleRequestInfo() {
  showRequestInfoModal.value = true;
  requestedInfo.value = [];
  requestInfoNotes.value = '';
}

async function confirmApprove() {
  const success = await whitelistStore.approveWhitelistEntry({
    id: props.entry.id,
    notes: approveNotes.value || undefined,
  });

  if (success) {
    showApproveModal.value = false;
    approveNotes.value = '';
    emit('updated');
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    rejectError.value = 'Rejection reason is required';
    return;
  }

  const success = await whitelistStore.rejectWhitelistEntry({
    id: props.entry.id,
    reason: rejectReason.value,
    notes: rejectNotes.value || undefined,
  });

  if (success) {
    showRejectModal.value = false;
    rejectReason.value = '';
    rejectNotes.value = '';
    rejectError.value = '';
    emit('updated');
  }
}

async function confirmRequestInfo() {
  if (requestedInfo.value.length === 0 && !requestInfoNotes.value.trim()) {
    return;
  }

  const success = await whitelistStore.requestMoreInfo({
    id: props.entry.id,
    requestedInfo: requestedInfo.value,
    notes: requestInfoNotes.value || undefined,
  });

  if (success) {
    showRequestInfoModal.value = false;
    requestedInfo.value = [];
    requestInfoNotes.value = '';
    emit('updated');
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    under_review: 'info',
    expired: 'default',
  };
  return variants[status] || 'default';
}

function getRiskLevelVariant(risk: string): 'success' | 'warning' | 'error' | 'default' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error',
  };
  return variants[risk] || 'default';
}

function getKycVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    verified: 'success',
    pending: 'warning',
    rejected: 'error',
    not_started: 'default',
    expired: 'error',
  };
  return variants[status] || 'default';
}

function getAccreditationVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    verified: 'success',
    pending: 'warning',
    rejected: 'error',
    not_required: 'default',
    expired: 'error',
  };
  return variants[status] || 'default';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatEntityType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatKycStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatAccreditationStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatAuditAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function getKycDescription(status: string): string {
  const descriptions: Record<string, string> = {
    verified: 'KYC verification complete',
    pending: 'KYC verification in progress',
    rejected: 'KYC verification failed',
    not_started: 'KYC verification not started',
    expired: 'KYC verification expired',
  };
  return descriptions[status] || 'Unknown status';
}

function getAccreditationDescription(status: string): string {
  const descriptions: Record<string, string> = {
    verified: 'Accreditation verified',
    pending: 'Accreditation pending review',
    rejected: 'Accreditation rejected',
    not_required: 'Accreditation not required',
    expired: 'Accreditation expired',
  };
  return descriptions[status] || 'Unknown status';
}

function getAuditIcon(action: string): string {
  const icons: Record<string, string> = {
    created: 'pi-plus',
    updated: 'pi-pencil',
    approved: 'pi-check',
    rejected: 'pi-times',
    under_review: 'pi-eye',
    info_requested: 'pi-question-circle',
    documentation_uploaded: 'pi-upload',
    kyc_verified: 'pi-shield',
    kyc_rejected: 'pi-ban',
    accreditation_verified: 'pi-verified',
    accreditation_rejected: 'pi-times-circle',
    jurisdiction_changed: 'pi-globe',
    risk_level_updated: 'pi-exclamation-triangle',
    expired: 'pi-clock',
    notes_added: 'pi-comment',
  };
  return icons[action] || 'pi-circle';
}
</script>
