<template>
  <Modal :show="isOpen" @close="$emit('close')" size="md">
    <template #title>
      {{ actionTitle }}
    </template>

    <div class="space-y-4">
      <!-- Allowance Info -->
      <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Token:</span>
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ tokenDisplay }}
          </span>
        </div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Application:</span>
          <span class="font-medium text-gray-900 dark:text-white text-sm">
            {{ spenderDisplay }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Current Access:</span>
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ currentAllowanceDisplay }}
          </span>
        </div>
      </div>

      <!-- Action Description -->
      <div
        :class="[
          'p-4 rounded-lg border',
          action === 'revoke'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        ]"
      >
        <div class="flex items-start gap-3">
          <i
            :class="[
              'pi text-xl flex-shrink-0 mt-0.5',
              action === 'revoke'
                ? 'pi-exclamation-triangle text-red-600 dark:text-red-400'
                : 'pi-info-circle text-blue-600 dark:text-blue-400'
            ]"
          ></i>
          <div>
            <div
              :class="[
                'font-medium mb-1',
                action === 'revoke'
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-blue-900 dark:text-blue-100'
              ]"
            >
              {{ actionWarning }}
            </div>
            <div
              :class="[
                'text-sm',
                action === 'revoke'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-blue-800 dark:text-blue-200'
              ]"
            >
              {{ actionDescription }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reduce Amount Input -->
      <div v-if="action === 'reduce'" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Access Amount
        </label>
        <input
          v-model="reduceAmount"
          type="text"
          placeholder="Enter amount (e.g., 1000)"
          class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Tip: Set to the exact amount you plan to use with this application for better security.
        </div>
      </div>

      <!-- Gas Estimate (Placeholder) -->
      <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div class="flex items-center gap-2 text-sm">
          <i class="pi pi-bolt text-yellow-600 dark:text-yellow-400"></i>
          <span class="text-yellow-800 dark:text-yellow-200">
            Estimated network fee: ~$2-5 (actual cost will be shown in your confirmation)
          </span>
        </div>
      </div>

      <!-- Benefits List -->
      <div class="space-y-2">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ action === 'revoke' ? 'Why revoke?' : 'Why reduce?' }}
        </div>
        <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-500 mt-0.5"></i>
            <span>{{ benefit1 }}</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-500 mt-0.5"></i>
            <span>{{ benefit2 }}</span>
          </li>
          <li v-if="benefit3" class="flex items-start gap-2">
            <i class="pi pi-check text-green-500 mt-0.5"></i>
            <span>{{ benefit3 }}</span>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button @click="$emit('close')" variant="outline">
          Cancel
        </Button>
        <Button
          @click="handleConfirm"
          :variant="action === 'revoke' ? 'danger' : 'primary'"
          :disabled="action === 'reduce' && !isValidAmount"
        >
          <i :class="['pi mr-2', action === 'revoke' ? 'pi-times' : 'pi-check']"></i>
          {{ confirmButtonText }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from './ui/Modal.vue';
import Button from './ui/Button.vue';
import type { Allowance, EVMTokenAllowance } from '../types/allowances';
import { formatAddress } from '../utils/allowances';

const props = defineProps<{
  isOpen: boolean;
  allowance: Allowance;
  action: 'revoke' | 'reduce';
}>();

const emit = defineEmits<{
  close: [];
  confirm: [data: { allowanceId: string; newAmount?: string }];
}>();

const reduceAmount = ref('');

// Computed properties
const tokenDisplay = computed(() => {
  if (props.allowance.chainType === 'EVM') {
    const evmAllowance = props.allowance as EVMTokenAllowance;
    return `${evmAllowance.tokenSymbol} (${evmAllowance.tokenName})`;
  }
  return 'Token';
});

const spenderDisplay = computed(() => {
  return props.allowance.spenderName || formatAddress(props.allowance.spenderAddress);
});

const currentAllowanceDisplay = computed(() => {
  if (props.allowance.chainType === 'EVM') {
    return (props.allowance as EVMTokenAllowance).formattedAllowance;
  }
  return 'N/A';
});

const actionTitle = computed(() => {
  return props.action === 'revoke' ? 'Revoke Token Access' : 'Reduce Token Access';
});

const actionWarning = computed(() => {
  return props.action === 'revoke'
    ? 'This will completely remove the access permission'
    : 'This will reduce the access permission to a specific amount';
});

const actionDescription = computed(() => {
  return props.action === 'revoke'
    ? 'The application will no longer be able to access your tokens. You will need to grant permission again to use this application in the future.'
    : 'The application will only be able to access up to the amount you specify. This is more secure than unlimited access.';
});

const benefit1 = computed(() => {
  return props.action === 'revoke'
    ? 'Eliminates security risk from this permission'
    : 'Limits potential loss if application is compromised';
});

const benefit2 = computed(() => {
  return props.action === 'revoke'
    ? 'Prevents unauthorized token access'
    : 'Maintains ability to use application with limited exposure';
});

const benefit3 = computed(() => {
  return props.action === 'revoke'
    ? 'No future transaction costs for this permission'
    : 'Follows security best practice of least privilege';
});

const confirmButtonText = computed(() => {
  return props.action === 'revoke' ? 'Revoke Access' : 'Reduce Access';
});

const isValidAmount = computed(() => {
  if (props.action !== 'reduce') return true;
  
  try {
    const amount = parseFloat(reduceAmount.value);
    return !isNaN(amount) && amount > 0;
  } catch {
    return false;
  }
});

// Methods
const handleConfirm = () => {
  if (props.action === 'revoke') {
    emit('confirm', { allowanceId: props.allowance.id });
  } else if (props.action === 'reduce' && isValidAmount.value) {
    // Convert the human-readable amount to raw amount
    // This is simplified - in production, you'd need to handle decimals properly
    const evmAllowance = props.allowance as EVMTokenAllowance;
    const decimals = evmAllowance.tokenDecimals;
    const rawAmount = BigInt(Math.floor(parseFloat(reduceAmount.value) * Math.pow(10, decimals))).toString();
    
    emit('confirm', {
      allowanceId: props.allowance.id,
      newAmount: rawAmount,
    });
  }
};
</script>
