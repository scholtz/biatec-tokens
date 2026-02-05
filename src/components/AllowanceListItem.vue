<template>
  <div
    class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
  >
    <div class="flex items-start justify-between gap-4">
      <!-- Left: Token Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
          <!-- Token Symbol -->
          <div class="flex items-center gap-2">
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {{ tokenSymbol }}
            </div>
            <Badge :variant="riskBadgeVariant">
              {{ riskLabel }}
            </Badge>
            <Badge
              v-if="isEVMAllowance && evmAllowance.isUnlimited"
              variant="error"
            >
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Unlimited
            </Badge>
          </div>
        </div>

        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {{ tokenName }}
        </div>

        <!-- Spender Info -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-gray-600 dark:text-gray-400">Granted to:</span>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ spenderDisplayName }}
          </span>
          <button
            @click="copyAddress"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="allowance.spenderAddress"
          >
            <i class="pi pi-copy text-xs text-gray-500"></i>
          </button>
        </div>

        <!-- Allowance Amount -->
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">Access Limit:</span>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formattedAmount }}
          </span>
        </div>

        <!-- Additional Info -->
        <div class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div v-if="allowance.lastInteractionTime" class="flex items-center gap-1">
            <i class="pi pi-clock"></i>
            <span>Last used: {{ formatTimestamp(allowance.lastInteractionTime) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <i class="pi pi-calendar"></i>
            <span>Discovered: {{ formatTimestamp(allowance.discoveredAt) }}</span>
          </div>
        </div>

        <!-- Risk Warning -->
        <div
          v-if="shouldShowWarning"
          class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300"
        >
          <i class="pi pi-exclamation-triangle mr-1"></i>
          {{ warningMessage }}
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex flex-col gap-2 flex-shrink-0">
        <Button
          @click="$emit('revoke', allowance)"
          variant="danger"
          size="sm"
        >
          <i class="pi pi-times mr-1"></i>
          Revoke
        </Button>

        <Button
          v-if="isEVMAllowance && !evmAllowance.isUnlimited"
          @click="$emit('reduce', allowance)"
          variant="outline"
          size="sm"
        >
          <i class="pi pi-minus mr-1"></i>
          Reduce
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge from './ui/Badge.vue';
import Button from './ui/Button.vue';
import type { Allowance, EVMTokenAllowance, AVMAssetOptIn } from '../types/allowances';
import {
  getRiskBadgeVariant,
  getRiskLevelLabel,
  formatAddress,
} from '../utils/allowances';

const props = defineProps<{
  allowance: Allowance;
}>();

defineEmits<{
  revoke: [allowance: Allowance];
  reduce: [allowance: Allowance];
}>();

// Computed properties
const isEVMAllowance = computed(() => props.allowance.chainType === 'EVM');

const evmAllowance = computed(() => props.allowance as EVMTokenAllowance);
const avmAllowance = computed(() => props.allowance as AVMAssetOptIn);

const tokenSymbol = computed(() => {
  if (isEVMAllowance.value) {
    return evmAllowance.value.tokenSymbol;
  } else {
    return avmAllowance.value.unitName || 'ASA';
  }
});

const tokenName = computed(() => {
  if (isEVMAllowance.value) {
    return evmAllowance.value.tokenName;
  } else {
    return avmAllowance.value.assetName || `Asset #${avmAllowance.value.assetId}`;
  }
});

const formattedAmount = computed(() => {
  if (isEVMAllowance.value) {
    return evmAllowance.value.formattedAllowance;
  } else {
    return avmAllowance.value.balance;
  }
});

const spenderDisplayName = computed(() => {
  return props.allowance.spenderName || formatAddress(props.allowance.spenderAddress);
});

const riskBadgeVariant = computed(() => {
  return getRiskBadgeVariant(props.allowance.riskLevel);
});

const riskLabel = computed(() => {
  return getRiskLevelLabel(props.allowance.riskLevel);
});

const shouldShowWarning = computed(() => {
  if (isEVMAllowance.value) {
    return evmAllowance.value.isUnlimited || props.allowance.riskLevel === 'critical';
  }
  return false;
});

const warningMessage = computed(() => {
  if (isEVMAllowance.value && evmAllowance.value.isUnlimited) {
    return 'This unlimited access allows the application to access all your tokens. Consider revoking if no longer needed.';
  } else if (props.allowance.riskLevel === 'critical') {
    return 'This permission poses a critical security risk. Review and revoke if not actively used.';
  }
  return '';
});

// Methods
const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(props.allowance.spenderAddress);
    // Could add toast notification here
  } catch (error) {
    console.error('Failed to copy address:', error);
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 30) {
    return `${days} days ago`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};
</script>
