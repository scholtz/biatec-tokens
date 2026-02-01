<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-white mb-2 flex items-center gap-2">
        <i class="pi pi-shield-check text-biatec-accent"></i>
        Transfer Validation
      </h3>
      <p class="text-sm text-gray-400">
        Pre-validate transfer compliance before initiating transactions
      </p>
    </div>

    <form @submit.prevent="handleCheckAllowlist" class="space-y-4">
      <!-- Network Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Network <span class="text-red-400">*</span>
        </label>
        <div class="flex gap-2">
          <button
            v-for="net in networks"
            :key="net"
            type="button"
            @click="selectedNetwork = net"
            :class="[
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedNetwork === net
                ? 'bg-biatec-accent text-gray-900'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            ]"
          >
            {{ net }}
          </button>
        </div>
      </div>

      <!-- Sender Address -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Sender Address <span class="text-red-400">*</span>
        </label>
        <input
          v-model="senderAddress"
          type="text"
          placeholder="Enter sender wallet address"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          required
        />
      </div>

      <!-- Receiver Address -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Receiver Address <span class="text-red-400">*</span>
        </label>
        <input
          v-model="receiverAddress"
          type="text"
          placeholder="Enter receiver wallet address"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
          required
        />
      </div>

      <!-- Amount (Optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Amount (Optional)
        </label>
        <input
          v-model="amount"
          type="text"
          placeholder="Enter transfer amount"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
        />
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isValidating || !senderAddress || !receiverAddress"
        class="w-full btn-primary px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <i v-if="isValidating" class="pi pi-spin pi-spinner"></i>
        <i v-else class="pi pi-shield-check"></i>
        {{ isValidating ? 'Validating...' : 'Check Allowlist Status' }}
      </button>
    </form>

    <!-- Allowlist Confirmation Dialog -->
    <AllowlistConfirmationDialog
      :is-open="showConfirmDialog"
      :network="selectedNetwork"
      :token-id="tokenId"
      :sender-address="senderAddress"
      :receiver-address="receiverAddress"
      :sender-status="pendingSenderStatus || defaultWhitelistStatus"
      :receiver-status="pendingReceiverStatus || defaultWhitelistStatus"
      :amount="amount"
      @close="handleDialogClose"
      @proceed="handleValidate"
    />

    <!-- Validation Results -->
    <div v-if="validationResult" class="mt-6 space-y-4">
      <div class="border-t border-white/10 pt-6">
        <h4 class="text-lg font-semibold text-white mb-4">Validation Result</h4>

        <!-- Overall Status -->
        <div
          :class="[
            'p-4 rounded-lg border-2 mb-4',
            validationResult.allowed
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-red-500/10 border-red-500/50'
          ]"
        >
          <div class="flex items-center gap-3">
            <i
              :class="[
                'text-2xl',
                validationResult.allowed
                  ? 'pi pi-check-circle text-green-400'
                  : 'pi pi-times-circle text-red-400'
              ]"
            ></i>
            <div>
              <div
                :class="[
                  'text-lg font-semibold',
                  validationResult.allowed ? 'text-green-400' : 'text-red-400'
                ]"
              >
                {{ validationResult.allowed ? 'Transfer Allowed' : 'Transfer Denied' }}
              </div>
              <div class="text-sm text-gray-400">
                Validated at {{ formatTimestamp(validationResult.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Reasons -->
        <div v-if="validationResult.reasons && validationResult.reasons.length > 0" class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">Reasons:</label>
          <div class="space-y-2">
            <div
              v-for="(reason, index) in validationResult.reasons"
              :key="index"
              class="flex items-start gap-2 p-3 bg-white/5 rounded-lg"
            >
              <i
                :class="[
                  'pi text-sm mt-0.5',
                  validationResult.allowed ? 'pi-info-circle text-blue-400' : 'pi-exclamation-triangle text-yellow-400'
                ]"
              ></i>
              <span class="text-sm text-gray-300">{{ reason }}</span>
            </div>
          </div>
        </div>

        <!-- Address Status Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Sender Status -->
          <div class="p-4 bg-white/5 rounded-lg">
            <h5 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <i class="pi pi-user"></i>
              Sender Status
            </h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Whitelisted:</span>
                <span
                  :class="
                    validationResult.senderStatus.whitelisted
                      ? 'text-green-400'
                      : 'text-red-400'
                  "
                >
                  {{ validationResult.senderStatus.whitelisted ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Status:</span>
                <span
                  :class="statusBadgeClass(validationResult.senderStatus.status)"
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                >
                  {{ validationResult.senderStatus.status }}
                </span>
              </div>
              <div v-if="validationResult.details?.senderCompliant !== undefined" class="flex justify-between">
                <span class="text-gray-400">Compliant:</span>
                <span
                  :class="
                    validationResult.details.senderCompliant
                      ? 'text-green-400'
                      : 'text-red-400'
                  "
                >
                  {{ validationResult.details.senderCompliant ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Receiver Status -->
          <div class="p-4 bg-white/5 rounded-lg">
            <h5 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <i class="pi pi-user"></i>
              Receiver Status
            </h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Whitelisted:</span>
                <span
                  :class="
                    validationResult.receiverStatus.whitelisted
                      ? 'text-green-400'
                      : 'text-red-400'
                  "
                >
                  {{ validationResult.receiverStatus.whitelisted ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Status:</span>
                <span
                  :class="statusBadgeClass(validationResult.receiverStatus.status)"
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                >
                  {{ validationResult.receiverStatus.status }}
                </span>
              </div>
              <div v-if="validationResult.details?.receiverCompliant !== undefined" class="flex justify-between">
                <span class="text-gray-400">Compliant:</span>
                <span
                  :class="
                    validationResult.details.receiverCompliant
                      ? 'text-green-400'
                      : 'text-red-400'
                  "
                >
                  {{ validationResult.details.receiverCompliant ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Details -->
        <div v-if="validationResult.details?.additionalInfo" class="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-400 mt-0.5"></i>
            <div class="text-sm text-gray-300">
              {{ validationResult.details.additionalInfo }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div class="flex items-start gap-2">
        <i class="pi pi-exclamation-triangle text-red-400 mt-0.5"></i>
        <div>
          <div class="text-sm font-semibold text-red-400 mb-1">Validation Error</div>
          <div class="text-sm text-gray-300">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { complianceService } from '../services/ComplianceService';
import type { TransferValidationResponse, Network, WhitelistStatus } from '../types/compliance';
import { useToast } from '../composables/useToast';
import AllowlistConfirmationDialog from './AllowlistConfirmationDialog.vue';

const props = defineProps<{
  tokenId: string;
}>();

const toast = useToast();

// State
const networks: Network[] = ['VOI', 'Aramid'];
const selectedNetwork = ref<Network>('VOI');
const senderAddress = ref('');
const receiverAddress = ref('');
const amount = ref('');
const isValidating = ref(false);
const validationResult = ref<TransferValidationResponse | null>(null);
const error = ref<string | null>(null);
const showConfirmDialog = ref(false);
const pendingSenderStatus = ref<WhitelistStatus | null>(null);
const pendingReceiverStatus = ref<WhitelistStatus | null>(null);

// Default whitelist status for dialog initialization
const defaultWhitelistStatus: WhitelistStatus = {
  address: '',
  whitelisted: false,
  status: 'not_listed',
};

// Methods
const handleCheckAllowlist = async () => {
  error.value = null;
  validationResult.value = null;
  isValidating.value = true;

  try {
    // First, validate to get the allowlist status
    const result = await complianceService.validateTransfer({
      tokenId: props.tokenId,
      network: selectedNetwork.value,
      sender: senderAddress.value,
      receiver: receiverAddress.value,
      amount: amount.value || undefined,
    });

    // Store the statuses for the dialog
    pendingSenderStatus.value = result.senderStatus;
    pendingReceiverStatus.value = result.receiverStatus;

    // Show confirmation dialog
    showConfirmDialog.value = true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to check allowlist status';
    error.value = errorMessage;
    toast.error('Allowlist check failed');
  } finally {
    isValidating.value = false;
  }
};

const handleDialogClose = () => {
  showConfirmDialog.value = false;
};

const handleValidate = async () => {
  showConfirmDialog.value = false;
  error.value = null;
  validationResult.value = null;
  isValidating.value = true;

  try {
    const result = await complianceService.validateTransfer({
      tokenId: props.tokenId,
      network: selectedNetwork.value,
      sender: senderAddress.value,
      receiver: receiverAddress.value,
      amount: amount.value || undefined,
    });

    validationResult.value = result;

    if (result.allowed) {
      toast.success('Transfer validation passed');
    } else {
      toast.warning('Transfer validation failed');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to validate transfer';
    error.value = errorMessage;
    toast.error('Validation request failed');
  } finally {
    isValidating.value = false;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

const statusBadgeClass = (status: string) => {
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
</script>
