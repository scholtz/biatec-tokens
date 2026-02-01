<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="handleCancel">
    <div class="glass-effect rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
            <i class="pi pi-shield-check text-biatec-accent"></i>
            Allowlist Verification Required
          </h3>
          <button @click="handleCancel" class="text-gray-400 hover:text-white transition-colors" aria-label="Close dialog">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>
        <p class="text-sm text-gray-400">Review counterparty allowlist status before proceeding with regulated transfer</p>
      </div>

      <!-- MICA Compliance Notice -->
      <div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 text-xl mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-blue-400 mb-2">MICA Compliance Notice</h4>
            <p class="text-xs text-gray-300 leading-relaxed">
              This token is subject to MiCA (Markets in Crypto-Assets Regulation) requirements for Real World Asset (RWA) tokens. 
              All transfers must be conducted between verified and allowlisted wallet addresses to ensure regulatory compliance. 
              By proceeding, you acknowledge that both sender and receiver addresses have been verified against the token's allowlist 
              and meet the required compliance criteria including KYC/AML verification and jurisdiction eligibility.
            </p>
          </div>
        </div>
      </div>

      <!-- Transfer Details -->
      <div class="mb-6 space-y-4">
        <div class="p-4 bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">Transfer Details</h4>
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Network:</span>
              <span class="text-sm text-white font-medium">{{ network }}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Token ID:</span>
              <span class="text-sm text-white font-mono">{{ tokenId }}</span>
            </div>
            <div v-if="amount" class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Amount:</span>
              <span class="text-sm text-white font-medium">{{ amount }}</span>
            </div>
          </div>
        </div>

        <!-- Sender Status -->
        <div class="p-4 bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-user"></i>
            Sender Status
          </h4>
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Address:</span>
              <span class="text-xs text-white font-mono break-all text-right ml-4">{{ truncateAddress(senderAddress) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Allowlist Status:</span>
              <span :class="getStatusBadgeClass(senderStatus.status)" class="px-3 py-1 text-xs font-medium rounded-full">
                {{ formatStatus(senderStatus.status) }}
              </span>
            </div>
            <div v-if="senderStatus.status === 'expired' && senderStatus.expirationDate" class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Expired On:</span>
              <span class="text-xs text-red-400">{{ formatDate(senderStatus.expirationDate) }}</span>
            </div>
            <div v-if="senderStatus.status === 'denied' && senderStatus.denialReason" class="mt-2 p-2 bg-red-500/10 rounded">
              <p class="text-xs text-red-400">{{ senderStatus.denialReason }}</p>
            </div>
            <div v-if="getStatusMessage(senderStatus.status)" class="mt-2 p-2 bg-yellow-500/10 rounded">
              <p class="text-xs text-yellow-400">{{ getStatusMessage(senderStatus.status) }}</p>
            </div>
          </div>
        </div>

        <!-- Receiver Status -->
        <div class="p-4 bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <i class="pi pi-user"></i>
            Receiver Status
          </h4>
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Address:</span>
              <span class="text-xs text-white font-mono break-all text-right ml-4">{{ truncateAddress(receiverAddress) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Allowlist Status:</span>
              <span :class="getStatusBadgeClass(receiverStatus.status)" class="px-3 py-1 text-xs font-medium rounded-full">
                {{ formatStatus(receiverStatus.status) }}
              </span>
            </div>
            <div v-if="receiverStatus.status === 'expired' && receiverStatus.expirationDate" class="flex justify-between items-start">
              <span class="text-sm text-gray-400">Expired On:</span>
              <span class="text-xs text-red-400">{{ formatDate(receiverStatus.expirationDate) }}</span>
            </div>
            <div v-if="receiverStatus.status === 'denied' && receiverStatus.denialReason" class="mt-2 p-2 bg-red-500/10 rounded">
              <p class="text-xs text-red-400">{{ receiverStatus.denialReason }}</p>
            </div>
            <div v-if="getStatusMessage(receiverStatus.status)" class="mt-2 p-2 bg-yellow-500/10 rounded">
              <p class="text-xs text-yellow-400">{{ getStatusMessage(receiverStatus.status) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Transfer Allowed/Blocked Notice -->
      <div v-if="!canProceed" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-red-400 text-xl mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-red-400 mb-2">Transfer Cannot Proceed</h4>
            <p class="text-xs text-gray-300 leading-relaxed">
              This transfer cannot be completed because one or both wallet addresses do not meet the required allowlist criteria. 
              {{ getBlockReason() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Confirmation Checkbox -->
      <div v-if="canProceed" class="mb-6">
        <label class="flex items-start gap-3 cursor-pointer group">
          <input v-model="confirmed" type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-600 bg-white/10 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0" />
          <span class="text-sm text-gray-300 group-hover:text-white transition-colors">
            I confirm that I have reviewed the allowlist status of both counterparties and understand that this transfer 
            is subject to MICA regulatory requirements. I acknowledge that false or misleading compliance information 
            may result in regulatory penalties.
          </span>
        </label>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button @click="handleCancel" class="flex-1 px-4 py-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all font-medium">
          Cancel
        </button>
        <button v-if="canProceed" @click="handleProceed" :disabled="!confirmed" class="flex-1 px-4 py-3 rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2">
          <i class="pi pi-check-circle"></i>
          Proceed with Transfer
        </button>
        <button v-else @click="handleCancel" class="flex-1 px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all font-medium">
          Understood
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WhitelistStatus } from '../types/compliance';

interface Props {
  isOpen: boolean;
  network: string;
  tokenId: string;
  senderAddress: string;
  receiverAddress: string;
  senderStatus: WhitelistStatus;
  receiverStatus: WhitelistStatus;
  amount?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'proceed'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const confirmed = ref(false);

const canProceed = computed(() => {
  // Transfer can only proceed if both addresses are active
  return props.senderStatus.status === 'active' && props.receiverStatus.status === 'active';
});

const handleCancel = () => {
  confirmed.value = false;
  emit('close');
};

const handleProceed = () => {
  if (!confirmed.value || !canProceed.value) {
    return;
  }
  emit('proceed');
  confirmed.value = false;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'expired':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'denied':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'removed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'not_listed':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Pending Approval';
    case 'expired':
      return 'Expired';
    case 'denied':
      return 'Denied';
    case 'removed':
      return 'Removed';
    case 'not_listed':
      return 'Not Listed';
    default:
      return status;
  }
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'pending':
      return 'This address is pending approval. Transfers cannot be completed until the address is approved by the token issuer.';
    case 'expired':
      return 'This address allowlist status has expired. The address holder must renew their verification to continue making transfers.';
    case 'denied':
      return 'This address has been denied access to the allowlist. Transfers are not permitted.';
    case 'removed':
      return 'This address has been removed from the allowlist. Transfers are no longer permitted.';
    case 'not_listed':
      return 'This address is not on the allowlist. Only allowlisted addresses can participate in transfers for this regulated token.';
    default:
      return null;
  }
};

const getBlockReason = () => {
  const reasons: string[] = [];
  
  if (props.senderStatus.status === 'pending') {
    reasons.push('Sender address is pending approval.');
  } else if (props.senderStatus.status === 'expired') {
    reasons.push('Sender address allowlist status has expired.');
  } else if (props.senderStatus.status === 'denied') {
    reasons.push('Sender address has been denied.');
  } else if (props.senderStatus.status === 'removed') {
    reasons.push('Sender address has been removed from allowlist.');
  } else if (props.senderStatus.status === 'not_listed') {
    reasons.push('Sender address is not on the allowlist.');
  }
  
  if (props.receiverStatus.status === 'pending') {
    reasons.push('Receiver address is pending approval.');
  } else if (props.receiverStatus.status === 'expired') {
    reasons.push('Receiver address allowlist status has expired.');
  } else if (props.receiverStatus.status === 'denied') {
    reasons.push('Receiver address has been denied.');
  } else if (props.receiverStatus.status === 'removed') {
    reasons.push('Receiver address has been removed from allowlist.');
  } else if (props.receiverStatus.status === 'not_listed') {
    reasons.push('Receiver address is not on the allowlist.');
  }
  
  return reasons.join(' ');
};

// Minimum length before address truncation (addresses <= this length shown in full)
const TRUNCATE_ADDRESS_MIN_LENGTH = 20;

const truncateAddress = (address: string) => {
  if (address.length <= TRUNCATE_ADDRESS_MIN_LENGTH) return address;
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return dateString; // Return original on error
  }
};
</script>
