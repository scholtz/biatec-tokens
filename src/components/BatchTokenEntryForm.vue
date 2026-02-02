<template>
  <div class="glass-effect rounded-xl p-6 mb-4 border border-gray-300 dark:border-gray-600">
    <!-- Header with delete button -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Token {{ index + 1 }}
        <span v-if="localToken.name" class="text-sm font-normal text-gray-600 dark:text-gray-400">
          - {{ localToken.name }}
        </span>
      </h3>
      <button
        @click="$emit('remove')"
        class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        aria-label="Remove token"
      >
        <i class="pi pi-trash text-lg"></i>
      </button>
    </div>

    <!-- Token Standard Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Token Standard *
      </label>
      <select
        v-model="localToken.standard"
        @change="handleStandardChange"
        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
      >
        <option value="">Select a standard...</option>
        <option value="ERC20">ERC20 (EVM - Fungible Token)</option>
        <option value="ARC3">ARC3 (Algorand - NFT)</option>
        <option value="ARC200">ARC200 (Algorand - Fungible Token)</option>
        <option value="ARC1400">ARC1400 (Algorand - Security Token)</option>
      </select>
    </div>

    <!-- Common Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- Token Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Token Name *
        </label>
        <input
          v-model="localToken.name"
          type="text"
          placeholder="e.g., My Token"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>

      <!-- Symbol / Unit Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ isARC3 ? 'Unit Name' : 'Symbol' }} *
        </label>
        <input
          v-model="symbolOrUnitName"
          type="text"
          :placeholder="isARC3 ? 'e.g., NFTX' : 'e.g., MTK'"
          maxlength="8"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>
    </div>

    <!-- Supply and Decimals -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" v-if="!isARC3">
      <!-- Total Supply -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Total Supply *
        </label>
        <input
          v-model="totalSupply"
          type="text"
          placeholder="e.g., 1000000"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>

      <!-- Decimals -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Decimals *
        </label>
        <input
          v-model.number="localToken.decimals"
          type="number"
          :min="0"
          :max="isERC20 ? 18 : 19"
          placeholder="e.g., 18"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>
    </div>

    <!-- ARC3 specific fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" v-if="isARC3">
      <!-- Total -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Total Units *
        </label>
        <input
          v-model.number="arc3Total"
          type="number"
          min="1"
          placeholder="e.g., 1"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>

      <!-- Decimals -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Decimals
        </label>
        <input
          v-model.number="localToken.decimals"
          type="number"
          min="0"
          placeholder="0 for NFT"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
        />
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Description
      </label>
      <textarea
        v-model="localToken.description"
        rows="2"
        placeholder="Optional description of the token..."
        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent"
      ></textarea>
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        Validation Errors:
      </p>
      <ul class="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
        <li v-for="(error, idx) in validationErrors" :key="idx">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TokenDeploymentRequest } from '../types/api';
import { TokenStandard } from '../types/api';
import { validateTokenDeploymentRequest } from '../types/api';

interface Props {
  index: number;
  token: Partial<TokenDeploymentRequest>;
  walletAddress: string;
}

interface Emits {
  (e: 'update:token', value: Partial<TokenDeploymentRequest>): void;
  (e: 'remove'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local token state
const localToken = ref<Partial<TokenDeploymentRequest>>({ ...props.token });

// Computed helpers
const isERC20 = computed(() => localToken.value.standard === TokenStandard.ERC20);
const isARC3 = computed(() => localToken.value.standard === TokenStandard.ARC3);
const isARC200 = computed(() => localToken.value.standard === TokenStandard.ARC200);

// Symbol or unit name (depends on standard)
const symbolOrUnitName = computed({
  get: () => {
    if (isARC3.value && 'unitName' in localToken.value) {
      return localToken.value.unitName || '';
    }
    if ('symbol' in localToken.value) {
      return localToken.value.symbol || '';
    }
    return '';
  },
  set: (value: string) => {
    if (isARC3.value) {
      (localToken.value as any).unitName = value;
    } else {
      (localToken.value as any).symbol = value;
    }
  },
});

// Total supply (string for ERC20/ARC200)
const totalSupply = computed({
  get: () => {
    if ('totalSupply' in localToken.value) {
      return localToken.value.totalSupply || '';
    }
    return '';
  },
  set: (value: string) => {
    (localToken.value as any).totalSupply = value;
  },
});

// ARC3 total
const arc3Total = computed({
  get: () => {
    if (isARC3.value && 'total' in localToken.value) {
      return localToken.value.total || 1;
    }
    return 1;
  },
  set: (value: number) => {
    (localToken.value as any).total = value;
  },
});

// Validation
const validationErrors = ref<string[]>([]);

function validateToken() {
  // Ensure wallet address is set
  localToken.value.walletAddress = props.walletAddress;

  // Only validate if we have a standard
  if (!localToken.value.standard) {
    validationErrors.value = [];
    return;
  }

  try {
    const result = validateTokenDeploymentRequest(localToken.value as TokenDeploymentRequest);
    validationErrors.value = result.valid ? [] : result.errors;
  } catch (error) {
    // Token might not be fully formed yet
    validationErrors.value = [];
  }
}

// Handle standard change
function handleStandardChange() {
  // Reset fields that don't apply to new standard
  const { standard, name, description, walletAddress } = localToken.value;
  
  localToken.value = {
    standard,
    name: name || '',
    description,
    walletAddress,
    decimals: isERC20.value ? 18 : isARC200.value ? 6 : 0,
  } as Partial<TokenDeploymentRequest>;

  validateToken();
}

// Watch for changes and emit updates
watch(
  localToken,
  (newValue) => {
    validateToken();
    emit('update:token', newValue);
  },
  { deep: true }
);

// Watch wallet address changes from parent
watch(
  () => props.walletAddress,
  (newAddress) => {
    localToken.value.walletAddress = newAddress;
    validateToken();
  }
);

// Initial validation
validateToken();
</script>
