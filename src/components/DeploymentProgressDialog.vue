<template>
  <Modal :show="isOpen" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="headerIconClass"
        >
          <i :class="headerIcon"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ headerTitle }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ headerSubtitle }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Progress Steps -->
      <div class="space-y-3">
        <!-- Step 1: Preparing Transaction -->
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center"
              :class="getStepStatusClass('preparing')"
            >
              <i v-if="currentStep === 'preparing'" class="pi pi-spin pi-spinner text-xs"></i>
              <i v-else-if="isStepComplete('preparing')" class="pi pi-check text-xs"></i>
              <span v-else class="text-xs font-semibold">1</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Preparing Transaction</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Validating token parameters and generating transaction</p>
          </div>
        </div>

        <!-- Step 2: Waiting for Wallet -->
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center"
              :class="getStepStatusClass('signing')"
            >
              <i v-if="currentStep === 'signing'" class="pi pi-spin pi-spinner text-xs"></i>
              <i v-else-if="isStepComplete('signing')" class="pi pi-check text-xs"></i>
              <span v-else class="text-xs font-semibold">2</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Waiting for Wallet Signature</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ currentStep === 'signing' ? 'Please approve the transaction in your wallet' : 'Wallet signature required' }}
            </p>
            <div v-if="currentStep === 'signing'" class="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p class="text-xs text-blue-400">
                <i class="pi pi-info-circle mr-1"></i>
                Check your wallet app for the signature request
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3: Submitting to Network -->
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center"
              :class="getStepStatusClass('submitting')"
            >
              <i v-if="currentStep === 'submitting'" class="pi pi-spin pi-spinner text-xs"></i>
              <i v-else-if="isStepComplete('submitting')" class="pi pi-check text-xs"></i>
              <span v-else class="text-xs font-semibold">3</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Submitting to Network</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Broadcasting transaction to blockchain</p>
          </div>
        </div>

        <!-- Step 4: Confirming Transaction -->
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center"
              :class="getStepStatusClass('confirming')"
            >
              <i v-if="currentStep === 'confirming'" class="pi pi-spin pi-spinner text-xs"></i>
              <i v-else-if="isStepComplete('confirming')" class="pi pi-check text-xs"></i>
              <span v-else class="text-xs font-semibold">4</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Confirming Transaction</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ currentStep === 'confirming' ? 'Waiting for network confirmation...' : 'Transaction confirmation pending' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="status === 'success'" class="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
        <div class="flex items-start gap-3">
          <i class="pi pi-check-circle text-green-400 text-2xl"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold text-green-400 mb-1">Token Deployed Successfully!</p>
            <p class="text-xs text-gray-300">Your token has been deployed to the blockchain</p>
            <div v-if="transactionId" class="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
              <p class="text-xs text-gray-400 mb-1">Transaction ID:</p>
              <div class="flex items-center gap-2">
                <code class="text-xs text-gray-300 font-mono truncate flex-1">{{ transactionId }}</code>
                <button
                  @click="copyTransactionId"
                  class="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                  title="Copy transaction ID"
                >
                  <i class="pi pi-copy text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="status === 'error'" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-times-circle text-red-400 text-2xl"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-400 mb-1">Deployment Failed</p>
            <p class="text-xs text-gray-300 mb-3">{{ errorMessage || 'An error occurred during deployment' }}</p>
            
            <!-- Error Recovery Options -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-gray-300">Troubleshooting:</p>
              <ul class="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                <li v-if="errorType === 'insufficient_funds'">Ensure you have sufficient funds to cover transaction fees</li>
                <li v-if="errorType === 'wallet_rejected'">The transaction was rejected in your wallet. Please try again.</li>
                <li v-if="errorType === 'network_error'">Network connection issue. Check your internet and try again.</li>
                <li v-if="errorType === 'timeout'">The transaction timed out. It may still be processing on the network.</li>
                <li v-if="!errorType || errorType === 'unknown'">Try refreshing the page and attempting the deployment again</li>
                <li>Verify your wallet is connected to the correct network</li>
                <li>Check that you have network connectivity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Processing Indicator -->
      <div v-if="status === 'processing'" class="text-center py-4">
        <div class="inline-flex items-center justify-center gap-3 px-6 py-3 bg-biatec-accent/10 border border-biatec-accent/30 rounded-lg">
          <i class="pi pi-spin pi-spinner text-biatec-accent text-xl"></i>
          <div class="text-left">
            <p class="text-sm font-semibold text-white">{{ processingMessage }}</p>
            <p class="text-xs text-gray-400">This may take a few moments...</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          v-if="status === 'error'"
          @click="handleRetry"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <i class="pi pi-refresh"></i>
          <span>Retry Deployment</span>
        </button>
        <button
          v-if="status === 'success' || status === 'error'"
          @click="handleClose"
          class="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-biatec-accent to-purple-600 rounded-lg hover:shadow-lg hover:shadow-biatec-accent/30 transition-all flex items-center gap-2"
        >
          <i class="pi pi-check"></i>
          <span>{{ status === 'success' ? 'Done' : 'Close' }}</span>
        </button>
        <button
          v-if="status === 'processing' && canCancel"
          @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Modal from './ui/Modal.vue';

