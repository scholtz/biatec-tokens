<template>
  <Modal :show="isOpen" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div v-if="isDeploying" class="animate-spin">
          <i class="pi pi-spinner text-biatec-accent text-2xl"></i>
        </div>
        <div v-else-if="isCompleted" class="text-green-500">
          <i class="pi pi-check-circle text-2xl"></i>
        </div>
        <div v-else-if="hasErrors" class="text-red-500">
          <i class="pi pi-exclamation-circle text-2xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
      </div>
    </template>

    <template #default>
      <div class="space-y-6">
        <!-- Overall Progress -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ summary.completedCount + summary.failedCount }} / {{ summary.totalCount }}
            </span>
          </div>
          
          <!-- Progress Bar -->
          <div class="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="absolute top-0 left-0 h-full bg-gradient-to-r from-biatec-accent to-blue-500 transition-all duration-500 ease-out"
              :style="{ width: `${summary.progress}%` }"
            ></div>
          </div>
          
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{{ summary.progress }}% Complete</span>
            <span v-if="estimatedTimeText">{{ estimatedTimeText }} remaining</span>
          </div>
        </div>

        <!-- Status Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="glass-effect rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ summary.completedCount }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          
          <div class="glass-effect rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ summary.deployingCount }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </div>
          
          <div class="glass-effect rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ summary.failedCount }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>

        <!-- Token List -->
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Token Status</h3>
          
          <div
            v-for="token in tokens"
            :key="token.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <!-- Status Icon -->
            <div class="flex-shrink-0">
              <div v-if="token.status === 'completed'" class="text-green-500">
                <i class="pi pi-check-circle text-xl"></i>
              </div>
              <div v-else-if="token.status === 'failed'" class="text-red-500">
                <i class="pi pi-times-circle text-xl"></i>
              </div>
              <div v-else-if="token.status === 'deploying'" class="text-blue-500 animate-spin">
                <i class="pi pi-spinner text-xl"></i>
              </div>
              <div v-else class="text-gray-400">
                <i class="pi pi-circle text-xl"></i>
              </div>
            </div>

            <!-- Token Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white truncate">
                  {{ token.request.name }}
                </span>
                <Badge :variant="getStatusBadgeVariant(token.status)">
                  {{ getStatusLabel(token.status) }}
                </Badge>
              </div>
              
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>{{ token.request.standard }}</span>
                <span v-if="getTokenSymbol(token)">{{ getTokenSymbol(token) }}</span>
              </div>

              <!-- Error Message -->
              <div v-if="token.error" class="mt-2 text-xs text-red-600 dark:text-red-400">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                {{ token.error }}
              </div>

              <!-- Transaction Link -->
              <div v-if="token.transactionId" class="mt-2">
                <a
                  :href="getExplorerUrl(token)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View Transaction
                  <i class="pi pi-external-link text-xs"></i>
                </a>
              </div>
            </div>

            <!-- Retry Button -->
            <button
              v-if="token.status === 'failed' && !isDeploying"
              @click="$emit('retry-token', token.id)"
              class="flex-shrink-0 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Completion Message -->
        <div v-if="isCompleted" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl mt-0.5"></i>
            <div>
              <p class="font-semibold text-green-800 dark:text-green-200">Batch Deployment Complete!</p>
              <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                Successfully deployed {{ summary.completedCount }} of {{ summary.totalCount }} tokens.
              </p>
            </div>
          </div>
        </div>

        <!-- Partial Completion Message -->
        <div v-else-if="hasErrors && !isDeploying" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-xl mt-0.5"></i>
            <div>
              <p class="font-semibold text-yellow-800 dark:text-yellow-200">Partial Deployment</p>
              <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {{ summary.failedCount }} token(s) failed. You can retry failed tokens or export the audit report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-3 w-full">
        <div class="flex gap-2">
          <!-- Export Button -->
          <button
            v-if="!isDeploying"
            @click="$emit('export-audit')"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-download"></i>
            Export Audit
          </button>

          <!-- Retry All Failed Button -->
          <button
            v-if="hasErrors && !isDeploying && summary.failedCount > 0"
            @click="$emit('retry-all')"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-refresh"></i>
            Retry All Failed
          </button>
        </div>

        <!-- Close Button -->
        <button
          v-if="!isDeploying"
          @click="handleClose"
          class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent-dark text-white rounded-lg transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Modal from './ui/Modal.vue';
import Badge from './ui/Badge.vue';
import type { BatchTokenEntry, BatchStatusSummary } from '../types/batch';

interface Props {
  isOpen: boolean;
  tokens: BatchTokenEntry[];
  summary: BatchStatusSummary;
}

interface Emits {
  (e: 'close'): void;
  (e: 'retry-token', tokenId: string): void;
  (e: 'retry-all'): void;
  (e: 'export-audit'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed
const isDeploying = computed(() => props.summary.status === 'deploying');
const isCompleted = computed(() => props.summary.status === 'completed');
const hasErrors = computed(() => props.summary.failedCount > 0);

const title = computed(() => {
  if (isDeploying.value) {
    return 'Deploying Batch...';
  } else if (isCompleted.value) {
    return 'Batch Deployment Complete';
  } else if (hasErrors.value) {
    return 'Batch Deployment Completed with Errors';
  }
  return 'Batch Deployment';
});

const estimatedTimeText = computed(() => {
  if (!props.summary.estimatedTimeRemaining) {
    return null;
  }

  const seconds = Math.ceil(props.summary.estimatedTimeRemaining / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours}h`;
  }
});

// Methods
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    deploying: 'Deploying',
    completed: 'Completed',
    failed: 'Failed',
    retrying: 'Retrying',
  };
  return labels[status] || status;
}

function getStatusBadgeVariant(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const variants: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    deploying: 'info',
    completed: 'success',
    failed: 'error',
    retrying: 'warning',
  };
  return variants[status] || 'default';
}

function getTokenSymbol(token: BatchTokenEntry): string {
  if ('symbol' in token.request) {
    return token.request.symbol;
  } else if ('unitName' in token.request) {
    return token.request.unitName;
  }
  return '';
}

function getExplorerUrl(token: BatchTokenEntry): string {
  // This would need to be enhanced based on the actual network
  // For now, return a placeholder
  if (token.transactionId) {
    // Determine chain based on standard
    const standard = token.request.standard;
    if (standard === 'ERC20') {
      return `https://etherscan.io/tx/${token.transactionId}`;
    } else {
      return `https://algoexplorer.io/tx/${token.transactionId}`;
    }
  }
  return '#';
}

function handleClose() {
  if (!isDeploying.value) {
    emit('close');
  }
}
</script>
