<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            Batch Token Deployment
          </h1>
          <p class="text-gray-600 dark:text-gray-300 text-lg">
            Deploy multiple tokens in a single operation
          </p>
        </div>

        <!-- Main Content -->
        <div>
          <!-- Batch Configuration Header -->
          <div class="glass-effect rounded-xl p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                  Configure Token Batch
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add up to {{ maxBatchSize }} tokens to deploy together
                </p>
              </div>
              <Badge :variant="tokens.length >= minBatchSize ? 'success' : 'default'">
                {{ tokens.length }} / {{ maxBatchSize }} tokens
              </Badge>
            </div>

            <!-- Batch Name and Description (Optional) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Name (Optional)
                </label>
                <input
                  v-model="batchName"
                  type="text"
                  placeholder="e.g., Q1 2024 Token Launch"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Description (Optional)
                </label>
                <input
                  v-model="batchDescription"
                  type="text"
                  placeholder="Brief description of this batch..."
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
                />
              </div>
            </div>
          </div>

          <!-- Validation Errors Banner -->
          <div
            v-if="showValidation && !isValidBatch"
            class="mb-6 p-4 bg-red-500 dark:bg-red-600 border border-red-600 dark:border-red-700 rounded-lg shadow-lg"
            role="alert"
          >
            <div class="flex items-start gap-3">
              <i class="pi pi-exclamation-triangle text-white text-xl mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm font-semibold text-white mb-2">Batch Validation Errors:</p>
                <ul class="space-y-1">
                  <li v-for="error in batchValidation?.errors" :key="error.code" class="text-sm text-white">
                    • {{ error.message }}
                  </li>
                </ul>
              </div>
              <button
                @click="showValidation = false"
                class="text-white hover:text-red-200 transition-colors"
                aria-label="Dismiss error"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <!-- Validation Warnings -->
          <div
            v-if="batchValidation && batchValidation.warnings.length > 0"
            class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <i class="pi pi-info-circle text-yellow-600 dark:text-yellow-400 text-xl mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</p>
                <ul class="space-y-1">
                  <li v-for="warning in batchValidation.warnings" :key="warning.code" class="text-sm text-yellow-700 dark:text-yellow-300">
                    • {{ warning.message }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Token Entries -->
          <div class="space-y-4 mb-6">
            <BatchTokenEntryForm
              v-for="(token, index) in tokens"
              :key="index"
              :index="index"
              :token="token"
              :walletAddress="authStore.user?.address ?? ''"
              @update:token="updateToken(index, $event)"
              @remove="removeToken(index)"
            />
          </div>

          <!-- Add Token Button -->
          <div class="mb-8">
            <button
              @click="addToken"
              :disabled="tokens.length >= maxBatchSize"
              class="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-biatec-accent dark:hover:border-biatec-accent rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div class="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-biatec-accent">
                <i class="pi pi-plus-circle text-xl"></i>
                <span class="font-medium">Add Another Token</span>
              </div>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between gap-4">
            <button
              @click="goBack"
              class="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>

            <div class="flex gap-3">
              <button
                @click="validateBatch"
                :disabled="tokens.length < minBatchSize || isValidating"
                class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i class="pi" :class="isValidating ? 'pi-spinner animate-spin' : 'pi-check-circle'"></i>
                Validate Batch
              </button>

              <button
                @click="createAndDeploy"
                :disabled="!canDeploy"
                class="px-6 py-3 bg-biatec-accent hover:bg-biatec-accent-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i class="pi" :class="isCreating ? 'pi-spinner animate-spin' : 'pi-send'"></i>
                Deploy Batch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Progress Dialog -->
    <BatchProgressDialog
      v-if="batchSummary"
      :isOpen="showProgressDialog"
      :tokens="currentBatch?.tokens || []"
      :summary="batchSummary"
      @close="handleProgressClose"
      @retry-token="retryToken"
      @retry-all="retryAllFailed"
      @export-audit="exportAudit"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../layout/MainLayout.vue';
import Badge from '../components/ui/Badge.vue';
import BatchTokenEntryForm from '../components/BatchTokenEntryForm.vue';
import BatchProgressDialog from '../components/BatchProgressDialog.vue';
import { useBatchDeployment } from '../composables/useBatchDeployment';
import { validateBatchDeployment, MAX_BATCH_SIZE, MIN_BATCH_SIZE } from '../utils/batchValidation';
import type { TokenDeploymentRequest } from '../types/api';
import type { BatchValidationResult } from '../types/batch';

const router = useRouter();
const authStore = useAuthStore();

// Batch deployment composable
const {
  currentBatch,
  batchSummary,
  isCreating,
  isDeploying,
  createBatch,
  startDeployment,
  retryFailedTokens,
  downloadAudit,
  reset,
} = useBatchDeployment();

// Local state
const tokens = ref<Partial<TokenDeploymentRequest>[]>([]);
const batchName = ref('');
const batchDescription = ref('');
const showProgressDialog = ref(false);
const showValidation = ref(false);
const isValidating = ref(false);
const batchValidation = ref<BatchValidationResult | null>(null);

// Constants
const maxBatchSize = MAX_BATCH_SIZE;
const minBatchSize = MIN_BATCH_SIZE;

// Computed
const isValidBatch = computed(() => {
  return batchValidation.value?.valid === true;
});

const canDeploy = computed(() => {
  return (
    tokens.value.length >= minBatchSize &&
    tokens.value.length <= maxBatchSize &&
    !isCreating.value &&
    !isDeploying.value
  );
});

// Methods
function addToken() {
  if (tokens.value.length < maxBatchSize) {
    tokens.value.push({} as Partial<TokenDeploymentRequest>);
  }
}

function removeToken(index: number) {
  tokens.value.splice(index, 1);
  // Revalidate if we were showing validation
  if (showValidation.value) {
    validateBatch();
  }
}

function updateToken(index: number, token: Partial<TokenDeploymentRequest>) {
  tokens.value[index] = token;
  // Clear validation when making changes
  if (showValidation.value) {
    showValidation.value = false;
  }
}

function validateBatch() {
  isValidating.value = true;
  showValidation.value = false;

  try {
    // Filter out incomplete tokens for validation
    const completeTokens = tokens.value.filter(
      t => t.standard && t.name
    ) as TokenDeploymentRequest[];

    if (completeTokens.length !== tokens.value.length) {
      batchValidation.value = {
        valid: false,
        errors: [{
          code: 'INCOMPLETE_TOKENS',
          message: 'All tokens must have at least a standard and name configured',
        }],
        warnings: [],
      };
    } else {
      batchValidation.value = validateBatchDeployment(completeTokens);
    }

    showValidation.value = true;
  } finally {
    isValidating.value = false;
  }
}

async function createAndDeploy() {
  // Validate first
  validateBatch();

  if (!batchValidation.value?.valid) {
    showValidation.value = true;
    return;
  }

  // Create batch
  const success = await createBatch({
    name: batchName.value || undefined,
    description: batchDescription.value || undefined,
    walletAddress: authStore.user?.address ?? '',
    tokens: tokens.value as TokenDeploymentRequest[],
  });

  if (!success) {
    showValidation.value = true;
    return;
  }

  // Show progress dialog
  showProgressDialog.value = true;

  // Start deployment
  await startDeployment();
}

function handleProgressClose() {
  showProgressDialog.value = false;
}

async function retryToken(tokenId: string) {
  await retryFailedTokens([tokenId]);
}

async function retryAllFailed() {
  await retryFailedTokens();
}

async function exportAudit() {
  await downloadAudit('csv');
}

function goBack() {
  router.push('/create');
}

// Initialize with one empty token
addToken();

// Cleanup on unmount
onUnmounted(() => {
  reset();
});
</script>