type DeploymentStep = 'preparing' | 'signing' | 'submitting' | 'confirming';
type DeploymentStatus = 'processing' | 'success' | 'error';
type ErrorType = 'insufficient_funds' | 'wallet_rejected' | 'network_error' | 'timeout' | 'unknown';

interface Props {
  isOpen: boolean;
  currentStep: DeploymentStep;
  status: DeploymentStatus;
  errorMessage?: string;
  errorType?: ErrorType;
  transactionId?: string;
  canCancel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canCancel: false,
});

const emit = defineEmits<{
  close: [];
  retry: [];
  cancel: [];
}>();

const stepOrder: DeploymentStep[] = ['preparing', 'signing', 'submitting', 'confirming'];

const isStepComplete = (step: DeploymentStep): boolean => {
  if (props.status === 'success') return true;
  if (props.status === 'error') return false;
  const currentIndex = stepOrder.indexOf(props.currentStep);
  const stepIndex = stepOrder.indexOf(step);
  return stepIndex < currentIndex;
};

const getStepStatusClass = (step: DeploymentStep): string => {
  if (props.currentStep === step) {
    return 'bg-biatec-accent text-white border-2 border-biatec-accent';
  }
  if (isStepComplete(step)) {
    return 'bg-green-500 text-white border-2 border-green-500';
  }
  return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600';
};

const headerTitle = computed(() => {
  if (props.status === 'success') return 'Deployment Complete';
  if (props.status === 'error') return 'Deployment Failed';
  return 'Deploying Token';
});

const headerSubtitle = computed(() => {
  if (props.status === 'success') return 'Your token is now on the blockchain';
  if (props.status === 'error') return 'Something went wrong';
  return 'Please wait while we process your deployment';
});

const headerIcon = computed(() => {
  if (props.status === 'success') return 'pi pi-check-circle text-2xl';
  if (props.status === 'error') return 'pi pi-times-circle text-2xl';
  return 'pi pi-spin pi-spinner text-2xl';
});

const headerIconClass = computed(() => {
  if (props.status === 'success') return 'bg-green-500/20 text-green-400';
  if (props.status === 'error') return 'bg-red-500/20 text-red-400';
  return 'bg-biatec-accent/20 text-biatec-accent';
});

const processingMessage = computed(() => {
  switch (props.currentStep) {
    case 'preparing':
      return 'Preparing transaction...';
    case 'signing':
      return 'Waiting for wallet signature...';
    case 'submitting':
      return 'Submitting to network...';
    case 'confirming':
      return 'Confirming transaction...';
    default:
      return 'Processing...';
  }
});

const handleClose = () => {
  emit('close');
};

const handleRetry = () => {
  emit('retry');
};

const handleCancel = () => {
  emit('cancel');
};

const copyTransactionId = async () => {
  if (props.transactionId) {
    try {
      await navigator.clipboard.writeText(props.transactionId);
      // Could emit event for toast notification
    } catch (error) {
      console.error('Failed to copy transaction ID:', error);
    }
  }
};
</script>
